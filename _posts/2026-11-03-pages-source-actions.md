---
title: Pages 배포 소스를 GitHub Actions로 바꾸기
date: 2026-11-03 12:10:00 +0900
categories: [블로그 운영, 트러블슈팅]
tags: [github-pages, github-actions, gh-cli]
description: 템플릿으로 만든 저장소의 Pages 배포 소스가 legacy일 때, gh 명령 한 줄로 workflow로 바꾸는 방법입니다.
image:
  path: /assets/img/posts/pages-source.png
  alt: Pages 배포 소스를 GitHub Actions로 바꾸기
---

`gh api -X PUT repos/<계정>/<저장소>/pages -f build_type=workflow` 한 줄이면 Pages 배포 소스가 GitHub Actions로 바뀝니다. 템플릿에서 저장소를 만들면 배포 소스가 `legacy`로 시작하는 경우가 있어서, Actions로 빌드하는 테마라면 먼저 확인해야 합니다.

## 증상

Chirpy 스타터 템플릿으로 저장소를 만들고 첫 커밋을 올리자 워크플로가 두 개 돌았습니다.

| 워크플로 | 역할 |
|---|---|
| `Build and Deploy` | 템플릿에 들어 있는 Actions 빌드 |
| `pages build and deployment` | GitHub Pages가 브랜치를 직접 빌드하는 기본 워크플로 |

두 번째 워크플로가 보인다면 배포 소스가 브랜치 방식으로 되어 있다는 신호입니다.

## 확인

배포 소스는 `build_type` 값으로 확인합니다.

```bash
gh api repos/<계정>/<저장소>/pages --jq '{build_type, source}'
```

이 저장소는 `legacy`와 `main` 브랜치로 나왔습니다.

## 변경

`POST`가 아니라 `PUT`으로 보내야 합니다. Pages가 이미 켜져 있으면 `POST`는 `409 GitHub Pages is already enabled`로 실패합니다.

```bash
gh api -X PUT repos/<계정>/<저장소>/pages -f build_type=workflow
gh api repos/<계정>/<저장소>/pages --jq .build_type   # workflow
```

변경 전에 끝난 워크플로는 새 설정을 반영하지 않으므로 다시 실행합니다.

```bash
gh run list --limit 3
gh run rerun <run-id>
```

> 웹 화면에서는 저장소의 Settings → Pages → Source를 GitHub Actions로 지정하면 같은 결과입니다.
{: .prompt-tip }

## 정리

- 템플릿으로 만든 저장소는 `build_type`부터 확인한다.
- 이미 켜진 Pages는 `PUT`으로 바꾼다.
- 설정을 바꾼 뒤에는 워크플로를 다시 실행하고, 사이트 응답을 `curl`로 확인한다.
