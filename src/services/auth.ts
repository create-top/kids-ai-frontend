import { setToken } from '@/utils/token';
import { jeecgFetch, jsonBody } from './http';

export interface CurrentUser {
  username: string;
  realname?: string;
}

export interface LoginParams {
  username: string;
  password: string;
  captcha: string;
  /** 验证码对应的随机串，取图片和登录时要一致 */
  checkKey: string;
}

interface LoginResult {
  token: string;
  userInfo?: CurrentUser;
}

/** 生成验证码的 key。Jeecg 用它在 Redis 里对应验证码答案。 */
export function newCaptchaKey(): string {
  return `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

/** 返回验证码图片，直接可以放进 <img src>。 */
export function getCaptchaImage(checkKey: string): Promise<string> {
  return jeecgFetch<string>(`/sys/randomImage/${encodeURIComponent(checkKey)}`);
}

export async function login(params: LoginParams): Promise<CurrentUser | undefined> {
  // Jeecg 对密码先尝试 AES 解密，解不开就当明文，所以这里直接发明文。
  const result = await jeecgFetch<LoginResult>('/sys/login', {
    method: 'POST',
    ...jsonBody(params),
  });
  setToken(result.token);
  return result.userInfo;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const result = await jeecgFetch<{ userInfo: CurrentUser }>('/sys/user/getUserInfo');
  return result.userInfo;
}

export function logout(): Promise<unknown> {
  return jeecgFetch('/sys/logout');
}
