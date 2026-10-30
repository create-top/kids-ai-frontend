/**
 * Jeecg 登录令牌。
 *
 * WHY：用 localStorage，刷新页面后保持登录；旧的 jeecgboot-vue3 也是这样存。
 * 键名带前缀，避免和同一浏览器里其他本地站点冲突。
 */
const TOKEN_KEY = 'kidsai.jeecg.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
