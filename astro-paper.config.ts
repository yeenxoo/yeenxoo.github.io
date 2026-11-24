import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://yeenxoo.github.io/",
    title: "Enzo's Notes",
    description: "我的學習筆記。",
    author: "Enzo",
    profile: "https://github.com/yeenxoo",
    ogImage: "default-og.jpg",
    lang: "en",
    timezone: "Asia/Taipei",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/yeenxoo/yeenxoo.github.io/edit/main/",
    },
    search: "pagefind",
    toc: true,
  },
  socials: [
    { name: "github",   url: "https://github.com/yeenxoo" },
    { name: "discord",  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", linkTitle: "Discord: yeenxoo" },
    { name: "telegram", url: "https://t.me/hyrrrooo" },
    { name: "mail",     url: "mailto:yeenxoo@gmail.com" },
  ],
  shareLinks: [],
});