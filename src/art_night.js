/* ============================================================
   НОЧНОЙ ГОРОД — меню и итоги. По референсу автора:
   панельная высотка снизу в три четверти, горящая вывеска,
   за ней город, рядом соседние дома, на переднем плане крыша.
   Слои: небо → звёзды → город и дома → окна → вывеска → передний план → снег
   ============================================================ */
function fillPoly(g, pts, col) {
  g.fillStyle = col;
  const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
  for (let y = y0; y < y1; y++) {
    const yc = y + .5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) { const xa = Math.round(xs[i]), xb = Math.round(xs[i + 1]); if (xb > xa) g.fillRect(xa, y, xb - xa, 1); }
  }
}
const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

// главная высотка: фасад (справа, широкий) и торец (слева, узкий, в тени)
const BLD = { TL: [198, 80], TR: [384, 93], BL: [186, 240], BR: [404, 240], STL: [158, 96], SBL: [142, 240], rows: 9, cols: 16 };
const persp = v => Math.pow(v, 1.2);           // снизу этажи ближе — выше
function FF(u, v) { const T = lerp2(BLD.TL, BLD.TR, u), B = lerp2(BLD.BL, BLD.BR, u); return lerp2(T, B, persp(v)); }
function SF(u, v) { const T = lerp2(BLD.STL, BLD.TL, u), B = lerp2(BLD.SBL, BLD.BL, u); return lerp2(T, B, persp(v)); }

const NIGHT = { lang: null, t: 0, next: 0, windows: [], stars: [], snow: [], blinkers: [] };
function signText() { return LANG === 'kz' ? 'БӘРІ ЖАҚСЫ БОЛАДЫ!' : 'ВСЁ БУДЕТ ХОРОШО!'; }

