/**
 * 班级列表（Tab页）
 * - 长按卡片进入拖动模式，上下滑动调整顺序，松手保存
 * - 普通点击直接进入班级详情
 */
const app = getApp();
const CLASSES_ORDER_KEY = 'teacher_classes_order';
const CACHE_KEY = 'class_list_cache';
const CACHE_TTL = 5 * 60 * 1000;
const SWAP_THRESHOLD_PX = 52;

Page({
  behaviors: [require('../../../../behaviors/themeVars')],
  data: {
    classes: [],
    loading: false,
    dragging: false,
    dragIndex: -1,
  },

  onLoad() {
    this._initFromCache();
    this._refreshCloud();
  },

  onShow() {
    this._refreshCloud();
  },

  _initFromCache() {
    try {
      const cached = wx.getStorageSync(CACHE_KEY);
      if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
        const classes = this._applyOrder(cached.data);
        this.setData({ classes });
        this._dataLoaded = true;
      }
    } catch (e) {}
  },

  async _refreshCloud() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'class',
        data: { action: 'list' },
      });

      if (res.result.code === 0) {
        let classes = res.result.data || [];
        wx.setStorageSync(CACHE_KEY, { data: classes, timestamp: Date.now() });
        // 写入全局缓存，供详情页秒开
        classes.forEach(c => { getApp().globalData.classCache[c._id] = c; });
        classes = this._applyOrder(classes);
        if (!this._dataLoaded) {
          this.setData({ classes });
          this._dataLoaded = true;
        } else {
          this.setData({ classes });
        }
      }
    } catch (e) {
      if (!this._dataLoaded) {
        this.setData({
          classes: [
            { _id: '1', name: '三年级一班', studentCount: 28, inviteCode: 'A1234' },
            { _id: '2', name: '三年级二班', studentCount: 30, inviteCode: 'B5678' },
            { _id: '3', name: '四年级一班', studentCount: 26, inviteCode: 'C9012' },
          ],
        });
        this._dataLoaded = true;
      }
    }
  },

  _applyOrder(classes) {
    const savedOrder = wx.getStorageSync(CLASSES_ORDER_KEY) || [];
    if (!savedOrder.length) return classes;
    const orderMap = {};
    savedOrder.forEach((id, i) => { orderMap[id] = i; });
    return [...classes].sort((a, b) => {
      const ai = orderMap[a._id];
      const bi = orderMap[b._id];
      if (ai === undefined) return 1;
      if (bi === undefined) return -1;
      return ai - bi;
    });
  },

  // ========== 普通点击：进入班级详情 ==========
  onClassItemTap(e) {
    if (this.data.dragging) return;
    const classId = e.currentTarget.dataset.id;
    const classData = this.data.classes.find(c => c._id === classId);
    if (classData) getApp().globalData.classCache[classId] = classData;
    wx.navigateTo({ url: `/pages/teacher/class/detail/detail?id=${classId}` });
  },

  // ========== 长按卡片：进入拖动模式 ==========
  onItemLongPress(e) {
    if (this.data.loading || this.data.classes.length < 2) return;
    const index = parseInt(e.currentTarget.dataset.index, 10);
    if (Number.isNaN(index)) return;

    this._lastY = e.detail && e.detail.y !== undefined ? e.detail.y : 0;
    this._accDy = 0;
    this._didSwap = false;

    this.setData({ dragging: true, dragIndex: index });
    wx.vibrateShort({ type: 'medium' });
  },

  // ========== 拖动中滑动：与相邻卡片交换位置 ==========
  onItemTouchMove(e) {
    if (!this.data.dragging) return;

    const touch = e.touches[0];
    const delta = touch.pageY - this._lastY;
    this._lastY = touch.pageY;
    this._accDy += delta;

    let idx = this.data.dragIndex;
    const classes = [...this.data.classes];
    let changed = false;

    while (this._accDy > SWAP_THRESHOLD_PX && idx < classes.length - 1) {
      [classes[idx], classes[idx + 1]] = [classes[idx + 1], classes[idx]];
      idx += 1;
      this._accDy -= SWAP_THRESHOLD_PX;
      changed = true;
    }
    while (this._accDy < -SWAP_THRESHOLD_PX && idx > 0) {
      [classes[idx], classes[idx - 1]] = [classes[idx - 1], classes[idx]];
      idx -= 1;
      this._accDy += SWAP_THRESHOLD_PX;
      changed = true;
    }

    if (changed) {
      this._didSwap = true;
      wx.vibrateShort({ type: 'light' });
      this.setData({ classes, dragIndex: idx });
    }
  },

  // ========== 松手：退出拖动模式并保存顺序 ==========
  onItemTouchEnd() {
    if (this.data.dragging) {
      if (this._didSwap) {
        try {
          const ids = this.data.classes.map(c => c._id);
          wx.setStorageSync(CLASSES_ORDER_KEY, ids);
        } catch (err) {}
      }
      this.setData({ dragging: false, dragIndex: -1 });
    }
    this._didSwap = false;
    this._accDy = 0;
  },

  // ========== 复制邀请码 ==========
  copyInviteCode(e) {
    const code = e.currentTarget.dataset.code;
    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: '已复制邀请码', icon: 'success' }),
    });
  },
});
