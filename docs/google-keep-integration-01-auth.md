# Implementation Plan: Google Keep Integration - 認証機能

## 概要
React SPA（Care Compass）に Google OAuth 2.0 認証機能を実装し、複数ユーザーによる Google アカウント連携を可能にします。バックエンドは **Cloudflare Workers** で実装し、トークンは **Secure HttpOnly Cookie** で管理します。

## 対応範囲
- ✅ Google OAuth 2.0 認証フロー実装
- ✅ ユーザーセッション管理
- ✅ トークン管理（取得・更新・無効化）
- ✅ 認証状態の Zustand ストア統合
- ❌ Google Keep API 取得（次フェーズで対応）

## ステップ＆工程

### **フェーズ 0: 準備・設定 (手動作業 + コード整備)**

#### Step 0-1: Google Cloud Console でのプロジェクト設定【手動】
**依存関係**: なし（フェーズ 1 の前提条件）

**作業内容**:
1. Google Cloud Console で新規プロジェクト作成（または既存選択）
2. Google+ API を有効化
3. OAuth 2.0 認証情報を作成（OAuth Client ID）
   - アプリケーションタイプ: **ウェブアプリケーション**
   - 認可済みリダイレクト URI: `http://localhost:5173/auth/google/callback`, `https://care-compass.example.com/auth/google/callback` など
4. 以下を記録:
   - **Client ID**
   - **Client Secret**
5. Google Keep API が有効か確認（後続フェーズで必要）

**出力**: 
- `GOOGLE_CLIENT_ID` (文字列)
- `GOOGLE_CLIENT_SECRET` (文字列)
- `GOOGLE_REDIRECT_URI` (複数)

---

#### Step 0-2: 依存関係の追加【フロントエンド】
**依存関係**: Step 0-1

**追加する npm パッケージ**:
```bash
bun add @google-cloud/local-auth
bun add jsonwebtoken
```

**package.json への追加**:
- ~~\`google-auth-library-browser@~1.x\`~~ - Google OAuth クライアント
- `@google-cloud/local-auth`
- `jsonwebtoken@~9.x` - JWT トークンのデコード

---

### **フェーズ 1: バックエンド実装 (Cloudflare Workers)**

#### Step 1-1: wrangler.toml の環境変数設定
**依存関係**: Step 0-1

**変更内容**:

```toml
# wrangler.toml に以下を追加

[env.development]
vars = { GOOGLE_CLIENT_ID = "YOUR_DEV_CLIENT_ID", GOOGLE_REDIRECT_URI = "http://localhost:5173/auth/google/callback" }
# ⚠️ CLIENT_SECRET は、secrets コマンドで設定（ファイルに記載しない）

[env.production]
# vars はビルド時に環境から読み込む
```

**実行コマンド** (ローカル開発):
```bash
wrangler secret put GOOGLE_CLIENT_SECRET --env development
```

**ファイル**: [wrangler.toml](wrangler.toml)

---

#### Step 1-2: .env ファイルの作成（フロントエンド用）
**依存関係**: Step 0-1

**ファイル**: `.env.local` (新規作成、.gitignore に追加)

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:8787
```

**ファイル**: `.env.example` (新規作成、リポジに含める)

```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:8787
```

*依存関係*: Step 0-1

---

#### Step 1-3: Cloudflare Workers の API エンドポイント実装
**依存関係**: Step 1-1

**新規ファイル**: `src/workers/auth.ts` (新規作成)

**実装内容**:
- **GET `/api/auth/google`** - OAuth フロー開始
  - OAuth 認可 URL を生成
  - state パラメータをセッションストレージに保存
  - Google OAuth 認可ページにリダイレクト
  
- **GET `/api/auth/google/callback`** - OAuth コールバック
  - `code` パラメータを受け取る
  - Google Token Endpoint に POST リクエスト → `access_token`, `refresh_token` 取得
  - `refresh_token` は Secure HttpOnly Cookie に保存
  - ユーザー情報を取得 (Google Oauth ID, email, name)
  - フロントエンドにリダイレクト (`/`) + セッション確立
  
- **POST `/api/auth/logout`** - ログアウト
  - Cookie をクリア
  - refresh_token を無効化（オプション）
  
- **GET `/api/auth/me`** - 現在のユーザー情報取得
  - Cookie から refresh_token を検証
  - 有効であればユーザー情報を返す

**参考実装**: 標準的な OAuth 2.0 Authorization Code Flow

*依存関係*: Step 1-1, Step 1-2

---

#### Step 1-4: Cloudflare KV への セッション/トークン保存準備【オプション】
**依存関係**: Step 1-3

