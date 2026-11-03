---
title: 배포했는데 옛 화면이 보일 때
date: 2026-11-03 12:40:00 +0900
categories: [블로그 운영, 트러블슈팅]
tags: [chirpy, pwa, service-worker, cache]
description: 서버에는 새 CSS가 있는데 브라우저가 옛 화면을 보여준다면 Chirpy의 PWA 서비스 워커 캐시를 의심하세요.
image:
  path: /assets/img/posts/pwa-stale-css.png
  alt: 배포했는데 옛 화면이 보일 때
---

서버의 CSS는 새 버전인데 브라우저가 옛 화면을 보여준다면 서비스 워커 캐시가 원인일 수 있습니다. Chirpy는 PWA 오프라인 캐시가 기본으로 켜져 있어서, 배포 직후 방문에서 이전 CSS가 나옵니다. 스타일을 계속 고치는 동안에는 `pwa.cache.enabled`를 `false`로 두는 편이 편합니다.

## 증상

- 푸시와 배포는 성공했습니다.
- `curl`로 받은 CSS에는 새 규칙이 있었습니다.
- 브라우저에서는 강력 새로고침(`Cmd+Shift+R`)을 한 페이지만 새 스타일이 보였습니다.
- 링크를 눌러 이동하면 다시 옛 스타일이었습니다.

## 확인

브라우저 콘솔에서 서비스 워커와 캐시가 있는지 보고, 페이지가 받은 CSS와 서버의 CSS를 비교합니다.

```js
const regs = await navigator.serviceWorker.getRegistrations();
const link = [...document.querySelectorAll('link[rel=stylesheet]')]
  .map(l => l.href).find(h => h.includes('chirpy'));

({
  workers: regs.length,
  caches: await caches.keys(),                       // ['chirpy-<빌드 시각>']
  fromPage: (await fetch(link).then(r => r.text())).includes('새로 추가한 값'),
  fromNetwork: (await fetch(link, { cache: 'no-store' }).then(r => r.text())).includes('새로 추가한 값'),
});
```

`fromPage`는 `false`이고 `fromNetwork`는 `true`였습니다. 페이지는 캐시에 있던 옛 CSS를 받았다는 뜻입니다.

## 원인

서비스 워커가 정적 파일을 캐시에서 먼저 꺼냅니다. 캐시 이름은 `chirpy-<빌드 시각>` 형태라서 배포할 때마다 새로 생기지만, 이전 워커가 살아 있는 동안은 이전 캐시가 응답합니다.

## 해결

`_config.yml`에서 오프라인 캐시만 끕니다. 홈 화면에 설치하는 PWA 기능은 그대로 둡니다.

```yaml
pwa:
  enabled: true
  cache:
    enabled: false
```

이미 방문한 브라우저에는 이전 워커가 남아 있습니다. 이 워커는 새 워커로 교체될 때까지 옛 화면을 한두 번 더 보여줄 수 있습니다. 바로 정리하려면 콘솔에서 지웁니다.

```js
for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
for (const k of await caches.keys()) await caches.delete(k);
```

> 디자인을 고치는 중이라면 오프라인 캐시를 끄고, 안정된 뒤에 다시 켤지 판단하면 됩니다.
{: .prompt-tip }
