"use strict";
/*
  夕方のお店：3D の部屋に、2D の立ち絵のお客さんが入ってくる。
  three.js が使えないときは、CSS だけの簡単な部屋にする。
*/
const Shop3D = (() => {
  let ok = false, renderer, scene, camera, clock, root, raf = 0;
  const actors = {};          // id -> { mesh, shadow, h }
  const flick = [];           // ゆらぐ灯り
  let motes;                  // 光のちり
  let look = { x: 0, y: 0 };  // カメラのゆれ
  let portrait = false;
  let fb = null;              // CSS の代わり

  /* ---------- 手描き風テクスチャ ---------- */
  function canvasTex(w, h, draw, rep) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    t.anisotropy = 4;
    return t;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  function planks(g, w, h, base) {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const y = i * h / n, l = rnd(-12, 12);
      g.fillStyle = `hsl(${base[0] + rnd(-4, 4)},${base[1]}%,${base[2] + l / 3}%)`;
      g.fillRect(0, y, w, h / n);
      for (let k = 0; k < 40; k++) {
        g.strokeStyle = `rgba(40,20,10,${rnd(0.03, 0.09)})`; g.lineWidth = rnd(0.5, 2);
        g.beginPath(); const yy = y + rnd(2, h / n - 2); g.moveTo(0, yy);
        g.bezierCurveTo(w * 0.3, yy + rnd(-3, 3), w * 0.6, yy + rnd(-3, 3), w, yy + rnd(-2, 2)); g.stroke();
      }
      g.fillStyle = "rgba(30,15,5,0.55)"; g.fillRect(0, y, w, 2);
      const cut = rnd(0.2, 0.8) * w; g.fillRect(cut, y, 2, h / n);
    }
  }
  function plaster(g, w, h) {
    g.fillStyle = "#d9c7a6"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(${rnd(80, 140)},${rnd(60, 100)},${rnd(40, 70)},${rnd(0.02, 0.06)})`;
      const r = rnd(2, 14); g.beginPath(); g.arc(rnd(0, w), rnd(0, h), r, 0, 7); g.fill();
    }
    // 下の腰板
    g.fillStyle = "#6b4a2e"; g.fillRect(0, h * 0.72, w, h * 0.28);
    g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, h * 0.72, w, 4);
    for (let x = 0; x < w; x += 64) { g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(x, h * 0.72, 3, h * 0.28); }
  }
  function skyTex(kind) {
    return canvasTex(512, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      if (kind === "night") { gr.addColorStop(0, "#0c1430"); gr.addColorStop(1, "#2c3d70"); }
      else { gr.addColorStop(0, "#2d2e5e"); gr.addColorStop(0.55, "#b8606a"); gr.addColorStop(1, "#f2b46a"); }
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${rnd(0.3, 0.9)})`; g.fillRect(rnd(0, w), rnd(0, h * 0.5), 1.5, 1.5); }
      // 星環：細い光の帯
      for (let k = 0; k < 6; k++) {
        g.strokeStyle = `rgba(255,240,210,${0.18 + k * 0.05})`; g.lineWidth = 1 + (k % 3);
        g.beginPath(); g.moveTo(-40, 250 + k * 9); g.quadraticCurveTo(w / 2, 70 + k * 9, w + 40, 190 + k * 9); g.stroke();
      }
      // 遠くの屋根
      g.fillStyle = "rgba(25,20,40,0.9)";
      g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 48) { const t = rnd(0.66, 0.8) * h; g.lineTo(x, t); g.lineTo(x + 24, t - rnd(10, 40)); g.lineTo(x + 48, t); }
      g.lineTo(w, h); g.fill();
      for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(255,${rnd(180, 220)},120,0.85)`; g.fillRect(rnd(0, w), rnd(h * 0.8, h * 0.95), 4, 5); }
    });
  }
  function silhouetteTex(color) {
    return canvasTex(256, 640, (g, w, h) => {
      g.fillStyle = color;
      g.beginPath(); g.ellipse(w / 2, 110, 58, 68, 0, 0, 7); g.fill(); // 頭とフード
      g.beginPath(); g.moveTo(w / 2 - 70, 150); g.quadraticCurveTo(w / 2, 120, w / 2 + 70, 150);
      g.lineTo(w / 2 + 110, 520); g.quadraticCurveTo(w / 2, 560, w / 2 - 110, 520); g.closePath(); g.fill();
      g.fillRect(w / 2 - 50, 500, 34, 120); g.fillRect(w / 2 + 16, 500, 34, 120);
      g.fillStyle = "rgba(255,240,220,0.85)"; g.beginPath(); g.ellipse(w / 2, 122, 34, 40, 0, 0, 7); g.fill(); // 顔
      g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(w / 2 - 95, 330, 190, 16); // ベルト
    });
  }

  /* ---------- 部屋 ---------- */
  function box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); scene.add(m); return m;
  }
  function buildRoom(time) {
    const wood = canvasTex(512, 512, (g, w, h) => planks(g, w, h, [28, 45, 30]), [3, 3]);
    const darkWood = canvasTex(512, 512, (g, w, h) => planks(g, w, h, [24, 40, 20]), [2, 1]);
    const wall = canvasTex(1024, 512, plaster, [2, 1]);
    const floorM = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.85 });
    const wallM = new THREE.MeshStandardMaterial({ map: wall, roughness: 1 });
    const woodM = new THREE.MeshStandardMaterial({ map: darkWood, roughness: 0.7 });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 10), floorM);
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 0.5); scene.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(9, 10), woodM); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.4, 0.5); scene.add(ceil);
    for (let i = -3; i <= 4; i += 1.4) box(9, 0.18, 0.22, woodM, 0, 3.3, i); // はり

    const back = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4), wallM); back.position.set(0, 1.7, -4); scene.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.4), wallM); left.rotation.y = Math.PI / 2; left.position.set(-4.5, 1.7, 0.5); scene.add(left);
    const right = left.clone(); right.rotation.y = -Math.PI / 2; right.position.x = 4.5; scene.add(right);

    // 窓と扉（外の空）
    const sky = new THREE.MeshBasicMaterial({ map: skyTex(time) });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.3), sky); win.position.set(-1.9, 1.9, -3.98); scene.add(win);
    box(2.1, 0.1, 0.12, woodM, -1.9, 2.6, -3.95); box(2.1, 0.1, 0.12, woodM, -1.9, 1.2, -3.95);
    box(0.08, 1.4, 0.1, woodM, -1.9, 1.9, -3.94); box(1.9, 0.06, 0.1, woodM, -1.9, 1.9, -3.94);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.3), sky); door.position.set(1.9, 1.15, -3.98); scene.add(door);
    box(1.55, 0.14, 0.2, woodM, 1.9, 2.36, -3.92); box(0.14, 2.4, 0.2, woodM, 1.2, 1.2, -3.92); box(0.14, 2.4, 0.2, woodM, 2.6, 1.2, -3.92);

    // 左右のたなとびん
    const glassCols = [0xd9613f, 0x3f86c9, 0x4aa58a, 0x8a63c9, 0xe0b04a, 0xc0587a];
    for (const side of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const y = 0.7 + k * 0.62;
        box(0.5, 0.06, 3.4, woodM, side * 4.2, y, -1.6);
        for (let b = 0; b < 9; b++) {
          if (Math.random() < 0.25) continue;
          const col = glassCols[Math.floor(Math.random() * glassCols.length)];
          const r = rnd(0.06, 0.11), hh = rnd(0.16, 0.34);
          const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, hh, 10),
            new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85 }));
          m.position.set(side * 4.15 + rnd(-0.08, 0.08), y + hh / 2 + 0.03, -3.1 + b * 0.37 + rnd(-0.06, 0.06)); scene.add(m);
        }
      }
      box(0.5, 2.6, 0.08, woodM, side * 4.2, 1.6, -3.3); box(0.5, 2.6, 0.08, woodM, side * 4.2, 1.6, 0.1);
    }
    // つるした乾燥ハーブ
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 6), new THREE.MeshStandardMaterial({ color: 0x5f7a3a, roughness: 1 }));
      m.position.set(-3 + i * 0.95, 2.95, -2.2 + (i % 2) * 0.6); m.rotation.x = Math.PI; scene.add(m);
    }
    // カウンター（手前）
    const cm = new THREE.MeshStandardMaterial({ map: darkWood, roughness: 0.8, color: 0x8a6a50 });
    box(6.4, 0.86, 0.8, cm, 0, 0.43, 3.05);
    box(6.6, 0.07, 0.95, new THREE.MeshStandardMaterial({ map: wood, roughness: 0.85, color: 0x9a7a5c }), 0, 0.9, 3.02);
    // カウンターの上：ろうそく・天秤・びん
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 10), new THREE.MeshStandardMaterial({ color: 0xf3ead2 }));
    candle.position.set(-2.4, 1.04, 2.95); scene.add(candle);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffc46a }));
    flame.position.set(-2.4, 1.19, 2.95); scene.add(flame); flick.push({ mesh: flame });
    for (let i = 0; i < 3; i++) {
      const col = glassCols[i + 1];
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5, transparent: true, opacity: 0.85, roughness: 0.15 }));
      m.position.set(2.0 + i * 0.32, 1.04, 2.9 + (i % 2) * 0.1); scene.add(m);
    }
    const pan = new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: 0.8, roughness: 0.3 });
    box(0.04, 0.4, 0.04, pan, 1.3, 1.13, 2.95); box(0.6, 0.03, 0.03, pan, 1.3, 1.33, 2.95);

    // 灯り
    scene.add(new THREE.HemisphereLight(0xffe2b8, 0x3a2418, 0.55));
    const amb = new THREE.AmbientLight(0x6a5070, 0.35); scene.add(amb);
    const lampPos = [[-1.6, 2.7, -0.6], [1.6, 2.7, -0.6], [0, 2.7, 0.3]];
    for (const p of lampPos) {
      const l = new THREE.PointLight(0xffb86a, 1.0, 8, 1.6); l.position.set(...p); scene.add(l); flick.push({ light: l, base: 1.0 });
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.24, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, side: THREE.DoubleSide }));
      shade.position.set(p[0], p[1] + 0.12, p[2]); scene.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
      bulb.position.set(p[0], p[1], p[2]); scene.add(bulb);
      box(0.015, 0.5, 0.015, new THREE.MeshBasicMaterial({ color: 0x222222 }), p[0], p[1] + 0.48, p[2]);
    }
    const winL = new THREE.PointLight(time === "night" ? 0x6a8ad0 : 0xff9a7a, 0.6, 6); winL.position.set(-1.9, 1.9, -3.2); scene.add(winL);
    const candleL = new THREE.PointLight(0xffaa55, 0.5, 3); candleL.position.set(-2.4, 1.35, 2.8); scene.add(candleL); flick.push({ light: candleL, base: 0.5 });

    // 光のちり
    const n = 140, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = rnd(-4, 4); pos[i * 3 + 1] = rnd(0.2, 3.2); pos[i * 3 + 2] = rnd(-3.8, 2.2); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    motes = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffdca8, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false }));
    scene.add(motes);

    scene.fog = new THREE.Fog(0x2a1c18, 6, 14);
  }

  /* ---------- 立ち絵 ---------- */
  function shadowMesh() {
    const t = canvasTex(128, 64, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
      gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.4), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; return m;
  }
  function makeActor(id, src, height) {
    return new Promise(res => {
      const done = tex => {
        const img = tex.image, aspect = img.width / img.height;
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.08, side: THREE.DoubleSide });
        const geo = new THREE.PlaneGeometry(height * aspect, height); geo.translate(0, height / 2, 0);
        const mesh = new THREE.Mesh(geo, mat); mesh.visible = false;
        const sh = shadowMesh(); sh.visible = false;
        scene.add(mesh); scene.add(sh);
        actors[id] = { mesh, shadow: sh, h: height }; res();
      };
      if (src instanceof THREE.Texture) { done(src); return; }
      new THREE.TextureLoader().load(src, t => { t.encoding = THREE.sRGBEncoding; done(t); }, undefined, () => res());
    });
  }

  /* ---------- 動き ---------- */
  const DOOR = { x: 1.9, z: -3.7 };
  const SPOTS = { 1: [0], 2: [-0.7, 0.7], 3: [-1.25, 0, 1.25], 4: [-1.6, -0.55, 0.55, 1.6], 5: [-1.9, -0.95, 0, 0.95, 1.9] };
  function tween(ms, f) {
    return new Promise(res => {
      const t0 = performance.now();
      // 画面が裏にあっても止まらないよう、タイマーで進める
      const step = () => { const k = Math.min(1, (performance.now() - t0) / ms); f(k); if (k < 1) setTimeout(step, 16); else res(); };
      step();
    });
  }
  function place(a, x, z, bob) {
    a.mesh.position.set(x, bob || 0, z); a.shadow.position.set(x, 0.01, z + 0.05);
  }
  async function walkIn(ids) {
    if (!ok) return fb.walkIn(ids);
    const spots = SPOTS[ids.length] || SPOTS[5];
    await Promise.all(ids.map((id, i) => new Promise(r => setTimeout(r, i * 380)).then(() => {
      const a = actors[id]; if (!a) return;
      a.mesh.visible = a.shadow.visible = true;
      const tx = spots[i], tz = 1.35 + (i % 2) * 0.2;
      return tween(1700, k => {
        const e = 1 - Math.pow(1 - k, 2);
        place(a, DOOR.x + (tx - DOOR.x) * e, DOOR.z + (tz - DOOR.z) * e, Math.abs(Math.sin(k * Math.PI * 6)) * 0.05 * (1 - k));
      });
    })));
  }
  async function walkOut(ids) {
    if (!ok) return fb.walkOut(ids);
    await Promise.all(ids.map((id, i) => new Promise(r => setTimeout(r, i * 250)).then(() => {
      const a = actors[id]; if (!a) return;
      const sx = a.mesh.position.x, sz = a.mesh.position.z;
      return tween(1400, k => {
        place(a, sx + (DOOR.x - sx) * k, sz + (DOOR.z - sz) * k, Math.abs(Math.sin(k * Math.PI * 5)) * 0.05);
        a.mesh.material.opacity = k > 0.75 ? 1 - (k - 0.75) * 4 : 1;
      }).then(() => { a.mesh.visible = a.shadow.visible = false; a.mesh.material.opacity = 1; });
    })));
  }
  // 話している人を少し前に
  function focus(id) {
    if (!ok) return fb.focus(id);
    for (const [k, a] of Object.entries(actors)) {
      if (!a.mesh.visible) continue;
      const on = k === id;
      a.mesh.scale.setScalar(on ? 1.04 : 1);
      a.mesh.material.color.setScalar(on || !id ? 1 : 0.72);
    }
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    for (const f of flick) {
      const n = 0.9 + Math.sin(t * 9.1 + (f.base || 1) * 7) * 0.05 + Math.sin(t * 23.7) * 0.04;
      if (f.light) f.light.intensity = f.base * n;
      if (f.mesh) f.mesh.scale.setScalar(n);
    }
    if (motes) { motes.rotation.y = t * 0.02; motes.position.y = Math.sin(t * 0.3) * 0.08; }
    camera.position.x += ((Math.sin(t * 0.18) * 0.12 + look.x * 0.35) - camera.position.x) * 0.04;
    camera.position.y += ((1.58 + Math.sin(t * 0.23) * 0.03 - look.y * 0.15) - camera.position.y) * 0.04;
    camera.lookAt(0, portrait ? 1.42 : 1.32, -0.6);
    for (const a of Object.values(actors)) if (a.mesh.visible) a.mesh.rotation.y = Math.atan2(camera.position.x - a.mesh.position.x, camera.position.z - a.mesh.position.z);
    renderer.render(scene, camera);
  }
  function resize() {
    if (!ok) return;
    const w = root.clientWidth, h = root.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    portrait = w / h < 0.8; camera.fov = portrait ? 56 : 46; camera.updateProjectionMatrix();
  }

  /* ---------- CSS だけの代わり ---------- */
  function makeFallback(el) {
    el.classList.add("shop-fallback");
    const imgs = {};
    return {
      add(id, src, h) {
        const i = document.createElement("img"); i.src = typeof src === "string" ? src : src.image.toDataURL();
        i.className = "fb-actor"; i.style.height = (h / 1.8 * 62) + "%"; el.appendChild(i); imgs[id] = i;
      },
      async walkIn(ids) {
        ids.forEach((id, k) => { const i = imgs[id]; if (!i) return; i.style.left = (50 + (k - (ids.length - 1) / 2) * 22) + "%"; i.classList.add("in"); });
        await new Promise(r => setTimeout(r, 700));
      },
      async walkOut(ids) { ids.forEach(id => imgs[id] && imgs[id].classList.remove("in")); await new Promise(r => setTimeout(r, 600)); },
      focus(id) { for (const [k, i] of Object.entries(imgs)) i.classList.toggle("dim", !!id && k !== id && i.classList.contains("in")); },
    };
  }

  return {
    async init(el, time) {
      root = el;
      try {
        if (!window.THREE) throw new Error("no three");
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        el.appendChild(renderer.domElement);
        scene = new THREE.Scene(); scene.background = new THREE.Color(0x1d1412);
        camera = new THREE.PerspectiveCamera(48, 1, 0.1, 50); camera.position.set(0, 1.58, 4.4);
        clock = new THREE.Clock();
        buildRoom(time);
        ok = true; resize(); loop();
        window.addEventListener("resize", resize);
        el.addEventListener("pointermove", e => { const r = el.getBoundingClientRect(); look.x = (e.clientX - r.left) / r.width - 0.5; look.y = (e.clientY - r.top) / r.height - 0.5; });
      } catch (e) {
        ok = false; fb = makeFallback(el);
      }
    },
    async addChar(id, src, height) { if (ok) return makeActor(id, src, height); fb.add(id, src, height); },
    async addTown(id, color) {
      if (ok) return makeActor(id, silhouetteTex(color), 1.66);
      const c = document.createElement("canvas"); fb.add(id, { image: c }, 1.66);
    },
    walkIn, walkOut, focus,
    has: id => !!actors[id] || false,
    destroy() {
      cancelAnimationFrame(raf); window.removeEventListener("resize", resize);
      if (renderer) { renderer.dispose(); renderer.domElement.remove(); }
      for (const k in actors) delete actors[k];
      flick.length = 0; ok = false; fb = null; if (root) { root.innerHTML = ""; root.classList.remove("shop-fallback"); }
    },
    get webgl() { return ok; },
  };
})();
