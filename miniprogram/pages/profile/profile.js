const app = getApp();

Page({
  data: {
    userInfo: {},
    tempAvatarUrl: '',
    tempNickName: '',
    myClassStats: { created: 0, joined: 0 },
    myRecordCount: 0,
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
    this.loadMyClassStats();
    this.loadMyRecordCount();
  },

  loadMyClassStats() {
    wx.cloud.callFunction({
      name: 'classManager',
      data: { type: 'getClassList' },
    }).then(res => {
      if (res.result && res.result.success) {
        const classes = res.result.data || [];
        wx.cloud.callFunction({ name: 'userManager', data: { type: 'login' } }).then(userRes => {
          const openId = userRes.result && userRes.result.data ? userRes.result.data.openId : '';
          const created = classes.filter(c => c.creatorOpenId === openId).length;
          const joined = classes.length - created;
          this.setData({ myClassStats: { created, joined } });
        }).catch(() => {
          wx.showToast({ title: '加载班级统计失败', icon: 'none' });
        });
      }
    }).catch(() => {
      wx.showToast({ title: '加载班级统计失败', icon: 'none' });
    });
  },

  loadMyRecordCount() {
    wx.cloud.callFunction({
      name: 'recordManager',
      data: { type: 'getMyRecordCount' },
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({ myRecordCount: res.result.data });
      }
    }).catch(() => {
      wx.showToast({ title: '加载记录统计失败', icon: 'none' });
    });
  },

  loadUserInfo() {
    wx.cloud.callFunction({
      name: 'userManager',
      data: { type: 'login' },
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({ userInfo: res.result.data });
      }
    }).catch(() => {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    });
  },

  onChooseAvatar(e) {
    this.setData({ tempAvatarUrl: e.detail.avatarUrl });
  },

  onNicknameInput(e) {
    this.setData({ tempNickName: e.detail.value });
  },

  uploadCustomAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中' });
        wx.cloud.callFunction({
          name: 'userManager',
          data: { type: 'login' },
        }).then(loginRes => {
          const openId = loginRes.result.data.openId || '';
          const cloudPath = `avatars/user_${openId}_${Date.now()}.jpg`;
          return wx.cloud.uploadFile({
            cloudPath,
            filePath: tempFilePath,
          });
        }).then(uploadRes => {
          return wx.cloud.callFunction({
            name: 'userManager',
            data: { type: 'updateProfile', data: { avatarUrl: uploadRes.fileID } },
          });
        }).then(res => {
          wx.hideLoading();
          if (res.result && res.result.success) {
            wx.showToast({ title: '上传成功', icon: 'success' });
            this.loadUserInfo();
          } else {
            wx.showToast({ title: res.result.errMsg || '上传失败', icon: 'none' });
          }
        }).catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        });
      },
    });
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
          }).catch(() => {
            wx.showToast({ title: '切换失败，请重试', icon: 'none' });
          });
        }
      },
    });
  },

  chooseWechatProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const { nickName, avatarUrl } = res.userInfo;
        wx.cloud.callFunction({
          name: 'userManager',
          data: { type: 'updateProfile', data: { nickName, avatarUrl } },
        }).then((result) => {
          if (result.result && result.result.success) {
            wx.showToast({ title: '获取成功', icon: 'success' });
            this.loadUserInfo();
          } else {
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        }).catch(() => {
          wx.showToast({ title: '获取失败', icon: 'none' });
        });
      },
      fail: () => {
        wx.showToast({ title: '授权已取消', icon: 'none' });
      },
    });
  },
});
