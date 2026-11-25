# Enzo's Notes

我的學習筆記：<https://yeenxoo.github.io/>

## 寫筆記

在 `src/content/posts/` 新增 `.md` 檔：

```yaml
---
pubDatetime: 2026-11-24T20:00:00+08:00
title: 筆記標題
tags:
  - 主題
description: 一句話摘要
---
```

- 數學公式：`$...$`、`$$...$$`
- 圖片放在 `public/posts/<文章名>/`

push 到 `main` 後會由 GitHub Actions 自動部署。

## 密碼保護的文章

原文放在 `src/content/private/`（已被 `.gitignore` 排除，只存在本機），本地預覽在 `/private-preview/<文章名>/`。

```bash
pnpm run build    # 產生本地預覽
pnpm run encrypt  # 每篇各自輸入密碼，產生 src/data/locked/<文章名>.json
pnpm run encrypt <文章名>  # 只加密這一篇
```

只 commit 加密後的 JSON，網站上的網址是 `/private/<文章名>/`，輸入密碼後才會顯示內容。

## 本地開發

```bash
pnpm install
pnpm run dev
pnpm run build
```

主題使用 [AstroPaper](https://github.com/satnaing/astro-paper)（MIT License）。
