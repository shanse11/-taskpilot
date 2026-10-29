# TaskPilot 测试报告

## 执行环境

- 执行日期：2026-10-29（Asia/Shanghai）
- Node.js：`v20.19.2`
- npm：`11.21.0`
- 测试时 HEAD：`9dc6330be9f1396cd00516ec0a6562fbfa2919b5`（`feat: dashboard stats charts and CSV export`）

以下命令在 `/workspace/TaskPilot` 根目录实际执行。所有列出的命令均以退出码 `0` 结束。

## 执行结果

| 命令 | 结果摘要 |
| --- | --- |
| `npm run build` | 成功。API `tsc -p tsconfig.json` 通过；Web `tsc -b` 通过；Vite 生成生产构建，32 个模块转换完成。 |
| `npm run test` | 成功。API：3 个测试文件、6 项测试通过；Web：1 个测试文件、3 项测试通过。 |
| `npm run test:e2e` | 成功。Playwright Chromium 运行 2 项测试，均通过，总计约 1.3 秒。 |

E2E 实际用例：未登录访问时显示登录页；设置测试令牌后可打开仪表盘，并检查导航、图表区、CSV 按钮、窄屏无横向溢出和主题切换。

API Vitest 使用 Supertest 调用 Express 应用，并通过 Prisma/SQLite 检查认证、项目与任务 CRUD、跨用户隔离、统计口径和 CSV 内容。Web Vitest 在 jsdom 中运行。

## 已知限制

- 仪表盘 Playwright 用例通过 `page.route("**/api/**", ...)` mock 所有 API 响应，并注入测试令牌。因此该 E2E 只验证 Web 路由和 UI 行为，不验证真实登录、Express API、数据库或端到端数据链路。未登录登录页用例也不提交登录表单。
- 本次运行环境已具备可启动的 Chromium。新环境需先运行 `npx playwright install chromium`；Linux 若缺少系统库可用 `npx playwright install --with-deps chromium`。
- 本次最终验证没有运行 `npm run db:push` 或 `npm run db:seed`。README 记录了这两项命令，但本报告不据此宣称实际数据库初始化或演示数据 seed 已验证。
- 本次结果不覆盖生产部署、CI 多平台运行、速率限制、安全响应头或数据库备份恢复验证。

## 相关实现提交

测试针对仓库当时 HEAD `9dc6330`，其建立在以下实现提交之上：

- `23e7e02` — `chore: scaffold TaskPilot monorepo and architecture docs`
- `e80e754` — `feat: implement user auth with JWT and UI`
- `5b59a87` — `feat: projects and tasks API with kanban UI`
- `9dc6330` — `feat: dashboard stats charts and CSV export`


## 真实浏览器验收（2026-10-29）

在本地运行 `apps/api` + `apps/web` 后，使用桌面浏览器对 `http://127.0.0.1:5173/` 进行人工验收，结果 **9/9 PASS**。详见 `delivery-screenshots/BROWSER_QA.txt`。

验证覆盖：注册新用户、demo 登录、新建项目/任务、看板拖拽改状态、编辑任务、仪表盘统计与图表、深浅色主题、CSV 导出、390px 窄屏、跨用户数据隔离。

截图：`delivery-screenshots/01-login-page.png` … `07-dashboard-narrow-390-dark.png`。
