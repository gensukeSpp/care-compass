# Plan: Step 1 ボード作成時のオーナー登録実装

## TL;DR
現在のシステムはローカルストレージ中心で、Supabase との連携がまだ実装されていない。
Step 1 では、ユーザーのプロファイル（対象者）作成時に Supabase の `profiles` と `board_members` テーブルにデータを保存し、認証ユーザーをオーナーとして登録する実装を行う。

---

## 不足分・違いの指摘

### 現在の実装状況
1. ✅ Google OAuth 認証: Cloudflare Workers を経由して実装済み
2. ✅ 認証状態管理: `useAuthStore` で currentUser を保存
3. ✅ ボード・ノーツ管理: `useStore` で Zustand + ローカルストレージ
4. ✅ Supabase クライアント設定: 未実装（src/lib/supabase.ts がない）
5. ✅ @supabase/supabase-js パッケージ: 未インストール
6. ✅ Note 型に profile_id: 存在しない
7. ❌ Profile 選択ロジック: ボード作成時に profile_id が割り当てられていない
8. ❌ 複数ユーザー/複数ボード管理: useStore で profile_id ベースの分離がない

### 「家族間アクセス制限について.md」との乖離
| 要件 | 現状 | 必要な修正 |
|------|------|----------|
| **profiles テーブル へのデータ登録** | なし | Supabase クライアント + データベース操作実装 |
| **board_members テーブルへの登録** | なし | オーナー登録ロジック実装 |
| **Note に profile_id 付与** | なし | Note 型に profile_id を追加、useStore を修正 |
| **複数プロファイル管理** | なし | "ボード選択画面" または "プロファイル切り替え機構" が必要 |
| **RLS ポリシーの実装** | なし（DB側は完了） | フロント側は Supabase クライアント経由で自動適用 |

---

## 修正案

### A. Supabase クライアント設定ファイル (src/lib/supabase.ts)
```
内容: 
- supabase クライアントのインスタンス化
- 環境変数から VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY を読み込み
- 認証情報をブラウザの localStorage に保存（Supabase 標準動作）
```

### B. Note 型の拡張
```
修正内容:
- Note interface に profile_id: string を追加
```

### C. useStore の修正（段階的）
```
修正内容:
1. notes を profile_id でグループ化する構造に変更
2. 現在のボード表示時に activeProfileId を管理
3. addNote, updateNote, deleteNote 時に profile_id を自動付与
```

### D. useAuthStore の拡張（Step 1 で必要）
```
修正内容:
1. currentProfileId: string | null を追加
2. currentProfiles: Profile[] を追加（ユーザーがアクセス可能なプロファイル一覧）
3. selectProfile(profileId): void を追加
4. createProfile(name, createdBy): Promise<Profile> を追加
5. checkAuth() 内で、ログイン後に自動で profiles テーブルから該当ユーザーのプロファイルを取得
```

---

## Step 1 実装: ボード作成時の処理（オーナー登録）

### 前提条件
- Supabase プロジェクト作成 ✅
- 3つのテーブル作成 ✅
- RLS ポリシー追加 ✅

### ステップ

#### Step 1-1: Supabase 環境変数設定 
- .env.local に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を追加

#### Step 1-2: パッケージインストール
- `@supabase/supabase-js` をインストール

#### Step 1-3: Supabase クライアント初期化 (src/lib/supabase.ts)
- createClient() を使用してクライアント作成
- localStorage ベースの auth storage を確認

#### Step 1-4: useAuthStore を拡張
- `checkAuth()` に以下ロジックを追加：
  1. Google OAuth 認証確認（既存）
  2. 認証済みユーザーの ID を取得
  3. Supabase の `board_members` テーブルをクエリして、該当ユーザーがアクセス可能なプロファイルを取得
  4. 結果を `currentProfiles` に保存
  5. 最初のプロファイルを `currentProfileId` として自動選択（ボード作成画面で選択させる場合は別途処理）

