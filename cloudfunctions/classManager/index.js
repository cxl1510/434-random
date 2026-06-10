const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { type, data } = event;
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  switch (type) {
    case 'createClass':
      return await createClass(data, openId);
    case 'getClassList':
      return await getClassList(openId);
    case 'getClassDetail':
      return await getClassDetail(data);
    case 'deleteClass':
      return await deleteClass(data, openId);
    default:
      return { success: false, errMsg: '未知操作类型' };
  }
};

async function createClass(data, openId) {
  try {
    if (!data.name || !data.name.trim()) {
      return { success: false, errMsg: '班级名称不能为空' };
    }
    const res = await db.collection('classes').add({
      data: {
        name: data.name.trim(),
        creatorOpenId: openId,
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        studentsCount: 0,
      },
    });
    return { success: true, data: { _id: res._id } };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

async function getClassList(openId) {
  try {
    const res = await db.collection('classes')
      .where({ creatorOpenId: openId })
      .orderBy('createTime', 'desc')
      .get();
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

async function getClassDetail(data) {
  try {
    const res = await db.collection('classes').doc(data.classId).get();
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

async function deleteClass(data, openId) {
  try {
    const classId = data.classId;
    const classRes = await db.collection('classes').doc(classId).get();
    if (classRes.data.creatorOpenId !== openId) {
      return { success: false, errMsg: '无权限删除该班级' };
    }
    await db.collection('classes').doc(classId).remove();
    const studentsRes = await db.collection('students').where({ classId }).get();
    for (const s of studentsRes.data) {
      await db.collection('students').doc(s._id).remove();
    }
    const recordsRes = await db.collection('call_records').where({ classId }).get();
    for (const r of recordsRes.data) {
      await db.collection('call_records').doc(r._id).remove();
    }
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}
