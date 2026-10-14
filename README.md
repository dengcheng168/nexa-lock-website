# 智能门锁官网

基于原净水器网站后台能力改造的智能门锁企业官网。**前台官网为英文**，**后台管理系统界面为中文**。

## 目录

1. [项目说明](#1-项目说明)
2. [技术栈](#2-技术栈)
3. [目录说明](#3-目录说明)
4. [本地开发步骤](#4-本地开发步骤)
5. [环境变量说明](#5-环境变量说明)
6. [数据库初始化](#6-数据库初始化)
7. [创建管理员账号](#7-创建管理员账号)
8. [Docker 部署](#8-docker-部署)
9. [Nginx 配置](#9-nginx-配置)
10. [HTTPS 配置](#10-https-配置)
11. [备份与恢复](#11-备份与恢复)
12. [更新项目](#12-更新项目)
13. [上传文件目录](#13-上传文件目录)
14. [常见问题](#14-常见问题)
15. [2 核 2GB 服务器优化建议](#15-2-核-2gb-服务器优化建议)
16. [默认账号安全提醒](#16-默认账号安全提醒)

---

## 1. 项目说明

面向海外 B2B 买家、经销商、酒店与公寓项目客户的智能门锁展示官网，用于：

- 展示工厂实力、产品、OEM/ODM 服务能力、认证证书
- 获取海外客户询盘（询盘表单直接写入后台，支持状态跟踪与 CSV 导出）
- 后台可视化编辑首页内容、产品、文章、证书、导航、SEO 等几乎所有可见文案与图片

**语言分工**：前台面向海外客户，全部英文；后台面向国内运营人员，界面为中文，但录入的产品/文章等内容字段仍是英文（展示在英文前台上）。原始需求文档中的西班牙语/阿拉伯语多语言路由、RTL 支持、翻译表等均按约定**未实现**（详见项目内 `C:\Users\Admin\.claude\plans\dreamy-sniffing-badger.md` 的说明）。

## 2. 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Next.js 16（App Router + Turbopack）、TypeScript、Tailwind CSS v4、React 19 |
| 后端 | Node.js、TypeScript、Fastify 5、Prisma ORM、SQLite |
| 鉴权 | JWT（httpOnly Cookie） |
| 图片处理 | sharp（自动生成 WebP + 缩略图） |
| 部署 | Docker、Docker Compose、Nginx |

## 3. 目录说明

```
site/
├── frontend/                # Next.js 应用
│   └── src/
│       ├── app/
│       │   ├── (site)/      # 英文前台页面（首页、产品、博客、OEM/ODM…）
│       │   ├── admin/       # 中文后台管理页面
│       │   └── api/admin/   # 后台专用的服务端代理路由（登录 Cookie 转发等）
│       ├── components/      # UI 组件（前台/后台分开存放）
│       ├── lib/              # API 客户端、Server Actions、SEO 工具等
│       └── proxy.ts          # 后台登录态的乐观拦截（Next.js 16 的 middleware 改名）
├── backend/                  # Fastify + Prisma API
│   └── src/
│       ├── modules/          # 按资源划分的业务模块（products、blog、inquiries…）
│       ├── plugins/          # Fastify 插件（鉴权、限流、CORS、静态文件等）
│       └── config/           # 环境变量校验、常量
├── nginx/                    # Nginx 反向代理配置
├── scripts/                  # 部署 / 更新 / 备份 / 恢复脚本
├── uploads/                  # 上传文件持久化目录（Docker 挂载卷）
├── data/                     # SQLite 数据库持久化目录（Docker 挂载卷）
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

## 4. 本地开发步骤

需要 Node.js 20+（推荐 22）。前后端是两个独立的 npm 项目，需要分别启动。

```bash
# 1. 后端
cd backend
cp .env.example .env
npm install
npm run prisma:migrate      # 初始化数据库
npm run seed                # 写入演示数据
npm run create-admin        # 创建管理员账号（读取 .env 里的 ADMIN_INIT_EMAIL/PASSWORD）
npm run dev                 # 启动在 http://localhost:4000

# 2. 前端（另开一个终端）
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # 启动在 http://localhost:3000
```

打开 `http://localhost:3000` 查看前台，`http://localhost:3000/admin/login` 登录后台。

常用命令：

```bash
# 后端
npm run lint            # ESLint
npm run test            # 运行测试套件
npm run prisma:studio   # 可视化查看/编辑数据库

# 前端
npm run lint
npm run build            # 生产构建（会做类型检查 + 静态生成）
```

## 5. 环境变量说明

- 根目录 [`.env.example`](.env.example)：Docker Compose 读取，部署时复制为 `.env`
- [`backend/.env.example`](backend/.env.example)：后端本地开发用
- [`frontend/.env.example`](frontend/.env.example)：前端本地开发用

关键变量：

| 变量 | 说明 |
| --- | --- |
| `JWT_SECRET` | JWT 签名密钥，**生产环境必须**改成随机长字符串 |
| `ADMIN_INIT_EMAIL` / `ADMIN_INIT_PASSWORD` | 首次创建管理员账号用，创建后请立即改密码 |
| `DATABASE_URL` | SQLite 文件路径 |
| `NEXT_PUBLIC_API_BASE_URL` | 浏览器可访问的后端 API 地址（生产环境用相对路径 `/api`） |
| `INTERNAL_API_BASE_URL` | 服务端渲染时的后端内网地址（Docker 网络内直连） |
| `NEXT_PUBLIC_UPLOADS_BASE_URL` | 本地开发时前后端不同源，需要显式指向后端地址；生产环境留空 |
| `TURNSTILE_*` / `SMTP_*` | 可选功能，不配置则自动不启用 |

> **注意**：`NEXT_PUBLIC_*` 开头的变量会在 `docker compose build` 阶段被写死进前端静态产物，修改后必须重新 `build` 才会生效，不能只改 `.env` 后重启容器。

## 6. 数据库初始化

```bash
cd backend
npm run prisma:migrate        # 本地开发：交互式生成/应用迁移
npm run prisma:migrate:deploy # 生产环境：非交互式应用迁移（Docker 容器启动时会自动执行一次）
npm run seed                  # 写入演示数据（3 个产品分类、6 个产品、3 篇博客、证书/FAQ/评价占位内容等）
```

演示数据都是通用占位内容，**上线前请替换为真实内容**，尤其是证书和客户评价——种子数据里明确标注了 "Sample Placeholder" / "Placeholder"，不是真实证书编号或客户名称。

## 7. 创建管理员账号

```bash
# 本地开发
cd backend && npm run create-admin

# 生产环境（容器内执行）
docker compose exec backend npm run create-admin
```

脚本默认读取 `.env` 里的 `ADMIN_INIT_EMAIL` / `ADMIN_INIT_PASSWORD`，也可以直接传参：

```bash
npm run create-admin -- admin@yourcompany.com "a-strong-password"
```

如果该邮箱账号已存在，脚本不会做任何修改（避免误覆盖密码）；已有账号请登录后台后台在「管理员账号」页面修改密码。

## 8. Docker 部署

服务器要求：2 核 CPU / 2GB 内存 / Linux，已安装 Docker 和 Docker Compose v2。

```bash
git clone <你的仓库地址> site && cd site
cp .env.example .env
vim .env   # 修改 JWT_SECRET / ADMIN_INIT_EMAIL / ADMIN_INIT_PASSWORD / DOMAIN_NAME 等

bash scripts/deploy.sh
```

`deploy.sh` 会自动完成：检查 `.env` → 构建镜像 → 启动容器 → 等待健康检查 → 创建管理员账号 → 校验 Nginx → 记录 commit、运行镜像 ID、容器状态和迁移结果。

也可以手动执行等价的步骤：

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose exec backend npm run create-admin
```

**三个容器**：`nginx`（唯一对外暴露 80/443 端口）、`frontend`、`backend`（均只在内部 Docker 网络里，互相通过服务名访问，不直接暴露给公网）。生产环境内存限制：frontend 512MB / backend 512MB / nginx 128MB。

> **构建与运行要求**：`SITE_URL` 是生产构建必填项，缺失时构建会主动失败，以免生成 localhost 的 SEO 地址。公开站点页面由服务端动态渲染并读取当前数据；不能再依赖“构建期占位内容 + ISR 稍后刷新”。发布后必须检查动态页面，并以 `release-records/latest.txt` 中的 commit 与运行镜像 ID 作为实际上线版本依据。

## 9. Nginx 配置

配置文件在 [`nginx/`](nginx/)：

- `nginx.conf`：全局配置（gzip、日志格式、请求体大小限制等）
- `conf.d/default.conf`：反向代理规则
  - `/api/` → 后端容器
  - `/uploads/` → 直接从挂载卷读取静态文件，不经过后端进程，带长缓存
  - `/` → 前端容器
- `snippets/security-headers.conf`：通用安全响应头

凡是 `location` 自己使用 `add_header`（例如 HTML 与上传资源缓存）时，都必须在该 `location` 内重新 include 安全头；Nginx 的继承规则会让 location 级 `add_header` 覆盖 server 级安全头。配置同时隐藏上游的 `X-Powered-By`。

**上线前**，把 `conf.d/default.conf` 里的 `your-domain.com` 替换成实际域名，然后重新加载：

```bash
docker compose exec nginx nginx -s reload
```

## 10. HTTPS 配置

使用 Let's Encrypt 免费证书，以 webroot 方式申请（不需要额外安装 certbot 容器编排，用一次性容器即可）：

```bash
# 1. 确认域名已解析到服务器，且 80 端口可访问（HTTP server block 已经在跑）

# 2. 申请证书（替换域名和邮箱）
docker run --rm \
  -v "$(pwd)/nginx/letsencrypt:/etc/letsencrypt" \
  -v "$(pwd)/nginx/certbot-webroot:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d your-domain.com -d www.your-domain.com \
  --email you@example.com --agree-tos --no-eff-email

# 3. 编辑 nginx/conf.d/default.conf：
#    - 取消文件末尾 HTTPS server block 的注释，替换域名
#    - 在 HTTP server block 的 location / 里加一条重定向到 HTTPS（文件里有注释说明具体位置）

# 4. 打开 docker-compose.prod.yml 里 nginx 的 443 端口映射（已默认打开）

# 5. 重新加载
docker compose exec nginx nginx -s reload
```

**证书自动续期**（Let's Encrypt 证书 90 天过期），建议用 cron 定期执行：

```bash
# 每月 1 号凌晨 3 点尝试续期并重载 Nginx
0 3 1 * * cd /path/to/site && docker run --rm -v "$(pwd)/nginx/letsencrypt:/etc/letsencrypt" -v "$(pwd)/nginx/certbot-webroot:/var/www/certbot" certbot/certbot renew --webroot -w /var/www/certbot && docker compose exec nginx nginx -s reload
```

## 11. 备份与恢复

```bash
# 备份（打包 data/ 数据库文件 + uploads/ 上传目录到 backups/，保留最近 14 天）
bash scripts/backup.sh

# 恢复（会覆盖当前数据，需要输入 yes 确认）
bash scripts/restore.sh backups/backup-20260101-030000.tar.gz
```

建议用 cron 设置每日自动备份：

```bash
0 3 * * * cd /path/to/site && bash scripts/backup.sh >> backups/backup.log 2>&1
```

## 12. 更新项目

```bash
bash scripts/update.sh
```

会依次执行：`git pull`（如果是 git 仓库）→ 自动备份 → 重新构建镜像 → 重启容器（数据库迁移会在容器启动时自动应用）→ 健康检查与 Nginx 校验 → 写入发布证据 → 清理旧镜像。每次记录位于 `release-records/`，`latest.txt` 指向最近一次发布。

首次在生产服务器部署或发现源码目录为 777 时，以 root 执行：

```bash
bash scripts/harden-permissions.sh
```

该脚本把源码/配置目录收紧为 755、文件设为 644、脚本设为 755、`.env` 设为 600，并在仍发现非运行时目录全员可写时失败。它不修改所有者；如容器使用非 root UID/GID，应按实际运行身份调整 `data/uploads/backend/logs` 的所有者。

## 13. 上传文件目录

- 容器内路径：`backend` 服务的 `/app/uploads`，映射到宿主机的 `./uploads`
- 目录结构：`uploads/originals/`（原图）、`uploads/webp/`（自动转码的 WebP）、`uploads/thumbnails/`（缩略图）
- 生产环境由 **Nginx 直接提供静态文件访问**（不经过后端进程，性能更好）
- 上传大小限制：默认 10MB（后端 `MAX_UPLOAD_SIZE_MB` 环境变量），Nginx 侧上传体积上限 15MB（`nginx.conf` 的 `client_max_body_size`）
- 迁移服务器时，务必把整个 `uploads/` 目录一起迁移，否则历史图片会全部失效

## 14. 常见问题

**Q: 忘记管理员密码怎么办？**
用 `docker compose exec backend npm run create-admin` 也无法覆盖已存在的账号（防误操作）。需要在服务器上用 Prisma Studio 或直接执行 SQL 重置密码哈希，或删除该管理员记录后重新创建。

**Q: 首页图片/产品图片不显示？**
检查 Nginx 的 `/uploads/` 反代是否正常，以及 `uploads/` 目录权限；本地开发时确认 `frontend/.env.local` 里 `NEXT_PUBLIC_UPLOADS_BASE_URL` 指向了正在运行的后端地址。

**Q: 后台保存后前台没有立即更新？**
先确认后台保存成功和后端健康，再检查 Nginx 的 60 秒 HTML 缓存；不要把问题归因于构建期占位内容或等待 ISR。超过缓存窗口仍未更新时，核对 `release-records/latest.txt` 的运行镜像与预期源码，并检查前后端日志。

**Q: `docker compose build` 因 `SITE_URL` 缺失而失败？**
这是生产安全门禁。请在 `.env` 中设置正式的 `SITE_URL=https://你的域名` 后重新构建，不要用 localhost 绕过。

## 15. 2 核 2GB 服务器优化建议

- 生产环境已经通过 `mem_limit` 限制了三个容器的内存上限（前端/后端各 512MB，Nginx 128MB），避免任何单个服务把内存耗尽拖垮整机
- 数据库用 SQLite，无需额外的数据库进程；后端只有一个主进程，没有引入 Redis / Elasticsearch 等重型依赖
- 图片上传后自动生成 WebP + 缩略图，前台列表页优先加载缩略图并做懒加载
- Nginx 对公开 HTML 使用短缓存与 stale-while-revalidate；页面本身保持动态服务端渲染
- 日志已配置轮转（`max-size: 10m, max-file: 3`），避免磁盘被日志占满
- 如果内存依然紧张，可以考虑：给 VPS 增加 1-2GB Swap；把 `docker-compose.prod.yml` 里的内存上限适当调低但需自行观察是否 OOM

## 16. 默认账号安全提醒

**上线前务必完成以下几件事：**

1. 修改 `.env` 里的 `JWT_SECRET`（用 `openssl rand -base64 48` 生成随机值，不要用默认值）
2. 修改 `.env` 里的 `ADMIN_INIT_EMAIL` / `ADMIN_INIT_PASSWORD` 为真实邮箱和强密码
3. 首次登录后台后，立即在「设置 → 管理员账号」里再修改一次密码
4. 检查后台「设置」各页面，把种子数据里的占位联系方式、公司信息替换为真实内容
5. 替换认证证书页面的占位证书图片为真实证书（种子数据明确标注为示例，未使用真实证书编号）
