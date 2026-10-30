/**
 * 登录后跳转地址校验，防止开放重定向：只允许同源的、以 / 开头的相对路径。
 */
export function getSafeRedirectUrl(
  redirect: string | null,
  origin: string = window.location.origin,
): string {
  if (!redirect?.startsWith('/')) return '/';
  // 以 // 开头会被浏览器当成协议相对的外部地址
  if (redirect.startsWith('//')) return '/';

  try {
    const parsed = new URL(redirect, origin);
    if (parsed.origin !== origin) return '/';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/';
  }
}
