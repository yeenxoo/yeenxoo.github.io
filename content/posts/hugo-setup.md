---
date: '2026-08-22T22:43:32+08:00'
draft: false
title: 'Hugo架設'
tags: []
categories: ["技術筆記"]
---

記錄在 Fedora 上使用 Hugo 與 PaperMod 主題搭建靜態部落格，並透過 GitHub Actions 發布 GitHub Pages 的完整設定

---

## 一. 環境安裝

安裝 Hugo 與 Git
```bash
sudo dnf install hugo git -y

```

確認有安裝成功
```bash
hugo version

```

## 二. 初始化專案與主題配置

```bash
# 1. 建立站點並指定設定檔格式為 YAML
hugo new site blog --format yaml
cd blog

# 2. 初始化 Git 倉庫
git init

# 3. 導入 PaperMod 主題為 Submodule
git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod

```

## 三. 設定 hugo.yaml

```yaml
baseURL: 'https://yeenxoo.github.io/'
locale: zh-tw
title: 'Enzo筆記'
theme: ["PaperMod"]

caches:
  images:
    dir: :cacheDir/images

```

## 四. 管理 ssh key
為了分開不同用途的金鑰，採用 SSH Host Alias 進行管理
#### 1. 生成專用金鑰

```bash
ssh-keygen -t ed25519 -C "blog" -f ~/.ssh/id_ed25519_blog

```

#### 2. 設定 `~/.ssh/config`

在 `~/.ssh/config` 中定義專屬別名：

```text
Host github.com-blog
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_blog

```

確保權限安全：

```bash
chmod 600 ~/.ssh/config

```
#### 3. 綁定金鑰至 GitHub 與測試

取得公鑰字串（cat ~/.ssh/id_ed25519_blog.pub）並新增至該 Repository 的 Settings -> Deploy keys 中，勾選 Allow write access

測試連線：

```bash
ssh -T git@github.com-blog

```

看到 `Hi yeenxoo/yeenxoo.github.io! You've successfully authenticated...` 即代表連線設定正確

## 五. 設定 GitHub Actions
#### 1. 建立 Actions Workflow 檔案

建立 `.github/workflows/hugo.yaml`：
```yaml
name: Build and deploy
on:
  push:
    branches:
      - main
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
defaults:
  run:
    shell: bash
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      # Define tool versions
      DART_SASS_VERSION: 1.102.0
      GO_VERSION: 1.26.5
      HUGO_VERSION: 0.165.0
      NODE_VERSION: 24.19.0

      # Set the build time zone
      TZ: Europe/Oslo
    steps:
      - name: Checkout
        uses: actions/checkout@v7
        with:
          submodules: recursive
          fetch-depth: 0
          lfs: false

      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v6

      - name: Create a local tools directory
        run: |
          mkdir -p "${HOME}/.local"

      - name: Install Go
        if: hashFiles('go.mod') != ''
        uses: actions/setup-go@v6
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: false

      - name: Install Node.js
        if: hashFiles('package-lock.json') != ''
        uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install Dart Sass
        run: |
          echo "Installing Dart Sass ${DART_SASS_VERSION}..."
          curl -sfL --output-dir "${{ runner.temp }}" -O "https://github.com/sass/dart-sass/releases/download/${DART_SASS_VERSION}/dart-sass-${DART_SASS_VERSION}-linux-x64.tar.gz"
          tar -C "${HOME}/.local" -xf "${{ runner.temp }}/dart-sass-${DART_SASS_VERSION}-linux-x64.tar.gz"
          echo "${HOME}/.local/dart-sass" >> "${GITHUB_PATH}"

      - name: Install Hugo
        run: |
          echo "Installing Hugo ${HUGO_VERSION}..."
          curl -sfL --output-dir "${{ runner.temp }}" -O "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_linux-amd64.tar.gz"
          mkdir "${HOME}/.local/hugo"
          tar -C "${HOME}/.local/hugo" -xf "${{ runner.temp }}/hugo_${HUGO_VERSION}_linux-amd64.tar.gz"
          echo "${HOME}/.local/hugo" >> "${GITHUB_PATH}"

      - name: Log tool versions
        run: |
          echo "Logging tool versions..."
          command -v sass &> /dev/null && echo "Dart Sass: $(sass --version)" || echo "Dart Sass: not installed"
          command -v go &> /dev/null && echo "Go: $(go version)" || echo "Go: not installed"
          command -v hugo &> /dev/null && echo "Hugo: $(hugo version)" || echo "Hugo: not installed"
          command -v node &> /dev/null && echo "Node.js: $(node --version)" || echo "Node.js: not installed"

      - name: Configure Git
        run: |
          echo "Configuring Git..."
          git config --global core.quotepath false

      - name: Fetch full Git history
        run: |
          if [[ $(git rev-parse --is-shallow-repository) == true ]]; then
            echo "Fetching full Git history..."
            git fetch --unshallow
          fi

      - name: Initialize Git submodules
        run: |
          if [[ -f .gitmodules ]]; then
            echo "Initializing Git submodules..."
            git submodule update --init --recursive
          fi

      - name: Install Node.js dependencies
        run: |
          if [[ -f package-lock.json ]]; then
            echo "Installing Node.js dependencies..."
            npm ci
          fi

      - name: Cache restore
        id: cache-restore
        uses: actions/cache/restore@v6
        with:
          path: ${{ runner.temp }}/.cache/hugo
          key: hugo-${{ github.run_id }}
          restore-keys: hugo-

      - name: Build
        run: |
          echo "Building the project..."
          hugo build \
            --gc \
            --minify \
            --baseURL "${{ steps.pages.outputs.base_url }}/" \
            --cacheDir "${{ runner.temp }}/.cache/hugo"

      - name: Cache save
        uses: actions/cache/save@v6
        with:
          path: ${{ runner.temp }}/.cache/hugo
          key: ${{ steps.cache-restore.outputs.cache-primary-key }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          include-hidden-files: false
          path: ./public
  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5

```

#### 2. 切換 GitHub Pages 來源

前往 GitHub 倉庫頁面：**Settings** -> **Pages** -> 將 **Build and deployment** 下方的 Source 切換為 **`GitHub Actions`**。

## 六. 發布與寫作

#### 1. 首次推送到 GitHub

使用設定好的 SSH Alias 綁定遠端倉庫並推送：

```bash
git remote add origin git@github.com-blog:yeenxoo/yeenxoo.github.io.git
git branch -M main
git add .
git commit -m "feat: initial commit"
git push -u origin main

```

#### 2. 日常寫作與預覽

**新增文章**：
```bash
hugo new content posts/new-article.md

```


**本機預覽**：
```bash
hugo server -D

```
打開瀏覽器訪問 `http://localhost:1313/` 預覽

**發布上線**：

確認文章 Front Matter 中的 `draft` 為 `false`
```bash
git add .
git commit -m "feat: publish new article"
git push origin main

```
