# Phase 1: Quadrant Customization - DB & Type Foundation

## Objective
Establish the database schema and TypeScript definitions required to store and handle custom quadrant labels for each board (profile).

## Key Files & Context
- `supabase/rpc_functions.sql`: Update creation RPC and add update RPC.
- `src/types/index.ts`: Update `Profile` interface.
- `src/store/useAuthStore.ts`: Update actions to handle new label fields.

## Implementation Steps

### 1. Database Migration (Supabase)
Modify the `profiles` table and update RPC functions.

```sql
-- 1. profiles テーブルにラベルカラムを追加
ALTER TABLE profiles 
ADD COLUMN can_label text DEFAULT 'できる',
ADD COLUMN cannot_label text DEFAULT 'できない',
ADD COLUMN risk_label text DEFAULT '危険を伴う',
ADD COLUMN request_label text DEFAULT '頼みたい';

-- 2. create_profile_with_owner RPC の更新
CREATE OR REPLACE FUNCTION public.create_profile_with_owner(
  p_name text,
  p_can_label text DEFAULT 'できる',
  p_cannot_label text DEFAULT 'できない',
  p_risk_label text DEFAULT '危険を伴う',
  p_request_label text DEFAULT '頼みたい'
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_profile profiles%rowtype;
BEGIN
  INSERT INTO profiles (name, created_by, can_label, cannot_label, risk_label, request_label)
  VALUES (p_name, auth.uid(), p_can_label, p_cannot_label, p_risk_label, p_request_label)
  RETURNING * INTO new_profile;

  INSERT INTO board_members (profile_id, user_id, role)
  VALUES (new_profile.id, auth.uid(), 'owner');

  RETURN new_profile;
END;
$$;

-- 3. ラベル更新用の RPC 追加
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

  IF v_role <> 'owner' THEN
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
```

### 2. TypeScript Type Update
Update `src/types/index.ts`.

```typescript
export interface Profile {
  id: string;
  name: string;
  created_by: string;
  can_label: string;
  cannot_label: string;
  risk_label: string;
  request_label: string;
  created_at?: string;
  updated_at?: string;
}
```

### 3. Store Update (useAuthStore)
Update `createProfile` action and potentially add `updateProfileLabels`.

## Verification & Testing
- Run SQL in Supabase dashboard and verify table structure.
- Verify `checkAuth` correctly fetches the new label fields in `currentProfiles`.
