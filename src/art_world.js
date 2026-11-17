/* ============================================================
   ЛЮДИ: 18×42, пропорции ближе к реальным (по референсу автора),
   каждая вещь в три тона: свет слева сверху, тень справа.
   frame: idle0 idle1 walk0..3 knock climb0..3
   ============================================================ */
const tones = c => [shade(c, 24), c, shade(c, -28), shade(c, -50)];
const PERSON_CACHE = new Map();
function personSprite(look, frame) {
  const key = JSON.stringify(look) + '|' + frame;
  if (PERSON_CACHE.has(key)) return PERSON_CACHE.get(key);
  const c = makeCanvas(18, 42, ({ r, p }) => {
    const [skL, sk, skD] = tones(look.skin), hair = tones(look.hairCol), top = tones(look.topCol);
    const pants = tones(look.pants || (look.top === 'jacket' ? '#3a3d48' : '#3d5277')), shoe = '#241f1d';
    const walkI = frame.startsWith('walk') ? +frame[4] : frame.startsWith('climb') ? +frame[5] : -1;
    const stride = walkI < 0 ? 0 : [1, 3, 1, -3][walkI] * (frame.startsWith('climb') ? .7 : 1);
    const bob = walkI === 1 || walkI === 3 ? 1 : 0, breath = frame === 'idle1' ? 1 : 0, Y = bob;
    const leg = (x0, dx, col, colD, lift) => {
      for (let y = 25; y <= 39; y++) { const x = Math.round(x0 + dx * (y - 25) / 14); r(x, y - (y > 33 ? lift : 0), 3, 1, col); p(x + 2, y - (y > 33 ? lift : 0), colD); }
      const fx = Math.round(x0 + dx); r(fx, 40 - lift, 5, 1, shoe); r(fx, 41 - lift, 5, 1, '#151211');
    };
    const longTop = look.top === 'chapan';
    // дальняя нога и рука (темнее)
    leg(7, -stride, pants[2], pants[3], frame.startsWith('climb') && walkI % 2 ? 2 : 0);
    const arm = (x0, y0, dx, dy, col, colD) => { for (let i = 0; i < 11; i++) { const x = Math.round(x0 + dx * i / 10), y = y0 + Math.round(dy * i / 10) + i; r(x, y, 2, 1, col); p(x + 1, y, colD); }
      r(Math.round(x0 + dx) , y0 + 11 + dy, 2, 2, skD); };
    arm(4, 13 + breath, stride * .6, 0, top[2], top[3]);
    // ближняя нога
    leg(10, stride, pants[1], pants[2], frame.startsWith('climb') && walkI % 2 === 0 && walkI >= 0 ? 2 : 0);
    // корпус
    const ty = 12 + breath, th = longTop ? 22 : 13 - breath;
    r(5, ty, 9, th, top[1]); r(4, ty + 1, 11, 3, top[1]);
    r(5, ty + 1, 1, th - 1, top[0]); r(13, ty + 1, 1, th - 1, top[2]); r(14, ty + 1, 1, 3, top[2]);
    if (!longTop) { r(5, 24, 9, 1, '#2a2422'); p(9, 24, '#9a8a6a'); }
    if (look.top === 'hoodie') { r(6, ty - 1, 6, 2, top[2]); r(7, ty + 7, 5, 3, top[2]); p(9, ty + 2, '#f4f3ee'); p(10, ty + 3, '#f4f3ee'); }
    if (look.top === 'shirt') { r(8, ty, 3, 2, '#f4f3ee'); for (let y = ty + 3; y < 24; y += 3) p(10, y, top[3]); }
    if (look.top === 'jacket') { r(8, ty, 4, 10, '#e9eef5'); r(9, ty + 1, 2, 7, '#b8443f'); p(8, ty + 1, top[3]); p(11, ty + 1, top[3]); r(7, ty, 1, 9, top[2]); r(12, ty, 1, 9, top[2]); }
    if (look.top === 'leather') { r(8, ty, 4, 11, '#e6dcc4'); r(7, ty, 1, 11, top[3]); r(12, ty, 1, 11, top[3]); p(6, ty + 2, top[0]); }
    if (longTop) { r(5, ty, 1, th, '#d9b43a'); r(13, ty, 1, th, '#d9b43a'); r(5, ty + th - 1, 9, 1, '#d9b43a'); r(5, 23, 9, 1, '#8a6a1e'); }
    // ближняя рука
    if (frame === 'knock') { for (let i = 0; i < 5; i++) r(12 + i, ty + 2 - Math.floor(i / 2), 2, 2, top[1]); r(16, ty - 2, 2, 2, sk); }
    else arm(12, 13 + breath, -stride * .6, 0, top[1], top[2]);
    // шея и голова
    const hy = breath + 0;
    r(8, 10 + hy, 3, 2, skD);
    r(7, 2 + hy, 7, 8, sk); r(8, 10 + hy, 5, 0, sk); r(13, 3 + hy, 1, 6, skD); r(7, 3 + hy, 1, 5, skL); r(8, 9 + hy, 5, 1, skD);
    p(8, 5 + hy, skD); p(8, 6 + hy, skD);                       // ухо
    const blink = frame === 'idle1' && (look.blink);
    if (!blink) { p(11, 5 + hy, OUT); p(13, 5 + hy, OUT); } else { p(11, 6 + hy, skD); p(13, 6 + hy, skD); }
    p(14, 6 + hy, sk); p(12, 8 + hy, '#8a4a3e');
    if (look.old) { p(12, 4 + hy, skD); p(10, 8 + hy, skD); }
    // волосы
    const H1 = hair[1], H0 = hair[0], H2 = hair[2];
    if (look.hair === 'short') { r(7, 1 + hy, 7, 2, H1); r(6, 2 + hy, 2, 5, H1); p(13, 2 + hy, H1); r(9, 1 + hy, 3, 1, H0); p(6, 6 + hy, H2); }
    if (look.hair === 'long') { r(7, 1 + hy, 7, 2, H1); r(5, 2 + hy, 3, 13, H1); r(5, 12 + hy, 3, 3, H2); r(9, 1 + hy, 3, 1, H0); p(13, 3 + hy, H1); }
    if (look.hair === 'bun') { r(7, 1 + hy, 7, 2, H1); r(6, 2 + hy, 2, 5, H1); r(4, 1 + hy, 4, 3, H1); p(5, 1 + hy, H0); }
    if (look.hair === 'curly') { r(6, 0 + hy, 9, 3, H1); r(5, 2 + hy, 3, 7, H1); p(14, 3 + hy, H1); for (const [x, y] of [[7, 0], [10, 0], [13, 1], [5, 4], [6, 7]]) p(x, y + hy, H0); }
    if (look.hair === 'bald') { r(7, 4 + hy, 1, 3, H2); p(9, 2 + hy, skL); }
    if (look.beard) { r(10, 8 + hy, 4, 2, H1); p(13, 7 + hy, H1); p(9, 8 + hy, H1); }
    if (look.glasses) { r(10, 5 + hy, 4, 1, OUT); p(9, 5 + hy, OUT); }
    if (look.headphones) { r(7, 0 + hy, 7, 1, OUT); r(7, 4 + hy, 2, 3, '#b8443f'); }
    if (look.hat === 'tyube') { r(7, 0 + hy, 7, 2, '#1b1a21'); p(8, 0 + hy, '#f4f3ee'); p(10, 1 + hy, '#f4f3ee'); p(12, 0 + hy, '#f4f3ee'); }
    if (look.hat === 'cap') { const cc = look.capCol || '#b8443f'; r(7, 0 + hy, 7, 2, cc); r(13, 2 + hy, 3, 1, shade(cc, -30)); p(8, 0 + hy, shade(cc, 25)); }
    if (look.hat === 'scarf') { const sc = tones(look.scarfCol || '#c8414a'); r(6, 0 + hy, 8, 3, sc[1]); r(5, 2 + hy, 3, 9, sc[1]); r(6, 9 + hy, 4, 3, sc[2]); p(8, 1 + hy, '#f4f3ee'); p(11, 1 + hy, '#f4f3ee'); p(6, 5 + hy, '#f4f3ee'); r(13, 2 + hy, 1, 1, sc[2]); }
  });
  PERSON_CACHE.set(key, c); return c;
}
const PW = 18, PH = 42;

