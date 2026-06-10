const app = getApp();

Page({
  data: {
    userInfo: {},
    roleOptions: [
      { label: '教师', value: 'teacher' },
      { label: '学生', value: 'student' },
    ],
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    wx.cloud.callFunction({
      name: 'userManager',
      data: { type: 'login' },
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({ userInfo: res.result.data });
      }
    });
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const { nickName, avatarUrl } = res.userInfo;
        wx.cloud.callFunction({
          name: 'userManager',
          data: {
            type: 'updateProfile',
            data: { nickName, avatarUrl },
          },
        }).then(() => {
          this.loadUserInfo();
        });
      },
    });
  },

  changeRole(e) {
    const role = e.currentTarget.dataset.value;
    wx.showModal({
      title: '切换角色',
      content: `确定切换为${role === 'teacher' ? '教师' : '学生'}吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'userManager',
            data: { type: 'updateProfile', data: { role } },
          }).then(() => {
            wx.showToast({ title: '切换成功', icon: 'success' });
            this.loadUserInfo();
          });
        }
      },
    });
  },
});