function buildNight() {
  const R = rng(7);
  NIGHT.windows = []; NIGHT.blinkers = [];
  const win = (x, y, w, h, o = {}) => NIGHT.windows.push(Object.assign({ x: Math.round(x), y: Math.round(y), w: Math.max(2, Math.round(w)), h: Math.max(2, Math.round(h)),
    on: R() < .2, tv: R() < .02, warm: pick(R, ['#f2c66a', '#f7e3a1', '#e8a85a', '#f2c66a']), off: pick(R, ['#2a2440', '#2a2342', '#3a3356']) }, o));

  // ---- небо ----
  NIGHT.sky = makeCanvas(W, H, ({ r, g }) => {
    const top = [28, 23, 52], mid = [59, 47, 92], low = [150, 100, 130];
    for (let y = 0; y < H; y++) { const k = y / H, A = k < .55 ? top : mid, B = k < .55 ? mid : low, t = k < .55 ? k / .55 : (k - .55) / .45;
      r(0, y, W, 1, `rgb(${A[0] + (B[0] - A[0]) * t | 0},${A[1] + (B[1] - A[1]) * t | 0},${A[2] + (B[2] - A[2]) * t | 0})`); }
    const RC = rng(12);
    pxCloud(r, RC, 70, 96, 64); pxCloud(r, RC, 300, 42, 56); pxCloud(r, RC, 172, 66, 34);
  });
  // ---- город, соседние дома, главная высотка ----
  NIGHT.mid = makeCanvas(W, H, ({ r, p, line, g }) => {
    // дальний город: ряды силуэтов с редкими огнями
    for (const [base, col, hMin, hMax, dens] of [[196, '#2e2648', 10, 36, .05], [204, '#261f3d', 14, 48, .08]]) {
      let x = -4;
      while (x < W) {
        const w = 8 + Math.floor(R() * 20), h = hMin + Math.floor(R() * (hMax - hMin));
        r(x, base - h, w, H - base + h, col);
        for (let yy = base - h + 3; yy < base + 10; yy += 3) for (let xx = x + 2; xx < x + w - 1; xx += 3) if (R() < dens) p(xx, yy, pick(R, ['#d9b46a', '#e8c88a', '#9fb0cc']));
        if (h > hMax - 8 && R() < .6) NIGHT.blinkers.push({ x: x + (w >> 1), y: base - h - 1, ph: R() * 6 });
        x += w + (R() < .3 ? 2 : 0);
      }
    }
    // далёкая башня между домами
    r(116, 104, 26, 140, '#2a2244'); r(116, 104, 26, 1, '#3a3058'); r(128, 96, 2, 8, '#2a2244');
    NIGHT.blinkers.push({ x: 128, y: 95, ph: 1 });
    for (let yy = 108; yy < 210; yy += 5) for (let xx = 119; xx < 140; xx += 4) if (R() < .18) r(xx, yy, 2, 2, '#c9a65e');
    // соседний дом слева (девятиэтажка, прямо)
    const nx = -6, nw = 98, ny = 124;
    r(nx, ny, nw, H - ny, '#3b3256'); r(nx, ny - 3, nw + 2, 3, '#2a2342'); r(nx, ny - 3, nw + 2, 1, '#4a4068');
    r(40, ny - 14, 1, 11, '#141a28'); r(36, ny - 12, 9, 1, '#141a28'); r(38, ny - 9, 5, 1, '#141a28');
    for (let row = 0; row < 9; row++) {
      const y = ny + 5 + row * 11; r(nx, y + 8, nw, 1, '#4a4068');
      for (let c = 0; c < 7; c++) { if (c === 3) { win(nx + 6 + c * 13 + 2, y + 3, 3, 4, { on: R() < .6, warm: '#b8c9a8' }); continue; } win(nx + 6 + c * 13, y + 1, 7, 6); }
    }
    // ===== главная высотка =====
    const { TL, TR, BL, BR, STL, SBL, rows, cols } = BLD;
    fillPoly(g, [STL, TL, BL, SBL], '#4a4366');                         // торец
    fillPoly(g, [TL, TR, BR, BL], '#6d6488');                            // фасад
    // фасад темнеет кверху (дальше от фонарей двора)
    g.save(); g.beginPath(); g.moveTo(TL[0], TL[1]); g.lineTo(TR[0], TR[1]); g.lineTo(BR[0], BR[1]); g.lineTo(BL[0], BL[1]); g.closePath(); g.clip();
    for (let y = TL[1] - 2; y < 170; y += 2) { const k = 1 - (y - TL[1]) / (170 - TL[1]); g.fillStyle = `rgba(14,18,32,${(Math.max(0, k) * .4).toFixed(3)})`; g.fillRect(0, y, W, 2); }
    g.restore();
    // вертикальные швы панелей и колонна лестничной клетки
    for (let c = 2; c < cols; c += 2) { const a = FF(c / cols, 0), b = FF(c / cols, 1); line(a[0], a[1], b[0], b[1], '#5b5378'); }
    const sc0 = 7 / cols, sc1 = 8 / cols;
    fillPoly(g, [FF(sc0, 0), FF(sc1, 0), FF(sc1, 1), FF(sc0, 1)], '#625a80');
    // этажи: плиты балконов (светлые полосы) и окна
    for (let row = 0; row < rows; row++) {
      const vb = (row + .86) / rows, a = FF(0, vb), b = FF(1, vb);
      line(a[0], a[1], b[0], b[1], '#8f86a8'); line(a[0], a[1] + 1, b[0], b[1] + 1, '#4a4268');
      const sa = SF(0, vb), sb = SF(1, vb); line(sa[0], sa[1], sb[0], sb[1], '#5a527a');
      for (let c = 0; c < cols; c++) {
        if (c === 7) { const p0 = FF((c + .3) / cols, (row + .4) / rows), p1 = FF((c + .7) / cols, (row + .62) / rows);
          win(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1], { on: R() < .7, warm: '#c4d6b4', off: '#232a3c' }); continue; }
        const ctr = FF((c + .5) / cols, (row + .2) / rows), bot = FF((c + .5) / cols, (row + .7) / rows), cw = FF((c + 1) / cols, (row + .5) / rows)[0] - FF(c / cols, (row + .5) / rows)[0];
        const ww = Math.round(cw * .66), hh = Math.max(3, Math.round(bot[1] - ctr[1]));
        win(Math.round(ctr[0] - ww / 2), Math.round(ctr[1]), ww, hh, { front: true });
      }
      for (let c = 0; c < 3; c++) { const p0 = SF((c + .3) / 3, (row + .26) / rows), p1 = SF((c + .62) / 3, (row + .66) / rows);
        win(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1], { on: R() < .14, off: '#262036' }); }
    }
    // угол дома — светлое ребро; парапет и надстройки на крыше
    line(TL[0], TL[1], BL[0], BL[1], '#857ca0');
    fillPoly(g, [[STL[0] - 1, STL[1] - 3], [TL[0], TL[1] - 3], [TL[0], TL[1]], [STL[0] - 1, STL[1]]], '#3a3356');
    fillPoly(g, [[TL[0], TL[1] - 3], [TR[0] + 1, TR[1] - 3], [TR[0] + 1, TR[1]], [TL[0], TL[1]]], '#4e4569');
    line(TL[0], TL[1] - 3, TR[0] + 1, TR[1] - 3, '#7a6f98');
    // стойки вывески
    for (const u of [.2, .5, .8]) { const q = FF(u, 0); r(q[0], q[1] - 9, 1, 7, '#1a1e2a'); }
  });

  // ---- передний план: крыша, на которой «стоит» зритель, и угол дома справа ----
  NIGHT.fg = makeCanvas(W, H, ({ r, p, line, g }) => {
    fillPoly(g, [[0, 205], [206, 212], [206, H], [0, H]], '#120e1c');
    line(0, 205, 206, 212, '#2a2238');
    r(46, 176, 1, 30, '#1c1626'); r(38, 180, 17, 1, '#1c1626'); r(41, 185, 11, 1, '#1c1626'); r(43, 190, 7, 1, '#1c1626');
    r(150, 196, 6, 13, '#1a1424'); r(149, 195, 8, 2, '#262036');
    fillPoly(g, [[368, 128], [400, 120], [400, H], [362, H]], '#150f1e');
    line(368, 128, 400, 120, '#2a2238');
  });
  // окна дома на переднем плане
  for (const [x, y, on] of [[376, 146, true], [388, 143, false], [376, 172, false], [388, 170, true], [376, 198, true]])
    win(x, y, 7, 10, { on, tv: false, fg: true, warm: '#e8a85a' });

  NIGHT.stars = Array.from({ length: 90 }, () => ({ x: R() * W, y: R() * 130, ph: R() * 6, big: R() < .12 }));
  NIGHT.snow = Array.from({ length: 70 }, () => ({ x: R() * W, y: R() * H, v: .006 + R() * .014, dx: (R() - .5) * .012, big: R() < .2 }));

  // ---- вывеска: доска, буквы и свечение (с наклоном крыши) ----
  const s = signText(); font(8);
  const tw = Math.ceil(textW(s, 8)), sw = tw + 10, sh = 13;
  const mid = FF(.5, 0), a0 = FF(0, 0), b0 = FF(1, 0), slope = (b0[1] - a0[1]) / (b0[0] - a0[0]);
  const a = [mid[0] - sw / 2, mid[1] - sw / 2 * slope];
  const board = makeCanvas(sw, sh, ({ r }) => { r(0, 0, sw, sh, '#120a0c'); r(0, 0, sw, 1, '#2a1416'); r(0, sh - 1, sw, 1, '#07040a'); });
  const letters0 = on => makeCanvas(sw, sh, ({ g }) => {
    g.font = '8px ' + FONT; g.textBaseline = 'top'; g.fillStyle = on ? '#ff6a45' : '#3c1714'; g.fillText(s, 5, 3);
    if (on) { g.fillStyle = 'rgba(255,214,190,.55)'; g.globalCompositeOperation = 'source-atop'; g.fillRect(0, 5, sw, 2); g.globalCompositeOperation = 'source-over'; }
  });
  const lw0 = []; { let acc = 5; for (const ch of s) { const w = textW(ch, 8); lw0.push([Math.round(acc), Math.round(w)]); acc += w; } }
  // доска наклонена по столбцам, а каждая буква сдвинута целиком — так текст остаётся чётким
  const shear = on => { const src = letters0(on); return makeCanvas(sw, sh + Math.ceil(sw * Math.abs(slope)) + 1, ({ g }) => {
    for (let x = 0; x < sw; x++) g.drawImage(board, x, 0, 1, sh, x, Math.round(x * slope), 1, sh);
    for (const [lx, lw] of lw0) { const dy = Math.round((lx + lw / 2) * slope); g.drawImage(src, lx, 0, lw, sh, lx, dy, lw, sh); }
  }); };
  const on = shear(true), off = shear(false);
  const glow = makeCanvas(on.width + 24, on.height + 24, ({ g }) => { g.shadowColor = 'rgba(255,72,40,1)'; g.shadowBlur = 7; g.drawImage(on, 12, 12); g.drawImage(on, 12, 12); });
  // где какая буква (для мерцания)
  const letters = lw0.filter((_, i) => s[i] !== ' ');
  NIGHT.sign = { on, off, glow, x: Math.round(a[0]), y: Math.round(a[1]) - 22, letters, flick: -1, until: 0 };
  NIGHT.lang = LANG;
}

