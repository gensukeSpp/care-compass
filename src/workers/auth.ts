/**
 * Google OAuth 2.0 認証を処理する Cloudflare Worker
 */

import jwt from 'jsonwebtoken';

console.log('Worker script loaded');

interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  JWT_SECRET: string; // ⚠️ secretとして設定されている必要がある
  ASSETS: { fetch: typeof fetch };
}

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export default {
  /**
   * フェッチリクエストを処理し、ルーティングを行います。
   * @params
   *  request :Request - 受信したHTTPリクエスト
   *  env :Env - 環境変数とバインディング
   * @return :Promise<Response> HTTPレスポンス
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, ''); // 末尾のスラッシュを削除して正規化
    console.log(`[Worker] Incoming request: ${request.method} ${url.pathname} (normalized: ${path})`);

    // API ルーティング
    if (path === '/api/auth/google') {
      console.log(`[Worker] Redirecting to Google Auth`);
      return handleGoogleAuth(env);
    }
    if (path === '/api/auth/google/callback') {
      console.log(`[Worker] Handling Google Callback`);
      return handleGoogleCallback(request, env);
    }
    if (path === '/api/auth/logout') {
      console.log(`[Worker] Logging out`);
      return handleLogout();
    }
    if (path === '/api/auth/me') {
      console.log(`[Worker] Fetching current user`);
      return handleMe(request, env);
    }

    if (request.method === 'OPTIONS' && path.startsWith('/api/')) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:5173',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // API以外はアセットを返す（フロントエンド）
    if (env.ASSETS) {
      console.log(`[Worker] Serving assets for: ${url.pathname}`);
      return env.ASSETS.fetch(request);
    }

    console.log(`[Worker] Path not found: ${url.pathname}`);
    return new Response('Not Found', { status: 404 });
  }
};

/**
 * Google OAuth 認可 URL へリダイレクトします。
 * @params
 *  env :Env - 環境変数
 * @return :Response リダイレクトレスポンス
 */
function handleGoogleAuth(env: Env): Response {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    client_id: env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      // 'https://www.googleapis.com/auth/keep.readonly', // Keep API利用を想定
    ].join(' '),
    state: 'random_state_string', // 本来は動的に生成しCookie等で検証すべき
  };

  const qs = new URLSearchParams(options).toString();
  return Response.redirect(`${rootUrl}?${qs}`, 302);
}

/**
 * Google からのコールバックを処理し、トークンを取得します。
 * @params
 *  request :Request - コールバックリクエスト
 *  env :Env - 環境変数
 * @return :Promise<Response> リダイレクトレスポンスまたはエラー
 */
async function handleGoogleCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  // console.log(`${import.meta.env.VITE_API_TITLE}`);
  console.log(`${JSON.stringify(env)}`);

  if (!code) {
    return new Response('Code not found', { status: 400 });
  }

  // トークン交換
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await response.json() as GoogleTokens;

  if (tokens.error) {
    return new Response(`Token exchange failed: ${tokens.error_description}`, { status: 500 });
  }

  // ユーザー情報取得
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const user = await userRes.json() as GoogleUser;

  // セッション JWT 作成
  const sessionToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
    env.JWT_SECRET || 'fallback-secret', // ⚠️ JWT_SECRETがない場合のフォールバック（本番ではNG）
    { expiresIn: '7d' }
  );

  // Cookie の設定 (refresh_token と sessionToken)
  const headers = new Headers();
  headers.append('Set-Cookie', `session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

  if (tokens.refresh_token) {
    headers.append('Set-Cookie', `refresh_token=${tokens.refresh_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`);
  }

  headers.append('Location', '/');
  return new Response(null, { status: 302, headers });
}

/**
 * ログアウト処理（Cookieをクリア）を行います。
 * @return :Response ログアウトレスポンス
 */
function handleLogout(): Response {
  const headers = new Headers();
  headers.append('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  headers.append('Set-Cookie', 'refresh_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  headers.append('Location', '/');
  return new Response(null, { status: 302, headers });
}

function createCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
    'credentials': 'include'
  };
}

/**
 * 現在のログインユーザー情報を取得します。
 * @params
 *  request :Request - 認証情報を含むリクエスト
 *  env :Env - 環境変数
 * @return :Promise<Response> ユーザー情報を含むJSONレスポンス
 */
async function handleMe(request: Request, env: Env): Promise<Response> {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return new Response(JSON.stringify({ user: null }), { status: 200, headers: createCorsHeaders(), });

  const sessionMatch = cookie.match(/session=([^;]+)/);
  if (!sessionMatch) return new Response(JSON.stringify({ user: null }), { status: 200, headers: createCorsHeaders(), });

  try {
    const decoded = jwt.verify(sessionMatch[1], env.JWT_SECRET || 'fallback-secret');
    return new Response(JSON.stringify({ user: decoded }), {
      status: 200,
      headers: createCorsHeaders(),
    });
  } catch (_e) {
    return new Response(JSON.stringify({ user: null, error: 'Invalid session' }), { status: 200, headers: createCorsHeaders(), });
  }
}
