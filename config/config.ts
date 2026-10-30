// https://umijs.org/config/

import { join } from 'node:path';
import { defineConfig } from '@umijs/max';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';

/**
 * 部署时的路径，如果部署在非根目录下，需要改这个变量
 * @doc https://umijs.org/docs/api/config#publicpath
 */
const PUBLIC_PATH: string = '/';

export default defineConfig({
  alias: {
    '@root': join(__dirname, '..'),
  },
  // build 产物带 hash 后缀，避免浏览器缓存旧文件
  hash: true,
  publicPath: PUBLIC_PATH,
  // WHY：压缩时各文件的辅助函数同名会冲突，Umi 的构建检查会直接失败，按提示开启
  esbuildMinifyIIFE: true,
  routes,
  // 只在 max dev 时生效，生产环境要用 Nginx 做同样的转发，见 docs/plans/PHASE-5_DEV_PLAN.md
  proxy: proxy.dev,
  fastRefresh: true,
  // 数据流和权限插件：登录用户存在 initialState 里，access 依赖它
  model: {},
  initialState: {},
  access: {},
  title: defaultSettings.title,
  layout: {
    // 菜单名走 src/locales 里的 menu.*，只提供中文和英文
    locale: true,
    ...defaultSettings,
  },
  locale: {
    default: 'zh-CN',
    antd: true,
    baseNavigator: true,
  },
  antd: {
    appConfig: {},
    configProvider: {
      variant: 'filled',
    },
  },
});
