/* ============================================================
   ГРАФИКА: всё рисуется кодом в маленькие холсты-спрайты
   ============================================================ */
const OUT = '#1b1a21';
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, v));
  return '#' + ((1 << 24) | (c((n >> 16) + amt) << 16) | (c((n >> 8 & 255) + amt) << 8) | c((n & 255) + amt)).toString(16).slice(1);
}

/* ---------- человек 14×28, смотрит вправо. frame: idle0 idle1 walk0..3 knock ---------- */
const PERSON_CACHE = new Map();
function personSprite(look, frame) {
  const key = JSON.stringify(look) + '|' + frame;
  if (PERSON_CACHE.has(key)) return PERSON_CACHE.get(key);
  const c = makeCanvas(14, 28, ({ r, p }) => {
    const sk = look.skin, skD = shade(sk, -28), hc = look.hairCol, tc = look.topCol, tcD = shade(tc, -30), pants = look.pants || '#3b3f55';
    const walk = frame.startsWith('walk') ? +frame[4] : -1;
    const breath = frame === 'idle1' ? 1 : 0;
    // ноги
    const legs = walk === 1 ? [[3, 9]] : walk === 3 ? [[9, 3]] : [[5, 8]];
    const [la, lb] = legs[0];
    r(la, 20, 2, 7, pants); r(lb, 20, 2, 7, shade(pants, -15));
    r(la - (walk === 1 ? 1 : 0), 27, 3, 1, OUT); r(lb, 27, 3, 1, OUT);
    // корпус
    const long = look.top === 'chapan';
    r(3, 11 + breath, 8, (long ? 14 : 10) - breath, tc);
    r(3, 11 + breath, 1, (long ? 14 : 10) - breath, tcD);
    if (look.top === 'hoodie') { r(4, 11, 6, 1, tcD); p(6, 13, '#f4f3ee'); p(7, 14, '#f4f3ee'); r(4, 17, 6, 1, tcD); }
    if (look.top === 'shirt') { p(6, 11, '#f4f3ee'); p(8, 11, '#f4f3ee'); }
    if (look.top === 'jacket') { r(6, 11, 2, 9, '#e9eef5'); p(7, 12, '#b8443f'); p(7, 13, '#b8443f'); }
    if (long) { r(3, 11, 1, 14, '#d9b43a'); r(10, 11, 1, 14, '#d9b43a'); r(3, 24, 8, 1, '#d9b43a'); }
    // руки
    if (frame === 'knock') { r(10, 10, 3, 3, tc); r(12, 8, 2, 3, sk); }
    else { const sw = walk === 1 ? -1 : walk === 3 ? 1 : 0; r(10, 12 + breath, 2, 7, tcD); r(10 + Math.max(0, sw), 19 + breath, 2, 2, sk); }
    r(2, 12 + breath, 2, 7, tc); r(2, 19 + breath, 2, 1, sk);
    // голова
    const hy = breath;
    r(4, 2 + hy, 7, 9, sk); r(4, 9 + hy, 7, 1, skD); r(10, 3 + hy, 1, 7, sk);
    p(8, 6 + hy, OUT); p(10, 6 + hy, OUT); p(9, 8 + hy, shade(sk, -40)); p(10, 8 + hy, shade(sk, -40));
    if (look.old) p(9, 5 + hy, skD);
    // волосы
    const H2 = (x, y, w, h) => r(x, y + hy, w, h, hc);
    if (look.hair === 'short') { H2(4, 1, 7, 2); H2(4, 3, 2, 3); H2(10, 2, 1, 1); }
    if (look.hair === 'long') { H2(4, 1, 7, 2); H2(3, 2, 2, 11); H2(5, 3, 1, 2); }
    if (look.hair === 'bun') { H2(4, 1, 7, 2); H2(4, 3, 2, 3); H2(3, 0, 3, 2); }
    if (look.hair === 'bald') { H2(4, 4, 1, 3); }
    if (look.beard) { r(5, 8 + hy, 6, 2, hc); p(7, 7 + hy, hc); }
    if (look.glasses) { r(7, 6 + hy, 4, 1, OUT); }
    // головной убор
    if (look.hat === 'tyube') { r(4, 0 + hy, 7, 2, '#1b1a21'); p(5, 0 + hy, '#f4f3ee'); p(7, 1 + hy, '#f4f3ee'); p(9, 0 + hy, '#f4f3ee'); }
    if (look.hat === 'cap') { r(4, 0 + hy, 7, 2, look.capCol || '#b8443f'); r(10, 2 + hy, 3, 1, shade(look.capCol || '#b8443f', -30)); }
    if (look.hat === 'scarf') { const sc = look.scarfCol || '#c8414a'; r(3, 0 + hy, 8, 3, sc); r(3, 3 + hy, 2, 8, sc); r(4, 10 + hy, 3, 2, sc); p(5, 1 + hy, '#f4f3ee'); p(8, 1 + hy, '#f4f3ee'); p(3, 6 + hy, '#f4f3ee'); }
    if (look.headphones) { r(4, 0 + hy, 7, 1, OUT); r(4, 5 + hy, 2, 3, '#b8443f'); }
  });
  PERSON_CACHE.set(key, c); return c;
}

