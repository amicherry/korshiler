/* ===================== Викторина «Знаток ЖКХ» =====================
   Раннер в коридоре подъезда (по макету): крупный герой, трубы, лампы с конусом света, кафель с отражениями.
   Бюрократ Бумажкин растащил страницы техпаспорта. Прыжок — касание экрана или Space.
   У дверей — вопрос: верная дверь — страница и монеты; неверная — объяснение, путь удлиняется, вопрос вернётся позже.
   Вопросы — quiz.json (встроенная копия QUIZ_BUILTIN; на сайте берётся свежий файл). */

let QUIZ_DATA = null;
function quizValidQ(q) { return q && q.q && Array.isArray(q.answers) && q.answers.length >= 2 && q.answers.length <= 4 && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.answers.length; }
function quizValid(d) { return !!(d && d.tours && Object.values(d.tours).some(t => Array.isArray(t.questions) && t.questions.filter(quizValidQ).length >= 3)); }
// все вопросы (общий квиз «Знаток ЖКХ») или вопросы одного тура
function quizPool(d, tourCode) { return tourCode ? ((d.tours[tourCode] || {}).questions || []) : Object.values(d.tours).flatMap(t => t.questions); }
async function loadQuiz() {
  if (QUIZ_DATA) return QUIZ_DATA;
  let d = QUIZ_BUILTIN;
  // на GitHub Pages — свежий quiz.json: вопросы можно править без пересборки игры
  if (/^https?:$/.test(location.protocol)) {
    try { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 2500);
      const r = await fetch('quiz.json?v=' + Date.now(), { signal: ctl.signal, cache: 'no-store' }); clearTimeout(tm);
      if (r.ok) { const j = await r.json(); if (quizValid(j)) d = j; } } catch (e) {}
  }
  QUIZ_DATA = d; return d;
}
function shuffle(a, R = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// вопрос на один показ: ответы перемешаны, correct пересчитан
function prepQuestion(q) { const order = shuffle(q.answers.map((_, i) => i)); return { id: q.id, q: q.q, explain: q.explain, law: q.law, hard: q.level === 'hard', src: q, answers: order.map(i => q.answers[i]), correct: order.indexOf(q.correct) }; }

/* ---------- чиби: 16×22 + контур, большая голова, тот же образ, что у героя ---------- */
const CHIBI_CACHE = new Map();
function chibiSprite(look, frame) {
  const key = JSON.stringify(look) + '|' + frame;
  if (CHIBI_CACHE.has(key)) return CHIBI_CACHE.get(key);
  const c = makeCanvas(18, 24, (P) => {
    const R = (x, y, w, h, col) => P.r(x + 1, y + 1, w, h, col), Pt = (x, y, col) => P.p(x + 1, y + 1, col);
    const [skL, sk, skD] = tones(look.skin || '#e3ad86'), hair = tones(look.hairCol || '#2b2420'), top = tones(look.topCol || '#2f8577');
    const pants = tones(look.pants || (look.top === 'jacket' ? '#3a3d48' : '#3d5277')), skirt = look.bottom === 'skirt', shoe = '#241f1d';
    const run = frame.startsWith('run') ? +frame.slice(3) % 4 : -1, jump = frame === 'jump', trip = frame === 'trip';
    const bob = run === 1 || run === 3 ? 1 : 0, y0 = bob;
    // ноги
    const leg = (x, y, h, near) => { R(x, y, 2, h, skirt ? (near ? '#3b3742' : '#2a2730') : near ? pants[1] : pants[2]); R(x - (near ? 0 : 1), y + h, 3, 1, shoe); };
    if (jump || trip) { leg(5, 17, 2, false); leg(9, 16, 2, true); }
    else if (run === 0) { leg(4, 17 + y0, 2, false); leg(10, 17 + y0, 3, true); }
    else if (run === 2) { leg(9, 17 + y0, 2, false); leg(5, 17 + y0, 3, true); }
    else { leg(6, 17 + y0, 3, false); leg(8, 17 + y0, 3, true); }
    // корпус и руки
    const by = 12 + y0;
    R(4, by, 8, skirt ? 4 : 5, top[1]); R(4, by, 1, 5, top[2]); R(11, by, 1, 4, top[0]);
    if (skirt) R(3, by + 4, 10, 2, top[2]);
    if (look.top === 'chapan') R(4, by + 4, 8, 2, top[2]);
    const armSwing = run === 0 ? 1 : run === 2 ? -1 : 0;
    R(2, by + 1 - armSwing, 2, 3, top[2]); Pt(2, by + 4 - armSwing, skD);                         // дальняя рука
    R(12, by + 1 + armSwing, 2, 3, top[1]); Pt(13, by + 4 + armSwing, sk);                       // ближняя рука
    if (jump) { R(12, by - 1, 2, 2, top[1]); Pt(13, by - 2, sk); }
    // голова 12×11
    const hy = y0 + (trip ? 1 : 0);
    R(3, hy + 1, 11, 10, sk); R(3, hy + 1, 1, 10, skD); R(4, hy + 10, 9, 1, skD); R(12, hy + 3, 1, 5, skL);
    // волосы
    const hc = hair[1], hd = hair[2], hl = hair[0];
    if (look.hair !== 'bald') {
      R(3, hy, 11, 3, hc); R(2, hy + 1, 3, 7, hc); R(4, hy + 3, 3, 1, hd); R(8, hy + 3, 5, 1, hc); Pt(13, hy + 3, hc);
      R(5, hy, 5, 1, hl); Pt(2, hy + 8, hd);
      if (look.hair === 'long') { R(1, hy + 3, 3, 10, hc); R(1, hy + 12, 3, 1, hd); }
      if (look.hair === 'bun') { R(1, hy - 2, 4, 3, hc); Pt(2, hy - 2, hl); }
      if (look.hair === 'curly') { for (const [x, y] of [[2, hy - 1], [5, hy - 1], [8, hy - 1], [11, hy - 1], [1, hy + 4], [1, hy + 7]]) R(x, y, 2, 2, hc); }
    } else { Pt(6, hy + 1, skL); Pt(7, hy + 1, skL); }
    // шапка
    if (look.hat === 'cap') { R(3, hy - 1, 10, 3, '#b8443f'); R(11, hy + 1, 4, 1, '#8a2f2c'); }
    if (look.hat === 'tyube') { R(4, hy - 2, 8, 3, '#2a3a5a'); for (let x = 5; x < 12; x += 2) Pt(x, hy - 1, '#f2c94c'); }
    // лицо: глаза, румянец
    if (trip) { R(9, hy + 6, 2, 1, '#1a1424'); R(12, hy + 6, 1, 1, '#1a1424'); }
    else { R(9, hy + 5, 1, 2, '#1a1424'); R(12, hy + 5, 1, 2, '#1a1424'); Pt(9, hy + 5, '#5a5a6a'); }
    Pt(11, hy + 8, '#e98f8f'); Pt(10, hy + 8, skD);
    if (look.glasses) { R(8, hy + 5, 3, 1, '#1a1424'); R(11, hy + 5, 3, 1, '#1a1424'); }
    // контур: прозрачный пиксель рядом с цветным — тёмный
    const g = P.g, img = g.getImageData(0, 0, 18, 24), d = img.data, a = (x, y) => x >= 0 && y >= 0 && x < 18 && y < 24 && d[(y * 18 + x) * 4 + 3] > 0;
    const out = [];
    for (let y = 0; y < 24; y++) for (let x = 0; x < 18; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) out.push([x, y]);
    for (const [x, y] of out) P.p(x, y, '#1a1424');
  });
  CHIBI_CACHE.set(key, c); return c;
}
const BUMAZHKIN = { body: 'm', skin: '#d9a07a', hair: 'bald', hairCol: '#5a4a40', top: 'jacket', topCol: '#4a4a58', pants: '#2e2e38', bottom: 'pants', glasses: true };

/* ---------- мини-герой (по референсу): сетка 24×30, на экране ×2 ----------
   Собирается из персонажа игрока: волосы (причёска, цвет), кожа, верх (вид, цвет + полоска), низ, шапка. */
const MINI_CACHE = new Map();
function miniSprite(look, frame) {
  const key = JSON.stringify(look) + '|' + frame;
  if (MINI_CACHE.has(key)) return MINI_CACHE.get(key);
  const small = makeCanvas(26, 32, (P) => {
    const R = (x, y, w, h, c) => P.r(x + 1, y + 1, w, h, c), Pt = (x, y, c) => P.p(x + 1, y + 1, c);
    const [skL, sk, skD] = tones(look.skin || '#efc3a0'), hair = tones(look.hairCol || '#4a3a35'), top = tones(look.topCol || '#7a2a3a');
    const pants = tones(look.pants || '#24302c'), skirt = look.bottom === 'skirt', shoe = '#1a1a1e';
    const run = frame.startsWith('run') ? +frame.slice(3) % 4 : -1, jump = frame === 'jump', trip = frame === 'trip';
    const bob = run === 1 || run === 3 ? 1 : 0, by = bob + (trip ? 1 : 0);
    // ноги и обувь
    const leg = (x, y, h, sx, near) => { R(x, y, 3, h, skirt ? (near ? '#3b3742' : '#2a2730') : near ? pants[1] : pants[2]); R(x + sx, y + h, 4, 2, shoe); };
    if (jump) { leg(7, 22, 2, 0, false); leg(13, 21, 2, 1, true); }
    else if (trip) { leg(6, 23 + by, 3, -1, false); leg(14, 22 + by, 3, 1, true); }
    else if (run === 0) { leg(6, 23 + by, 2, -1, false); leg(14, 23 + by, 3, 1, true); }
    else if (run === 2) { leg(13, 23 + by, 2, 0, false); leg(7, 23 + by, 3, 0, true); }
    else { leg(8, 23 + by, 3, 0, false); leg(12, 23 + by, 3, 1, true); }
    // руки (за корпусом — дальняя)
    const sw = run === 0 ? 1 : run === 2 ? -1 : 0, ay = jump ? -3 : 0;
    R(5 - sw, 18 + by + ay, 2, 4, top[2]); Pt(5 - sw, 22 + by + ay, skD);
    // корпус: свитер с полоской
    R(7, 17 + by, 10, 6, top[1]); R(7, 17 + by, 1, 6, top[2]); R(16, 18 + by, 1, 4, top[0]);
    if (look.top === 'shirt') { R(10, 17 + by, 4, 2, '#f4f3ee'); }
    else if (look.top === 'jacket') { R(11, 17 + by, 2, 6, '#e8e4dc'); }
    else if (look.top === 'leather') { R(11, 17 + by, 1, 6, '#c9c3b0'); R(8, 19 + by, 8, 1, top[0]); }
    else if (look.top === 'chapan') { R(6, 21 + by, 12, 3, top[1]); for (let x = 7; x < 17; x += 2) Pt(x, 22 + by, '#f2c94c'); }
    else { R(7, 19 + by, 10, 2, shade(look.topCol || '#7a2a3a', 45)); R(7, 20 + by, 10, 1, shade(look.topCol || '#7a2a3a', 25)); }   // полоска, как на свитере референса
    if (skirt) { R(6, 22 + by, 12, 3, top[2]); R(6, 24 + by, 12, 1, top[3]); }
    R(17 + sw, 18 + by + ay, 2, 4, top[1]); Pt(18 + sw, 22 + by + ay, sk);                       // ближняя рука
    if (look.briefcase) { R(17 + sw, 22 + by, 6, 5, '#5a3a2a'); R(17 + sw, 22 + by, 6, 1, '#7a5a3a'); R(19 + sw, 21 + by, 2, 1, '#3a2a1a'); }
    // голова 16×14: лицо смотрит вправо, тень от волос слева
    const hy = by + (trip ? 1 : 0);
    R(4, 4 + hy, 16, 13, sk); R(5, 3 + hy, 14, 1, sk); R(5, 17 + hy, 13, 1, sk);
    R(4, 9 + hy, 6, 8, skD); R(19, 8 + hy, 1, 6, skL);
    R(8, 11 + hy, 2, 3, shade(look.skin || '#efc3a0', -40)); Pt(9, 12 + hy, skD);                  // ухо
    // глаз — один, как у референса
    if (trip) { R(14, 12 + hy, 3, 1, '#0e0e12'); } else { R(15, 10 + hy, 2, 3, '#0e0e12'); }
    if (look.glasses) { R(13, 9 + hy, 6, 5, '#0e0e12'); R(14, 10 + hy, 4, 3, '#b8c8dc'); R(16, 10 + hy, 1, 3, '#0e0e12'); Pt(14, 10 + hy, '#e8f0f8'); R(9, 10 + hy, 4, 1, '#0e0e12'); }   // очки: линза, дужка к уху
    // волосы: лохматые, с торчащими прядями
    const H1 = hair[1], H0 = hair[0], H2 = hair[2];
    if (look.hair !== 'bald') {
      R(3, 2 + hy, 18, 5, H1); R(4, 1 + hy, 15, 1, H1); R(2, 4 + hy, 8, 6, H1); R(2, 10 + hy, 3, 3, H1);   // макушка и затылок
      for (const [x, h] of [[10, 2], [12, 1], [14, 2], [16, 1], [18, 2], [20, 1]]) R(x, 7 + hy, 2, h, H1);   // чёлка зубчиками
      for (const [x, y] of [[6, -1], [10, -2], [15, -1], [20, 0], [22, 2], [1, 3], [0, 6]]) Pt(x, y + hy + 1, H1);   // торчащие пряди
      R(7, 2 + hy, 6, 1, H0); R(14, 3 + hy, 4, 1, H0); Pt(5, 4 + hy, H0); R(3, 9 + hy, 2, 2, H2);
      if (look.hair === 'long') { R(1, 6 + hy, 5, 13, H1); R(1, 18 + hy, 5, 1, H2); }
      if (look.hair === 'bun') { R(3, -2 + hy, 6, 4, H1); Pt(4, -2 + hy, H0); }
      if (look.hair === 'curly') for (const [x, y] of [[2, 0], [7, -1], [12, -1], [17, 0], [0, 5], [0, 9]]) R(x, y + hy, 3, 3, H1);
    } else { R(8, 3 + hy, 6, 1, skL); R(3, 8 + hy, 3, 6, '#8a8a90'); R(4, 7 + hy, 2, 1, '#a8a8b0'); }   // лысина, седина на висках
    if (look.hat === 'cap') { R(3, 1 + hy, 17, 5, '#b8443f'); R(17, 5 + hy, 6, 2, '#8a2f2c'); R(6, 1 + hy, 6, 1, '#d86a5f'); }
    if (look.hat === 'tyube') { R(5, 0 + hy, 13, 4, '#2a3a5a'); for (let x = 6; x < 17; x += 3) Pt(x, 2 + hy, '#f2c94c'); }
    // контур
    const g = P.g, img = g.getImageData(0, 0, 26, 32), d = img.data, a = (x, y) => x >= 0 && y >= 0 && x < 26 && y < 32 && d[(y * 26 + x) * 4 + 3] > 0, out = [];
    for (let y = 0; y < 32; y++) for (let x = 0; x < 26; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) out.push([x, y]);
    for (const [x, y] of out) P.p(x, y, '#0e0e12');
  });
  const big = makeCanvas(52, 64, ({ g }) => { g.imageSmoothingEnabled = false; g.drawImage(small, 0, 0, 52, 64); });
  MINI_CACHE.set(key, big); return big;
}
const runnerSprite = (look, frame) => miniSprite(look, frame.startsWith('run') ? 'run' + (+frame.slice(3) % 4) : frame);
const BUMAZHKIN_R = { ...BUMAZHKIN, briefcase: true, topCol: '#4a4a58', pants: '#2e2e38' };

/* ---------- коридор (как на макете): трубы, лампы, окно, панели, кафель с отражениями ---------- */
const QZ = { GY: 176, obs: {}, deco: {} };
const DW = 46, DH = 82;
function outlined(w, h, draw, col = '#14121a') {
  return makeCanvas(w, h, P => { draw(P);
    const g = P.g, img = g.getImageData(0, 0, w, h), d = img.data, a = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0, out = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) out.push([x, y]);
    for (const [x, y] of out) P.p(x, y, col); });
}
function buildQuizArt() {
  if (QZ.wall) return;
  const R = rng(91), GY = QZ.GY;
  // стена: тайл 240 px — потолок, трубы, олива сверху, бирюзовые панели снизу
  QZ.wall = makeCanvas(240, H, ({ r, p }) => {
    r(0, 0, 240, 30, '#202326'); r(0, 28, 240, 2, '#2a2e31');
    for (let y = 30; y < 106; y++) r(0, y, 240, 1, `rgb(${88 + (y - 30) * .12 | 0},${101 + (y - 30) * .1 | 0},${78 + (y - 30) * .06 | 0})`);
    // пятна и потёки — крупными мягкими формами, без шума
    for (let i = 0; i < 7; i++) { const x = R() * 240, y = 34 + R() * 60, w = 10 + R() * 26, h = 4 + R() * 10; r(x, y, w, h, 'rgba(60,70,50,.18)'); r(x + 2, y + 2, w - 4, h - 4, 'rgba(60,70,50,.12)'); }
    for (let i = 0; i < 3; i++) { let x = 20 + R() * 200, y = 32 + R() * 30; for (let k = 0; k < 18; k++) { p(x, y, 'rgba(48,56,40,.55)'); x += R() < .5 ? 1 : 0; y += 1; if (R() < .15) x -= 1; } }
    // панели
    r(0, 106, 240, 2, '#1f3a3b'); r(0, 108, 240, 1, '#4a7a76');
    for (let y = 109; y < 172; y++) r(0, y, 240, 1, `rgb(${44 - (y - 109) * .08 | 0},${86 - (y - 109) * .12 | 0},${84 - (y - 109) * .1 | 0})`);
    for (let x = 0; x < 240; x += 60) { r(x, 109, 1, 63, '#22464a'); r(x + 1, 109, 1, 63, '#3d6b68'); }
    for (let i = 0; i < 4; i++) { const x = R() * 240, y = 115 + R() * 45; r(x, y, 6 + R() * 10, 2, 'rgba(20,40,40,.25)'); }
    r(0, 168, 240, 8, '#1d2e30'); r(0, 168, 240, 1, '#2f4a4a'); r(0, 174, 240, 2, '#16231f');   // плинтус до самого пола
    // трубы под потолком: толстая и тонкая, хомуты
    r(0, 31, 240, 6, '#45525a'); r(0, 31, 240, 1, '#6c7c86'); r(0, 36, 240, 1, '#2c353b');
    r(0, 40, 240, 3, '#3a454c'); r(0, 40, 240, 1, '#5a6a74');
    for (const x of [30, 150]) { r(x, 29, 6, 10, '#33404a'); r(x, 29, 6, 1, '#55626c'); r(x + 1, 39, 4, 5, '#2c353b'); }
  });
  // окно с ночным двором, объявления, решётка вентиляции, щиток с трубой вниз
  QZ.deco.window = outlined(80, 54, ({ r, p }) => { r(0, 0, 80, 54, '#3a3f44'); r(2, 2, 76, 50, '#2b3036');
    for (let y = 4; y < 50; y++) r(4, y, 72, 1, `rgb(${22 + y * .5 | 0},${30 + y * .6 | 0},${54 + y * .7 | 0})`);
    for (let i = 0; i < 9; i++) p(6 + R() * 68, 5 + R() * 9, '#9aa8c8');
    // соседняя панелька во дворе: этажи с окнами, часть горит
    const blk = (x0, y0, w, col, lit) => { r(x0, y0, w, 50 - y0, col); r(x0, y0, w, 1, '#3c4656');
      for (let y = y0 + 3; y < 48; y += 5) for (let x = x0 + 2; x < x0 + w - 2; x += 4) r(x, y, 2, 2, R() < lit ? (R() < .3 ? '#f2d08a' : '#e8b860') : '#1c222c'); };
    blk(4, 16, 34, '#262d38', .3); blk(44, 22, 32, '#2a313c', .25);
    r(4, 44, 72, 6, '#1a1f26'); r(52, 38, 2, 8, '#1a1f26'); r(48, 34, 10, 6, '#1e252c');
    r(38, 2, 3, 50, '#3a3f44'); r(2, 26, 76, 3, '#3a3f44'); r(19, 2, 2, 50, '#3a3f44'); r(59, 2, 2, 50, '#3a3f44');
    r(3, 3, 15, 1, 'rgba(255,255,255,.08)'); r(42, 30, 16, 1, 'rgba(255,255,255,.06)');
    r(0, 52, 80, 2, '#4a5058'); r(-1, 52, 82, 1, '#5a6068'); });
  QZ.deco.notes = outlined(34, 30, ({ r }) => { r(0, 6, 12, 16, '#d8d2bf'); for (let y = 9; y < 20; y += 2) r(2, y, 8, 1, '#8a8478'); r(16, 0, 18, 28, '#e4dfcf'); r(23, 0, 4, 2, '#c9a95a');
    for (let y = 4; y < 26; y += 2) r(18, y, 13 - (y % 4), 1, '#8a8478'); r(18, 4, 8, 1, '#5a5448'); });
  QZ.deco.vent = outlined(28, 16, ({ r }) => { r(0, 0, 28, 16, '#3a3e44'); for (let x = 2; x < 26; x += 3) r(x, 2, 2, 12, '#22262a'); r(0, 0, 28, 1, '#5a5e64'); });
  QZ.deco.box = outlined(26, 70, ({ r }) => { r(17, 0, 3, 34, '#45525a'); r(17, 0, 1, 34, '#6c7c86'); r(15, 30, 7, 3, '#33404a');
    r(0, 34, 26, 34, '#2a2d32'); r(1, 35, 24, 32, '#33373d'); r(1, 35, 24, 1, '#4a4e56'); r(8, 42, 5, 6, '#e04848'); r(9, 43, 2, 2, '#ff8a7a'); r(20, 50, 2, 8, '#1e2024'); });
  QZ.deco.switch = outlined(8, 10, ({ r }) => { r(0, 0, 8, 10, '#c9c3b0'); r(2, 2, 4, 6, '#a8a290'); r(3, 3, 2, 2, '#f4f3ee'); });
  QZ.lamp = outlined(24, 14, ({ r }) => { r(10, 0, 2, 5, '#1a1d1f'); r(4, 5, 14, 5, '#2a2e33'); r(2, 9, 18, 2, '#3a3f46'); r(3, 9, 16, 1, '#4a5058'); r(7, 11, 8, 2, '#fff1c4'); });
  QZ.cone = makeCanvas(160, GY - 52, ({ g }) => { const h = GY - 52;
    for (let y = 0; y < h; y++) { const k = y / h, w = 14 + k * 120, a = .16 * (1 - k * .65); g.fillStyle = `rgba(255,226,160,${a.toFixed(3)})`; g.fillRect(80 - w / 2, y, w, 1); } });
  QZ.pool = makeCanvas(160, 30, ({ g }) => { const gr = g.createRadialGradient(80, 6, 4, 80, 6, 80); gr.addColorStop(0, 'rgba(255,226,160,.28)'); gr.addColorStop(1, 'rgba(255,226,160,0)'); g.fillStyle = gr; g.save(); g.scale(1, .3); g.fillRect(0, 0, 160, 100); g.restore(); });
  QZ.streak = makeCanvas(16, 40, ({ g }) => { for (let y = 0; y < 40; y++) { const a = .16 * (1 - y / 40); for (let x = 0; x < 16; x++) { const k = 1 - Math.abs(x - 7.5) / 8; g.fillStyle = `rgba(255,226,160,${(a * k).toFixed(3)})`; g.fillRect(x, y, 1, 1); } } });
  QZ.glow = makeCanvas(90, 60, ({ g }) => { const gr = g.createRadialGradient(45, 10, 2, 45, 20, 50); gr.addColorStop(0, 'rgba(255,226,160,.35)'); gr.addColorStop(1, 'rgba(255,226,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, 90, 60); });
  // двери: тёмный металл с филёнками, наличник
  QZ.door = outlined(DW, DH, ({ r }) => { r(0, 0, DW, DH, '#2a2d32'); r(3, 3, DW - 6, DH - 3, '#3d4148'); r(3, 3, DW - 6, 1, '#55595f'); r(3, 3, 1, DH - 3, '#4a4e55'); r(DW - 4, 3, 1, DH - 3, '#2c2f34');
    r(8, 9, DW - 16, 28, '#363a41'); r(8, 9, DW - 16, 1, '#2a2d32'); r(8, 44, DW - 16, 30, '#363a41'); r(8, 44, DW - 16, 1, '#2a2d32'); r(8, 36, DW - 16, 1, '#4a4e55');
    r(DW - 11, 40, 4, 11, '#8a8e96'); r(DW - 11, 40, 4, 1, '#b8bcc4'); r((DW >> 1) - 6, 16, 12, 4, '#b8b2a0'); r((DW >> 1) - 1, 24, 3, 3, '#1e2024'); });
  QZ.goalDoor = outlined(DW, DH, ({ r }) => { r(0, 0, DW, DH, '#1f3a34'); r(3, 3, DW - 6, DH - 3, '#2e6a5a'); r(3, 3, DW - 6, 1, '#4a8a78'); r(8, 9, DW - 16, 28, '#357a68'); r(8, 44, DW - 16, 30, '#357a68'); r(DW - 11, 40, 4, 11, '#c9a95a'); });
  // преграды крупнее — под рост героя
  QZ.obs.boxes = outlined(30, 26, ({ r }) => { const box = (x, y, w, h) => { r(x, y, w, h, '#9a7048'); r(x, y, w, 1, '#c09468'); r(x, y, 1, h, '#b0845a'); r(x + w - 1, y, 1, h, '#7a5434'); r(x + (w >> 1) - 1, y, 2, 4, '#7a5434'); };
    box(0, 10, 10, 16); box(20, 12, 10, 14); box(7, 0, 16, 26); r(11, 9, 8, 5, '#d8d2bf'); });
  QZ.obs.bucket = outlined(20, 30, ({ r }) => { r(13, 0, 2, 16, '#8a6a4a'); r(10, 1, 7, 2, '#6a5a4a');
    r(2, 15, 15, 14, '#5f6b74'); r(2, 15, 15, 1, '#8a98a2'); r(3, 16, 2, 12, '#7a8892'); r(15, 16, 1, 12, '#4a545c'); r(3, 18, 12, 3, '#4a6a8a'); r(1, 14, 17, 1, '#3e464c');
    r(9, 12, 8, 4, '#c9c3b0'); r(2, 28, 15, 1, '#3e464c'); });
  QZ.obs.wet = outlined(20, 32, ({ r, p }) => { r(5, 0, 10, 1, '#e8b830'); r(3, 1, 14, 24, '#f2c94c'); r(3, 1, 2, 24, '#fbe39a'); r(16, 1, 1, 24, '#c09a2a');
    r(9, 6, 3, 9, '#14121a'); r(9, 17, 3, 3, '#14121a'); r(2, 25, 4, 7, '#b08a1e'); r(14, 25, 4, 7, '#b08a1e'); });
  const rat = k => outlined(22, 12, ({ r, p }) => { r(5, 3, 12, 7, '#5b5f66'); r(6, 3, 10, 1, '#7a7e86'); r(16, 4, 4, 4, '#6b6f76'); p(19, 6, '#e98f8f'); r(17, 4, 1, 1, '#14121a'); r(13, 1, 3, 3, '#8a8e96');
    r(0, k ? 6 : 7, 6, 1, '#8a6a6a'); r(7, 10, 2, 2, '#3a3e46'); r(k ? 12 : 13, 10, 2, 2, '#3a3e46'); });
  QZ.obs.rat0 = rat(0); QZ.obs.rat1 = rat(1);
  QZ.page = outlined(10, 12, ({ r }) => { r(1, 1, 8, 10, '#f4f3ee'); r(6, 1, 3, 3, '#c9c3b0'); for (let y = 4; y < 10; y += 2) r(2, y, 5, 1, '#8a8478'); });
  QZ.folder = outlined(20, 15, ({ r }) => { r(1, 3, 18, 11, '#3f6f8c'); r(1, 1, 8, 3, '#3f6f8c'); r(1, 3, 18, 1, '#6a9ab8'); r(3, 6, 14, 1, '#f4f3ee'); r(3, 8, 10, 1, '#c9d6e6'); });
  // передний план: силуэты перил и труб (параллакс), виньетка
  // силуэт перил у самой камеры: рисуется в 4 смещения с низкой прозрачностью — мягкий, «размытый» край
  const rail = makeCanvas(90, 34, ({ g }) => { g.fillStyle = '#0c0e12'; const R2 = (x, y, w, h) => g.fillRect(x, y, w, h);
    R2(6, 6, 6, 28); R2(0, 6, 60, 5); R2(44, 6, 6, 28); R2(0, 20, 90, 4); R2(70, 14, 20, 20); g.beginPath(); g.arc(70, 24, 10, Math.PI, 1.5 * Math.PI); g.lineTo(70, 14); g.fill(); });
  QZ.fg = makeCanvas(700, 40, ({ g }) => { for (const [dx, dy, a] of [[0, 0, .55], [-1, 0, .2], [1, 1, .2], [0, -1, .2]]) { g.globalAlpha = a; g.drawImage(rail, dx, 6 + dy); g.save(); g.translate(700, 0); g.scale(-1, 1); g.drawImage(rail, dx, 10 + dy); g.restore(); } });
  QZ.vig = makeCanvas(W, H, ({ g }) => { const gr = g.createRadialGradient(W / 2, H * .55, 60, W / 2, H * .55, 260); gr.addColorStop(0, 'rgba(8,10,14,0)'); gr.addColorStop(1, 'rgba(8,10,14,.62)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const t = g.createLinearGradient(0, 20, 0, 44); t.addColorStop(0, 'rgba(20,22,26,.7)'); t.addColorStop(1, 'rgba(20,22,26,0)'); g.fillStyle = t; g.fillRect(0, 20, W, 24);
    const b = g.createLinearGradient(0, 200, 0, H); b.addColorStop(0, 'rgba(14,16,20,0)'); b.addColorStop(1, 'rgba(14,16,20,.8)'); g.fillStyle = b; g.fillRect(0, 200, W, 25); });
}
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ---------- сцена ---------- */
const QZ_SPEED = .13, QZ_JUMP = -.42, QZ_G = .0012;
scenes.quiz = {
  async enter(data = {}) {
    buildQuizArt(); setTouch({ act: L(UI.qzJump) });
    this.state = 'loading'; this.t = 0; this.coins = 0; this.trips = 0; this.first = 0; this.second = 0; this.hardFirst = 0; this.done = 0; this.wrong = 0; this.paused = false; this.result = null; this.dust = [];
    this.look = Object.assign({}, DEFAULT_LOOK, SAVE.look || {});
    // квиз перед туром (5 вопросов тура, минимум один расчётный) или общий «Знаток ЖКХ» (все вопросы)
    this.tourId = data.tour || null; this.then = data.then || null;
    const T = this.tourId ? TOURS[this.tourId] : null, code = T ? T.code : null;
    const d = await loadQuiz(); this.cfg = d;
    const all = shuffle(quizPool(d, code).filter(quizValidQ)), per = code ? ((d.tours[code] || {}).questionsPerRun || 5) : (d.generalPerRun || 8);
    const n = Math.min(per, all.length), hard = all.find(q => q.level === 'hard');
    let pick = all.slice(0, n); if (hard && !pick.includes(hard)) pick[n - 1] = hard;
    this.total = n; this.hardN = pick.filter(q => q.level === 'hard').length; this.queue = shuffle(pick).map(prepQuestion);
    // трасса: [бег, двери] × n, затем бег и финиш
    this.segs = []; let x = 60;
    for (const q of this.queue) { x = this.addRun(x, 380 + Math.random() * 80, 2); x = this.addDoors(x, q); }
    x = this.addRun(x, 240, 1); this.segs.push({ type: 'goal', x0: x, len: 260 });
    this.hx = 30; this.jy = 0; this.vy = 0; this.trip = 0; this.buffer = 0; this.cam = 0; this.cur = null; this.pick = -1; this.fb = null; this.bRun = 0; this.bx = 0;
    this.startedAt = Date.now(); this.state = 'intro';
  },
  addRun(x, len, nObs) {
    const obs = [], slot = len / (nObs + 1);
    for (let i = 1; i <= nObs; i++) obs.push({ x: x + Math.round(slot * i + (Math.random() - .5) * slot * .3), kind: pick(Math.random, ['boxes', 'bucket', 'wet', 'rat']), hit: false, mx: 0 });
    this.segs.push({ type: 'run', x0: x, len, obs }); return x + len;
  },
  doorLen(n) { return 70 + (n - 1) * 92 + 90; },
  addDoors(x, q) {
    const n = q.answers.length; this.segs.push({ type: 'door', x0: x, len: this.doorLen(n), q, doors: q.answers.map((_, i) => x + 70 + i * 92), open: -1, ok: 0 });
    return x + this.doorLen(n);
  },
  relayout(fromIdx) { let x = this.segs[fromIdx].x0 + this.segs[fromIdx].len;
    for (let i = fromIdx + 1; i < this.segs.length; i++) { const s = this.segs[i], dx = x - s.x0; s.x0 = x;
      if (s.obs) for (const o of s.obs) o.x += dx; if (s.doors) s.doors = s.doors.map(v => v + dx); x += s.len; } },
  totalLen() { const g = this.segs[this.segs.length - 1]; return g.x0 + 120; },
  focus() { return { x: this.hx - this.cam + 20, y: QZ.GY - 30 }; },
  jump() {
    if (this.state !== 'run' || this.trip > 0) return;
    if (this.jy < 0) { if (this.jy > -16 && this.vy > 0) this.buffer = 170; return; }
    this.vy = QZ_JUMP; beep(520, .05, 'square', .03);
  },
  update(dt) {
    if (this.state === 'loading') return;
    this.t += dt;
    if (hit('back') && !['end', 'intro'].includes(this.state)) this.paused = !this.paused;
    if (this.paused) return;
    if (this.state === 'intro') { if (hit('act')) this.state = 'run'; return; }
    if (this.state === 'run') {
      if (hit('act') || hit('up')) this.jump();
      const c = clicks.find(c => c.y > 22); if (c) { clicks.splice(clicks.indexOf(c), 1); this.jump(); }
    }
    if (this.jy < 0 || this.vy < 0) { this.vy += QZ_G * dt; this.jy = Math.min(0, this.jy + this.vy * dt);
      if (this.jy === 0) { this.vy = 0; this.puff(4); if (this.buffer > 0) { this.buffer = 0; this.vy = QZ_JUMP; } } }
    this.buffer = Math.max(0, this.buffer - dt); this.trip = Math.max(0, this.trip - dt);
    if (this.state === 'run' && this.trip === 0) {
      const nx = this.hx + QZ_SPEED * dt;
      const ds = this.segs.find(s => s.type === 'door' && s.open < 0 && !s.done && nx >= s.x0 + 10 && this.hx < s.x0 + 11);
      if (ds) { this.hx = ds.x0 + 10; this.cur = ds; this.state = 'ask'; this.pick = -1; setTouch({}); beep(660, .06, 'sine', .04); }
      else this.hx = nx;
      if (this.jy === 0 && (this.t / 130 | 0) !== this.lastPuff) { this.lastPuff = this.t / 130 | 0; this.puff(1); }
      for (const s of this.segs) if (s.obs) for (const o of s.obs) {
        if (o.kind === 'rat' && !o.hit && o.x + o.mx - this.hx < 220 && o.mx > -50) o.mx -= .03 * dt;
        const img = QZ.obs[o.kind === 'rat' ? 'rat0' : o.kind], ox = o.x + o.mx;
        if (o.hit || this.hx + 35 < ox + 5 || this.hx + 16 > ox + img.width - 5) continue;
        if (-this.jy < img.height - 6) { o.hit = true; this.trip = 480; this.trips = (this.trips || 0) + 1; this.coins = Math.max(0, this.coins - 1000); pop(this.hx + 10, QZ.GY - 70, '−1 000 ₸', '#e88a7a'); beep(180, .12, 'sawtooth', .05); }
      }
      const g = this.segs[this.segs.length - 1];
      if (this.hx > g.x0 + 60 && !this.bRun) { this.bRun = 1; beep(330, .1, 'square', .04); }
      if (this.hx >= g.x0 + 120) { this.hx = g.x0 + 120; this.finishRun(); }
    }
    if (this.bRun) this.bx += .2 * dt;
    if (this.state === 'go') { const tx = this.cur.doors[this.pick] - 26; this.hx = Math.min(tx, this.hx + QZ_SPEED * 1.3 * dt);
      if (this.hx >= tx) { this.state = 'enter'; this.cur.open = this.pick; this.et = 0; beep(300, .08, 'square', .04); } }
    if (this.state === 'enter') { this.et += dt; this.cur.ok = Math.min(1, this.et / 300); if (this.et > 720 && !this.fb) this.answer(); }
    for (const d of this.dust) { d.t += dt; d.x -= .02 * dt; d.y -= .012 * dt; } this.dust = this.dust.filter(d => d.t < 450);
    this.cam = clamp(this.hx - 120, 0, Math.max(0, this.totalLen() - W));
  },
  puff(n) { for (let i = 0; i < n; i++) this.dust.push({ x: this.hx + 14 + Math.random() * 6, y: QZ.GY - 2 - Math.random() * 3, t: 0, s: 2 + Math.random() * 3 }); },
  choose(i) { if (this.state !== 'ask') return; this.pick = i; this.state = 'go'; },
  answer() {
    const s = this.cur, q = s.q, ok = this.pick === q.correct; q.tries = (q.tries || 0) + 1;
    const right = 'ABCD'[q.correct] + ' — ' + L(q.answers[q.correct]);
    if (ok) { const c = q.tries === 1 ? (q.hard ? 50000 : 20000) : 5000; this.coins += c; this.done++; if (q.tries === 1) { this.first++; if (q.hard) this.hardFirst++; } else this.second++;
      this.fb = { ok: true, text: L(UI.qzRight).replace('{c}', money(c)).replace('{n}', this.done).replace('{t}', this.total) + (q.explain ? ' ' + L(q.explain) : ''), law: q.law }; sfx.stamp && sfx.stamp(); }
    else { this.wrong++;
      this.fb = { ok: false, text: L(UI.qzWrong).replace('{a}', right) + (q.explain ? ' ' + L(q.explain) : ''), law: q.law }; beep(160, .2, 'sawtooth', .05); }
    this.state = 'feedback'; setTouch({ act: L(UI.next) });
  },
  next() {
    if (this.state !== 'feedback') return;
    const s = this.cur, idx = this.segs.indexOf(s), ok = this.fb.ok; s.done = true; this.state = 'trans';
    irisTo(this.hx - this.cam + 20, QZ.GY - 30, () => {
      if (!ok) {
        // путь удлиняется: лишний участок с тремя преградами, вопрос (ответы заново перемешаны) — перед финишем
        const extra = { type: 'run', x0: 0, len: 480, obs: [] }; this.segs.splice(idx + 1, 0, extra);
        const goal = this.segs.pop(), q2 = prepQuestion(s.q.src); q2.tries = s.q.tries;
        const runB = { type: 'run', x0: 0, len: 380, obs: [] }, dn = { type: 'door', x0: 0, len: this.doorLen(q2.answers.length), q: q2, doors: [], open: -1, ok: 0 };
        this.segs.push(runB, dn, goal); this.relayout(idx);
        const fill = (seg, n) => { const slot = seg.len / (n + 1); seg.obs = []; for (let i = 1; i <= n; i++) seg.obs.push({ x: seg.x0 + Math.round(slot * i), kind: pick(Math.random, ['boxes', 'bucket', 'wet', 'rat']), hit: false, mx: 0 }); };
        fill(extra, 3); fill(runB, 2); dn.doors = q2.answers.map((_, i) => dn.x0 + 70 + i * 92);
      } else this.relayout(idx);
      this.hx = s.x0 + s.len + 4; this.jy = 0; this.vy = 0; this.cur = null; this.pick = -1; this.fb = null;
      this.cam = clamp(this.hx - 120, 0, Math.max(0, this.totalLen() - W));
      irisFrom(this.hx - this.cam + 20, QZ.GY - 30); this.state = 'run'; setTouch({ act: L(UI.qzJump) });
    });
  },
  async finishRun() {
    if (this.state === 'end') return; this.state = 'end'; setTouch({});
    const sec = Math.round((Date.now() - this.startedAt) / 1000), ratio = this.total ? this.first / this.total : 0, title = ratio >= (this.cfg.titleThreshold ?? .8);
    let res = { coins: this.coins, badge: title ? 'zhkh_expert' : null, offline: true };
    try { res = await API.quizFinish({ tourId: this.tourId, firstTry: this.first, second: this.second, hardFirst: this.hardFirst, total: this.total, wrong: this.wrong, trips: this.trips || 0, seconds: sec }); HOUSE_STATE = await API.house(); SAVE.coins = HOUSE_STATE.coins; } catch (e) {}
    // ≥ 80 % верных с первой попытки в квизе тура — +1 «дожатие» у Енота в этом туре
    if (this.tourId && ratio >= .8) { SAVE.quizBonus = SAVE.quizBonus || {}; SAVE.quizBonus[this.tourId] = true; }
    if (this.tourId) { SAVE.quizDone = SAVE.quizDone || {}; SAVE.quizDone[this.tourId] = Math.max(SAVE.quizDone[this.tourId] || 0, Math.round(ratio * 100)); }
    persist();
    this.result = { ...res, first: this.first, total: this.total, trips: this.trips || 0, title: !!res.badge, bonus: this.tourId && ratio >= .8, sec };
    try { notifyApp('result', { version: 1, game: 'korshiler', token: LAUNCH.token, runId: 'quiz-' + this.startedAt, tour: null, tourCode: 'quiz', success: true,
      quiz: { firstTry: this.first, total: this.total, wrong: this.wrong }, coins: res.coins, badges: res.badge ? [res.badge] : [], startedAt: new Date(this.startedAt).toISOString(),
      finishedAt: new Date().toISOString(), lang: LANG, clientVersion: CLIENT_VERSION }); } catch (e) {}
  },
  drawWorld(dt = 16) {
    const cx = Math.round(this.cam), GY = QZ.GY, t = this.t;
    for (let x = -(cx % 240); x < W; x += 240) ctx.drawImage(QZ.wall, x, 0);
    // декор по модулям 240 px: окно / объявления / щиток — по хешу номера модуля
    const m0 = Math.floor(cx / 240) - 1;
    for (let m = m0; m < m0 + 4; m++) { const h = hash(m), x = m * 240 - cx;
      if (h < .4) sprite(QZ.deco.window, x + 20, 52); else if (h < .7) { sprite(QZ.deco.notes, x + 30, 64); sprite(QZ.deco.vent, x + 6, 50); } else sprite(QZ.deco.box, x + 150, 40);
      if (hash(m + 50) < .5) sprite(QZ.deco.switch, x + 214, 90); }
    // лампы: конус света на стену и пятно на полу
    for (let m = m0; m < m0 + 4; m++) { const x = m * 240 + 120 - cx, flick = hash(m + 9) < .2 && Math.sin(t / 70 + m) > .6;
      if (!flick) { ctx.drawImage(QZ.cone, x - 80, 52); }
      sprite(QZ.lamp, x - 12, 42); if (!flick) ctx.drawImage(QZ.glow, x - 45, 46); }
    // пол: кафель в перспективе, блики от ламп
    for (let y = GY; y < H; y++) { const k = (y - GY) / (H - GY); rect(0, y, W, 1, `rgb(${70 - k * 22 | 0},${82 - k * 26 | 0},${76 - k * 24 | 0})`); }
    for (const yy of [3, 8, 15, 25, 39]) rect(0, GY + yy, W, 1, 'rgba(40,50,46,.6)');
    const vx = W / 2; for (let wx = Math.floor(cx / 36) * 36 - 36; wx < cx + W + 72; wx += 36) { const sx = wx - cx, bx = vx + (sx - vx) * 1.9;
      ctx.strokeStyle = 'rgba(40,50,46,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx + .5, GY); ctx.lineTo(bx + .5, H); ctx.stroke(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let m = m0; m < m0 + 4; m++) { const x = m * 240 + 120 - cx; ctx.globalAlpha = .7; ctx.drawImage(QZ.pool, x - 80, GY + 1); ctx.globalAlpha = 1; ctx.drawImage(QZ.streak, x - 8, GY + 2); }
    ctx.restore();
    rect(0, GY, W, 1, '#5e6c66');
  },
  draw(dt) {
    if (this.state === 'loading') { rect(0, 0, W, H, '#0b0c10'); return; }
    const cx = Math.round(this.cam), GY = QZ.GY, t = this.t;
    this.drawWorld(dt);
    // двери-ответы с табличками и лампой над дверью; выбранная открывается
    for (const s of this.segs) {
      if (s.type === 'door') s.doors.forEach((dx, i) => { const x = dx - cx; if (x < -40 || x > W + 40) return;
        const lit = s === this.cur && (this.state === 'ask' || this.pick === i);
        if (s.open === i) { const k = s.ok;
          const hw = (DW >> 1) - 3, ih = DH - 3;
          rect(x - hw, GY - ih, hw * 2, ih, '#2a2018'); ctx.fillStyle = 'rgba(242,198,106,.55)'; ctx.fillRect(x - hw, GY - ih, hw * 2, ih);
          rect(x - hw + 5, GY - ih + 10, 4, 22, '#5a3a2a'); rect(x - hw + 4, GY - ih + 9, 6, 1, '#3a2a1a');
          const dw = Math.max(5, Math.round(hw * 2 * (1 - k)));
          rect(x - hw - 3, GY - DH, DW, 3, '#2a2d32'); rect(x - hw - 3, GY - DH, 3, DH, '#2a2d32'); rect(x + hw, GY - DH, 3, DH, '#2a2d32');
          rect(x + hw - dw, GY - ih, dw, ih, '#3d4148'); rect(x + hw - dw, GY - ih, 1, ih, '#14121a');
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(242,198,106,${(.07 * k).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(x - hw, GY); ctx.lineTo(x + hw, GY); ctx.lineTo(x + hw + 18, GY + 30); ctx.lineTo(x - hw - 18, GY + 30); ctx.fill(); ctx.restore();
        } else sprite(QZ.door, x - (DW >> 1), GY - DH);
        rect(x - 10, GY - DH - 16, 20, 13, '#14121a'); rect(x - 9, GY - DH - 15, 18, 11, lit ? '#f2c94c' : '#c9c3b0'); rect(x - 9, GY - DH - 15, 18, 1, lit ? '#fbe39a' : '#e4dfcf');
        text('ABCD'[i], x, GY - DH - 13, { align: 'center', col: '#14121a' });
        rect(x - (DW >> 1) + 2, GY + 1, DW - 4, 2, 'rgba(242,210,122,.2)'); });
      if (s.type === 'goal') { const x = s.x0 + 140 - cx; if (x > -60 && x < W + 60) {
        sprite(QZ.goalDoor, x - (DW >> 1), GY - DH); rect(x - 12, GY - DH - 14, 24, 10, '#f4f3ee'); text('ОСИ', x, GY - DH - 13, { align: 'center', col: '#2e6a5a', size: 6 });
        if (!this.bRun) { sprite(runnerSprite(BUMAZHKIN_R, 'idle'), x - 64, GY - 62, true); sprite(QZ.folder, x - 70, GY - 30); }
        else { sprite(runnerSprite(BUMAZHKIN_R, 'run' + ((t / 70 | 0) % 4)), x - 64 + this.bx, GY - 62); sprite(QZ.folder, x - 70, GY - 15); } } }
      if (s.obs) for (const o of s.obs) { const img = o.kind === 'rat' ? QZ.obs[(t / 110 | 0) % 2 ? 'rat0' : 'rat1'] : QZ.obs[o.kind], sx = o.x + o.mx - cx;
        if (sx > -40 && sx < W + 40) { sprite(img, sx, GY - img.height + 1, o.kind === 'rat', o.hit ? .45 : 1);
          ctx.save(); ctx.globalAlpha = .14; ctx.translate(Math.round(sx), GY + img.height); ctx.scale(1, -1); if (o.kind === 'rat') { ctx.translate(img.width, 0); ctx.scale(-1, 1); } ctx.drawImage(img, 0, 0); ctx.restore(); } }
    }
    drawPops(dt, cx, 0);   // «−1 000 ₸» над героем, когда споткнулся
    // герой: отражение в полу, полосы скорости, пыль
    const fr = this.trip > 0 ? 'trip' : this.jy < 0 ? 'jump' : ['run', 'go'].includes(this.state) ? 'run' + ((t / 90 | 0) % 4) : 'idle';
    const alpha = this.state === 'enter' ? clamp(1 - (this.et - 300) / 320, 0, 1) : ['feedback', 'trans'].includes(this.state) ? 0 : this.trip > 0 && (t / 80 | 0) % 2 ? .5 : 1;
    const hsx = Math.round(this.hx - cx), hy = GY - 62 + Math.round(this.jy), img = runnerSprite(this.look, fr);
    if (alpha > 0) {
      ctx.save(); ctx.globalAlpha = .16 * alpha; ctx.translate(hsx, GY * 2 - hy); ctx.scale(1, -1); ctx.drawImage(img, 0, 0); ctx.restore();
      rect(hsx + 12, GY - 1, 28, 2, `rgba(0,0,0,${(.35 * (1 + this.jy / 80)).toFixed(2)})`);
      for (const d of this.dust) { const a = 1 - d.t / 450; ctx.fillStyle = `rgba(190,186,176,${(a * .6).toFixed(2)})`; ctx.fillRect(Math.round(d.x - cx), Math.round(d.y), Math.round(d.s * (1 + d.t / 300)), Math.round(d.s * (1 + d.t / 300))); }
      if (['run', 'go'].includes(this.state) && this.trip === 0) for (let i = 0; i < 3; i++) { const yy = hy + 34 + i * 7, len = 10 + ((t / 60 + i * 3) % 6); rect(hsx - len - 2 + (i === 1 ? -4 : 0), yy, len, 1, 'rgba(230,234,240,.45)'); }
      sprite(img, hsx, hy, false, alpha);
    }
    // передний план с параллаксом и виньетка
    const fx = -((cx * 1.6) % 1100);
    for (let x = fx; x < W; x += 1100) ctx.drawImage(QZ.fg, x, H - 34);
    ctx.drawImage(QZ.vig, 0, 0);
    // HUD
    rect(0, 0, W, 20, 'rgba(14,16,20,.88)');
    if (button('II', 0, 2, 'dark', { left: 2, w: 16 })) this.paused = true;
    for (let i = 0; i < this.total; i++) sprite(QZ.page, 24 + i * 11, 4, false, i < this.done ? 1 : .22);
    text(money(this.coins), 24 + this.total * 11 + 6, 6, { col: '#f2c94c', size: 6 });
    const prog = clamp(this.hx / this.totalLen(), 0, 1), bx = 250, bw = 140;
    text(L(UI.qzPath), bx - 4, 6, { col: '#9fb0cc', size: 6, align: 'right' });
    rect(bx, 8, bw, 4, '#2b2a33'); rect(bx, 8, Math.round(bw * prog), 4, '#7fc4a8'); rect(bx + bw - 2, 5, 4, 10, '#2e6a5a');
    if (['ask', 'go', 'enter'].includes(this.state) && this.cur) this.drawCard(this.cur.q);
    if (this.state === 'feedback') this.drawFeedback();
    if (this.state === 'intro') this.drawIntro();
    if (this.state === 'end' && this.result) this.drawEnd();
    if (this.paused) this.drawPause();
  },
  drawCard(q) {
    // длинный ответ переносится на 2 строки (казахский длиннее); если и так не влезает — мельче шрифт
    const lines = wrapText(L(q.q), 364, 8).slice(0, 3);
    const rows = q.answers.map(a => { const sz = 8, ls = wrapText(L(a), 344, 8).slice(0, 3); return { sz, ls, h: Math.max(13, ls.length * 10 + 4) }; });   // всегда один шрифт, длинный ответ — в 2–3 строки
    const h = 12 + lines.length * 11 + rows.reduce((m, r) => m + r.h + 2, 0) + 4;
    frameBox(8, 24, 384, h, .95);
    lines.forEach((l, i) => text(l, 18, 30 + i * 11, { col: '#f4f3ee' }));
    let y = 30 + lines.length * 11 + 3;
    rows.forEach((R, i) => { const sel = this.pick === i;
      rect(16, y, 368, R.h, sel ? '#3a4a3a' : '#1d2130'); rect(18, y + 2, 11, 9, sel ? '#f2c94c' : '#d8d2bf'); text('ABCD'[i], 23.5, y + 3, { col: '#1a1424', align: 'center', size: 6 });
      R.ls.forEach((l, k) => text(l, 34, y + 2 + k * (R.sz === 8 ? 10 : 8) + (R.sz === 8 ? 0 : 1), { col: sel ? '#f2c94c' : '#cfd6e4', size: R.sz }));
      if (this.state === 'ask' && clickIn(16, y, 368, R.h)) this.choose(i);
      y += R.h + 2; });
    if (this.state === 'ask') {
      const c = clicks.find(c => c.y > 24 + h); if (c) { const wx = c.x + this.cam, i = this.cur.doors.findIndex(d => Math.abs(d - wx) < 27); if (i >= 0) { clicks.splice(clicks.indexOf(c), 1); this.choose(i); } }
      const n = q.answers.length; if (hit('up') || hit('left')) this.pick = (this.pick + n - 1) % n; if (hit('down') || hit('right')) this.pick = (this.pick + 1) % n; if (hit('act') && this.pick >= 0) this.choose(this.pick);
    }
  },
  drawFeedback() {
    const f = this.fb, lines = wrapText(f.text, 340, 6).slice(0, 9), law = f.law && f.law.ref ? wrapText('§ ' + L(f.law.ref), 300, 6).slice(0, 2) : [];
    const h = 34 + lines.length * 9 + (f.ok ? 0 : 11) + law.length * 9 + (law.length ? 6 : 0) + 24;
    frameBox(24, 30, 352, h, .96);
    text(f.ok ? L(UI.qzOk) : L(UI.qzNo), W / 2, 38, { align: 'center', col: f.ok ? '#7fe08a' : '#e98f6f' });
    if (f.ok) sprite(QZ.page, W / 2 - 5, 49);
    lines.forEach((l, i) => text(l, W / 2, 62 + i * 9, { align: 'center', col: '#f4f3ee', size: 6 }));
    let y = 62 + lines.length * 9 + 1;
    if (!f.ok) { text(L(UI.qzLonger), W / 2, y, { align: 'center', col: '#f2c94c', size: 6 }); y += 11; }
    // статья закона — ссылка на adilet.zan.kz на языке игры
    if (law.length) { law.forEach((l, i) => text(l, W / 2, y + 2 + i * 9, { align: 'center', col: '#9fd9c2', size: 6 }));
      y += law.length * 9 + 6; }
    if (button(L(UI.next), W / 2, 30 + h - 20, 'primary') || hit('act')) this.next();
  },
  drawIntro() {
    rect(0, 0, W, H, 'rgba(10,12,20,.55)'); frameBox(40, 34, 320, 150, .96);
    rect(52, 50, 78, 108, '#1a1e26'); rect(52, 150, 78, 8, '#2a2e36');
    sprite(runnerSprite(BUMAZHKIN_R, 'idle'), 66, 90, true);
    for (let i = 0; i < 5; i++) { const a = this.t / 700 + i * 1.26; sprite(QZ.page, 86 + Math.round(Math.cos(a) * 28), 78 + Math.round(Math.sin(a) * 16)); }
    text(L(UI.qzTitle), 245, 44, { align: 'center', col: '#f2c94c' });
    wrapText(L(UI.qzIntro).replace('{n}', this.total), 210, 6).slice(0, 10).forEach((l, i) => text(l, 140, 60 + i * 9, { col: '#f4f3ee', size: 6 }));
    if (button(L(UI.qzGo), W / 2, 162, 'primary')) this.state = 'run';
  },
  drawEnd() {
    const r = this.result;
    rect(0, 0, W, H, 'rgba(10,12,20,.55)'); paper(70, 24, 260, 178, 7);
    text(L(UI.qzDone), W / 2, 34, { align: 'center', col: '#2e6a5a' });
    const rows = [[L(UI.qzFirst), `${r.first}/${r.total}`], [L(UI.qzWrongN), String(this.wrong)], ...(r.trips ? [[L(UI.qzTrips), `${r.trips} × −1 000 ₸`]] : []), [L(UI.rBudget), '+' + money(r.coins ?? 0)]];
    rows.forEach(([a, b], i) => { text(a, 86, 54 + i * 13, { col: INK }); text(b, 314, 54 + i * 13, { col: INK, align: 'right' }); rect(86, 63 + i * 13, 228, 1, '#e2d9c2'); });
    let ny = 58 + rows.length * 13; if (r.paidBefore) { text(L(UI.qzPaidBefore), W / 2, ny, { align: 'center', col: INK_MUTED, size: 6 }); ny += 10; }
    const note = this.tourId ? (TOURS[this.tourId].n < 2 ? '' : r.bonus ? L(UI.qzBonus) : L(UI.qzNoBonus)) : r.title ? L(UI.qzTitleGot) : L(UI.qzTitleNeed);
    wrapText(note, 220, 6).slice(0, 3).forEach((l, i) => text(l, W / 2, ny + i * 9, { align: 'center', col: r.title ? INK_TEAL : INK, size: 6 }));
    { const nl = note ? wrapText(note, 220, 6).slice(0, 3).length : 0, j = QUIZ_JOKES[(this.startedAt >> 3) % QUIZ_JOKES.length];   // шутка в конце
      wrapText(L(j), 220, 6).slice(0, 2).forEach((l, i) => text(l, W / 2, ny + nl * 9 + 6 + i * 9, { align: 'center', col: '#8a6a3a', size: 6 })); }
    if (r.title) { ctx.save(); ctx.translate(W / 2, 138); ctx.rotate(-.08); ctx.strokeStyle = '#2e6a5a'; ctx.lineWidth = 2; ctx.strokeRect(-62, -10, 124, 20); text(L(TITLES.zhkh_expert).toUpperCase(), 0, -4, { col: '#2e6a5a', align: 'center' }); ctx.restore(); }
    if (button(L(UI.again), W / 2 - 66, 176, 'alt')) irisTo(W / 2, 120, () => go('quiz', { tour: this.tourId, then: this.then }));
    if (this.then) { if (button(L(UI.toMeeting), W / 2 + 66, 176, 'primary')) irisTo(W / 2, 120, () => go('tour', { tour: this.then, skipInter: true })); }
    else if (button(L(UI.toHouse), W / 2 + 66, 176, 'primary')) irisTo(W / 2, 120, () => go('house'));
  },
  drawPause() {
    rect(0, 0, W, H, 'rgba(10,12,20,.7)'); frameBox(110, 60, 180, 96, .96);
    text(L(UI.pause), W / 2, 70, { align: 'center', col: '#f4f3ee' });
    if (button(L(UI.resume), W / 2, 92, 'primary')) this.paused = false;
    if (button(L(UI.quitLevel), W / 2, 118, 'danger')) irisTo(W / 2, 120, () => this.then ? go('tour', { tour: this.then, skipInter: true }) : go('house'));
  },
};
