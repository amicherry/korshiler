/* ============================================================
   КАРТА ЖК — главный экран между собраниями.
   Весь дом и двор на одной картинке. Каждая проблема и украшение
   рисуются в двух состояниях: «до» и «после ремонта»; покупка
   запускает анимацию установки, и изменение остаётся навсегда.
   ============================================================ */
let HOUSE_STATE = { fixed: [], decor: [], won: [], coins: 0, score: 0, bonus: 0, claimable: false };
const has = id => HOUSE_STATE.fixed.includes(id) || HOUSE_STATE.decor.includes(id);
// собрание i: открыто ли и почему нет (правила общие с сервером — content.js)
function tourInfo(i) {
  const T = LEVELS[i], o = tourOpen(T, HOUSE_STATE);
  const why = o.ok ? '' : o.why === 'prev' ? L(UI.lkPrev).replace('{n}', o.need.n) : o.why === 'fix' ? L(UI.lkFix).replace('{p}', L(o.need.name)) : L(UI.lkFixCount).replace('{n}', o.n);
  return { L: T, won: HOUSE_STATE.won.includes(T.id), open: o.ok, why };
}

// геометрия дома на карте
const HM = { x0: 100, x1: 300, top: 41, fh: 11, floors: 13, ground: 186 };   // 13 этажей, как в подъезде
HM.bottom = HM.top + HM.fh * HM.floors;   // 184
const HSPOT = {   // где на карте каждая вещь (для подсветки и нажатия)
  light: [200, 112, 20, 130], door: [200, 174, 22, 16], roof: [170, 41, 60, 12], basement: [92, 181, 20, 12],
  playground: [348, 206, 90, 30], lift: [140, 37, 30, 12], antenna: [268, 26, 22, 24],
  pit: [228, 196, 20, 8], yard: [256, 190, 50, 12], cameras: [222, 160, 14, 12], walls: [150, 120, 30, 30], letnik: [60, 204, 70, 26],
};

const HOUSE_ART = { built: false };
const p = (x, y, c) => rect(x, y, 1, 1, c);   // одиночный пиксель вне makeCanvas
function pxLine(x0, y0, x1, y1, col) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) rect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1, col); }
// палитра по референсам: сиреневые сумерки, облака, луна, тёплые и розовые окна
const HP = { sky0: '#1c1734', sky1: '#3b2f5c', sky2: '#7a5f8e', sky3: '#c98f8f', cloud: '#5e4f86', cloudL: '#8676ad', cloudD: '#43386a',
  far: '#352b52', wall: '#6d6488', wallL: '#857ca0', wallD: '#544b70', stain: '#5b5378', ground: '#3b3049', groundL: '#55466a', slab: '#8f86a8' };
