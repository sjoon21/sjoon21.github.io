---
title: Jekyll 새 글이 홈에 안 나올 때
date: 2026-11-03 12:30:00 +0900
categories: [블로그 운영, 트러블슈팅]
tags: [jekyll, github-actions, timezone]
description: 배포는 성공했는데 홈이 비어 있다면 글의 date가 빌드 시각보다 미래인지 확인하세요.
image:
  path: /assets/img/posts/jekyll-future-post.png
  alt: Jekyll 새 글이 홈에 안 나올 때
---

Jekyll은 빌드 시각보다 미래 날짜의 글을 건너뜁니다. 배포가 성공했는데 글이 보이지 않는다면 front matter의 `date`가 빌드 시각보다 늦은지 먼저 확인합니다.

## 증상

- Actions 빌드와 배포는 모두 `success`였습니다.
- 사이트는 열리는데 홈의 글 목록이 비어 있었습니다.
- 응답 HTML에서 글 주소를 찾아도 없었습니다.

```bash
curl -s https://<계정>.github.io/ | grep -c 'hello-blog'   # 0
```

## 원인

글의 `date`는 `2026-11-03 14:00:00 +0900`이었습니다. 워크플로가 실행된 시각은 `04:32 UTC`, 한국 시간으로 13:32였습니다. 글이 28분 뒤 날짜였으므로 Jekyll이 빌드에서 제외했습니다.

| 항목 | 시각(KST) |
|---|---|
| 글의 `date` | 14:00 |
| 빌드 시각 | 13:32 |

Actions 러너는 UTC로 동작하고, 글의 날짜에는 `+0900`을 붙였기 때문에 같은 기준으로 비교한 결과입니다.

## 해결

글의 `date`를 빌드 시각보다 이전으로 고칩니다.

```yaml
date: 2026-11-03 12:00:00 +0900
```

수정 후 다시 푸시하면 글이 목록에 나타납니다.

## 예방

- 시각을 정확히 모를 때는 `date`에 현재보다 이른 시각을 적습니다.
- 예약 글을 로컬에서 미리 보려면 `--future` 옵션을 붙입니다.

```bash
bundle exec jekyll serve --future
```

> 바로 발행할 글이라면 `date`의 시각을 현재보다 이르게 적는 편이 안전합니다.
{: .prompt-info }
