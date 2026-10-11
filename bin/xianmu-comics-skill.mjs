#!/usr/bin/env node
/**
 * 闲沐连环画 Agent Skill 一句话安装器（零依赖、零网络：skill 内容随 npm 包自带）。
 *
 * 用法（建议经 npx 调用，保证拿到最新版）：
 *   npx xianmu-comics-skill@latest install            默认安装到 ~/.agents/skills/xianmu-comics
 *   npx xianmu-comics-skill@latest install --all      同时安装到 ~/.claude/skills 与 ~/.zcode/skills
 *   npx xianmu-comics-skill@latest install --dir <技能目录>   安装到指定技能目录
 *   npx xianmu-comics-skill@latest where              查看各安装位置与版本
 *   npx xianmu-comics-skill@latest uninstall          从全部目标位置移除
 *
 * 重复执行 install 即为升级（整目录替换为当前版本）。本工具不读取、不写入、不回显任何 API Key。
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const SKILL_NAME = "xianmu-comics";
const PKG_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(PKG_ROOT, SKILL_NAME);

const DEFAULT_TARGETS = {
  "通用技能目录 ~/.agents/skills": path.join(homedir(), ".agents", "skills"),
  "Claude Code ~/.claude/skills": path.join(homedir(), ".claude", "skills"),
  "ZCode ~/.zcode/skills": path.join(homedir(), ".zcode", "skills"),
};

function readVersion(dir) {
  try {
    return readFileSync(path.join(dir, SKILL_NAME, "VERSION"), "utf8").trim();
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const opts = { command: "install", all: false, dir: null };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") opts.all = true;
    else if (a === "--dir") opts.dir = argv[++i] ?? fail("--dir 需要一个技能目录参数");
    else rest.push(a);
  }
  if (rest.length) {
    const cmd = rest[0];
    if (!["install", "update", "uninstall", "where", "help"].includes(cmd)) {
      fail(`未知命令 ${cmd}；可用：install / update / uninstall / where / help`);
    }
    opts.command = cmd;
  }
  return opts;
}

function fail(msg) {
  console.error(`[xianmu-comics-skill] ${msg}`);
  process.exit(1);
}

/** 目标安全性：只允许操作名为 xianmu-comics 的子目录，绝不触碰技能根目录本身。 */
function destFor(skillsDir) {
  const dest = path.join(path.resolve(skillsDir), SKILL_NAME);
  if (path.basename(dest) !== SKILL_NAME || path.dirname(dest) === homedir()) {
    fail(`拒绝不安全的目标目录：${dest}`);
  }
  return dest;
}

function targetsFor(opts) {
  if (opts.dir) return { "指定目录": opts.dir };
  if (opts.all) return DEFAULT_TARGETS;
  const [firstLabel, firstPath] = Object.entries(DEFAULT_TARGETS)[0];
  return { [firstLabel]: firstPath };
}

function install(opts) {
  if (!existsSync(SRC)) fail(`包内容缺失：${SRC}（npm 安装可能不完整，请重装）`);
  const version = readVersion(PKG_ROOT);
  for (const [label, skillsDir] of Object.entries(targetsFor(opts))) {
    const dest = destFor(skillsDir);
    const before = readVersion(skillsDir);
    mkdirSync(path.dirname(dest), { recursive: true });
    rmSync(dest, { recursive: true, force: true });
    cpSync(SRC, dest, { recursive: true });
    const arrow = before ? `${before} → ${version}` : version;
    console.log(`✓ ${label}\n    已安装 ${arrow}  （${dest}）`);
  }
  console.log(`
下一步：
  1) 重启你的智能体/会话，让它发现新技能；
  2) 直接开口即可，例如："帮我找几本聊斋志异题材的连环画"；
  3) 查询/解锁/开通 VIP 需要 API Key——没配 XIANMU_API_KEY 时技能会在对话里
     引导你约 60 秒开通，无需提前准备。`);
}

function uninstall(opts) {
  let removed = 0;
  for (const [label, skillsDir] of Object.entries(targetsFor(opts))) {
    const dest = destFor(skillsDir);
    if (existsSync(dest)) {
      rmSync(dest, { recursive: true, force: true });
      console.log(`✓ 已移除（${label}）：${dest}`);
      removed++;
    } else {
      console.log(`- 未安装（${label}）`);
    }
  }
  if (!removed) console.log("没有找到任何安装副本。");
}

function where(opts) {
  console.log(`随包版本：${readVersion(PKG_ROOT) ?? "?"}`);
  for (const [label, skillsDir] of Object.entries(targetsFor(opts))) {
    const dest = destFor(skillsDir);
    const v = readVersion(skillsDir);
    console.log(`${v ? "✓" : "-"} ${label}：${v ? `v${v}` : "未安装"}（${dest}）`);
  }
}

function help() {
  console.log(`闲沐连环画 Agent Skill 安装器

  npx xianmu-comics-skill@latest install [--all] [--dir <技能目录>]
  npx xianmu-comics-skill@latest where
  npx xianmu-comics-skill@latest uninstall [--all] [--dir <技能目录>]

服务与文档：https://www.wwzu.com/mcp-landing.php`);
}

const opts = parseArgs(process.argv.slice(2));
if (opts.command === "install" || opts.command === "update") install(opts);
else if (opts.command === "uninstall") uninstall(opts);
else if (opts.command === "where") where(opts);
else help();