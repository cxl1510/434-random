const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { type, data } = event;
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  switch (type) {
    case 'login':
      return await login(openId);
    case 'updateProfile':
      return await updateProfile(data, openId);
    default:
      return { success: false, errMsg: '未知操作类型' };
  }
};

async function login(openId) {
  try {
    const res = await db.collection('users').where({ openId }).get();
    if (res.data.length) {
      return { success: true, data: res.data[0] };
    }
    const addRes = await db.collection('users').add({
      data: {
        openId,
        nickName: '',
        avatarUrl: '',
        role: 'teacher',
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
      },
    });
    return {
      success: true,
      data: {
        _id: addRes._id,
        openId,
        nickName: '',
        avatarUrl: '',
        role: 'teacher',
      },
    };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}

async function updateProfile(data, openId) {
  try {
    const updateData = { updateTime: db.serverDate() };
    if (data.nickName !== undefined) updateData.nickName = data.nickName;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.role !== undefined) updateData.role = data.role;
    await db.collection('users').where({ openId }).update({ data: updateData });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message || e };
  }
}
