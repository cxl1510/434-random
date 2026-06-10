const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

exports.main = async (event, context) => {
  const { type, data } = event;

  switch (type) {
    case 'getRecordsByClass':
      return await getRecordsByClass(data);
    case 'getRecordsByStudent':
      return await getRecordsByStudent(data);
    case 'getStatistics':
      return await getStatistics(data);
    default:
      return { success: false, errMsg: '未知操作类型' };
  }
};

async function getRecordsByClass(data) {
  try {
    let query = db.collection('call_records').where({ classId: data.classId });
    query = query.orderBy('callTime', 'desc');
    if (data.pageSize && data.pageNum) {
      query = query
        .skip((data.pageNum - 1) * data.pageSize)
        .limit(data.pageSize);
    }
    const res = await query.get();
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

async function getRecordsByStudent(data) {
  try {
    const res = await db.collection('call_records')
      .where({ studentId: data.studentId })
      .orderBy('callTime', 'desc')
      .get();
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

async function getStatistics(data) {
  try {
    if (data.classId) {
      const totalRes = await db.collection('call_records')
        .where({ classId: data.classId })
        .count();
      const presentRes = await db.collection('call_records')
        .where({ classId: data.classId, result: 'present' })
        .count();
      const absentRes = await db.collection('call_records')
        .where({ classId: data.classId, result: 'absent' })
        .count();
      const leaveRes = await db.collection('call_records')
        .where({ classId: data.classId, result: 'leave' })
        .count();
      const total = totalRes.total || 0;
      return {
        success: true,
        data: {
          total,
          present: presentRes.total || 0,
          absent: absentRes.total || 0,
          leave: leaveRes.total || 0,
          presentRate: total ? ((presentRes.total / total) * 100).toFixed(1) : 0,
        },
      };
    }
    if (data.studentId) {
      const totalRes = await db.collection('call_records')
        .where({ studentId: data.studentId })
        .count();
      const presentRes = await db.collection('call_records')
        .where({ studentId: data.studentId, result: 'present' })
        .count();
      const total = totalRes.total || 0;
      return {
        success: true,
        data: {
          total,
          present: presentRes.total || 0,
          presentRate: total ? ((presentRes.total / total) * 100).toFixed(1) : 0,
        },
      };
    }
    return { success: false, errMsg: '缺少 classId 或 studentId' };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}
