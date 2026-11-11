---
pubDatetime: 2026-11-11T21:00:00+08:00
title: 第一篇筆記
featured: true
tags:
  - meta
description: 部落格開張，說明怎麼新增筆記。
---

這個部落格用 [AstroPaper](https://github.com/satnaing/astro-paper) 建置，部署在 GitHub Pages。

## 新增筆記

在 `src/content/posts/` 新增一個 `.md` 檔，開頭放 frontmatter：

```yaml
---
pubDatetime: 2026-11-11T21:00:00+08:00
title: 筆記標題
tags:
  - 標籤
description: 一句話摘要
---
```

然後 `git push` 到 `main`，GitHub Actions 會自動建置並發佈。
