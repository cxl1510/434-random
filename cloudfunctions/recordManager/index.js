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
    case 'getAllSessions':
      return await getAllSessions(openId);
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

// 获取当前用户所有班级的所有 session（按班级分组）
async function getAllSessions(openId) {
  try {
    // 先获取用户所有的班级
    const classRes = await db.collection('classes')
      .where({ memberOpenIds: openId })
      .field({ _id: true, name: true })
      .get();

    if (!classRes.data.length) {
      return { success: true, data: [] };
    }

    const classIds = classRes.data.map(c => c._id);
    const classMap = {};
    classRes.data.forEach(c => { classMap[c._id] = c.name; });

    // 获取所有这些班级的所有记录
    const res = await db.collection('call_records')
      .aggregate()
      .match({ classId: _.in(classIds) })
      .sort({ callTime: 1 })
      .group({
        _id: { sessionId: '$sessionId', classId: '$classId' },
        records: $.push('$$ROOT'),
        count: $.sum(1),
        lastTime: $.last('$callTime'),
        classId: $.first('$classId'),
        sessionId: $.first('$sessionId'),
      })
      .sort({ lastTime: -1 })
      .end();

    // 按 classId 分组
    const classGroups = {};
    res.list.forEach(session => {
      const cid = session.classId;
      if (!classGroups[cid]) {
        classGroups[cid] = { sessions: [], name: classMap[cid] || '未知班级' };
      }
      const firstTime = session.records[0] && session.records[0].callTime ? session.records[0].callTime : session.lastTime;
      const present = session.records.filter(r => r.result === 'present').length;
      const absent = session.records.filter(r => r.result === 'absent').length;
      const leave = session.records.filter(r => r.result === 'leave').length;
      const total = session.count;
      classGroups[cid].sessions.push({
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
      });
    });

    // 按班级排序（按班级中最新一轮的时间排序）
    const result = classRes.data
      .filter(c => classGroups[c._id])
      .map(c => {
        const group = classGroups[c._id];
        return {
          classId: c._id,
          className: c.name,
          sessions: group.sessions,
          totalSessions: group.sessions.length,
        };
      });

    return { success: true, data: result };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}
