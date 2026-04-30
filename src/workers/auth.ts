/**
 * Google OAuth 2.0 認証を処理する Cloudflare Worker
 */

import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

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
    const pathname = url.pathname;
    const normalizedPath = pathname.replace(/\/+$/, '') || '/'; // 末尾のスラッシュを除去、ルートは'/'

    console.log(`[Worker] Incoming request: ${request.method} ${pathname} (normalized: ${normalizedPath})`);

    // API ルーティング (前方一致で判定)
    let response: Response;

    if (normalizedPath.startsWith('/api/') || normalizedPath === '/auth/google/callback') {
      if (normalizedPath === '/api/auth/google') {
        console.log(`[Worker] Handling Google Auth`);
        response = await handleGoogleAuth(env);
      } else if (normalizedPath === '/api/auth/google/callback' || normalizedPath === '/auth/google/callback') {
        console.log(`[Worker] Handling Google Callback`);
        response = await handleGoogleCallback(request, env);
      } else if (normalizedPath === '/api/auth/logout') {
        response = await handleLogout();
      } else if (normalizedPath === '/api/auth/me') {
        response = await handleMe(request, env);
      } else if (normalizedPath === '/api/tasks/lists') {
        response = await handleListTaskLists(request, env);
      } else if (normalizedPath === '/api/tasks/sync' || normalizedPath === '/api/tasks/list-tasks') {
        response = await handleSyncTasks(request, env);
      } else if (request.method === 'OPTIONS') {
        // プリフライトリクエスト
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      } else {
        // 定義されていない API パス
        console.warn(`[Worker] Unhandled API path: ${normalizedPath}`);
        response = new Response(JSON.stringify({ error: 'API route not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else if (env.ASSETS) {
      // API以外はアセットを返す（フロントエンド）
      console.log(`[Worker] Serving assets for: ${pathname}`);
      response = await env.ASSETS.fetch(request);
    } else {
      console.error(`[Worker] Path not handled and ASSETS not available: ${pathname}`);
      response = new Response('Not Found', { status: 404 });
    }

    // すべてのレスポンスに共通の CORS ヘッダーを付与
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', env.ALLOW_ORIGIN || '*');
    newHeaders.set('Access-Control-Allow-Credentials', 'true');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }
};

/**
 * 方法A: 推奨されるトークン生成 (32バイトのランダム値)
 * URLセーフなBase64形式で出力
 */
export const generateStateToken = (): string => {
  return randomBytes(32).toString('base64url');
};

/**
 * Google OAuth 認可 URL へリダイレクトします。
 * @params
 *  env :Env - 環境変数
 * @return :Response リダイレクトレスポンス
 */
async function handleGoogleAuth(env: Env): Promise<Response> {
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

  const qs = new URLSearchParams({ ...options, state }).toString();
  const headers = new Headers();
  headers.append('Location', `${rootUrl}?${qs}`);
  
  // 開発環境（localhost）では Secure 属性を外さないと、HTTP 環境で Cookie が保存されない場合がある
  const isLocal = env.GOOGLE_REDIRECT_URI?.includes('localhost');
  const cookieAttrs = isLocal 
    ? 'HttpOnly; SameSite=Lax; Path=/; Max-Age=600'
    : 'HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600';
  
  headers.append('Set-Cookie', `auth_state=${state}; ${cookieAttrs}`);
  console.log(`[Worker] Setting auth_state cookie. isLocal: ${isLocal}`);
  
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

  const cookie = request.headers.get('Cookie') || '';
  console.log(`[Worker] Received Cookies: ${cookie}`);
  
  const stateMatch = cookie.match(/(?:^|; )auth_state=([^;]+)/);
  const storedState = stateMatch ? stateMatch[1] : null;

  console.log(`[Worker] stateInUrl: ${stateInUrl}, storedState: ${storedState}`);

  if (!stateInUrl || !storedState || stateInUrl !== storedState) {
    console.error(`[Worker] CSRF check failed. stateInUrl: ${stateInUrl}, storedState: ${storedState}`);
    return new Response(JSON.stringify({ 
      error: 'CSRF攻撃の可能性があります。',
      details: { stateInUrl: !!stateInUrl, storedState: !!storedState, match: stateInUrl === storedState }
    }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!code) {
    return new Response(JSON.stringify({ error: 'Code not found' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

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
    console.error(`Token exchange failed: ${tokens.error_description}`);
    return new Response(JSON.stringify({ error: '認証トークンの取得に失敗しました。' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const user = await userRes.json() as GoogleUser;

  if (!env.JWT_SECRET) {
    return new Response(JSON.stringify({ error: '⚠️ JWT_SECRET is not set in environment variables.' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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

  const headers = new Headers();
  headers.append('Set-Cookie', `session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

  if (tokens.refresh_token) {
    headers.append('Set-Cookie', `refresh_token=${tokens.refresh_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`);
  }

  headers.append('Location', '/');
  headers.append('Set-Cookie', 'auth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');

  return new Response(null, { status: 302, headers });
}

/**
 * ログアウト処理（Cookieをクリア）を行います。
 * @return :Promise<Response> ログアウトレスポンス
 */
async function handleLogout(): Promise<Response> {
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
  if (!cookie) return new Response(JSON.stringify({ user: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  const sessionMatch = cookie.match(/(?:^|; )session=([^;]+)/);
  if (!sessionMatch) return new Response(JSON.stringify({ user: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  try {
    const decoded = jwt.verify(sessionMatch[1], env.JWT_SECRET) as GoogleUser;
    return new Response(JSON.stringify({ user: decoded }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ user: null, error: 'Invalid session' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
 * 有効なアクセストークンを取得します。認証エラーの場合は Response を返します。
 */
async function getAccessToken(request: Request, env: Env): Promise<string | Response> {
  const cookie = request.headers.get('Cookie') || '';
  const refreshMatch = cookie.match(/(?:^|; )refresh_token=([^;]+)/);
  const sessionMatch = cookie.match(/(?:^|; )session=([^;]+)/);

  if (!refreshMatch || !sessionMatch) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    jwt.verify(sessionMatch[1], env.JWT_SECRET);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accessToken = await refreshAccessToken(refreshMatch[1], env);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'Failed to refresh token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return accessToken;
}

/**
 * Google Task Lists を取得して返します。
 */
async function handleListTaskLists(request: Request, env: Env): Promise<Response> {
  const authResult = await getAccessToken(request, env);
  if (authResult instanceof Response) return authResult;
  const accessToken = authResult;

  const listsUrl = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists';
  const listsRes = await fetch(listsUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listsRes.ok) {
    const errorBody = await listsRes.text();
    console.error(`[Worker] Google Task Lists API error (${listsRes.status}):`, errorBody);
    return new Response(JSON.stringify({ error: 'Failed to fetch task lists from Google' }), {
      status: listsRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const listsData = await listsRes.json() as { items?: Array<Record<string, unknown>> };
  const taskLists = (listsData.items || []).map((item) => ({
    id: item.id as string,
    title: item.title as string,
    updated: item.updated as string,
  }));

  return new Response(JSON.stringify({ taskLists }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Google Tasks を取得して返します。
 */
async function handleSyncTasks(request: Request, env: Env): Promise<Response> {
  const authResult = await getAccessToken(request, env);
  if (authResult instanceof Response) return authResult;
  const accessToken = authResult;

  const url = new URL(request.url);
  const listId = url.searchParams.get('listId') || '@default';

  const tasksUrl = `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=false`;
  const tasksRes = await fetch(tasksUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!tasksRes.ok) {
    const errorBody = await tasksRes.text();
    console.error(`[Worker] Google Tasks API error (${tasksRes.status}):`, errorBody);
    return new Response(JSON.stringify({
      error: 'Failed to fetch tasks from Google',
    }), {
      status: tasksRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const tasksData = await tasksRes.json() as { items?: Array<Record<string, unknown>> };
  const tasks = (tasksData.items || []).map((item) => ({
    googleTaskId: item.id as string,
    title: item.title as string,
    notes: (item.notes as string) || '',
    updated: item.updated as string,
  }));

  return new Response(JSON.stringify({ tasks }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
