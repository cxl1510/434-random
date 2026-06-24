const app = getApp();

Page({
  data: {
    classId: '',
    classList: [],
    loading: false,
  },

  onLoad(options) {
    const app = getApp();
    const classId = options.classId || app.globalData.currentClassId;
    this.setData({ classId });
  },

  onShow() {
    if (this.data.classId) {
      this.loadSessionsByClass();
    } else {
      this.loadAllSessions();
    }
  },

  // 通过 TabBar 进入：加载所有班级的记录
  loadAllSessions() {
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: 'recordManager',
      data: { type: 'getAllSessions' },
    }).then(res => {
      if (res.result && res.result.success) {
        const list = (res.result.data || []).map(item => ({
          ...item,
          expanded: false,
        }));
        this.setData({ classList: list });
      }
    }).catch(() => {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 通过班级详情进入：加载该班级的记录
  loadSessionsByClass() {
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: 'recordManager',
      data: {
        type: 'getSessionsByClass',
        data: { classId: this.data.classId },
      },
    }).then(res => {
      if (res.result && res.result.success) {
        // 模拟单班级的 classList 结构
        const sessions = (res.result.data || []).map(s => ({ ...s, expanded: false }));
        this.setData({
          classList: [{
            classId: this.data.classId,
            className: '',
            sessions,
            totalSessions: sessions.length,
            expanded: true,
          }],
        });
      }
    }).catch(() => {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 展开/收起班级
  toggleClass(e) {
    const idx = e.currentTarget.dataset.idx;
    const classList = this.data.classList.map((item, i) => ({
      ...item,
      expanded: i === idx ? !item.expanded : item.expanded,
    }));
    this.setData({ classList });
  },

  // 展开/收起轮次
  toggleSession(e) {
    const classIdx = e.currentTarget.dataset.classIdx;
    const sessionIdx = e.currentTarget.dataset.sessionIdx;
    const classList = this.data.classList.map((cls, ci) => {
      if (ci === classIdx) {
        const sessions = cls.sessions.map((session, si) => ({
          ...session,
          expanded: si === sessionIdx ? !session.expanded : session.expanded,
        }));
        return { ...cls, sessions };
      }
      return cls;
    });
    this.setData({ classList });
  },
});
