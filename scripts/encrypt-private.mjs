#!/usr/bin/env node
/* eslint-disable no-console */
// Encrypt password-protected posts.
//
//   pnpm run build      # builds dist/private-preview/<slug>/ from the gitignored plaintext
//   pnpm run encrypt          # asks each post's own password, writes src/data/locked/<slug>.json
//   pnpm run encrypt <slug>   # only that post
//
// Only the JSON (ciphertext) is committed. Images referenced by the post are
// inlined as data URIs before encryption, so nothing private is served in clear.
import { webcrypto as crypto } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const PREVIEW_DIR = join(ROOT, "dist", "private-preview");
const OUT_DIR = join(ROOT, "src", "data", "locked");
const ITERATIONS = 600_000;
const MIME = { ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };

function extract(slug) {
  const html = readFileSync(join(PREVIEW_DIR, slug, "index.html"), "utf8");
  const start = html.indexOf("<span data-private-start");
  const end = html.indexOf("<span data-private-end");
  if (start < 0 || end < 0) throw new Error(`markers not found in ${slug}`);
  let body = html.slice(html.indexOf(">", start) + 1 + "</span>".length, end);
  body = body.replace(/\s+srcset="[^"]*"/g, "");
  body = body.replace(/src="(\/_astro\/[^"]+)"/g, (_, src) => {
    const file = join(ROOT, "dist", src);
    const mime = MIME[extname(file).toLowerCase()];
    if (!mime) throw new Error(`unsupported image type: ${src}`);
    return `src="data:${mime};base64,${readFileSync(file).toString("base64")}"`;
  });
  const title = (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? slug).split(" | ")[0];
  return { title, html: body.trim() };
}

// Characters typed (or pasted) after a finished line wait here for the next prompt.
let pending = "";

function askHidden(prompt) {
  return new Promise(resolve => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    let value = "";
    const finish = () => {
      stdin.setRawMode?.(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      process.stdout.write("\n");
      resolve(value);
    };
    // Returns true once the line is complete; the rest stays in `pending`.
    const consume = () => {
      while (pending.length > 0) {
        const ch = pending[0];
        pending = pending.slice(1);
        if (ch === "\r" || ch === "\n" || ch === "\u0004") {
          if (ch === "\r" && pending[0] === "\n") pending = pending.slice(1);
          return true;
        }
        if (ch === "\u0003") process.exit(130);
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
      return false;
    };
    const onData = chunk => {
      pending += chunk;
      if (consume()) finish();
    };
    if (consume()) {
      process.stdout.write("\n");
      resolve(value);
      return;
    }
    stdin.setRawMode?.(true);
    stdin.setEncoding("utf8");
    stdin.on("data", onData);
    stdin.resume();
  });
}

async function getPassword(slug) {
  if (process.env.PRIVATE_POST_PASSWORD) return process.env.PRIVATE_POST_PASSWORD;
  console.log(`\n${slug}`);
  const a = await askHidden("  密碼：");
  const b = await askHidden("  再輸入一次：");
  if (a !== b) throw new Error("兩次輸入的密碼不一樣");
  if (a.length < 8) throw new Error("密碼至少要 8 個字元");
  return a;
}

async function encrypt(password, payload) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(payload)));
  const b64 = u => Buffer.from(u).toString("base64");
  return { v: 1, iter: ITERATIONS, salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) };
}

if (!existsSync(PREVIEW_DIR)) {
  console.error("找不到 dist/private-preview，請先執行 pnpm run build");
  process.exit(1);
}
// `pnpm run encrypt` encrypts every private post, asking for each one's own
// password; `pnpm run encrypt <slug> ...` encrypts only the posts named.
const available = readdirSync(PREVIEW_DIR);
const requested = process.argv.slice(2);
const unknown = requested.filter(slug => !available.includes(slug));
if (unknown.length > 0) {
  console.error(`找不到這些文章：${unknown.join("、")}（可用：${available.join("、")}）`);
  process.exit(1);
}
const slugs = requested.length > 0 ? requested : available;
if (slugs.length === 0) {
  console.error("沒有私人文章可以加密");
  process.exit(1);
}
mkdirSync(OUT_DIR, { recursive: true });
for (const slug of slugs) {
  let password;
  try {
    password = await getPassword(slug);
  } catch (err) {
    console.error(`  ${err.message}，這篇沒有加密`);
    process.exitCode = 1;
    continue;
  }
  const locked = await encrypt(password, extract(slug));
  writeFileSync(join(OUT_DIR, `${slug}.json`), JSON.stringify(locked) + "\n");
  console.log(`  已加密：src/data/locked/${slug}.json  →  /private/${slug}/`);
}
