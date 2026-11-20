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
const BLD = { TL: [198, 70], TR: [384, 84], BL: [186, 240], BR: [404, 240], STL: [158, 87], SBL: [142, 240], rows: 13, cols: 16 };   // 13 этажей, как в игре
const persp = v => Math.pow(v, 1.2);           // снизу этажи ближе — выше
function FF(u, v) { const T = lerp2(BLD.TL, BLD.TR, u), B = lerp2(BLD.BL, BLD.BR, u); return lerp2(T, B, persp(v)); }
function SF(u, v) { const T = lerp2(BLD.STL, BLD.TL, u), B = lerp2(BLD.SBL, BLD.BL, u); return lerp2(T, B, persp(v)); }

const NIGHT = { lang: null, t: 0, next: 0, windows: [], stars: [], snow: [], blinkers: [] };
function signText() { return ['БӘРІ ЖАҚСЫ БОЛАДЫ!', 'ВСЁ БУДЕТ ХОРОШО!', 'ALL WILL BE WELL!'][LI()]; }

function buildNight() {
  const R = rng(7);
  NIGHT.windows = []; NIGHT.blinkers = [];
  const win = (x, y, w, h, o = {}) => NIGHT.windows.push(Object.assign({ x: Math.round(x), y: Math.round(y), w: Math.max(2, Math.round(w)), h: Math.max(2, Math.round(h)),
    on: R() < .2, tv: R() < .02, warm: pick(R, ['#f2c66a', '#f7e3a1', '#e8a85a', '#f2c66a']), off: pick(R, ['#2a2440', '#2a2342', '#3a3356']) }, o));

  // ---- небо: сиреневые сумерки и большие кучевые облака в несколько ярусов ----
  NIGHT.sky = makeCanvas(W, H, ({ r }) => {
    const top = [28, 23, 52], mid = [59, 47, 92], low = [150, 100, 130];
    for (let y = 0; y < H; y++) { const k = y / H, A = k < .55 ? top : mid, B = k < .55 ? mid : low, t = k < .55 ? k / .55 : (k - .55) / .45;
      r(0, y, W, 1, `rgb(${A[0] + (B[0] - A[0]) * t | 0},${A[1] + (B[1] - A[1]) * t | 0},${A[2] + (B[2] - A[2]) * t | 0})`); }
    const RC = rng(12);
    const back = { body: '#41376a', light: '#4f4479', shadow: '#3a3160', edge: '#3d3365' },
      midP = { body: '#4b4075', light: '#5d5187', shadow: '#41376a', edge: '#463c6f' },
      front = { body: '#54487d', light: '#685c90', shadow: '#483d70', edge: '#4e4377' };
    pxCloud(r, RC, 300, 70, 190, back); pxCloud(r, RC, 210, 88, 130, back);
    pxCloud(r, RC, 330, 92, 150, midP); pxCloud(r, RC, 190, 104, 110, midP);
    pxCloud(r, RC, 280, 112, 140, front);
    pxCloud(r, RC, 56, 30, 70, back); pxCloud(r, RC, 150, 46, 46, midP);
  });

  // ---- дома: дальние панельки в дымке, соседний дом слева, наш дом справа ----
  NIGHT.mid = makeCanvas(W, H, ({ r, p, line, g }) => {
    // дальний ряд девятиэтажек
    for (const [x, w, top] of [[118, 44, 150], [168, 30, 160], [200, 40, 146], [-10, 30, 156]]) {
      r(x, top, w, 210 - top, '#3a3158'); r(x, top, w, 2, '#4a4068');
      for (let y = top + 5; y < 206; y += 6) for (let xx = x + 3; xx < x + w - 3; xx += 5) r(xx, y, 2, 3, R() < .22 ? pick(R, ['#c9a65e', '#b88e5a']) : '#2c2546');
      for (let y = top; y < 210; y++) r(x, y, w, 1, 'rgba(70,56,110,.18)');
    }
    // соседний дом слева (ближе, но в тени)
    const lx = -8, lw = 128, lt = 98, lfh = 13;
    r(lx, lt, lw, H - lt, '#3d3460'); r(lx, lt - 3, lw, 3, '#4f4672'); r(lx, lt - 3, lw, 1, '#6a6090');
    for (let f = 0; f < 10; f++) { const y = lt + 3 + f * lfh;
      r(lx, y + lfh - 2, lw, 1, '#463d68');
      for (let c = 0; c < 9; c++) { const x = lx + 6 + c * 14;
        if (c === 4) { win(x + 2, y + 3, 4, 5, { on: R() < .5, warm: '#b8c9a8', off: '#2a2440' }); continue; }
        if (c % 4 === 1) { r(x - 2, y + 7, 12, 4, '#4a4170'); r(x - 2, y + 7, 12, 1, '#5d5384'); }        // лоджии
        win(x, y + 1, 8, 7, { off: '#2a2442' }); } }
    r(30, lt - 10, 1, 7, '#1c1626'); r(27, lt - 8, 7, 1, '#1c1626');
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

  // ---- передний план: столб с проводами (видно, куда идут), кроны деревьев, земля ----
  NIGHT.fg = makeCanvas(W, H, ({ r, p }) => {
    const wire = (x0, y0, x1, y1, sag) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { const k = (x - x0) / (x1 - x0); p(x, Math.round(y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * sag), '#1c1626'); } };
    r(116, 94, 2, 6, '#1c1626'); r(114, 94, 6, 1, '#1c1626');                      // стойка на крыше соседнего дома
    wire(117, 95, 154, 128, 5); wire(117, 97, 153, 136, 4); r(152, 126, 3, 3, '#2a2238'); r(151, 134, 3, 3, '#2a2238');   // кронштейны на торце
    // кроны деревьев: пиксельные шапки с подсветкой сверху
    const crown = (cx, cy, w, h, d, l) => { for (let x = -w; x <= w; x += 2) { const hh = Math.round(h * Math.sqrt(Math.max(0, 1 - (x / w) ** 2)) * (.75 + .25 * Math.sin(x * 1.7 + cx)) / 2) * 2;
      r(cx + x, cy - hh, 2, hh + 40, d); if (Math.sin(x * .9 + cx) > .2) r(cx + x, cy - hh, 2, 2, l); } };
    crown(140, 200, 30, 22, '#1d1830', '#2c2544'); crown(176, 206, 22, 18, '#1a1428', '#2a2240'); crown(248, 210, 26, 16, '#1d1830', '#2c2544');
    crown(392, 204, 22, 20, '#1a1428', '#2a2240');
    r(0, 218, W, 7, '#120e1c');
  });

  NIGHT.stars = Array.from({ length: 50 }, () => ({ x: R() * W, y: R() * 50, ph: R() * 6, big: R() < .1 }));
  NIGHT.snow = Array.from({ length: 18 }, () => ({ x: R() * W, y: R() * H, v: .008 + R() * .012, dx: (R() - .3) * .015, big: R() < .3, c: pick(R, ['#c4622f', '#e8913a', '#b8562e']) }));

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
  
  for (const s of NIGHT.snow) { s.y += s.v * dt; s.x += s.dx * dt + Math.sin(t / 500 + s.y / 25) * .1; if (s.y > H) { s.y = -2; s.x = Math.random() * W; } rect(Math.round(s.x), Math.round(s.y), s.big ? 2 : 1, 1, s.c); }
}

/* ============================================================
   ДВОР У ПОДЪЕЗДА — пролог. Низ нашей панельки ночью, в той же холодной
   бирюзово-серой гамме, что подъезд и квартира. По 4 окна с каждой стороны
   от входа (как 4 квартиры на этаже), приоткрытая дверь светится подъездом.
   Сцена шире экрана — камера едет за героем.
   ============================================================ */
const STREET = { built: false, windows: [], leaves: [], vapor: [] };
const SWS = 600, STREET_DOOR_X = 300, STREET_GROUND = 132;
const ST_WIN = [85, 135, 185, 235, 365, 415, 465, 515];
function buildStreet() {
  const R = rng(19); STREET.windows = [];
  const C = { sky0: '#0a141c', sky1: '#1a3240', con: '#3a474b', conL: '#46545a', conD: '#2c373a', seam: '#283235', frame: '#8e9894', frameD: '#5e6866', glass: '#0f181e', sill: '#6e787c',
    plinth: '#283234', walk: '#2a3438', walkL: '#323e42', curb: '#56626a', road: '#182024', door: '#2c4a3c', doorL: '#3a5e4c', doorD: '#1e3428', rust: '#6a4a32', gas: '#a8903a', gasL: '#c8ac4a' };
  STREET.bg = makeCanvas(SWS, H, ({ r, p, g, line, ell }) => {
    // небо и дальние дома ЖК в дымке
    for (let y = 0; y < 130; y++) { const k = y / 130; r(0, y, SWS, 1, `rgb(${10 + k * 16 | 0},${20 + k * 30 | 0},${28 + k * 36 | 0})`); }
    for (let i = 0; i < 50; i++) p(R() * SWS, R() * 60, R() < .3 ? '#c8dce0' : '#5a7480');
    for (const [x0, x1, top] of [[-10, 46, 30], [556, 612, 22]]) { r(x0, top, x1 - x0, 112 - top, '#14232b'); r(x0, top, x1 - x0, 1, '#22343e');
      for (let y = top + 5; y < 108; y += 9) for (let x = x0 + 4; x < x1 - 4; x += 8) if (R() < .25) r(x, y, 4, 4, R() < .5 ? '#a8804a' : '#4a6a78'); }
    // фасад: бетонные панели со швами и потёками
    const fx = 40, fw = 520;
    r(fx, 0, fw, 112, C.con);
    for (let i = 0; i < 1400; i++) p(fx + R() * fw, R() * 112, R() < .5 ? C.conL : C.conD);
    for (const y of [-26, 44]) { r(fx, y, fw, 2, C.seam); r(fx, y + 2, fw, 1, C.conL); }
    for (let x = fx; x <= fx + fw; x += 50) { if (x > 255 && x < 345) continue; r(x, 0, 1, 112, C.seam); p(x + 1, 0, C.conL); }
    // выступ лестничной клетки — чуть светлее, с тенями по краям
    r(262, 0, 76, 112, '#3f4d51'); r(262, 0, 2, 112, '#2a3438'); r(336, 0, 2, 112, '#4c5a5e');
    for (let i = 0; i < 300; i++) p(262 + R() * 76, R() * 112, R() < .5 ? '#4a585c' : '#343f43');
    // окна квартир: 1-й этаж целиком, 2-й снизу; решётки, шторы, кондиционер, балконы
    const win = (cx, y0, h, row) => {
      const x = cx - 15, w0 = 30;
      r(x - 1, y0 - 1, w0 + 2, h + 2, C.seam); r(x, y0, w0, h, C.frame); r(x + 2, y0 + 2, w0 - 4, h - 4, C.glass);
      const w = { x: x + 2, y: y0 + 2, w: w0 - 4, h: h - 4, on: R() < .5, warm: pick(R, ['#e8b860', '#f2c870', '#d89a50', '#e8a868', '#7aa8c0']), curtain: R() < .5 };
      STREET.windows.push(w);
      w.mx = x + 14; w.my = y0 + Math.round(h / 3);
      // потёки под окном
      for (let k = 0; k < 4; k++) { const sx = x + 4 + R() * 22, l = 6 + R() * 14; for (let j = 0; j < l; j++) if (R() < .8) p(sx, y0 + h + 3 + j, 'rgba(24,32,36,.55)'); }
      r(x - 2, y0 + h, w0 + 4, 2, C.sill); r(x - 2, y0 + h, w0 + 4, 1, '#8e989c');
      return w;
    };
    for (const cx of ST_WIN) { const w = win(cx, 54, 36, 1); w.grille = R() < .45; }
    for (const cx of ST_WIN) win(cx, -14, 36, 2);
    // балконы 2-го этажа: ограждение из профлиста
    for (const cx of [135, 415, 515]) { r(cx - 22, 6, 44, 18, '#3e4c50'); for (let x = cx - 21; x < cx + 22; x += 3) r(x, 7, 1, 16, '#344246'); r(cx - 23, 5, 46, 2, '#56646a'); r(cx - 24, 24, 48, 3, '#2a3438'); r(cx - 24, 24, 48, 1, '#4a585c'); }
    // окна лестницы над козырьком
    for (const y of [-26, 10]) { r(291, y - 1, 18, 34, C.seam); r(292, y, 16, 32, C.frame); r(294, y + 2, 12, 28, '#2a3424'); r(299, y + 2, 1, 28, C.frameD); r(294, y + 15, 12, 1, C.frameD); }
    // газовая труба вдоль фасада и вводы в стену
    r(fx + 6, 46, fw - 12, 3, C.gas); r(fx + 6, 46, fw - 12, 1, C.gasL); for (let x = fx + 20; x < fx + fw; x += 40) r(x, 49, 1, 2, '#5a4a20');
    for (const ix of [fx + 6, 252, 548]) { r(ix, 46, 3, ix === 548 ? 66 : 8, C.gas); r(ix, 46, 1, ix === 548 ? 66 : 8, C.gasL); }
    r(545, 86, 10, 14, '#8a7a3a'); r(545, 86, 10, 1, '#a8963a'); r(552, 92, 1, 3, '#3a3020');
    // водосток
    r(48, 0, 3, 112, '#56626a'); r(48, 0, 1, 112, '#6e7c84'); for (let y = 8; y < 112; y += 26) r(47, y, 5, 1, '#2a3438'); r(46, 108, 7, 4, '#56626a');
    // козырёк над входом и лампочка под ним
    r(264, 60, 72, 6, '#56646a'); r(264, 60, 72, 1, '#76848a'); r(264, 66, 72, 2, '#1e282b'); for (let x = 268; x < 334; x += 9) p(x, 67, C.rust);
    r(298, 68, 4, 3, '#2a3034'); r(299, 71, 2, 2, '#fff1c4');
    // табличка подъезда
    r(315, 50, 14, 8, '#2e5a8a'); r(315, 50, 14, 1, '#4a7aaa'); g.fillStyle = '#e8eef4'; g.font = '8px ' + FONT; g.textBaseline = 'top'; g.textAlign = 'center'; g.fillText('1', 322, 50); g.textAlign = 'left';
    // дверь: крашеная зелёная сталь с ржавчиной, приоткрыта — изнутри свет подъезда
    r(282, 72, 36, 42, '#1a2226'); r(284, 74, 32, 40, '#2a3424');
    r(286, 76, 4, 38, '#7a8a4a');
    r(290, 74, 26, 40, C.door); r(290, 74, 26, 1, C.doorL); r(290, 74, 1, 40, C.doorL); r(315, 74, 1, 40, C.doorD);
    r(293, 78, 20, 14, C.doorD); r(294, 79, 18, 12, C.door); r(293, 96, 20, 15, C.doorD); r(294, 97, 18, 13, C.door);
    for (let i = 0; i < 26; i++) p(291 + R() * 24, 76 + R() * 37, R() < .6 ? C.rust : '#4a3a2a');
    r(292, 92, 3, 5, '#8a9094'); r(292, 92, 3, 1, '#b8bcc0');
    r(296, 82, 6, 8, '#c8c2b0'); r(297, 84, 4, 1, '#7a7466'); r(297, 86, 3, 1, '#7a7466'); r(304, 99, 7, 9, '#b8c8d4'); r(305, 101, 5, 1, '#6a7a86'); r(305, 103, 4, 1, '#6a7a86');
    r(300, 108, 6, 1, '#a84a3a'); r(301, 110, 4, 1, '#a84a3a');
    // домофон с оборванным проводом
    r(321, 86, 7, 12, '#1a2024'); r(322, 87, 5, 3, '#2a3a40'); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) p(322 + j * 2 + 1, 91 + i * 2, '#5a6870');
    line(324, 98, 326, 104, '#1a2024'); line(326, 104, 323, 108, '#1a2024'); p(323, 109, '#c84a3a');
    // объявления на стене
    for (const [ax, ay, c] of [[268, 84, '#c8c2b0'], [272, 94, '#b8c8d4'], [266, 99, '#d0c8b4'], [330, 76, '#c8c2b0']]) { r(ax, ay, 6, 8, c); r(ax + 1, ay + 2, 4, 1, '#7a7466'); r(ax + 1, ay + 4, 3, 1, '#7a7466'); }
    // цоколь с продухами подвала
    r(fx, 112, fw, 14, C.plinth); r(fx, 112, fw, 1, '#3a4448');
    for (let i = 0; i < 160; i++) p(fx + R() * fw, 113 + R() * 12, R() < .5 ? '#2e383b' : '#222b2e');
    STREET.vents = [];
    for (const vx of [110, 210, 390, 490]) { r(vx, 116, 12, 6, '#0b1012'); for (let k = 0; k < 4; k++) r(vx + 1 + k * 3, 116, 1, 6, '#2a3436'); STREET.vents.push(vx + 6); }
    // крыльцо: две ступени
    r(276, 114, 48, 6, '#56626a'); r(276, 114, 48, 1, '#6e7c84'); r(272, 120, 56, 6, '#4a565c'); r(272, 120, 56, 1, '#64727a');
    // тротуар из плитки, бордюр, асфальт двора с лужами и листьями
    r(0, 126, SWS, 26, C.walk); for (let y = 126; y < 152; y += 8) r(0, y, SWS, 1, '#232c30'); for (let x = 0; x < SWS; x += 16) for (let y = 126; y < 152; y += 8) r(x + ((y / 8) % 2) * 8, y, 1, 8, '#232c30');
    for (let i = 0; i < 260; i++) p(R() * SWS, 127 + R() * 24, R() < .5 ? C.walkL : '#262f33');
    for (let i = 0; i < 6; i++) { let cx = R() * SWS, cy = 128 + R() * 20; for (let k = 0; k < 10; k++) { p(cx | 0, cy | 0, '#1c2428'); cx += R() < .6 ? 1 : 0; cy += R() < .5 ? 1 : 0; } }
    r(0, 152, SWS, 3, C.curb); r(0, 152, SWS, 1, '#76848c'); r(0, 155, SWS, H - 155, C.road);
    for (let i = 0; i < 90; i++) r(R() * SWS, 158 + R() * 66, 3 + R() * 9, 1, '#141a1e');
    STREET.puddles = [[150, 168, 46], [380, 186, 60], [520, 162, 30]];
    for (const [px, py, pw] of STREET.puddles) { ell(px, py, pw / 2, 3, '#101a20'); ell(px, py, pw / 2 - 3, 2, '#14222a'); }
    for (let i = 0; i < 70; i++) p(R() * SWS, 128 + R() * 90, pick(R, ['#8a4a26', '#a85a2a', '#6a3a22']));
  });
  // передний план: фонарь на тротуаре и осеннее дерево
  STREET.front = makeCanvas(SWS, H, ({ r, p }) => {
    r(20, 40, 5, 112, '#141a1c'); r(21, 40, 1, 112, '#202a2c'); r(24, 70, 8, 2, '#141a1c'); r(14, 62, 6, 2, '#141a1c');
    const crown = [['#4a2e22', 0], ['#6a3a24', 1], ['#8a4a2a', 2], ['#a85e30', 3]];
    for (const [cx, cy, rx, ry] of [[24, 34, 22, 16], [6, 46, 12, 10], [40, 44, 13, 10], [22, 18, 14, 10]]) for (const [col, l] of crown)
      for (let i = 0; i < rx * ry * .9; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()), x = cx + Math.cos(a) * rx * d * (1 - l * .12) - l, y = cy + Math.sin(a) * ry * d * (1 - l * .12) - l; r(x | 0, y | 0, 2, 2, col); }
    // фонарь: столб, кронштейн, плафон
    r(169, 14, 2, 140, '#12181a'); r(170, 14, 1, 140, '#222c2e'); r(166, 150, 8, 4, '#12181a'); r(169, 12, 18, 2, '#12181a'); r(182, 13, 8, 3, '#222c2e'); r(183, 16, 6, 1, '#fff0c0');
  });
  STREET.car = makeCanvas(96, 30, ({ r, p }) => {
    r(4, 12, 90, 12, '#3a4a5a'); r(22, 3, 48, 10, '#3a4a5a'); r(25, 5, 20, 7, '#16222a'); r(48, 5, 19, 7, '#16222a'); r(46, 5, 2, 8, '#3a4a5a');
    r(4, 12, 90, 1, '#56687a'); r(22, 3, 48, 1, '#56687a'); r(4, 18, 90, 1, '#2a3846'); r(46, 13, 1, 10, '#2a3846'); r(38, 16, 4, 1, '#8a98a4'); r(60, 16, 4, 1, '#8a98a4');
    r(90, 14, 4, 3, '#e8d090'); r(4, 14, 3, 3, '#a83a3a'); r(2, 21, 92, 3, '#1a242c');
    for (const x of [14, 70]) { r(x - 2, 18, 16, 7, '#1a242c'); ell(x + 6, 24, 6, 6, '#0a0e10'); ell(x + 6, 24, 3, 3, '#4a5660'); p(x + 6, 24, '#8a98a4'); }
    function ell(cx, cy, rx, ry, col) { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if (x * x / (rx * rx + .5) + y * y / (ry * ry + .5) <= 1) r(cx + x, cy + y, 1, 1, col); }
  });
  STREET.leaves = Array.from({ length: 22 }, () => ({ x: R() * SWS, y: R() * H, v: .008 + R() * .012, dx: (R() - .3) * .02, c: pick(R, ['#8a4a26', '#a85a2a', '#b8642e']) }));
  STREET.built = true;
}
function drawStreetFront(cx = 0) { ctx.save(); ctx.translate(-cx, 0); sprite(STREET.front, 0, 0); ctx.restore(); }
function drawStreet(dt, t, cx = 0) {
  if (!STREET.built) buildStreet();
  ctx.save(); ctx.translate(-cx, 0);
  sprite(STREET.bg, 0, 0);
  if (Math.random() < dt / 900) { const w = pick(Math.random, STREET.windows); w.on = !w.on; }
  for (const w of STREET.windows) {
    rect(w.x, w.y, w.w, w.h, w.on ? w.warm : '#0f181e');
    if (w.on) { if (w.curtain) { rect(w.x, w.y, 6, w.h, shade(w.warm, -40)); rect(w.x + w.w - 5, w.y, 5, w.h, shade(w.warm, -40)); } rect(w.x, w.y, w.w, 1, shade(w.warm, -25)); }
    else { rect(w.x + 2, w.y + 2, 4, 1, '#22323a'); rect(w.x + 2, w.y + 3, 1, 3, '#22323a'); }
    rect(w.mx, w.y, 2, w.h, '#8e9894'); rect(w.x, w.my, w.w, 2, '#8e9894');
    if (w.grille) { for (let x = w.x; x < w.x + w.w; x += 4) rect(x, w.y - 1, 1, w.h + 2, '#151c20'); rect(w.x - 1, w.y + 6, w.w + 2, 1, '#151c20'); rect(w.x - 1, w.y + w.h - 6, w.w + 2, 1, '#151c20'); }
  }
  // окна лестницы светятся тем же оливковым светом, что внутри подъезда (лампы мигают)
  const sf = Math.sin(t / 97) > -.8 ? 1 : .3;
  for (const y of [-24, 12]) { rect(294, y, 12, 28, sf > .5 ? '#8a9258' : '#3a4430'); rect(299, y, 1, 28, '#5e6866'); rect(294, y + 13, 12, 1, '#5e6866'); }
  sprite(STREET.car, 470, 158);
  // свет: лампа над дверью, фонарь, окна; отражения в лужах
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const glow = (x, y, rad, a, c = '255,200,120') => { const gr = ctx.createRadialGradient(x, y, 1, x, y, rad); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = gr; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
  const fl = Math.sin(t / 53) > -.88 ? 1 : .35;
  glow(300, 72, 42, .30 * fl); glow(300, 130, 40, .14 * fl); glow(288, 96, 16, .16, '170,190,110');
  glow(186, 18, 26, .38); glow(186, 140, 70, .16);
  for (const w of STREET.windows) if (w.on && w.y > 40) glow(w.x + w.w / 2, w.y + w.h + 6, 22, .07);
  for (const [px, py, pw] of STREET.puddles) { ctx.fillStyle = 'rgba(255,200,120,.10)'; ctx.fillRect(px - pw / 2 + 6, py - 1, pw - 12, 1); ctx.fillStyle = 'rgba(140,190,210,.08)'; ctx.fillRect(px - pw / 2 + 3, py + 1, pw - 6, 1); }
  ctx.restore();
  rect(299, 71, 2, 2, fl > .5 ? '#fff1c4' : '#6b6a5a');
  // из продухов подвала поднимается сырой пар
  for (const vx of STREET.vents) for (let i = 0; i < 3; i++) { const k = (t / 2600 + i / 3 + vx * .01) % 1; ctx.globalAlpha = Math.sin(k * Math.PI) * .22; rect(Math.round(vx - 3 + Math.sin(t / 500 + i + vx) * 3), Math.round(116 - k * 22), 6, 2, '#9ab0a0'); }
  ctx.globalAlpha = 1;
  ctx.restore();
  for (const s of STREET.leaves) { s.y += s.v * dt; s.x += s.dx * dt + Math.sin(t / 400 + s.y / 20) * .15; if (s.y > H) { s.y = -2; s.x = Math.random() * SWS; } rect(Math.round(s.x - cx * .2) % W, Math.round(s.y), 2, 1, s.c); }
}
