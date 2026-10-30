module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // GitHub Desktop 的说明框按整段保存，中文正文不会自动折成 100 字一行
    'body-max-line-length': [0],
  },
};