#### Step 1-5: Profile 作成機能の実装 (createProfile action)
- useAuthStore または新しい useProfileStore に実装：
  1. Supabase の `profiles` テーブルに新規レコード insert
     - `name`: ユーザーが入力した対象者の名前
     - `created_by`: currentUser.id
  2. 同一トランザクション内で `board_members` に insert
     - `profile_id`: 作成した profile の id
     - `user_id`: currentUser.id
     - `role`: 'owner'
  3. エラーハンドリング（トランザクション失敗時）
  4. 成功時に `currentProfiles` を更新

#### Step 1-6: UI 部分（ボード作成画面）
- 新しい CreateProfileModal コンポーネント（または既存の AddNoteForm を活用）
- プロファイル名入力フォーム
- Supabase への登録ボタン
- 成功時に自動でボード画面へ遷移

#### Step 1-7: デフォルトボード対応
- 現在のアプリは "最初のボード" を自動表示
- 複数プロファイル対応の過渡期として：
  - `currentProfileId` がない場合は "Profile を選択してください" メッセージ
  - または最初の Profile を自動選択

---

## 実装順序と依存関係

1. **Step 1-1, 1-2** (並列可能)
   - 環境変数設定 + パッケージインストール

2. **Step 1-3**
   - Supabase クライアント初期化
   - *depends on 1-1, 1-2*

3. **Step 1-4** (並列不可 - useAuthStore 修正)
   - useAuthStore に checkAuth ロジック追加
   - *depends on 1-3*

4. **Step 1-5** (並列不可)
   - useAuthStore に createProfile action 追加
   - *depends on 1-4*

5. **Step 1-6**
   - CreateProfileModal コンポーネント作成
   - *depends on 1-5*

6. **Step 1-7**
   - UI 統合（ボード選択画面 or デフォルト表示）
   - *depends on 1-6*

---

## 対象ファイル

### 修正/作成が必要
- `.env.local` — 環境変数追加
- `package.json` — @supabase/supabase-js 追加（手動またはコマンド）
- `src/lib/supabase.ts` — **新規作成**
- `src/store/useAuthStore.ts` — 修正: checkAuth(), createProfile()
- `src/types/index.ts` — 修正: Note に profile_id 追加、Profile interface 追加
- `src/store/useStore.ts` — 修正: profile_id ベースの管理（段階的）
- `src/components/common/CreateProfileModal.tsx` — **新規作成** または既存フォームを活用

### 参考/確認
- `vite.config.ts` — env変数設定確認
- `src/components/board/BoardPage.tsx` — ボード表示部分と profile 統合ポイント

---

## 検証ステップ

1. **環境変数が正しく読み込まれたか**
   - console.log で VITE_SUPABASE_URL を確認

2. **Supabase クライアントが初期化されたか**
   - supabase.auth.onAuthStateChange() でリッスン可能か確認

3. **Profile 作成時に Supabase に記録されたか**
   - Supabase ダッシュボードの profiles, board_members テーブルで確認

4. **RLS ポリシーが機能するか**
   - 別のユーザーアカウントでログインして、自分のプロファイル以外が見えないことを確認
   - DB のクエリ結果が自動フィルタリングされているか確認

5. **useAuthStore の currentProfiles が自動更新されるか**
   - ログイン→プロファイル作成→ページリロード時に profiles が表示される

---

## 選択肢・判断が必要な点

1. **複数プロファイル管理UI**
   - Option A: プロファイル選択画面を最初に表示（ダッシュボード化）
   - Option B: ヘッダーに "プロファイル切り替えドロップダウン" を追加
   - Option C: 現在のボードには1つのプロファイルのみ表示し、招待ユーザーが複数見える

2. **既存データの マイグレーション**
   - 現在のローカルストレージ notes をどうするか
   - Option A: 初回ログイン時に default profile を自動作成し、既存 notes を紐付け
   - Option B: 手動で "インポート" 機能を提供

3. **Cloudflare Workers との連携**
   - Google OAuth トークンの管理
   - Supabase のセッション管理との協調方法
