/* ---------- портрет 40×40 для диалога. expr: neutral happy angry think sad ---------- */
const PORT_CACHE = new Map();
function portrait(look, expr = 'neutral') {
  const key = JSON.stringify(look) + '|' + expr;
  if (PORT_CACHE.has(key)) return PORT_CACHE.get(key);
  const c = makeCanvas(40, 40, ({ r, p, ell, line }) => {
    const sk = look.skin, skD = shade(sk, -30), skL = shade(sk, 18), skDD = shade(sk, -48), hc = look.hairCol, tc = look.topCol;
    // плечи: свет справа сверху, слева тень, складки у шеи
    r(8, 32, 24, 8, tc); r(6, 34, 28, 6, tc); r(8, 32, 24, 1, shade(tc, 25));
    r(6, 35, 6, 5, shade(tc, -26)); r(8, 33, 3, 2, shade(tc, -18)); r(27, 33, 5, 2, shade(tc, 16)); r(12, 37, 1, 3, shade(tc, -30)); r(28, 37, 1, 3, shade(tc, -20));
    if (look.top === 'hoodie') { r(14, 32, 12, 2, shade(tc, -30)); p(17, 35, '#f4f3ee'); p(22, 35, '#f4f3ee'); }
    if (look.top === 'shirt') { r(17, 32, 6, 3, '#f4f3ee'); p(20, 34, shade(tc, -40)); }
    if (look.top === 'jacket') { r(17, 32, 6, 8, '#e9eef5'); r(19, 33, 2, 7, '#b8443f'); }
    if (look.top === 'leather') { r(16, 32, 8, 8, shade(tc, -35)); r(18, 32, 4, 3, '#2b2a33'); line(15, 32, 12, 38, shade(tc, 25)); line(24, 32, 27, 38, shade(tc, 25)); p(21, 37, '#c9c6c0'); }
    if (look.top === 'chapan') { r(8, 32, 24, 2, '#d9b43a'); r(19, 32, 2, 8, '#d9b43a'); }
    r(17, 27, 6, 6, skD); r(17, 27, 6, 2, skDD);                                  // шея, тень под подбородком
    // голова: объём — тень слева и снизу, свет на лбу и правой скуле
    ell(20, 18, 9, 11, sk);
    for (let y = 7; y < 30; y++) for (let x = 10; x < 30; x++) { const inH = ((x - 20) ** 2) / 81 + ((y - 18) ** 2) / 121 <= 1; if (!inH) continue;
      if (((x - 22.5) ** 2) / 81 + ((y - 15.5) ** 2) / 121 > 1) p(x, y, skD);
      else if (((x - 23) ** 2) / 12 + ((y - 13) ** 2) / 10 <= 1) p(x, y, skL); }
    r(10, 17, 2, 4, skD); r(28, 17, 2, 4, sk); p(10, 18, skDD); p(29, 18, skD); p(29, 19, skD);   // уши
    // волосы
    if (look.hair === 'short' || look.hair === 'bun') { ell(20, 10, 10, 5, hc); r(11, 10, 2, 8, hc); r(27, 10, 2, 7, hc); r(13, 12, 14, 1, hc); }
    if (look.hair === 'bun') ell(20, 4, 4, 3, hc);
    if (look.hair === 'long') { ell(20, 10, 10, 5, hc); r(10, 10, 3, 20, hc); r(27, 10, 3, 20, hc); r(13, 12, 14, 1, hc); }
    if (look.hair === 'curly') {   // кудри: пышная шапка из завитков, по бокам до скул
      ell(20, 9, 12, 7, hc); r(9, 9, 4, 14, hc); r(27, 9, 4, 14, hc); r(13, 12, 14, 2, hc);
      const hl = shade(hc, 22), hd = shade(hc, -30);
      for (const [x, y] of [[12, 5], [16, 3], [21, 3], [26, 5], [10, 10], [29, 10], [14, 8], [24, 8], [10, 16], [29, 16], [19, 7]]) { p(x, y, hl); p(x + 1, y + 1, hd); }
      for (const x of [8, 31]) for (let y = 8; y < 22; y += 3) p(x, y, hc);
    }
    if (look.hair === 'bald') { r(10, 13, 2, 6, hc); r(28, 13, 2, 6, hc); p(23, 9, skL); p(24, 9, skL); }
    if (['short', 'long', 'bun'].includes(look.hair)) { const hl = shade(hc, 30), hd = shade(hc, -30);   // блик и пряди
      r(21, 7, 5, 1, hl); r(23, 8, 3, 1, hl); r(12, 9, 2, 6, hd); p(16, 12, hd); p(22, 12, hd); if (look.hair === 'long') { r(10, 20, 1, 9, hd); r(28, 18, 1, 10, hl); } }
    // глаза и рот
    // глаза: белок, радужка, верхнее веко; брови цвета волос (толще у мужчин)
    const E = '#1e1820', ey = 18, W0 = '#f2ede4', lid = shade(sk, -55), brow = shade(hc, -12), femB = look.body === 'f';
    const eye = (x, look) => { r(x, ey, 4, 2, W0); r(x + 1 + look, ey, 2, 2, E); p(x + 1 + look, ey, '#5a4438'); r(x, ey - 1, 4, 1, lid); p(x + 3, ey + 1, skD); };
    if (expr === 'happy') { for (const x of [14, 22]) { r(x, ey, 4, 1, lid); p(x, ey + 1, lid); p(x + 3, ey + 1, lid); p(x + 1, ey + 1, skD); } }
    else if (expr === 'think') { eye(14, 1); eye(22, 1); }
    else { eye(14, expr === 'sad' ? 0 : 1); eye(22, expr === 'sad' ? 0 : 1); }
    const bw = femB ? 1 : 2;
    if (expr === 'angry') { line(14, 14, 18, 16, brow); line(22, 16, 26, 14, brow); if (!femB) { line(14, 15, 17, 16, brow); line(23, 16, 26, 15, brow); } }
    else if (expr === 'sad') { line(14, 16, 18, 14, brow); line(22, 14, 26, 16, brow); }
    else if (expr === 'think') { line(14, 15, 18, 15, brow); line(22, 13, 26, 14, brow); }
    else { r(14, 15, 4, bw, brow); r(22, 15, 4, bw, brow); p(14, 16, sk); }
    // нос: тень слева, блик справа
    p(19, 20, skD); p(19, 21, skD); r(19, 22, 3, 1, skD); p(21, 21, skL); p(20, 19, skL);
    const fem = look.body ? look.body === 'f' : (look.hair === 'long' || look.hair === 'bun' || look.hat === 'scarf');
    const M = fem ? '#b8545e' : '#7a3b34';
    if (fem && expr !== 'happy') { p(14, ey - 1, OUT); p(25, ey - 1, OUT); }            // ресницы
    if (fem) { p(14, 22, shade(sk, -8) === sk ? '#e8a08a' : '#e8a08a'); p(26, 22, '#e8a08a'); }   // румянец
    const ML = shade(M, 28);
    if (expr === 'happy') { p(17, 24, M); r(18, 25, 4, 1, M); p(22, 24, M); r(18, 26, 4, 1, ML); r(19, 25, 2, 1, '#f2ede4'); }
    else if (expr === 'angry' || expr === 'sad') { r(18, 25, 4, 1, M); p(17, 26, M); p(22, 26, M); }
    else if (expr === 'think') { r(19, 25, 3, 1, M); p(22, 24, M); }
    else { r(18, 25, 4, 1, M); r(18, 26, 4, 1, fem ? ML : skD); }
    p(20, 27, skD);                                                                   // ямка подбородка
    if (look.old) { p(13, 20, skD); p(27, 20, skD); line(16, 27, 18, 28, skD); }
    if (look.beard) { r(14, 24, 12, 5, hc); r(16, 29, 8, 2, hc); r(18, 25, 4, 1, '#7a3b34'); }
    if (look.glasses) { for (const x of [13, 21]) { r(x, 16, 6, 1, OUT); r(x, 21, 6, 1, OUT); r(x, 16, 1, 6, OUT); r(x + 5, 16, 1, 6, OUT); } r(19, 18, 2, 1, OUT); }
    if (look.headphones) { r(9, 5, 22, 2, OUT); r(8, 15, 4, 7, '#b8443f'); r(28, 15, 4, 7, '#b8443f'); }
    // головной убор
    if (look.hat === 'scarf') {
      // әже в орамале: платок обрамляет лицо, седая чёлка, узел под подбородком, мелкий узор только на ткани
      const [s0, s1, s2] = tones(look.scarfCol || '#c8414a');
      // платок: круглый сверху, по бокам ровно спадает к узлу под подбородком
      const inScarf = (x, y) => y <= 16 ? ((x - 20) ** 2) / 132 + ((y - 15) ** 2) / 156 <= 1 : (y <= 31 && x >= 8.5 + (y - 16) * .5 && x <= 31.5 - (y - 16) * .5);
      const inFace = (x, y) => ((x - 20) ** 2) / 44 + ((y - 20) ** 2) / 66 <= 1;
      const body = (x, y) => inScarf(x, y) && !inFace(x, y);
      for (let y = 2; y < 32; y++) for (let x = 7; x < 34; x++) if (body(x, y)) p(x, y, x > 26 ? s2 : x < 13 ? s0 : s1);
      for (let y = 10; y < 30; y++) for (let x = 12; x < 29; x++) if (inFace(x, y)) p(x, y, sk);
      // складки и редкий узор — только внутри ткани, не по краю
      for (let y = 18; y < 30; y++) { const xl = Math.round(10 + (y - 16) * .5); if (body(xl + 1, y)) p(xl + 1, y, s2); }
      for (let y = 5; y < 30; y += 5) for (let x = 10 + (y % 10 ? 2 : 0); x < 31; x += 5) {
        let ok = true; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!body(x + dx, y + dy)) ok = false;
        if (ok) { p(x, y, '#f1e4c4'); p(x + 1, y, shade(s1, 18)); }
      }
      r(15, 12, 11, 2, '#c9c6c0'); p(15, 14, '#c9c6c0'); p(25, 14, '#c9c6c0'); r(16, 12, 9, 1, '#e6e3dc');   // седая чёлка
      for (let y = 17; y < 29; y++) for (let x = 12; x < 29; x++) if (inFace(x, y) && !inFace(x + 1, y)) p(x, y, skD);   // тень на щеке
      const ey2 = 18;
      if (expr === 'happy') { for (const x of [15, 22]) { p(x, ey2, E); p(x + 1, ey2 - 1, E); p(x + 2, ey2, E); } }
      else { r(16, ey2 - 1, 2, 2, E); r(22, ey2 - 1, 2, 2, E); p(16, ey2 - 1, '#f4f3ee'); p(22, ey2 - 1, '#f4f3ee'); }
      if (expr === 'angry') { line(14, 14, 18, 16, '#8f8a84'); line(21, 16, 25, 14, '#8f8a84'); } else { line(14, 15, 18, 15, '#a8a49c'); line(21, 15, 25, 15, '#a8a49c'); }
      p(14, ey2 + 1, skD); p(26, ey2 + 1, skD); p(13, ey2, skD); p(27, ey2, skD);        // морщинки у глаз
      p(19, 20, skD); p(19, 21, skD); r(19, 22, 2, 1, skD);                            // нос
      p(16, 23, skD); p(24, 23, skD);                                                   // носогубные складки
      if (expr === 'happy') { p(17, 24, M); r(18, 25, 5, 1, M); p(23, 24, M); } else if (expr === 'angry' || expr === 'sad') { r(18, 25, 5, 1, M); p(17, 26, M); p(23, 26, M); } else r(18, 25, 5, 1, M);
      p(15, 21, '#e8a08a'); p(25, 21, '#e8a08a');                                       // румянец
      r(17, 30, 7, 3, s1); r(18, 30, 5, 1, s0); r(15, 33, 4, 5, s2); r(22, 33, 4, 6, s2); p(16, 33, s1); p(23, 33, s1);  // узел и концы
    }
    if (look.hat === 'tyube') { r(11, 5, 18, 5, '#1b1a21'); r(12, 4, 16, 1, '#1b1a21'); for (const x of [13, 17, 21, 25]) { p(x, 6, '#f4f3ee'); p(x + 1, 7, '#f4f3ee'); p(x, 8, '#f4f3ee'); } }
    if (look.hat === 'cap') { const cc = look.capCol || '#b8443f'; ell(20, 8, 10, 4, cc); r(10, 8, 20, 3, cc); r(24, 10, 10, 2, shade(cc, -30)); }
  });
  outlinePass(c.getContext('2d'), 40, 40);
  PORT_CACHE.set(key, c); return c;
}

