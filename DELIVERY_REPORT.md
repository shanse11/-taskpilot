# TaskPilot 交付报告

## 交付概览

- 仓库路径：`/workspace/TaskPilot`
- 交付形态：React Web、Express API、Prisma/SQLite 本地应用
- 实现提交基线：`9dc6330`（仪表盘统计与 CSV 导出）
- 本报告中的模块 A–F 是按当前代码功能归类的验收清单。

## 功能清单（模块 A–F）

| 模块 | 已交付内容 | 验收入口 |
| --- | --- | --- |
| A. 平台基础 | npm workspaces；React、Vite、Tailwind Web；Express、TypeScript API；Prisma schema、SQLite migration 和健康检查。 | `npm install`、`npm run db:push`、`npm run dev`；访问 Web 和 `GET /api/health`。 |
| B. 账号与鉴权 | 注册、登录、退出、个人资料查看和姓名更新；bcrypt 密码哈希、HS256 JWT、受保护路由及跨用户数据边界。 | README 的注册/登录流程；API Vitest 覆盖认证和权限检查。 |
| C. 项目管理 | 用户项目列表、创建、查看、更新、归档和删除；项目删除级联清理任务。 | 登录后打开 `/projects`；API 测试覆盖 CRUD 和归属隔离。 |
| D. 任务与看板 | 任务 CRUD、待办/进行中/已完成看板、拖动状态与位置、截止日期、优先级、筛选、搜索和排序。 | 打开项目看板；API 测试覆盖任务 CRUD、查询和跨用户 404。 |
| E. 仪表盘与导出 | 当前用户任务总数、完成数、逾期数、完成率、状态和优先级分布；可按本人项目筛选；CSV 导出按用户隔离。 | `/dashboard`、导出按钮；API 测试覆盖统计口径和 CSV 内容。 |
| F. 演示与交付验证 | `SEED_USER_PASSWORD` 控制的双演示账号 seed；Vitest 与 Playwright 命令；安装、架构、测试及交付文档；忽略本地密钥、数据库和日志。 | README 的 seed 和测试步骤；真实命令结果见 `TEST_REPORT.md`。 |

## 技术栈

- 前端：React 19、TypeScript、Vite、Tailwind CSS、React Router
- 后端：Node.js、Express 5、TypeScript、Zod
- 数据：SQLite、Prisma 6
- 认证：bcryptjs、HS256 JWT
- 测试：Vitest、Supertest、Playwright Chromium
- 仓库：npm workspaces monorepo

## 验收步骤

使用 Node.js 20.19+ 和 npm 10+，在云端工作目录 `/workspace/TaskPilot` 执行：

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run db:push
SEED_USER_PASSWORD='choose-a-local-demo-password' npm run db:seed
npm run dev
```

登录 `http://localhost:5173`，使用 `demo@taskpilot.local` 或 `jordan@taskpilot.local`，密码为 seed 时的 `SEED_USER_PASSWORD`。在 `/projects` 验收项目和任务看板，在 `/dashboard` 验收统计与 CSV 导出。

独立验证构建和测试：

```bash
npm run build
npm run test
npx playwright install chromium
npm run test:e2e
```

`npm install` 是 npm 内置安装命令；其余命令由根 `package.json` 提供，其中 `dev`、`build`、`test`、`test:e2e`、`db:generate`、`db:push`、`db:migrate`、`db:seed` 均已配置。最终交付验证的实际结果、E2E mock 范围及 Chromium 限制见 `TEST_REPORT.md`。

## 主要实现提交

- `23e7e02` — `chore: scaffold TaskPilot monorepo and architecture docs`
- `e80e754` — `feat: implement user auth with JWT and UI`
- `5b59a87` — `feat: projects and tasks API with kanban UI`
- `9dc6330` — `feat: dashboard stats charts and CSV export`

## 交付边界

当前交付面向本地开发和演示。演示 seed 命令与浏览器 E2E 的 mock 范围均已在文档中说明；生产环境所需的速率限制、安全响应头、备份恢复和部署拓扑尚未实现或验证。


## 真实浏览器验收

2026-10-29 对本地开发服务完成人工浏览器验收，**9/9 PASS**。证据目录：`/workspace/TaskPilot/delivery-screenshots/`（含 `BROWSER_QA.txt` 与运行截图）。
