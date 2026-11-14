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

