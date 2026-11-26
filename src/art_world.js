/* ============================================================
   ЛЮДИ: 18×42, вид сбоку (смотрят вправо), как в референсе автора.
   Походка — 8 кадров: ноги «шарнирные» (бедро + голень), руки
   качаются навстречу ногам, корпус чуть проседает на шаге.
   frame: idle0 idle1 walk0..7 climb0..3 knock
   body: 'm' | 'f' (если не задано — по причёске/платку)
   ============================================================ */
const tones = c => [shade(c, 24), c, shade(c, -28), shade(c, -50)];
const PERSON_CACHE = new Map();
/* позы для сценок (испуг от крысы, падение на луже): углы в градусах — 0 вниз, 90 вперёд, 180 вверх.
   ноги [бедро, сгиб колена], руки [плечо, сгиб локтя]; lean — наклон корпуса (минус — назад), dy — сдвиг вниз.
   Холст позы шире (34×46), человек сдвинут на POSE_OX, POSE_OY */
const POSE_OX = 8, POSE_OY = 2;
const POSES = {
  scare0: { lf: [-10, 12], ln: [70, 100], af: [-160, 10], an: [155, -10], lean: -3, dy: 0 },
  scare1: { lf: [45, 105], ln: [80, 115], af: [-170, 0], an: [165, -15], lean: -2, dy: -1 },
  land:   { lf: [28, 62], ln: [40, 72], af: [-45, 0], an: [50, 0], lean: 2, dy: 3 },
  slip0:  { lf: [-22, 8], ln: [78, 0], af: [-155, 0], an: [150, 30], lean: -4, dy: 0 },
  slip1:  { lf: [72, 30], ln: [100, 10], af: [-150, 20], an: [172, 0], lean: -9, dy: -2 },
  sit:    { lf: [86, 6], ln: [90, 0], af: [-32, 0], an: [70, 30], lean: -3, dy: 14 },
  smell:  { lf: [-5, 5], ln: [6, 8], af: [10, 10], an: [100, 75], lean: -2, dy: 0 },
  lieUp:  { lf: [0, 0], ln: [0, 0], af: [180, 0], an: [176, 0], lean: 0, dy: 0 },
};
// контур: прозрачный пиксель рядом с фигурой красим в тёмный оттенок соседа — силуэт читается чётко, без «чёрной обводки»
function outlinePass(g, w, h) {
  const im = g.getImageData(0, 0, w, h), d = im.data, src = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (src[i + 3]) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = (yy * w + xx) * 4;
      if (src[j + 3] > 200) { d[i] = src[j] * .35; d[i + 1] = src[j + 1] * .33; d[i + 2] = src[j + 2] * .38 + 6; d[i + 3] = 255; break; } } }
  g.putImageData(im, 0, 0);
}
function personSprite(look, frame) {
  const key = JSON.stringify(look) + '|' + frame;
  if (PERSON_CACHE.has(key)) return PERSON_CACHE.get(key);
  const PO = frame.startsWith('pose_') ? POSES[frame.slice(5)] : null, ox = PO ? POSE_OX : 0, oy = PO ? POSE_OY : 0;
  const CW = PO ? 34 : 18, CHh = PO ? 46 : 42;
  // в позе ноги и верх рисуются на разных слоях: верх потом наклоняется построчно (без размытия пикселей)
  let legsL = null, upL = null;
  const c = makeCanvas(CW, CHh, (P0) => {
    let cur = P0;
    if (PO) { legsL = {}; upL = {}; makeCanvas(CW, CHh, Q => Object.assign(legsL, Q)); makeCanvas(CW, CHh, Q => Object.assign(upL, Q)); }
    const r = (x, y, w, h, col) => cur.r(x + ox, y + oy, w, h, col), p = (x, y, col) => cur.p(x + ox, y + oy, col);
    const toLegs = () => { if (PO) cur = legsL; }, toUp = () => { if (PO) cur = upL; };
    const lean = 0, tilt = PO ? PO.lean : 0, pdy = PO ? PO.dy : 0;
    const fem = look.body ? look.body === 'f' : (look.hair === 'long' || look.hair === 'bun' || look.hat === 'scarf');
    const [skL, sk, skD] = tones(look.skin), hair = tones(look.hairCol), top = tones(look.topCol);
    const pants = tones(look.pants || (look.top === 'jacket' ? '#3a3d48' : '#3d5277')), shoe = '#241f1d', shoeL = '#3a322d';
    const skirt = look.bottom === 'skirt';
    // фаза шага: walkN — 8 кадров, climbN — 4 кадра
    let ph = -1, climb = false;
    if (frame.startsWith('walk')) ph = (+frame.slice(4) % 8) / 8 * Math.PI * 2;
    if (frame.startsWith('climb')) { ph = (+frame.slice(5) % 4) / 4 * Math.PI * 2; climb = true; }
    const moving = ph >= 0, breath = frame === 'idle1' ? 1 : 0;
    const bob = moving && Math.abs(Math.sin(ph)) > .7 ? 1 : 0;           // на широком шаге корпус ниже
    const hipX = 9, hipY = 25 + bob + pdy, D = Math.PI / 180;   // коренастые пропорции по референсу: крупная голова, широкий корпус, толстые руки и ноги
    // конечность: отрезок толщиной w пикселей, тень на заднем крае
    const seg = (x0, y0, ang, len, w, col, colD) => {
      for (let i = 0; i <= len; i++) { const x = x0 + Math.sin(ang) * i, y = y0 + Math.cos(ang) * i;
        // в позах конечность может лечь горизонтально — рисуем квадратиком, чтобы не стала тонкой
        r(Math.round(x - w / 2), Math.round(y - (PO ? (w - 1) / 2 : 0)), w, PO ? w : 1, col); p(Math.round(x - w / 2), Math.round(y), colD); }
      return [x0 + Math.sin(ang) * len, y0 + Math.cos(ang) * len];
    };
    const leg = (phase, near) => {
      let a = (moving ? 24 * Math.sin(phase) : 0) * D, bend = (moving ? 38 * Math.max(0, Math.cos(phase)) + 6 * Math.max(0, -Math.sin(phase)) : 0) * D;
      if (PO) { const L = near ? PO.ln : PO.lf; a = L[0] * D; bend = L[1] * D; }
      const lift = climb ? 3 * Math.max(0, Math.sin(phase)) : 0;
      // в юбке ноги в тёмных колготках и тоньше
      const col = skirt ? (near ? '#3b3742' : '#2a2730') : near ? pants[1] : pants[2], colD = skirt ? '#1d1b22' : near ? pants[2] : pants[3];
      // сначала считаем, где колено и стопа, рисуем ботинок, потом ногу поверх — штанина накрывает верх ботинка, ботинок не «проходит» сквозь ногу
      const x0 = hipX + (near ? 1 : -1), kx0 = x0 + Math.sin(a) * 7, ky0 = hipY + Math.cos(a) * 7;
      const fx0 = kx0 + Math.sin(a - bend) * 8, fy0 = ky0 - lift + Math.cos(a - bend) * 8;
      const X = Math.round(fx0), Y = PO ? Math.round(fy0) : Math.min(41, Math.round(fy0)), sc = near ? shoe : '#1a1615';
      const planted = PO || Y >= 40;
      if (planted) { r(X - 2, Y - 2, 6, 3, sc); r(X + 4, Y - 1, 1, 2, sc); r(X - 1, Y - 2, 3, 1, near ? shoeL : shoe); }   // стоит на полу: ботинок целиком, носок вперёд
      else { r(X - 1, Y - 1, 4, 2, sc); p(X + 3, Y, sc); }                                                        // нога в воздухе: ботинок меньше, по направлению голени
      const [kx, ky] = seg(x0, hipY, a, 7, skirt ? 3 : 4, col, colD);
      seg(kx, ky - lift, a - bend, Math.max(5, Math.round(Math.hypot(fx0 - kx, fy0 - (ky - lift))) - 1), skirt ? 3 : 4, col, colD);
    };
    const arm = (phase, near) => {
      let a = (moving ? -22 * Math.sin(phase) : 0) * D, elbow = (moving ? 12 + 14 * Math.max(0, -Math.sin(phase)) : 6) * D;
      if (PO) { const A = near ? PO.an : PO.af; a = A[0] * D; elbow = A[1] * D; }
      const col = near ? top[2] : top[3], colD = near ? top[3] : shade(top[3], -20);   // рука темнее корпуса — читается на фоне куртки, как на референсе
      const sy = 13 + bob + breath + pdy;
      const [ex, ey] = seg(8 + lean + (near ? 1 : -1), sy, a, 6, 3, col, colD);
      const [hx, hy] = seg(ex, ey, a + elbow, 5, 3, col, colD);
      r(Math.round(hx - 1), Math.round(hy), 3, 3, near ? sk : skD); p(Math.round(hx + 1), Math.round(hy) + 2, near ? skD : sk);   // кисть
    };
    const longTop = look.top === 'chapan';
    // дальние рука и нога — темнее, за корпусом
    toUp(); if (frame !== 'knock') arm(ph < 0 ? 0 : ph + Math.PI, false);
    toLegs(); leg(ph < 0 ? Math.PI : ph + Math.PI, false); toUp();
    // корпус в профиль: грудь спереди (справа), спина слева
    const ty = 11 + bob + breath + pdy, th = longTop ? 21 : 14 - breath, tw = fem ? 8 : 10, tx = (fem ? 4 : 3) + lean;
    // корпус: три тона — спина темнее, середина, светлый край груди; округлые плечи
    r(tx + 1, ty, tw - 2, th, top[1]); r(tx, ty + 1, 1, th - 1, top[2]); r(tx + tw - 1, ty + 1, 1, th - 2, top[1]);
    r(tx + 1, ty + 1, 2, th - 2, top[2]); r(tx + tw - 3, ty + 2, 2, th - 5, top[0]);
    r(tx + 1, ty + th - 2, tw - 2, 2, top[2]);                                    // низ куртки в тени
    if (fem && !longTop) { r(tx + tw, ty + 3, 1, 4, top[1]); p(tx + tw, ty + 3, top[0]); r(tx, ty + 8, 1, 3, 'rgba(0,0,0,0)'); }   // силуэт: грудь
    if (!longTop && !skirt) { r(tx + 1, 24 + bob + pdy, tw - 2, 1, '#2a2422'); p(tx + tw - 3, 24 + bob + pdy, '#c9b47a'); }   // ремень с пряжкой
    if (look.top === 'hoodie') { r(tx - 1, ty - 1, 4, 5, top[2]); r(tx, ty - 1, 2, 1, top[1]); r(tx + tw - 5, ty + 8, 4, 3, top[2]); r(tx + tw - 2, ty + 1, 1, 4, '#f4f3ee'); }   // капюшон, карман, шнурок
    if (look.top === 'shirt') { r(tx + tw - 4, ty, 3, 2, '#f4f3ee'); p(tx + tw - 3, ty + 2, '#f4f3ee'); for (let y = ty + 4; y < ty + th - 2; y += 3) p(tx + tw - 2, y, top[3]); r(tx + 2, ty + 5, 1, 6, top[2]); }   // воротник, пуговицы, складка
    if (look.top === 'jacket') { r(tx + tw - 4, ty, 3, 7, '#eef0f4'); r(tx + tw - 3, ty + 1, 1, 8, '#2b2a33'); r(tx + tw - 5, ty, 1, 10, top[3]); r(tx + tw - 4, ty + 7, 1, 3, top[2]); p(tx + tw - 2, ty + 10, top[3]); }   // рубашка, галстук, лацкан
    if (look.top === 'leather') { r(tx + tw - 4, ty, 3, 3, '#e6dcc4'); r(tx + tw - 2, ty + 2, 1, th - 3, top[0]); r(tx + tw - 3, ty + 2, 1, th - 3, top[3]); r(tx + 2, ty + 1, 3, 1, top[0]); }   // ворот, молния, блик на коже
    if (longTop) { r(tx + tw - 2, ty, 2, th, '#d9b43a'); r(tx + tw - 1, ty, 1, th, '#a8822a'); r(tx, ty + th - 1, tw, 1, '#d9b43a'); r(tx, 24 + bob + pdy, tw, 1, '#8a6a1e'); for (let y = ty + 4; y < ty + th - 2; y += 4) p(tx + 3, y, '#d9b43a'); }
    toLegs(); leg(ph < 0 ? Math.PI : ph, true);
    // юбка — поверх бёдер, расширяется книзу и чуть качается на шаге
    if (skirt) { const sw = moving ? Math.round(Math.sin(ph)) : 0, kc = tones(look.skirtCol || '#5a4a6e');
      const sk0 = PO && PO.dy > 8 ? 4 : 8;   // сидя юбка короче — ноги вытянуты вперёд
      for (let i = 0; i < sk0; i++) { const ww = tw + Math.floor(i / 2) + (sk0 < 8 ? i : 0), x0 = tx - lean - Math.floor(i / 4) + (i > 4 ? sw : 0); r(x0, 23 + bob + pdy + i, ww, 1, i === sk0 - 1 ? kc[2] : kc[1]); p(x0, 23 + bob + pdy + i, kc[2]); if (i % 3 === 1) p(x0 + 2, 23 + bob + pdy + i, kc[0]); } }
    toUp();
    // ближняя рука (стук — рука вперёд и вверх)
    if (frame === 'knock') { seg(9, ty + 1, 80 * D, 5, 3, top[2], top[3]); seg(14, ty + 2, 160 * D, 4, 3, top[2], top[3]); r(14, ty - 4, 3, 3, sk); }   // стук: толстая рука, как остальные
    else arm(ph < 0 ? 0 : ph, true);
    // шея и голова в профиль — голова меньше (6×7), пропорции ближе к взрослому человеку
    // голова крупнее (8×9), как на референсе: объёмные волосы, ухо, глаз и нос в профиль
    const hy = bob + breath + pdy, hx = 5 + lean;
    r(hx + 2, 9 + hy, 4, 3, skD); r(hx + 3, 9 + hy, 3, 2, sk);                     // шея
    r(hx, 2 + hy, 8, 8, sk); r(hx + 8, 5 + hy, 1, 2, sk); p(hx + 8, 4 + hy, skL);  // лицо, нос
    r(hx, 3 + hy, 1, 6, skD); r(hx + 1, 9 + hy, 6, 1, skD); p(hx + 7, 9 + hy, skD); // затылок, подбородок
    r(hx + 6, 2 + hy, 2, 2, skL);                                                    // лоб на свету
    // лица у фигурок нет — только объём (лицо видно в окне диалога): тень щеки и подбородка
    r(hx + 1, 6 + hy, 3, 3, skD); r(hx + 4, 8 + hy, 3, 1, skD);
    const H1 = hair[1], H0 = hair[0], H2 = hair[2];
    const cap = () => { r(hx - 1, 1 + hy, 9, 2, H1); r(hx, hy, 7, 1, H1); r(hx + 1, hy, 4, 1, H0); r(hx + 2, 1 + hy, 4, 1, H0); };
    if (look.hair === 'short') { cap(); r(hx - 1, 2 + hy, 3, 5, H1); p(hx - 1, 6 + hy, H2); r(hx + 6, 2 + hy, 2, 1, H1); p(hx + 7, 3 + hy, H2); }
    if (look.hair === 'long') { cap(); r(hx - 2, 2 + hy, 4, 13, H1); r(hx - 2, 10 + hy, 1, 5, H2); r(hx - 1, 3 + hy, 1, 6, H0); r(hx + 6, 2 + hy, 2, 2, H1); p(hx + 1, 14 + hy, H2); }
    if (look.hair === 'bun') { cap(); r(hx - 1, 2 + hy, 3, 5, H1); r(hx - 4, hy, 4, 4, H1); p(hx - 3, hy, H0); p(hx - 4, 3 + hy, H2); r(hx + 6, 2 + hy, 2, 1, H1); }
    if (look.hair === 'curly') { r(hx - 2, hy, 11, 3, H1); r(hx - 3, 2 + hy, 5, 7, H1); for (const [x, y] of [[0, 0], [3, 0], [6, 1], [-2, 3], [-1, 6], [8, 2], [1, 2]]) p(hx + x, y + hy, H0); for (const [x, y] of [[-3, 8], [2, 1], [5, 2]]) p(hx + x, y + hy, H2); }
    if (look.hair === 'bald') { r(hx - 1, 4 + hy, 2, 4, H2); p(hx + 3, 2 + hy, skL); }
    if (look.beard) { r(hx + 3, 7 + hy, 6, 3, H1); r(hx + 4, 7 + hy, 3, 1, sk); p(hx + 5, 9 + hy, H0); r(hx + 2, 5 + hy, 1, 3, H1); }
    if (look.glasses) { r(hx + 5, 4 + hy, 4, 2, OUT); p(hx + 6, 4 + hy, '#cfe4f0'); r(hx + 1, 4 + hy, 4, 1, OUT); }
    if (look.headphones) { r(hx, hy - 1, 8, 1, OUT); r(hx + 1, 4 + hy, 3, 4, '#b8443f'); p(hx + 1, 4 + hy, '#e06a5a'); }
    if (look.hat === 'tyube') { r(hx, hy - 1, 8, 3, '#1b1a21'); r(hx + 1, hy, 1, 1, '#f4f3ee'); p(hx + 4, 1 + hy, '#f4f3ee'); p(hx + 6, hy, '#f4f3ee'); }
    if (look.hat === 'cap') { const cc = look.capCol || '#b8443f'; r(hx - 1, hy - 1, 9, 3, cc); r(hx + 7, 2 + hy, 4, 1, shade(cc, -30)); r(hx + 1, hy - 1, 4, 1, shade(cc, 25)); }
    if (look.hat === 'scarf') { const sc = tones(look.scarfCol || '#c8414a'); r(hx - 1, hy - 1, 10, 4, sc[1]); r(hx - 2, 2 + hy, 4, 10, sc[1]); r(hx + 1, 9 + hy, 6, 3, sc[2]); r(hx + 1, hy, 5, 1, sc[0]); p(hx + 7, 3 + hy, sc[2]); p(hx - 1, 6 + hy, sc[0]); }
    if (PO) {
      // сборка: ноги как есть, верх — со сдвигом строк: у бёдер 0, у макушки tilt
      const g = P0.g, hipRow = 24 + pdy + oy, topRow = 1 + pdy + oy;
      g.drawImage(legsL.g.canvas, 0, 0);
      const U = upL.g.canvas;
      for (let y = 0; y < CHh; y++) { const k = clamp((hipRow - y) / (hipRow - topRow), 0, 1.3); g.drawImage(U, 0, y, CW, 1, Math.round(tilt * k), y, CW, 1); }
    }
  });
  outlinePass(c.getContext('2d'), c.width, c.height);
  PERSON_CACHE.set(key, c); return c;
}
const PW = 18, PH = 42;
// лёжа ничком, головой вперёд (после падения, как в референсе): поза «руки вверх», повёрнутая ровно на 90° — пиксели не ломаются.
// bottom — нижний непрозрачный ряд, hip — где бёдра по x
function lyingSprite(look) {
  const key = JSON.stringify(look) + '|lie';
  if (PERSON_CACHE.has(key)) return PERSON_CACHE.get(key);
  const src = personSprite(look, 'pose_lieUp'), c = makeCanvas(src.height, src.width, ({ g }) => { g.translate(src.height, 0); g.rotate(Math.PI / 2); g.drawImage(src, 0, 0); });
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let bottom = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) bottom = y;
  c.bottom = bottom; c.hip = c.width - 1 - (24 + POSE_OY); PERSON_CACHE.set(key, c); return c;
}

