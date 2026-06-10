# Tasks

- [x] Task 1: 初始化项目与云环境配置
  - [x] SubTask 1.1: 修改 `app.js` 填入云环境 ID `cloud1-d6gqxlkheb51fdfed`
  - [x] SubTask 1.2: 修改 `app.json` 页面路由、导航栏标题、TabBar
  - [x] SubTask 1.3: 清理 QuickStart 模板冗余代码（`pages/example` 已从 app.json 移除）
  - [x] SubTask 1.4: 更新 `app.wxss` 全局样式变量

- [x] Task 2: 创建云数据库集合与索引（需在微信开发者工具云开发控制台手动创建，配置详见 spec.md）
  - [x] SubTask 2.1: 配置 `classes` 集合权限与索引方案
  - [x] SubTask 2.2: 配置 `students` 集合权限与索引方案
  - [x] SubTask 2.3: 配置 `call_records` 集合权限与索引方案
  - [x] SubTask 2.4: 配置 `users` 集合权限与索引方案

- [x] Task 3: 开发云函数（代码已创建，部署需在微信开发者工具中右键云函数选择「创建并部署：云端安装依赖」）
  - [x] SubTask 3.1: 创建 `classManager` 云函数（创建、查询、删除班级）
  - [x] SubTask 3.2: 创建 `studentManager` 云函数（增删改查学生、批量导入）
  - [x] SubTask 3.3: 创建 `randomCall` 云函数（随机抽取、保存结果）
  - [x] SubTask 3.4: 创建 `recordManager` 云函数（历史查询、统计）
  - [x] SubTask 3.5: 创建 `userManager` 云函数（登录、更新资料）
  - [ ] SubTask 3.6: 部署所有云函数到云端（需在开发者工具中手动部署）

- [x] Task 4: 开发小程序页面
  - [x] SubTask 4.1: 首页 `pages/index/index`：班级列表、创建班级弹窗
  - [x] SubTask 4.2: 班级详情页 `pages/class-detail/class-detail`：学生列表、添加学生、开始点名按钮
  - [x] SubTask 4.3: 随机点名页 `pages/random-call/random-call`：滚动动画、结果展示、考勤标记
  - [x] SubTask 4.4: 历史记录页 `pages/history/history`：点名记录列表、简单统计
  - [x] SubTask 4.5: 个人中心页 `pages/profile/profile`：用户信息、角色选择

- [x] Task 5: UI 优化与测试（代码层面已完成，真机测试需手动执行）
  - [x] SubTask 5.1: 各页面样式细化，适配不同屏幕尺寸
  - [ ] SubTask 5.2: 真机测试随机点名动画流畅度（需手动测试）
  - [ ] SubTask 5.3: 测试云数据库权限与索引是否生效（需手动测试）
  - [ ] SubTask 5.4: 测试删除班级时级联删除逻辑（需手动测试）

# Task Dependencies
- Task 2 依赖 Task 1（需要项目结构就绪）
- Task 3 依赖 Task 2（需要集合已创建）
- Task 4 依赖 Task 3（需要云函数已部署）
- Task 5 依赖 Task 4（需要页面开发完成）
