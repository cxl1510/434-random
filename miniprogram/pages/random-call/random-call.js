Page({
  data: {
    classId: '',
    studentList: [],
    currentName: '',
    isRolling: false,
    selectedStudent: null,
    showResult: false,
    rollInterval: null,
    sessionId: '',
    calledCount: 0,
    totalStudents: 0,
    allCalled: false,
    resultOptions: [
      { label: '已到', value: 'present', color: '#34C759' },
      { label: '未到', value: 'absent', color: '#FF3B30' },
      { label: '请假', value: 'leave', color: '#FF9500' },
    ],
  },

  onLoad(options) {
    this.setData({ classId: options.classId });
    this.loadStudentList();
    this.startNewSession();
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
        this.setData({ studentList: list, totalStudents: list.length });
      }
    }).catch(() => {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    });
  },

  // 开始新一轮
  startNewSession() {
    wx.cloud.callFunction({
      name: 'randomCall',
      data: { type: 'startNewSession' },
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({ sessionId: res.result.data.sessionId, calledCount: 0, allCalled: false });
      }
    });
  },

  startRoll() {
    if (this.data.isRolling) return;
    if (this.data.studentList.length === 0) {
      wx.showToast({ title: '暂无学生', icon: 'none' });
      return;
    }
    if (this.data.allCalled) {
      wx.showModal({
        title: '提示',
        content: '本轮所有学生都已点过，是否开始新一轮？',
        confirmText: '新一轮',
        success: (res) => {
          if (res.confirm) {
            this.startNewSession();
            setTimeout(() => {
              this.startRoll();
            }, 500);
          }
        },
      });
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
    // 从云端获取未点过的学生并随机选一个
    wx.cloud.callFunction({
      name: 'randomCall',
      data: {
        type: 'startRandomCall',
        data: { classId: this.data.classId, sessionId: this.data.sessionId },
      },
    }).then(res => {
      this.setData({ isRolling: false, rollInterval: null });
      if (res.result && res.result.success) {
        const student = res.result.data;
        this.setData({
          currentName: student.name,
          selectedStudent: student,
          showResult: true,
          calledCount: this.data.totalStudents - res.result.remaining,
        });
      } else if (res.result && res.result.allCalled) {
        this.setData({ allCalled: true, showResult: false, selectedStudent: null });
        wx.showToast({ title: '本轮全部已点', icon: 'none' });
      } else {
        wx.showToast({ title: res.result?.errMsg || '点名失败', icon: 'none' });
      }
    }).catch(() => {
      this.setData({ isRolling: false, rollInterval: null });
      wx.showToast({ title: '点名失败，请重试', icon: 'none' });
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
          sessionId: this.data.sessionId,
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
        const newCount = this.data.calledCount + 1;
        if (newCount >= this.data.totalStudents) {
          this.setData({ allCalled: true, showResult: false, selectedStudent: null, calledCount: newCount });
          wx.showToast({ title: '本轮点名完成', icon: 'success' });
        } else {
          this.setData({ showResult: false, selectedStudent: null, calledCount: newCount });
        }
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

  startNewSessionBtn() {
    wx.showModal({
      title: '确认',
      content: '确定开始新一轮点名？本轮记录将保留。',
      success: (res) => {
        if (res.confirm) {
          this.startNewSession();
          this.setData({ currentName: '准备就绪' });
          wx.showToast({ title: '已开始新一轮', icon: 'success' });
        }
      },
    });
  },
});
