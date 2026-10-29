# TaskPilot

TaskPilot 是一个可本地运行的全栈任务管理平台。当前包含账号注册、登录、JWT 鉴权和个人资料编辑；项目与任务路由已默认要求登录，业务端点会在后续阶段实现。

## 技术栈

- Web：React、TypeScript、Vite、Tailwind CSS、React Router
- API：Node.js、Express、TypeScript、Zod
- 数据库：SQLite、Prisma ORM
- 认证：bcryptjs 密码哈希、HS256 JWT
- 测试：Vitest、Supertest、Playwright

## 环境要求

- Node.js 20.19 或更高版本
- npm 10 或更高版本

## 安装与开发启动

在仓库根目录运行：

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run db:push
npm run dev
```

Vite 前端地址为 <http://localhost:5173>，Express API 地址为 <http://localhost:4000>。Vite 将 `/api` 请求代理到 API；API 也允许来自 `http://localhost:5173` 的 CORS 请求。SQLite 文件默认创建在 `apps/api/prisma/dev.db`，该数据库文件不会提交到 Git。

`apps/api/.env.example` 中的 `JWT_SECRET` 仅供本地开发。部署到生产环境时，必须设置至少 32 个字符的随机 `JWT_SECRET`；API 在生产环境没有该配置时会拒绝启动。访问令牌有效期为 1 小时。

## 认证行为

- 注册：`POST /api/auth/register`，请求包含 `email`、至少 8 个字符的 `password` 和 `name`。密码使用 bcrypt cost 12 哈希；邮箱冲突返回 `409`。
- 登录：`POST /api/auth/login`，成功返回 `{ token, user }`。JWT 带有 `userId`、`email` 和标准 `sub` claim。
- 当前用户：`GET /api/auth/me`；资料更新：`PATCH /api/auth/me`，请求体为 `{ "name": "新姓名" }`。两者都要求 `Authorization: Bearer <token>`。
- 退出：`POST /api/auth/logout` 要求有效 Bearer token，返回 `204`。令牌不存储在服务器，因此前端在退出时删除本地令牌；令牌过期后也应删除。
- 前端将访问令牌保存在浏览器 `localStorage` 的 `taskpilot.accessToken` 项中，并由 API client 自动添加 `Authorization` 请求头。刷新页面时会通过 `/api/auth/me` 恢复登录状态。此方案便于本地开发；同源脚本若被攻破会读取到 localStorage，因此部署时应配合严格的 CSP 和常规 XSS 防护。
- `/api/projects` 和 `/api/tasks` 下的请求都经过 JWT 中间件；健康检查和注册、登录接口公开。

## API 示例

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"pilot@example.com","password":"correct-horse-battery","name":"Avery Chen"}'

curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"pilot@example.com","password":"correct-horse-battery"}'
```

将登录响应的 `token` 用于受保护请求：

```bash
curl http://localhost:4000/api/auth/me -H 'Authorization: Bearer <token>'
```

如需创建演示账号和数据，先设置本地演示密码，再运行 seed：

```bash
SEED_USER_PASSWORD='choose-a-local-demo-password' npm run db:seed
```

演示用户密码也会经过 bcrypt 哈希；不要在生产环境复用演示密码。

## 常用命令

```bash
npm run dev        # 同时启动 API 和 Web
npm run build      # 构建全部工作区
npm run test       # 运行 Vitest 测试，包括真实 SQLite 认证接口测试
npm run test:e2e   # 运行 Playwright 浏览器测试
npm run db:generate
npm run db:push    # 将 Prisma schema 同步到本地 SQLite
npm run db:migrate # 使用 Prisma Migrate 创建/应用迁移
npm run db:seed    # 插入本地演示数据（需要 SEED_USER_PASSWORD）
```

首次运行端到端测试前，安装 Playwright 的 Chromium 浏览器：

```bash
npx playwright install chromium
```

更完整的数据关系和安全边界见 [ARCHITECTURE.md](./ARCHITECTURE.md)。