**検討事項**:
- Cloudflare KV Store でリフレッシュトークンをキャッシュするか？
- または単に HttpOnly Cookie のみで管理するか？

**推奨**: 本プラン では Cookie のみで管理し、KV Store は不要（シンプル化）

*依存関係*: Step 1-1

---

### **フェーズ 2: フロントエンド実装**

#### Step 2-1: Zustand 認証ストア拡張
**依存関係**: Step 0-2

**新規ファイル**: `src/store/useAuthStore.ts` (新規作成)

**実装内容**:
```typescript
interface AuthState {
  currentUser: {
    id: string;         // Google OAuth ID
    email: string;
    name: string;
    picture?: string;
  } | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;

  // アクション
  login: () => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setError: (error: string | null) => void;
}
```

**保存先**: localStorage に認証状態の簡易情報（フルトークンではなく、ユーザー情報のみ）

*依存関係*: Step 0-2 (package.json 更新)

---

#### Step 2-2: ログインコンポーネント実装
**依存関係**: Step 2-1

**新規ファイル**: `src/components/auth/LoginButton.tsx` (新規作成)

**実装内容**:
- ボタン "Sign in with Google"
- クリック時: `POST /api/auth/google` → リダイレクト処理開始
- styled with Tailwind CSS + Lucide Icons

**配置先**: [src/App.tsx](src/App.tsx) の ヘッダー/ナビゲーション領域

*依存関係*: Step 2-1

---

#### Step 2-3: OAuth コールバック処理（フロントエンド）
**依存関係**: Step 1-3, Step 2-1

**新規ファイル**: `src/pages/AuthCallback.tsx` (新規作成)

**実装内容**:
1. URL パラメータから `code`, `state` を取得
2. バリデーション
3. `GET /api/auth/google/callback?code=xxx&state=xxx` を実行（バックエンド側で処理）
4. レスポンスで認証状態を確認
5. Zustand に ユーザー情報を保存
6. ボード画面へリダイレクト (`/`)

**ルーティング**: `/auth/google/callback` で対応

*依存関係*: Step 1-3, Step 2-1

---

#### Step 2-4: App.tsx における認証フロー統合
**依存関係**: Step 2-1, Step 2-2, Step 2-3

**変更内容**:
- `useEffect` で `useAuthStore.checkAuth()` を実行（初期ロード時）
- `isLoggedIn` に応じて UI を分岐
  - 未認証: ログインボタンのみ表示
  - 認証済み: ボード表示 + ユーザー名 + ログアウトボタン
- エラーハンドリング（トースト表示など）

**ファイル**: [src/App.tsx](src/App.tsx)

*依存関係*: Step 2-1, Step 2-2, Step 2-3

---

#### Step 2-5: ユーザー情報の Note への紐付け
**依存関係**: Step 2-1

**変更内容**:
- Note 作成時に `authorName` を `currentUser.email` または `currentUser.name` で自動設定
- [src/store/useStore.ts](src/store/useStore.ts) の `addNote()` メソッドを更新

**参考**: [src/types/index.ts](src/types/index.ts) に `authorName` は既に定義済み

*依存関係*: Step 2-1

---

### **フェーズ 3: テスト & デバッグ**

#### Step 3-1: ローカルテスト環境でのテスト
**依存関係**: フェーズ 1, フェーズ 2 すべて

**テスト項目**:
1. **ログインフロー**
   - "Sign in with Google" クリック → Google 認可ページに飛ぶ
   - 承認後 → コールバック → ボード表示
   - ユーザー情報表示確認

2. **セッション管理**
   - ページリロード後もログイン状態が維持されるか
   - Cookie の確認 (DevTools → Application → Cookies)

3. **ログアウト**
   - ログアウトボタンで Cookie がクリアされるか
   
4. **複数アカウント**
   - Account A でログイン → ログアウト → Account B でログイン → 正しく切り替わるか

5. **エラーハンドリング**
   - Network エラー時の表示
   - トークン無効化時のリダイレクト

**実行コマンド**:
```bash
bun run dev   # Vite
bun run workers:dev  # Cloudflare Workers ローカル起動（別ターミナル）
```

---

#### Step 3-2: 本番環境への有効性確認
**依存関係**: Step 3-1 完了後

**チェック項目**:
- `wrangler deploy` で Cloudflare Workers へのデプロイ成功
- 本番環境の環境変数が正しく設定されているか
- HTTPS での Cookie の secure フラグ確認
- Google Cloud Console での リダイレクト URI が本番環境に含まれているか

---

## ファイル構成

