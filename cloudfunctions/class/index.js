/**
 * 班级管理云函数
 * 支持：创建班级、班级列表、班级详情、学生管理、邀请码
 */

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const dbCmd = db.command;
const _ = dbCmd.aggregate;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { action } = event;

  try {
    switch (action) {
      // 班级操作
      case 'create':
        return await createClass(event, wxContext);
      case 'list':
        return await getClassList(event, wxContext);
      case 'detail':
        return await getClassDetail(event, wxContext);
      case 'update':
        return await updateClass(event, wxContext);
      case 'delete':
        return await deleteClass(event, wxContext);

      // 学生操作
      case 'addStudent':
        return await addStudent(event, wxContext);
      case 'addStudentManual':
        return await addStudentManual(event, wxContext);
      case 'removeStudent':
        return await removeStudent(event, wxContext);
      case 'getStudents':
        return await getStudents(event, wxContext);

      // 邀请码操作
      case 'generateInviteCode':
        return await generateInviteCode(event, wxContext);
      case 'joinByInviteCode':
        return await joinByInviteCode(event, wxContext);
      case 'getJoinRequests':
        return await getJoinRequests(event, wxContext);
      case 'approveJoinRequest':
        return await approveJoinRequest(event, wxContext);
      case 'rejectJoinRequest':
        return await rejectJoinRequest(event, wxContext);

      // 全局学生列表
      case 'getAllStudents':
        return await getAllStudents(event, wxContext);
      case 'searchStudents':
        return await searchStudents(event, wxContext);

      default:
        return { code: -1, msg: '未知操作' };
    }
  } catch (error) {
    console.error('班级操作失败', error);
    return {
      code: -1,
      msg: '操作失败',
      error: error.message,
    };
  }
};

// ==================== 班级操作 ====================

// 生成6位邀请码
function generateRandomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 创建班级
async function createClass(event, wxContext) {
  const { name, type = 'class' } = event;

  if (!name || !name.trim()) {
    return { code: -1, msg: '班级名称不能为空' };
  }

  // 检查是否已有同名班级
  const existing = await db.collection('classes')
    .where({
      teacherId: wxContext.OPENID,
      name: name.trim(),
      status: 'active',
    })
    .count();

  if (existing.total > 0) {
    return { code: -1, msg: '已有同名班级' };
  }

  // 生成唯一邀请码
  let inviteCode = generateRandomCode();
  let codeExists = true;
  while (codeExists) {
    const codeCheck = await db.collection('classes')
      .where({ inviteCode, status: 'active' })
      .count();
    if (codeCheck.total > 0) {
      inviteCode = generateRandomCode();
    } else {
      codeExists = false;
    }
  }

  const result = await db.collection('classes').add({
    data: {
      name: name.trim(),
      type,
      teacherId: wxContext.OPENID,
      studentCount: 0,
      inviteCode,
      status: 'active',
      createTime: new Date(),
      updateTime: new Date(),
    },
  });

  return {
    code: 0,
    msg: '创建成功',
    data: { classId: result._id, inviteCode },
  };
}

// 获取班级列表
async function getClassList(event, wxContext) {
  const { status = 'active', page = 1, pageSize = 20 } = event;

  const result = await db.collection('classes')
    .where({
      teacherId: wxContext.OPENID,
      status,
    })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .orderBy('createTime', 'desc')
    .get();

  return {
    code: 0,
    msg: 'success',
    data: result.data,
    total: result.data.length,
  };
}

// 获取班级详情
async function getClassDetail(event, wxContext) {
  const { classId } = event;

  const cls = await db.collection('classes').doc(classId).get();

  if (!cls.data) {
    return { code: -1, msg: '班级不存在' };
  }

  if (cls.data.teacherId !== wxContext.OPENID) {
    return { code: -1, msg: '无权限' };
  }

  // 获取学生列表（包含已离班的学生，显示状态）
  const students = await db.collection('students')
    .where({ classId })
    .orderBy('createTime', 'asc')
    .get();

  // 获取待审核的入班申请数量
  const pendingRequests = await db.collection('join_requests')
    .where({
      classId,
      status: 'pending',
    })
    .count();

  return {
    code: 0,
    msg: 'success',
    data: {
      ...cls.data,
      students: students.data,
      pendingRequests: pendingRequests.total,
    },
  };
}