const WIN_COLS = ['#f2b84a', '#f5c96a', '#e8913a', '#ec9d8f', '#9a6ad0', '#f2b84a'];
function buildHouseArt() {
  const R = rng(5);
  HOUSE_ART.bg = makeCanvas(W, H, ({ r, p, g }) => {
    // небо: от тёмно-синего к сиреневому и розовому у горизонта
    const stops = [[0, HP.sky0], [.45, HP.sky1], [.75, HP.sky2], [.9, HP.sky3]];
    for (let y = 0; y < H; y++) { const k = y / 190; let i = 0; while (i < stops.length - 2 && k > stops[i + 1][0]) i++;
      const [k0, c0] = stops[i], [k1, c1] = stops[i + 1], t = Math.max(0, Math.min(1, (k - k0) / (k1 - k0)));
      const mix = (a, b) => Math.round(parseInt(a, 16) + (parseInt(b, 16) - parseInt(a, 16)) * t);
      r(0, y, W, 1, `rgb(${mix(c0.slice(1, 3), c1.slice(1, 3))},${mix(c0.slice(3, 5), c1.slice(3, 5))},${mix(c0.slice(5, 7), c1.slice(5, 7))})`); }
    for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * 90; p(x, y, R() < .25 ? '#f4f3ee' : '#a99fc8'); if (R() < .08) { p(x - 1, y, '#a99fc8'); p(x + 1, y, '#a99fc8'); p(x, y - 1, '#a99fc8'); p(x, y + 1, '#a99fc8'); } }
    // облака: пиксельные, приглушённые
    pxCloud(r, R, 60, 54, 70); pxCloud(r, R, 250, 40, 52); pxCloud(r, R, 336, 72, 46); pxCloud(r, R, 150, 84, 40);
    // дальние дома: сиреневые силуэты с тёплыми окнами
    let x = -4; while (x < W) { const w = 16 + R() * 26, h = 30 + R() * 55; r(x, 186 - h, w, h, HP.far); r(x, 186 - h, w, 1, '#463a66');
      for (let yy = 190 - h; yy < 182; yy += 6) for (let xx = x + 2; xx < x + w - 3; xx += 5) if (R() < .18) r(xx, yy, 3, 3, pick(R, ['#e8a24a', '#d98a6a', '#c9a65e'])); x += w + 3; }
    // ===== соседние дома ЖК: такие же панельки, но дальше и в дымке =====
    const neighbour = (x0, x1, top, fh, floors) => {
      const bot = top + fh * floors;
      r(x0, top, x1 - x0, bot - top + 6, '#433c62'); r(x0, top - 3, x1 - x0, 3, '#3e3760'); r(x0, top - 3, x1 - x0, 1, '#6a6090');
      for (let f = 0; f < floors; f++) { const y = top + f * fh; r(x0, y, x1 - x0, 1, '#433c66');
        for (let wx = x0 + 5; wx < x1 - 8; wx += 13) { const lit = R() < .3; r(wx, y + 2, 8, fh - 4, lit ? pick(R, ['#c8935a', '#b8805a', '#a87a8a']) : '#2e2848'); if (R() < .25) r(wx - 1, y + fh - 2, 10, 1, '#6a6090'); } }
      for (let i = 0; i < 20; i++) r(x0 + R() * (x1 - x0), top + R() * (bot - top), 1, 3 + R() * 8, '#463f68');
      r(x0, bot, x1 - x0, 6, '#3a3356');
      for (let y = top - 3; y < bot + 6; y++) r(x0, y, x1 - x0, 1, 'rgba(24,18,44,.28)');                     // дымка: соседи темнее нашего дома
    };
    neighbour(-14, 84, 60, 9, 14); neighbour(316, 414, 54, 10, 13);
    // земля двора
    r(0, HM.ground, W, H - HM.ground, HP.ground); r(0, HM.ground, W, 6, HP.groundL); r(0, HM.ground, W, 1, '#8a78a0');
    for (let i = 0; i < 140; i++) p(R() * W, HM.ground + 7 + R() * 32, pick(R, ['#332a42', '#46395a', '#4e4064']));
    // дом: бетон с потёками, швы панелей
    const { x0, x1, top, fh, floors } = HM, hb = HM.bottom - top + 5;
    r(x0, top, x1 - x0, hb, HP.wall); r(x0, top, 2, hb, HP.wallL); r(x1 - 2, top, 2, hb, HP.wallD);
    r(176, top, 48, hb, '#665d82');                                               // лестничная клетка
    for (let f = 0; f <= floors; f++) r(x0, top + f * fh, x1 - x0, 1, HP.wallD);
    for (const sx of [138, 176, 224, 262]) r(sx, top, 1, HM.bottom - top, HP.wallD);
    for (let i = 0; i < 46; i++) { const sx = x0 + R() * (x1 - x0), sy = top + R() * (hb - 10); r(sx, sy, 1, 4 + R() * 12, HP.stain); if (R() < .3) r(sx - 1, sy, 3, 1, HP.stain); }
    // закатный свет на правом торце (как на референсе)
    for (let y = top; y < HM.bottom; y++) { r(x1 - 14, y, 12, 1, 'rgba(240,140,70,.18)'); r(x1 - 6, y, 4, 1, 'rgba(250,160,80,.22)'); }
    r(x0 - 2, top - 4, x1 - x0 + 4, 4, '#4e4569'); r(x0 - 2, top - 4, x1 - x0 + 4, 1, '#7a6f98');      // парапет
    r(x0, HM.bottom, x1 - x0, 2, '#463d5e');                                                        // цоколь
    // ===== крыша: вентиляционные выходы, кирпичные трубы, старые антенны-«рогатки», кабели =====
    for (const vx of [172, 228]) { r(vx, top - 10, 8, 6, '#4e4569'); r(vx - 1, top - 11, 10, 2, '#7a6f98'); r(vx + 2, top - 8, 4, 3, '#2a2440'); }
    for (const cx of [248, 158]) { r(cx, top - 13, 6, 9, '#7a4a3a'); for (let yy = top - 12; yy < top - 4; yy += 2) r(cx, yy, 6, 1, (yy / 2) % 2 ? '#8a5a48' : '#6a3e30'); r(cx - 1, top - 14, 8, 2, '#4e4569'); }
    for (const ax of [208, 236]) { r(ax, top - 18, 1, 14, '#5a5070'); r(ax - 4, top - 16, 9, 1, '#5a5070'); r(ax - 3, top - 13, 7, 1, '#5a5070'); }
    for (let k = 0; k <= 40; k++) p(236 + k, top - 4 + Math.round(Math.sin(k / 40 * Math.PI) * 3), '#2a2238');          // кабель по крыше
    // ===== водостоки по углам: воронка, хомуты, отлив внизу =====
    for (const dx of [101, 297]) { r(dx - 1, top - 3, 4, 3, '#7a6f98'); r(dx, top, 2, HM.bottom - top + 3, '#8a80a8'); r(dx, top, 1, HM.bottom - top + 3, '#a198bd');
      for (let yy = top + 6; yy < HM.bottom; yy += HM.fh * 2) r(dx - 1, yy, 4, 1, '#4e4569'); r(dx - 1, HM.bottom + 3, 5, 2, '#8a80a8'); }
    // ===== жёлтая газовая труба вдоль фасада, с опусками и кронштейнами =====
    { const gy = HM.bottom - HM.fh - 1;   // по шву между первым и вторым этажом, не через окна
      r(102, gy, 196, 2, '#d9b43a'); r(102, gy, 196, 1, '#f2d26a'); for (let xx = 108; xx < 296; xx += 16) r(xx, gy + 2, 1, 1, '#6a5a2a');
      r(104, gy, 2, 186 - gy, '#d9b43a'); r(103, 183, 4, 3, '#8a7a3a'); r(250, gy - 4, 2, 4, '#d9b43a'); r(249, gy - 5, 4, 2, '#8a7a3a'); }
    // ===== вход в подвал: пристройка с наклонной крышей, железная дверь и табличка =====
    r(84, 177, 16, 9, '#5b5378'); r(83, 175, 18, 2, '#8f86a8'); for (let i = 0; i < 5; i++) r(83 + i * 4, 174 - Math.floor(i / 2), 4, 1, '#8f86a8');
    r(88, 179, 7, 7, '#2a2440'); r(89, 180, 5, 6, '#4a5260'); r(92, 182, 1, 1, '#c9a95a');
    // ===== площадка для мусора: бетонная плита, забор, два контейнера =====
    r(8, 191, 20, 2, '#5a4a6a'); r(8, 184, 1, 8, '#4a3e5a'); r(27, 184, 1, 8, '#4a3e5a'); r(8, 184, 20, 1, '#4a3e5a');
    for (const [cx, col] of [[10, '#3f6f5a'], [18, '#3f5a7a']]) { r(cx, 186, 7, 5, col); r(cx, 185, 7, 1, shade(col, 25)); r(cx + 1, 191, 1, 1, '#1a1424'); r(cx + 5, 191, 1, 1, '#1a1424'); }
    p(26, 190, '#d8d2bf');                                                    // мусор рядом
    // ===== табличка с адресом на столбе =====
    r(170, 157, 14, 8, '#1b4a8a'); r(171, 158, 12, 6, '#2e64ad'); r(171, 158, 12, 1, '#5a8ad0');          // номер дома на стене
    // ===== асфальт: трещины, бордюр, лужи =====
    r(0, 192, W, 1, '#2a2238');
    for (const [cx0, cy0] of [[60, 205], [150, 214], [228, 206], [270, 220]]) { let cx = cx0, cy = cy0; for (let k = 0; k < 14; k++) { p(cx, cy, '#2a2238'); cx += 1; cy += R() < .5 ? 1 : (R() < .5 ? -1 : 0); } }
    for (const [px, py, pw] of [[150, 199, 22], [236, 212, 18], [40, 214, 14]]) { r(px, py, pw, 3, '#2c2a4a'); r(px + 2, py - 1, pw - 4, 1, '#2c2a4a'); r(px + 3, py + 1, pw / 3, 1, '#6a5f8e'); }
    // ===== вход: ступени, козырёк, номер подъезда, табличка =====
    r(186, 182, 28, 2, '#8a809e'); r(184, 184, 32, 2, '#7a7090'); r(186, 182, 28, 1, '#a59cbc');
    r(182, 164, 36, 3, HP.slab); r(182, 167, 36, 1, '#2c2540'); r(182, 163, 36, 1, '#b0a8c8');
    r(197, 158, 7, 5, '#2e64ad'); text('1', 200, 158, { size: 6, col: '#f4f3ee', align: 'center' });
    r(184, 170, 6, 8, '#d8d2bf'); r(185, 172, 4, 1, '#7a7466'); r(185, 174, 3, 1, '#7a7466'); r(185, 176, 4, 1, '#7a7466');   // табличка «кв. 1–104»
  });
  // окна: у некоторых балкон (плита + решётка), у некоторых застеклённая лоджия
  HOUSE_ART.win = [];
  const WCOLS = [104, 122, 140, 158, 228, 246, 264, 282];   // по 4 квартиры с каждой стороны лестницы, как в подъезде
  for (let f = 0; f < HM.floors; f++) for (const wx of WCOLS) {
    const y = HM.top + f * HM.fh + 2, kind = R() < .3 ? 'balcony' : R() < .25 ? 'loggia' : 'plain';
    const ex = R(); HOUSE_ART.win.push({ x: wx, y, kind, on: R() < .42, warm: pick(R, WIN_COLS), curtain: R() < .4, dim: R() < .3, tv: R() < .08,
      ac: kind === 'plain' && ex < .14, open: kind === 'plain' && ex > .9, laundry: kind === 'balcony' && R() < .5, plants: kind !== 'plain' && R() < .45 });
  }
  HOUSE_ART.dishes = Array.from({ length: 7 }, () => ({ x: pick(R, WCOLS) + 8, y: HM.top + Math.floor(R() * HM.floors) * HM.fh + 1 }));
  // осенние кусты на переднем плане
  HOUSE_ART.fg = makeCanvas(W, H, ({ r }) => { const R2 = rng(9);
    pxCrown(r, R2, 14, 214, 10, 7); pxCrown(r, R2, 26, 217, 8, 5); });
  HOUSE_ART.built = true;
}
// окно дома: рама, свет, занавеска; балкон или лоджия
function drawHouseWindow(w, t = 0) {   // окно 10×7 в раме 12×9: этаж на карте — 11 px
  let lit = w.on ? (w.dim ? shade(w.warm, -40) : w.warm) : '#2a2440';
  if (w.on && w.tv) lit = Math.sin(t / 90 + w.x) > .2 ? '#86a6dc' : '#5a74b8';
  if (w.kind === 'loggia') { rect(w.x - 2, w.y - 1, 14, 9, '#4a3f62'); rect(w.x - 1, w.y, 12, 7, lit); for (const fx of [w.x + 3, w.x + 7]) rect(fx, w.y, 1, 7, '#5e4a3a'); rect(w.x - 1, w.y + 4, 12, 1, '#5e4a3a'); rect(w.x - 2, w.y + 7, 14, 2, '#7a6f98'); return; }
  rect(w.x - 1, w.y - 1, 12, 9, '#4a3f62'); rect(w.x, w.y, 10, 7, lit); rect(w.x + 5, w.y, 1, 7, '#4a3f62');
  if (w.on && w.curtain) rect(w.x, w.y, 3, 7, shade(w.warm, -35));
  if (w.on) { ctx.fillStyle = 'rgba(255,200,120,.08)'; ctx.fillRect(w.x - 3, w.y - 2, 16, 11); }
  if (w.open) { rect(w.x + 6, w.y, 4, 7, '#14101e'); rect(w.x + 9, w.y - 1, 2, 8, '#7a6f98'); }                                  // приоткрытая створка
  if (w.kind === 'balcony') { rect(w.x - 2, w.y + 7, 14, 2, HP.slab); for (let i = 0; i < 7; i++) rect(w.x - 2 + i * 2, w.y + 4, 1, 3, '#3a3050'); rect(w.x - 2, w.y + 4, 14, 1, '#3a3050'); }
  if (w.laundry) { rect(w.x - 1, w.y + 1, 12, 1, '#1a1424'); for (const [lx, c] of [[0, '#e8e4dc'], [3, '#b8443f'], [6, '#5a8ad0'], [9, '#f2c94c']]) rect(w.x + lx, w.y + 2, 2, 2, c); }
  if (w.plants) { rect(w.x - 1, w.y + 5, 3, 2, '#9a4a3a'); rect(w.x - 1, w.y + 3, 3, 2, '#4a8a52'); rect(w.x + 8, w.y + 5, 3, 2, '#9a4a3a'); p(w.x + 9, w.y + 3, '#e05a7a'); p(w.x + 8, w.y + 4, '#4a8a52'); p(w.x + 10, w.y + 4, '#4a8a52'); }
  if (w.ac) { rect(w.x + 10, w.y + 3, 6, 5, '#cfcbd8'); rect(w.x + 10, w.y + 3, 6, 1, '#e8e4f0'); for (let i = 0; i < 3; i++) rect(w.x + 11, w.y + 4 + i, 4, 1, i % 2 ? '#8a849a' : '#cfcbd8'); rect(w.x + 12, w.y + 8, 1, 2, '#6a6480'); }
}
// одна вещь в состоянии k: 0 — сломано/нет, 1 — отремонтировано. Между ними — анимация установки
function drawHouseItem(id, k, t) {
  const A = (a, f) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, a); f(); ctx.restore(); };
  switch (id) {
    case 'light': {   // окна лестницы: до — тёмные и мигают, после — зажигаются этаж за этажом снизу вверх
      for (let f = 3; f < HM.floors; f++) { const y = HM.bottom - (f + 1) * HM.fh + 3, lit = k >= (f + 1) / HM.floors, flick = Math.sin(t / 90 + f * 7) > .6 && f % 3 === 1;
        rect(196, y - 1, 8, 8, lit ? '#f4e6a8' : flick ? '#8a8a66' : '#1f2538'); if (lit) A(.25, () => rect(193, y - 3, 14, 12, '#ffe9a8')); }
      break; }
    case 'door': {    // дверь подъезда: до — старая деревянная, приоткрыта, разбито стекло; после — новая железная со стеклом
      A(1 - k, () => { rect(190, 168, 20, 14, '#14101e'); rect(191, 169, 9, 13, '#6a4a3a'); rect(192, 170, 7, 5, '#2a2a3a'); p(194, 171, '#8a849a'); p(196, 173, '#8a849a');
        rect(202, 170, 7, 12, '#5a3e30'); rect(203, 171, 5, 4, '#1a1424'); p(198, 177, '#c9a95a'); rect(193, 178, 5, 1, '#b8443f');
        rect(212, 171, 4, 6, '#2a2440'); rect(213, 172, 2, 2, '#4a4458'); });
      A(k, () => { rect(189, 167, 22, 15, '#1b1626'); rect(190, 168, 20, 14, '#3a5a72'); rect(190, 168, 20, 1, '#6a8aa2');
        rect(191, 169, 8, 6, '#f2d48a'); rect(201, 169, 8, 6, '#f2d48a'); rect(192, 170, 2, 4, '#fff1c8'); rect(199, 168, 2, 14, '#2a3e52');
        rect(197, 176, 1, 3, '#c9d6e6'); rect(202, 176, 1, 3, '#c9d6e6'); rect(191, 180, 18, 1, '#2a3e52');
        // домофон: дисплей, кнопки, динамик
        rect(212, 169, 6, 10, '#1b1f27'); rect(213, 170, 4, 2, Math.sin(t / 400) > -.6 ? '#7fe08a' : '#3c7a46');
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) p(213 + j * 2, 173 + i * 2, '#a9b2c0'); for (let i = 0; i < 3; i++) p(213 + i, 178, '#5a6270'); });
      break; }
    case 'roof': {    // крыша: до — ржавые потёки по верхним этажам, после — новая кровля
      A(1 - k, () => { for (const [x, l] of [[130, 22], [164, 14], [236, 26], [270, 18]]) { rect(x, HM.top, 2, l, 'rgba(110,80,40,.7)'); rect(x - 1, HM.top, 4, 3, 'rgba(110,80,40,.6)'); } });
      A(k, () => { rect(HM.x0 - 2, HM.top - 4, HM.x1 - HM.x0 + 4, 2, '#b8c2d6'); rect(HM.x0 - 2, HM.top - 4, (HM.x1 - HM.x0 + 4) * Math.min(1, k * 1.2), 1, '#e6ecf5'); });
      break; }
    case 'basement': {   // подвал: до — бегают крысы, лужа; после — решётки на продухах
      for (const vx of [134, 160, 240, 266]) { rect(vx, 182, 8, 3, '#0b0d12'); A(k, () => { for (let i = 0; i < 4; i++) rect(vx + 1 + i * 2, 182, 1, 3, '#8792ad'); }); }
      A(1 - k, () => { rect(244, 186, 20, 2, '#3d5a7a'); for (let i = 0; i < 2; i++) { const rx = 120 + ((t / 18 + i * 130) % 180); rect(rx, 185, 2, 1, '#5b5f66'); p(rx + 2, 185, '#3a3e46'); } });
      break; }
    case 'playground': {
      const X0 = 302, X1 = 394, Y0 = 194, Y1 = 222;
      A(1 - k, () => {   // заброшенная: облезлый забор с дырами, ржавая рама качелей, сломанная лавка, пустая песочница
        for (let x = X0; x <= X1; x += 4) if ((x / 4) % 5 !== 2) { rect(x, Y0, 1, 6, '#5a4a3a'); rect(x, Y1 - 6, 1, 6, '#5a4a3a'); }
        rect(X0, Y0 + 2, 28, 1, '#5a4a3a'); rect(X0 + 44, Y0 + 2, X1 - X0 - 44, 1, '#5a4a3a'); rect(X0, Y1 - 4, X1 - X0, 1, '#5a4a3a');
        rect(312, 198, 1, 18, '#7a4a36'); rect(334, 198, 1, 18, '#7a4a36'); rect(312, 198, 23, 1, '#7a4a36'); rect(318, 199, 1, 8, '#5b5f66'); rect(328, 199, 1, 4, '#5b5f66');
        rect(346, 212, 14, 1, '#5a3e2e'); rect(352, 211, 9, 1, '#5a3e2e'); rect(347, 213, 1, 3, '#2a2a2a'); rect(359, 212, 1, 4, '#2a2a2a');
        rect(366, 208, 20, 6, '#3a3048'); rect(366, 208, 20, 1, '#6a5a4a'); for (const gx of [368, 374, 381]) { p(gx, 207, '#4a7a4a'); p(gx + 1, 206, '#4a7a4a'); }
        rect(372, 216, 8, 3, '#1a1424'); rect(373, 217, 6, 1, '#2a2238');
      });
      const s = k < 1 ? Math.max(0, Math.min(1, k * 1.4)) : 1, bounce = k < 1 ? 1 + Math.sin(k * Math.PI) * .12 : 1;
      A(s, () => {
        ctx.save(); ctx.translate(348, 214); ctx.scale(bounce, bounce); ctx.translate(-348, -214);
        // дорожка с тротуара к калитке
        for (let y = 192; y < Y1; y += 3) rect(300 + (y % 6 ? 0 : 1), y, 6, 2, '#8a809e');
        // покрытие площадки
        rect(X0 + 2, Y0 + 3, X1 - X0 - 3, Y1 - Y0 - 6, '#4a3e5e'); for (let i = 0; i < 30; i++) p(X0 + 3 + (i * 37) % (X1 - X0 - 6), Y0 + 4 + (i * 13) % (Y1 - Y0 - 8), '#5a4e70');
        // задний забор — зелёный штакетник
        for (let x = X0; x <= X1; x += 3) { rect(x, Y0 - 1, 2, 6, '#4a8a5a'); p(x, Y0 - 2, '#6aaa7a'); } rect(X0, Y0 + 1, X1 - X0 + 1, 1, '#2f5a3e');
        // качели: стойки, перекладина, две сидушки на цепях
        rect(310, 202, 2, 12, '#e05a4a'); rect(336, 202, 2, 12, '#e05a4a'); rect(309, 201, 30, 2, '#f2c94c'); rect(309, 213, 4, 1, '#2a2238'); rect(335, 213, 4, 1, '#2a2238');
        const sw = Math.sin(t / 420) * 3;
        for (const sx of [316, 328]) { const o = sx === 316 ? sw : -sw; rect(sx + 1 + o, 203, 1, 7, '#cfd6e4'); rect(sx + 3 + o, 203, 1, 7, '#cfd6e4'); rect(sx + o, 210, 5, 1, '#4c9a84'); }
        // горка с лесенкой
        rect(344, 200, 2, 14, '#3f6f8c'); rect(350, 200, 2, 14, '#3f6f8c'); for (let yy = 202; yy < 214; yy += 3) rect(344, yy, 8, 1, '#5a8ab0');
        rect(343, 198, 10, 2, '#3f6f8c'); rect(342, 196, 2, 3, '#e05a4a'); rect(351, 196, 2, 3, '#e05a4a');
        for (let i = 0; i < 13; i++) { rect(352 + i, 199 + i, 4, 2, '#f2c94c'); p(352 + i, 199 + i, '#ffe28a'); }
        // песочница с игрушками
        rect(368, 206, 22, 8, '#c9b07a'); rect(368, 206, 22, 1, '#e05a4a'); rect(368, 213, 22, 1, '#9a5a3a'); rect(368, 206, 1, 8, '#9a5a3a'); rect(389, 206, 1, 8, '#9a5a3a');
        for (let i = 0; i < 10; i++) p(370 + (i * 7) % 18, 208 + (i * 3) % 5, '#e8d39a');
        rect(372, 208, 3, 3, '#e05a4a'); p(373, 207, '#e05a4a'); rect(380, 209, 4, 1, '#3f6f8c'); rect(383, 208, 1, 2, '#3f6f8c'); rect(385, 207, 2, 2, '#f2c94c');
        // лавочка, урна, куст
        rect(320, 212, 10, 1, '#8a5a3a'); rect(320, 210, 10, 1, '#8a5a3a'); rect(321, 213, 1, 2, '#2a2238'); rect(328, 213, 1, 2, '#2a2238');
        rect(336, 210, 4, 5, '#4a5a6a'); rect(336, 210, 4, 1, '#6a7a8a');
        ctx.fillStyle = '#2f6a3e'; ctx.fillRect(380, 214, 10, 5); ctx.fillStyle = '#4a8a52'; ctx.fillRect(381, 213, 7, 3); rect(383, 213, 1, 1, '#e05a7a');
        // передний забор с калиткой
        for (let x = X0; x <= X1; x += 3) { if (x > 299 && x < 308) continue; rect(x, Y1 - 6, 2, 6, '#4a8a5a'); p(x, Y1 - 7, '#6aaa7a'); } rect(X0, Y1 - 4, X1 - X0 + 1, 1, '#2f5a3e');
        ctx.restore();
      });
      break; }
    case 'lift': {    // машинное помещение лифта на крыше: после ремонта горит окно и огонёк
      const ly = HM.top - 8;
      rect(126, ly, 28, 8, '#4e4569'); rect(126, ly, 28, 1, '#7a6f98');
      rect(136, ly + 2, 8, 4, k > .5 ? '#f4e6a8' : '#2a2440'); if (k > .5 && Math.sin(t / 250) > 0) rect(152, ly + 1, 1, 1, '#7fe08a');
      A(1 - k, () => { rect(130, ly + 2, 3, 3, '#b8443f'); });
      break; }
    case 'antenna': {   // до — тарелки на балконах; после — общая мачта с тарелкой, растяжками и кабелем, опускается на тросе
      A(1 - k, () => { for (const d of HOUSE_ART.dishes) { rect(d.x, d.y, 3, 4, '#c9cdd6'); rect(d.x - 1, d.y + 1, 1, 2, '#8792ad'); } });
      if (k > 0) { const dy = -(1 - Math.min(1, k * 1.3)) * 50, bx = 268, by = HM.top - 4;
        ctx.save(); ctx.translate(0, Math.round(dy));
        if (k < .8) rect(bx, -40, 1, by - 22 + 40, '#8792ad');
        rect(bx - 3, by - 2, 8, 2, '#4e4569'); rect(bx - 2, by - 3, 6, 1, '#7a6f98');                       // основание
        rect(bx - 1, by - 24, 1, 22, '#a8a0c0'); rect(bx + 2, by - 24, 1, 22, '#8a80a8');                       // решётчатая мачта
        for (let yy = by - 22; yy < by - 2; yy += 4) { p(bx, yy, '#a8a0c0'); p(bx + 1, yy + 1, '#a8a0c0'); p(bx, yy + 2, '#a8a0c0'); }
        rect(bx - 7, by - 18, 6, 9, '#e6ecf5'); rect(bx - 8, by - 17, 1, 7, '#cfd6e4'); rect(bx - 4, by - 14, 3, 1, '#8792ad'); rect(bx - 5, by - 15, 2, 2, '#5d6884');   // тарелка и облучатель
        for (let yy = by - 27; yy < by - 23; yy++) p(bx + 1, yy, '#a8a0c0');
        if (k >= 1 && Math.sin(t / 300) > 0) p(bx + 1, by - 28, '#ff4a3a');
        ctx.restore();
        if (k >= 1) { for (const [ex, ey] of [[252, HM.top - 4], [281, HM.top - 4]]) pxLine(bx + 1, by - 24, ex, ey, 'rgba(60,52,80,.9)');   // растяжки
          for (let xx = bx; xx < 279; xx++) p(xx, by, '#1c1626'); for (let yy = by; yy < by + 20; yy++) p(279, yy, '#1c1626'); }      // кабель вниз по углу
      }
      break; }
    case 'sign': {    // вывеска на крыше: до — почти вся тёмная, после — буквы загораются по очереди
      const s = signText(), x0 = 200 - Math.round(textW(s, 6) / 2);
      rect(x0 - 4, 22, textW(s, 6) + 8, 11, '#140b0d'); for (const px of [x0 + 10, 200, x0 + textW(s, 6) - 10]) rect(px, 33, 1, HM.top - 37, '#2a2440');
      let acc = 0; [...s].forEach((ch, i) => {
        const on = k >= (i + 1) / s.length || (k === 0 && i % 4 === 1 && Math.sin(t / 130 + i) > -.3);
        text(ch, x0 + acc, 24, { size: 6, col: on ? '#ff6a45' : '#3c1714' }); acc += textW(ch, 6); });
      if (k >= 1) A(.25 + .05 * Math.sin(t / 140), () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; rect(x0 - 6, 20, textW(s, 6) + 12, 15, '#ff4a30'); ctx.restore(); });
      break; }
    case 'pit': {    // яма у входа: до — провал в асфальте с лужей, после — ровная заплатка
      A(1 - k, () => { rect(222, 194, 14, 5, '#1a1424'); rect(224, 195, 10, 3, '#2c2a4a'); rect(226, 196, 4, 1, '#6a5f8e'); p(221, 193, '#5a4a6a'); p(236, 196, '#5a4a6a'); });
      A(k, () => { rect(220, 193, 18, 6, '#4a4060'); rect(220, 193, 18, 1, '#5a5070'); });
      break; }
    case 'cameras': A(k, () => { for (const [cx, cy] of [[217, 162], [102, 150], [296, 150]]) { rect(cx, cy, 5, 3, '#cfcbd8'); rect(cx + 4, cy + 1, 2, 1, '#2a2440'); if (Math.sin(t / 300 + cx) > 0) p(cx + 1, cy + 1, '#ff4a3a'); } }); break;
    case 'walls': A(k, () => { rect(177, HM.top + 1, 46, HM.bottom - HM.top - 1, 'rgba(200,220,210,.10)');
      for (let f = 1; f < HM.floors; f += 3) { const y = HM.top + f * HM.fh + 3; rect(184, y, 5, 4, '#c9a95a'); rect(185, y + 1, 3, 2, '#7a5a8a'); } }); break;
    case 'yard': A(k, () => {
      for (const bx of [230, 256]) { rect(bx, 193, 10, 2, '#8a5a3a'); rect(bx, 190, 10, 1, '#8a5a3a'); rect(bx + 1, 195, 1, 2, '#2a2a2a'); rect(bx + 8, 195, 1, 2, '#2a2a2a'); }
      for (const fx of [126, 150, 228, 254]) { rect(fx, 186, 20, 3, '#4a3a2a'); for (let i = 0; i < 6; i++) rect(fx + 1 + i * 3, 184 + (i % 2), 2, 2, ['#e05a7a', '#f2c94c', '#f4f3ee'][i % 3]); }
      for (const lx of [78, 396]) { rect(lx, 160, 1, 32, '#1a1e28'); rect(lx - 3, 159, 7, 2, '#2a2f3c'); rect(lx - 2, 161, 5, 1, '#fff1b8');
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .18; ctx.fillStyle = '#ffd890'; ctx.beginPath(); ctx.moveTo(lx - 2, 162); ctx.lineTo(lx + 3, 162); ctx.lineTo(lx + 14, 192); ctx.lineTo(lx - 13, 192); ctx.fill(); ctx.restore(); } }); break;
    case 'letnik': A(k, () => {   // летнее кафе: настил, столики под зонтами, гирлянда
      rect(34, 200, 86, 20, '#5a4a3a'); for (let x = 36; x < 118; x += 6) rect(x, 200, 1, 20, '#4a3a2a');
      for (let k2 = 0; k2 <= 80; k2++) { const xx = 36 + k2, yy = 190 + Math.round(Math.sin(k2 / 80 * Math.PI) * 3); p(xx, yy, '#1c1626'); if (k2 % 8 === 0) p(xx, yy + 1, Math.sin(t / 200 + k2) > 0 ? '#ffe28a' : '#e8a24a'); }
      for (const [tx, col] of [[50, '#b8443f'], [78, '#2f8577'], [104, '#c79a3b']]) { rect(tx - 7, 196, 15, 3, col); rect(tx - 5, 195, 11, 1, shade(col, 25)); rect(tx, 199, 1, 9, '#2a2238'); rect(tx - 3, 208, 7, 2, '#cfcbd8'); rect(tx - 6, 210, 3, 3, '#6a5a4a'); rect(tx + 4, 210, 3, 3, '#6a5a4a'); } }); break;
    case 'bench': A(k, () => { for (const bx of [230, 256]) { rect(bx, 193, 10, 2, '#8a5a3a'); rect(bx, 190, 10, 1, '#8a5a3a'); rect(bx + 1, 195, 1, 2, '#2a2a2a'); rect(bx + 8, 195, 1, 2, '#2a2a2a'); } }); break;
    case 'flowers': A(k, () => { for (const fx of [126, 150, 228, 254]) { rect(fx, 186, 20, 3, '#4a3a2a'); for (let i = 0; i < 6; i++) rect(fx + 1 + i * 3, 184 + (i % 2), 2, 2, ['#e05a7a', '#f2c94c', '#f4f3ee'][i % 3]); } }); break;
    case 'trees': A(k, () => { for (const [tx, s] of [[40, 1.1], [62, .9]]) { const h = Math.round(22 * s * Math.min(1, k * 1.2));
      ctx.fillStyle = 'rgba(10,6,20,.35)'; ctx.fillRect(tx - 9, 200, 20, 2);                                  // тень
      rect(tx, 200 - h, 2, h, '#4a3028'); const g2 = Math.min(1, k * 1.2), rx = Math.max(2, Math.round(9 * s * g2)), ry = Math.max(2, Math.round(10 * s * g2));
      pxCrown(rect, rng(tx), tx + 1, 200 - h - ry * .4, rx, ry); } }); break;
    case 'lamps': A(k, () => { for (const lx of [78, 396]) { rect(lx, 160, 1, 32, '#1a1e28'); rect(lx - 3, 159, 7, 2, '#2a2f3c'); rect(lx - 2, 161, 5, 1, '#fff1b8');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .18; ctx.fillStyle = '#ffd890'; ctx.beginPath(); ctx.moveTo(lx - 2, 162); ctx.lineTo(lx + 3, 162); ctx.lineTo(lx + 14, 192); ctx.lineTo(lx - 13, 192); ctx.fill(); ctx.restore(); } }); break;
    case 'parking': A(k, () => { rect(6, 204, 88, 18, '#2c2640'); for (let i = 0; i <= 3; i++) rect(8 + i * 28, 204, 1, 18, '#cfd6e4');
      for (const [cx, col] of [[10, '#b8443f'], [66, '#3f6f8c']]) { rect(cx, 211, 24, 5, col); rect(cx + 5, 207, 13, 4, col); rect(cx + 6, 208, 5, 2, '#1b2030'); rect(cx + 12, 208, 5, 2, '#1b2030'); rect(cx + 23, 212, 1, 1, '#f2d27a'); rect(cx + 3, 215, 4, 3, '#0d0f14'); rect(cx + 17, 215, 4, 3, '#0d0f14'); } }); break;
  }
}