/* ============================================================
   ПОДЪЕЗД В РАЗРЕЗЕ — по референсу: тёмные зелёно-серые стены,
   грязь, облупленная краска, чёрные перила, стёганые двери
   ============================================================ */
// этаж: слева 3 квартиры, в центре лестница и лифт, справа 3 квартиры
const FLOOR_H = 100, CORE_L = 144, CORE_R = 256, STAIR_FOOT = 152, STAIR_TOP = 216, LIFT_X = 240;
const STAIR_X = STAIR_FOOT;                  // для старого кода: точка, где начинается подъём
const RAT_HOLES = [49, 305, 351];
const DOOR_X = [26, 72, 118, 282, 328, 374];
const WALK_MIN = 6, WALK_MAX = 394;
const floorBase = (f, floors) => 40 + floors * FLOOR_H - (f - 1) * FLOOR_H;
const DOOR_STYLES = [
  { col: '#2e3340', kind: 'quilt' }, { col: '#5a3426', kind: 'quilt' }, { col: '#4a5260', kind: 'metal' },
  { col: '#9b3d27', kind: 'wood' }, { col: '#5a5f3a', kind: 'wood' }, { col: '#3b4a5a', kind: 'metal' }, { col: '#6b3a2e', kind: 'quilt' }];
function drawDoorPanel(P, x, b, L, w = 26, h = 48) {
  const { r, p, line } = P, [cL, c, cD, cDD] = tones(L.col), x0 = x - w / 2, y0 = b - h;
  r(x0, y0, w, h, c); r(x0, y0, 1, h, cL); r(x0 + w - 1, y0, 1, h, cD); r(x0, y0, w, 1, cL);
  if (L.kind === 'quilt') {
    // стёжка ромбами — только внутри полотна двери
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if ((xx + yy) % 6 === 0 || (xx - yy + 600) % 6 === 0) p(x0 + xx, y0 + yy, cD);
    for (let yy = y0 + 3; yy < y0 + h; yy += 6) for (let xx = x0 + 3; xx < x0 + w - 1; xx += 6) p(xx, yy, cL);
    r(x0, y0, w, 1, cDD); r(x0, y0 + h - 1, w, 1, cDD); r(x0, y0, 1, h, cDD); r(x0 + w - 1, y0, 1, h, cDD);
  }
  if (L.kind === 'metal') { r(x0 + 3, y0 + 4, w - 6, 16, cL); r(x0 + 4, y0 + 5, w - 8, 14, c); r(x0 + 3, y0 + 24, w - 6, 20, cL); r(x0 + 4, y0 + 25, w - 8, 18, c);
    for (const [xx, yy] of [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]]) p(x0 + xx, y0 + yy, cDD); }
  if (L.kind === 'wood') { for (let xx = x0 + 4; xx < x0 + w - 2; xx += 5) r(xx, y0 + 1, 1, h - 2, cD); r(x0 + 2, y0 + 20, w - 4, 1, cDD); }
  r(x + 7, b - 24, 3, 2, '#c9a95a'); p(x + 9, b - 23, '#7a6532'); p(x - 1, b - 33, OUT); p(x, b - 33, '#6b7a82');
}
function drawStairwell(floors, doorLook, fixed = new Set()) {
  const WH = 60 + floors * FLOOR_H + 96;   // снизу — подвал, чтобы первый этаж не прятался за окном диалога
  const perFloor = DOOR_X.length;
  return makeCanvas(W, WH, (P) => {
    const { r, p, line, g } = P, R = rng(41);
    r(0, 0, W, WH, '#141617');
    for (let f = 1; f <= floors; f++) {
      const b = floorBase(f, floors), top = b - FLOOR_H + 6;
      // крылья с квартирами: верх серо-зелёный, низ тёмная зелёная панель
      for (let y = top; y < b; y++) { const k = (y - top) / (b - top); r(0, y, W, 1, y < b - 44 ? `rgb(${88 - 18 * (1 - k) | 0},${103 - 18 * (1 - k) | 0},${98 - 16 * (1 - k) | 0})` : '#31504a'); }
      r(0, b - 45, W, 1, '#1d302c'); r(0, b - 44, W, 1, '#3e625b');
      // центральная клетка — лестница и лифт, стены темнее; по краям — колонны
      for (let y = top; y < b; y++) r(CORE_L, y, CORE_R - CORE_L, 1, y < b - 44 ? '#47524e' : '#26393a');
      r(CORE_L - 3, top, 3, FLOOR_H - 6, '#1f2523'); r(CORE_R, top, 3, FLOOR_H - 6, '#1f2523'); r(CORE_L - 3, top, 1, FLOOR_H - 6, '#3a4240'); r(CORE_R + 2, top, 1, FLOOR_H - 6, '#3a4240');
      // потёки и грязь
      for (let i = 0; i < 22; i++) { const x = R() * W; r(x, top, 1, 6 + R() * 30, 'rgba(20,24,22,.22)'); }
      // крыша течёт: на верхнем этаже ржавые разводы на потолке и стенах
      if (f === floors && !fixed.has('roof')) for (let i = 0; i < 9; i++) { const x = 10 + R() * (W - 20), w0 = 8 + R() * 22;
        r(x, top, w0, 3 + R() * 4, 'rgba(110,80,40,.45)'); r(x + R() * w0, top, 2, 14 + R() * 26, 'rgba(90,64,34,.35)'); }
      // обвалившаяся штукатурка в простенках
      const gaps = [49, 95, 305, 351].sort(() => R() - .5).slice(0, 1 + (R() < .55 ? 1 : 0));
      for (const gx of gaps) {
        const cx = Math.round(gx + (R() - .5) * 8), cy = Math.round(b - 74 + R() * 10), rw = 3.5 + R() * 4, rh = 2.5 + R() * 2;
        const rad = Array.from({ length: 10 }, () => .55 + R() * .6);
        const inside = (x, y) => { const a = (Math.atan2(y / rh, x / rw) + Math.PI) / (Math.PI * 2) * 10, i = Math.floor(a) % 10, fr = a - Math.floor(a);
          const k = rad[i] * (1 - fr) + rad[(i + 1) % 10] * fr; return (x * x) / (rw * rw) + (y * y) / (rh * rh) <= k * k; };
        for (let y = -Math.ceil(rh * 1.3); y <= Math.ceil(rh * 1.3); y++) for (let x = -Math.ceil(rw * 1.3); x <= Math.ceil(rw * 1.3); x++) {
          const X = cx + x, Y = cy + y;
          if (inside(x, y)) { const row = Math.floor((Y + 300) / 3), mortar = (Y + 300) % 3 === 2 || (X + (row % 2) * 3) % 6 === 0;
            p(X, Y, mortar ? '#4f4c45' : ((X * 3 + row) % 5 === 0 ? '#6a3a2d' : '#784434')); }
          else if (inside(x, y + 1) || inside(x + 1, y)) p(X, Y, '#a3ada4');
          else if (inside(x, y - 1) || inside(x - 1, y)) p(X, Y, '#2f3835');
        }
      }
      for (let i = 0; i < 12; i++) { const x = R() * (W - 16), y = b - 38 + R() * 30; if (x > CORE_L - 6 && x < CORE_R + 4) continue; r(x, y, 4 + R() * 12, 1, R() < .5 ? '#284239' : '#3e5e56'); }
      // трубы по краям и провод под потолком
      for (const px of [1, W - 5]) { r(px, top, 4, FLOOR_H - 6, '#454c4a'); r(px, top, 1, FLOOR_H - 6, '#5e6663'); r(px - 1, top + 20, 6, 3, '#2c3130'); }
      for (let x = 0; x < W; x++) if (x < CORE_L - 3 || x > CORE_R + 2) p(x, top + 3 + Math.round(Math.sin(x / 26) * 2 + 2), '#151718');
      // номер этажа трафаретом над лифтом
      g.globalAlpha = .8; g.fillStyle = '#c9cdc8'; g.font = '16px ' + FONT; g.textBaseline = 'top'; g.textAlign = 'center'; g.fillText(String(f), LIFT_X, top + 8); g.textAlign = 'left'; g.globalAlpha = 1;
      // лифт: двери, кнопка вызова; пока не починен — табличка «не работает»
      { const lx = LIFT_X, w0 = 24, h0 = 46;
        r(lx - w0 / 2 - 3, b - h0 - 3, w0 + 6, h0 + 3, '#1c1f24'); r(lx - w0 / 2 - 3, b - h0 - 3, w0 + 6, 1, '#4a5052');
        r(lx - w0 / 2, b - h0, w0 / 2 - 1, h0, '#6b7378'); r(lx + 1, b - h0, w0 / 2 - 1, h0, '#6b7378'); r(lx - 1, b - h0, 2, h0, '#2a2e30');
        r(lx - w0 / 2, b - h0, w0, 1, '#9aa3a8'); for (const sx of [lx - 9, lx + 4]) r(sx, b - h0 + 4, 5, h0 - 8, '#7c858a');
        r(lx + w0 / 2 + 4, b - 30, 4, 7, '#2a2e30'); p(lx + w0 / 2 + 5, b - 28, fixed.has('lift') ? '#7fe08a' : '#6a2a22');
        if (!fixed.has('lift')) { r(lx - 9, b - 34, 18, 12, '#d8d2bf'); r(lx - 9, b - 34, 18, 1, '#f0ead6'); r(lx - 7, b - 31, 14, 1, '#b8443f'); r(lx - 7, b - 28, 10, 1, '#7a7466'); r(lx - 7, b - 26, 12, 1, '#7a7466');
          r(lx - 3, b - 36, 6, 3, 'rgba(220,206,150,.8)'); line(lx - 12, b - 6, lx + 12, b - 2, '#b8443f'); }
      }
      // плиты перекрытия
      r(0, b, W, 7, '#3b3f3d'); r(0, b, W, 1, '#5b605c'); r(0, b + 6, W, 1, '#202322');
      // граффити в простенке
      { const tag = ['ОСИ?', 'ЦОЙ', 'А+Д', '2007', 'ЖЕК', 'ҮЙ', 'ЕНОТ', 'Ж+Е', 'АЙ'][f % 9], gx = [95, 305, 351, 49][f % 4], col = pick(R, ['#c9cdc8', '#b88ad0', '#d9705e', '#e0c35a']);
        g.font = '8px ' + FONT; g.textBaseline = 'top'; const tw = Math.min(30, g.measureText(tag).width); g.globalAlpha = .5; g.fillStyle = col; g.fillText(tag, Math.round(gx - tw / 2), b - 34, 30);
        r(Math.round(gx - tw / 2 + 3 + R() * Math.max(1, tw - 6)), b - 26, 1, 2 + Math.floor(R() * 3), col); g.globalAlpha = 1; }
      // объявления и щиток
      r(131, top + 14, 10, 13, '#c9c2ae'); for (let i = 0; i < 3; i++) r(133, top + 17 + i * 3, 6, 1, '#7a7466'); r(134, top + 12, 4, 3, 'rgba(220,206,150,.8)');
      r(89, top + 10, 12, 18, '#3d4446'); r(90, top + 11, 10, 16, '#4f585a'); p(97, top + 24, '#d9b43a'); line(95, top + 3, 95, top + 10, '#151718');
      // двери квартир
      for (let d = 0; d < perFloor; d++) {
        const x = DOOR_X[d], apt = (f - 1) * perFloor + d + 1;
        r(x - 15, b - 50, 30, 50, '#1c1f24'); r(x - 15, b - 50, 30, 1, '#3a3f45');
        drawDoorPanel(P, x, b, doorLook(apt));
        r(x - 7, b - 60, 14, 8, '#1c1f24'); g.fillStyle = '#d8dad6'; g.font = '8px ' + FONT; g.textAlign = 'center'; g.fillText(String(apt), x, b - 60); g.textAlign = 'left';
        r(x - 11, b - 1, 22, 1, '#2a2522');
      }
      // первый этаж: почтовые ящики у лестницы, норы крыс (пока подвал не отремонтирован)
      if (f === 1) { r(CORE_L + 4, b - 44, 30, 22, '#3a4a52'); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { r(CORE_L + 6 + i * 9, b - 42 + j * 10, 8, 8, '#4f6470'); r(CORE_L + 7 + i * 9, b - 38 + j * 10, 6, 1, '#1c2428'); } }
      if (f === 1 && !fixed.has('basement')) for (const hx of RAT_HOLES) { r(hx - 4, b - 4, 9, 4, '#07080a'); r(hx - 3, b - 6, 7, 2, '#07080a'); r(hx - 2, b - 7, 5, 1, '#07080a');
        p(hx - 5, b - 4, '#5b605c'); p(hx - 4, b - 6, '#5b605c'); p(hx + 4, b - 6, '#2b302e'); p(hx + 5, b - 4, '#2b302e'); r(hx - 2, b - 8, 5, 1, '#5b605c'); }
      // батарея под лестницей
      r(CORE_L + 36, b - 18, 22, 12, '#4b524f'); for (let i = 0; i < 6; i++) r(CORE_L + 38 + i * 3, b - 18, 2, 12, '#353a38');
      // лестница с чёрными перилами: пролёт вправо до площадки, потом влево на этаж выше
      if (f < floors) {
        const mid = b - 50;
        const flight = (x0, y0, dir) => { for (let i = 0; i < 10; i++) { const sx = x0 + dir * i * 6.4, sy = y0 - i * 5; r(Math.round(Math.min(sx, sx + dir * 6.4)), sy - 5, 7, 5, '#555a57'); r(Math.round(Math.min(sx, sx + dir * 6.4)), sy - 5, 7, 1, '#727874'); }
          line(x0, y0 + 2, x0 + dir * 64, y0 - 48, '#2a2d2c'); line(x0, y0 + 3, x0 + dir * 64, y0 - 47, '#2a2d2c'); };
        flight(STAIR_FOOT - 2, b, 1);
        r(STAIR_TOP - 8, mid, 20, 5, '#4a4e4b'); r(STAIR_TOP - 8, mid, 20, 1, '#6a6f6b');
        flight(STAIR_TOP + 2, mid, -1);
        const rail = (x0, y0, dir) => { line(x0, y0 - 13, x0 + dir * 64, y0 - 63, '#0e1011'); for (let i = 0; i <= 16; i++) { const xx = x0 + dir * i * 4, yy = y0 - i * 50 / 64 * 4; line(xx, yy - 3, xx, yy - 13, '#141618'); } };
        rail(STAIR_FOOT, b - 2, 1); rail(STAIR_TOP, mid - 2, -1);
      }
    }
    r(0, 0, W, 34, '#101213'); r(0, 30, W, 4, '#2c302e');
    // подвал: трубы. До ремонта — ржавые и текут, после — новые, покрашенные
    { const y0 = floorBase(1, floors) + 7, ok = fixed.has('basement');
      r(0, y0, W, WH - y0, '#121516'); for (let i = 0; i < 40; i++) r(R() * W, y0 + 4 + R() * 80, 2 + R() * 8, 1, '#191d1e');
      r(0, y0 + 18, W, 5, ok ? '#5d7f96' : '#3a3f3c'); r(0, y0 + 18, W, 1, ok ? '#8fb0c4' : '#565c58');
      r(0, y0 + 30, W, 3, ok ? '#9a4a3a' : '#5a3d2e'); r(0, y0 + 30, W, 1, ok ? '#c0705a' : '#7a5440');
      for (let x = 20; x < W; x += 64) { r(x, y0 + 16, 3, 9, '#2a2e2c'); r(x + 30, y0 + 28, 3, 7, '#2a2e2c'); }
      r(250, y0 + 8, 9, 9, ok ? '#c94a3a' : '#8a2e26'); r(253, y0 + 11, 3, 3, '#121516'); r(254, y0 + 17, 1, 2, '#3a3f3c');
      if (!ok) for (let i = 0; i < 14; i++) r(R() * W, y0 + 22 + R() * 6, 2 + R() * 6, 2, 'rgba(120,70,40,.6)');
      for (let x = 0; x < W; x += 40) r(x, y0 + 60, 26, 30, '#16191a'); }
  });
}

