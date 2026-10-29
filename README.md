# TaskPilot

TaskPilot 是一个可在本地运行的项目与任务管理平台。它提供账号注册与登录、按用户隔离的项目管理、任务看板、统计仪表盘和 CSV 导出。应用使用 SQLite 保存数据，不依赖付费第三方 API 或云服务。

## 技术栈

- Web：React 19、TypeScript、Vite、Tailwind CSS、React Router
- API：Node.js、Express 5、TypeScript、Zod
- 数据库：SQLite、Prisma 6
- 认证：bcryptjs 密码哈希、HS256 JWT
- 测试：Vitest、Supertest、Playwright

## 环境要求

- Node.js 20.19 或更高版本
- npm 10 或更高版本
- 运行 E2E 测试时还需要 Playwright Chromium 及其系统依赖

## 安装和启动

在仓库根目录安装依赖。`install` 是 npm 的内置命令，不是 `npm run` 脚本；安装过程会运行 Prisma Client 生成步骤。

```bash
cd /workspace/TaskPilot
npm install
cp apps/api/.env.example apps/api/.env
```

`apps/api/.env.example` 提供本地 `PORT` 和 `JWT_SECRET`。本地默认 API 端口为 `4000`，Vite 开发服务器端口为 `5173`。SQLite 文件位于 `apps/api/prisma/dev.db`，由 `.gitignore` 排除。

创建或同步本地数据库 schema：

```bash
npm run db:push
```

然后启动 Web 和 API（在一个终端中运行）：

```bash
npm run dev
```

打开 <http://localhost:5173>。Web 通过 Vite 将 `/api` 请求代理到 <http://localhost:4000>。按 `Ctrl+C` 停止两个开发服务。

本地模板密钥只用于开发。部署到生产环境时，应提供至少 32 个字符的随机 `JWT_SECRET`；生产模式缺少有效密钥时 API 会拒绝启动。JWT 有效期为 1 小时。

## 演示数据和默认账号

Seed 会创建两名演示用户、三个项目和五个任务，包含不同状态、优先级及逾期任务。两名用户使用同一个密码，密码只从环境变量 `SEED_USER_PASSWORD` 读取：

```bash
SEED_USER_PASSWORD='choose-a-local-demo-password' npm run db:seed
```

Seed 前先运行 `npm run db:push`。完成 seed 后，在登录页使用以下任一账号和刚才设置的密码：

| 邮箱 | 用户名 |
| --- | --- |
| `demo@taskpilot.local` | Avery Chen |
| `jordan@taskpilot.local` | Jordan Lee |

示例密码仅供本机演示，请换成自己的值，不要在生产环境复用。Seed 使用固定 ID 和 upsert，可重复运行；再次运行时会把这两个账号的密码更新为本次 `SEED_USER_PASSWORD`。

## 功能和 API

- 注册、登录、个人资料读取与姓名更新；密码以 bcrypt 哈希保存，受保护 API 使用 Bearer JWT。
- 项目列表、创建、编辑、归档和删除；删除项目会级联删除任务。
- 任务创建、编辑、删除和看板拖动；支持状态、优先级、截止日期、搜索、筛选与排序。
- 仪表盘显示当前用户任务统计与分布图表，可按本人项目过滤。
- CSV 导出只包含当前用户的任务。
- 其他用户的项目或任务不可访问；越权和不存在的资源都返回 `404`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 健康检查 |
| `POST` | `/api/auth/register` | 注册 |
| `POST` | `/api/auth/login` | 登录并签发 JWT |
| `POST` | `/api/auth/logout` | 验证令牌并通知客户端退出 |
| `GET` / `PATCH` | `/api/auth/me` | 读取或更新当前用户资料 |
| `GET` / `POST` | `/api/projects` | 列出或创建项目 |
| `GET` / `PATCH` / `DELETE` | `/api/projects/:projectId` | 查看、更新或删除项目 |
| `GET` / `POST` | `/api/projects/:projectId/tasks` | 列出或创建项目任务 |
| `GET` / `PATCH` / `DELETE` | `/api/tasks/:taskId` | 查看、更新或删除任务 |
| `PATCH` | `/api/tasks/:taskId/status` | 更新任务状态和看板位置 |
| `GET` | `/api/dashboard/stats` | 当前用户统计，可选 `projectId` |
| `GET` | `/api/export/tasks.csv` | 下载当前用户任务 CSV |

项目状态为 `active` / `archived`；任务状态为 `todo` / `in_progress` / `done`；优先级为 `low` / `medium` / `high`。日期接受 `YYYY-MM-DD` 或带时区的 ISO datetime。

## 根目录命令

| 命令 | 用途 |
| --- | --- |
| `npm install` | 安装全部工作区依赖并生成 Prisma Client（npm 内置命令） |
| `npm run dev` | 同时启动 API 和 Web 开发服务 |
| `npm run build` | 构建 API 和 Web |
| `npm run test` | 运行 API 与 Web Vitest 测试 |
| `npm run test:e2e` | 运行 Playwright Chromium 冒烟测试 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 将 Prisma schema 同步到本地 SQLite |
| `npm run db:migrate` | 使用 Prisma Migrate 创建或应用迁移 |
| `npm run db:seed` | 写入演示数据；需要 `SEED_USER_PASSWORD` |

## 测试

运行构建和 Vitest：

```bash
npm run build
npm run test
```

首次运行 Playwright 前安装 Chromium：

```bash
npx playwright install chromium
npm run test:e2e
```

Linux 主机若缺少浏览器系统库，可运行 `npx playwright install --with-deps chromium` 安装 Playwright 所需依赖。当前 E2E 包含登录页未登录状态和仪表盘界面冒烟；仪表盘用例会 mock API，不验证真实 API/数据库链路。详细执行结果见 [TEST_REPORT.md](./TEST_REPORT.md)。

认证令牌保存在浏览器 `localStorage` 的 `taskpilot.accessToken` 项中。该方式适合本地开发；生产部署应配置严格的 CSP 并落实 XSS 防护。当前服务尚未包含生产级速率限制、安全响应头和数据库备份流程。

更完整的数据关系和接口边界见 [ARCHITECTURE.md](./ARCHITECTURE.md)，交付验收说明见 [DELIVERY_REPORT.md](./DELIVERY_REPORT.md)。
