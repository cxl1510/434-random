# 课堂随机点名小程序 Spec

## Why
现有项目为微信云开发 QuickStart 模板，需要改造成一款课堂场景下的随机点名小游戏。利用微信小程序云数据库实现多人共享的班级数据、学生名单和点名记录，让教师可以创建班级、导入学生、一键随机点名并记录考勤结果。

## What Changes
- **新增页面**：首页、班级列表页、班级详情页、随机点名页、点名结果页、历史记录页
- **新增云函数**：`classManager`、`studentManager`、`randomCall`、`recordManager`、`userManager`
- **新增数据库集合**：`classes`、`students`、`call_records`、`users`
- **修改入口文件**：`app.js` 填入云环境 ID，`app.json` 注册新页面与 TabBar
- **修改全局样式**：`app.wxss` 引入统一设计变量与工具类
- **删除模板页面**：清理 `pages/example` 及 QuickStart 相关冗余代码

## Impact
- Affected specs: 无前置依赖
- Affected code:
  - `miniprogram/app.js`
  - `miniprogram/app.json`
  - `miniprogram/app.wxss`
  - `miniprogram/pages/**`（新增 5+ 页面）
  - `cloudfunctions/**`（新增/替换云函数）

## 云环境配置
- **云环境 ID**：`cloud1-d6gqxlkheb51fdfed`
- 在 `app.js` 中将 `env` 从空字符串改为 `"cloud1-d6gqxlkheb51fdfed"`

## ADDED Requirements

### Requirement: 班级管理
The system SHALL 允许用户创建、查看、删除班级。

#### Scenario: 创建班级
- **WHEN** 用户填写班级名称并点击创建
- **THEN** 系统在 `classes` 集合插入一条记录，返回新班级 ID

#### Scenario: 查看班级列表
- **WHEN** 用户进入首页
- **THEN** 系统按创建时间倒序展示该用户创建的所有班级

#### Scenario: 删除班级
- **WHEN** 用户长按或点击删除按钮
- **THEN** 系统删除该班级及其下属学生、点名记录

### Requirement: 学生管理
The system SHALL 允许在班级内添加、编辑、删除学生。

#### Scenario: 添加学生
- **WHEN** 用户输入学生姓名并确认
- **THEN** 系统在 `students` 集合插入记录，关联对应 `classId`

#### Scenario: 批量导入
- **WHEN** 用户粘贴以换行符分隔的多个姓名
- **THEN** 系统批量插入学生记录

### Requirement: 随机点名
The system SHALL 提供带滚动动画的随机点名功能。

#### Scenario: 开始点名
- **WHEN** 用户点击“开始点名”
- **THEN** 系统从该班级学生中随机抽取一名，页面展示快速滚动动画后停在选中学生

#### Scenario: 记录结果
- **WHEN** 点名结束后用户标记考勤状态（已到/未到/请假）
- **THEN** 系统在 `call_records` 集合插入记录，含学生名、班级、时间、结果

### Requirement: 历史记录与统计
The system SHALL 展示点名历史与统计信息。

#### Scenario: 查看历史
- **WHEN** 用户进入历史记录页
- **THEN** 系统按时间倒序展示该班级的所有点名记录

#### Scenario: 个人统计
- **WHEN** 用户查看某学生详情
- **THEN** 系统统计该学生被点次数、出勤率

## MODIFIED Requirements
### Requirement: 小程序入口初始化
- 修改 `app.js` 中 `env` 为 `"cloud1-d6gqxlkheb51fdfed"`
- 修改 `app.json` 页面路由与导航栏标题
- 移除 `pages/example/index` 及相关引用

## REMOVED Requirements
### Requirement: QuickStart 示例页面
- **Reason**: 替换为业务页面
- **Migration**: 直接删除 `pages/example` 目录及相关配置

## 数据库设计

### 集合 1: classes（班级）
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成的唯一 ID |
| name | string | 班级名称 |
| creatorOpenId | string | 创建者 openId |
| createTime | Date | 创建时间 |
| updateTime | Date | 更新时间 |
| studentsCount | number | 学生数量（冗余计数） |

- **权限**：自定义权限
  - 所有用户可读（`read: true`）
  - 仅创建者可写（`write: "doc.creatorOpenId == auth.openid"`）
- **索引**：
  - `creatorOpenId`（单字段，升序）
  - `createTime`（单字段，降序）