/* ---------- портрет 40×40 для диалога. expr: neutral happy angry think sad ---------- */
const PORT_CACHE = new Map();
function portrait(look, expr = 'neutral') {
  const key = JSON.stringify(look) + '|' + expr;
  if (PORT_CACHE.has(key)) return PORT_CACHE.get(key);
  const c = makeCanvas(40, 40, ({ r, p, ell, line }) => {
    const sk = look.skin, skD = shade(sk, -30), hc = look.hairCol, tc = look.topCol;
    // плечи и шея
    r(8, 32, 24, 8, tc); r(6, 34, 28, 6, tc); r(8, 32, 24, 1, shade(tc, 25));
    if (look.top === 'hoodie') { r(14, 32, 12, 2, shade(tc, -30)); p(17, 35, '#f4f3ee'); p(22, 35, '#f4f3ee'); }
    if (look.top === 'shirt') { r(17, 32, 6, 3, '#f4f3ee'); p(20, 34, shade(tc, -40)); }
    if (look.top === 'jacket') { r(17, 32, 6, 8, '#e9eef5'); r(19, 33, 2, 7, '#b8443f'); }
    if (look.top === 'chapan') { r(8, 32, 24, 2, '#d9b43a'); r(19, 32, 2, 8, '#d9b43a'); }
    r(17, 27, 6, 6, skD);
    // голова
    ell(20, 18, 9, 11, sk); r(10, 17, 2, 4, sk); r(28, 17, 2, 4, sk); p(10, 18, skD); p(29, 18, skD);
    // волосы
    if (look.hair === 'short' || look.hair === 'bun') { ell(20, 10, 10, 5, hc); r(11, 10, 2, 8, hc); r(27, 10, 2, 7, hc); r(13, 12, 14, 1, hc); }
    if (look.hair === 'bun') ell(20, 4, 4, 3, hc);
    if (look.hair === 'long') { ell(20, 10, 10, 5, hc); r(10, 10, 3, 20, hc); r(27, 10, 3, 20, hc); r(13, 12, 14, 1, hc); }
    if (look.hair === 'bald') { r(10, 13, 2, 6, hc); r(28, 13, 2, 6, hc); }
    // глаза и рот
    const E = OUT, ey = 18;
    if (expr === 'happy') { for (const x of [15, 23]) { p(x, ey, E); p(x + 1, ey - 1, E); p(x + 2, ey, E); } }
    else if (expr === 'think') { r(16, ey - 1, 2, 2, E); r(24, ey - 1, 2, 2, E); line(14, 13, 18, 12, hc); line(22, 14, 26, 14, hc); }
    else { r(15, ey, 2, 2, E); r(23, ey, 2, 2, E); p(15, ey, '#f4f3ee'); p(23, ey, '#f4f3ee'); }
    if (expr === 'angry') { line(14, 14, 18, 16, OUT); line(22, 16, 26, 14, OUT); }
    if (expr === 'sad') { line(14, 16, 18, 14, hc); line(22, 14, 26, 16, hc); }
    if (expr !== 'think' && expr !== 'angry' && expr !== 'sad') { line(14, 15, 17, 15, shade(hc, 10)); line(23, 15, 26, 15, shade(hc, 10)); }
    p(20, 21, skD); p(20, 22, skD);
    const M = '#7a3b34';
    if (expr === 'happy') { p(17, 24, M); r(18, 25, 4, 1, M); p(22, 24, M); }
    else if (expr === 'angry' || expr === 'sad') { r(18, 25, 4, 1, M); p(17, 26, M); p(22, 26, M); }
    else if (expr === 'think') { r(19, 25, 3, 1, M); }
    else r(18, 25, 4, 1, M);
    if (look.old) { p(13, 20, skD); p(27, 20, skD); line(16, 27, 18, 28, skD); }
    if (look.beard) { r(14, 24, 12, 5, hc); r(16, 29, 8, 2, hc); r(18, 25, 4, 1, '#7a3b34'); }
    if (look.glasses) { for (const x of [13, 21]) { r(x, 16, 6, 1, OUT); r(x, 21, 6, 1, OUT); r(x, 16, 1, 6, OUT); r(x + 5, 16, 1, 6, OUT); } r(19, 18, 2, 1, OUT); }
    if (look.headphones) { r(9, 5, 22, 2, OUT); r(8, 15, 4, 7, '#b8443f'); r(28, 15, 4, 7, '#b8443f'); }
    // головной убор
    if (look.hat === 'scarf') {
      const sc = look.scarfCol || '#c8414a';
      ell(20, 15, 12, 13, sc); ell(20, 19, 7, 9, sk);
      if (expr === 'happy') { for (const x of [15, 23]) { p(x, ey, E); p(x + 1, ey - 1, E); p(x + 2, ey, E); } } else { r(16, ey, 2, 2, E); r(22, ey, 2, 2, E); }
      if (expr === 'happy') { p(17, 24, M); r(18, 25, 4, 1, M); p(22, 24, M); } else if (expr === 'angry' || expr === 'sad') { r(18, 25, 4, 1, M); p(17, 26, M); p(22, 26, M); } else r(18, 25, 4, 1, M);
      p(20, 21, skD); p(20, 22, skD); p(15, 21, skD); p(25, 21, skD);
      const R = rng(7); for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, d = 9 + R() * 3; p(20 + Math.cos(a) * d, 15 + Math.sin(a) * d * 1.05, '#f4f3ee'); }
      r(16, 29, 8, 3, sc); r(22, 31, 3, 4, shade(sc, -25));
    }
    if (look.hat === 'tyube') { r(11, 5, 18, 5, '#1b1a21'); r(12, 4, 16, 1, '#1b1a21'); for (const x of [13, 17, 21, 25]) { p(x, 6, '#f4f3ee'); p(x + 1, 7, '#f4f3ee'); p(x, 8, '#f4f3ee'); } }
    if (look.hat === 'cap') { const cc = look.capCol || '#b8443f'; ell(20, 8, 10, 4, cc); r(10, 8, 20, 3, cc); r(24, 10, 10, 2, shade(cc, -30)); }
  });
  PORT_CACHE.set(key, c); return c;
}

