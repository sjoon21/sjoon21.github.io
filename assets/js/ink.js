/* 블로그 인터랙션: 홈 히어로 그래프, 명령 팔레트, 카드 스포트라이트 */
(function () {
  'use strict';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  /* 홈 히어로: 노드 그래프. 노란 노드가 커서(없으면 자체 경로)를 따라 움직이고 가까운 노드와 이어진다. */
  function initHero() {
    const hero = document.getElementById('ink-hero');
    if (!hero) return;
    const cv = hero.querySelector('canvas');
    const ctx = cv.getContext('2d');
    const LINK = 120;
    const REACH = 180;
    let w = 0, h = 0, nodes = [], target = null, yellow = { x: 0, y: 0 }, raf = 0, onScreen = true;

    function resize() {
      const r = hero.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(14, Math.round((w * h) / 9000));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      }));
      yellow = { x: w * 0.75, y: h * 0.5 };
      frame(0);
    }

    function frame(t) {
      const animate = !reduceMotion.matches;
      const gx = target ? target.x : w * 0.72 + Math.cos(t * 0.0006) * w * 0.2;
      const gy = target ? target.y : h * 0.5 + Math.sin(t * 0.0011) * h * 0.32;
      yellow.x += (gx - yellow.x) * 0.12;
      yellow.y += (gy - yellow.y) * 0.12;

      if (animate) {
        for (const n of nodes) {
          const dx = yellow.x - n.x, dy = yellow.y - n.y, d = Math.hypot(dx, dy);
          if (d < REACH && d > 1) {
            const pull = (1 - d / REACH) * 0.02;
            n.vx += (dx / d) * pull;
            n.vy += (dy / d) * pull;
          }
          const sp = Math.hypot(n.vx, n.vy);
          if (sp > 0.6) { n.vx *= 0.6 / sp; n.vy *= 0.6 / sp; }
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.2;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(143,163,255,${(1 - d / LINK) * 0.35})`;
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
          }
        }
        const d = Math.hypot(nodes[i].x - yellow.x, nodes[i].y - yellow.y);
        if (d < REACH) {
          ctx.strokeStyle = `rgba(255,228,92,${(1 - d / REACH) * 0.8})`;
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(yellow.x, yellow.y); ctx.stroke();
        }
      }
      ctx.lineWidth = 1.5;
      for (const n of nodes) {
        ctx.fillStyle = '#14213d'; ctx.strokeStyle = 'rgba(243,245,248,.85)';
        ctx.beginPath(); ctx.arc(n.x, n.y, 3, 0, 6.2832); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,228,92,.18)';
      ctx.beginPath(); ctx.arc(yellow.x, yellow.y, 16, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#ffe45c';
      ctx.beginPath(); ctx.arc(yellow.x, yellow.y, 6, 0, 6.2832); ctx.fill();

      raf = animate && onScreen ? requestAnimationFrame(frame) : 0;
    }

    const start = () => { if (!raf && onScreen && !reduceMotion.matches) raf = requestAnimationFrame(frame); };
    new ResizeObserver(resize).observe(hero);
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; start(); }).observe(hero);
    reduceMotion.addEventListener('change', () => { frame(0); start(); });
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      target = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    ['pointerleave', 'pointercancel'].forEach(ev => hero.addEventListener(ev, () => { target = null; }));
    resize();
    start();
  }

  /* 명령 팔레트: Ctrl/⌘ K로 열어 글 검색, 페이지 이동, 테마 전환을 한다. */
  // shortcut: baseurl이 빈 값일 때만 맞다. 프로젝트 사이트(/저장소명)로 바꾸면 BASE를 수정한다.
  const BASE = '';
  const PAGES = [['홈', '/'], ['카테고리', '/categories/'], ['태그', '/tags/'], ['아카이브', '/archives/'], ['정보', '/about/']];
  const THEMES = [['라이트', 'light'], ['다크', 'dark'], ['시스템', 'system']];
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  let posts = null, failed = false, el = null, results = [], index = 0, lastFocus = null;

  function entries() {
    return [
      ...(posts || []).map(p => ({ kind: '글', title: p.title, sub: p.categories, url: p.url, hay: [[p.title, 3], [p.tags, 2], [p.categories, 2], [p.content, 1]] })),
      ...PAGES.map(([t, u]) => ({ kind: '페이지', title: t, url: BASE + u, hay: [[t, 3]] })),
      ...THEMES.map(([t, m]) => ({ kind: '동작', title: '테마: ' + t, mode: m, hay: [['테마 ' + t + ' theme ' + m, 3]] })),
    ];
  }

  function search(query) {
    const all = entries();
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [...all.filter(e => e.kind === '글').slice(0, 5), ...all.filter(e => e.kind !== '글')];
    return all
      .map(e => {
        let score = 0;
        for (const tk of tokens) {
          const s = e.hay.reduce((acc, [text, wt]) => acc + ((text || '').toLowerCase().includes(tk) ? wt : 0), 0);
          if (!s) return null;
          score += s;
        }
        return { e, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(x => x.e);
  }

  function build() {
    el = document.createElement('div');
    el.className = 'ink-pal';
    el.hidden = true;
    el.innerHTML = '<div class="ink-pal__panel" role="dialog" aria-modal="true" aria-label="글 검색과 이동">' +
      '<input class="ink-pal__input" type="text" role="combobox" aria-expanded="true" aria-controls="ink-pal-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="글 제목, 태그, 페이지 이름">' +
      '<ul class="ink-pal__list" id="ink-pal-list" role="listbox"></ul>' +
      '<div class="ink-pal__foot">↑↓ 이동, Enter 열기, Esc 닫기</div></div>';
    document.body.appendChild(el);
    const input = el.querySelector('input');
    el.addEventListener('mousedown', e => { if (e.target === el) { e.preventDefault(); close(); } });
    input.addEventListener('input', () => { index = 0; render(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { index = Math.min(index + 1, results.length - 1); render(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { index = Math.max(index - 1, 0); render(); e.preventDefault(); }
      else if (e.key === 'Enter') { if (results[index]) run(results[index]); e.preventDefault(); }
      else if (e.key === 'Escape') { close(); e.preventDefault(); }
      else if (e.key === 'Tab') e.preventDefault();
    });
  }

  function render() {
    const input = el.querySelector('input');
    const list = el.querySelector('ul');
    results = search(input.value);
    list.textContent = '';
    if (failed) {
      const li = document.createElement('li');
      li.className = 'ink-pal__empty';
      li.textContent = '글 목록을 불러오지 못했습니다. 페이지 이동과 테마 전환은 사용할 수 있습니다.';
      list.appendChild(li);
    }
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'ink-pal__empty';
      li.textContent = '일치하는 항목이 없습니다. 다른 단어로 검색해 보세요.';
      list.appendChild(li);
    }
    results.forEach((r, i) => {
      const li = document.createElement('li');
      li.id = 'ink-pal-' + i;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === index ? 'true' : 'false');
      const main = document.createElement('span');
      main.className = 'ink-pal__main';
      main.textContent = r.title;
      if (r.sub) { const sub = document.createElement('small'); sub.textContent = r.sub; main.appendChild(sub); }
      const kind = document.createElement('span');
      kind.className = 'ink-pal__kind';
      kind.textContent = r.kind;
      li.append(main, kind);
      li.addEventListener('mousemove', () => { if (index !== i) { index = i; render(); } });
      li.addEventListener('click', () => run(r));
      list.appendChild(li);
    });
    input.setAttribute('aria-activedescendant', results.length ? 'ink-pal-' + index : '');
    const active = list.querySelector('[aria-selected=true]');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function run(item) {
    close();
    if (item.mode) document.querySelector('[data-theme-mode="' + item.mode + '"]')?.click();
    else location.assign(item.url);
  }

  function open() {
    if (!el) build();
    if (!el.hidden) return;
    lastFocus = document.activeElement;
    el.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    const input = el.querySelector('input');
    input.value = '';
    index = 0;
    render();
    input.focus();
    if (!posts && !failed) {
      fetch(BASE + '/assets/js/data/search.json')
        .then(r => r.json())
        .then(d => { posts = d; })
        .catch(() => { failed = true; })
        .finally(() => { if (!el.hidden) render(); });
    }
  }

  function close() {
    if (!el || el.hidden) return;
    el.hidden = true;
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); el && !el.hidden ? close() : open(); }
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-ink-open-palette]')) open(); });
  document.querySelectorAll('.ink-kbd').forEach(k => { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });

  /* 카드 스포트라이트: 마우스 위치를 CSS 변수로 넘겨 카드 위에 은은한 빛을 얹는다. */
  const list = document.getElementById('post-list');
  if (list) {
    list.addEventListener('pointermove', e => {
      const card = e.target.closest('.card-wrapper');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', e.clientX - r.left + 'px');
      card.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  }

  initHero();
})();
