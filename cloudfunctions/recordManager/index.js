const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

exports.main = async (event, context) => {
  const { type, data } = event;
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  switch (type) {
    case 'getRecordsByClass':
      return await getRecordsByClass(data);
    case 'getRecordsByStudent':
      return await getRecordsByStudent(data);
    case 'getStatistics':
      return await getStatistics(data);
    case 'getMyRecordCount':
      return await getMyRecordCount(openId);
    case 'getSessionsByClass':
      return await getSessionsByClass(data);
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

async function getMyRecordCount(openId) {
  try {
    const res = await db.collection('call_records')
      .where({ creatorOpenId: openId })
      .count();
    return { success: true, data: res.total };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

async function getSessionsByClass(data) {
  try {
    const res = await db.collection('call_records')
      .aggregate()
      .match({ classId: data.classId })
      .sort({ callTime: 1 })
      .group({
        _id: '$sessionId',
        records: $.push('$$ROOT'),
        count: $.sum(1),
        lastTime: $.last('$callTime'),
      })
      .sort({ lastTime: -1 })
      .end();

    const sessions = res.list.map(session => {
      const firstTime = session.records[0] && session.records[0].callTime ? session.records[0].callTime : session.lastTime;
      const present = session.records.filter(r => r.result === 'present').length;
      const absent = session.records.filter(r => r.result === 'absent').length;
      const leave = session.records.filter(r => r.result === 'leave').length;
      const total = session.count;
      return {
        sessionId: session._id,
        records: session.records,
        count: total,
        time: formatTime(firstTime),
        expanded: false,
        statistics: {
          total,
          present,
          absent,
          leave,
          presentRate: total ? ((present / total) * 100).toFixed(1) : 0,
        },
      };
    });

    return { success: true, data: sessions };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

function formatTime(dateObj) {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  const pad = n => n < 10 ? '0' + n : n;
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