/* ---------- енот (маскот), портрет и маленький спрайт ---------- */
const RAC = [
  "................", ".......k...k....", "......kgk.kgk...", "......kgggggk...", ".....kglllllgk..", ".....kmmwmwmmk..",
  ".....kmmlllmmkk.", "kk...kllllllllk.", "ktk...kkllllkk..", "kgtk.kgggggggk..", ".kgtkggggggggk..", "..kkgglllllggk..",
  "....kggllllggk..", "....kgggggggk...", "....kmk...kmk...", "....kk....kk...."];
const RAC_PAL = { k: '#2b2a33', g: '#8f949c', l: '#d8dad6', w: '#f4f3ee', m: '#3b3a46', t: '#4b4a57' };
const RACCOON = makeCanvas(16, 16, ({ p }) => RAC.forEach((row, y) => [...row].forEach((ch, x) => RAC_PAL[ch] && p(x, y, RAC_PAL[ch]))));
const RACCOON_PORT = makeCanvas(40, 40, ({ g, r }) => { r(0, 0, 40, 40, '#2f8577'); g.drawImage(RACCOON, 0, 0, 16, 16, 4, 6, 32, 32); });
const EKNOT_PORT = makeCanvas(40, 40, ({ r }) => { r(0, 0, 40, 40, '#2f8577'); r(8, 8, 24, 24, '#f4f3ee'); r(13, 13, 3, 14, '#2f8577'); r(13, 13, 13, 3, '#2f8577'); r(13, 19, 10, 3, '#2f8577'); r(13, 24, 13, 3, '#2f8577'); });

