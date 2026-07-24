# Implementation Plan: Family Invitation via Link and QR Code

## TL;DR
オーナーが招待リンク（トークン付きURL）またはQRコードを発行し、家族がそれにアクセスしてログインすることで、自動的にボードメンバーとして登録される機能を実装します。メールアドレスの直接入力が不要になり、LINE等での共有が容易になります。

---

## 1. データベース設計 (Supabase)

### `invitations` テーブル (新規)
招待トークンを一時的に保持するテーブル。
- `id`: uuid (Primary Key, DEFAULT gen_random_uuid())
- `profile_id`: uuid (Foreign Key -> profiles.id, ON DELETE CASCADE)
- `token`: text (Unique, DEFAULT encode(gen_random_bytes(16), 'hex'))
- `expires_at`: timestamptz (有効期限、例: 発行から24時間)
- `created_by`: uuid (Foreign Key -> auth.users.id)
- `created_at`: timestamptz (DEFAULT now())

### RLS 設定
- `SELECT`: 誰でも（または認証済みユーザーのみ）トークンが有効か確認するために許可。
- `INSERT`: そのボードの `owner` のみが作成可能。

---

## 2. サーバーサイドロジック (Supabase RPC)

招待を承諾する処理は、安全のため RPC（Stored Procedure）で実装します。

### `accept_invitation(p_token uuid)`
1. `invitations` テーブルから有効な（期限内の）トークンを探す。
2. 見つかった場合、その `profile_id` と現在の実行ユーザー `auth.uid()` を `board_members` テーブルに `role: 'member'` で追加する。
3. 同一人物が既に参加している場合は何もしない（またはエラーを返さない）。
4. 処理成功後、トークンを削除する（使い捨ての場合）か、そのままにする（複数人招待用の場合）。

---

## 3. フロントエンド実装ステップ

### Step 1: 招待リンク生成 UI
- ボード詳細または設定画面に「家族を招待」ボタンを追加。
- クリック時に Supabase にトークンを発行させ、URL を生成。
- URL 例: `https://care-compass.app/join?token=xxxxxxx`
- 「URLをコピー」ボタンと、QRコードを表示。
- QRコード生成ライブラリ: `qrcode.react` を使用。

### Step 2: 参加用ページ (`/join`) の作成
- `token` パラメータを受け取る。
- ユーザーが未ログインの場合、ログイン（Google Auth）を促す。
- ログイン済みの場合、自動的に `accept_invitation` RPC を実行。
- 成功時: 「〇〇さんのボードに参加しました」と表示し、そのボードへ遷移。
- 失敗時: 「このリンクは無効か、有効期限が切れています」と表示。

---

## 4. 検証ステップ
1. **発行**: オーナーが招待リンクを発行し、DB に `invitations` レコードが作成されることを確認。
2. **共有**: 生成された QR コードが正しい URL を含んでいるかスマホでスキャン。
3. **参加（新規ユーザー）**: リンクを踏んでログインし、正常に `board_members` に追加され、ボードが見えるようになることを確認。
4. **制限**: 期限切れトークンや無効なトークンで参加できないことを確認。

---

## 関連ファイル
- `src/pages/JoinPage.tsx` (新規: 招待承諾ページ)
- `src/components/board/InviteModal.tsx` (新規: 招待リンク・QR表示)
- `src/store/useAuthStore.ts` (招待承諾アクション追加)
- `src/App.tsx` (ルート追加)
