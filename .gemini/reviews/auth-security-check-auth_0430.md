# セキュリティレビュー結果: `src/workers/auth.ts`

## 1. CSRF対策 (state token) の検証
- **検証結果**: **概ね良好**
  - `generateStateToken` にて `crypto.randomBytes(32)` を使用した強固なトークン生成が行われています。
  - `auth_state` Cookie を `HttpOnly` で保存し、コールバック時に URL パラメータと厳密に比較しています。
  - 検証成功後に `Max-Age=0` でクリアしています。
- **指摘事項**:
  - `handleGoogleCallback` 内で `auth_state` をクリアする際、常に `Secure` 属性が付与されています。`handleGoogleAuth` では `isLocal` に応じて `Secure` を外していますが、削除時にも同様の考慮をしないと、localhost (HTTP) 環境で Cookie が正しく削除されない可能性があります。

## 2. JWT (Session Token) の安全性
- **検証結果**: **良好**
  - `JWT_SECRET` の存在チェックが行われており、未設定時に処理を中断するガードがあります。
  - `expiresIn: '7d'` と適切な有効期限が設定されています。
  - ペイロードには公開情報（id, email, name, picture）のみが含まれ、機密情報は含まれていません。
- **指摘事項**:
  - `jwt.verify` 時にアルゴリズム（HS256等）を明示的に指定することが推奨されます（`jsonwebtoken` のデフォルト挙動に依存しないため）。

## 3. Cookie の属性設定
- **検証結果**: **要改善**
  - `HttpOnly`, `SameSite=Lax` が適切に設定されています。
- **指摘事項**:
  - **不整合**: `handleGoogleCallback` で `refresh_token` をセットする際、`isLocal` の判定が行われておらず、常に `Secure` が付与されています。これにより、localhost (HTTP) 環境では `refresh_token` が保存されず、トークンの更新機能が動作しない可能性があります。
  - **DRY原則**: `isLocal` に基づく Cookie 属性の文字列生成が各所に散在しており、バグ（属性の付け忘れ）を誘発しやすい状態です。

## 4. エラーハンドリングと情報漏洩
- **検証結果**: **良好**
  - CSRFエラー時に `details` として boolean 値のみを返しており、内部状態の漏洩を防いでいます。
  - Google API からのエラーレスポンス（`tokens.error_description`）をログには出力しつつ、ユーザーには汎用的なメッセージを返しています。

---

## 改善案

### 1. Cookie 属性生成の共通化
属性の生成ロジックを共通化し、不整合を排除します。

```typescript
function getCookieOptions(env: Env, maxAge: number): string {
  const isLocal = env.GOOGLE_REDIRECT_URI?.includes('localhost');
  const base = `HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
  return isLocal ? base : `${base}; Secure`;
}
```

### 2. `handleGoogleCallback` の修正
`refresh_token` と `auth_state` クリア時の属性を修正します。

```typescript
// refresh_token のセット (修正前は常に Secure だった)
if (tokens.refresh_token) {
  headers.append('Set-Cookie', `refresh_token=${tokens.refresh_token}; ${getCookieOptions(env, 30 * 24 * 60 * 60)}`);
}

// auth_state のクリア
headers.append('Set-Cookie', `auth_state=; ${getCookieOptions(env, 0)}`);
```

### 3. JWT 検証時のアルゴリズム指定
明示的な検証を行うことで、アルゴリズム置換攻撃のリスクを低減します。

```typescript
const decoded = jwt.verify(sessionMatch[1], env.JWT_SECRET, { algorithms: ['HS256'] }) as GoogleUser;
```

### 4. CORS設定の考慮
`Access-Control-Allow-Origin` に `env.ALLOW_ORIGIN` を使用していますが、これが `*` の場合、`Access-Control-Allow-Credentials: 'true'` と両立できずブラウザでエラーになります。環境変数で特定のオリジン（`https://...`）が指定されていることを確認してください。