// 更新班级
async function updateClass(event, wxContext) {
  const { classId, name, type } = event;

  const cls = await db.collection('classes').doc(classId).get();

  if (!cls.data) {
    return { code: -1, msg: '班级不存在' };
  }

  if (cls.data.teacherId !== wxContext.OPENID) {
    return { code: -1, msg: '无权限' };
  }

  const updateData = {
    updateTime: new Date(),
  };

  if (name) updateData.name = name.trim();
  if (type) updateData.type = type;

  await db.collection('classes').doc(classId).update({
    data: updateData,
  });

  return { code: 0, msg: '更新成功' };
}

// 删除班级（软删除）
async function deleteClass(event, wxContext) {
  const { classId } = event;

  const cls = await db.collection('classes').doc(classId).get();

  if (!cls.data) {
    return { code: -1, msg: '班级不存在' };
  }

  if (cls.data.teacherId !== wxContext.OPENID) {
    return { code: -1, msg: '无权限' };
  }

  await db.collection('classes').doc(classId).update({
    data: {
      status: 'archived',
      updateTime: new Date(),
    },
  });

  return { code: 0, msg: '删除成功' };
}

// 重新生成邀请码
async function generateInviteCode(event, wxContext) {
  const { classId } = event;

  const cls = await db.collection('classes').doc(classId).get();

  if (!cls.data) {
    return { code: -1, msg: '班级不存在' };
  }

  if (cls.data.teacherId !== wxContext.OPENID) {
    return { code: -1, msg: '无权限' };
  }

  // 生成新的邀请码
  let inviteCode = generateRandomCode();
  let codeExists = true;
  while (codeExists) {
    const codeCheck = await db.collection('classes')
      .where({ inviteCode, status: 'active', _id: dbCmd.neq(classId) })
      .count();
    if (codeCheck.total > 0) {
      inviteCode = generateRandomCode();
    } else {
      codeExists = false;
    }
  }

  await db.collection('classes').doc(classId).update({
    data: {
      inviteCode,
      updateTime: new Date(),
    },
  });

  return { code: 0, msg: '生成成功', data: { inviteCode } };
}

// ==================== 学生操作 ====================

// 添加学生（通过邀请码方式 - 学生已有账号）
async function addStudent(event, wxContext) {
  const { classId, studentName } = event;

  if (!classId || !studentName) {
    return { code: -1, msg: '参数不完整' };
  }

  // 检查班级权限
  const cls = await db.collection('classes').doc(classId).get();
  if (!cls.data || cls.data.teacherId !== wxContext.OPENID) {
    return { code: -1, msg: '无权限' };
  }

  // 检查是否已添加同名学生
  const existing = await db.collection('students')
    .where({
      classId,
      name: studentName.trim(),
      status: 'active',
    })
    .count();

  if (existing.total > 0) {
    return { code: -1, msg: '班内已有同名学生' };
  }

  const result = await db.collection('students').add({
    data: {
      classId,
      teacherId: wxContext.OPENID,
      name: studentName.trim(),
      openId: '',
      phone: '',
      status: 'active',
      joinSource: 'manual', // manual=手动添加, invite=邀请码
      createTime: new Date(),
      updateTime: new Date(),
    },
  });

  // 更新班级学生数
  await db.collection('classes').doc(classId).update({
    data: {
      studentCount: dbCmd.inc(1),
      updateTime: new Date(),
    },
  });

  return { code: 0, msg: '添加成功', data: { studentId: result._id } };
}