function drawNight(dt) {
  if (NIGHT.lang !== LANG) buildNight();
  NIGHT.t += dt; const t = NIGHT.t;
  sprite(NIGHT.sky, 0, 0);
  for (const s of NIGHT.stars) { ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(t / 900 + s.ph)); rect(s.x, s.y, s.big ? 2 : 1, s.big ? 2 : 1, '#dfe6f2'); }
  ctx.globalAlpha = 1;
  const px = (t / 24) % (W + 240) - 120;
  if (px > 0 && px < W) { const py = 30 + px * .04; rect(px, py, 3, 1, '#7f8fb0'); if (Math.floor(t / 450) % 2) rect(px + 3, py, 1, 1, '#ff5a4a'); }
  sprite(NIGHT.mid, 0, 0);
  for (const b of NIGHT.blinkers) if (Math.sin(t / 380 + b.ph) > .3) rect(b.x, b.y, 1, 1, '#ff4a3a');
  // свет в окнах то гаснет, то загорается
  if (t > NIGHT.next) {
    NIGHT.next = t + 120 + Math.random() * 520;
    const w = NIGHT.windows[Math.floor(Math.random() * NIGHT.windows.length)]; if (!w.fg) w.on = !w.on;
  }
  const S = NIGHT.sign;
  const drawWin = w => {
    if (w.tv) { const f = Math.sin(t / 80 + w.x * 3) > .2; rect(w.x, w.y, w.w, w.h, f ? '#86a6dc' : '#4f6aa8'); return; }
    rect(w.x, w.y, w.w, w.h, w.on ? w.warm : w.off);
    if (w.on && w.h > 3) { rect(w.x, w.y + w.h - 1, w.w, 1, shade(w.warm, -45)); if (w.front && w.w > 4) rect(w.x + (w.w >> 1), w.y, 1, w.h - 1, shade(w.warm, -30)); }
  };
  for (const w of NIGHT.windows) if (!w.fg) drawWin(w);
  // вывеска: горит целиком, изредка одна буква подмигивает
  if (t > S.until) { S.flick = Math.random() < .5 ? Math.floor(Math.random() * S.letters.length) : -1; S.until = t + (S.flick >= 0 ? 160 + Math.random() * 380 : 900 + Math.random() * 2400); }
  const signOk = typeof HOUSE_STATE !== 'undefined' && HOUSE_STATE.fixed.includes('sign');
  if (signOk) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55 + .08 * Math.sin(t / 140); ctx.drawImage(S.glow, S.x - 12, S.y - 12); ctx.restore(); ctx.drawImage(S.on, S.x, S.y); }
  else { ctx.drawImage(S.off, S.x, S.y);   // вывеска сломана: светятся лишь некоторые буквы — её чинят в последнем собрании
    S.letters.forEach(([lx, lw], i) => { if (i % 3 === 1 && Math.sin(t / 170 + i * 2) > -.4) ctx.drawImage(S.on, lx, 0, lw, S.on.height, S.x + lx, S.y, lw, S.on.height); }); }
  if (S.flick >= 0 && Math.floor(t / 60) % 3) { const [lx, lw] = S.letters[S.flick]; ctx.drawImage(S.off, lx, 0, lw, S.off.height, S.x + lx, S.y, lw, S.off.height); }
  // после 2-го тура на крыше стоит антенна (награда видна прямо в меню)
  if (typeof HOUSE_STATE !== 'undefined' && HOUSE_STATE.fixed.includes('antenna')) {
    const q = FF(.95, 0), x = Math.round(q[0]), y = Math.round(q[1]) - 3;
    rect(x, y - 12, 1, 12, '#8792ad'); rect(x - 3, y - 4, 7, 1, '#5d6884');
    rect(x - 5, y - 17, 3, 7, '#cfd6e4'); rect(x - 4, y - 18, 4, 1, '#cfd6e4'); rect(x - 2, y - 15, 3, 1, '#8792ad');
    if (Math.sin(t / 300) > 0) rect(x, y - 13, 1, 1, '#ff4a3a');
  }
  sprite(NIGHT.fg, 0, 0);
  for (const w of NIGHT.windows) if (w.fg) drawWin(w);
  for (const s of NIGHT.snow) { s.y += s.v * dt; s.x += s.dx * dt; if (s.y > H) { s.y = -2; s.x = Math.random() * W; } rect(s.x, s.y, s.big ? 2 : 1, s.big ? 2 : 1, 'rgba(230,236,245,.7)'); }
}

