# GitHub Codespaces 测试站

本项目可直接从 GitHub 创建一个临时在线测试站，同时提供官网和管理后台。

## 创建测试站

1. 打开项目 GitHub 仓库。
2. 点击 **Code → Codespaces → Create codespace on main**。
3. 首次创建会安装依赖、初始化 SQLite 数据库并启动前后端，请等待终端完成。
4. 端口 `3000` 会自动打开，并设置为公开分享链接。

## 访问地址

- 官网：Codespaces 自动打开的 `https://...-3000.app.github.dev/`
- 后台登录：在该网址后追加 `/qZzH86tTnyvhqTpk`
- 后台邮箱：`admin@example.com`
- 后台密码：查看 Codespace 内的 `.codespaces-data/admin-password.txt`

请只通过私聊把后台密码发给测试人员。测试网址虽然可公开访问，但后台仍需要登录。

## 数据说明

- Codespace 停止后数据仍保留，重新启动会继续使用原数据库。
- 删除 Codespace 会一并删除其中的后台数据和上传文件。
- 重要图片在验收期间应额外备份；正式服务器部署后使用持久化磁盘和每日备份。
- 每个新 Codespace 都是独立测试环境，不会自动共享另一个 Codespace 的后台数据。

## 查看日志

```bash
tail -f .codespaces-data/backend.log
tail -f .codespaces-data/frontend.log
```
