/**
 * @name 开发环境代理
 * @description 只在 `max dev` 时生效，build 之后没有代理。
 * 生产环境需要用 Nginx 做同样的转发，并调大上传大小（视频上传用）。
 *
 * 浏览器里只访问两个前缀，和旧的 jeecgboot-vue3 保持一致：
 *   /jeecgboot    -> JeecgBoot 后端（登录、用户身份）
 *   /kids-ai-core -> kids-ai-core（业务接口）
 * 同源访问，Core 不需要配置 CORS。
 */
export default {
  dev: {
    '/jeecgboot/': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      pathRewrite: { '^/jeecgboot': '/jeecg-boot' },
    },
    '/kids-ai-core/': {
      target: 'http://127.0.0.1:8081',
      changeOrigin: true,
      pathRewrite: { '^/kids-ai-core': '' },
    },
  },
};