function drawHouseMap(t, anim) {
  if (!HOUSE_ART.built) buildHouseArt();
  sprite(wide(HOUSE_ART.bg), -OX, 0);
  text('14', 177, 158, { size: 6, col: '#f4f3ee', align: 'center' });
  if (Math.random() < 1 / 40) { const w = pick(Math.random, HOUSE_ART.win); w.on = !w.on; }
  for (const w of HOUSE_ART.win) drawHouseWindow(w, t);
  // провода между домом и столбом, кабель интернета по фасаду
  for (let k = 0; k <= 18; k++) { p(300 + k, 62 + Math.round(Math.sin(k / 18 * Math.PI) * 4), '#1c1626'); p(300 + k, 66 + Math.round(Math.sin(k / 18 * Math.PI) * 3), '#1c1626'); }
  for (let k = 0; k <= 16; k++) p(84 + k, 76 + Math.round(Math.sin(k / 16 * Math.PI) * 3), '#1c1626');
  rect(316, 61, 2, 2, '#3a3050'); rect(316, 65, 2, 2, '#3a3050'); rect(82, 75, 2, 2, '#3a3050'); rect(100, 75, 2, 2, '#3a3050');
  for (let yy = HM.top; yy < HM.bottom; yy++) if ((yy - HM.top) % HM.fh !== 0) p(224, yy, '#2a2238');
  // свет у входа: настенный фонарь под козырьком, тёплое пятно на ступенях, лёгкое мерцание
  { const fl = Math.sin(t / 61) > -.92 ? 1 : .45, glow = ctx.createRadialGradient(200, 168, 1, 200, 178, 34);
    glow.addColorStop(0, `rgba(255,214,140,${.38 * fl})`); glow.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = glow; ctx.fillRect(166, 150, 68, 50); ctx.restore();
    rect(197, 167, 6, 2, '#2a2440'); rect(198, 169, 4, 1, fl > .5 ? '#fff1b8' : '#8a7a5a'); }
  const ids = [...PROBLEMS.map(p => p.id), ...DECOR.map(d => d.id)];
  for (const id of ids) {
    let k = has(id) ? 1 : 0;
    if (anim && anim.id === id) k = Math.max(0, Math.min(1, (anim.t - 1300) / 900));
    drawHouseItem(id, k, t);
  }
  // идёт ремонт: над местом крутятся две шестерёнки, потом облачко пыли — и вещь готова
  if (anim && anim.t < 2900) {
    const [cx, cy] = HSPOT[anim.id], t0 = anim.t;
    const pop = Math.min(1, t0 / 220), out = t0 > 2300 ? Math.max(0, 1 - (t0 - 2300) / 300) : 1, s = pop * out;
    if (s > 0) {
      const big = gearSprite(26, Math.floor(t0 / 45)), small = gearSprite(15, 16 - Math.floor(t0 / 30) % 16);
      ctx.save(); ctx.globalAlpha = s;
      ctx.drawImage(big, Math.round(cx - 13 - 6), Math.round(cy - 13 - 8 - (1 - pop) * 6));
      ctx.drawImage(small, Math.round(cx + 5), Math.round(cy - 7 - 15));
      ctx.restore();
      if (t0 > 600 && t0 < 1300 && Math.floor(t0 / 90) % 2) for (let i = 0; i < 3; i++) rect(cx - 2 + Math.cos(t0 / 50 + i * 2) * 12, cy - 8 + Math.sin(t0 / 50 + i * 2) * 8, 1, 1, '#fff1b8');
    }
    // пыль при «готово»
    if (t0 > 1300 && t0 < 2300) { const k = (t0 - 1300) / 1000;
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, d = 4 + k * 18; ctx.globalAlpha = 1 - k; rect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d * .6), 2, 2, i % 2 ? '#e8dcc8' : '#b9aec8'); }
      ctx.globalAlpha = 1; }
  }
  if (HOUSE_ART.fg) sprite(wide(HOUSE_ART.fg), -OX, 0);
}