### 新規作成ファイル
```
src/
├── components/
│   └── auth/
│       ├── LoginButton.tsx          # ログインボタン
│       └── LogoutButton.tsx         # ログアウトボタン
├── pages/
│   └── AuthCallback.tsx             # OAuth コールバック page
├── store/
│   └── useAuthStore.ts              # Zustand 認証ストア
└── workers/
    └── auth.ts                      # Cloudflare Workers API エンドポイント
```

### 更新ファイル
```
.env.local (新規)
.env.example (新規)
.gitignore (更新: .env.local 追加)
wrangler.toml (更新: 環境変数セクション追加)
package.json (更新: 依存関係追加)
src/App.tsx (更新: 認証フロー統合)
src/store/useStore.ts (更新: authorName 紐付けロジック)
src/types/index.ts (確認: authorName 型定義確認)
```

---

## 実装の依存関係 & 並列化

```
Step 0-1 (Google Cloud Console 設定)
├─→ Step 0-2 (npm 依存関係追加) ✅ 並列化可
├─→ Step 1-1 (wrangler.toml 設定) ✅ 並列化可
└─→ Step 1-2 (.env 作成) ✅ 並列化可

Step 0-1 + Step 1-1 + Step 1-2
└─→ Step 1-3 (Workers API エンドポイント)

Step 0-2
├─→ Step 2-1 (useAuthStore)
│   ├─→ Step 2-2 (LoginButton)
│   └─→ Step 2-3 (AuthCallback)
└─→ Step 1-3 との依存も有

Step 1-3 + Step 2-1 + Step 2-2 + Step 2-3
└─→ Step 2-4 (App.tsx 統合)

Step 2-1
└─→ Step 2-5 (Note に authorName 紐付け)

全ステップ完了
└─→ Step 3-1 (ローカル テスト)
└─→ Step 3-2 (本番環境確認)
```

**並列実行可能なステップ**:
- 0-2, 1-1, 1-2 (Step 0-1 の後, 相互依存なし)
- 2-2, 2-3 (Step 2-1 完了後, 相互依存弱)

**ボトルネック**: Step 1-3 (Workers API) と Step 2-4 (App.tsx 統合) は後続が多い

---

## 検証基準

### 機能検証

1. **ログインフロー** ✅ 完了
   - Google OAuth 認可ページへのリダイレクト成功
   - コールバック処理後、ユーザー情報がストアに保存される
   - ボード表示時にユーザー名が表示される

2. **セッション管理** ✅ 完了
   - ページリロード後もログイン状態がチェックされ、新たな API リクエストが不要
   - Cookie に `HttpOnly`, `Secure`, `SameSite` フラグが適用されている

3. **複数ユーザー対応** ✅ 完了
   - アカウント A → ログアウト → アカウント B へのスイッチャー正常動作
   - `authorName` フィールドが各 Note に正しく紐付けられている

4. **エラーハンドリング** ✅ 完了
   - トークン無効時に自動的に再ログイン画面へリダイレクト
   - ネットワークエラー時にユーザーフレンドリーなエラーメッセージ表示

5. **本番環境対応** ✅ 完了
   - Cloudflare Workers への正常なデプロイ
   - 本番環境での HTTPS / Cookie Secure フラグ動作

### コード品質
- TypeScript 型安全性チェック (no `any`)
- ESLint による code lint 通過
- テスト（Vitest）でのカバレッジ確認（推奨 80%+）

---

## 重要な実装上の注意点

1. **Security - CSRF 対策**:
   - OAuth state パラメータは必ず使用
   - CORS 設定を厳格に（Cloudflare Workers での origin チェック）

2. **Token Refresh**:
   - `refresh_token` で自動更新ロジックを実装（expire 直前）
   - `access_token` の有効期限をチェック

3. **Multi-Account Management**:
   - ユーザーが複数のアカウントでログイン/ログアウトする際、Cookie と localStorage は別々に管理
   - Zustand store の `currentUser` は常に単数（同時ログイン不可）

4. **Error Boundaries**:
   - 認証エラーをキャッチして、適切に ログイン画面へリダイレクト

---

## スコープ外（次フェーズ以降）

- ❌ Google Keep API からの Note 取得
- ❌ Google Drive 連携
- ❌ マルチデバイス同期
- ❌ データベース。ーション（認証情報の永続化）
- ❌ 2FA / MFA
- ❌ OAuth スコープの動的再要求

---

## 参考リソース

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Cloudflare Workers で OAuth を実装する](https://developers.cloudflare.com/)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [HttpOnly Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#Secure_and_HttpOnly_cookies)
