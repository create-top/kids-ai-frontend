import { LogoutOutlined, SkinOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Spin } from 'antd';
import React, { startTransition } from 'react';
import { logout } from '@/services/auth';
import { useT } from '@/utils/i18n';
import { clearToken } from '@/utils/token';
import HeaderDropdown from '../HeaderDropdown';

type GlobalHeaderRightProps = {
  children?: React.ReactNode;
};

const loginOut = async () => {
  try {
    await logout();
  } catch {
    // 服务端退出失败也要在本地退出，否则用户点了没反应
  }
  clearToken();
  const { search, pathname } = window.location;
  history.replace({
    pathname: '/user/login',
    search: new URLSearchParams({ redirect: pathname + search }).toString(),
  });
};

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({
  children,
}) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const t = useT();
  const menuItems: MenuProps['items'] = [
    {
      key: 'theme',
      icon: <SkinOutlined />,
      label: t('menu.account.theme'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('menu.account.logout'),
    },
  ];

  const onMenuClick: MenuProps['onClick'] = (event) => {
    if (event.key === 'theme') {
      setInitialState((s) => ({ ...s, settingDrawerOpen: true }));
      return;
    }
    if (event.key === 'logout') {
      startTransition(() => {
        setInitialState((s) => ({ ...s, currentUser: undefined }));
      });
      loginOut();
    }
  };

  if (!initialState?.currentUser) {
    return <Spin size="small" />;
  }

  return (
    <HeaderDropdown
      placement="bottomRight"
      menu={{
        selectedKeys: [],
        onClick: onMenuClick,
        items: menuItems,
      }}
      arrow
    >
      {children}
    </HeaderDropdown>
  );
};