const GEAR_CACHE = new Map();
function gearSprite(size, step) {
  const key = size + ':' + (step % 16); if (GEAR_CACHE.has(key)) return GEAR_CACHE.get(key);
  const c = makeCanvas(size, size, ({ p }) => {
    const R0 = size / 2, rot = (step % 16) / 16 * (Math.PI * 2 / 8), teeth = 8, rOut = R0 - .5, rBody = R0 * .78, rHole = R0 * .38;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = x + .5 - R0, dy = y + .5 - R0, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) - rot;
      const tooth = ((a / (Math.PI * 2) * teeth) % 1 + 1) % 1 < .45;
      const edge = tooth ? rOut : rBody;
      if (d > edge || d < rHole) continue;
      const rim = d > edge - 1.2 || d < rHole + 1.2, light = (-dx - dy) / (d || 1);
      p(x, y, rim ? '#2b2733' : light > .45 ? '#e2dcd2' : light > -.2 ? '#b3aaa0' : '#857c74');
    }
  });
  GEAR_CACHE.set(key, c); return c;
}

/* ---------- сцена «Мой ЖК» ---------- */
scenes.house = {
  enter(d) { this.t = 0; this.sel = null; this.anim = null; this.busy = false; setTouch({}); this.refresh(); if (d && d.focus) this.sel = d.focus;
    // подсказка — один раз, пока ничего не отремонтировано
    this.help = !SAVE.helpHouse;   // первый раз — сразу объясняем, что здесь делать
    // Telegram: боту не разрешили писать — после каждой новой победы напоминаем (сертификат придёт через бота)
    const won = (HOUSE_STATE.won || []).length;
    this.tgAsk = !!TG && !tgWriteOK() && won > 0 && won > (SAVE.tgAskWon || 0);
    if (this.tgAsk) { SAVE.tgAskWon = won; persist(); }
  },
  refresh() { API.house().then(h => { HOUSE_STATE = h; SAVE.coins = h.coins; }).catch(() => {}); },
  // что можно сделать с вещью сейчас
  status(id) {
    const pi = PROBLEMS.findIndex(p => p.id === id);
    if (pi >= 0) { const P = PROBLEMS[pi], c = canFix(P, HOUSE_STATE);
      if (c.why === 'done') return { kind: 'done' };
      if (!c.ok) { const I = tourInfo(c.tour.n - 1);
        // решение собрания: появится само после победы в туре
        if (c.why === 'vote') return { kind: I.open ? 'vote' : 'locked', text: L(UI.hAuto).replace('{n}', c.tour.n).replace('{t}', tourTitle(c.tour)) + (I.open ? '' : ' ' + I.why), level: c.tour.id };
        if (!I.open) return { kind: 'locked', text: L(UI.hNeedChair) + ' ' + I.why };
        return { kind: 'vote', text: L(UI.hNeedChair), level: c.tour.id }; }
      return { kind: 'buy', cost: P.cost };
    }
    const d = DECOR.find(x => x.id === id);
    if (has(id)) return { kind: 'done' };
    if (HOUSE_STATE.fixed.length < d.after) return { kind: 'locked', text: L(UI.hDecorLock).replace('{n}', d.after) };
    return { kind: 'buy', cost: d.cost };
  },
  async buy(id) {
    if (this.busy) return; this.busy = true;
    try {
      const h = await API.buy(id);
      this.anim = { id, t: 0 }; this.sel = null; sfx.stamp();
      setTimeout(() => { HOUSE_STATE = h; SAVE.coins = h.coins; persist(); }, 1300);
      const p = PROBLEMS.find(x => x.id === id);
      setTimeout(() => { toast(L(UI.tipT), p ? L(UI.hFixedToast).replace('{p}', L(p.name)) : L(UI.hDecorToast), 3600); this.anim = null; }, 2800);
    } catch (e) { toast(L(UI.tipT), L(e.code === 'no_money' ? UI.hNoMoney : UI.netFail), 2600); }
    this.busy = false;
  },
  update(dt) {
    this.t += dt; if (this.anim) this.anim.t += dt;
    if (hit('back')) irisTo(W / 2, 120, () => go('title'));
  },
  draw(dt) { this.drawMain(dt); if (this.tgAsk && !this.help) { if (drawTgAsk()) this.tgAsk = false; } else this.drawHelpIfOpen(); },
  drawMain(dt) {
    drawHouseMap(this.t, this.anim);
    // маркеры: «!» — можно действовать, замок — пока закрыто
    const ids = [...PROBLEMS.map(p => p.id), ...DECOR.map(d => d.id)];
    if (!this.anim) for (const id of ids) {
      const st = this.status(id), [cx, cy] = HSPOT[id]; if (st.kind === 'done') continue;
      const pulse = Math.floor(this.t / 350) % 2;
      // маленькая «булавка» с хвостиком, чтобы не закрывать окна; недоступное — приглушено
      const mk = (bg, ch, ink = '#1a1424') => { const y = cy - 13 - (pulse ? 1 : 0);
        rect(cx - 5, y + 1, 10, 10, 'rgba(10,8,20,.45)'); rect(cx - 5, y, 10, 10, '#1b1a21'); rect(cx - 4, y + 1, 8, 8, bg); rect(cx - 4, y + 1, 8, 1, 'rgba(255,246,200,.7)');
        rect(cx - 1, y + 10, 2, 2, '#1b1a21'); rect(cx, y + 12, 1, 1, '#1b1a21'); text(ch, cx, y + 2, { align: 'center', col: ink, size: 6 }); };
      if (st.kind === 'buy') { if (HOUSE_STATE.coins >= st.cost) mk('#f2c94c', '!'); else mk('#4a4560', '!', '#a99fc8'); }
      else if (st.kind === 'vote' && !PROBLEMS.some(p => p.id === id && p.kind === 'construction')) mk('#2f4a44', '?', '#7fc4a8');
    }
    // верхняя панель
    rect(0, 0, W, 19, '#0e111c'); rect(0, 19, W, 1, '#55607c');
    text(`${L(UI.budget)} ${money(HOUSE_STATE.coins)}`, 6, 5, { col: '#f2c94c', size: 6 });
    text(`★${HOUSE_STATE.score}`, 10 + textW(`${L(UI.budget)} ${money(HOUSE_STATE.coins)}`, 6), 5, { col: '#9fd9c2', size: 6 });
    { const wm = textW(L(UI.meetings)) + 12, wi = textW(L(UI.insideBtn)) + 12, wn = textW(L(UI.menu)) + 12, xn = W - wn - 4;
      if (button(L(UI.menu), 0, 1, 'dark', { left: xn })) irisTo(W / 2, 120, () => go('title'));
      if (button('?', 0, 1, 'alt', { left: xn - 18, w: 14 })) this.help = !this.help;
      if (button(L(UI.insideBtn), 0, 1, 'dark', { left: xn - 22 - wi })) irisTo(W / 2, 120, () => go('inside'));
      if (button(L(UI.meetings), 0, 1, 'primary', { left: xn - 26 - wi - wm })) irisTo(W / 2, 120, () => go('levels')); }
    if (HOUSE_STATE.claimable && button(`${L(UI.bonusDay)} +${HOUSE_STATE.bonus}`, 0, 34, 'alt', { left: 6 }))
      API.claim().then(r => { HOUSE_STATE = r.house; toast('E-KNOT', L(r.reward.status === 'sent' ? UI.rRewardSent : UI.rRewardGuest).replace('{n}', r.reward.points), 3200); }).catch(() => {});
    // выбор вещи на карте
    if (!this.anim && !this.busy && !this.help) {
      // нажатие: берём ближайшую вещь к пальцу (зона не меньше 30×30), чтобы маленькие цели тоже нажимались
      const c = clicks.find(c => c.y > 22 && (!this.sel || c.y < 150));
      if (c) { let best = null, bd = 1e9;
        for (const id of ids) { if (this.status(id).kind === 'done') continue; const [cx, cy, w, h] = HSPOT[id];
          const dx = Math.max(0, Math.abs(c.x - cx) - Math.max(15, w / 2)), dy = Math.max(0, Math.abs(c.y - cy) - Math.max(15, h / 2)), d = dx + dy + Math.hypot(c.x - cx, c.y - cy) * .01;
          if (dx === 0 && dy === 0 && d < bd) { bd = d; best = id; } }
        if (best) { clicks.splice(clicks.indexOf(c), 1); this.sel = this.sel === best ? null : best; sfx.select(); } }
    }
    if (this.sel && !this.anim) this.drawPanel(this.sel);
    // нажатие мимо кнопок закрывает карточку снизу
    if (this.sel && clicks.some(c => c.y > 20)) { clicks.length = 0; this.sel = null; }

  },
  drawPanel(id) {
    const p = PROBLEMS.find(x => x.id === id), d = DECOR.find(x => x.id === id), st = this.status(id);
    frameBox(8, 150, W - 16, 70, .95);
    text(L((p || d).name), 16, 157, { col: '#f4f3ee' });
    if (p) wrapText(fmtLine(L(p.desc)), 230, 6).slice(0, 2).forEach((l, i) => text(l, 16, 170 + i * 9, { col: '#cfd6e4', size: 6 }));
    else text(L(UI.hDecorDesc).replace('{n}', d.pts), 16, 170, { col: '#cfd6e4', size: 6 });
    const bx = 318;
    if (st.kind === 'buy') {
      const ok = HOUSE_STATE.coins >= st.cost;
      text(money(st.cost), bx, 160, { align: 'center', col: ok ? '#f2c94c' : '#e88a7a', size: 6 });
      if (button(ok ? L(UI.hFix) : L(UI.hEarn), bx, 178, ok ? 'primary' : 'alt', { w: 120 })) {
        if (ok) this.buy(id); else irisTo(W / 2, 120, () => go('levels'));
      }
      if (!ok) wrapText(L(UI.hNoMoneyHint), 200, 6).slice(0, 2).forEach((l, i) => text(l, 16, 196 + i * 9, { col: '#e88a7a', size: 6 }));
    } else if (st.kind === 'vote') {
      wrapText(st.text, 200, 6).slice(0, 2).forEach((l, i) => text(l, 16, 196 + i * 9, { col: '#9fd9c2', size: 6 }));
      if (button(L(UI.hGoVote), bx, 178, 'primary', { w: 120 })) irisTo(W / 2, 120, () => go('tour', { tour: st.level }));
    } else if (st.kind === 'locked') wrapText(st.text, 360, 6).slice(0, 2).forEach((l, i) => text(l, 16, 196 + i * 9, { col: '#8792ad', size: 6 }));
  },
  drawHelpIfOpen() { if (this.help && drawHelp(L(UI.helpHouseT), HELP_HOUSE)) { this.help = false; SAVE.helpHouse = true; persist(); } },
};