/* ---------- значки статусов 9×9 ---------- */
function icon(kind) {
  const C = { yes: '#4caf6e', no: '#d9534f', thinking: '#f2c94c', away: '#5b6b8a', noanswer: '#8f949c', online: '#2f8577', renter: '#a19eae', unknown: null, me: '#e98f6f' }[kind];
  if (!C) return null;
  return makeCanvas(9, 9, ({ r, p, line }) => {
    r(1, 0, 7, 9, OUT); r(0, 1, 9, 7, OUT); r(1, 1, 7, 7, C);
    const w = '#f4f3ee';
    if (kind === 'yes') { line(2, 4, 3, 5, w); line(3, 5, 6, 2, w); p(3, 6, w); }
    if (kind === 'no') { line(2, 2, 6, 6, w); line(6, 2, 2, 6, w); }
    if (kind === 'thinking') { r(3, 2, 3, 1, OUT); p(5, 3, OUT); p(4, 4, OUT); p(4, 6, OUT); }
    if (kind === 'away') { r(3, 2, 3, 5, w); r(4, 2, 2, 4, C); }
    if (kind === 'noanswer') { p(2, 4, w); p(4, 4, w); p(6, 4, w); }
    if (kind === 'online') { r(3, 2, 3, 5, w); r(3, 3, 3, 2, C); p(4, 6, C); }
    if (kind === 'renter') { r(2, 3, 3, 3, w); r(5, 4, 3, 1, w); p(7, 5, w); }
    if (kind === 'me') { r(2, 4, 5, 3, w); line(2, 4, 4, 2, w); line(4, 2, 6, 4, w); }
  });
}
const ICONS = {}; for (const k of ['yes', 'no', 'thinking', 'away', 'noanswer', 'online', 'renter', 'me']) ICONS[k] = icon(k);

