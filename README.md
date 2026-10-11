# 闲沐连环画 MCP 服务（xianmu-comics）

**Chinese Comic Knowledge Service** —— 通过 MCP 协议（Streamable HTTP）开放 568 部中国连环画（1960s–1990s）
的结构化数据与多模态内容：书目与角色档案、书页图片、故事梗概语音、逐页朗读、AI 角色沉浸式对话。

> **English**: XianMu Comics exposes 568 classic Chinese *lianhuanhua* (picture-story books, 1960s–1990s)
> over the Model Context Protocol (Streamable HTTP): catalog browsing & search, book page images,
> story-summary audio, page-by-page narration, character profiles, and immersive AI role-play chat
> with the characters. Free tier included; pay-per-book unlocks via in-chat Alipay QR codes;
> VIP plans (monthly/quarterly) with points grants. No subscription.

- 端点：`https://www.wwzu.com/mcp`（传输：Streamable HTTP）
- 认证：`Authorization: Bearer xm-你的Key`（[免费创建](https://www.wwzu.com/mcp-keys.php)）
- 定价：免费层（内容工具解锁态自适应 + 前 20 页预览 + 梗概语音试听，查询工具每日 100 次/Key，
  VIP 300 次）+ 按部买断（¥1.9 / ¥2.9 / ¥4.9，无订阅）+ AI 角色对话 1 积分/条（免解锁，与主站同价，
  不占每日额度）+ VIP 月卡 ¥9.9（赠 1200 积分）/ 季卡 ¥29.7（赠 3600 积分，支付到账即赠分并顺延
  有效期，无自动续费）；积分 100 分 = ¥1 平价、VIP 充值加赠 10%；额度用完可在对话内
  `reset_daily_quota` 或官网 Keys 页扣积分立即重置
- **对话内直接付费（订单码）**：智能体调 `unlock_comic(comic_id, method='alipay')` 返回支付宝
  订单码（`qr_code_image` 为服务端生成的正方形 PNG 二维码 data URI，`<img>` 直嵌即显示、保持 1:1；
  `qr_code` 链接兜底/浏览器打开），用户扫码付款后 `check_payment(order_no)`
  自动确认解锁——全程不离开对话。积分解锁为高级会员（VIP）专享：`unlock_comic(method='points')`
  直接扣分（零跳转），积分充值同理（`recharge_points` / `check_payment`）。
  官网 [计费页](https://www.wwzu.com/mcp-billing.php) 积分通道保留（VIP）。
- **漫画标识统一官网**：`comic_id` 即官网详情页 URL 中的 htmlname（如 `200741113201`
  = `wwzu.com/comic-detail/200741113201`），所有结果附带 `web_url` 可直接跳转；入参亦兼容内部数字 ID。
- 门户：[服务介绍](https://www.wwzu.com/mcp-landing.php) · [接入文档](https://www.wwzu.com/mcp-docs.php) · [计费](https://www.wwzu.com/mcp-billing.php)

## 接入方式一：MCP 客户端配置（推荐支持 MCP 的客户端）

```json
{
  "mcpServers": {
    "xianmu-comics": {
      "url": "https://www.wwzu.com/mcp",
      "headers": { "Authorization": "Bearer xm-你的APIKey" }
    }
  }
}
```

## 接入方式二：Agent Skill（推荐支持技能的智能体，如 Claude Code / ZCode / WorkBuddy / Trae 等）

无需配置 MCP，一句话安装（与 MCP 配置完全等价：同一端点、同一 Key、同一计费）：

```bash
npx xianmu-comics-skill@latest install        # 安装到 ~/.agents/skills/xianmu-comics
npx xianmu-comics-skill@latest install --all  # 同时安装到 ~/.claude/skills 与 ~/.zcode/skills
```

备选方式：官网直链下载 [xianmu-comics-skill-1.2.0.zip](https://www.wwzu.com/downloads/xianmu-comics-skill-1.2.0.zip)
（解压把 `xianmu-comics/` 放进技能目录），或 `git clone` 本仓库后复制
[`xianmu-comics/`](./xianmu-comics/) 文件夹。升级/卸载：`npx xianmu-comics-skill@latest update | uninstall`。

然后设置环境变量 `XIANMU_API_KEY`（在 [mcp-keys.php](https://www.wwzu.com/mcp-keys.php) 免费创建；
skill 也会在没有 Key 时引导你在对话内 60 秒开通）。技能内置零依赖直连脚本
`xianmu-comics/scripts/xianmu_mcp.py`，覆盖全部 11 个工具、订单码支付闭环与漫剧阅读模式。

## 工具（11 个）

**内容层（5）**：

| 工具 | 说明 |
|---|---|
| `get_site_overview` | 站点统计 + 全部标签目录 |
| `browse_comics` | 统一浏览入口：query 搜索 / tag 标签 / ranking 榜单 / related_to 推荐（四模式互斥，条目同构） |
| `get_comic` | 书详情一步到位，解锁态自适应：未解锁给基础信息 + 前 20 页预览 + 内嵌解锁报价 + 梗概语音试听；已解锁给全量页图 + 逐页朗读 + 逐页文字 + AI 故事资料；`page=N` 单页模式（图+音频+文字三件套）；`page_limit≤200` 翻页判底 |
| `search_characters` | 角色查询五合一：query / character_ids≤50 / comic_id / random；基础档案免费，完整档案与 AI 图集解锁态自适应降级 |
| `chat_with_character` | AI 角色对话：**免解锁**，1 积分/条（与主站 chat.php 同价同账本） |

**计费层（6，免费且不占每日额度）**：

| 工具 | 说明 |
|---|---|
| `get_account` | 余额 / VIP / 积分充值套餐 / VIP 套餐 / 已解锁连环画清单（书架） |
| `unlock_comic` | 解锁合一：method='points' 扣积分（VIP 专享，不足返回差额与充值引导）；method='alipay' 返回支付宝订单码二维码 |
| `check_payment` | 支付确认：按订单类型自动履约（解锁交付 / 积分到账 / VIP 生效），可反复轮询 |
| `recharge_points` | 对话内积分充值下单，返回订单码二维码 |
| `purchase_vip` | VIP 开通/续费下单（月卡 ¥9.9 / 季卡 ¥29.7，到账即赠积分并顺延有效期），返回订单码二维码 |
| `reset_daily_quota` | 扣积分（默认 100）立即重置今日调用额度（仅查询工具受限的额度） |

## 每日额度

每日额度只约束 4 个免费查询工具（`get_site_overview` / `browse_comics` / `get_comic` /
`search_characters`）：普通 100 次/Key、VIP 300 次/Key（生效值 = max(Key 存储限额, VIP 限额)）；
`chat_with_character` 按条扣积分不受次数限制。额度用完时可在对话内调 `reset_daily_quota`
（扣积分）立即重置，或到官网 Keys 页操作。

## 仓库结构

```
xianmu-comics/          # Agent Skill 包（目录名即技能名，复制到技能目录即完成安装）
├── SKILL.md            # 技能主文件
├── VERSION
├── scripts/xianmu_mcp.py   # 零依赖直连脚本（JSON-RPC over Streamable HTTP）
└── references/         # 按需阅读：api.md 协议细节 / tools.md 工具参数 / workflows.md 业务流程
lhm.plugin.json         # LobeHub 插件市场清单
```

## 内容合规

书页图片与音频仅供即时展示/播放，禁止批量下载、转存或二次分发；URL 均为站点直链，受服务条款约束。

## 相关链接

- [服务介绍（Landing）](https://www.wwzu.com/mcp-landing.php)
- [接入文档](https://www.wwzu.com/mcp-docs.php)
- [计费说明](https://www.wwzu.com/mcp-billing.php)
- [API Key 管理](https://www.wwzu.com/mcp-keys.php)
- [官网首页](https://www.wwzu.com)