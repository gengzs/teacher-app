<script>
/**
 * 教师端应用 - uni-app 入口文件
 * 粉色主题，支持多主题切换
 */

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

export default {
  globalData: {
    openId: '',
    userInfo: null,
    cloudEnv: 'cloud1-7gqabu9mb7db2ae9',
    // 全局数据缓存
    classCache: {},
    detailCache: {},
    homeworkCache: {},
    // 主题相关
    currentTheme: 'pink',
    themes: THEMES,
  },

  onLaunch() {
    // 加载保存的主题
    const savedTheme = uni.getStorageSync('currentTheme');
    if (savedTheme && THEMES[savedTheme]) {
      this.globalData.currentTheme = savedTheme;
    }
    
    // 应用主题样式
    this.applyThemeCssVars();
    
    // 初始化云服务
    // #ifdef MP-WEIXIN
    if (!uni.cloud) {
      console.error('请使用 2.2.3 或以上的基础库');
    } else {
      uni.cloud.init({
        env: this.globalData.cloudEnv,
        traceUser: true,
      });
    }
    // #endif
  },

  onShow() {
    // 更新导航栏颜色
    this.updateNavigationBarColor();
  },

  methods: {
    // 调用云函数
    async callFunction(name, data = {}) {
      try {
        // #ifdef MP-WEIXIN
        const res = await uni.cloud.callFunction({ name, data });
        return res.result || res;
        // #endif
        
        // #ifndef MP-WEIXIN
        // H5/App 等端没有微信云开发运行时，无法直接 uni.cloud.callFunction。
        // 这里返回带 data 的模拟结果，便于本地预览布局；真数据需接 HTTP/云开发 Web SDK。
        console.warn(`[H5/非微信] 云函数模拟: ${name}`, data);
        return this._mockCloudFunctionResult(name, data);
        // #endif
      } catch (err) {
        console.error(`调用云函数 ${name} 失败:`, err);
        return { code: -1, msg: err.message };
      }
    },

    /**
     * 非微信小程序端：云函数不可用时的本地模拟（仅用于 H5 预览界面与流程）
     * 正式上线网页端需：云开发 HTTP 访问、自建后端、或 uniCloud 等
     */
    _mockCloudFunctionResult(name, data = {}) {
      const action = data.action;
      if (name === 'class' && action === 'list') {
        return {
          code: 0,
          data: [
            { _id: 'h5-demo-1', name: '网页预览班（模拟）', studentCount: 0, inviteCode: 'H5DEMO' },
            { _id: 'h5-demo-2', name: '真实数据请在微信小程序查看', studentCount: 0, inviteCode: 'WXONLY' },
          ],
        };
      }
      if (name === 'homework' && action === 'list') {
        return {
          code: 0,
          data: [
            {
              _id: 'h5-hw-1',
              title: '【网页模拟】示例作业',
              className: '网页预览班（模拟）',
              deadline: '—',
              submitCount: 0,
              totalCount: 0,
              type: 'voice',
              status: 'ongoing',
            },
          ],
        };
      }
      return { code: 0, msg: 'success', data: data.defaultData };
    },

    // 显示加载
    showLoading(title = '加载中...') {
      uni.showLoading({ title, mask: true });
    },

    // 隐藏加载
    hideLoading() {
      uni.hideLoading();
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
        uni.setStorageSync('currentTheme', themeId);
        this.applyThemeCssVars();
        this.updateNavigationBarColor();
        return true;
      }
      return false;
    },

    // 应用主题 CSS 变量
    applyThemeCssVars() {
      const theme = THEMES[this.globalData.currentTheme] || THEMES.pink;
      
      // 设置 CSS 变量
      uni.setStorageSync('themeVars', {
        '--theme-primary': theme.primary,
        '--theme-dark': theme.dark,
        '--theme-accent': theme.accent,
        '--theme-text': theme.text,
        '--theme-light': theme.light,
        '--theme-gradient': theme.gradient,
        '--theme-primary-rgb': this.hexToRgb(theme.primary),
        '--theme-text-rgb': this.hexToRgb(theme.text),
      });
    },

    // 更新导航栏颜色
    updateNavigationBarColor() {
      const theme = THEMES[this.globalData.currentTheme] || THEMES.pink;
      uni.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: theme.primary,
      });
    },

    // Hex 转 RGB
    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
      }
      return '0, 0, 0';
    },
  },
};
</script>

<style>
@import './common/main.wxss';
</style>
