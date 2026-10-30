import type { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name 布局默认设置
 */
const Settings: ProLayoutProps & {
  logo?: string;
} = {
  navTheme: 'light',
  colorPrimary: '#1677ff',
  layout: 'mix',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: false,
  title: 'Kids-AI 管理端',
  logo: '/logo.svg',
  iconfontUrl: '',
  token: {},
};

export default Settings;
