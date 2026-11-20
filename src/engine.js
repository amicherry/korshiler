'use strict';
/* ============================================================
   ДВИЖОК: экран, ввод, текст, кнопки, переходы, звук, сохранения
   Логическое разрешение 400×225, холст рисуется в 3 раза крупнее,
   чтобы при растягивании под экран не терялись строки пикселей.
   ============================================================ */
const W = 400, H = 225, S = 3;
const FONT = '"Press Start 2P", monospace';
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
cv.width = W * S; cv.height = H * S;
const isTouch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
if (isTouch) document.documentElement.classList.add('touch');

function fit() {
  const wrap = document.getElementById('wrap');
  // на телефоне — максимально крупно; кнопки полупрозрачные и лежат поверх игры
  const k = Math.min(wrap.clientWidth / W, wrap.clientHeight / H);
  cv.style.width = Math.floor(W * k) + 'px';
  cv.style.height = Math.floor(H * k) + 'px';
}
addEventListener('resize', fit); fit();

/* ---------- ошибки — на экран, чтобы их было видно на скриншоте ---------- */
addEventListener('error', e => {
  const el = document.getElementById('err'); if (!el) return;
  el.hidden = false; el.textContent += (e.message || 'Error') + (e.error && e.error.stack ? '\n' + e.error.stack.split('\n').slice(0, 4).join('\n') : '') + '\n';
});
addEventListener('unhandledrejection', e => {
  const el = document.getElementById('err'); if (!el) return;
  el.hidden = false; el.textContent += 'Promise: ' + (e.reason && (e.reason.stack || e.reason.message) || e.reason) + '\n';
});

