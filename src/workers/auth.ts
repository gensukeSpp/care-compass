/**
 * Google OAuth 2.0 認証を処理する Cloudflare Worker
 */

import jwt from 'jsonwebtoken';
import { randomBytes, randomUUID } from 'crypto';

console.log('Worker script loaded');

interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  ALLOW_ORIGIN: string;
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
    if (path === '/api/tasks/sync') {
      console.log(`[Worker] Syncing Google Tasks`);
      return handleSyncTasks(request, env);
    }

    if (request.method === 'OPTIONS' && path.startsWith('/api/')) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': env.ALLOW_ORIGIN,
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
 * 方法A: 推奨されるトークン生成 (32バイトのランダム値)
 * URLセーフなBase64形式で出力
 */
export const generateStateToken = (): string => {
  // return randomBytes(32).toString('urlsafe').replace(/[=]/g, ''); 
  // ※Node.js 14.18+ / 16.0+ なら 'base64url' が直接使えます
  return randomBytes(32).toString('base64url');
};

/**
 * Google OAuth 認可 URL へリダイレクトします。
 * @params
 *  env :Env - 環境変数
 * @return :Response リダイレクトレスポンス
 */
function handleGoogleAuth(env: Env): Response {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const state = generateStateToken(); // 毎回新しく生成
  const options = {
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    client_id: env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/tasks.readonly', // Tasks API利用を想定
    ].join(' '),
    state: state,
  };

  // const qs = new URLSearchParams(options).toString();
  const qs = new URLSearchParams({ ...options, state }).toString();
  const headers = new Headers();
  headers.append('Location', `${rootUrl}?${qs}`);
  // 一時的なCookieにstateを保存 (有効期限は短くて良い。ここでは10分)
  headers.append('Set-Cookie', `auth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
  // return Response.redirect(`${rootUrl}?${qs}`, 302);
  return new Response(null, { status: 302, headers });
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
  const stateInUrl = url.searchParams.get('state');

  // Cookieから保存されたstateを取得
  const cookie = request.headers.get('Cookie') || '';
  const stateMatch = cookie.match(/(?:^|; )auth_state=([^;]+)/);
  console.log(`State in Cookie: ${stateMatch}`);
  const storedState = stateMatch ? stateMatch[1] : null;

  // 保存しておいたstateと一致するか厳密にチェック
  if (!stateInUrl || !storedState || stateInUrl !== storedState) {
    return new Response('CSRF攻撃の可能性があります。', { status: 403 });
  }

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
    // return new Response(`Token exchange failed: ${tokens.error_description}`, { status: 500 });
    console.error(`Token exchange failed: ${tokens.error_description}`);
    return new Response('認証トークンの取得に失敗しました。', { status: 500 });
  }

  // ユーザー情報取得
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const user = await userRes.json() as GoogleUser;

  // セッション JWT 作成
  if (!env.JWT_SECRET) {
    return new Response('⚠️ JWT_SECRET is not set in environment variables.', { status: 500 });
  }

  const sessionToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Cookie の設定 (refresh_token と sessionToken)
  const headers = new Headers();
  headers.append('Set-Cookie', `session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

  if (tokens.refresh_token) {
    headers.append('Set-Cookie', `refresh_token=${tokens.refresh_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`);
  }

  headers.append('Location', '/');
  // 成功時のレスポンスヘッダーに、auth_state Cookieの削除を追加
  headers.append('Set-Cookie', 'auth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
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

function createCorsHeaders(allow_url: string) {
  return {
    'Access-Control-Allow-Origin': allow_url,
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
    // 'credentials': 'include'
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
  if (!cookie) return new Response(JSON.stringify({ user: null }), { status: 200, headers: createCorsHeaders(env.ALLOW_ORIGIN), });

  const sessionMatch = cookie.match(/(?:^|; )session=([^;]+)/);
  if (!sessionMatch) return new Response(JSON.stringify({ user: null }), { status: 200, headers: createCorsHeaders(env.ALLOW_ORIGIN), });

  try {
    const decoded = jwt.verify(sessionMatch[1], env.JWT_SECRET) as GoogleUser;
    return new Response(JSON.stringify({ user: decoded }), {
      status: 200,
      headers: createCorsHeaders(env.ALLOW_ORIGIN),
    });
  } catch (_e) {
    return new Response(JSON.stringify({ user: null, error: 'Invalid session' }), { status: 200, headers: createCorsHeaders(env.ALLOW_ORIGIN), });
  }
}

/**
 * refresh_token を使って access_token を更新します。
 */
async function refreshAccessToken(refreshToken: string, env: Env): Promise<string | null> {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });

  const tokens = await response.json() as GoogleTokens;
  return tokens.access_token || null;
}

/**
 * Google Tasks を取得して返します。
 */
async function handleSyncTasks(request: Request, env: Env): Promise<Response> {
  const cookie = request.headers.get('Cookie') || '';
  // const refreshMatch = cookie.match(/refresh_token=([^;]+)/);
  // const sessionMatch = cookie.match(/session=([^;]+)/);
  // refresh_token= という文字列が他のクッキー名の一部（例: other_refresh_token）に含まれている場合
  const refreshMatch = cookie.match(/(?:^|; )refresh_token=([^;]+)/);
  const sessionMatch = cookie.match(/(?:^|; )session=([^;]+)/);

  if (!refreshMatch || !sessionMatch) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: createCorsHeaders(env.ALLOW_ORIGIN),
    });
  }

  // セッション有効チェック
  try {
    jwt.verify(sessionMatch[1], env.JWT_SECRET);
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: createCorsHeaders(env.ALLOW_ORIGIN),
    });
  }

  const accessToken = await refreshAccessToken(refreshMatch[1], env);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'Failed to refresh token' }), {
      status: 500,
      headers: createCorsHeaders(env.ALLOW_ORIGIN),
    });
  }

  // Tasks API から取得
  const tasksUrl = 'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false';
  const tasksRes = await fetch(tasksUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!tasksRes.ok) {
    const errorBody = await tasksRes.text();
    console.error(`[Worker] Google Tasks API error (${tasksRes.status}):`, errorBody);
    return new Response(JSON.stringify({
      error: 'Failed to fetch tasks from Google',
      // details: errorBody,
      // status: tasksRes.status
    }), {
      status: tasksRes.status,
      headers: createCorsHeaders(env.ALLOW_ORIGIN),
    });
  }

  const tasksData = await tasksRes.json() as { items?: any[] };
  const tasks = (tasksData.items || []).map((item: any) => ({
    googleTaskId: item.id,
    title: item.title,
    notes: item.notes || '',
    updated: item.updated,
  }));

  return new Response(JSON.stringify({ tasks }), {
    status: 200,
    headers: createCorsHeaders(env.ALLOW_ORIGIN),
  });
}
