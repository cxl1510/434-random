const app = getApp();

Page({
  data: {
    userInfo: {},
    tempAvatarUrl: '',
    tempNickName: '',
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

  onChooseAvatar(e) {
    this.setData({ tempAvatarUrl: e.detail.avatarUrl });
  },

  onNicknameInput(e) {
    this.setData({ tempNickName: e.detail.value });
  },

  saveProfile() {
    const { tempAvatarUrl, tempNickName } = this.data;
    wx.cloud.callFunction({
      name: 'userManager',
      data: { type: 'updateProfile', data: { avatarUrl: tempAvatarUrl, nickName: tempNickName } },
    }).then(res => {
      if (res.result && res.result.success) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        this.setData({ tempAvatarUrl: '', tempNickName: '' });
        this.loadUserInfo();
      } else {
        wx.showToast({ title: res.result.errMsg || '保存失败', icon: 'none' });
      }
    }).catch(() => {
      wx.showToast({ title: '保存失败', icon: 'none' });
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
