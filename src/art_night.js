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
const BLD = { TL: [198, 80], TR: [384, 93], BL: [186, 240], BR: [404, 240], STL: [158, 96], SBL: [142, 240], rows: 17, cols: 16 };
const persp = v => Math.pow(v, 1.2);           // снизу этажи ближе — выше
function FF(u, v) { const T = lerp2(BLD.TL, BLD.TR, u), B = lerp2(BLD.BL, BLD.BR, u); return lerp2(T, B, persp(v)); }
function SF(u, v) { const T = lerp2(BLD.STL, BLD.TL, u), B = lerp2(BLD.SBL, BLD.BL, u); return lerp2(T, B, persp(v)); }

const NIGHT = { lang: null, t: 0, next: 0, windows: [], stars: [], snow: [], blinkers: [] };
function signText() { return LANG === 'kz' ? 'БӘРІ ЖАҚСЫ БОЛАДЫ!' : 'ВСЁ БУДЕТ ХОРОШО!'; }

function buildNight() {
  const R = rng(7);
  NIGHT.windows = []; NIGHT.blinkers = [];
  const win = (x, y, w, h, o = {}) => NIGHT.windows.push(Object.assign({ x: Math.round(x), y: Math.round(y), w: Math.max(2, Math.round(w)), h: Math.max(2, Math.round(h)),
    on: R() < .2, tv: R() < .02, warm: pick(R, ['#f2c66a', '#f7e3a1', '#e8a85a', '#f2c66a']), off: pick(R, ['#1c2233', '#20273a', '#252c40']) }, o));

  // ---- небо ----
  NIGHT.sky = makeCanvas(W, H, ({ r }) => {
    for (let y = 0; y < H; y++) { const k = y / H; r(0, y, W, 1, `rgb(${13 + k * 22 | 0},${22 + k * 30 | 0},${44 + k * 40 | 0})`); }
    // зарево города у горизонта
    for (let y = 120; y < H; y++) { const k = (y - 120) / (H - 120); r(0, y, W, 1, `rgba(214,120,84,${(k * k * .28).toFixed(3)})`); }
  });

  // ---- город, соседние дома, главная высотка ----
  NIGHT.mid = makeCanvas(W, H, ({ r, p, line, g }) => {
    // дальний город: ряды силуэтов с редкими огнями
    for (const [base, col, hMin, hMax, dens] of [[196, '#1b2338', 10, 36, .05], [204, '#151c2e', 14, 48, .08]]) {
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
    r(116, 104, 26, 140, '#1d243a'); r(116, 104, 26, 1, '#2c3550'); r(128, 96, 2, 8, '#1d243a');
    NIGHT.blinkers.push({ x: 128, y: 95, ph: 1 });
    for (let yy = 108; yy < 210; yy += 5) for (let xx = 119; xx < 140; xx += 4) if (R() < .18) r(xx, yy, 2, 2, '#c9a65e');
    // соседний дом слева (девятиэтажка, прямо)
    const nx = -6, nw = 98, ny = 124;
    r(nx, ny, nw, H - ny, '#2a3248'); r(nx, ny - 3, nw + 2, 3, '#20273a'); r(nx, ny - 3, nw + 2, 1, '#3a4460');
    r(40, ny - 14, 1, 11, '#141a28'); r(36, ny - 12, 9, 1, '#141a28'); r(38, ny - 9, 5, 1, '#141a28');
    for (let row = 0; row < 9; row++) {
      const y = ny + 5 + row * 11; r(nx, y + 8, nw, 1, '#38415a');
      for (let c = 0; c < 7; c++) { if (c === 3) { win(nx + 6 + c * 13 + 2, y + 3, 3, 4, { on: R() < .6, warm: '#b8c9a8' }); continue; } win(nx + 6 + c * 13, y + 1, 7, 6); }
    }
    // ===== главная высотка =====
    const { TL, TR, BL, BR, STL, SBL, rows, cols } = BLD;
    fillPoly(g, [STL, TL, BL, SBL], '#2b3247');                         // торец
    fillPoly(g, [TL, TR, BR, BL], '#58627d');                            // фасад
    // фасад темнеет кверху (дальше от фонарей двора)
    g.save(); g.beginPath(); g.moveTo(TL[0], TL[1]); g.lineTo(TR[0], TR[1]); g.lineTo(BR[0], BR[1]); g.lineTo(BL[0], BL[1]); g.closePath(); g.clip();
    for (let y = TL[1] - 2; y < 170; y += 2) { const k = 1 - (y - TL[1]) / (170 - TL[1]); g.fillStyle = `rgba(14,18,32,${(Math.max(0, k) * .4).toFixed(3)})`; g.fillRect(0, y, W, 2); }
    g.restore();
    // вертикальные швы панелей и колонна лестничной клетки
    for (let c = 2; c < cols; c += 2) { const a = FF(c / cols, 0), b = FF(c / cols, 1); line(a[0], a[1], b[0], b[1], '#4c5570'); }
    const sc0 = 7 / cols, sc1 = 8 / cols;
    fillPoly(g, [FF(sc0, 0), FF(sc1, 0), FF(sc1, 1), FF(sc0, 1)], '#4b5470');
    // этажи: плиты балконов (светлые полосы) и окна
    for (let row = 0; row < rows; row++) {
      const vb = (row + .86) / rows, a = FF(0, vb), b = FF(1, vb);
      line(a[0], a[1], b[0], b[1], '#8792ad'); line(a[0], a[1] + 1, b[0], b[1] + 1, '#3a4258');
      const sa = SF(0, vb), sb = SF(1, vb); line(sa[0], sa[1], sb[0], sb[1], '#3a4360');
      for (let c = 0; c < cols; c++) {
        if (c === 7) { const p0 = FF((c + .3) / cols, (row + .4) / rows), p1 = FF((c + .7) / cols, (row + .62) / rows);
          win(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1], { on: R() < .7, warm: '#c4d6b4', off: '#232a3c' }); continue; }
        const ctr = FF((c + .5) / cols, (row + .2) / rows), bot = FF((c + .5) / cols, (row + .7) / rows), cw = FF((c + 1) / cols, (row + .5) / rows)[0] - FF(c / cols, (row + .5) / rows)[0];
        const ww = Math.round(cw * .66), hh = Math.max(3, Math.round(bot[1] - ctr[1]));
        win(Math.round(ctr[0] - ww / 2), Math.round(ctr[1]), ww, hh, { front: true });
      }
      for (let c = 0; c < 3; c++) { const p0 = SF((c + .3) / 3, (row + .26) / rows), p1 = SF((c + .62) / 3, (row + .66) / rows);
        win(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1], { on: R() < .14, off: '#1a2030' }); }
    }
    // угол дома — светлое ребро; парапет и надстройки на крыше
    line(TL[0], TL[1], BL[0], BL[1], '#6d7893');
    fillPoly(g, [[STL[0] - 1, STL[1] - 3], [TL[0], TL[1] - 3], [TL[0], TL[1]], [STL[0] - 1, STL[1]]], '#252c40');
    fillPoly(g, [[TL[0], TL[1] - 3], [TR[0] + 1, TR[1] - 3], [TR[0] + 1, TR[1]], [TL[0], TL[1]]], '#3b4460');
    line(TL[0], TL[1] - 3, TR[0] + 1, TR[1] - 3, '#5d6884');
    // стойки вывески
    for (const u of [.2, .5, .8]) { const q = FF(u, 0); r(q[0], q[1] - 9, 1, 7, '#1a1e2a'); }
  });

  // ---- передний план: крыша, на которой «стоит» зритель, и угол дома справа ----
  NIGHT.fg = makeCanvas(W, H, ({ r, p, line, g }) => {
    fillPoly(g, [[0, 205], [206, 212], [206, H], [0, H]], '#0a0d14');
    line(0, 205, 206, 212, '#1f2533');
    r(46, 176, 1, 30, '#141925'); r(38, 180, 17, 1, '#141925'); r(41, 185, 11, 1, '#141925'); r(43, 190, 7, 1, '#141925');
    r(150, 196, 6, 13, '#11151f'); r(149, 195, 8, 2, '#1a2030');
    fillPoly(g, [[368, 128], [400, 120], [400, H], [362, H]], '#0c0f17');
    line(368, 128, 400, 120, '#1b2130');
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
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55 + .08 * Math.sin(t / 140); ctx.drawImage(S.glow, S.x - 12, S.y - 12); ctx.restore();
  ctx.drawImage(S.on, S.x, S.y);
  if (S.flick >= 0 && Math.floor(t / 60) % 3) { const [lx, lw] = S.letters[S.flick]; ctx.drawImage(S.off, lx, 0, lw, S.off.height, S.x + lx, S.y, lw, S.off.height); }
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
  STREET.bg = makeCanvas(W, H + STREET_UP, ({ r, p, line, g }) => {
    for (let y = 0; y < H; y++) { const k = y / H; r(0, y, W, 1, `rgb(${13 + k * 22 | 0},${22 + k * 30 | 0},${44 + k * 40 | 0})`); }
    for (let i = 0; i < 40; i++) p(R() * W, R() * 90, '#9fb0cc');
    // соседние дома по бокам
    r(0, 70, 44, 130, '#222a3e'); r(0, 70, 44, 1, '#34405a');
    for (let y = 76; y < 186; y += 12) for (let x = 4; x < 40; x += 10) if (R() < .35) r(x, y, 5, 6, '#e8b860'); else r(x, y, 5, 6, '#1a2030');
    r(366, 56, 34, 144, '#222a3e'); r(366, 56, 34, 1, '#34405a');
    for (let y = 62; y < 186; y += 12) for (let x = 370; x < 398; x += 10) if (R() < .3) r(x, y, 5, 6, '#e8b860'); else r(x, y, 5, 6, '#1a2030');
    // фасад нашего дома
    const fx = 52, fw = 306;
    r(fx, 0, fw, 186, '#4a5369');
    for (let y = 0; y < 186; y++) { const k = y / 186; r(fx, y, fw, 1, `rgba(10,14,26,${(.3 - k * .25).toFixed(3)})`); }
    for (let x = fx; x <= fx + fw; x += 34) r(x, 0, 1, 186, '#3c445a');
    for (const y of [0, 62, 124]) { r(fx, y + 58, fw, 4, '#5c6680'); r(fx, y + 58, fw, 1, '#76809a'); r(fx, y + 62, fw, 1, '#2c3346'); }
    r(fx, 180, fw, 6, '#3a4152'); r(fx, 180, fw, 1, '#565e72');                        // цоколь
    for (const x of [74, 134, 286, 330]) { r(x, 181, 10, 4, '#0b0d12'); }               // продухи подвала
    // подтёки у цоколя и грязь
    for (let i = 0; i < 26; i++) { const x = fx + R() * fw; r(x, 150 + R() * 20, 1, 8 + R() * 16, 'rgba(20,24,30,.25)'); }
    // окна квартир: 3 этажа, колонна лестницы посередине
    for (const fy of [-2, 60, 122]) for (const x of [64, 104, 144, 254, 294, 334]) {
      r(x - 1, fy + 14, 22, 28, '#363d50'); STREET.windows.push({ x, y: fy + 15, w: 20, h: 26, on: R() < .4, warm: pick(R, ['#f2c66a', '#f7e3a1', '#e8a85a']) });
    }
    for (const y of [36, 98]) { r(STREET_DOOR_X - 6, y, 13, 20, '#363d50'); r(STREET_DOOR_X - 5, y + 1, 11, 18, '#9fb596'); r(STREET_DOOR_X - 5, y + 9, 11, 1, '#5d6e58'); }
    // подъезд: козырёк, дверь, домофон, ступени
    const dx = STREET_DOOR_X;
    r(dx - 30, 128, 60, 5, '#68718a'); r(dx - 30, 128, 60, 1, '#8a93aa'); r(dx - 30, 133, 60, 2, '#1c2130');
    r(dx - 30, 126, 60, 2, '#dfe6f2');                                                    // снег на козырьке
    r(dx - 14, 138, 28, 48, '#1d222c'); r(dx - 12, 140, 24, 46, '#2f3a4a'); r(dx - 12, 140, 24, 1, '#46546a');
    r(dx - 10, 144, 20, 18, '#35425a'); r(dx - 10, 166, 20, 17, '#35425a'); r(dx + 6, 162, 3, 3, '#c9a95a');
    r(dx + 17, 152, 7, 11, '#1b1f27'); r(dx + 18, 153, 5, 4, '#3d6a5c'); for (let i = 0; i < 3; i++) r(dx + 18 + i * 2, 159, 1, 1, '#8f949c');
    r(dx - 7, 134, 14, 3, '#d6d0bc'); g.fillStyle = '#2b2a33'; g.font = '8px ' + FONT; g.textBaseline = 'top';
    r(dx - 20, 186, 40, 3, '#6a7184'); r(dx - 24, 189, 48, 3, '#5b6274'); r(dx - 20, 186, 40, 1, '#8a91a2');
    // объявления у двери
    r(dx - 26, 146, 9, 12, '#d8d2bf'); r(dx - 25, 148, 7, 1, '#7a7466'); r(dx - 25, 151, 5, 1, '#7a7466'); r(dx - 27, 162, 8, 9, '#c9d6e6');
    // земля: тротуар под снегом, бордюр, дорога
    r(0, 186, W, 26, '#3c4660'); for (let i = 0; i < 160; i++) p(R() * W, 188 + R() * 22, pick(R, ['#4c5774', '#56627f', '#323b52']));
    r(0, 186, W, 2, '#6c7896');
    r(0, 210, W, 2, '#7d88a3'); r(0, 212, W, H + STREET_UP - 212, '#1e2433');
    for (let i = 0; i < 60; i++) r(R() * W, 214 + R() * 70, 4 + R() * 10, 1, '#2a3244');
    // лавочка
    const bx = 276; r(bx, 192, 2, 8, '#15181f'); r(bx + 28, 192, 2, 8, '#15181f'); r(bx - 2, 190, 34, 3, '#5a3e2e'); r(bx - 2, 183, 34, 3, '#5a3e2e'); r(bx - 2, 182, 34, 1, '#dfe6f2'); r(bx - 2, 189, 34, 1, '#dfe6f2');
    // фонарь
    r(84, 104, 2, 106, '#1a1e28'); r(84, 104, 14, 2, '#1a1e28'); r(94, 106, 7, 3, '#2a2f3c');
  });
  STREET.car = makeCanvas(76, 24, ({ r, p }) => {
    r(4, 9, 68, 10, '#5a2a2a'); r(16, 2, 38, 8, '#5a2a2a'); r(18, 3, 15, 6, '#1b2030'); r(35, 3, 17, 6, '#1b2030');
    r(4, 9, 68, 1, '#7a3c38'); r(16, 1, 38, 2, '#e3e8f0'); r(4, 8, 12, 1, '#e3e8f0'); r(56, 8, 16, 1, '#e3e8f0');
    r(70, 11, 2, 3, '#f2d27a'); r(4, 11, 2, 3, '#b8443f'); r(4, 16, 68, 3, '#3a1c1c');
    for (const x of [14, 54]) { r(x, 15, 9, 9, '#0d0f14'); r(x + 3, 18, 3, 3, '#4a4f5a'); }
  });
  STREET.snow = Array.from({ length: 70 }, () => ({ x: R() * W, y: R() * H, v: .006 + R() * .014, dx: (R() - .5) * .012 }));
  STREET.built = true;
}
function drawStreet(dt, t) {
  if (!STREET.built) buildStreet();
  ctx.save(); ctx.translate(0, -STREET_UP);
  sprite(STREET.bg, 0, 0);
  if (Math.random() < dt / 700) { const w = pick(Math.random, STREET.windows); w.on = !w.on; }
  for (const w of STREET.windows) { rect(w.x, w.y, w.w, w.h, w.on ? w.warm : '#1c2233'); rect(w.x + 9, w.y, 2, w.h, '#363d50'); rect(w.x, w.y + 9, w.w, 2, '#363d50');
    if (w.on) { ctx.fillStyle = 'rgba(242,198,106,.07)'; ctx.fillRect(w.x - 3, w.y - 3, w.w + 6, w.h + 6); } }
  sprite(STREET.car, 314, 196);
  // свет над подъездом и фонарь: тёплые пятна на снегу
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const lamp = (x, y, rad, a) => { const gr = ctx.createRadialGradient(x, y, 1, x, y, rad); gr.addColorStop(0, `rgba(255,214,140,${a})`); gr.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = gr; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
  const flick = Math.sin(t / 53) > -.9 ? 1 : .4;
  lamp(STREET_DOOR_X, 136, 46, .32 * flick); lamp(STREET_DOOR_X, 196, 40, .16 * flick); lamp(97, 110, 30, .35); lamp(97, 200, 46, .14);
  ctx.restore();
  rect(STREET_DOOR_X - 3, 135, 6, 2, flick > .5 ? '#fff1b8' : '#6b6a5a'); rect(95, 109, 5, 1, '#fff1b8');
  ctx.restore();
  for (const s of STREET.snow) { s.y += s.v * dt; s.x += s.dx * dt; if (s.y > H) { s.y = -2; s.x = Math.random() * W; } rect(s.x, s.y, 1, 1, 'rgba(230,236,245,.75)'); }
}
