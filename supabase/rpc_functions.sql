CREATE OR REPLACE FUNCTION public.delete_profile_cascade(p_profile_id uuid)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    v_role text;
    v_deleted uuid;
  BEGIN
    -- オーナー確認
    SELECT role INTO v_role FROM board_members
      WHERE profile_id = p_profile_id AND user_id = auth.uid();
  
    IF v_role IS NULL OR v_role <> 'owner' THEN
      RAISE EXCEPTION 'Only owners can delete profiles';
    END IF;
  
    -- 依存データは外部キー制約 (ON DELETE CASCADE) により自動削除されるため、
    -- profiles 本体を削除するのみでよい
    DELETE FROM profiles WHERE id = p_profile_id RETURNING id INTO v_deleted;
  
    RETURN v_deleted;
  END;
  $$;

-- 既存の制約を削除
ALTER TABLE board_members DROP CONSTRAINT board_members_profile_id_fkey;
-- CASCADE 付きで制約を再作成
ALTER TABLE board_members 
ADD CONSTRAINT board_members_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 1. profiles テーブルにラベルカラムを追加 (Migration SQL)
-- ALTER TABLE profiles 
-- ADD COLUMN can_label text DEFAULT 'できる',
-- ADD COLUMN cannot_label text DEFAULT 'できない',
-- ADD COLUMN risk_label text DEFAULT '危険を伴う',
-- ADD COLUMN request_label text DEFAULT '頼みたい';

