#!/usr/bin/env bash
# 本地建置並把 dist/ 推到 gh-pages 分支（不需要 GitHub Actions 執行時數）。
# 使用方式：pnpm run deploy
# 注意：gh-pages 是產生出來的分支，每次都會被強制覆蓋。
set -euo pipefail
cd "$(dirname "$0")/.."
remote=$(git remote get-url origin)
pnpm run build
touch dist/.nojekyll
cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C .. config user.name)" -c user.email="$(git -C .. config user.email)" \
  commit -qm "Deploy $(git -C .. rev-parse --short HEAD)"
git push -f "$remote" gh-pages
rm -rf .git
