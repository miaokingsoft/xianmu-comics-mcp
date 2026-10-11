#!/usr/bin/env python3
"""构建官网分发物料（dist/ 下两个文件，宝塔手动上传）：

- dist/xianmu-comics-skill-<版本>.zip   skill 包本体（目录结构=xianmu-comics/，解压即装）
- dist/manifest.json                    固定地址引用的版本清单（版本号 + 直链 + SHA-256）

用法：python scripts/build-site-artifacts.py
上传：把 dist/ 下两个文件经宝塔传到站点 Web 根目录（mcp-docs.php 所在目录）的 downloads/ 子目录。
"""
from __future__ import annotations

import datetime
import hashlib
import json
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "xianmu-comics")
DIST = os.path.join(ROOT, "dist")
EXCLUDE_DIRS = {"__pycache__", ".git"}
EXCLUDE_FILES = {".DS_Store", "Thumbs.db"}


def main() -> None:
    version = open(os.path.join(SRC, "VERSION"), encoding="utf-8").read().strip()
    os.makedirs(DIST, exist_ok=True)
    zip_name = f"xianmu-comics-skill-{version}.zip"
    zip_path = os.path.join(DIST, zip_name)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(SRC):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for f in sorted(files):
                if f in EXCLUDE_FILES or f.endswith(".pyc"):
                    continue
                full = os.path.join(root, f)
                arc = os.path.relpath(full, ROOT).replace(os.sep, "/")
                zf.write(full, arc)

    sha256 = hashlib.sha256(open(zip_path, "rb").read()).hexdigest()
    manifest = {
        "version": version,
        "zip": f"https://www.wwzu.com/downloads/{zip_name}",
        "sha256": sha256,
        "github_release": f"https://github.com/miaokingsoft/xianmu-comics-mcp/releases/tag/v{version}",
        "install": "npx xianmu-comics-skill@latest install",
        "published_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    with open(os.path.join(DIST, "manifest.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    size_kb = os.path.getsize(zip_path) / 1024
    print(f"已构建 {zip_name}（{size_kb:.1f} KB）")
    print(f"SHA-256  {sha256}")
    print("上传：宝塔文件管理 → 站点 Web 根目录（mcp-docs.php 所在目录）→ downloads/ 子目录：")
    print(f"  1) dist/{zip_name}")
    print("  2) dist/manifest.json")


if __name__ == "__main__":
    main()