// 手动创建学生账号
async function addStudentManual(event, wxContext) {
  const { classId, name, phone = '' } = event;

  if (!classId || !name || !name.trim()) {
    return { code: -1, msg: '姓名不能为空' };
  }

  // 检查班级权限
  const cls = await db.collection('classes').doc(classId).get();
  if (!cls.data || cls.data.teacherId !== wxContext.OPENID) {
    return { code: -1, msg: '无权限' };
  }

  // 检查班内是否已有同名学生
  const existing = await db.collection('students')
    .where({
      classId,
      name: name.trim(),
      status: 'active',
    })
    .count();

  if (existing.total > 0) {
    return { code: -1, msg: '班内已有同名学生' };
  }

  // 生成临时密码（6位数字）
  const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();

  // 创建学生记录
  const result = await db.collection('students').add({
    data: {
      classId,
      teacherId: wxContext.OPENID,
      name: name.trim(),
      phone: phone.trim(),
      openId: '',
      status: 'active',
      joinSource: 'manual',
      needBind: true, // 需要绑定微信
      tempPassword,
      createTime: new Date(),
      updateTime: new Date(),
    },
  });

  // 更新班级学生数
  await db.collection('classes').doc(classId).update({
    data: {
      studentCount: dbCmd.inc(1),
      updateTime: new Date(),
    },
  });

  return {
    code: 0,
    msg: '创建成功',
    data: {
      studentId: result._id,
      name: name.trim(),
      phone: phone.trim(),
      tempPassword,
    },
  };
}

// 移除学生（软删除，保留记录）
async function removeStudent(event, wxContext) {
  const { classId, studentId } = event;

  // 检查班级权限
  const cls = await db.collection('classes').doc(classId).get();
  if (!cls.data || cls.data.teacherId !== wxContext.OPENID) {
    return { code: -1, msg: '无权限' };
  }

  const student = await db.collection('students').doc(studentId).get();
  if (!student.data) {
    return { code: -1, msg: '学生不存在' };
  }

  await db.collection('students').doc(studentId).update({
    data: {
      status: 'inactive',
      leaveTime: new Date(),
      updateTime: new Date(),
    },
  });

  // 更新班级学生数
  await db.collection('classes').doc(classId).update({
    data: {
      studentCount: dbCmd.inc(-1),
      updateTime: new Date(),
    },
  });

  return { code: 0, msg: '已移除学生' };
}

// 获取班级学生列表
async function getStudents(event, wxContext) {
  const { classId, includeLeft = false } = event;

  // 检查班级权限
  const cls = await db.collection('classes').doc(classId).get();
  if (!cls.data || cls.data.teacherId !== wxContext.OPENID) {
    return { code: -1, msg: '无权限' };
  }

  const query = { classId };
  if (!includeLeft) {
    query.status = 'active';
  }

  const students = await db.collection('students')
    .where(query)
    .orderBy('createTime', 'asc')
    .get();

  return {
    code: 0,
    msg: 'success',
    data: students.data,
  };
}

// 获取全局学生列表（所有班级学生的聚合）
async function getAllStudents(event, wxContext) {
  const { page = 1, pageSize = 20, status = 'active' } = event;

  const query = {
    teacherId: wxContext.OPENID,
  };
  if (status === 'active') {
    query.status = 'active';
  }

  const result = await db.collection('students')
    .where(query)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .orderBy('updateTime', 'desc')
    .get();

  // 获取每个学生对应的班级信息
  const studentsWithClass = await Promise.all(
    result.data.map(async (student) => {
      const cls = await db.collection('classes').doc(student.classId).get();
      return {
        ...student,
        className: cls.data ? cls.data.name : '未知班级',
      };
    })
  );

  return {
    code: 0,
    msg: 'success',
    data: studentsWithClass,
    total: result.data.length,
  };
}

// 搜索学生
async function searchStudents(event, wxContext) {
  const { keyword = '', classId = '' } = event;

  const query = {
    teacherId: wxContext.OPENID,
    status: 'active',
  };

  if (classId) {
    query.classId = classId;
  }

  const result = await db.collection('students')
    .where(query)
    .get();

  // 客户端筛选（微信云开发不支持正则）
  let filtered = result.data;
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = result.data.filter((s) => s.name.toLowerCase().includes(kw));
  }

  // 添加班级名称
  const studentsWithClass = await Promise.all(
    filtered.map(async (student) => {
      const cls = await db.collection('classes').doc(student.classId).get();
      return {
        ...student,
        className: cls.data ? cls.data.name : '未知班级',
      };
    })
  );

  return {
    code: 0,
    msg: 'success',
    data: studentsWithClass,
  };
}

