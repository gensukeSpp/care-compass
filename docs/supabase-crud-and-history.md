# Implementation Plan: Supabase CRUD and Note History

## TL;DR
付箋（Sticky Note）の管理を LocalStorage から Supabase DB へ完全に移行し、状態変更の履歴を `note_history` テーブルで永続化します。これにより、マルチデバイスでの同期と詳細な変更トラッキングを実現します。

---

## 1. データベース設計 (Database Schema)

### `sticky_notes` テーブル
- `id`: uuid (Primary Key, DEFAULT gen_random_uuid())
- `profile_id`: uuid (Foreign Key -> profiles.id, ON DELETE CASCADE)
- `title`: text (NOT NULL)
- `content`: text (Markdown)
- `category`: text (NOT NULL) -- house, food, health, medical, social
- `status`: text (NOT NULL)   -- can, cannot, risk, request, pending
- `x`: numeric (NOT NULL, DEFAULT 0) -- percentage
- `y`: numeric (NOT NULL, DEFAULT 0) -- percentage
- `author_id`: uuid (Foreign Key -> auth.users.id)
- `google_task_id`: text (Optional)
- `created_at`: timestamptz (DEFAULT now())
- `updated_at`: timestamptz (DEFAULT now())

### `note_history` テーブル
- `id`: uuid (Primary Key, DEFAULT gen_random_uuid())
- `note_id`: uuid (Foreign Key -> sticky_notes.id, ON DELETE CASCADE)
- `from_status`: text (NOT NULL)
- `to_status`: text (NOT NULL)
- `user_id`: uuid (Foreign Key -> auth.users.id)
- `created_at`: timestamptz (DEFAULT now())

---

## 2. RLS (行単位セキュリティ) 設定

Supabase SQL Editor で以下を実行します。

```sql
-- RLS 有効化
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_history ENABLE ROW LEVEL SECURITY;

-- sticky_notes ポリシー
CREATE POLICY "家族のみ付箋にアクセス可能" ON sticky_notes
  FOR ALL USING (
    profile_id IN (
      SELECT profile_id FROM board_members WHERE user_id = auth.uid()
    )
  );

-- note_history ポリシー
CREATE POLICY "家族のみ履歴にアクセス可能" ON note_history
  FOR SELECT USING (
    note_id IN (
      SELECT id FROM sticky_notes
    )
  );
```

---

## 3. 実装ステップ (Frontend)

### Step 1: 初期データの取得 (Fetch)
- `useStore.ts` に `fetchNotes` アクションを追加し、`currentProfileId` が設定された際、またはボード画面ロード時に付箋データを Supabase から取得するようにします。

### Step 2: 付箋の作成 (Create)
- `addNote`, `addPendingNote` を修正し、`supabase.from('sticky_notes').insert()` を呼び出すように変更します。

### Step 3: 付箋の更新と履歴記録 (Update & History)
- `updateNote`, `updateNoteStatus`, `updateNotePositionAndStatus` を修正します。
- `status` が変更される場合は、`sticky_notes` の更新と `note_history` へのレコード追加を連続して（または RPC を用いて）実行します。

### Step 4: 付箋の削除 (Delete)
- `deleteNote` を修正し、`supabase.from('sticky_notes').delete().eq('id', id)` を実行するように変更します。

### Step 5: LocalStorage 永続化の解除
- `useStore` の `persist` ミドルウェア設定から `notes` と `pendingNotes` を除外します。

---

## 4. 検証ステップ
1. **作成**: 付箋を作成し、Supabase ダッシュボードでレコードが作成されていることを確認。
2. **移動**: 付箋を別の象限へ移動し、`sticky_notes.status` の更新と `note_history` への新規レコード追加を確認。
3. **削除**: 付箋を削除し、DB から消えていること、および関連する `note_history` も消えていることを確認。
4. **同期**: 別のブラウザやアカウント（同一ボードのメンバー）でログインし、データが共有されていることを確認。
