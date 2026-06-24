Page({
  data: {
    theme: 'light',
  },

  onLoad() {
    const theme = wx.getStorageSync('theme') || 'light';
    this.setData({ theme });
  },

  switchTheme() {
    const newTheme = this.data.theme === 'light' ? 'dark' : 'light';
    this.setData({ theme: newTheme });
    wx.setStorageSync('theme', newTheme);
    wx.showToast({ title: `已切换为${newTheme === 'light' ? '浅色' : '深色'}主题`, icon: 'success' });
  },

  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有本地缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              wx.showToast({ title: '清除成功', icon: 'success' });
            },
            fail: () => {
              wx.showToast({ title: '清除失败', icon: 'none' });
            },
          });
        }
      },
    });
  },
});
