import { UserOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import React from 'react';
import {
  AvatarDropdown,
  ErrorBoundary,
  Footer,
  OfflineBanner,
} from '@/components';
import { type CurrentUser, getCurrentUser } from '@/services/auth';
import { setAuthExpiredHandler } from '@/services/http';
import { getToken } from '@/utils/token';
import defaultSettings from '../config/defaultSettings';

const LOGIN_PATH = '/user/login';

function redirectToLogin(): void {
  const { pathname, search, hash } = history.location;
  if (pathname === LOGIN_PATH) {
    return;
  }
  history.replace(
    `${LOGIN_PATH}?redirect=${encodeURIComponent(pathname + search + hash)}`,
  );
}

// 令牌失效（HTTP 401）时，由请求封装回调到这里统一跳登录页
setAuthExpiredHandler(redirectToLogin);

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: CurrentUser;
  fetchUserInfo?: () => Promise<CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    if (!getToken()) {
      return undefined;
    }
    try {
      return await getCurrentUser();
    } catch {
      // 令牌失效已由请求封装处理，其他错误按未登录对待
      return undefined;
    }
  };

  if (history.location.pathname === LOGIN_PATH) {
    return {
      fetchUserInfo,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  const currentUser = await fetchUserInfo();
  if (!currentUser) {
    redirectToLogin();
  }
  return {
    fetchUserInfo,
    currentUser,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的 api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  const currentUser = initialState?.currentUser;
  return {
    menuItemRender: (item, dom) => {
      if (item.path) {
        return (
          <Link to={item.path} prefetch>
            {dom}
          </Link>
        );
      }
      return dom;
    },
    avatarProps: {
      icon: <UserOutlined />,
      title: currentUser?.realname || currentUser?.username,
      render: (_, avatarChildren) => (
        <AvatarDropdown>{avatarChildren}</AvatarDropdown>
      ),
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      if (!initialState?.currentUser) {
        redirectToLogin();
      }
    },
    ErrorBoundary,
    ...initialState?.settings,
  };
};

export function rootContainer(container: React.ReactNode) {
  return (
    <>
      <OfflineBanner />
      <ErrorBoundary>{container}</ErrorBoundary>
    </>
  );
}
