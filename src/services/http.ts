import { clearToken, getToken } from '@/utils/token';

/**
 * 两个后端的请求封装：
 * - Jeecg：响应是 { success, message, code, result, timestamp }，令牌放在 X-Access-Token。
 * - Core：响应是 { code, message, data }，code=0 成功，目前没有鉴权。
 *
 * WHY 不用 umi 的 request 插件：两边响应格式不同，插件只有一套 errorConfig，
 * 硬套会让两个后端互相影响；这里用 fetch 各写一个，行为一目了然，也好测试。
 */
export const JEECG_BASE = '/jeecgboot';
export const CORE_BASE = '/kids-ai-core';

export class ApiError extends Error {
  readonly code?: number;
  readonly status?: number;

  constructor(message: string, code?: number, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

type AuthExpiredHandler = () => void;

let authExpiredHandler: AuthExpiredHandler | undefined;

/**
 * 登录过期后要做什么（跳转登录页）由 app.tsx 注册。
 * WHY 注入而不是直接 import history：这个文件要能脱离 umi 单独跑单元测试。
 */
export function setAuthExpiredHandler(handler: AuthExpiredHandler): void {
  authExpiredHandler = handler;
}

function expireAuth(): void {
  clearToken();
  authExpiredHandler?.();
}

interface JeecgResult<T> {
  success?: boolean;
  message?: string;
  code?: number;
  result?: T;
}

interface CoreResult<T> {
  code?: number;
  message?: string;
  data?: T;
}

export function jsonBody(value: unknown): RequestInit {
  return {
    body: JSON.stringify(value),
    headers: { 'Content-Type': 'application/json' },
  };
}

async function send(base: string, path: string, init: RequestInit, headers: Headers) {
  try {
    return await fetch(base + path, { ...init, headers });
  } catch {
    throw new ApiError('网络连接失败，请确认服务已启动');
  }
}

async function readJson<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

export async function jeecgFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) {
    headers.set('X-Access-Token', token);
  }
  const response = await send(JEECG_BASE, path, init, headers);
  const body = await readJson<JeecgResult<T>>(response);

  // Jeecg 令牌失效时 HTTP 状态和 body.code 都是 401
  if (response.status === 401 || body?.code === 401) {
    expireAuth();
    throw new ApiError('登录已过期，请重新登录', 401, 401);
  }
  if (!response.ok || !body || body.success === false) {
    throw new ApiError(
      body?.message || `请求失败（HTTP ${response.status}）`,
      body?.code,
      response.status,
    );
  }
  return body.result as T;
}

export async function coreFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const response = await send(CORE_BASE, path, init, headers);
  const text = await response.text();

  // 个别删除接口成功时可能没有响应体
  if (!text) {
    if (response.ok) {
      return undefined as T;
    }
    throw new ApiError(`请求失败（HTTP ${response.status}）`, undefined, response.status);
  }

  let body: CoreResult<T>;
  try {
    body = JSON.parse(text) as CoreResult<T>;
  } catch {
    throw new ApiError(text.slice(0, 200), undefined, response.status);
  }
  if (!response.ok || (body.code !== undefined && body.code !== 0)) {
    throw new ApiError(
      body.message || `请求失败（HTTP ${response.status}）`,
      body.code,
      response.status,
    );
  }
  return body.data as T;
}