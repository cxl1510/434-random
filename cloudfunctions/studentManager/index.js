const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { type, data } = event;
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  switch (type) {
    case 'addStudent':
      return await addStudent(data, openId);
    case 'batchAddStudents':
      return await batchAddStudents(data, openId);
    case 'getStudentList':
      return await getStudentList(data);
    case 'deleteStudent':
      return await deleteStudent(data, openId);
    case 'updateStudent':
      return await updateStudent(data, openId);
    default:
      return { success: false, errMsg: '未知操作类型' };
  }
};

async function addStudent(data, openId) {
  try {
    if (!data.name || !data.name.trim()) {
      return { success: false, errMsg: '学生姓名不能为空' };
    }
    const classRes = await db.collection('classes').doc(data.classId).get();
    if (!classRes.data.memberOpenIds.includes(openId)) {
      return { success: false, errMsg: '您不是该班级成员' };
    }
    const res = await db.collection('students').add({
      data: {
        classId: data.classId,
        name: data.name.trim(),
        avatar: data.avatar || '',
        openId: data.openId || '',
        createTime: db.serverDate(),
      },
    });
    await db.collection('classes').doc(data.classId).update({
      data: { studentsCount: _.inc(1), updateTime: db.serverDate() },
    });
    return { success: true, data: { _id: res._id } };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

async function batchAddStudents(data, openId) {
  try {
    const names = data.names
      .split(/\n|，|,|\s+/)
      .map(n => n.trim())
      .filter(n => n);
    const classRes = await db.collection('classes').doc(data.classId).get();
    if (!classRes.data.memberOpenIds.includes(openId)) {
      return { success: false, errMsg: '您不是该班级成员' };
    }
    const batch = [];
    for (const name of names) {
      batch.push({
        classId: data.classId,
        name,
        avatar: '',
        openId: '',
        createTime: db.serverDate(),
      });
    }
    for (const item of batch) {
      await db.collection('students').add({ data: item });
    }
    await db.collection('classes').doc(data.classId).update({
      data: { studentsCount: _.inc(batch.length), updateTime: db.serverDate() },
    });
    return { success: true, data: { count: batch.length } };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

async function getStudentList(data) {
  try {
    const res = await db.collection('students')
      .where({ classId: data.classId })
      .orderBy('createTime', 'asc')
      .get();
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

async function deleteStudent(data, openId) {
  try {
    const studentRes = await db.collection('students').doc(data.studentId).get();
    const classId = studentRes.data.classId;
    const classRes = await db.collection('classes').doc(classId).get();
    if (!classRes.data.memberOpenIds.includes(openId)) {
      return { success: false, errMsg: '您不是该班级成员' };
    }
    await db.collection('students').doc(data.studentId).remove();
    await db.collection('classes').doc(classId).update({
      data: { studentsCount: _.inc(-1), updateTime: db.serverDate() },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

async function updateStudent(data, openId) {
  try {
    const studentRes = await db.collection('students').doc(data.studentId).get();
    const classId = studentRes.data.classId;
    const classRes = await db.collection('classes').doc(classId).get();
    if (!classRes.data.memberOpenIds.includes(openId)) {
      return { success: false, errMsg: '您不是该班级成员' };
    }
    await db.collection('students').doc(data.studentId).update({
      data: { name: data.name.trim() },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}
