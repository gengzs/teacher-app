/**
 * 主题选择页面
 */
const app = getApp();

Page({
  behaviors: [require('../../behaviors/themeVars')],
  data: {
    themes: [],
    currentThemeId: 'pink',
    currentTheme: {},
  },

  onLoad() {
    const currentThemeId = app.globalData.currentTheme || 'pink';

    this.setData({
      currentThemeId: currentThemeId,
      themes: app.getAllThemes(),
    });

    this.updateCurrentTheme();
  },

  onShow() {
    // 更新导航栏颜色
    const theme = app.getTheme();
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: theme.primary,
    });
  },

  updateCurrentTheme() {
    const themeConfig = app.globalData.themes[this.data.currentThemeId];
    if (themeConfig) {
      this.setData({
        currentTheme: themeConfig,
      });
    }
  },

  selectTheme(e) {
    const themeId = e.currentTarget.dataset.theme;
    this.setData({
      currentThemeId: themeId,
    });
    this.updateCurrentTheme();
  },

  confirmTheme() {
    const themeId = this.data.currentThemeId;
    
    // 保存主题
    if (app.switchTheme(themeId)) {
      wx.showToast({
        title: '主题已应用',
        icon: 'success',
        duration: 1500,
      });

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },
});
