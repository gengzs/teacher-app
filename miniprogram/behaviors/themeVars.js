const { applyThemeCssVars } = require('../utils/themeCss');

/** 挂到每个 Page 上，onShow 时同步主题 CSS 变量 */
module.exports = Behavior({
  onShow() {
    applyThemeCssVars();
  },
});