/* ---------- подъезд в разрезе ---------- */
const FLOOR_H = 100, STAIR_X = 78;
const DOOR_X = [134, 200, 266, 332];
const floorBase = (f, floors) => 40 + floors * FLOOR_H - (f - 1) * FLOOR_H; // линия пола этажа f
function drawStairwell(floors, doorLook) {
  const WH = 60 + floors * FLOOR_H;
  return makeCanvas(W, WH, ({ r, p, line, g }) => {
    const R = rng(67);
    r(0, 0, W, WH, '#1d1f26');
    for (let f = 1; f <= floors; f++) {
      const b = floorBase(f, floors), top = b - FLOOR_H + 6;
      // стены: зелёная панель внизу, побелка сверху (классический подъезд)
      r(STAIR_X, top, W - STAIR_X, FLOOR_H - 6, '#cdd0c2');
      r(STAIR_X, b - 40, W - STAIR_X, 40, '#4f7a6a'); r(STAIR_X, b - 41, W - STAIR_X, 1, '#2f4d42');
      for (let i = 0; i < 26; i++) { const x = STAIR_X + R() * (W - STAIR_X - 10), y = top + R() * (FLOOR_H - 50); r(x, y, 2 + R() * 7, 1 + R() * 3, R() < .5 ? '#bfc2b3' : '#dfe1d6'); }
      for (let i = 0; i < 12; i++) { const x = STAIR_X + R() * (W - STAIR_X - 10), y = b - 38 + R() * 30; r(x, y, 3 + R() * 6, 2 + R() * 3, '#5f8a79'); }
      // лестничная клетка
      r(0, top, STAIR_X, FLOOR_H - 6, '#b9bcae'); r(0, b - 40, STAIR_X, 40, '#476e5f'); r(STAIR_X - 2, top, 2, FLOOR_H - 6, '#9a9d90');
      // окно на площадке
      r(18, top + 8, 26, 22, '#3a3d48'); r(20, top + 10, 22, 18, f % 2 ? '#2b3a5c' : '#2f4066'); r(30, top + 10, 2, 18, '#3a3d48'); r(20, top + 18, 22, 1, '#3a3d48');
      p(23, top + 12, '#f2e6a0'); p(36, top + 14, '#e8eef5'); p(26, top + 22, '#e8eef5');
      // номер этажа краской
      g.fillStyle = '#2f4d42'; g.font = '16px ' + FONT; g.textBaseline = 'top'; g.fillText(String(f), 52, b - 36);
      // перекрытие
      r(0, b, W, 6, '#7d7f78'); r(0, b, W, 1, '#9a9c94'); r(0, b + 5, W, 1, '#5d5f58');
      // двери
      for (let d = 0; d < 4; d++) {
        const x = DOOR_X[d], apt = (f - 1) * 4 + d + 1, L = doorLook(apt);
        r(x - 14, b - 44, 28, 44, '#5d5f58');
        r(x - 12, b - 42, 24, 42, L.col);
        if (L.padded) { for (let yy = b - 38; yy < b - 4; yy += 6) for (let xx = x - 9; xx < x + 10; xx += 6) { p(xx, yy, shade(L.col, 30)); } r(x - 12, b - 42, 1, 42, shade(L.col, -25)); }
        if (L.metal) { r(x - 10, b - 38, 20, 14, shade(L.col, 12)); r(x - 10, b - 20, 20, 16, shade(L.col, 12)); }
        p(x, b - 30, OUT); r(x + 7, b - 22, 3, 2, '#d9b43a');
        r(x - 6, b - 54, 12, 9, '#c8a776'); g.fillStyle = OUT; g.font = '8px ' + FONT; g.textAlign = 'center'; g.fillText(String(apt), x, b - 53); g.textAlign = 'left';
        r(x - 11, b - 1, 22, 1, '#6e5135');
      }
      // мелочи: щиток, объявления, батарея
      r(STAIR_X + 8, top + 10, 16, 22, '#7b7f86'); r(STAIR_X + 10, top + 12, 12, 6, '#5d6166'); p(STAIR_X + 20, top + 26, '#d9b43a');
      r(366, top + 14, 16, 20, '#efe8d6'); for (let i = 0; i < 5; i++) r(368, top + 18 + i * 3, 10 + (i % 2) * 2, 1, '#857d6c');
      r(372, top + 12, 4, 3, 'rgba(234,220,156,.9)');
      r(8, b - 18, 26, 12, '#9aa0a5'); for (let i = 0; i < 6; i++) r(10 + i * 4, b - 18, 2, 12, '#7b7f86');
      if (f === 1) { r(366, b - 40, 26, 22, '#5b6f7a'); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) r(368 + i * 8, b - 38 + j * 10, 6, 8, '#7a8f9a'); }
      if (f === 1) { line(STAIR_X + 30, b - 30, STAIR_X + 46, b - 34, '#8c3b4a'); line(STAIR_X + 46, b - 34, STAIR_X + 52, b - 28, '#8c3b4a'); }
      // лестница: пролёт вверх-влево до площадки, потом вверх-вправо (рисуется для перехода на f+1)
      if (f < floors) {
        const mid = b - 50, nb = b - FLOOR_H;
        for (let i = 0; i < 10; i++) { const sx = STAIR_X - 8 - i * 6, sy = b - i * 5; r(sx - 6, sy - 5, 8, 5, '#8a8c84'); r(sx - 6, sy - 5, 8, 1, '#a5a79e'); }
        r(0, mid, 18, 4, '#7d7f78');
        for (let i = 0; i < 10; i++) { const sx = 14 + i * 6, sy = mid - i * 5; r(sx, sy - 5, 8, 5, '#9a9c94'); r(sx, sy - 5, 8, 1, '#b5b7ae'); }
        line(STAIR_X - 8, b - 14, 10, mid - 12, '#3a3a40'); line(14, mid - 12, STAIR_X - 2, nb - 12, '#3a3a40');
        for (let i = 0; i < 10; i++) { const sx = STAIR_X - 10 - i * 6; line(sx, b - i * 5 - 5, sx, b - i * 5 - 14, '#55555c'); }
      }
    }
    // крыша и подвал
    r(0, 0, W, 34, '#2b2c33'); r(0, 30, W, 4, '#55575c');
  });
}

