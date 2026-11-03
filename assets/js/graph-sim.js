/* 블로그 지식 그래프: 글, 카테고리, 태그를 노드로 만들고 힘 기반으로 배치한다. 화면 그리기는 ink.js가 맡는다. */
(function (root) {
  'use strict';

  const slug = s => String(s).trim().toLowerCase().replace(/\s+/g, '-');

  // data.posts: [{t: 제목, u: 주소, c: [카테고리], g: [태그]}]
  function build(data) {
    const nodes = [], links = [], byKey = new Map();
    const add = (key, type, label, url) => {
      if (!byKey.has(key)) {
        const n = { key, type, label, url, x: 0, y: 0, vx: 0, vy: 0, deg: 0, fixed: false, phase: byKey.size * 1.7 };
        byKey.set(key, n);
        nodes.push(n);
      }
      return byKey.get(key);
    };
    for (const p of data.posts) {
      const post = add('p:' + p.u, 'post', p.t, p.u);
      for (const c of p.c || []) links.push([post, add('c:' + c, 'cat', c, null), 'c']);
      for (const g of p.g || []) links.push([post, add('t:' + g, 'tag', g, '/tags/' + slug(g) + '/'), 't']);
    }
    for (const [a, b] of links) { a.deg++; b.deg++; }
    for (const n of nodes) n.r = n.type === 'post' ? 6 + Math.min(n.deg, 6) * 0.5 : n.type === 'cat' ? 8 : 3.5;
    return { nodes, links };
  }

  // 같은 입력이면 같은 초기 배치가 나오도록 시드를 쓴다.
  function prng(seed) {
    return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  }

  // box: 그래프가 머물 영역 {x0, y0, x1, y1}
  function place(g, box) {
    const rnd = prng(7);
    const cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2;
    const rx = (box.x1 - box.x0) / 2, ry = (box.y1 - box.y0) / 2;
    for (const n of g.nodes) {
      const ang = rnd() * Math.PI * 2;
      const k = (n.type === 'cat' ? 0.25 : n.type === 'post' ? 0.55 : 0.85) * (0.8 + rnd() * 0.4);
      n.x = cx + Math.cos(ang) * rx * k;
      n.y = cy + Math.sin(ang) * ry * k;
      n.vx = n.vy = 0;
    }
  }

  function tick(g, o) {
    const { alpha, box } = o;
    const s = Math.max(0.5, Math.min(1.3, Math.min(box.x1 - box.x0, (box.y1 - box.y0) * 1.6) / 700));
    const cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2;
    const N = g.nodes;
    for (let i = 0; i < N.length; i++) {
      for (let j = i + 1; j < N.length; j++) {
        const a = N[i], b = N[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        const d2 = Math.max(dx * dx + dy * dy, 100), d = Math.sqrt(d2);
        const f = (11000 * s * s * (a.type === 'tag' && b.type === 'tag' ? 0.6 : 1)) / d2 * alpha;
        dx /= d; dy /= d;
        a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
      }
    }
    for (const [a, b, kind] of g.links) {
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(Math.hypot(dx, dy), 1);
      const f = (d - (kind === 'c' ? 160 : 105) * s) * 0.06 * alpha;
      a.vx += (dx / d) * f; a.vy += (dy / d) * f; b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
    }
    for (const n of N) {
      if (n.fixed) { n.vx = n.vy = 0; continue; }
      n.vx += (cx - n.x) * 0.003 * alpha;
      n.vy += (cy - n.y) * 0.005 * alpha;
      n.vx *= 0.78; n.vy *= 0.78;
      n.x = Math.min(box.x1, Math.max(box.x0, n.x + n.vx));
      n.y = Math.min(box.y1, Math.max(box.y0, n.y + n.vy));
    }
  }

  function settle(g, box, steps = 400) {
    for (let i = 0; i < steps; i++) tick(g, { alpha: Math.max(0.02, 1 - i / (steps * 0.75)), box });
  }

  const api = { build, place, tick, settle };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.InkGraph = api;
})(typeof window !== 'undefined' ? window : globalThis);
