/** 将当前全局主题写入当前页的 page 样式（CSS 变量） */
function hexToRgb(hex) {
  const h = (hex || '').replace('#', '');
  if (h.length !== 6) return '0, 0, 0';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function applyThemeCssVars() {
  const app = getApp();
  if (!app || !app.getTheme) return;
  const theme = app.getTheme();
  const style = `
    page {
      --theme-primary: ${theme.primary};
      --theme-dark: ${theme.dark};
      --theme-accent: ${theme.accent};
      --theme-text: ${theme.text};
      --theme-light: ${theme.light};
      --theme-gradient: ${theme.gradient};
      --theme-primary-rgb: ${hexToRgb(theme.primary)};
      --theme-accent-rgb: ${hexToRgb(theme.accent)};
      --theme-text-rgb: ${hexToRgb(theme.text)};
    }
  `;
  try {
    wx.setPageStyle({ style });
  } catch (e) {
    /* 低版本基础库无 setPageStyle */
  }
}

module.exports = { applyThemeCssVars, hexToRgb };