/* ============================================================
   ПОДЪЕЗД В РАЗРЕЗЕ — по референсу: тёмные зелёно-серые стены,
   грязь, облупленная краска, чёрные перила, стёганые двери
   ============================================================ */
// этаж: слева 3 квартиры, в центре лестница и лифт, справа 3 квартиры
// подъезд шире экрана: по 4 квартиры слева и справа от лестницы, камера едет за героем
const SW = 492;
const FLOOR_H = 100, CORE_L = 190, CORE_R = 302, STAIR_FOOT = 198, STAIR_TOP = 262, LIFT_X = 286;
const STAIR_X = STAIR_FOOT;                  // для старого кода: точка, где начинается подъём
const RAT_HOLES = [49, 351, 397, 443];
const DOOR_X = [26, 72, 118, 164, 328, 374, 420, 466];
const WALK_MIN = 6, WALK_MAX = SW - 6;
const floorBase = (f, floors) => 40 + floors * FLOOR_H - (f - 1) * FLOOR_H;
// двери как на референсе: стёганые с ромбами и гвоздиками, железные с клёпками, деревянные
const DOOR_STYLES = [
  { col: '#3d3554', kind: 'quilt' }, { col: '#5a3426', kind: 'quilt' }, { col: '#4a5260', kind: 'metal' },
  { col: '#9b4a2c', kind: 'metal' }, { col: '#5a5f3a', kind: 'wood' }, { col: '#3b4a5a', kind: 'metal' }, { col: '#6b3a2e', kind: 'quilt' }, { col: '#2e3a3c', kind: 'quilt' }];
