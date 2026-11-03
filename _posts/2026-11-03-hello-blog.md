---
title: 블로그를 열었습니다
date: 2026-11-03 14:00:00 +0900
categories: [블로그]
tags: [github-pages, jekyll, chirpy]
description: GitHub Pages와 Chirpy 테마로 개발 블로그를 만든 과정을 정리했습니다.
---

GitHub Pages에 개발 블로그를 열었습니다. 구성은 아래와 같습니다.

- 정적 사이트 생성기: Jekyll
- 테마: Chirpy
- 배포: GitHub Actions로 빌드하고 GitHub Pages에 게시

글은 `_posts` 폴더에 마크다운 파일을 추가하고 push하면 약 1분 뒤에 반영됩니다.

## 코드 블록 확인

```python
def greet(name: str) -> str:
    return f"안녕하세요, {name}님"
```

본문에서 `인라인 코드`는 이렇게 표시됩니다.

> 인용문은 이런 모양입니다.
