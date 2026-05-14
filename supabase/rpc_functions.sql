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
