/* CSS 선택자 우선순위 [id, 클래스·속성·의사 클래스, 요소·의사 요소]를 계산한다. */
(function (root) {
  'use strict';

  // 괄호 안쪽 문자열을 균형 잡힌 짝까지 잘라낸다.
  function balanced(str, open) {
    let depth = 0;
    for (let i = open; i < str.length; i++) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')' && --depth === 0) return i;
    }
    return -1;
  }

  // 최상위 쉼표로 선택자 목록을 나눈다.
  function splitList(str) {
    const out = [];
    let depth = 0, start = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '(' || str[i] === '[') depth++;
      else if (str[i] === ')' || str[i] === ']') depth--;
      else if (str[i] === ',' && depth === 0) { out.push(str.slice(start, i)); start = i + 1; }
    }
    out.push(str.slice(start));
    return out;
  }

  const max = (a, b) => (cmp(a, b) >= 0 ? a : b);
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

  function cmp(a, b) {
    for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
    return 0;
  }

  function specificity(selector) {
    let s = String(selector).replace(/\/\*[\s\S]*?\*\//g, '').replace(/"[^"]*"|'[^']*'/g, '""');
    let total = [0, 0, 0];

    // :not(), :is(), :has()는 인자 중 가장 높은 값, :where()는 0이다. 그 외 함수형 의사 클래스는 클래스와 같다.
    for (;;) {
      const m = /:([a-zA-Z-]+)\(/.exec(s);
      if (!m) break;
      const open = m.index + m[0].length - 1;
      const close = balanced(s, open);
      if (close < 0) throw new Error('괄호가 닫히지 않았습니다');
      const name = m[1].toLowerCase();
      const inner = s.slice(open + 1, close);
      if (name === 'where') {
        // 값을 더하지 않는다.
      } else if (name === 'not' || name === 'is' || name === 'has' || name === 'matches') {
        total = add(total, splitList(inner).map(specificity).reduce(max, [0, 0, 0]));
      } else if (name === 'nth-child' || name === 'nth-last-child') {
        const of = /\sof\s([\s\S]+)$/.exec(inner);
        total = add(total, [0, 1, 0]);
        if (of) total = add(total, splitList(of[1]).map(specificity).reduce(max, [0, 0, 0]));
      } else {
        total = add(total, [0, 1, 0]);
      }
      s = s.slice(0, m.index) + ' ' + s.slice(close + 1);
    }

    const count = (re, w) => { s = s.replace(re, () => { total = add(total, w); return ' '; }); };
    count(/\[[^\]]*\]/g, [0, 1, 0]);                                  // 속성
    count(/#[^\s.#:[>+~,]+/g, [1, 0, 0]);                              // id
    count(/::[a-zA-Z-]+|:(?:before|after|first-line|first-letter)\b/g, [0, 0, 1]); // 의사 요소
    count(/\.[^\s.#:[>+~,]+/g, [0, 1, 0]);                             // 클래스
    count(/:[a-zA-Z-]+/g, [0, 1, 0]);                                  // 의사 클래스
    s.split(/[\s>+~|,]+/).forEach(t => { if (t && t !== '*') total = add(total, [0, 0, 1]); }); // 요소

    return total;
  }

  const api = { specificity, compare: cmp };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.InkSpecificity = api;
})(typeof window !== 'undefined' ? window : globalThis);