-- ラベル更新用の RPC 追加
CREATE OR REPLACE FUNCTION public.update_profile_labels(
  p_profile_id uuid,
  p_can_label text,
  p_cannot_label text,
  p_risk_label text,
  p_request_label text
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_profile profiles%rowtype;
  v_role text;
BEGIN
  -- オーナー権限チェック
  SELECT role INTO v_role FROM board_members 
  WHERE profile_id = p_profile_id AND user_id = auth.uid();

  IF v_role IS NULL OR v_role <> 'owner' THEN
    RAISE EXCEPTION 'Only owners can update quadrant labels';
  END IF;

  UPDATE profiles
  SET 
    can_label = p_can_label,
    cannot_label = p_cannot_label,
    risk_label = p_risk_label,
    request_label = p_request_label,
    updated_at = now()
  WHERE id = p_profile_id
  RETURNING * INTO updated_profile;

  RETURN updated_profile;
END;
$$;

-- 招待を受諾するためのRPC関数
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
 RETURNS uuid -- 成功時にプロファイルIDを返す
 LANGUAGE plpgsql
 SECURITY DEFINER -- RLSをバイパスしてメンバーシップを更新するために必要
AS $$
DECLARE
  v_profile_id uuid;
  v_user_id uuid;
BEGIN
  -- 1. 現在のログインユーザーIDを取得
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
	  RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 2. トークンの有効性を確認（存在し、かつ期限内であること）
  SELECT profile_id INTO v_profile_id
    FROM invitations
  WHERE token = p_token AND expires_at > now();

  IF v_profile_id IS NULL THEN
	  RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;

  -- 3. すでにメンバーであるか確認（重複登録防止）
  IF EXISTS (
	  SELECT 1 FROM board_members 
	  WHERE profile_id = v_profile_id AND user_id = v_user_id
  ) THEN
	  -- すでにメンバーの場合は、そのままプロファイルIDを返して成功とみなす
	  RETURN v_profile_id;
  END IF;

  -- 4. メンバーとして登録 (roleは 'member' 固定)
  INSERT INTO board_members (profile_id, user_id, role)
    VALUES (v_profile_id, v_user_id, 'member');

  -- 5. (オプション) トークンを使い捨てにする場合はここで削除
  -- DELETE FROM invitations WHERE token = p_token;

  RETURN v_profile_id;
END;
$$;

-- update_note_position_status: 付箋の位置とステータスを更新し、履歴を記録する
create or replace function public.update_note_position_status(
  note_id uuid,
  moved_x numeric,
  moved_y numeric,
  new_status text
)
returns setof sticky_notes
language plpgsql
security definer
as $$
declare
  nt sticky_notes%rowtype;
begin
  select * into nt from sticky_notes where id = note_id;
  
  if not found then
    raise exception 'note not found: %', note_id;
  end if;

  update sticky_notes
    set x = moved_x,
      y = moved_y,
      updated_at = now(),
      status = new_status
    where id = note_id;

  -- 修正: PL/pgSQL では論理積に 'AND' を使用し、uuid は 'IS NOT NULL' で判定します
  if nt.status <> new_status AND auth.uid() IS NOT NULL then
    insert into note_history (note_id, from_status, to_status, user_id)
      values (note_id, nt.status, new_status, auth.uid());
  end if;

  return query
    select *
    from sticky_notes
    where id = note_id;      
end
$$;

-- pending_to_new_status: 保留ボックスからボードへ移動する際のステータス更新と履歴記録
create or replace function public.pending_to_new_status(
  note_id uuid,
  new_status text
)
returns setof sticky_notes
language plpgsql
security definer
as $$
declare
  nt sticky_notes%rowtype;
begin
  select * into nt from sticky_notes where id = note_id;
  
  if not found then
    raise exception 'note not found: %', note_id;
  end if;

  update sticky_notes
    set status = new_status,
      updated_at = now()
    where id = note_id;

  if nt.status <> new_status AND auth.uid() IS NOT NULL then
    insert into note_history (note_id, from_status, to_status, user_id)
      values (note_id, nt.status, new_status, auth.uid());
  end if;

  return query
    select *
    from sticky_notes
    where id = note_id;
end
$$;

-- merge_sticky_notes: 2つの付箋を統合し、内容をアペンドして元を削除する
create or replace function public.merge_sticky_notes(
  source_id uuid,
  target_id uuid
)
returns setof sticky_notes
language plpgsql
security definer
as $$
declare
  source_note sticky_notes%rowtype;
  target_note sticky_notes%rowtype;
  merged_content text;
begin
  select * into source_note from sticky_notes where id = source_id;
  select * into target_note from sticky_notes where id = target_id;

  if not found then
    raise exception 'source or target note not found';
  end if;

  merged_content := target_note.content || E'\n\n---\n**Merged from: ' || source_note.title || '** (' || now() || E')\n' || source_note.content;

  update sticky_notes
    set content = merged_content,
      updated_at = now()
    where id = target_id;

  delete from sticky_notes where id = source_id;

  return query
    select *
    from sticky_notes
    where id = target_id;
end
$$;

-- 新しい RPC 関数を作成
CREATE OR REPLACE FUNCTION public.create_profile_with_owner(
  p_name text,
  p_can_label text DEFAULT 'できる',
  p_cannot_label text DEFAULT 'できない',
  p_risk_label text DEFAULT '危険を伴う',
  p_request_label text DEFAULT '頼みたい'
)
returns profiles
language plpgsql
security definer
as $$
declare
  new_profile profiles%rowtype;
begin
  -- profiles テーブルに挿入
  insert into profiles (name, created_by, can_label, cannot_label, risk_label, request_label)
  values (p_name, auth.uid(), p_can_label, p_cannot_label, p_risk_label, p_request_label)
  returning * into new_profile;

  -- board_members テーブルにオーナーとして登録
  insert into board_members (profile_id, user_id, role)
  values (new_profile.id, auth.uid(), 'owner');

  -- 作成されたプロファイルを返す
  return new_profile;
end;
$$;

-- get_all_history: 指定されたプロファイルIDの全履歴を取得する
CREATE OR REPLACE FUNCTION public.get_all_history(p_profile_id uuid)
RETURNS TABLE(
  history_id uuid,
  note_id uuid,
  note_title text,
  from_status text,
  to_status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 権限チェック：ユーザーがこのボードのメンバーであること
  IF NOT EXISTS (
    SELECT 1 FROM board_members
    WHERE profile_id = p_profile_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    h.id, h.note_id, n.title, h.from_status, h.to_status, h.created_at
  FROM note_history h
  JOIN sticky_notes n ON h.note_id = n.id
  WHERE n.profile_id = p_profile_id
  ORDER BY h.created_at DESC;
END;
$$;

