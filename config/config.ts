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
    // 菜单名直接写中文，不走多语言
    locale: false,
    ...defaultSettings,
  },
  // WHY：只保留 antd 自带的中文文案（分页、弹窗按钮等），不做多语言切换。
  locale: {
    default: 'zh-CN',
    antd: true,
    baseNavigator: false,
  },
  antd: {
    appConfig: {},
    configProvider: {
      variant: 'filled',
    },
  },
});
