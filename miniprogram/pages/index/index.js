const app = getApp();

Page({
  data: {
    classList: [],
    showCreateModal: false,
    className: '',
    showJoinModal: false,
    shareCode: '',
    loading: false,
    userName: '',
  },

  onLoad() {
    this.login();
  },

  onShow() {
    this.loadClassList();
  },

  login() {
    wx.cloud.callFunction({
      name: 'userManager',
      data: { type: 'login' },
    }).then(res => {
      if (res.result && res.result.success) {
        const user = res.result.data;
        this.setData({ userName: user.nickName || '' });
      }
    }).catch(() => {});
  },

  loadClassList() {
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: 'classManager',
      data: { type: 'getClassList' },
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({ classList: res.result.data || [] });
      }
    }).catch(() => {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  openCreateModal() {
    this.setData({ showCreateModal: true, className: '' });
  },

  closeCreateModal() {
    this.setData({ showCreateModal: false });
  },

  onClassNameInput(e) {
    this.setData({ className: e.detail.value });
  },

  createClass() {
    const name = this.data.className.trim();
    if (!name) {
      wx.showToast({ title: '班级名称不能为空', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '创建中' });
    wx.cloud.callFunction({
      name: 'classManager',
      data: { type: 'createClass', data: { name } },
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '创建成功', icon: 'success' });
        this.closeCreateModal();
        this.loadClassList();
      } else {
        wx.showToast({ title: res.result.errMsg || '创建失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '创建失败', icon: 'none' });
    });
  },

  openJoinModal() {
    this.setData({ showJoinModal: true, shareCode: '' });
  },

  closeJoinModal() {
    this.setData({ showJoinModal: false });
  },

  onShareCodeInput(e) {
    this.setData({ shareCode: e.detail.value.toUpperCase() });
  },

  joinClass() {
    const shareCode = this.data.shareCode.trim();
    if (!shareCode) {
      wx.showToast({ title: '请输入分享码', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '加入中' });
    wx.cloud.callFunction({
      name: 'classManager',
      data: { type: 'joinClass', data: { shareCode } },
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '加入成功', icon: 'success' });
        this.closeJoinModal();
        this.loadClassList();
      } else {
        wx.showToast({ title: res.result.errMsg || '加入失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '加入失败', icon: 'none' });
    });
  },

  goToDetail(e) {
    const classId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/class-detail/class-detail?classId=${classId}`,
    });
  },

  deleteClass(e) {
    const classId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后该班级的学生与记录将一并删除，是否继续？',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中' });
          wx.cloud.callFunction({
            name: 'classManager',
            data: { type: 'deleteClass', data: { classId } },
          }).then(res => {
            wx.hideLoading();
            if (res.result && res.result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadClassList();
            } else {
              wx.showToast({ title: res.result.errMsg || '删除失败', icon: 'none' });
            }
          }).catch(() => {
            wx.hideLoading();
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      },
    });
  },
});