/* ---------- ночной дом снаружи (титул, пролог) ---------- */
function drawNightHouse(signOn) {
  return makeCanvas(W, H, ({ r, p, g }) => {
    for (let y = 0; y < H; y++) r(0, y, W, 1, `rgb(${18 + y * .05 | 0},${28 + y * .08 | 0},${54 + y * .1 | 0})`);
    const R = rng(3);
    for (let i = 0; i < 90; i++) p(R() * W, R() * 150, R() < .2 ? '#f4f3ee' : '#9fb0cc');
    // дом-панелька
    const x0 = 96, y0 = 84, w = 230, h = 170;
    r(x0, y0, w, h, '#c4c9cf'); r(x0, y0, w, 3, '#8a9096'); r(x0 + w - 18, y0, 18, h, '#a9afb6');
    for (let fl = 0; fl < 9; fl++) for (let c = 0; c < 12; c++) {
      const wx = x0 + 8 + c * 18, wy = y0 + 10 + fl * 17; if (wx > x0 + w - 24) continue;
      const lit = R() < .28; r(wx, wy, 11, 10, lit ? (R() < .5 ? '#f2d27a' : '#e9b85a') : '#3a4458');
      if (lit) r(wx, wy + 8, 11, 2, shade('#f2d27a', -40)); r(wx - 1, wy + 11, 13, 1, '#8a9096');
    }
    // вывеска на крыше
    g.font = '10px ' + FONT; g.textBaseline = 'top';
    const sign = LANG === 'kz' ? 'БӘРІ ЖАҚСЫ БОЛАДЫ!' : 'ВСЁ БУДЕТ ХОРОШО!';
    const sw = g.measureText(sign).width + 10; const sx = Math.round(x0 + w / 2 - sw / 2), sy = y0 - 18;
    r(sx, sy, sw, 14, '#2a1a1c'); r(sx + 4, sy + 14, 2, 4, '#3a3a40'); r(sx + sw - 6, sy + 14, 2, 4, '#3a3a40');
    if (signOn) { g.fillStyle = 'rgba(255,90,60,.35)'; g.fillRect(sx - 4, sy - 4, sw + 8, 22); }
    g.fillStyle = signOn ? '#ff7a4a' : '#5a2a28'; g.fillText(sign, sx + 5, sy + 2);
    // передний план
    r(0, 184, W, 41, '#141820'); r(0, 184, W, 1, '#2a3040');
    r(338, 118, 62, 107, '#1a1e28'); for (let i = 0; i < 4; i++) r(346, 128 + i * 14, 10, 8, i === 2 ? '#c99a4a' : '#262c3a');
    r(40, 140, 2, 44, '#2a2e38'); r(36, 138, 10, 3, '#2a2e38'); r(38, 141, 6, 2, '#f2d27a');
  });
}