/* ============================================================
   ДВОР У ПОДЪЕЗДА — пролог. Низ той же панельки, козырёк,
   фонарь, лавочка, машина под снегом, соседние дома
   ============================================================ */
const STREET = { built: false, windows: [], snow: [] };
const STREET_DOOR_X = 214, STREET_UP = 62, STREET_GROUND = 196 - STREET_UP;
function buildStreet() {
  const R = rng(19); STREET.windows = [];
  STREET.bg = makeCanvas(W, H + STREET_UP, ({ r, p, g }) => {
    // небо: те же сиреневые сумерки, что на карте ЖК, с облаками
    for (let y = 0; y < H; y++) { const k = y / H; r(0, y, W, 1, `rgb(${28 + k * 90 | 0},${23 + k * 60 | 0},${52 + k * 70 | 0})`); }
    for (let i = 0; i < 40; i++) p(R() * W, R() * 70, R() < .3 ? '#f4f3ee' : '#a99fc8');
    pxCloud(r, R, 150, 30, 50); pxCloud(r, R, 300, 18, 40);
    // соседние дома ЖК по бокам — в дымке
    for (const [x0, x1, top] of [[-10, 46, 50], [364, 410, 40]]) {
      r(x0, top, x1 - x0, 200 - top, '#433c62'); r(x0, top - 3, x1 - x0, 3, '#6a6090');
      for (let y = top + 6; y < 186; y += 13) for (let x = x0 + 4; x < x1 - 6; x += 12) r(x, y, 7, 6, R() < .35 ? pick(R, ['#c8935a', '#b8805a']) : '#2e2848');
      for (let y = top - 3; y < 200; y++) r(x0, y, x1 - x0, 1, 'rgba(24,18,44,.25)');
    }
    // фасад нашего дома: сиреневый бетон, швы панелей, потёки
    const fx = 52, fw = 306;
    r(fx, 0, fw, 186, '#6d6488'); r(fx, 0, 2, 186, '#857ca0'); r(fx + fw - 2, 0, 2, 186, '#544b70');
    for (let x = fx; x <= fx + fw; x += 34) r(x, 0, 1, 186, '#5b5378');
    for (let i = 0; i < 70; i++) { const x = fx + R() * fw, y = R() * 160; r(x, y, 1, 4 + R() * 18, '#5b5378'); }
    for (let i = 0; i < 400; i++) p(fx + R() * fw, R() * 186, R() < .5 ? '#746b90' : '#655c80');
    // закатный свет справа
    for (let y = 0; y < 186; y++) r(fx + fw - 30, y, 28, 1, 'rgba(240,140,70,.12)');
    // межэтажные плиты с балконами
    for (const y of [-16, 46, 108]) { r(fx, y + 58, fw, 4, '#8f86a8'); r(fx, y + 58, fw, 1, '#b0a8c8'); r(fx, y + 62, fw, 1, '#3a3356'); }
    r(fx, 170, fw, 16, '#463d5e'); r(fx, 170, fw, 1, '#6a6090'); for (let x = fx; x < fx + fw; x += 17) r(x, 171, 1, 15, '#3d3554');                        // цоколь
    for (const x of [74, 134, 286, 330]) { r(x, 176, 10, 5, '#120e1c'); for (let i = 0; i < 5; i++) r(x + 1 + i * 2, 176, 1, 5, '#3a3356'); }
    // водосток и жёлтая газовая труба
    r(fx + 4, 0, 3, 186, '#8a80a8'); r(fx + 4, 0, 1, 186, '#a198bd'); for (let y = 10; y < 186; y += 31) r(fx + 3, y, 5, 1, '#4e4569');
    r(fx + 8, 111, fw - 12, 3, '#d9b43a'); r(fx + 8, 111, fw - 12, 1, '#f2d26a'); for (let x = fx + 14; x < fx + fw; x += 24) r(x, 114, 1, 2, '#6a5a2a'); r(fx + fw - 10, 111, 3, 75, '#d9b43a'); r(fx + fw - 10, 111, 1, 75, '#f2d26a'); r(fx + fw - 11, 160, 5, 2, '#8a7a3a');
    // окна квартир: рамы, подоконники; у некоторых балкон с бельём или цветами, кондиционер
    for (const fy of [-16, 46, 108]) for (const x of [64, 104, 144, 254, 294, 334]) {
      r(x - 4, fy + 10, 30, 34, '#4a3f62'); r(x - 5, fy + 43, 32, 2, '#8f86a8');
      const w = { x: x - 2, y: fy + 12, w: 26, h: 30, on: R() < .45, warm: pick(R, ['#f2b84a', '#f5c96a', '#e8913a', '#ec9d8f', '#9a6ad0']), curtain: R() < .4, ac: R() < .2, plants: R() < .3 };
      STREET.windows.push(w);
      if (w.ac && fy === 46) { r(x + 2, fy + 46, 17, 10, '#cfcbd8'); r(x + 2, fy + 46, 17, 1, '#e8e4f0'); for (let i = 0; i < 4; i++) r(x + 4, fy + 48 + i * 2, 9, 1, '#8a849a'); r(x + 14, fy + 49, 4, 4, '#8a849a'); }
      if (w.plants) { r(x - 1, fy + 40, 5, 3, '#9a4a3a'); r(x, fy + 37, 3, 3, '#4a8a52'); p(x + 1, fy + 36, '#e05a7a'); }
    }
    // окна лестницы над входом
    for (const y of [-10, 52]) { r(STREET_DOOR_X - 7, y - 1, 15, 22, '#4a3f62'); r(STREET_DOOR_X - 5, y + 1, 11, 18, '#3a3450'); r(STREET_DOOR_X - 5, y + 9, 11, 1, '#4a3f62'); }
    // вход: козырёк, табличка с номером подъезда, старая дверь (до ремонта), сломанный домофон, ступени
    const dx = STREET_DOOR_X;
    r(dx - 32, 126, 64, 6, '#8f86a8'); r(dx - 32, 126, 64, 1, '#b0a8c8'); r(dx - 32, 132, 64, 2, '#2c2540');
    r(dx - 4, 117, 9, 7, '#2e64ad'); r(dx - 4, 117, 9, 1, '#5a8ad0'); g.fillStyle = '#f4f3ee'; g.font = '8px ' + FONT; g.textBaseline = 'top'; g.textAlign = 'center'; g.fillText('1', dx + 1, 117); g.textAlign = 'left';
    r(dx - 15, 138, 30, 48, '#1b1626'); r(dx - 13, 140, 13, 46, '#6a4a3a'); r(dx + 1, 141, 12, 45, '#5a3e30');
    r(dx - 11, 143, 9, 14, '#1a1424'); r(dx + 3, 143, 8, 14, '#2a2a3a'); p(dx + 5, 146, '#8a849a'); p(dx + 8, 150, '#8a849a');
    for (let y = 160; y < 186; y += 4) r(dx - 13, y, 13, 1, '#5a3e30'); r(dx - 4, 165, 3, 3, '#c9a95a');
    r(dx - 10, 172, 6, 1, '#b8443f'); r(dx - 9, 174, 4, 1, '#b8443f');                     // граффити на двери
    r(dx + 18, 152, 5, 9, '#1b1f27'); r(dx + 19, 153, 3, 2, '#2a3030'); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) p(dx + 19 + j * 2, 156 + i * 2, '#5a6270');
    r(dx - 20, 186, 40, 3, '#8a809e'); r(dx - 24, 189, 48, 3, '#7a7090'); r(dx - 20, 186, 40, 1, '#a59cbc');
    // объявления у двери
    r(dx - 26, 148, 5, 7, '#d8d2bf'); r(dx - 25, 150, 3, 1, '#7a7466'); r(dx - 25, 152, 3, 1, '#7a7466'); r(dx - 26, 158, 5, 7, '#c9d6e6'); r(dx - 25, 147, 3, 1, 'rgba(220,206,150,.8)');
    // земля: тротуар, бордюр, асфальт с трещинами и лужами, опавшие листья
    r(0, 186, W, 26, '#55466a'); for (let i = 0; i < 180; i++) p(R() * W, 188 + R() * 22, pick(R, ['#4e4064', '#5e4e74', '#46395a']));
    r(0, 186, W, 1, '#8a78a0');
    r(0, 210, W, 2, '#8a809e'); r(0, 212, W, H + STREET_UP - 212, '#3b3049');
    for (let i = 0; i < 60; i++) r(R() * W, 214 + R() * 70, 4 + R() * 10, 1, '#332a42');
    for (const [px, py, pw] of [[120, 200, 26], [250, 220, 30]]) { r(px, py, pw, 3, '#2c2a4a'); r(px + 3, py + 1, pw / 3, 1, '#6a5f8e'); }
    for (let i = 0; i < 40; i++) p(R() * W, 188 + R() * 26, pick(R, ['#c4622f', '#e8913a', '#b8562e']));
    // лавочка
    const bx = 132; r(bx, 192, 2, 8, '#1a1424'); r(bx + 38, 192, 2, 8, '#1a1424'); r(bx - 2, 190, 44, 3, '#8a5a3a'); r(bx - 2, 182, 44, 3, '#8a5a3a'); r(bx - 2, 182, 44, 1, '#a87a5a'); r(bx + 1, 185, 1, 5, '#1a1424'); r(bx + 37, 185, 1, 5, '#1a1424');
    // фонарь
  });
  // передний план: фонарь у бордюра (столб между окнами, плафон под плитой второго этажа) и дерево
  STREET.front = makeCanvas(W, H + STREET_UP, ({ r, g }) => {
    // осеннее дерево слева
    r(20, 130, 4, 80, '#4a3028'); for (const [cx, cy, rr, c] of [[22, 120, 22, '#7a3b2a'], [22, 116, 20, '#c4622f'], [16, 110, 10, '#e8913a'], [30, 122, 9, '#e8913a']]) { g.fillStyle = c; g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.fill(); }
    r(94, 92, 2, 118, '#1a1424'); r(95, 92, 1, 118, '#2a2238'); r(92, 205, 6, 5, '#1a1424'); r(94, 92, 15, 2, '#1a1424'); r(104, 94, 9, 3, '#2a2238'); r(105, 94, 7, 1, '#3a3450');
  });
  STREET.car = makeCanvas(102, 34, ({ r, p }) => {
    r(4, 14, 96, 13, '#6a2e3a'); r(22, 3, 52, 12, '#6a2e3a'); r(25, 5, 22, 9, '#2a2238'); r(50, 5, 21, 9, '#2a2238'); r(48, 5, 2, 9, '#6a2e3a');
    r(26, 6, 6, 1, '#4a4060'); r(51, 6, 6, 1, '#4a4060');
    r(4, 14, 96, 1, '#8a4a52'); r(22, 3, 52, 1, '#8a4a52'); r(4, 20, 96, 1, '#5a2430'); r(48, 15, 1, 11, '#5a2430'); r(40, 18, 4, 1, '#c9cdd6'); r(64, 18, 4, 1, '#c9cdd6');
    r(96, 16, 4, 4, '#f2d27a'); r(4, 16, 3, 4, '#b8443f'); r(2, 23, 100, 4, '#3a1a24');
    for (const x of [14, 74]) { r(x - 2, 20, 17, 8, '#3a1a24'); r(x, 21, 13, 13, '#120e1c'); r(x + 4, 25, 5, 5, '#6a6478'); p(x + 6, 27, '#a9a2b8'); }
  });
  // вместо снега — падающие листья
  STREET.snow = Array.from({ length: 26 }, () => ({ x: R() * W, y: R() * H, v: .01 + R() * .015, dx: (R() - .3) * .02, c: pick(R, ['#c4622f', '#e8913a', '#b8562e']) }));
  STREET.built = true;
}
function drawStreetFront() {
  ctx.save(); ctx.translate(0, -STREET_UP); sprite(STREET.front, 0, 0); rect(105, 97, 7, 1, '#fff1b8'); ctx.restore();
}
function drawStreet(dt, t) {
  if (!STREET.built) buildStreet();
  ctx.save(); ctx.translate(0, -STREET_UP);
  sprite(STREET.bg, 0, 0);
  if (Math.random() < dt / 700) { const w = pick(Math.random, STREET.windows); w.on = !w.on; }
  for (const w of STREET.windows) { rect(w.x, w.y, w.w, w.h, w.on ? w.warm : '#2a2440'); if (w.on && w.curtain) rect(w.x, w.y, 5, w.h, shade(w.warm, -35)); rect(w.x + 12, w.y, 2, w.h, '#4a3f62'); rect(w.x, w.y + 11, w.w, 2, '#4a3f62');
    if (w.on) { ctx.fillStyle = 'rgba(242,198,106,.07)'; ctx.fillRect(w.x - 3, w.y - 3, w.w + 6, w.h + 6); } }
  sprite(STREET.car, 292, 187);
  // свет над подъездом и фонарь: тёплые пятна на снегу
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const lamp = (x, y, rad, a) => { const gr = ctx.createRadialGradient(x, y, 1, x, y, rad); gr.addColorStop(0, `rgba(255,214,140,${a})`); gr.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = gr; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
  const flick = Math.sin(t / 53) > -.9 ? 1 : .4;
  lamp(STREET_DOOR_X, 136, 46, .32 * flick); lamp(STREET_DOOR_X, 196, 40, .16 * flick); lamp(108, 99, 28, .32); lamp(108, 204, 44, .14);
  ctx.restore();
  rect(STREET_DOOR_X - 3, 135, 6, 2, flick > .5 ? '#fff1b8' : '#6b6a5a'); 
  ctx.restore();
  for (const s of STREET.snow) { s.y += s.v * dt; s.x += s.dx * dt + Math.sin(t / 400 + s.y / 20) * .15; if (s.y > H) { s.y = -2; s.x = Math.random() * W; } rect(Math.round(s.x), Math.round(s.y), 2, 1, s.c); }
}
