/* ============================================================
   КАРТА ЖК — главный экран между собраниями.
   Весь дом и двор на одной картинке. Каждая проблема и украшение
   рисуются в двух состояниях: «до» и «после ремонта»; покупка
   запускает анимацию установки, и изменение остаётся навсегда.
   ============================================================ */
let HOUSE_STATE = { fixed: [], decor: [], won: [], coins: 0, score: 0, bonus: 0, claimable: false };
const has = id => HOUSE_STATE.fixed.includes(id) || HOUSE_STATE.decor.includes(id);
function levelInfo(i) {
  const p = PROBLEMS[i], L = LEVELS[i];
  return { p, L, fixed: HOUSE_STATE.fixed.includes(p.id), won: HOUSE_STATE.won.includes(L.id), open: i === 0 || HOUSE_STATE.fixed.includes(PROBLEMS[i - 1].id) };
}

// геометрия дома на карте
const HM = { x0: 120, x1: 280, top: 46, fh: 15, floors: 9, ground: 186 };
HM.bottom = HM.top + HM.fh * HM.floors;   // 181
const HSPOT = {   // где на карте каждая вещь (для подсветки и нажатия)
  light: [200, 112, 20, 120], door: [200, 172, 22, 16], roof: [150, 50, 60, 16], basement: [150, 185, 50, 8],
  playground: [346, 206, 80, 30], lift: [144, 40, 30, 14], antenna: [268, 30, 22, 24], sign: [200, 28, 130, 14],
  bench: [240, 196, 30, 12], flowers: [252, 186, 50, 6], trees: [52, 170, 90, 50], lamps: [104, 172, 16, 40], parking: [48, 212, 80, 18],
};

