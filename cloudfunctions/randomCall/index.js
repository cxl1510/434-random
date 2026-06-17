const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { type, data } = event;
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  switch (type) {
    case 'startRandomCall':
      return await startRandomCall(data);
    case 'saveCallResult':
      return await saveCallResult(data, openId);
    default:
      return { success: false, errMsg: '未知操作类型' };
  }
};

async function startRandomCall(data) {
  try {
    const res = await db.collection('students')
      .where({ classId: data.classId })
      .get();
    if (!res.data.length) {
      return { success: false, errMsg: '该班级暂无学生' };
    }
    const randomIndex = Math.floor(Math.random() * res.data.length);
    const student = res.data[randomIndex];
    return { success: true, data: student };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

async function saveCallResult(data, openId) {
  try {
    const existingRes = await db.collection('call_records')
      .where({ classId: data.classId, studentId: data.studentId })
      .count();
    if (existingRes.total > 0) {
      return { success: false, errMsg: '该学生已有记录' };
    }

    const res = await db.collection('call_records').add({
      data: {
        classId: data.classId,
        studentId: data.studentId,
        studentName: data.studentName,
        callType: data.callType || 'random',
        result: data.result,
        callTime: db.serverDate(),
        creatorOpenId: openId,
      },
    });
    return { success: true, data: { _id: res._id } };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}
