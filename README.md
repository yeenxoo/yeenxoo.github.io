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

## 本地開發

```bash
pnpm install
pnpm run dev
pnpm run build
```

主題使用 [AstroPaper](https://github.com/satnaing/astro-paper)（MIT License）。
