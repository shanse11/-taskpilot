# TaskPilot

TaskPilot 是一个可本地运行的全栈任务管理平台。当前提交建立了前后端脚手架与数据模型，项目、任务和认证接口仍是后续实现项。

## 技术栈

- Web：React、TypeScript、Vite、Tailwind CSS
- API：Node.js、Express、TypeScript
- 数据库：SQLite、Prisma ORM
- 测试：Vitest、Playwright
- 认证基础：bcryptjs 密码哈希与 JWT 依赖已就位；认证流程将在后续阶段实现

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

Vite 前端地址为 <http://localhost:5173>，Express API 地址为 <http://localhost:4000>。前端开发服务器会将 `/api` 请求代理到 API。当前可用的 API 验活地址是 <http://localhost:4000/api/health>。

`npm install` 会生成 Prisma Client。SQLite 文件默认创建在 `apps/api/prisma/dev.db`；该数据库文件不会提交到 Git。当前 API 仅提供健康检查，其余路由是待实现的空路由。

如需创建演示账号和数据，请先配置本地演示密码，再运行 seed：

```bash
SEED_USER_PASSWORD='choose-a-local-demo-password' npm run db:seed
```

脚本使用 bcryptjs 生成 `passwordHash` 后才写入 SQLite；数据库中不会保存明文密码。请勿在生产环境复用演示密码。

## 常用命令

```bash
npm run dev        # 同时启动 API 和 Web
npm run build      # 构建全部工作区
npm run test       # 运行 Vitest 单元测试
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

更完整的分层、数据关系、API 规划和安全边界见 [ARCHITECTURE.md](./ARCHITECTURE.md)；分阶段验收标准见 [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)。