function drawDoorPanel(P, x, b, L, w = 26, h = 48) {
  const { r, p } = P, [cL, c, cD, cDD] = tones(L.col), x0 = x - w / 2, y0 = b - h;
  // наличник: тёмная рамка с фаской
  r(x0 - 3, y0 - 3, w + 6, h + 3, '#1a1d1b'); r(x0 - 2, y0 - 2, w + 4, 1, '#4c5548'); r(x0 - 2, y0 - 2, 1, h + 2, '#3e463b');
  r(x0, y0, w, h, c);
  if (L.kind === 'quilt') {
    // ромбы стёжки, на пересечениях — латунные гвоздики
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const u = (xx + yy) % 8, v = (xx - yy + 800) % 8;
      if (u === 0 || v === 0) p(x0 + xx, y0 + yy, cDD); else if (u === 1 || v === 1) p(x0 + xx, y0 + yy, cD); else if (u === 4 && v === 4) p(x0 + xx, y0 + yy, cL);
    }
    for (let yy = 0; yy < h; yy += 8) for (let xx = (yy / 8) % 2 ? 4 : 0; xx < w; xx += 8) { p(x0 + xx, y0 + yy, '#c9a95a'); }
    r(x0, y0, w, 1, cL); r(x0 + w - 1, y0, 1, h, cDD);
  }
  if (L.kind === 'metal') {
    r(x0 + 3, y0 + 3, w - 6, 18, cD); r(x0 + 4, y0 + 4, w - 8, 16, c); r(x0 + 4, y0 + 4, w - 8, 1, cL);
    r(x0 + 3, y0 + 25, w - 6, 20, cD); r(x0 + 4, y0 + 26, w - 8, 18, c); r(x0 + 4, y0 + 26, w - 8, 1, cL);
    for (let yy = 2; yy < h - 1; yy += 6) { p(x0 + 1, y0 + yy, cL); p(x0 + w - 2, y0 + yy, cDD); }
    for (let i = 0; i < 6; i++) p(x0 + 5 + i * 3, y0 + 12 + (i % 2), cDD);                    // царапины
    r(x0, y0, 1, h, cL); r(x0 + w - 1, y0, 1, h, cDD);
  }
  if (L.kind === 'wood') { for (let xx = x0 + 3; xx < x0 + w - 2; xx += 4) r(xx, y0 + 1, 1, h - 2, cD); r(x0 + 2, y0 + 18, w - 4, 2, cDD); r(x0 + 2, y0 + 17, w - 4, 1, cL); r(x0, y0, 1, h, cL); }
  // ручка, глазок, табличка
  r(x + 7, b - 25, 4, 2, '#c9a95a'); p(x + 10, b - 24, '#7a6532'); r(x + 8, b - 27, 2, 6, '#2a2620');
  r(x - 1, b - 36, 2, 2, '#1a1d1b'); p(x - 1, b - 36, '#8a9aa2');
  r(x - 4, b - 43, 8, 3, '#b8b2a0'); r(x - 3, b - 42, 6, 1, '#6a6458');
}
// дизеринг-«грязь»: рассыпанные точки двух тонов
function dirt(P, x, y, w, h, cols, dens, R) { for (let i = 0; i < w * h * dens; i++) P.p(x + Math.floor(R() * w), y + Math.floor(R() * h), cols[Math.floor(R() * cols.length)]); }

