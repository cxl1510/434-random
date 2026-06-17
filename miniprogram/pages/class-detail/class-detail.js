Page({
  data: {
    classId: '',
    classInfo: {},
    studentList: [],
    showAddModal: false,
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
});
