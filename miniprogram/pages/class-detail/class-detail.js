Page({
  data: {
    classId: '',
    classInfo: {},
    studentList: [],
    showAddModal: false,
    showShareModal: false,
    newStudentName: '',
    batchNames: '',
    addMode: 'single',
    loading: false,
  },

  onLoad(options) {
    this.setData({ classId: options.classId });
    this.loadClassDetail();
    this.loadStudentList();
  },

  onShow() {
    this.loadStudentList();
  },

  loadClassDetail() {
    wx.cloud.callFunction({
      name: 'classManager',
      data: { type: 'getClassDetail', data: { classId: this.data.classId } },
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({ classInfo: res.result.data });
      }
    }).catch(() => {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    });
  },

  loadStudentList() {
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: 'studentManager',
      data: { type: 'getStudentList', data: { classId: this.data.classId } },
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({ studentList: res.result.data || [] });
      }
    }).catch(() => {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  openAddModal() {
    this.setData({ showAddModal: true, newStudentName: '', batchNames: '', addMode: 'single' });
  },

  closeAddModal() {
    this.setData({ showAddModal: false });
  },

  switchAddMode(e) {
    this.setData({ addMode: e.currentTarget.dataset.mode });
  },

  onStudentNameInput(e) {
    this.setData({ newStudentName: e.detail.value });
  },

  onBatchInput(e) {
    this.setData({ batchNames: e.detail.value });
  },

  addStudent() {
    const name = this.data.newStudentName.trim();
    if (!name) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '添加中' });
    wx.cloud.callFunction({
      name: 'studentManager',
      data: { type: 'addStudent', data: { classId: this.data.classId, name } },
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.closeAddModal();
        this.loadStudentList();
        this.loadClassDetail();
      } else {
        wx.showToast({ title: res.result.errMsg || '添加失败', icon: 'none' });
      }
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '添加失败', icon: 'none' });
    });
  },

  batchAddStudents() {
    const names = this.data.batchNames.trim();
    if (!names) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '添加中' });
    wx.cloud.callFunction({
      name: 'studentManager',
      data: { type: 'batchAddStudents', data: { classId: this.data.classId, names } },
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: `成功添加 ${res.result.data.count} 人`, icon: 'success' });
        this.closeAddModal();
        this.loadStudentList();
        this.loadClassDetail();
      } else {
        wx.showToast({ title: res.result.errMsg || '添加失败', icon: 'none' });
      }
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '添加失败', icon: 'none' });
    });
  },

  deleteStudent(e) {
    const studentId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定删除该学生？',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'studentManager',
            data: { type: 'deleteStudent', data: { studentId } },
          }).then(res => {
            if (res.result && res.result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadStudentList();
              this.loadClassDetail();
            } else {
              wx.showToast({ title: res.result.errMsg || '删除失败', icon: 'none' });
            }
          }).catch(() => {
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      },
    });
  },

  goToRandomCall() {
    if (this.data.studentList.length === 0) {
      wx.showToast({ title: '请先添加学生', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/random-call/random-call?classId=${this.data.classId}`,
    });
  },

  goToHistory() {
    const app = getApp();
    app.globalData.currentClassId = this.data.classId;
    wx.switchTab({
      url: '/pages/history/history',
    });
  },

  copyShareCode() {
    const shareCode = this.data.classInfo.shareCode;
    if (!shareCode) return;
    wx.setClipboardData({
      data: shareCode,
      success: () => {
        wx.showToast({ title: '分享码已复制', icon: 'success' });
      },
    });
  },

  shareClass() {
    this.setData({ showShareModal: true });
  },

  closeModals() {
    this.setData({ showAddModal: false, showShareModal: false });
  },

  shareToFriend() {
    wx.showShareMenu({
      withShareTicket: true,
      success: () => {
        wx.showToast({ title: '请点击右上角菜单分享', icon: 'none', duration: 2500 });
      },
    });
  },

  onShareAppMessage() {
    return {
      title: `邀请你加入班级：${this.data.classInfo.name}`,
      path: `/pages/index/index`,
      imageUrl: '',
    };
  },

  uploadStudentAvatar(e) {
    const studentId = e.currentTarget.dataset.id;
    const studentName = e.currentTarget.dataset.name;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中' });
        const cloudPath = `avatars/student_${studentId}_${Date.now()}.jpg`;
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempFilePath,
        }).then(uploadRes => {
          return wx.cloud.callFunction({
            name: 'studentManager',
            data: { type: 'updateStudentAvatar', data: { studentId, fileID: uploadRes.fileID } },
          });
        }).then(res => {
          wx.hideLoading();
          if (res.result && res.result.success) {
            wx.showToast({ title: '上传成功', icon: 'success' });
            this.loadStudentList();
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
});