function drawStairwell(floors, doorLook, fixed = new Set()) {
  const WH = 60 + floors * FLOOR_H + 96;
  const perFloor = DOOR_X.length;
  // палитра подъезда по референсу: оливково-серый верх, сине-зелёная панель снизу, чёрные перекрытия
  const C = { up: '#5a6652', upL: '#677359', upD: '#4c5746', low: '#365350', lowL: '#40605b', lowD: '#2b4441', line: '#22302b', core: '#6b725e', coreL: '#7a8169', coreD: '#5a6150',
    slab: '#131713', slabT: '#3a4234', step: '#1a201b', stepT: '#4a5444', rail: '#0c0f0d', pipe: '#3c4842', pipeL: '#56645b' };
  // ремонт стен: свежая краска — светлее и чище, та же гамма (тёплый верх, сине-зелёная панель)
  const FRESH = fixed.has('walls');
  C.pil = '#4a5444'; C.pilL = '#626d58'; C.pilD = '#2c332a'; C.frame = '#5a3e26';
  // ремонт по референсам Әмины: светлый верх, сиреневая панель, бежевая плитка у лифта, шахматный пол, серые ступени
  if (FRESH) Object.assign(C, { up: '#cdc6ba', upL: '#d6d0c5', upD: '#c2bbae', low: '#a088aa', lowL: '#ad96b6', lowD: '#927a9b', line: '#efe9df',
    core: '#d3c5ac', coreL: '#dccfb8', coreD: '#c4b69c', pil: '#c9c2b6', pilL: '#d9d3c9', pilD: '#aea698', frame: '#1e1e22',
    slab: '#2e2826', slabT: '#6a5a50', step: '#8a8580', stepT: '#b4aea6', rail: '#2a2a30', pipe: '#dcd8d0', pipeL: '#ece9e3' });
  const DIRT = FRESH ? 0 : 1;   // после ремонта — ни грязи, ни подтёков
  return makeCanvas(SW, WH, (P) => {
    const { r, p, line, g } = P, R = rng(41);
    r(0, 0, SW, WH, '#0f1210');
    for (let f = 1; f <= floors; f++) {
      const b = floorBase(f, floors), top = b - FLOOR_H + 8;
      // крылья: верх стены, тень под потолком, полоса краски, низ панели
      r(0, top, SW, b - top, C.up); dirt(P, 0, top, SW, b - 40 - top, [C.upL, C.upD, C.upD], .06 * DIRT, R);
      for (let i = 0; i < 6; i++) r(0, top + i, SW, 1, `rgba(10,14,10,${((FRESH ? .22 : .45) - i * (FRESH ? .035 : .07)).toFixed(2)})`);
      r(0, b - 40, SW, 40, C.low); dirt(P, 0, b - 40, SW, 40, [C.lowL, C.lowD], .07 * DIRT, R);
      r(0, b - 41, SW, 1, C.line); r(0, b - 40, SW, 1, C.lowL); r(0, b - 3, SW, 3, FRESH ? '#7a6280' : '#1e2b28');
      if (FRESH) r(0, b - 42, SW, 1, '#b8b0a4');   // тонкий молдинг над панелью
      // подтёки: вертикальные полосы сверху вниз и «волны» отслоившейся краски на панели
      for (let i = 0; i < (FRESH ? 0 : 26); i++) { const x = Math.floor(R() * SW), l = 8 + R() * 40, y = top + R() * 20; for (let k = 0; k < l; k++) if (R() < .8) p(x, y + k, k % 5 === 0 ? C.upL : 'rgba(20,26,20,.35)'); }
      for (let i = 0; i < (FRESH ? 0 : 8); i++) { const x = Math.floor(R() * SW), w0 = 10 + R() * 30; for (let k = 0; k < w0; k++) p(x + k, b - 40 + Math.round(Math.sin(k / 3) * 1.5) + 2, C.lowD); }
      // центральная клетка: светлее, свой низ панели, пилястры по краям
      r(CORE_L, top, CORE_R - CORE_L, b - 40 - top, C.core); dirt(P, CORE_L, top, CORE_R - CORE_L, b - 40 - top, [C.coreL, C.coreD], .07 * DIRT, R);
      if (FRESH) { // у лифта — крупная бежевая плитка «под камень» до самого пола, как на втором референсе
        r(CORE_L, top, CORE_R - CORE_L, b - 3 - top, C.core);
        for (let yy = top + 2; yy < b - 3; yy += 16) { r(CORE_L, yy, CORE_R - CORE_L, 1, '#b9ab92'); const off = ((yy - top) / 16) % 2 ? 0 : 12;
          for (let xx = CORE_L + off; xx < CORE_R; xx += 24) r(xx, yy, 1, Math.min(16, b - 3 - yy), '#bdaf96'); }
        for (let i = 0; i < 40; i++) { const xx = CORE_L + R() * (CORE_R - CORE_L), yy = top + 6 + R() * (b - top - 14); r(xx, yy, 1, 3 + R() * 5, R() < .5 ? C.coreL : C.coreD); } }
      for (let i = 0; i < 6; i++) r(CORE_L, top + i, CORE_R - CORE_L, 1, `rgba(10,14,10,${(.45 - i * .07).toFixed(2)})`);
      for (const [px, dir] of [[CORE_L - 7, 1], [CORE_R, -1]]) { r(px, top, 7, b - top, C.pil); r(px + (dir > 0 ? 0 : 6), top, 1, b - top, C.pilL); r(px + (dir > 0 ? 6 : 0), top, 1, b - top, C.pilD);
        dirt(P, px, top, 7, b - top, FRESH ? [C.pilL, C.pilD] : ['#545e4c', '#3e463a'], .12 * DIRT, R); r(px, b - 40, 7, 1, C.line); }
      // трубы по краям: с хомутами и ржавчиной
      for (const px of [2, SW - 7]) { r(px, top - 8, 5, FLOOR_H, C.pipe); r(px + 1, top - 8, 1, FLOOR_H, C.pipeL); r(px + 4, top - 8, 1, FLOOR_H, FRESH ? '#bdb8ae' : '#26302b');
        for (const yy of [top + 18, top + 62]) { r(px - 1, yy, 7, 3, FRESH ? '#bdb8ae' : '#2a322d'); r(px - 1, yy, 7, 1, FRESH ? '#ece9e3' : '#4c5a50'); } if (!FRESH) { p(px + 2, top + 40, '#7a3b28'); p(px + 2, top + 41, '#7a3b28'); } }
      // провода под потолком провисают между крепежами
      if (!FRESH) for (let seg0 = 10; seg0 < SW - 20; seg0 += 64) { if (seg0 > CORE_L - 20 && seg0 < CORE_R) continue;
        for (let k = 0; k <= 60; k++) { const sag = Math.round(Math.sin(k / 60 * Math.PI) * 4); p(seg0 + k, top + 4 + sag, '#121512'); } r(seg0 - 1, top + 3, 3, 2, '#3a4234'); }
      // крыша течёт: на верхнем этаже ржавые разводы
      if (f === floors && !fixed.has('roof')) for (let i = 0; i < 10; i++) { const x = 10 + R() * (SW - 20), w0 = 8 + R() * 22;
        r(x, top, w0, 3 + R() * 4, 'rgba(110,80,40,.45)'); for (let k = 0; k < 20 + R() * 20; k++) if (R() < .7) p(x + R() * w0, top + k, 'rgba(90,64,34,.4)'); }
      // объявления: пачки бумажек, как на референсе
      if (!FRESH) for (const [nx, ny] of [[141, top + 14], [95, top + 22], [397, top + 30]].slice(0, 1 + (f % 3))) {
        for (let i = 0; i < 3; i++) { const qx = nx + (i % 2) * 5 - 2, qy = ny + i * 4; r(qx, qy, 6, 7, i === 1 ? '#c9c2ae' : '#d8d2bf'); r(qx + 1, qy + 2, 4, 1, '#8a8472'); r(qx + 1, qy + 4, 3, 1, '#8a8472'); r(qx + 2, qy - 1, 2, 1, 'rgba(220,206,150,.8)'); } }
      // после ремонта стен — картины в рамках между дверями (простые пейзажи: степь, горы, город)
      if (FRESH) for (const [px, k] of [[95, f], [397, f + 1]]) { const py = top + 9, v = k % 3;   // эскизы в чёрных рамках, как на референсе
        r(px - 1, py - 1, 20, 17, '#1e1e22'); r(px, py, 18, 15, '#f2efe8'); r(px + 2, py + 2, 14, 11, '#e4e0d8'); const ink = '#4a4a52';
        if (v === 0) { r(px + 4, py + 6, 10, 7, ink); r(px + 5, py + 7, 8, 6, '#e4e0d8'); r(px + 8, py + 3, 2, 4, ink); for (let i = 0; i < 4; i++) p(px + 7 + i, py + 3 + Math.abs(1.5 - i), ink); r(px + 6, py + 9, 2, 2, ink); r(px + 10, py + 9, 2, 2, ink); }
        else if (v === 1) { for (const [bx, bh] of [[3, 6], [6, 9], [9, 5], [12, 8]]) { r(px + bx, py + 13 - bh, 3, bh, ink); r(px + bx + 1, py + 14 - bh, 1, bh - 2, '#e4e0d8'); } }
        else { for (let i = 0; i < 7; i++) { p(px + 3 + i, py + 11 - i, ink); p(px + 15 - i, py + 11 - i * .8, ink); } r(px + 3, py + 12, 12, 1, ink); r(px + 12, py + 4, 2, 2, ink); }
        r(px + 8, py - 4, 2, 3, '#2a2a2a'); }
      // растение в кашпо у лестницы
      if (FRESH && f % 2) { const qx = CORE_L - 22; r(qx, b - 12, 10, 9, '#d9cfc0'); r(qx, b - 12, 10, 1, '#ece4d6'); r(qx + 1, b - 4, 8, 1, '#b8ae9e');
        for (const [lx, lh, lc] of [[2, 12, '#3f8a4a'], [4, 16, '#4ea85a'], [6, 13, '#3f8a4a'], [8, 10, '#5cba68'], [5, 9, '#2f7038']]) for (let k = 0; k < lh; k++) p(qx + lx + Math.round(Math.sin(k / 3 + lx) * 1.2), b - 12 - k, lc); }
      // камеры под потолком: у лестницы и у лифта, с красным огоньком
      if (fixed.has('cameras')) for (const cx0 of [CORE_L + 6, CORE_R - 14]) { const cy = top + 7;
        r(cx0 + 3, cy - 2, 2, 3, '#2a2e30'); r(cx0, cy + 1, 9, 5, '#d8d6c8'); r(cx0, cy + 5, 9, 1, '#a8a69a'); r(cx0 + (cx0 < 240 ? 8 : -2), cy + 2, 3, 3, '#2a2e30'); p(cx0 + 2, cy + 2, '#e04a3a'); }
      // стояки: отопление (рыжий) и холодная вода (серо-синий) в углах крыльев, с вентилями и счётчиком
      for (const [sx, col, colL] of [[10, '#7a4a32', '#9a6248'], [16, '#4a5e6a', '#6a8090'], [SW - 16, '#7a4a32', '#9a6248'], [SW - 22, '#4a5e6a', '#6a8090']]) {
        r(sx, top - 8, 3, FLOOR_H, FRESH ? '#dcd8d0' : col); r(sx, top - 8, 1, FLOOR_H, FRESH ? '#ece9e3' : colL); r(sx - 1, top + 30, 5, 2, FRESH ? '#bdb8ae' : '#2a302a'); }
      if (!FRESH) r(8, top + 46, 6, 4, '#b8443f'); p(10, top + 45, '#b8443f'); r(14, top + 54, 7, 7, '#2a302a'); r(15, top + 55, 5, 5, '#d8d6c8'); p(17, top + 57, '#2a2a2a'); p(18, top + 56, '#b8443f');
      if (f % 3 === 2) { r(SW - 18, top + 50, 6, 4, '#b8443f'); p(SW - 16, top + 49, '#b8443f'); }
      // выключатели у ламп и провод к ним
      for (const sx of [56, 141, 344, 436]) { r(sx, b - 58, 4, 6, '#d8d2bf'); p(sx + 1, b - 56, '#8a8472'); if (!FRESH) line(sx + 2, top + 6, sx + 2, b - 58, '#121512'); }   // после ремонта провод спрятан в стену
      // трещины и следы ремонта
      for (let i = 0; i < (FRESH ? 0 : 3); i++) { let cx = 30 + R() * (SW - 60), cy = top + 12 + R() * 30; if (cx > CORE_L - 10 && cx < CORE_R + 10) cx += 120; if (cx > SW - 30) cx -= 200;
        for (let k = 0; k < 12; k++) { p(Math.round(cx), Math.round(cy), '#2c3428'); cx += R() < .5 ? 1 : 0; cy += 1; if (R() < .3) p(Math.round(cx) + 1, Math.round(cy), '#2c3428'); } }
      { const px = 40 + R() * (SW - 100); if (!FRESH && (px < CORE_L - 20 || px > CORE_R + 10)) { r(px, b - 56, 12, 8, '#7a8468'); r(px, b - 56, 12, 1, '#8a9478'); } }
      // щиток и звонки у дверей
      r(87, top + 8, 14, 20, FRESH ? '#8a8680' : '#2a302a'); r(88, top + 9, 12, 18, FRESH ? '#aeaaa2' : '#3f4a42'); r(88, top + 9, 12, 1, FRESH ? '#c8c4bc' : '#56645b'); if (FRESH) r(94, top + 10, 1, 16, '#8a8680');   // аккуратный серый щиток p(97, top + 22, '#d9b43a'); r(90, top + 12, 3, 4, '#2a302a');
      // номер этажа: крупно на стене клетки
      g.globalAlpha = .75; g.fillStyle = FRESH ? '#8a7f6e' : '#c4c7b4'; g.font = '16px ' + FONT; g.textBaseline = 'top'; g.textAlign = 'center'; g.fillText(String(f), LIFT_X, top + 10); g.textAlign = 'left'; g.globalAlpha = 1;
      // лифт: тёмный портал, створки, кнопка
      { const lx = LIFT_X, w0 = 24, h0 = 46;
        r(lx - w0 / 2 - 4, b - h0 - 4, w0 + 8, h0 + 4, FRESH ? '#7e8794' : '#1a1d1b'); r(lx - w0 / 2 - 3, b - h0 - 3, w0 + 6, 1, FRESH ? '#a6aeba' : '#56645b');
        // табло этажа над дверями лифта
        r(lx - 6, b - h0 - 11, 12, 6, '#0e100e'); g.fillStyle = fixed.has('lift') ? '#7fe08a' : '#6a2a22'; g.font = '8px ' + FONT; g.textAlign = 'center'; g.fillText(fixed.has('lift') ? String(f) : '--', lx, b - h0 - 12, 10); g.textAlign = 'left';
        r(lx - w0 / 2, b - h0, w0, h0, '#5f676a'); r(lx - 1, b - h0, 2, h0, '#2a2e30'); r(lx - w0 / 2, b - h0, w0, 1, '#8a9396');
        if (!FRESH) dirt(P, lx - w0 / 2, b - h0, w0, h0, ['#6d7578', '#555c5f'], .2, R);
        r(lx + w0 / 2 + 5, b - 30, 4, 7, '#2a2e30'); p(lx + w0 / 2 + 6, b - 28, fixed.has('lift') ? '#7fe08a' : '#6a2a22');
        if (!fixed.has('lift')) { r(lx - 9, b - 34, 18, 12, '#d8d2bf'); r(lx - 9, b - 34, 18, 1, '#f0ead6'); r(lx - 7, b - 31, 14, 1, '#b8443f'); r(lx - 7, b - 28, 10, 1, '#7a7466'); r(lx - 7, b - 26, 12, 1, '#7a7466');
          r(lx - 3, b - 36, 6, 3, 'rgba(220,206,150,.8)'); line(lx - 12, b - 6, lx + 12, b - 2, '#b8443f'); }
      }
      // граффити
      if (!FRESH) { const tag = ['ОСИ?', 'ЦОЙ', 'А+Д', '2007', 'ЖЕК', 'ҮЙ', 'ЕНОТ', 'Ж+Е', 'АЙ'][f % 9], gx = [95, 351, 443, 49][f % 4], col = pick(R, ['#c9cdc8', '#b88ad0', '#d9705e', '#e0c35a']);
        g.font = '8px ' + FONT; g.textBaseline = 'top'; const tw = Math.min(30, g.measureText(tag).width); g.globalAlpha = .45; g.fillStyle = col; g.fillText(tag, Math.round(gx - tw / 2), b - 34, 30);
        r(Math.round(gx - tw / 2 + 3 + R() * Math.max(1, tw - 6)), b - 26, 1, 2 + Math.floor(R() * 3), col); g.globalAlpha = 1; }
      // двери квартир с номерами и звонками
      for (let d = 0; d < perFloor; d++) {
        const x = DOOR_X[d], apt = (f - 1) * perFloor + d + 1;
        drawDoorPanel(P, x, b, isStorage(apt) ? { col: '#4a4e50', kind: 'metal' } : doorLook(apt));
        r(x - 7, b - 62, 14, 9, '#1a1d1b'); r(x - 6, b - 61, 12, 7, isStorage(apt) ? '#3a3226' : '#2a302a'); g.fillStyle = isStorage(apt) ? '#d8b878' : '#d8dad6'; g.font = '8px ' + FONT; g.textAlign = 'center'; g.fillText(aptNo(apt), x, b - 61); g.textAlign = 'left';
        if (isStorage(apt)) { r(x - 5, b - 40, 10, 2, '#2a2c2e'); r(x - 2, b - 42, 4, 6, '#6a6e70'); p(x - 1, b - 40, '#2a2c2e'); }   // навесной замок
        r(x + 16, b - 32, 3, 4, '#d8d2bf'); p(x + 17, b - 31, '#3a3a3a');
      }
      // первый этаж: почтовые ящики и норы крыс (пока подвал не отремонтирован)
      if (f === 1) { r(CORE_L + 2, b - 42, 32, 22, '#2e3a40'); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { r(CORE_L + 4 + i * 10, b - 40 + j * 10, 9, 8, '#4a5e68'); r(CORE_L + 5 + i * 10, b - 36 + j * 10, 7, 1, '#1c2428'); p(CORE_L + 11 + i * 10, b - 39 + j * 10, '#8a9aa2'); } }
      if (f === 1 && !fixed.has('basement')) for (const hx of RAT_HOLES) { r(hx - 3, b - 3, 7, 3, '#050605'); r(hx - 2, b - 4, 5, 1, '#050605'); p(hx - 3, b - 4, '#2a302a'); p(hx + 3, b - 4, '#2a302a'); }
      // батарея под лестницей
      r(CORE_L + 38, b - 18, 22, 12, FRESH ? '#c8c3ba' : '#3a423a'); for (let i = 0; i < 6; i++) { r(CORE_L + 39 + i * 3.5, b - 18, 2, 12, FRESH ? '#eeebe5' : '#545e52'); p(CORE_L + 39 + i * 3.5, b - 18, FRESH ? '#ffffff' : '#6a7566'); }
      // перекрытие: толстая чёрная плита, мусор на полу
      r(0, b, SW, 9, C.slab); r(0, b, SW, 1, C.slabT); r(0, b + 1, SW, 1, '#252b23');
      if (FRESH) { r(0, b - 3, SW, 3, '#cdb89a'); for (let x = 0; x < SW; x += 6) r(x + ((x / 6) % 2 ? 0 : 0), b - 3 + 0, 3, 3, ((x / 6) % 2) ? '#5a4436' : '#cdb89a'); for (let x = 0; x < SW; x += 6) r(x + 3, b - 3, 3, 3, ((x / 6) % 2) ? '#cdb89a' : '#5a4436'); r(0, b, SW, 1, '#8a7464'); }   // шахматная плитка
      if (!FRESH) for (let i = 0; i < 30; i++) { const x = R() * SW; if (x > CORE_L - 8 && x < CORE_R + 8) continue; p(x, b - 1, pick(R, ['#2a2f28', '#4a5040', '#3a3a30'])); if (R() < .3) p(x + 1, b - 1, '#2a2f28'); }
      // лестница: тёмные ступени-силуэты и тонкие перила с балясинами
      const stairs = (x0, y0, dir, n = 10) => {
        for (let i = 0; i < n; i++) { const sx = x0 + dir * i * 6.4, sy = y0 - i * 5, xx = Math.round(Math.min(sx, sx + dir * 6.4));
          r(xx, sy - 5, 7, 5, C.step); r(xx, sy - 5, 7, 1, C.stepT); }
        // косоур снизу
        for (let k = 0; k <= 64; k++) { const xx = x0 + dir * k, yy = y0 - k * 50 / 64; r(Math.round(xx), Math.round(yy), 1, 3, C.slab); }
      };
      const railing = (x0, y0, dir) => { for (let k = 0; k <= 64; k++) p(Math.round(x0 + dir * k), Math.round(y0 - 14 - k * 50 / 64), C.rail);
        for (let i = 0; i <= 16; i++) { const xx = Math.round(x0 + dir * i * 4), yy = Math.round(y0 - i * 50 / 64 * 4); line(xx, yy - 3, xx, yy - 14, C.rail); } };
      if (f < floors) {
        const mid = b - 50;
        stairs(STAIR_FOOT - 2, b, 1); r(STAIR_TOP - 8, mid, 22, 5, C.slab); r(STAIR_TOP - 8, mid, 22, 1, C.stepT);
        stairs(STAIR_TOP + 2, mid, -1);
        railing(STAIR_FOOT, b - 1, 1); railing(STAIR_TOP, mid - 1, -1);
      } else {
        // последний этаж: пролёт на площадку, там железная дверь на крышу (над шахтой лифта)
        const mid = b - 50;
        stairs(STAIR_FOOT - 2, b, 1); r(STAIR_TOP - 8, mid, 46, 5, C.slab); r(STAIR_TOP - 8, mid, 46, 1, C.stepT);
        railing(STAIR_FOOT, b - 1, 1);
        const dx = STAIR_TOP + 22, dt = mid - 30;
        r(dx - 11, dt - 2, 22, 32, '#1a1d1b'); r(dx - 10, dt - 1, 20, 1, '#56645b');
        r(dx - 9, dt, 18, 30, '#4a5260'); r(dx - 9, dt, 18, 1, '#6a7480'); r(dx - 9, dt, 1, 30, '#5a6270'); r(dx + 8, dt, 1, 30, '#2e343c');
        for (let yy = dt + 3; yy < mid - 2; yy += 7) r(dx - 7, yy, 14, 1, '#3a4250');                      // рёбра жёсткости
        r(dx - 8, dt + 13, 16, 2, '#2a2e30'); r(dx + 3, dt + 12, 4, 6, '#8a6a2a'); r(dx + 4, dt + 14, 2, 2, '#c9a95a');   // засов и замок
        r(dx - 8, dt - 9, 16, 6, '#d8d2bf'); g.fillStyle = '#7a3b28'; g.font = '8px ' + FONT; g.textAlign = 'center'; g.fillText(['ШАТЫР', 'КРЫША', 'ROOF'][LI()], dx, dt - 10, 16); g.textAlign = 'left';
        for (let k = 0; k < 4; k++) p(dx - 12 - k, dt + 6 + k * 2, '#f2c94c');                              // стрелка вверх на стене
      }
    }
    // первый этаж: проём в полу и пролёт вниз до подвальной площадки, дальше — решётчатая дверь
    const descent = (b) => {
      const bb = b + 55, C2 = C;
      r(STAIR_FOOT - 4, b, 72, 9, '#0a0c0a'); r(STAIR_FOOT - 4, b, 72, 1, C2.slabT);
      r(STAIR_FOOT - 4, b + 1, 72, 54, '#151916'); dirt(P, STAIR_FOOT - 4, b + 1, 72, 54, ['#1c211d', '#101311'], .1, R);
      for (let i = 0; i < 10; i++) { const sx = STAIR_FOOT + i * 6.2, sy = b + 6 + i * 5; r(Math.round(sx), sy, 7, 5, C2.step); r(Math.round(sx), sy, 7, 1, C2.stepT); }
      for (let k = 0; k <= 62; k++) r(Math.round(STAIR_FOOT + k), Math.round(b + 9 + k * 50 / 62), 1, 3, C2.slab);
      for (let k = 0; k <= 62; k++) p(Math.round(STAIR_FOOT + k), Math.round(b - 13 + k * 50 / 62), C2.rail);
      for (let i = 0; i <= 15; i++) { const xx = Math.round(STAIR_FOOT + i * 4), yy = Math.round(b + i * 4 * 50 / 62); line(xx, yy - 1, xx, yy - 13, C2.rail); }
      r(STAIR_TOP - 4, bb, 52, 5, C2.slab); r(STAIR_TOP - 4, bb, 52, 1, C2.stepT);
      const gx = STAIR_TOP + 26;
      r(gx - 11, bb - 34, 22, 34, '#0e100e'); r(gx - 10, bb - 33, 20, 33, '#1c201c');
      for (let xx = gx - 9; xx <= gx + 8; xx += 3) r(xx, bb - 33, 1, 33, '#4a5048');
      for (const yy of [bb - 30, bb - 17, bb - 4]) r(gx - 10, yy, 20, 2, '#3a403a');
      r(gx + 5, bb - 18, 3, 4, '#8a6a2a'); r(gx - 8, bb - 42, 16, 6, '#d8d2bf');
      g.fillStyle = '#2a2a2a'; g.font = '8px ' + FONT; g.textAlign = 'center'; g.fillText(['ЖЕРТӨЛЕ', 'ПОДВАЛ', 'BASEMENT'][LI()], gx, bb - 43, 16); g.textAlign = 'left';
      r(gx - 1, bb - 46, 3, 3, fixed.has('basement') ? '#fff1b8' : '#3a3a30');
    };
    r(0, 0, SW, 34, '#0c0e0c'); r(0, 30, SW, 4, '#1e231d');
    // подвал: трубы. До ремонта — ржавые и текут, после — новые, покрашенные
    { const y0 = floorBase(1, floors) + 9, ok = fixed.has('basement');
      r(0, y0, SW, WH - y0, '#101311'); dirt(P, 0, y0, SW, WH - y0, ['#161a17', '#1c211d'], .08, R);
      r(0, y0 + 18, SW, 5, ok ? '#5d7f96' : '#3a3f3c'); r(0, y0 + 18, SW, 1, ok ? '#8fb0c4' : '#565c58');
      r(0, y0 + 30, SW, 3, ok ? '#9a4a3a' : '#5a3d2e'); r(0, y0 + 30, SW, 1, ok ? '#c0705a' : '#7a5440');
      for (let x = 20; x < SW; x += 64) { r(x, y0 + 16, 3, 9, '#2a2e2c'); r(x + 30, y0 + 28, 3, 7, '#2a2e2c'); }
      r(320, y0 + 8, 9, 9, ok ? '#c94a3a' : '#8a2e26'); r(323, y0 + 11, 3, 3, '#101311');
      if (!ok) for (let i = 0; i < 14; i++) r(R() * SW, y0 + 22 + R() * 6, 2 + R() * 6, 2, 'rgba(120,70,40,.6)'); }
    descent(floorBase(1, floors));
  });
}