/* ---------- енот (маскот), портрет и маленький спрайт ---------- */
const RAC_ROWS = [
  "................", ".......k...k....", "......kgk.kgk...", "......kgggggk...", ".....kglllllgk..", ".....kmmwmwmmk..",
  ".....kmmlllmmkk.", "kk...kllllllllk.", "ktk...kkllllkk..", "kgtk.kgggggggk..", ".kgtkggggggggk..", "..kkgglllllggk..",
  "....kggllllggk..", "....kgggggggk...", "....kmk...kmk...", "....kk....kk...."];
const RAC_PAL = { k: '#2b2a33', g: '#8f949c', l: '#d8dad6', w: '#f4f3ee', m: '#3b3a46', t: '#4b4a57' };
const RACCOON = makeCanvas(16, 16, ({ p }) => RAC_ROWS.forEach((row, y) => [...row].forEach((ch, x) => RAC_PAL[ch] && p(x, y, RAC_PAL[ch]))));
const RACCOON_PORT = makeCanvas(40, 40, ({ g, r }) => { r(0, 0, 40, 40, '#2f8577'); g.drawImage(RACCOON, 0, 0, 16, 16, 4, 6, 32, 32); });
const EKNOT_PORT = makeCanvas(40, 40, ({ r }) => { r(0, 0, 40, 40, '#2f8577'); r(8, 8, 24, 24, '#f4f3ee'); r(13, 13, 3, 14, '#2f8577'); r(13, 13, 13, 3, '#2f8577'); r(13, 19, 10, 3, '#2f8577'); r(13, 24, 13, 3, '#2f8577'); });