const HOUSE_ART = { built: false };
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
    // облака: пухлые слои с подсветкой сверху и тенью снизу
    const cloud = (cx, cy, n, sc) => { const blobs = []; for (let i = 0; i < n; i++) blobs.push([cx + (i - n / 2) * 9 * sc + (R() - .5) * 6, cy - Math.sin(i / (n - 1) * Math.PI) * 7 * sc, (6 + R() * 5) * sc]);
      for (const [bx, by, br] of blobs) { g.fillStyle = HP.cloudD; g.beginPath(); g.arc(Math.round(bx), Math.round(by + 2), br, 0, 7); g.fill(); }
      for (const [bx, by, br] of blobs) { g.fillStyle = HP.cloud; g.beginPath(); g.arc(Math.round(bx), Math.round(by), br, 0, 7); g.fill(); }
      for (const [bx, by, br] of blobs) { g.fillStyle = HP.cloudL; g.beginPath(); g.arc(Math.round(bx - br * .3), Math.round(by - br * .35), br * .55, 0, 7); g.fill(); }
      r(cx - n * 5 * sc, cy + 4 * sc, n * 10 * sc, 3, HP.cloudD); };
    cloud(60, 52, 7, 1); cloud(250, 40, 6, .8); cloud(330, 70, 5, .9); cloud(150, 82, 5, .7);
    // дальние дома: сиреневые силуэты с тёплыми окнами
    let x = -4; while (x < W) { const w = 16 + R() * 26, h = 30 + R() * 55; r(x, 186 - h, w, h, HP.far); r(x, 186 - h, w, 1, '#463a66');
      for (let yy = 190 - h; yy < 182; yy += 6) for (let xx = x + 2; xx < x + w - 3; xx += 5) if (R() < .18) r(xx, yy, 3, 3, pick(R, ['#e8a24a', '#d98a6a', '#c9a65e'])); x += w + 3; }
    // земля двора
    r(0, HM.ground, W, H - HM.ground, HP.ground); r(0, HM.ground, W, 6, HP.groundL); r(0, HM.ground, W, 1, '#8a78a0');
    for (let i = 0; i < 140; i++) p(R() * W, HM.ground + 7 + R() * 32, pick(R, ['#332a42', '#46395a', '#4e4064']));
    // дом: бетон с потёками, швы панелей
    const { x0, x1, top, fh, floors } = HM, hb = HM.bottom - top + 5;
    r(x0, top, x1 - x0, hb, HP.wall); r(x0, top, 2, hb, HP.wallL); r(x1 - 2, top, 2, hb, HP.wallD);
    r(176, top, 48, hb, '#665d82');                                               // лестничная клетка
    for (let f = 0; f <= floors; f++) r(x0, top + f * fh, x1 - x0, 1, HP.wallD);
    for (const sx of [148, 176, 224, 252]) r(sx, top, 1, HM.bottom - top, HP.wallD);
    for (let i = 0; i < 46; i++) { const sx = x0 + R() * (x1 - x0), sy = top + R() * (hb - 10); r(sx, sy, 1, 4 + R() * 12, HP.stain); if (R() < .3) r(sx - 1, sy, 3, 1, HP.stain); }
    // закатный свет на правом торце (как на референсе)
    for (let y = top; y < HM.bottom; y++) { r(x1 - 14, y, 12, 1, 'rgba(240,140,70,.18)'); r(x1 - 6, y, 4, 1, 'rgba(250,160,80,.22)'); }
    r(x0 - 2, top - 4, x1 - x0 + 4, 4, '#4e4569'); r(x0 - 2, top - 4, x1 - x0 + 4, 1, '#7a6f98');      // парапет
    r(x0, HM.bottom, x1 - x0, 5, '#463d5e');                                                        // цоколь
    r(184, 166, 32, 3, HP.slab); r(184, 169, 32, 1, '#2c2540');                                     // козырёк
  });
  // окна: у некоторых балкон (плита + решётка), у некоторых застеклённая лоджия
  HOUSE_ART.win = [];
  for (let f = 0; f < HM.floors; f++) for (const wx of [126, 142, 158, 230, 246, 262]) {
    const y = HM.top + f * HM.fh + 4, kind = R() < .3 ? 'balcony' : R() < .25 ? 'loggia' : 'plain';
    HOUSE_ART.win.push({ x: wx, y, kind, on: R() < .42, warm: pick(R, WIN_COLS), curtain: R() < .4 });
  }
  HOUSE_ART.dishes = Array.from({ length: 7 }, () => ({ x: pick(R, [126, 142, 158, 230, 246, 262]) + 8, y: HM.top + Math.floor(R() * 9) * HM.fh + 2 }));
  // осенние кусты на переднем плане
  HOUSE_ART.fg = makeCanvas(W, H, ({ g }) => { const R2 = rng(9);
    for (const [bx, n] of [[-6, 5], [372, 4]]) for (let i = 0; i < n; i++) { const cx = bx + i * 9 + R2() * 4, cy = 214 + R2() * 6, rr = 7 + R2() * 4;
      g.fillStyle = '#7a3b2a'; g.beginPath(); g.arc(cx, cy + 2, rr, 0, 7); g.fill(); g.fillStyle = '#c4622f'; g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.fill();
      g.fillStyle = '#e8913a'; g.beginPath(); g.arc(cx - rr * .3, cy - rr * .35, rr * .5, 0, 7); g.fill(); } });
  HOUSE_ART.built = true;
}
// окно дома: рама, свет, занавеска; балкон или лоджия
function drawHouseWindow(w) {
  const lit = w.on ? w.warm : '#2a2440';
  if (w.kind === 'loggia') { rect(w.x - 2, w.y - 1, 14, 11, '#4a3f62'); rect(w.x - 1, w.y, 12, 9, lit); for (const fx of [w.x + 3, w.x + 7]) rect(fx, w.y, 1, 9, '#5e4a3a'); rect(w.x - 1, w.y + 5, 12, 1, '#5e4a3a'); rect(w.x - 2, w.y + 9, 14, 2, '#7a6f98'); return; }
  rect(w.x - 1, w.y - 1, 12, 10, '#4a3f62'); rect(w.x, w.y, 10, 8, lit); rect(w.x + 5, w.y, 1, 8, '#4a3f62');
  if (w.on && w.curtain) rect(w.x, w.y, 3, 8, shade(w.warm, -35));
  if (w.on) { ctx.fillStyle = 'rgba(255,200,120,.08)'; ctx.fillRect(w.x - 3, w.y - 2, 16, 13); }
  if (w.kind === 'balcony') { rect(w.x - 2, w.y + 8, 14, 2, HP.slab); for (let i = 0; i < 7; i++) rect(w.x - 2 + i * 2, w.y + 5, 1, 3, '#3a3050'); rect(w.x - 2, w.y + 5, 14, 1, '#3a3050'); }
}
// одна вещь в состоянии k: 0 — сломано/нет, 1 — отремонтировано. Между ними — анимация установки
function drawHouseItem(id, k, t) {
  const A = (a, f) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, a); f(); ctx.restore(); };
  switch (id) {
    case 'light': {   // окна лестницы: до — тёмные и мигают, после — зажигаются этаж за этажом снизу вверх
      for (let f = 0; f < HM.floors; f++) { const y = HM.bottom - (f + 1) * HM.fh + 3, lit = k >= (f + 1) / HM.floors, flick = Math.sin(t / 90 + f * 7) > .6 && f % 3 === 1;
        rect(196, y, 8, 10, lit ? '#f4e6a8' : flick ? '#8a8a66' : '#1f2538'); if (lit) A(.25, () => rect(193, y - 2, 14, 14, '#ffe9a8')); }
      break; }
    case 'door': {    // дверь подъезда: до — висит криво, после — новая с домофоном
      A(1 - k, () => { rect(193, 171, 14, 10, '#141821'); rect(194, 172, 6, 9, '#3a4256'); rect(201, 173, 5, 8, '#3a4256'); rect(202, 172, 1, 1, '#c45a4a'); });
      A(k, () => { rect(193, 171, 14, 10, '#2c3e50'); rect(194, 172, 12, 9, '#3f5a72'); rect(199, 172, 1, 9, '#2c3e50'); rect(208, 173, 3, 4, '#1b1f27'); rect(209, 174, 1, 1, Math.sin(t / 300) > 0 ? '#7fe08a' : '#3c7a46'); });
      break; }
    case 'roof': {    // крыша: до — ржавые потёки по верхним этажам, после — новая кровля
      A(1 - k, () => { for (const [x, l] of [[130, 22], [164, 14], [236, 26], [270, 18]]) { rect(x, HM.top, 2, l, 'rgba(110,80,40,.7)'); rect(x - 1, HM.top, 4, 3, 'rgba(110,80,40,.6)'); } });
      A(k, () => { rect(HM.x0 - 2, HM.top - 4, HM.x1 - HM.x0 + 4, 2, '#b8c2d6'); rect(HM.x0 - 2, HM.top - 4, (HM.x1 - HM.x0 + 4) * Math.min(1, k * 1.2), 1, '#e6ecf5'); });
      break; }
    case 'basement': {   // подвал: до — бегают крысы, лужа; после — решётки на продухах
      for (const vx of [134, 160, 240, 266]) { rect(vx, 182, 8, 3, '#0b0d12'); A(k, () => { for (let i = 0; i < 4; i++) rect(vx + 1 + i * 2, 182, 1, 3, '#8792ad'); }); }
      A(1 - k, () => { rect(244, 186, 20, 2, '#3d5a7a'); for (let i = 0; i < 2; i++) { const rx = 120 + ((t / 18 + i * 130) % 180); rect(rx, 184, 4, 2, '#5b5f66'); rect(rx + 4, 185, 2, 1, '#5b5f66'); } });
      break; }
    case 'playground': {   // площадка: до — ржавая рама одних качелей, после — горка, качели, песочница
      A(1 - k, () => { rect(312, 196, 1, 18, '#7a4a36'); rect(340, 196, 1, 18, '#7a4a36'); rect(312, 196, 29, 1, '#7a4a36'); rect(322, 197, 1, 9, '#5b5f66'); rect(366, 210, 10, 4, '#2a2a2a'); });
      const s = k < 1 ? Math.max(0, Math.min(1, k * 1.4)) : 1, bounce = k < 1 ? 1 + Math.sin(k * Math.PI) * .15 : 1;
      A(s, () => {
        ctx.save(); ctx.translate(346, 214); ctx.scale(bounce, bounce); ctx.translate(-346, -214);
        rect(304, 214, 86, 2, '#c9b07a');                                         // бортик
        rect(308, 196, 2, 18, '#e05a4a'); rect(334, 196, 2, 18, '#e05a4a'); rect(308, 195, 28, 2, '#f2c94c');   // качели
        const sw = Math.sin(t / 400) * 3; rect(318 + sw, 197, 1, 10, '#cfd6e4'); rect(326 + sw, 197, 1, 10, '#cfd6e4'); rect(316 + sw, 207, 12, 2, '#4c9a84');
        rect(350, 200, 2, 14, '#3f6f8c'); rect(350, 199, 10, 2, '#3f6f8c'); for (let i = 0; i < 12; i++) rect(358 + i, 201 + i, 3, 2, '#f2c94c');   // горка
        rect(372, 208, 16, 6, '#e8d39a'); rect(372, 208, 16, 1, '#c45a4a');                                                                       // песочница
        ctx.restore();
      });
      break; }
    case 'lift': {    // машинное помещение лифта на крыше: после ремонта горит окно и огонёк
      rect(130, 34, 28, 10, '#4e4569'); rect(130, 34, 28, 1, '#7a6f98');
      rect(140, 36, 8, 5, k > .5 ? '#f4e6a8' : '#2a2440'); if (k > .5 && Math.sin(t / 250) > 0) rect(156, 35, 1, 1, '#7fe08a');
      A(1 - k, () => { rect(134, 37, 3, 3, '#b8443f'); });
      break; }
    case 'antenna': {   // общая антенна: опускается сверху на тросе; тарелки с балконов исчезают
      A(1 - k, () => { for (const d of HOUSE_ART.dishes) { rect(d.x, d.y, 3, 4, '#c9cdd6'); rect(d.x - 1, d.y + 1, 1, 2, '#8792ad'); } });
      if (k > 0) { const y = 30 - (1 - Math.min(1, k * 1.3)) * 50;
        if (k < .8) rect(268, -10, 1, y + 10, '#8792ad');
        rect(268, y + 4, 1, 12, '#8792ad'); rect(264, y + 14, 9, 1, '#5d6884'); rect(262, y - 2, 4, 9, '#e6ecf5'); rect(263, y - 3, 5, 1, '#e6ecf5'); rect(265, y + 1, 3, 1, '#8792ad');
        if (k >= 1 && Math.sin(t / 300) > 0) rect(268, y + 3, 1, 1, '#ff4a3a'); }
      break; }
    case 'sign': {    // вывеска на крыше: до — почти вся тёмная, после — буквы загораются по очереди
      const s = signText(), x0 = 200 - Math.round(textW(s, 6) / 2);
      rect(x0 - 4, 22, textW(s, 6) + 8, 11, '#140b0d'); for (const px of [x0 + 10, 200, x0 + textW(s, 6) - 10]) rect(px, 33, 1, 9, '#2a2440');
      let acc = 0; [...s].forEach((ch, i) => {
        const on = k >= (i + 1) / s.length || (k === 0 && i % 4 === 1 && Math.sin(t / 130 + i) > -.3);
        text(ch, x0 + acc, 24, { size: 6, col: on ? '#ff6a45' : '#3c1714' }); acc += textW(ch, 6); });
      if (k >= 1) A(.25 + .05 * Math.sin(t / 140), () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; rect(x0 - 6, 20, textW(s, 6) + 12, 15, '#ff4a30'); ctx.restore(); });
      break; }
    case 'bench': A(k, () => { for (const bx of [228, 252]) { rect(bx, 193, 14, 2, '#8a5a3a'); rect(bx, 190, 14, 1, '#8a5a3a'); rect(bx + 1, 195, 1, 3, '#2a2a2a'); rect(bx + 12, 195, 1, 3, '#2a2a2a'); } }); break;
    case 'flowers': A(k, () => { for (const fx of [126, 150, 228, 254]) { rect(fx, 186, 20, 3, '#4a3a2a'); for (let i = 0; i < 6; i++) rect(fx + 1 + i * 3, 184 + (i % 2), 2, 2, ['#e05a7a', '#f2c94c', '#f4f3ee'][i % 3]); } }); break;
    case 'trees': A(k, () => { for (const [tx, s] of [[22, 1], [58, 1.2], [92, .9]]) { const h = Math.round(22 * s * Math.min(1, k * 1.2));
      rect(tx, 200 - h, 2, h, '#4a3028'); ctx.fillStyle = '#b8562e'; ctx.beginPath(); ctx.arc(tx + 1, 200 - h, 9 * s * Math.min(1, k * 1.2), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8913a'; ctx.beginPath(); ctx.arc(tx - 2, 198 - h, 4 * s * Math.min(1, k * 1.2), 0, Math.PI * 2); ctx.fill(); } }); break;
    case 'lamps': A(k, () => { for (const lx of [104, 296]) { rect(lx, 160, 1, 32, '#1a1e28'); rect(lx - 3, 159, 7, 2, '#2a2f3c'); rect(lx - 2, 161, 5, 1, '#fff1b8');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .18; ctx.fillStyle = '#ffd890'; ctx.beginPath(); ctx.moveTo(lx - 2, 162); ctx.lineTo(lx + 3, 162); ctx.lineTo(lx + 14, 192); ctx.lineTo(lx - 13, 192); ctx.fill(); ctx.restore(); } }); break;
    case 'parking': A(k, () => { rect(8, 204, 84, 18, '#2a3142'); for (let i = 0; i <= 4; i++) rect(8 + i * 21, 204, 1, 18, '#cfd6e4');
      for (const [cx, col] of [[12, '#b8443f'], [54, '#3f6f8c']]) { rect(cx, 210, 16, 6, col); rect(cx + 3, 207, 10, 3, col); rect(cx + 4, 208, 3, 2, '#1b2030'); rect(cx + 8, 208, 4, 2, '#1b2030'); rect(cx + 2, 216, 3, 2, '#0d0f14'); rect(cx + 11, 216, 3, 2, '#0d0f14'); } }); break;
  }
}

function drawHouseMap(t, anim) {
  if (!HOUSE_ART.built) buildHouseArt();
  sprite(HOUSE_ART.bg, 0, 0);
  if (Math.random() < 1 / 40) { const w = pick(Math.random, HOUSE_ART.win); w.on = !w.on; }
  for (const w of HOUSE_ART.win) drawHouseWindow(w);
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
  if (HOUSE_ART.fg) sprite(HOUSE_ART.fg, 0, 0);
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
    if (!HOUSE_STATE.fixed.length && !this.hinted) { this.hinted = true; setTimeout(() => toast('E-KNOT', L(UI.hHint), 4200), 500); } },
  refresh() { API.house().then(h => { HOUSE_STATE = h; SAVE.coins = h.coins; }).catch(() => {}); },
  // что можно сделать с вещью сейчас
  status(id) {
    const pi = PROBLEMS.findIndex(p => p.id === id);
    if (pi >= 0) { const I = levelInfo(pi);
      if (I.fixed) return { kind: 'done' };
      if (!I.open) return { kind: 'locked', text: L(UI.hNeedPrev) };
      if (!I.won) return { kind: 'vote', text: L(UI.hNeedVote).replace('{n}', I.L.n), level: I.L.id };
      return { kind: 'buy', cost: I.p.cost };
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
      setTimeout(() => { toast('E-KNOT', p ? L(UI.hFixedToast).replace('{p}', L(p.name)) : L(UI.hDecorToast), 3600); this.anim = null; }, 2800);
    } catch (e) { toast('E-KNOT', L(e.code === 'no_money' ? UI.hNoMoney : UI.netFail), 2600); }
    this.busy = false;
  },
  update(dt) {
    this.t += dt; if (this.anim) this.anim.t += dt;
    if (hit('back')) irisTo(W / 2, 120, () => go('title'));
  },
  draw(dt) {
    drawHouseMap(this.t, this.anim);
    // маркеры: «!» — можно действовать, замок — пока закрыто
    const ids = [...PROBLEMS.map(p => p.id), ...DECOR.map(d => d.id)];
    if (!this.anim) for (const id of ids) {
      const st = this.status(id), [cx, cy] = HSPOT[id]; if (st.kind === 'done') continue;
      const pulse = Math.floor(this.t / 350) % 2;
      const mk = (bg, ch) => { const y = cy - 7 - (pulse ? 1 : 0); rect(cx - 7, y + 1, 14, 14, 'rgba(10,8,20,.5)'); rect(cx - 7, y, 14, 14, '#1b1a21'); rect(cx - 6, y + 1, 12, 12, bg); rect(cx - 6, y + 1, 12, 1, '#fff6c8'); text(ch, cx, y + 3, { align: 'center', col: '#1b1a21' }); };
      if (st.kind === 'buy') mk(HOUSE_STATE.coins >= st.cost ? '#f2c94c' : '#a99fc8', '!');
      else if (st.kind === 'vote') mk('#7fc4a8', '?');
      else if (PROBLEMS.some(p => p.id === id)) { ctx.globalAlpha = .55; rect(cx - 3, cy - 2, 6, 5, '#55607c'); rect(cx - 2, cy - 5, 4, 3, '#55607c'); ctx.globalAlpha = 1; }
    }
    // верхняя панель
    rect(0, 0, W, 19, '#0e111c'); rect(0, 19, W, 1, '#55607c');
    text(`${L(UI.budget)} ₸${HOUSE_STATE.coins}`, 6, 5, { col: '#f2c94c' });
    text(`★${HOUSE_STATE.score}`, 128, 5, { col: '#9fd9c2' });
    if (button(L(UI.meetings), 0, 1, 'primary', { left: 176 })) irisTo(W / 2, 120, () => go('levels'));
    if (button(L(UI.menu), 0, 1, 'dark', { left: 344 })) irisTo(W / 2, 120, () => go('title'));
    if (HOUSE_STATE.claimable && button(`${L(UI.bonusDay)} +${HOUSE_STATE.bonus}`, 0, 34, 'alt', { left: 6 }))
      API.claim().then(r => { HOUSE_STATE = r.house; toast('E-KNOT', L(r.reward.status === 'sent' ? UI.rRewardSent : UI.rRewardGuest).replace('{n}', r.reward.points), 3200); }).catch(() => {});
    // выбор вещи на карте
    if (!this.anim && !this.busy) {
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
    if (p) wrapText(L(p.desc), 230, 6).slice(0, 2).forEach((l, i) => text(l, 16, 170 + i * 9, { col: '#cfd6e4', size: 6 }));
    else text(L(UI.hDecorDesc).replace('{n}', d.pts), 16, 170, { col: '#cfd6e4', size: 6 });
    const bx = 318;
    if (st.kind === 'buy') {
      const ok = HOUSE_STATE.coins >= st.cost;
      text(`₸${st.cost}`, bx, 160, { align: 'center', col: ok ? '#f2c94c' : '#e88a7a' });
      if (button(ok ? L(UI.hFix) : L(UI.hEarn), bx, 178, ok ? 'primary' : 'alt', { w: 120 })) {
        if (ok) this.buy(id); else irisTo(W / 2, 120, () => go('levels'));
      }
      if (!ok) wrapText(L(UI.hNoMoneyHint), 200, 6).slice(0, 2).forEach((l, i) => text(l, 16, 196 + i * 9, { col: '#e88a7a', size: 6 }));
    } else if (st.kind === 'vote') {
      wrapText(st.text, 200, 6).slice(0, 2).forEach((l, i) => text(l, 16, 196 + i * 9, { col: '#9fd9c2', size: 6 }));
      if (button(L(UI.hGoVote), bx, 178, 'primary', { w: 120 })) irisTo(W / 2, 120, () => go('tour', { tour: st.level }));
    } else if (st.kind === 'locked') wrapText(st.text, 360, 6).slice(0, 2).forEach((l, i) => text(l, 16, 196 + i * 9, { col: '#8792ad', size: 6 }));
  },
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
    text(`₸${HOUSE_STATE.coins}`, 370, 15, { align: 'right', col: '#f2c94c', size: 6 });
    PROBLEMS.forEach((_, i) => {
      const I = levelInfo(i), y = 28 + i * 20, x = 30;
      rect(x, y, 340, 19, I.open ? '#1d2130' : '#151822'); rect(x, y + 18, 340, 1, '#0a0c12');
      text(`${I.L.n}.`, x + 6, y + 6, { col: I.open ? '#f2c94c' : '#55607c', size: 6 });
      text(L(I.p.name), x + 22, y + 3, { col: I.open ? '#f4f3ee' : '#55607c', size: 6 });
      const info = !I.open ? L(UI.lvLocked) : `${L(UI.lvGoal).replace('{g}', I.L.goal)} · +₸${I.won ? I.L.reward.replay : I.L.reward.first}`;
      text(info, x + 22, y + 11, { col: I.open ? '#9fd9c2' : '#55607c', size: 6 });
      const mark = I.fixed ? '✓' : I.won ? '★' : '';
      if (mark) text(mark, x + 266, y + 6, { col: I.fixed ? '#7fc4a8' : '#f2c94c', size: 6, align: 'center' });
      if (I.open && button(L(UI.play2), x + 306, y + 2, I.won ? 'alt' : 'primary', { w: 60 })) irisTo(W / 2, 120, () => go('tour', { tour: I.L.id }));
    });
    if (button(L(UI.back), W / 2, 200, 'alt')) irisTo(W / 2, 120, () => go('house'));
  },
};
