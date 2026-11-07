"use strict";
/* 場面ごとの背景（SVG）。星環＝青空を横切る幾重もの細い光の帯 */
const Scenes = (() => {
  const W = 1600, H = 1000;
  let seed = 7;
  const r = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const R = (a, b) => a + r() * (b - a);

  function sky(id, top, mid, bot) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${bot}"/></linearGradient>`;
  }
  function ring(y, op) {
    let s = "";
    for (let k = 0; k < 7; k++) s += `<path d="M-100 ${y + k * 11} Q800 ${y - 230 + k * 11} 1700 ${y - 60 + k * 11}" fill="none" stroke="rgba(255,246,222,${op * (0.35 + (k % 3) * 0.25)})" stroke-width="${1 + (k % 3)}"/>`;
    return `<g class="ring">${s}</g>`;
  }
  function stars(n, maxY) {
    let s = ""; for (let i = 0; i < n; i++) s += `<circle cx="${R(0, W)}" cy="${R(0, maxY)}" r="${R(0.6, 1.8)}" fill="#fff" opacity="${R(0.3, 0.9)}"/>`; return s;
  }
  function hills(y, amp, col, step = 120) {
    let d = `M0 ${H} L0 ${y}`;
    for (let x = 0; x <= W + step; x += step) d += ` Q${x + step / 2} ${y - R(0, amp)} ${x + step} ${y + R(-amp / 3, amp / 3)}`;
    return `<path d="${d} L${W} ${H} Z" fill="${col}"/>`;
  }
  function trees(n, y0, y1, col, sMin, sMax) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = R(-40, W + 40), y = R(y0, y1), sc = R(sMin, sMax);
      s += `<g transform="translate(${x} ${y}) scale(${sc})" fill="${col}"><rect x="-6" y="-10" width="12" height="60"/><path d="M0 -190 L60 -40 L30 -40 L80 20 L-80 20 L-30 -40 L-60 -40 Z"/></g>`;
    }
    return s;
  }
  function clouds(n, y, op) {
    let s = ""; for (let i = 0; i < n; i++) { const x = R(0, W), yy = y + R(-40, 40), w = R(120, 260); s += `<ellipse cx="${x}" cy="${yy}" rx="${w}" ry="${w * 0.22}" fill="#fff" opacity="${op}"/>`; } return s;
  }
  function town(y, col, lit) {
    let s = "", x = -20;
    while (x < W) {
      const w = R(70, 150), h = R(80, 200);
      s += `<rect x="${x}" y="${y - h}" width="${w}" height="${h + 400}" fill="${col}"/><path d="M${x - 10} ${y - h} L${x + w / 2} ${y - h - R(40, 90)} L${x + w + 10} ${y - h} Z" fill="${col}"/>`;
      if (lit) for (let k = 0; k < 3; k++) if (r() < 0.6) s += `<rect x="${x + R(10, w - 24)}" y="${y - h + R(20, h - 20)}" width="12" height="16" fill="#ffd38a" opacity="${R(0.6, 1)}"/>`;
      x += w + R(-10, 20);
    }
    return s;
  }

  const make = {
    workshop() {
      seed = 11;
      let shelves = "";
      for (let k = 0; k < 4; k++) {
        const y = 260 + k * 150;
        shelves += `<rect x="40" y="${y}" width="360" height="14" fill="#4a3020"/><rect x="1200" y="${y}" width="360" height="14" fill="#4a3020"/>`;
        for (let b = 0; b < 7; b++) {
          const cols = ["#d9613f", "#3f86c9", "#4aa58a", "#8a63c9", "#e0b04a"];
          const c = cols[Math.floor(R(0, 5))], h = R(40, 90), bx = 60 + b * 48, cx = 1220 + b * 48;
          shelves += `<rect x="${bx}" y="${y - h}" width="30" height="${h}" rx="8" fill="${c}" opacity=".75"/><rect x="${cx}" y="${y - h}" width="30" height="${h}" rx="8" fill="${cols[(b + k) % 5]}" opacity=".75"/>`;
        }
      }
      return `<defs>${sky("ws", "#3a2a22", "#5a3e2c", "#2a1c16")}<radialGradient id="wl" cx=".5" cy=".3" r=".6"><stop offset="0" stop-color="#ffe7b0" stop-opacity=".55"/><stop offset="1" stop-color="#ffe7b0" stop-opacity="0"/></radialGradient>${sky("wsk", "#7fb2e6", "#bfe0f6", "#f6e9c8")}</defs>
        <rect width="${W}" height="${H}" fill="url(#ws)"/>
        <rect x="560" y="90" width="480" height="380" rx="8" fill="url(#wsk)"/>${`<g transform="translate(560 90)"><clipPath id="wc"><rect width="480" height="380"/></clipPath><g clip-path="url(#wc)">${ring(260, 0.9).replace(/M-100/g, "M-50").replace(/Q800/g, "Q240").replace(/1700/g, "560")}</g></g>`}
        <rect x="552" y="82" width="496" height="396" rx="10" fill="none" stroke="#3a2416" stroke-width="16"/><rect x="796" y="90" width="10" height="380" fill="#3a2416"/><rect x="560" y="276" width="480" height="10" fill="#3a2416"/>
        <path d="M560 470 L420 1000 L1180 1000 L1040 470 Z" fill="url(#wl)"/>
        ${shelves}
        <rect x="0" y="820" width="${W}" height="180" fill="#2a1a10"/>
        <g transform="translate(800 820)"><ellipse cx="0" cy="40" rx="230" ry="40" fill="#000" opacity=".35"/><path d="M-190 -120 Q-210 60 0 70 Q210 60 190 -120 Z" fill="#2a2420"/><ellipse cx="0" cy="-120" rx="195" ry="34" fill="#3d342e"/><ellipse cx="0" cy="-122" rx="165" ry="24" fill="#6aa86a" opacity=".8"/><circle cx="-40" cy="-130" r="10" fill="#bfe6a6" opacity=".7"/><circle cx="30" cy="-128" r="7" fill="#bfe6a6" opacity=".7"/></g>`;
    },
    forest() {
      seed = 21;
      return `<defs>${sky("fs", "#6fa8d8", "#a9d4c8", "#e8f0c8")}<linearGradient id="fl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c8" stop-opacity=".5"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#fs)"/>${ring(330, 0.8)}
        ${hills(560, 60, "#7fae8a")}${trees(26, 560, 620, "#5a8a64", 0.9, 1.3)}${hills(680, 50, "#4f7d52")}${trees(20, 700, 760, "#3c6542", 1.3, 1.9)}
        <path d="M200 0 L700 0 L1200 1000 L500 1000 Z" fill="url(#fl)"/>${hills(860, 40, "#2f4f33")}${trees(10, 900, 1000, "#22382a", 2.2, 3)}`;
    },
    river() {
      seed = 31;
      return `<defs>${sky("rs", "#5e9ad6", "#a8d0ee", "#eef4f0")}<linearGradient id="rw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc4e6"/><stop offset="1" stop-color="#3f86c9"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#rs)"/>${ring(300, 0.85)}${clouds(5, 200, 0.6)}
        ${hills(540, 80, "#8aa6b8", 160)}${hills(620, 50, "#7a9a6a")}
        <path d="M700 620 Q560 760 300 1000 L1300 1000 Q960 760 900 620 Z" fill="url(#rw)"/>
        <path d="M760 650 Q700 800 560 1000" stroke="#fff" stroke-opacity=".35" stroke-width="6" fill="none"/><path d="M860 660 Q900 820 1040 1000" stroke="#fff" stroke-opacity=".3" stroke-width="4" fill="none"/>
        ${[...Array(14)].map(() => `<ellipse cx="${R(0, W)}" cy="${R(880, 990)}" rx="${R(20, 60)}" ry="${R(10, 26)}" fill="#9a9488"/>`).join("")}`;
    },
    hill() {
      seed = 41;
      return `<defs>${sky("hs", "#4a86c8", "#9cc8ea", "#f3e6c0")}</defs>
        <rect width="${W}" height="${H}" fill="url(#hs)"/>${ring(340, 0.95)}${clouds(7, 220, 0.7)}
        ${hills(640, 120, "#9fc27a", 220)}${hills(760, 80, "#7fae5a", 200)}
        <g transform="translate(1180 560)"><rect x="-10" y="0" width="20" height="200" fill="#6a4a30"/><g class="mill" fill="#e8dcc0">${[0, 90, 180, 270].map(a => `<rect x="-8" y="-150" width="16" height="150" transform="rotate(${a})"/>`).join("")}</g></g>
        ${[...Array(30)].map(() => `<circle cx="${R(0, W)}" cy="${R(780, 1000)}" r="${R(4, 9)}" fill="${["#fff", "#f6d36a", "#f0a0b8"][Math.floor(R(0, 3))]}"/>`).join("")}`;
    },
    mine() {
      seed = 51;
      return `<defs>${sky("ms", "#3a3a4a", "#6a5a50", "#2a2018")}<radialGradient id="mg" cx=".5" cy=".55" r=".4"><stop offset="0" stop-color="#ffb860" stop-opacity=".55"/><stop offset="1" stop-color="#ffb860" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#ms)"/>
        <path d="M0 0 L${W} 0 L${W} 260 Q1200 340 800 300 Q400 340 0 260 Z" fill="#1e1812"/>
        <path d="M560 1000 L640 420 Q800 340 960 420 L1040 1000 Z" fill="#120d0a"/><rect width="${W}" height="${H}" fill="url(#mg)"/>
        <rect x="600" y="400" width="24" height="600" fill="#5a3a22"/><rect x="976" y="400" width="24" height="600" fill="#5a3a22"/><rect x="590" y="392" width="420" height="26" fill="#6a4a2a"/>
        <path d="M700 1000 L780 520 M900 1000 L820 520" stroke="#8a7a6a" stroke-width="6"/>
        ${[...Array(12)].map(() => `<path d="M${R(0, W)} ${R(600, 1000)} l${R(10, 30)} ${-R(20, 50)} l${R(10, 30)} ${R(20, 50)} z" fill="${["#7fd0ff", "#c09aff", "#ffd36a"][Math.floor(R(0, 3))]}" opacity=".75"/>`).join("")}
        <circle cx="660" cy="470" r="14" fill="#ffd38a"/><circle cx="940" cy="470" r="14" fill="#ffd38a"/>`;
    },
    lake() {
      seed = 61;
      return `<defs>${sky("ls", "#0b1230", "#26356a", "#4a5aa0")}<linearGradient id="lw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3a7a"/><stop offset="1" stop-color="#0e1636"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#ls)"/>${stars(160, 560)}${ring(380, 1)}
        ${hills(600, 70, "#1a2246", 180)}<rect y="610" width="${W}" height="390" fill="url(#lw)"/>
        <g opacity=".45" transform="translate(0 1220) scale(1 -1)">${ring(380, 0.8)}</g>
        ${[...Array(26)].map(() => `<circle cx="${R(0, W)}" cy="${R(640, 980)}" r="${R(1, 3)}" fill="#cfe0ff" opacity="${R(0.4, 0.9)}"/>`).join("")}
        ${[...Array(9)].map(() => `<circle cx="${R(100, W - 100)}" cy="${R(500, 900)}" r="4" fill="#fff6c0" class="firefly"/>`).join("")}`;
    },
    shop() {
      seed = 71;
      return `<defs>${sky("ss", "#2d2e5e", "#b8606a", "#f2b46a")}</defs><rect width="${W}" height="${H}" fill="url(#ss)"/>${stars(40, 300)}${ring(360, 0.8)}${town(860, "#2a1f36", true)}`;
    },
    night() {
      seed = 81;
      return `<defs>${sky("ns", "#060b1e", "#141f48", "#2c3d70")}</defs>
        <rect width="${W}" height="${H}" fill="url(#ns)"/>${stars(220, 700)}${ring(360, 1)}
        <circle cx="1280" cy="180" r="56" fill="#fff6dc"/><circle cx="1300" cy="168" r="52" fill="#141f48" opacity=".2"/>
        ${town(780, "#0e1328", true)}${town(900, "#080b1a", true)}`;
    },
    title() {
      seed = 91;
      return `<defs>${sky("ts", "#1b2a4a", "#4a6fa5", "#d9a56a")}</defs><rect width="${W}" height="${H}" fill="url(#ts)"/>${stars(120, 500)}${ring(420, 1)}${hills(780, 60, "#22304e", 200)}${town(880, "#141b30", true)}`;
    },
  };

  const cache = {};
  return {
    show(kind) {
      const el = document.getElementById("scene");
      if (!el || el.dataset.kind === kind) return;
      el.dataset.kind = kind;
      cache[kind] = cache[kind] || `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${make[kind] ? make[kind]() : make.title()}</svg>`;
      el.innerHTML = cache[kind];
    },
  };
})();
