/* 블로그 인터랙션: 홈 히어로 그래프, 명령 팔레트, 카드 스포트라이트 */
(function () {
  'use strict';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  /* 홈 히어로: 블로그 지식 그래프. 글, 카테고리, 태그를 노드로 그리고 끌어 볼 수 있으며, 글 노드를 누르면 글로 이동한다. */
  function initHero() {
    const hero = document.getElementById('ink-hero');
    const dataEl = document.getElementById('ink-graph-data');
    if (!hero || !dataEl || !window.InkGraph) return;
    const cv = hero.querySelector('canvas');
    const ctx = cv.getContext('2d');
    const g = InkGraph.build(JSON.parse(dataEl.textContent));
    const FONT = "'Pretendard Variable', Pretendard, sans-serif";
    let W = 0, H = 0, box = null, alpha = 0.35, raf = 0, onScreen = true, hover = null, drag = null, moved = 0;

    const neighbors = n => new Set(g.links.filter(l => l[0] === n || l[1] === n).flatMap(l => l));
    const boxFor = () => (W < 720 ? { x0: 24, y0: H * 0.46, x1: W - 24, y1: H - 28 } : { x0: W * 0.42, y0: 36, x1: W - 36, y1: H - 36 });

    function resize() {
      const r = hero.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const prev = box;
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      box = boxFor();
      if (!prev) {
        InkGraph.place(g, box);
        InkGraph.settle(g, box);
      } else {
        for (const n of g.nodes) {
          n.x = box.x0 + ((n.x - prev.x0) / (prev.x1 - prev.x0)) * (box.x1 - box.x0);
          n.y = box.y0 + ((n.y - prev.y0) / (prev.y1 - prev.y0)) * (box.y1 - box.y0);
        }
        alpha = 0.2;
      }
      redraw();
    }

    function draw(t) {
      const drift = reduceMotion.matches ? 0 : 3;
      for (const n of g.nodes) {
        n.dx = n.x + Math.sin(t * 0.0008 + n.phase) * drift;
        n.dy = n.y + Math.cos(t * 0.0007 + n.phase * 1.3) * drift;
      }
      const near = hover ? neighbors(hover) : null;
      const lit = n => !near || near.has(n);
      ctx.clearRect(0, 0, W, H);

      for (const [a, b] of g.links) {
        const on = hover && (a === hover || b === hover);
        ctx.strokeStyle = on ? 'rgba(255,228,92,.95)' : `rgba(143,163,255,${near ? 0.1 : 0.32})`;
        ctx.lineWidth = on ? 2 : 1.2;
        ctx.beginPath(); ctx.moveTo(a.dx, a.dy); ctx.lineTo(b.dx, b.dy); ctx.stroke();
      }

      for (const n of g.nodes) {
        ctx.globalAlpha = lit(n) ? 1 : 0.25;
        const on = n === hover;
        if (on) { ctx.fillStyle = 'rgba(255,228,92,.2)'; ctx.beginPath(); ctx.arc(n.dx, n.dy, n.r + 9, 0, 6.2832); ctx.fill(); }
        if (n.type === 'cat') {
          ctx.fillStyle = '#14213d'; ctx.strokeStyle = on ? '#ffe45c' : '#f3f5f8'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(n.dx, n.dy, n.r, 0, 6.2832); ctx.fill(); ctx.stroke();
          ctx.fillStyle = on ? '#ffe45c' : '#8fa3ff'; ctx.beginPath(); ctx.arc(n.dx, n.dy, 3, 0, 6.2832); ctx.fill();
        } else {
          ctx.fillStyle = on ? '#ffe45c' : n.type === 'post' ? '#f3f5f8' : 'rgba(143,163,255,.95)';
          ctx.beginPath(); ctx.arc(n.dx, n.dy, n.r, 0, 6.2832); ctx.fill();
        }

        // 라벨: 글은 제목, 카테고리는 이름, 태그는 #이름. 가장자리 근처 노드는 왼쪽에 쓴다.
        const left = n.dx > W - 200;
        const full = on;
        let text = n.type === 'tag' ? '#' + n.label : n.label;
        if (n.type === 'post' && !full && text.length > 16) text = text.slice(0, 15) + '…';
        ctx.font = `${n.type === 'tag' ? 500 : 600} ${n.type === 'tag' ? 11 : 13}px ${FONT}`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = left ? 'right' : 'left';
        const tx = n.dx + (left ? -(n.r + 8) : n.r + 8);
        if (full) {
          const w = ctx.measureText(text).width;
          ctx.fillStyle = 'rgba(10,16,29,.85)';
          ctx.fillRect(left ? tx - w - 6 : tx - 6, n.dy - 11, w + 12, 22);
        }
        ctx.fillStyle = on ? '#ffe45c' : n.type === 'tag' ? 'rgba(170,180,204,.95)' : '#f3f5f8';
        ctx.fillText(text, tx, n.dy);
        ctx.globalAlpha = 1;
      }
    }

    function step(t) {
      if (alpha > 0.02) { InkGraph.tick(g, { alpha, box }); alpha *= 0.985; }
      draw(t);
      raf = onScreen && !reduceMotion.matches ? requestAnimationFrame(step) : 0;
    }
    const redraw = () => { if (!raf) draw(performance.now()); };
    const start = () => { if (!raf && onScreen && !reduceMotion.matches) raf = requestAnimationFrame(step); };

    const pointer = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    function hit(p) {
      let best = null, bestD = Infinity;
      for (const n of g.nodes) {
        const d = Math.hypot(n.dx - p.x, n.dy - p.y);
        if (d < n.r + (n.type === 'tag' ? 10 : 14) && d < bestD) { best = n; bestD = d; }
      }
      return best;
    }
    const cursor = () => { cv.style.cursor = drag ? 'grabbing' : hover ? (hover.url ? 'pointer' : 'grab') : 'default'; };

    cv.addEventListener('pointermove', e => {
      const p = pointer(e);
      if (drag) {
        moved += Math.abs(e.movementX) + Math.abs(e.movementY);
        drag.x = Math.min(box.x1, Math.max(box.x0, p.x));
        drag.y = Math.min(box.y1, Math.max(box.y0, p.y));
        alpha = 0.35;
      } else {
        hover = hit(p);
      }
      cursor(); redraw();
    });
    cv.addEventListener('pointerdown', e => {
      const n = hit(pointer(e));
      if (!n) return;
      drag = n; hover = n; moved = 0; n.fixed = true;
      cv.setPointerCapture(e.pointerId);
      cursor(); start();
    });
    const release = () => {
      if (!drag) return;
      const n = drag;
      n.fixed = false; drag = null;
      if (moved < 5 && n.url) location.assign(n.url);
      cursor(); start();
    };
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', release);
    cv.addEventListener('pointerleave', () => { if (!drag) { hover = null; cursor(); redraw(); } });

    new ResizeObserver(resize).observe(hero);
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; start(); }).observe(hero);
    reduceMotion.addEventListener('change', () => { redraw(); start(); });
    document.fonts?.ready.then(redraw);
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
    // Chirpy의 전역 Theme.update()를 쓴다. 테마 버튼을 대신 누르는 방식은 동작하지 않았다.
    if (item.mode) window.Theme?.update(item.mode);
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
