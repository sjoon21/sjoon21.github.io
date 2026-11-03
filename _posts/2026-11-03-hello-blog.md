---
title: 블로그를 열었습니다
date: 2026-11-03 12:00:00 +0900
categories: [블로그 운영]
tags: [github-pages, jekyll, chirpy]
description: GitHub Pages와 Chirpy 테마로 개발 블로그를 만든 구성과, 만들면서 겪은 문제를 정리했습니다.
pin: true
image:
  path: /assets/img/posts/hello-blog.png
  alt: 블로그를 열었습니다
---

GitHub Pages에 개발 블로그를 열었습니다. 개발하며 배운 것과 막혔던 문제의 해결 과정을 기록합니다.

## 구성

| 항목 | 선택 |
|---|---|
| 정적 사이트 생성기 | Jekyll |
| 테마 | Chirpy |
| 배포 | GitHub Actions로 빌드하고 GitHub Pages에 게시 |
| 글꼴 | 제목은 Noto Serif KR, 본문은 Pretendard |

글은 `_posts` 폴더에 마크다운 파일을 추가하고 푸시하면 1분 안팎에 반영됩니다.

## 만들면서 겪은 문제

- [Pages 배포 소스를 GitHub Actions로 바꾸기]({% post_url 2026-11-03-pages-source-actions %})
- [Chirpy 다크 모드 색상이 안 바뀔 때]({% post_url 2026-11-03-chirpy-dark-mode %})
- [Jekyll 새 글이 홈에 안 나올 때]({% post_url 2026-11-03-jekyll-future-post %})
- [배포했는데 옛 화면이 보일 때]({% post_url 2026-11-03-pwa-stale-css %})
