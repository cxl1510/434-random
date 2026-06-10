Page({
  data: {
    classId: '',
    studentList: [],
    currentName: '',
    isRolling: false,
    selectedStudent: null,
    showResult: false,
    rollInterval: null,
    resultOptions: [
      { label: '已到', value: 'present', color: '#34C759' },
      { label: '未到', value: 'absent', color: '#FF3B30' },
      { label: '请假', value: 'leave', color: '#FF9500' },
    ],
  },

  onLoad(options) {
    this.setData({ classId: options.classId });
    this.loadStudentList();
  },

  onUnload() {
    if (this.data.rollInterval) {
      clearInterval(this.data.rollInterval);
    }
  },

  loadStudentList() {
    wx.cloud.callFunction({
      name: 'studentManager',
      data: { type: 'getStudentList', data: { classId: this.data.classId } },
    }).then(res => {
      if (res.result && res.result.success) {
        const list = res.result.data || [];
        this.setData({ studentList: list });
        if (list.length) {
          this.setData({ currentName: list[0].name });
        }
      }
    });
  },

  startRoll() {
    if (this.data.isRolling) return;
    if (this.data.studentList.length === 0) {
      wx.showToast({ title: '暂无学生', icon: 'none' });
      return;
    }
    this.setData({ isRolling: true, showResult: false, selectedStudent: null });
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * this.data.studentList.length);
      this.setData({ currentName: this.data.studentList[idx].name });
    }, 80);
    this.setData({ rollInterval: interval });
    setTimeout(() => {
      this.stopRoll();
    }, 2000);
  },

  stopRoll() {
    if (this.data.rollInterval) {
      clearInterval(this.data.rollInterval);
    }
    const idx = Math.floor(Math.random() * this.data.studentList.length);
    const student = this.data.studentList[idx];
    this.setData({
      isRolling: false,
      currentName: student.name,
      selectedStudent: student,
      showResult: true,
      rollInterval: null,
    });
  },

  saveResult(e) {
    const result = e.currentTarget.dataset.value;
    const student = this.data.selectedStudent;
    if (!student) return;
    wx.showLoading({ title: '保存中' });
    wx.cloud.callFunction({
      name: 'randomCall',
      data: {
        type: 'saveCallResult',
        data: {
          classId: this.data.classId,
          studentId: student._id,
          studentName: student.name,
          result,
          callType: 'random',
        },
      },
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '记录已保存', icon: 'success' });
        this.setData({ showResult: false, selectedStudent: null });
      } else {
        wx.showToast({ title: res.result.errMsg || '保存失败', icon: 'none' });
      }
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    });
  },

  reRoll() {
    this.setData({ showResult: false, selectedStudent: null });
    setTimeout(() => {
      this.startRoll();
    }, 200);
  },
});
