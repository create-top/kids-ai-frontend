/**
 * @name umi 的路由配置
 * @description 菜单就是这里的路由。新增页面时只改这个文件，不再写 Jeecg 菜单 SQL。
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user/login',
        name: '登录',
        component: './user/login',
      },
      {
        path: '/user',
        redirect: '/user/login',
      },
    ],
  },
  {
    path: '/audio',
    name: '家庭音频',
    icon: 'customerService',
    component: './audio',
  },
  {
    path: '/',
    redirect: '/audio',
  },
  {
    component: './exception/404',
    layout: false,
    path: '/*',
  },
];