// ==================== 邀请码入班申请 ====================

// 学生通过邀请码申请加入班级
async function joinByInviteCode(event, wxContext) {
  const { inviteCode, studentName, openId } = event;

  if (!inviteCode || !studentName) {
    return { code: -1, msg: '参数不完整' };
  }

  // 查找班级
  const cls = await db.collection('classes')
    .where({
      inviteCode: inviteCode.toUpperCase(),
      status: 'active',
    })
    .get();

  if (!cls.data || cls.data.length === 0) {
    return { code: -1, msg: '邀请码无效' };
  }

  const targetClass = cls.data[0];

  // 检查是否已申请
  const existingRequest = await db.collection('join_requests')
    .where({
      classId: targetClass._id,
      studentName: studentName.trim(),
      status: 'pending',
    })
    .count();

  if (existingRequest.total > 0) {
    return { code: -1, msg: '已有待审核的申请' };
  }

  // 创建入班申请
  await db.collection('join_requests').add({
    data: {
      classId: targetClass._id,
      className: targetClass.name,
      teacherId: targetClass.teacherId,
      studentName: studentName.trim(),
      openId: openId || '',
      status: 'pending',
      createTime: new Date(),
      updateTime: new Date(),
    },
  });

  return {
    code: 0,
    msg: '申请已提交，请等待老师审核',
    data: {
      classId: targetClass._id,
      className: targetClass.name,
    },
  };
}

// 获取班级的入班申请列表
async function getJoinRequests(event, wxContext) {
  const { classId } = event;

  // 检查班级权限
  const cls = await db.collection('classes').doc(classId).get();
  if (!cls.data || cls.data.teacherId !== wxContext.OPENID) {
    return { code: -1, msg: '无权限' };
  }

  const requests = await db.collection('join_requests')
    .where({
      classId,
      status: 'pending',
    })
    .orderBy('createTime', 'desc')
    .get();

  return {
    code: 0,
    msg: 'success',
    data: requests.data,
  };
}

// 同意入班申请
async function approveJoinRequest(event, wxContext) {
  const { requestId, classId } = event;

  // 检查班级权限
  const cls = await db.collection('classes').doc(classId).get();
  if (!cls.data || cls.data.teacherId !== wxContext.OPENID) {
    return { code: -1, msg: '无权限' };
  }

  // 获取申请信息
  const request = await db.collection('join_requests').doc(requestId).get();
  if (!request.data) {
    return { code: -1, msg: '申请不存在' };
  }

  // 检查班内是否已有同名学生
  const existing = await db.collection('students')
    .where({
      classId,
      name: request.data.studentName,
      status: 'active',
    })
    .count();

  if (existing.total > 0) {
    return { code: -1, msg: '班内已有同名学生' };
  }

  // 创建学生记录
  await db.collection('students').add({
    data: {
      classId,
      teacherId: wxContext.OPENID,
      name: request.data.studentName,
      openId: request.data.openId || '',
      status: 'active',
      joinSource: 'invite',
      createTime: new Date(),
      updateTime: new Date(),
    },
  });

  // 更新申请状态
  await db.collection('join_requests').doc(requestId).update({
    data: {
      status: 'approved',
      updateTime: new Date(),
    },
  });

  // 更新班级学生数
  await db.collection('classes').doc(classId).update({
    data: {
      studentCount: dbCmd.inc(1),
      updateTime: new Date(),
    },
  });

  return { code: 0, msg: '已同意入班申请' };
}

// 拒绝入班申请
async function rejectJoinRequest(event, wxContext) {
  const { requestId } = event;

  await db.collection('join_requests').doc(requestId).update({
    data: {
      status: 'rejected',
      updateTime: new Date(),
    },
  });

  return { code: 0, msg: '已拒绝申请' };
}