/* ---------- значки статусов 9×9 ---------- */
function icon(kind) {
  const C = { yes: '#4caf6e', no: '#d9534f', thinking: '#f2c94c', away: '#5b6b8a', noanswer: '#8f949c', online: '#2f8577', renter: '#a19eae', unknown: null, me: '#e98f6f', abstain: '#9a8f78', paper: '#d8d2bf', proxy: '#7a6ab0', novote: '#55505e' }[kind];
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
    if (kind === 'abstain') { r(3, 2, 1, 5, w); r(5, 2, 1, 5, w); }                               // ⏸ воздержался
    if (kind === 'paper') { r(2, 1, 5, 7, '#f4f3ee'); r(3, 3, 3, 1, OUT); r(3, 5, 3, 1, OUT); }   // 📄 нужна бумага
    if (kind === 'proxy') { r(2, 3, 3, 3, w); r(3, 4, 1, 1, C); r(5, 4, 3, 1, w); p(6, 5, w); }    // 🔑 ждём доверенность
    if (kind === 'novote') { line(2, 2, 6, 6, w); r(1, 1, 7, 7, 'rgba(0,0,0,0)'); p(4, 1, w); p(1, 4, w); p(7, 4, w); p(4, 7, w); }   // ⛔ без голоса
  });
}
const ICONS = {}; for (const k of ['yes', 'no', 'thinking', 'away', 'noanswer', 'online', 'renter', 'me', 'abstain', 'paper', 'proxy', 'novote']) ICONS[k] = icon(k);

