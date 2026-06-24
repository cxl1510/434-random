const app = getApp();

Page({
  data: {
    classId: '',
    sessionList: [],
    loading: false,
  },

  onLoad(options) {
    const app = getApp();
    const classId = options.classId || app.globalData.currentClassId;
    this.setData({ classId });
  },

  onShow() {
    if (this.data.classId) {
      this.loadSessions();
    }
  },

  loadSessions() {
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: 'recordManager',
      data: {
        type: 'getSessionsByClass',
        data: { classId: this.data.classId },
      },
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({ sessionList: res.result.data || [] });
      }
    }).catch(() => {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  toggleSession(e) {
    const idx = e.currentTarget.dataset.idx;
    const sessionList = this.data.sessionList.map((item, i) => ({
      ...item,
      expanded: i === idx ? !item.expanded : item.expanded,
    }));
    this.setData({ sessionList });
  },
});
