# Render 部署指南

本项目使用一个 Render Web Service 同时运行 Express API 和 React 单页应用；PostgreSQL 由 Render 托管。Blueprint 在仓库根目录的 `render.yaml`。部署后 `/api/*` 提供 REST，其他页面路由由 Express 回退到 `apps/web/dist/index.html`。

## GitHub → Render

1. 将仓库推送到 GitHub，并确认 Render 有权读取该仓库。
2. 在 Render Dashboard 选择 **New → Blueprint**，连接仓库并选择部署分支。Render 会读取根目录的 `render.yaml`。
3. 检查 Blueprint 预览后应用配置。它会创建 `taskpilot` Web Service 和 `taskpilot-postgres` 数据库。
4. 等待首次构建和部署成功。构建步骤会执行 `npm install`、`npm run build`、`npm run db:migrate:deploy`；Render 随后运行 `npm start`。可先打开 Render 分配的 `*.onrender.com/api/health`，应返回 `{"status":"ok","service":"taskpilot-api"}`。

`DATABASE_URL` 由 Blueprint 引用数据库连接字符串，`JWT_SECRET` 由 Render 生成。仓库中不保存生产密钥。Render 自动提供 `PORT` 和 `RENDER_EXTERNAL_URL`：API 监听 `0.0.0.0:$PORT`，并将 Render 默认域名加入 CORS 允许列表。`CORS_ORIGIN` 还允许 `https://task.shanse.dev`。

## Porkbun 自定义域名

1. 在 Render 的 TaskPilot Web Service → **Settings → Custom Domains** 添加 `task.shanse.dev`。先在 Render 添加域名，再配置 DNS。
2. 登录 Porkbun，打开域名的 **DNS Records** 管理页并新增记录：

   | 类型 | Host | Answer / Value |
   | --- | --- | --- |
   | CNAME | `task` | Render 服务分配的主机名，例如 `taskpilot.onrender.com` |

   使用 Render Dashboard 显示的实际 `onrender.com` 主机名。删除 `task` 主机上冲突的旧 A、ALIAS 或 CNAME 记录；如果 `task.shanse.dev` 配有 AAAA 记录，也删除该记录。不要删除与邮件服务等其他主机名关联的 DNS 记录。
3. 回到 Render Custom Domains 页面验证 `task.shanse.dev`。DNS 生效后 Render 会自动签发和续期 HTTPS 证书。
4. 确认 `https://task.shanse.dev/api/health` 返回健康状态，并可通过自定义域名登录和访问页面。

Porkbun 界面的字段说明见 [Porkbun 添加 DNS 记录指南](https://kb.porkbun.com/article/231-how-to-add-dns-records-on-porkbun)；Render 的自定义域名步骤见 [Render Custom Domains](https://render.com/docs/custom-domains)。

## 环境变量

| 变量 | Render 配置 | 用途 |
| --- | --- | --- |
| `DATABASE_URL` | 从 `taskpilot-postgres` 的 `connectionString` 引用 | PostgreSQL 连接地址 |
| `JWT_SECRET` | Blueprint `generateValue: true` | JWT 签名密钥；生产必须使用至少 32 个字符的强随机值 |
| `CORS_ORIGIN` | `https://task.shanse.dev` | 允许的额外浏览器来源；多个来源以逗号分隔 |
| `NODE_ENV` | `production` | 启用生产配置和密钥检查 |
| `PUBLIC_APP_URL` | `https://task.shanse.dev` | 应用公开 URL，供运行环境和后续集成使用 |
| `PORT` | Render 自动设置；本地默认 `4000` | Express 监听端口 |

本地模板位于 `apps/api/.env.example`。复制到 `apps/api/.env` 后，将 `DATABASE_URL` 指向本地 PostgreSQL；`.env` 不会提交到 Git。生产环境的值应在 Render 环境配置中维护，不要写入仓库。

## PostgreSQL 方案与免费档限制

Blueprint 将免费档作为初始预览配置。Render 免费 PostgreSQL 数据库目前只有 1 GB、30 天期限且不提供备份；到期后数据库不可访问，宽限期结束后数据会被删除。因此免费数据库适合试部署，不适合需要长期保存数据的生产服务。正式投入生产前，建议在 Render 将数据库升级到付费计划并配置备份。

如果 Render 当前不允许创建免费 PostgreSQL（例如工作区免费数据库名额已用完），将 `render.yaml` 中数据库的 `plan: free` 改为 Render Dashboard 提供的付费计划，例如 `0.1c-256mb`，然后重新同步 Blueprint。免费 Web Service 也会在空闲后休眠；需要稳定响应时应选择付费 Web Service。

限制可能变化，部署前查看 [Render 免费服务说明](https://render.com/docs/free) 和 [Blueprint YAML 参考](https://render.com/docs/blueprint-spec)。

## 更新与数据迁移

1. 在本地完成改动并运行 `npm run build`、`npm run test`。
2. 提交并推送到 Render 连接的 GitHub 分支。Render 会重新构建并部署。
3. 每次构建都会运行 `prisma migrate deploy`。迁移文件应提交到 `apps/api/prisma/migrations/`；该命令只应用尚未运行的迁移，不会清空数据库。对现有表的变更应编写可前向应用的迁移，并在生产部署前备份数据库。
4. 部署完成后检查 `/api/health` 和主要页面。需要回滚代码时可在 Render Deploys 页面选择先前的部署；数据库 schema 回滚需单独编写并审查迁移。

已备份的 SQLite 数据位于 `backups/`，不会随部署或迁移自动导入 PostgreSQL。首次 PostgreSQL 部署会创建空 schema；如需保留旧用户、项目和任务记录，应单独执行数据导入并验证记录数量。
