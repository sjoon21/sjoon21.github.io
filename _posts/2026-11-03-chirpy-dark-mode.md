---
title: Chirpy 다크 모드 색상이 안 바뀔 때
date: 2026-11-03 12:20:00 +0900
categories: [블로그 운영, 트러블슈팅]
tags: [chirpy, jekyll, css, dark-mode]
description: Chirpy 7.6에서 색상 변수를 덮어썼는데 다크 모드에 적용되지 않은 원인은 선택자 우선순위였습니다.
image:
  path: /assets/img/posts/chirpy-dark-mode.png
  alt: Chirpy 다크 모드 색상이 안 바뀔 때
---

Chirpy 7.6의 색상 변수는 `:root[data-bs-theme=...]` 선택자에 정의되어 있습니다. 같은 형태의 선택자로 덮어써야 적용됩니다. 저는 `html[data-mode=...]`로 썼다가 다크 모드 배경이 기본 회색(`rgb(27 27 30)`) 그대로 남았습니다.

## 원인 찾기

배포된 CSS를 내려받아 `--main-bg`가 어떤 선택자에 선언되어 있는지 찾았습니다.

```bash
curl -s https://<계정>.github.io/assets/css/jekyll-theme-chirpy.css \
  | grep -oE '[^{}]*\{[^{}]*--main-bg:[^;}]*'
```

테마가 쓰는 선택자는 다음과 같았습니다.

| 선택자 | 값 |
|---|---|
| `:root[data-bs-theme=light]` | `white` |
| `:root[data-bs-theme=dark]` | `rgb(27 27 30)` |
| `:root:not([data-bs-theme])` | 라이트는 `white`, 시스템 다크 설정(`prefers-color-scheme`)이면 `rgb(27 27 30)` |

`:root:not([data-bs-theme])`의 우선순위는 `(0,2,0)`입니다. 제가 쓴 `html:not([data-mode])`는 `(0,1,1)`이라서 밀렸습니다.

## 직접 비교해 보기

아래 계산기에서 두 선택자의 우선순위를 비교할 수 있습니다. 처음 들어 있는 값이 이 글의 두 선택자입니다.

{% include specificity-demo.html %}

## 해결

테마와 같은 선택자를 같은 순서로 씁니다. 라이트, 시스템 다크, 수동 다크 순서입니다.

```scss
:root:not([data-bs-theme]),
:root[data-bs-theme='light'] {
  @include light-ink;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-bs-theme]) {
    @include dark-ink;
  }
}

:root[data-bs-theme='dark'] {
  @include dark-ink;
}
```

## 같이 만난 두 가지

**라이트에만 지정한 변수는 다크에서 기본값으로 돌아갑니다.** 테마의 다크 블록이 변수를 전부 다시 선언하기 때문입니다. 사이드바 색상을 라이트 블록에만 넣었더니 다크에서 사이트 제목이 회색으로 남았습니다. 라이트와 다크 양쪽에 모두 넣어야 합니다.

**요소에 어떤 규칙이 적용되는지는 브라우저 콘솔에서 찾을 수 있습니다.** 글 설명(`.post-desc`)의 글꼴이 바뀌지 않아서 아래 코드로 확인했습니다. 테마는 `header .post-desc`를 쓰고 있었고, 제가 쓴 `.post-desc`보다 우선순위가 높았습니다.

```js
const el = document.querySelector('.post-desc');
for (const sheet of document.styleSheets) {
  for (const rule of sheet.cssRules) {
    if (rule.selectorText && el.matches(rule.selectorText)) {
      console.log(rule.selectorText, rule.style.fontFamily);
    }
  }
}
```

> CSS가 적용되지 않을 때는 값을 바꿔 보기 전에 선택자의 우선순위부터 비교하면 시간이 줄어듭니다.
{: .prompt-tip }
