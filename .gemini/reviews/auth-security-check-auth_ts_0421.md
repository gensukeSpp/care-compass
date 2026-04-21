# Security Review: `src/workers/auth.ts`

**Review Date:** 2026-04-21
**Reviewer:** Gemini CLI (Security Specialist)
**Status:** ⚠️ Needs Minor Improvements

---

## 1. CSRF対策 (state token) の検証
- **[PASS]** `state` トークンの生成に `crypto.randomBytes(32)` を使用。
- **[PASS]** `auth_state` Cookie に `HttpOnly`, `Secure`, `SameSite=Lax` を付与。
- **[PASS]** コールバック成功後に `auth_state` をクリア。
- **[ISSUE]** Cookie取得の正規表現が不十分。
  - **現状:** `cookie.match(/auth_state=([^;]+)/)`
  - **リスク:** 別のクッキー（例: `myapp_auth_state`）が存在する場合に誤作動する可能性がある。
  - **修正案:** `/(?:^|; )auth_state=([^;]+)/` を使用する。

## 2. JWT (Session Token) の安全性
- **[PASS]** `JWT_SECRET` を環境変数から取得。
- **[PASS]** 有効期限（7日）が適切に設定されている。
- **[PASS]** ペイロードに不要な機密情報が含まれていない。

## 3. Cookie の属性設定
- **[PASS]** 全ての重要 Cookie に `HttpOnly`, `Secure`, `SameSite=Lax` を適用。
- **[PASS]** `Max-Age` 設定によりセッション期間を管理。

## 4. エラーハンドリングと情報漏洩
- **[LOW RISK]** 認証失敗時に Google API のエラー詳細をそのまま返却している。
- **[LOW RISK]** `handleSyncTasks` で API レスポンスの `details` をそのまま返却している。
  - **リスク:** 攻撃者がシステム内部の構成を推測する手がかりを与える可能性がある。
  - **修正案:** クライアントには一般的なエラーメッセージを返し、詳細なエラーは `console.error` 等で Worker のログに残すようにする。

---

## 5. 推奨されるコード修正

### Cookie パースの厳密化
`handleGoogleCallback` と `handleMe` の正規表現を修正します。

```typescript
// handleGoogleCallback 内
const stateMatch = cookie.match(/(?:^|; )auth_state=([^;]+)/);

// handleMe 内
const sessionMatch = cookie.match(/(?:^|; )session=([^;]+)/);
```

### エラーレスポンスの抽象化
詳細なエラー情報をクライアントに露出させないようにします。

```typescript
// handleGoogleCallback 内
if (tokens.error) {
  console.error(`Token exchange failed: ${tokens.error_description}`);
  return new Response('認証トークンの取得に失敗しました。', { status: 500 });
}

// handleSyncTasks 内
if (!tasksRes.ok) {
  const errorBody = await tasksRes.text();
  console.error(`[Worker] Google Tasks API error (${tasksRes.status}):`, errorBody);
  return new Response(JSON.stringify({
    error: 'Google Tasks の取得に失敗しました。',
  }), {
    status: tasksRes.status,
    headers: createCorsHeaders(env.ALLOW_ORIGIN),
  });
}
```

---

## 結論
基本的な実装は堅牢ですが、Cookie パースの正規表現修正とエラーメッセージの抽象化を行うことで、さらに安全な認証システムになります。