### 集合 2: students（学生）
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成的唯一 ID |
| classId | string | 所属班级 ID |
| name | string | 学生姓名 |
| avatar | string | 头像 URL（可选） |
| openId | string | 绑定用户 openId（可选） |
| createTime | Date | 创建时间 |

- **权限**：继承 classes 权限或独立自定义
  - 所有用户可读
  - 仅创建者可写
- **索引**：
  - `classId`（单字段，升序）
  - `classId + name`（复合索引，用于去重查询）

### 集合 3: call_records（点名记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成的唯一 ID |
| classId | string | 所属班级 ID |
| studentId | string | 学生 ID |
| studentName | string | 学生姓名（冗余） |
| callType | string | 点名类型：`random`（随机）/ `sequence`（顺序） |
| result | string | 考勤结果：`present`（已到）/ `absent`（未到）/ `leave`（请假） |
| callTime | Date | 点名时间 |
| creatorOpenId | string | 执行点名的用户 openId |

- **权限**：自定义权限
  - 所有用户可读
  - 仅创建者可写
- **索引**：
  - `classId`（单字段，升序）
  - `callTime`（单字段，降序）
  - `classId + callTime`（复合索引，用于班级历史查询）
  - `studentId`（单字段，升序，用于个人统计）

### 集合 4: users（用户）
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成的唯一 ID |
| openId | string | 微信用户唯一标识 |
| nickName | string | 微信昵称 |
| avatarUrl | string | 头像 URL |
| role | string | 角色：`teacher` / `student` |
| createTime | Date | 注册时间 |
| updateTime | Date | 更新时间 |

- **权限**：自定义权限
  - 仅用户自己可读可写（`read: "doc.openId == auth.openid"`，`write: "doc.openId == auth.openid"`）
- **索引**：
  - `openId`（单字段，唯一索引）

## 云函数设计

### 1. classManager
| 接口 | 说明 |
|------|------|
| `createClass` | 创建班级，校验 name 非空，写入 classes |
| `getClassList` | 根据 openId 查询用户创建的班级列表 |
| `deleteClass` | 删除班级，级联删除 students 与 call_records 中关联数据 |
| `getClassDetail` | 根据 classId 查询班级详情及学生数 |

### 2. studentManager
| 接口 | 说明 |
|------|------|
| `addStudent` | 单条添加学生 |
| `batchAddStudents` | 批量添加（接收 name 数组） |
| `getStudentList` | 根据 classId 查询学生列表 |
| `deleteStudent` | 删除学生，同时更新 classes.studentsCount |
| `updateStudent` | 修改学生姓名 |

### 3. randomCall
| 接口 | 说明 |
|------|------|
| `startRandomCall` | 接收 classId，查询该班级所有学生，返回随机选中的 studentId |
| `saveCallResult` | 接收 classId、studentId、result，写入 call_records |

### 4. recordManager
| 接口 | 说明 |
|------|------|
| `getRecordsByClass` | 按 classId 分页查询点名记录 |
| `getRecordsByStudent` | 按 studentId 查询个人点名记录 |
| `getStatistics` | 统计某班级或某学生的出勤率 |

### 5. userManager
| 接口 | 说明 |
|------|------|
| `login` | 获取用户 openId，若 users 中不存在则插入新记录 |
| `updateProfile` | 更新用户昵称、头像、角色 |

## 页面结构

| 页面路径 | 功能描述 |
|----------|----------|
| `pages/index/index` | 首页：展示班级列表，提供创建班级入口 |
| `pages/class-detail/class-detail` | 班级详情：展示学生列表，提供添加学生、开始点名入口 |
| `pages/random-call/random-call` | 随机点名：全屏动画滚动，展示选中结果，标记考勤 |
| `pages/history/history` | 历史记录：展示该班级的点名历史与统计 |
| `pages/profile/profile` | 个人中心：展示用户信息，可选角色切换 |

## UI/UX 设计方向
- **风格**：清新教育风，采用柔和蓝绿色系（`#4A90D9` / `#5AC8FA` / `#F5F7FA`），营造轻松课堂氛围
- **动画**：随机点名采用老虎机式滚动动画（CSS transform + transition），增强游戏感
- **交互**：大按钮、高对比度文字，适配教室投影场景
- **反馈**：点名结果使用 Toast + 音效（可选）强化反馈
