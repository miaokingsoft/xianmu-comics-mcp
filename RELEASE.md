# 发布清单（Release Checklist）

每次发布 skill 包（含安装器）按此顺序执行，防 npm / 官网 / GitHub 三处版本漂移：

1. **改版本号**：`xianmu-comics/VERSION` + `package.json` 两处同步（lhm.plugin.json 仅在
   工具/内容变化时另行升级，走 LobeHub 后台）。
2. **构建官网物料**：`python scripts/build-site-artifacts.py` → `dist/` 生成
   `xianmu-comics-skill-<版本>.zip` 与 `manifest.json`（含 SHA-256）。
3. **提交并打 tag**：`git add -A && git commit && git tag v<版本>`，推送 main 与 tag
   （本机 push 需绕过 insteadOf 镜像重写，见下）。
4. **GitHub Release**：`gh release create v<版本> dist/xianmu-comics-skill-<版本>.zip
   --repo miaokingsoft/xianmu-comics-mcp --title/--notes`（gh 不认 ghfast.top remote，
   必须 `--repo` 显式指定）。
5. **npm 发布**（需已 `npm login`，账号 miaokingsoft）：
   `npm publish`（发包内容由 package.json `files` 白名单锁定为 bin/ + xianmu-comics/）。
   发布后验证：`npm view xianmu-comics-skill version`；端到端：`npx xianmu-comics-skill@latest where`。
6. **官网同步（宝塔手动）**：宝塔文件管理 → 站点 Web 根目录（mcp-docs.php 所在目录）→
   新建/进入 `downloads/` 子目录 → 上传 `dist/xianmu-comics-skill-<版本>.zip` 与
   `dist/manifest.json`。上传后浏览器验
   `https://www.wwzu.com/downloads/manifest.json` 返回新版本号。
7. **文档版本号**：主站接入文档页（mcp-docs.php）skill 标签页里的直链
   文件名如带版本号需同步；公开仓库 README 如提及版本号同步。

## 本机推送命令备忘（SSH 无免密、全局 insteadOf 镜像重写）

```bash
git -c url."https://github.com/miaokingsoft/xianmu-comics-mcp".insteadOf="https://github.com/miaokingsoft/xianmu-comics-mcp" push https://github.com/miaokingsoft/xianmu-comics-mcp.git main --follow-tags
```

（更长前缀的恒等重写优先于全局 ghfast.top 重写；`gh` 系列命令一律加 `--repo miaokingsoft/xianmu-comics-mcp`。）