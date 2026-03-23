import { applyThemeCssVars } from '../common/themeCss.js';

/**
 * uni-app 主题 Behavior
 * 挂到每个页面 onShow 时同步主题 CSS 变量
 */
export const themeVarsBehavior = Behavior({
  definitionFilter(defFields) {
    defFields.methods = defFields.methods || {};
    defFields.methods.onShow = function() {
      applyThemeCssVars();
    };
  },
});
