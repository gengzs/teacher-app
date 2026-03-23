/**
 * 教师端小程序 - 入口文件
 * 粉色主题，支持多主题切换
 */

const { applyThemeCssVars } = require('./utils/themeCss');

// 预设主题列表
const THEMES = {
  pink: {
    id: 'pink',
    name: '樱花粉',
    primary: '#F9E2E6',
    dark: '#F5D0D8',
    accent: '#C47786',
    text: '#8B6B75',
    light: '#FDF6F8',
    gradient: 'linear-gradient(135deg, #F9E2E6 0%, #F5D0D8 100%)',
  },
  blue: {
    id: 'blue',
    name: '天空蓝',
    primary: '#87CEEB',
    dark: '#6BBFDE',
    accent: '#4A9EC5',
    text: '#2E6B85',
    light: '#E8F4FA',
    gradient: 'linear-gradient(135deg, #87CEEB 0%, #6BBFDE 100%)',
  },
  green: {
    id: 'green',
    name: '抹茶绿',
    primary: '#A8D5A2',
    dark: '#92CC8C',
    accent: '#6BAF70',
    text: '#4A7A52',
    light: '#E8F5E6',
    gradient: 'linear-gradient(135deg, #A8D5A2 0%, #92CC8C 100%)',
  },
  purple: {
    id: 'purple',
    name: '薰衣草',
    primary: '#DDA0DD',
    dark: '#D090D0',
    accent: '#B06AB0',
    text: '#7A4A7A',
    light: '#F5E6F5',
    gradient: 'linear-gradient(135deg, #DDA0DD 0%, #D090D0 100%)',
  },
  orange: {
    id: 'orange',
    name: '活力橙',
    primary: '#FFB366',
    dark: '#FFA54D',
    accent: '#E67E22',
    text: '#8B5A2B',
    light: '#FFF3E6',
    gradient: 'linear-gradient(135deg, #FFB366 0%, #FFA54D 100%)',
  },
};

App({
  globalData: {
    openId: '',
    userInfo: null,
    cloudEnv: 'cloud1-7gqabu9mb7db2ae9',
    // 全局数据缓存，子页面直接读取，跳过云端请求
    classCache: {},      // { [classId]: classData }
    detailCache: {},     // { [classId]: fullDetailData + _ts }
    homeworkCache: {},   // { [homeworkId]: homeworkDetailData }
    // 主题相关
    currentTheme: 'pink',
    themes: THEMES,
  },

  onLaunch() {
    // 加载保存的主题
    const savedTheme = wx.getStorageSync('currentTheme');
    if (savedTheme && THEMES[savedTheme]) {
      this.globalData.currentTheme = savedTheme;
    }
    // 首屏若有页面会由 themeVars behavior 注入；此处尽力同步
    applyThemeCssVars();

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库');
    } else {
      wx.cloud.init({
        env: this.globalData.cloudEnv,
        traceUser: true,
      });
    }
  },

  async callFunction(name, data = {}) {
    try {
      const res = await wx.cloud.callFunction({ name, data });
      return res.result || res;
    } catch (err) {
      console.error(`调用云函数 ${name} 失败:`, err);
      return { code: -1, msg: err.message };
    }
  },

  showLoading(title = '加载中...') {
    wx.showLoading({ title, mask: true });
  },

  hideLoading() {
    wx.hideLoading();
  },

  // 获取当前主题
  getTheme() {
    return THEMES[this.globalData.currentTheme] || THEMES.pink;
  },

  // 获取所有主题
  getAllThemes() {
    return Object.values(THEMES).map(t => ({
      id: t.id,
      name: t.name,
      primary: t.primary,
      gradient: t.gradient,
    }));
  },

  // 切换主题
  switchTheme(themeId) {
    if (THEMES[themeId]) {
      this.globalData.currentTheme = themeId;
      wx.setStorageSync('currentTheme', themeId);
      applyThemeCssVars();
      // 更新导航栏颜色
      const theme = THEMES[themeId];
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: theme.primary,
      });
      return true;
    }
    return false;
  },

});
