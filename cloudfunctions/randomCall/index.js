const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { type, data } = event;
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  switch (type) {
    case 'startRandomCall':
      return await startRandomCall(data);
    case 'startNewSession':
      return await startNewSession(data, openId);
    case 'saveCallResult':
      return await saveCallResult(data, openId);
    case 'getSessionRecords':
      return await getSessionRecords(data);
    default:
      return { success: false, errMsg: '未知操作类型' };
  }
};

// 生成唯一 sessionId
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 开始新一轮点名（生成新的 sessionId）
async function startNewSession(data, openId) {
  try {
    const sessionId = generateSessionId();
    return { success: true, data: { sessionId } };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

// 随机点名（排除本轮已点的学生）
async function startRandomCall(data) {
  try {
    const { classId, sessionId } = data;

    // 获取本轮已点过的学生 ID
    const calledRes = await db.collection('call_records')
      .where({ classId, sessionId })
      .field({ studentId: true })
      .get();
    const calledIds = calledRes.data.map(r => r.studentId);

    // 获取所有学生
    const allStudents = await db.collection('students')
      .where({ classId })
      .get();

    // 过滤出未点过的学生
    const availableStudents = allStudents.data.filter(s => !calledIds.includes(s._id));

    if (availableStudents.length === 0) {
      return { success: false, errMsg: '本轮所有学生都已点过', allCalled: true };
    }

    const randomIndex = Math.floor(Math.random() * availableStudents.length);
    return { success: true, data: availableStudents[randomIndex], remaining: availableStudents.length };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

// 保存点名结果
async function saveCallResult(data, openId) {
  try {
    const res = await db.collection('call_records').add({
      data: {
        classId: data.classId,
        sessionId: data.sessionId,
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

// 获取某 session 的记录
async function getSessionRecords(data) {
  try {
    const res = await db.collection('call_records')
      .where({ sessionId: data.sessionId })
      .orderBy('callTime', 'asc')
      .get();
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}