/* ---------- хранилище ---------- */
function loadStr(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
function saveStr(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

/* ---------- случайные числа с зерном ---------- */
function rng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];

/* ---------- ввод ---------- */
const keys = {}, pressed = {};
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down', KeyE: 'act', Space: 'act', Enter: 'act', Escape: 'back', KeyB: 'ballot', Tab: 'ballot', KeyR: 'raccoon' };
addEventListener('keydown', e => {
  if (document.activeElement && document.activeElement.id === 'nameInput') { if (e.code === 'Enter') { pressed.act = true; } return; }
  const k = KEYMAP[e.code]; if (!k) return;
  if (!keys[k]) pressed[k] = true; keys[k] = true; e.preventDefault(); audioUnlock();
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
const hit = k => { const v = !!pressed[k]; pressed[k] = false; return v; };
document.querySelectorAll('[data-k]').forEach(b => {
  const k = b.dataset.k;
  const on = e => { e.preventDefault(); if (!keys[k]) pressed[k] = true; keys[k] = true; b.classList.add('on'); audioUnlock(); try { b.setPointerCapture(e.pointerId); } catch (_) {} };
  const off = () => { keys[k] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on);
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, off));
  b.addEventListener('contextmenu', e => e.preventDefault());
});
const touchBtn = k => document.querySelector(`[data-k="${k}"]`);
// какие экранные кнопки нужны сейчас: стрелки «влево/вправо» — только там, где герой ходит
function setTouch({ act = null, up = false, down = false, move = false } = {}) {
  const a = touchBtn('act'); if (a) { a.hidden = act === null; if (act !== null && a.textContent !== act) a.textContent = act; }
  const u = touchBtn('up'), d = touchBtn('down'); if (u) u.hidden = !up; if (d) d.hidden = !down;
  for (const k of ['left', 'right']) { const b = touchBtn(k); if (b) b.hidden = !move; }
}
// на весь экран + альбомная ориентация (Android; на iPhone — через «На экран Домой»)
{ const fs = document.getElementById('fs'), el = document.documentElement;
  if (fs && (el.requestFullscreen || el.webkitRequestFullscreen)) {
    fs.classList.add('ok');
    fs.addEventListener('click', async () => {
      try { if (document.fullscreenElement) await document.exitFullscreen(); else { await (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape').catch(() => {}); } } catch (err) {}
      setTimeout(fit, 200);
    });
  } }

/* мышь и касания по холсту: щелчки собираются за кадр, кнопки проверяют их сами */
let clicks = [];
const pointer = { x: -1, y: -1 };
function toLogical(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
cv.addEventListener('pointerdown', e => { audioUnlock(); const p = toLogical(e); clicks.push(p); });
cv.addEventListener('pointermove', e => { const p = toLogical(e); pointer.x = p.x; pointer.y = p.y; });
const TAP_PAD = isTouch ? 3 : 0;   // палец толще курсора: зона нажатия чуть больше кнопки
function clickIn(x, y, w, h) {
  const p = TAP_PAD, i = clicks.findIndex(c => c.x >= x - p && c.x < x + w + p && c.y >= y - p && c.y < y + h + p);
  if (i < 0) return false; clicks.splice(i, 1); return true;
}

/* ---------- текст ---------- */
function font(size = 8) { ctx.font = `${size}px ${FONT}`; }
function text(s, x, y, o = {}) {
  const { col = '#f4f3ee', size = 8, align = 'left', shadow = null } = o;
  font(size); ctx.textAlign = align; ctx.textBaseline = 'top';
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(s, Math.round(x), Math.round(y) + 1); }
  ctx.fillStyle = col; ctx.fillText(s, Math.round(x), Math.round(y));
}
function textW(s, size = 8) { font(size); return ctx.measureText(s).width; }
function wrapText(s, maxW, size = 8) {
  const out = [];
  for (const para of String(s).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (textW(t, size) > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

/* ---------- примитивы ---------- */
function rect(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function makeCanvas(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const P = { g, w, h,
    r: (x, y, ww, hh, col) => { if (!col) return; g.fillStyle = col; g.fillRect(x | 0, y | 0, ww | 0, hh | 0); },
    p: (x, y, col) => { if (!col) return; g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); },
    line: (x0, y0, x1, y1, col) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; g.fillStyle = col;
      for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); },
    ell: (cx, cy, rx, ry, col) => { g.fillStyle = col; for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx + .5) + (y * y) / (ry * ry + .5) <= 1) g.fillRect(cx + x, cy + y, 1, 1); },
  };
  draw(P); return c;
}
function sprite(img, x, y, flip = false, alpha = 1) {
  ctx.imageSmoothingEnabled = false;
  if (alpha !== 1) ctx.globalAlpha = alpha;
  if (flip) { ctx.save(); ctx.translate(Math.round(x) + img.width, Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); }
  else ctx.drawImage(img, Math.round(x), Math.round(y));
  if (alpha !== 1) ctx.globalAlpha = 1;
}

/* ---------- интерфейс: кнопки, бумага, табличка ---------- */
const BTN_COL = { primary: ['#f2c94c', '#b08a1e', '#2b2a33', '#fbe39a'], alt: ['#7fc4a8', '#3f8a6e', '#2b2a33', '#b9e6d3'],
  off: ['#5a5766', '#3a3846', '#c3c0cf', '#6c6978'], danger: ['#e98f6f', '#a8553c', '#2b2a33', '#f6c0ab'], dark: ['#3a3946', '#24232c', '#f4f3ee', '#4b4a57'] };
/* кнопка: рисуется и сразу проверяет щелчок; возвращает true, если нажата */
function button(label, cx, y, kind = 'primary', o = {}) {
  const C = BTN_COL[kind]; const w = Math.round((o.w || textW(label) + 12)), h = 16;
  let x = Math.round(o.left !== undefined ? o.left : clamp(cx - w / 2, 4, W - 4 - w));
  const hov = !isTouch && pointer.x >= x && pointer.x < x + w && pointer.y >= y && pointer.y < y + h;
  const sel = o.selected;
  rect(x + 1, y, w - 2, h, '#1b1a21'); rect(x, y + 1, w, h - 2, '#1b1a21');
  rect(x + 1, y + 1, w - 2, h - 2, C[1]); rect(x + 1, y + 1, w - 2, h - 5, (hov || sel) ? C[3] : C[0]); rect(x + 2, y + 1, w - 4, 1, C[3]);
  text(label, x + w / 2, y + 3, { col: C[2], align: 'center' });
  if (sel) { rect(x - 5, y + 5, 3, 5, '#f2c94c'); }
  return clickIn(x, y, w, h);
}
function paper(x, y, w, h, seed = 1) {
  const R = rng(w * 7 + h + seed);
  rect(x + 3, y + 3, w, h, 'rgba(10,10,14,.45)');
  rect(x, y, w, h, '#cfc3a5'); rect(x + 1, y + 1, w - 2, h - 2, '#efe8d6');
  ctx.fillStyle = '#e2d9c2'; for (let i = 0; i < w * h / 90; i++) ctx.fillRect(Math.round(x + 2 + R() * (w - 4)), Math.round(y + 2 + R() * (h - 4)), 1, 1);
  ctx.fillStyle = '#d4c8aa'; ctx.beginPath(); ctx.moveTo(x + w - 11, y + h - 1); ctx.lineTo(x + w - 1, y + h - 11); ctx.lineTo(x + w - 11, y + h - 11); ctx.fill();
  for (const tx of [x + 14, x + w - 42]) { rect(tx, y - 4, 28, 9, 'rgba(234,220,156,.85)'); rect(tx, y - 4, 1, 9, 'rgba(211,194,122,.9)'); rect(tx + 27, y - 4, 1, 9, 'rgba(211,194,122,.9)'); }
}
function plate(x, y, w, h) {
  rect(x + 3, y + 3, w, h, 'rgba(16,24,42,.5)');
  rect(x + 1, y, w - 2, h, '#e9eef5'); rect(x, y + 1, w, h - 2, '#e9eef5');
  rect(x + 3, y + 2, w - 6, h - 4, '#2f4f8a'); rect(x + 2, y + 3, w - 4, h - 6, '#2f4f8a');
  rect(x + 3, y + h - 6, w - 6, 3, '#284579');
  for (const [rx, ry] of [[x + 6, y + 6], [x + w - 8, y + 6], [x + 6, y + h - 8], [x + w - 8, y + h - 8]]) rect(rx, ry, 2, 2, '#9fb0cc');
}
// тёмная пиксельная рамка: панели меню, HUD, диалог
function frameBox(x, y, w, h, alpha = .9) {
  rect(x + 2, y + 2, w, h, 'rgba(5,6,10,.5)');
  rect(x, y, w, h, `rgba(14,17,28,${alpha})`);
  rect(x + 1, y, w - 2, 1, '#55607c'); rect(x + 1, y + h - 1, w - 2, 1, '#55607c'); rect(x, y + 1, 1, h - 2, '#55607c'); rect(x + w - 1, y + 1, 1, h - 2, '#55607c');
  rect(x + 2, y + 2, w - 4, 1, '#262c3d'); rect(x + 2, y + h - 3, w - 4, 1, '#0a0c12');
  for (const [cx, cy] of [[x + 2, y + 2], [x + w - 4, y + 2], [x + 2, y + h - 4], [x + w - 4, y + h - 4]]) rect(cx, cy, 2, 2, '#8792ad');
}
const INK = '#2b2a33', INK_RED = '#b8443f', INK_TEAL = '#2f8577', INK_MUTED = '#857d6c', INK_GOLD = '#a87b12';

/* ---------- уведомления E-KNOT (тосты) ---------- */
const toasts = [];
function toast(title, body, ms = 3800) { toasts.length = 0; toasts.push({ title, body, t: 0, ms }); beep(880, .05, 'sine', .03); beep(1320, .07, 'sine', .03, .06); }
function drawToasts(dt) {
  if (scene && scene.ballot) return;
  for (const T of toasts) {
    T.t += dt;
    const a = T.t < 150 ? T.t / 150 : T.t > T.ms - 300 ? Math.max(0, (T.ms - T.t) / 300) : 1;
    ctx.globalAlpha = a;
    const lines = wrapText(T.body, 290);
    const w = Math.max(textW(T.title) + 28, 150, ...lines.map(l => textW(l) + 16)) | 0, h = 18 + lines.length * 11 + 4;
    const x = Math.round((W - w) / 2), y = 22;
    rect(x + 2, y + 2, w, h, 'rgba(20,19,24,.35)');
    rect(x + 1, y, w - 2, h, '#1b1a21'); rect(x, y + 1, w, h - 2, '#1b1a21');
    rect(x + 1, y + 1, w - 2, h - 2, '#f4f3ee'); rect(x + 1, y + 1, w - 2, 13, '#2f8577');
    rect(x + 4, y + 3, 9, 9, '#f4f3ee'); rect(x + 6, y + 5, 1, 5, '#2f8577'); rect(x + 6, y + 5, 5, 1, '#2f8577'); rect(x + 6, y + 7, 4, 1, '#2f8577'); rect(x + 6, y + 9, 5, 1, '#2f8577');
    text(T.title, x + 17, y + 4);
    lines.forEach((l, i) => text(l, x + 8, y + 18 + i * 11, { col: INK }));
    ctx.globalAlpha = 1;
  }
  for (let i = toasts.length - 1; i >= 0; i--) if (toasts[i].t > toasts[i].ms) toasts.splice(i, 1);
}

/* ---------- звук (после первого касания) ---------- */
const SND = { ac: null, on: loadStr('d67_sound', '1') === '1' };
function audioUnlock() { if (!SND.ac) { try { SND.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } }
function beep(freq, dur = .04, type = 'square', vol = .04, delay = 0) {
  if (!SND.on || !SND.ac) return;
  try {
    const t0 = SND.ac.currentTime + delay, o = SND.ac.createOscillator(), g = SND.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g).connect(SND.ac.destination); o.start(t0); o.stop(t0 + dur + .02);
  } catch (e) {}
}
const sfx = {
  knock: () => { beep(110, .07, 'triangle', .25); beep(95, .07, 'triangle', .25, .16); beep(100, .07, 'triangle', .22, .32); },
  door: () => { beep(220, .12, 'sawtooth', .03); beep(160, .15, 'sawtooth', .03, .1); },
  stamp: () => { beep(70, .12, 'square', .12); beep(523, .08, 'square', .04, .12); beep(784, .12, 'square', .04, .2); },
  no: () => { beep(200, .12, 'square', .05); beep(140, .18, 'square', .05, .12); },
  step: () => beep(60 + Math.random() * 20, .03, 'triangle', .04),
  select: () => beep(660, .03, 'square', .03),
  blip: (p) => beep(p, .025, 'square', .025),
};

/* ---------- переход «чёрный круг» ---------- */
const trans = { phase: null, t: 0, x: W / 2, y: H / 2, cb: null };
function irisTo(x, y, cb) { if (trans.phase) return; Object.assign(trans, { phase: 'out', t: 0, x, y, cb }); }
function irisFrom(x, y) { Object.assign(trans, { phase: 'in', t: 0, x, y, cb: null }); }
// переход «пиксельным градиентом»: экран заполняется квадратами сверху вниз,
// край размыт случайным шумом (как в референсе), потом так же открывается
const TR_CELL = 8, TR_COLS = Math.ceil(W / TR_CELL), TR_ROWS = Math.ceil(H / TR_CELL);
const TR_NOISE = Array.from({ length: TR_COLS * TR_ROWS }, (_, i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); });
function drawTrCells(k, cover) {
  // клетки всегда целые квадраты; край волны — 3 ступени серого, как пиксельный градиент
  const shades = ['rgba(11,12,16,.35)', 'rgba(11,12,16,.65)', '#0b0c10'];
  for (let ry = 0; ry < TR_ROWS; ry++) for (let cx = 0; cx < TR_COLS; cx++) {
    const th = (ry / TR_ROWS) * .65 + TR_NOISE[ry * TR_COLS + cx] * .35;
    let v = (k * 1.45 - th) / .2; v = cover ? v : 1 - v; if (v <= 0) continue;
    ctx.fillStyle = shades[Math.min(2, Math.floor(v * 3))];
    ctx.fillRect(cx * TR_CELL, ry * TR_CELL, TR_CELL, TR_CELL);
  }
}
function drawIris(dt) {
  if (!trans.phase) return;
  trans.t += dt; const D = 380, k = Math.min(1, trans.t / D);
  if (trans.phase === 'out') { drawTrCells(k, true); if (k >= 1) { const cb = trans.cb; trans.phase = 'hold'; trans.t = 0; cb && cb(); } }
  else if (trans.phase === 'hold') { ctx.fillStyle = '#0b0c10'; ctx.fillRect(0, 0, W, H); }
  else { drawTrCells(k, false); if (k >= 1) trans.phase = null; }
}

/* ---------- сцены и главный цикл ---------- */
const scenes = {}; let scene = null;
function go(name, data, from) {
  scene = scenes[name]; clicks = []; toasts.length = 0; for (const k in pressed) pressed[k] = false;
  if (typeof musicFor === 'function') musicFor(name);
  scene.enter && scene.enter(data || {});
  const p = from || (scene.focus ? scene.focus() : { x: W / 2, y: H / 2 });
  irisFrom(p.x, p.y);
}
let last = performance.now();
function frame(now) {
  const dt = clamp(now - last, 0, 50); last = now;
  ctx.setTransform(S, 0, 0, S, 0, 0); ctx.imageSmoothingEnabled = false;
  if (scene) { scene.update && scene.update(dt); scene.draw && scene.draw(dt); }
  drawToasts(dt);
  if (typeof drawNet === 'function') drawNet(dt);
  drawIris(dt);
  clicks = []; for (const k in pressed) pressed[k] = false;
  requestAnimationFrame(frame);
}
