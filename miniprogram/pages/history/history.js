Page({
  data: {
    classId: '',
    recordList: [],
    statistics: {},
    loading: false,
    pageNum: 1,
    pageSize: 20,
    hasMore: true,
  },

  onLoad(options) {
    const app = getApp();
    const classId = options.classId || app.globalData.currentClassId;
    this.setData({ classId });
  },

  onShow() {
    if (this.data.classId) {
      this.setData({ recordList: [], pageNum: 1, hasMore: true });
      this.loadRecords();
      this.loadStatistics();
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ pageNum: this.data.pageNum + 1 });
      this.loadRecords();
    }
  },

  loadRecords() {
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: 'recordManager',
      data: {
        type: 'getRecordsByClass',
        data: {
          classId: this.data.classId,
          pageNum: this.data.pageNum,
          pageSize: this.data.pageSize,
        },
      },
    }).then(res => {
      if (res.result && res.result.success) {
        const list = res.result.data || [];
        this.setData({
          recordList: this.data.pageNum === 1 ? list : this.data.recordList.concat(list),
          hasMore: list.length === this.data.pageSize,
        });
      }
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  loadStatistics() {
    wx.cloud.callFunction({
      name: 'recordManager',
      data: { type: 'getStatistics', data: { classId: this.data.classId } },
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({ statistics: res.result.data });
      }
    });
  },
});
