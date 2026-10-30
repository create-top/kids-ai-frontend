import type { CurrentUser } from '@/services/auth';

/**
 * @see https://umijs.org/docs/max/access#access
 *
 * 本阶段不分角色，登录即可访问全部页面。
 */
export default function access(
  initialState: { currentUser?: CurrentUser } | undefined,
) {
  return {
    loggedIn: !!initialState?.currentUser,
  };
}