/* ---------- список собраний ---------- */
scenes.levels = {
  enter() { setTouch({}); },
  update() { if (hit('back')) irisTo(W / 2, 120, () => go('house')); },
  draw(dt) {
    drawHouseMap(performance.now(), null);
    rect(0, 0, W, H, 'rgba(10,12,20,.55)');
    frameBox(20, 8, 360, 210, .95);
    text(L(UI.meetings), W / 2, 15, { align: 'center', col: '#f4f3ee' });
    text(money(HOUSE_STATE.coins), 370, 15, { align: 'right', col: '#f2c94c', size: 6 });
    LEVELS.forEach((_, i) => {
      const I = tourInfo(i), y = 24 + i * 21, x = 30;
      rect(x, y, 340, 20, I.open ? '#1d2130' : '#151822'); rect(x, y + 19, 340, 1, '#0a0c12');
      text(`${I.L.n}.`, x + 6, y + 7, { col: I.open ? '#f2c94c' : '#55607c', size: 6 });
      const tt = tourTitle(I.L); text(textW(tt, 6) > 250 ? tt.slice(0, 40) + '…' : tt, x + 22, y + 2, { col: I.open ? '#f4f3ee' : '#55607c', size: 6 });
      const short = I.L.rule === 'quorum' ? L(UI.lvQuorum).replace('{q}', I.L.quorum) : L(UI.lvYes).replace('{g}', I.L.goal);
      const sub = I.open ? `${short}${I.L.noTimer ? '' : ' · ' + I.L.days + ' ' + L(UI.daysWord)}` + (!I.won && I.L.income ? ` · +${money(I.L.income)}` : '') : I.why;
      text(sub, x + 22, y + 11, { col: I.open ? '#9fd9c2' : '#8a6a6a', size: 6 });
      if (I.won) text('★', x + 266, y + 7, { col: '#f2c94c', size: 6, align: 'center' });
      if (I.open && button(L(UI.play2), x + 306, y + 2, I.won ? 'alt' : 'primary', { w: 60 })) irisTo(W / 2, 120, () => go('tour', { tour: I.L.id }));
    });
    // общий квиз «Знаток ЖКХ» — все вопросы; значок — за все 7 квизов перед турами
    { const y = 24 + LEVELS.length * 21 + 1, x = 30;
      rect(x, y, 340, 20, '#22303a'); rect(x, y, 2, 20, '#7fc4a8');
      text('★', x + 9, y + 7, { col: '#7fc4a8', size: 6, align: 'center' });
      text(L(UI.qzMenu), x + 22, y + 2, { col: '#f4f3ee', size: 6 }); text(L(UI.qzMenuSub), x + 22, y + 11, { col: '#9fd9c2', size: 6 });
      if (button(L(UI.qzPlay), x + 306, y + 2, 'alt', { w: 60 })) irisTo(W / 2, 120, () => go('quiz')); }
    if (button(L(UI.back), W / 2, 200, 'alt')) irisTo(W / 2, 120, () => go('house'));
  },
};
