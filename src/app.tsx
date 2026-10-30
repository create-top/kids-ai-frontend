import { UserOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { getIntl, history, Link } from '@umijs/max';
import React from 'react';
import {
  AvatarDropdown,
  ErrorBoundary,
  Footer,
  LangDropdown,
  OfflineBanner,
} from '@/components';
import { type CurrentUser, getCurrentUser } from '@/services/auth';
import { setAuthExpiredHandler } from '@/services/http';
import { getToken } from '@/utils/token';
import defaultSettings from '../config/defaultSettings';

const LOGIN_PATH = '/user/login';
const SETTINGS_STORAGE_KEY = 'kidsai.layout.settings';

/** 主题面板改过的项记在本地，刷新后还在。标题和 logo 始终用代码里的默认值。 */
function readSettings(): Partial<LayoutSettings> {
  const fallback = defaultSettings as Partial<LayoutSettings>;
  if (typeof localStorage === 'undefined') {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function writeSettings(settings: Partial<LayoutSettings>) {
  const plain: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (['title', 'logo', 'token', 'iconfontUrl'].includes(key)) {
      continue;
    }
    if (
      value === undefined ||
      typeof value === 'function' ||
      typeof value === 'object'
    ) {
      continue;
    }
    plain[key] = value;
  }
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(plain));
}

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
  settingDrawerOpen?: boolean;
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

  const settings = readSettings();
  if (history.location.pathname === LOGIN_PATH) {
    return {
      fetchUserInfo,
      settings,
      settingDrawerOpen: false,
    };
  }
  const currentUser = await fetchUserInfo();
  if (!currentUser) {
    redirectToLogin();
  }
  return {
    fetchUserInfo,
    currentUser,
    settings,
    settingDrawerOpen: false,
  };
}

// ProLayout 支持的 api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
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
    actionsRender: () => [<LangDropdown key="lang" />],
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
    childrenRender: (children) => (
      <>
        {children}
        <SettingDrawer
          disableUrlParams
          enableDarkTheme
          collapse={initialState?.settingDrawerOpen}
          onCollapseChange={(open) => {
            setInitialState((state) => ({
              ...state,
              settingDrawerOpen: open,
            }));
          }}
          settings={initialState?.settings}
          onSettingChange={(settings) => {
            writeSettings(settings);
            setInitialState((state) => ({
              ...state,
              settings,
            }));
          }}
        />
      </>
    ),
    ...initialState?.settings,
    title: getIntl().formatMessage({ id: 'app.title' }),
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
