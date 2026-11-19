/* ===================== Викторина «Знаток ЖКХ» =====================
   Раннер в коридоре подъезда (по макету): крупный герой, трубы, лампы с конусом света, кафель с отражениями.
   Бюрократ Бумажкин растащил страницы техпаспорта. Прыжок — касание экрана или Space.
   У дверей — вопрос: верная дверь — страница и монеты; неверная — объяснение, путь удлиняется, вопрос вернётся позже.
   Вопросы — quiz.json (встроенная копия QUIZ_BUILTIN; на сайте берётся свежий файл). */

let QUIZ_DATA = null;
function quizValidQ(q) { return q && q.q && Array.isArray(q.answers) && q.answers.length >= 2 && q.answers.length <= 4 && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.answers.length; }
function quizValid(d) { return !!(d && Array.isArray(d.questions) && d.questions.filter(quizValidQ).length >= 3); }
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
function prepQuestion(q) { const order = shuffle(q.answers.map((_, i) => i)); return { id: q.id, q: q.q, explain: q.explain, src: q, answers: order.map(i => q.answers[i]), correct: order.indexOf(q.correct) }; }

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

/* ---------- крупный герой-раннер 40×58 (как на макете): большая голова, худи, кеды ---------- */
const RUNNER_CACHE = new Map();
function runnerSprite(look, frame) {
  const key = JSON.stringify(look) + '|' + frame;
  if (RUNNER_CACHE.has(key)) return RUNNER_CACHE.get(key);
  const c = makeCanvas(42, 60, (P) => {
    const { r, p } = P, D = Math.PI / 180;
    const [skL, sk, skD] = tones(look.skin || '#e3ad86'), hair = tones(look.hairCol || '#5a3a2a'), top = tones(look.topCol || '#8a2e3a');
    const pants = tones(look.pants || '#2a2d3a'), skirt = look.bottom === 'skirt';
    const run = frame.startsWith('run') ? +frame.slice(3) % 6 : -1, jump = frame === 'jump', trip = frame === 'trip';
    const ph = run >= 0 ? run / 6 * Math.PI * 2 : 0, bob = run >= 0 ? Math.round(Math.abs(Math.cos(ph))) : 0, lean = run >= 0 ? 2 : trip ? 4 : 0;
    // толстый отрезок с тенью сзади
    const seg = (x0, y0, ang, len, w, col, colD) => { let x = x0, y = y0;
      for (let i = 0; i <= len; i++) { x = x0 + Math.sin(ang) * i; y = y0 + Math.cos(ang) * i; r(Math.round(x - w / 2), Math.round(y - w / 2), w, w, col); p(Math.round(x - w / 2), Math.round(y + w / 2 - 1), colD); }
      return [x, y]; };
    const hipY = 37 + bob;
    const leg = (phase, near) => {
      let a, bend;
      if (jump) { a = (near ? 55 : 30) * D; bend = (near ? 95 : 70) * D; }
      else if (trip) { a = (near ? -10 : 25) * D; bend = 30 * D; }
      else if (run >= 0) { a = 38 * Math.sin(phase) * D; bend = (55 * Math.max(0, -Math.cos(phase)) + 8) * D; }
      else { a = (near ? 4 : -4) * D; bend = 2 * D; }
      const col = skirt ? (near ? '#3b3742' : '#2a2730') : near ? pants[1] : pants[2], colD = skirt ? '#1d1b22' : near ? pants[2] : pants[3];
      const [kx, ky] = seg(20 + lean + (near ? 2 : -1), hipY, a, 9, skirt ? 4 : 5, col, colD);
      const [fx, fy] = seg(kx, ky, a - bend, 9, skirt ? 3 : 4, col, colD);
      const X = Math.round(fx), Y = Math.min(57, Math.round(fy));
      r(X - 3, Y - 1, 8, 3, near ? '#2a2830' : '#1e1c24'); r(X - 3, Y + 2, 8, 1, near ? '#e8e4dc' : '#a8a49c'); p(X + 4, Y - 1, '#4a4652');   // кеды с белой подошвой
    };
    const arm = (phase, near) => {
      let a, el;
      if (jump) { a = (near ? -50 : 40) * D; el = (near ? 40 : 70) * D; }
      else if (trip) { a = 80 * D; el = 10 * D; }
      else if (run >= 0) { a = -42 * Math.sin(phase) * D; el = 80 * D; }
      else { a = (near ? 8 : -8) * D; el = 20 * D; }
      const col = near ? top[1] : top[2], colD = near ? top[2] : top[3], sx = 21 + lean + (near ? 5 : -3), sy = 25 + bob;
      const [ex, ey] = seg(sx, sy, a, 6, 4, col, colD);
      const [hx, hy] = seg(ex, ey, a + el, 6, 4, col, colD);
      r(Math.round(hx - 2), Math.round(hy - 1), 4, 4, near ? sk : skD); p(Math.round(hx + 1), Math.round(hy - 1), near ? skL : sk);
      if (near && look.briefcase) { r(Math.round(hx - 4), Math.round(hy + 2), 10, 8, '#5a3a2a'); r(Math.round(hx - 4), Math.round(hy + 2), 10, 1, '#7a5a3a'); r(Math.round(hx - 1), Math.round(hy), 4, 2, '#3a2a1a'); }
    };
    // дальние конечности
    arm(ph + Math.PI, false); leg(ph + Math.PI, false);
    // корпус: худи/куртка
    const tx = 14 + lean, ty = 22 + bob, tw = 15, th = 16;
    r(tx, ty + 1, tw, th, top[1]); r(tx + 1, ty, tw - 2, 1, top[1]); r(tx, ty + 1, 2, th, top[2]); r(tx + tw - 2, ty + 2, 1, th - 3, top[0]);
    r(tx, ty + th - 1, tw, 2, top[2]);                                                                         // резинка снизу
    if (look.top === 'hoodie' || !look.top) { r(tx - 1, ty - 1, 6, 5, top[2]); r(tx + 9, ty + 9, 5, 4, top[2]); r(tx + 10, ty + 2, 1, 4, '#e8e4dc'); }   // капюшон, карман, шнурок
    if (look.top === 'leather') { r(tx + 10, ty + 1, 1, th - 1, '#c9c3b0'); r(tx + 8, ty, 5, 3, top[0]); }
    if (look.top === 'shirt') { r(tx + 9, ty - 1, 5, 3, '#f4f3ee'); for (let y = ty + 4; y < ty + th; y += 3) p(tx + 11, y, top[3]); }
    if (look.top === 'jacket') { r(tx + 8, ty, 4, 6, '#e8e4dc'); r(tx + 9, ty + 1, 2, 5, '#3a3d48'); }
    if (look.top === 'chapan') { r(tx - 1, ty + th - 2, tw + 2, 7, top[1]); for (let x = tx; x < tx + tw; x += 3) p(x, ty + th + 3, '#f2c94c'); }
    if (skirt) { r(tx - 1, hipY - 2, tw + 2, 7, top[2]); r(tx - 2, hipY + 4, tw + 4, 2, top[3]); }
    else r(tx + 1, hipY - 2, tw - 2, 3, pants[1]);
    // ближние конечности
    leg(ph, true);
    // голова: крупная, чуть скруглённая
    const hx = 9 + lean, hy = (trip ? 4 : 1) + bob, hw = 24, hh = 21;
    // скруглённая голова: углы срезаны, подбородок отделён от худи тёмной линией
    r(hx + 2, hy + 1, hw - 4, hh - 1, sk); r(hx + 1, hy + 2, hw - 2, hh - 4, sk); r(hx, hy + 4, hw, hh - 8, sk);
    r(hx + 3, hy + hh - 1, hw - 6, 1, skD); r(hx, hy + 4, 1, hh - 8, skD); r(hx + hw - 2, hy + 5, 1, 8, skL);
    r(hx + 3, hy + hh, hw - 6, 1, '#14121a');
    r(hx + 7, hy + 11, 2, 3, skD);                                                                              // ухо
    // волосы
    const hc = hair[1], hd = hair[2], hl = hair[0];
    if (look.hair !== 'bald') {
      r(hx, hy, hw, 7, hc); r(hx + 1, hy - 1, hw - 3, 1, hc); r(hx - 1, hy + 2, 6, 12, hc); r(hx + 3, hy + 6, 3, 5, hc);
      for (let i = 0; i < 5; i++) r(hx + 10 + i * 3, hy + 6 + (i % 2), 3, 2 + (i % 2), hc);                     // чёлка зубчиками
      r(hx + 4, hy, 10, 1, hl); r(hx + 15, hy + 1, 5, 1, hl); r(hx - 1, hy + 12, 3, 2, hd); r(hx + 8, hy + 6, 2, 3, hd);
      if (look.hair === 'long') { r(hx - 2, hy + 6, 6, 20, hc); r(hx - 2, hy + 24, 6, 2, hd); }
      if (look.hair === 'bun') { r(hx + 1, hy - 5, 8, 6, hc); r(hx + 3, hy - 5, 3, 1, hl); }
      if (look.hair === 'curly') for (const [x, y] of [[0, -2], [5, -3], [10, -3], [15, -3], [20, -2], [-2, 4], [-2, 9]]) r(hx + x, hy + y, 4, 4, hc);
    } else { r(hx + 8, hy + 2, 6, 2, skL); r(hx - 1, hy + 9, 3, 6, '#7a6a5a'); }
    if (look.hat === 'cap') { r(hx, hy - 2, hw - 2, 7, '#b8443f'); r(hx + hw - 4, hy + 3, 8, 2, '#8a2f2c'); r(hx + 3, hy - 2, 8, 1, '#d86a5f'); }
    if (look.hat === 'tyube') { r(hx + 2, hy - 3, hw - 6, 5, '#2a3a5a'); for (let x = hx + 4; x < hx + hw - 5; x += 3) p(x, hy - 1, '#f2c94c'); }
    // лицо
    const ex = hx + 15, ey = hy + 10;
    if (trip) { r(ex, ey + 2, 3, 1, '#14121a'); r(ex + 5, ey + 2, 3, 1, '#14121a'); r(ex + 3, ey + 7, 3, 2, '#7a3a3a'); }
    else { r(ex, ey, 2, 4, '#14121a'); r(ex + 6, ey, 2, 4, '#14121a'); p(ex, ey, '#6a6a7a'); p(ex + 6, ey, '#6a6a7a');
      r(ex + 3, ey + 7, 3, 1, skD); r(ex - 2, ey + 5, 2, 1, '#e8a0a0'); }
    if (look.glasses) { r(ex - 2, ey - 1, 6, 1, '#14121a'); r(ex + 4, ey - 1, 6, 1, '#14121a'); r(ex - 2, ey + 3, 6, 1, '#14121a'); r(ex + 4, ey + 3, 6, 1, '#14121a'); r(ex - 2, ey - 1, 1, 5, '#14121a'); r(ex + 9, ey - 1, 1, 5, '#14121a'); }
    arm(ph, true);
    // контур
    const g = P.g, img = g.getImageData(0, 0, 42, 60), d = img.data, a = (x, y) => x >= 0 && y >= 0 && x < 42 && y < 60 && d[(y * 42 + x) * 4 + 3] > 0, out = [];
    for (let y = 0; y < 60; y++) for (let x = 0; x < 42; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) out.push([x, y]);
    for (const [x, y] of out) p(x, y, '#14121a');
  });
  RUNNER_CACHE.set(key, c); return c;
}
const BUMAZHKIN_R = { ...BUMAZHKIN, briefcase: true, topCol: '#4a4a58', pants: '#2e2e38' };

/* ---------- коридор (как на макете): трубы, лампы, окно, панели, кафель с отражениями ---------- */
const QZ = { GY: 176, obs: {}, deco: {} };
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
    for (let y = 4; y < 50; y++) r(4, y, 72, 1, `rgb(${50 + y * .5 | 0},${62 + y * .6 | 0},${92 + y * .7 | 0})`);
    for (const [x, h] of [[6, 18], [16, 26], [28, 14], [40, 22], [52, 30], [66, 20]]) for (let i = 0; i < h; i++) r(x - i / 3, 50 - i, 4 + i * .6, 1, '#2a3540');
    for (let i = 0; i < 12; i++) p(6 + R() * 68, 6 + R() * 20, '#9aa8c8');
    r(38, 2, 3, 50, '#3a3f44'); r(2, 26, 76, 3, '#3a3f44'); r(19, 2, 2, 50, '#3a3f44'); r(59, 2, 2, 50, '#3a3f44');
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
  QZ.door = outlined(32, 70, ({ r, p }) => { r(0, 0, 32, 70, '#2a2d32'); r(3, 3, 26, 67, '#3d4148'); r(3, 3, 26, 1, '#55595f'); r(3, 3, 1, 67, '#4a4e55'); r(28, 3, 1, 67, '#2c2f34');
    r(7, 8, 18, 24, '#363a41'); r(7, 8, 18, 1, '#2a2d32'); r(7, 38, 18, 26, '#363a41'); r(7, 38, 18, 1, '#2a2d32'); r(7, 31, 18, 1, '#4a4e55');
    r(23, 36, 3, 9, '#8a8e96'); r(23, 36, 3, 1, '#b8bcc4'); r(12, 14, 8, 3, '#b8b2a0'); });
  QZ.goalDoor = outlined(32, 70, ({ r }) => { r(0, 0, 32, 70, '#1f3a34'); r(3, 3, 26, 67, '#2e6a5a'); r(3, 3, 26, 1, '#4a8a78'); r(7, 8, 18, 24, '#357a68'); r(7, 38, 18, 26, '#357a68'); r(23, 36, 3, 9, '#c9a95a'); });
  // преграды крупнее — под рост героя
  QZ.obs.boxes = outlined(36, 30, ({ r }) => { const box = (x, y, w, h) => { r(x, y, w, h, '#9a7048'); r(x, y, w, 1, '#c09468'); r(x, y, 1, h, '#b0845a'); r(x + w - 1, y, 1, h, '#7a5434'); r(x + (w >> 1) - 1, y, 2, 4, '#7a5434'); };
    box(0, 12, 12, 18); box(24, 14, 12, 16); box(9, 0, 18, 30); r(14, 10, 8, 5, '#d8d2bf'); });
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
  async enter() {
    buildQuizArt(); setTouch({ act: L(UI.qzJump) });
    this.state = 'loading'; this.t = 0; this.coins = 0; this.first = 0; this.done = 0; this.wrong = 0; this.paused = false; this.result = null; this.dust = [];
    this.look = Object.assign({}, DEFAULT_LOOK, SAVE.look || {});
    const d = await loadQuiz(); this.cfg = d;
    const pool = shuffle(d.questions.filter(quizValidQ)), n = Math.min(d.questionsPerRun || 8, pool.length);
    this.total = n; this.queue = pool.slice(0, n).map(prepQuestion);
    // трасса: [бег, двери] × n, затем бег и финиш
    this.segs = []; let x = 60;
    for (const q of this.queue) { x = this.addRun(x, 300 + Math.random() * 80, 2); x = this.addDoors(x, q); }
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
        if (o.kind === 'rat' && !o.hit && o.x + o.mx - this.hx < 230 && o.mx > -70) o.mx -= .045 * dt;
        const img = QZ.obs[o.kind === 'rat' ? 'rat0' : o.kind], ox = o.x + o.mx;
        if (o.hit || this.hx + 28 < ox + 4 || this.hx + 12 > ox + img.width - 4) continue;
        if (-this.jy < img.height - 6) { o.hit = true; this.trip = 480; this.coins = Math.max(0, this.coins - 2); beep(180, .12, 'sawtooth', .05); }
      }
      const g = this.segs[this.segs.length - 1];
      if (this.hx > g.x0 + 60 && !this.bRun) { this.bRun = 1; beep(330, .1, 'square', .04); }
      if (this.hx >= g.x0 + 120) { this.hx = g.x0 + 120; this.finishRun(); }
    }
    if (this.bRun) this.bx += .2 * dt;
    if (this.state === 'go') { const tx = this.cur.doors[this.pick] - 20; this.hx = Math.min(tx, this.hx + QZ_SPEED * 1.3 * dt);
      if (this.hx >= tx) { this.state = 'enter'; this.cur.open = this.pick; this.et = 0; beep(300, .08, 'square', .04); } }
    if (this.state === 'enter') { this.et += dt; this.cur.ok = Math.min(1, this.et / 300); if (this.et > 720 && !this.fb) this.answer(); }
    for (const d of this.dust) { d.t += dt; d.x -= .02 * dt; d.y -= .012 * dt; } this.dust = this.dust.filter(d => d.t < 450);
    this.cam = clamp(this.hx - 120, 0, Math.max(0, this.totalLen() - W));
  },
  puff(n) { for (let i = 0; i < n; i++) this.dust.push({ x: this.hx + 10 + Math.random() * 6, y: QZ.GY - 2 - Math.random() * 3, t: 0, s: 2 + Math.random() * 3 }); },
  choose(i) { if (this.state !== 'ask') return; this.pick = i; this.state = 'go'; },
  answer() {
    const s = this.cur, q = s.q, ok = this.pick === q.correct; q.tries = (q.tries || 0) + 1;
    if (ok) { const c = q.tries === 1 ? (this.cfg.coinsFirstTry ?? 20) : (this.cfg.coinsRetry ?? 5); this.coins += c; this.done++; if (q.tries === 1) this.first++;
      this.fb = { ok: true, text: L(UI.qzRight).replace('{c}', c).replace('{n}', this.done).replace('{t}', this.total) }; sfx.stamp && sfx.stamp(); }
    else { this.wrong++;
      this.fb = { ok: false, text: L(UI.qzWrong).replace('{a}', 'ABCD'[q.correct] + ' — ' + L(q.answers[q.correct])) + (q.explain ? ' ' + L(q.explain) : '') }; beep(160, .2, 'sawtooth', .05); }
    this.state = 'feedback'; setTouch({ act: L(UI.next) });
  },
  next() {
    if (this.state !== 'feedback') return;
    const s = this.cur, idx = this.segs.indexOf(s), ok = this.fb.ok; s.done = true; this.state = 'trans';
    irisTo(this.hx - this.cam + 20, QZ.GY - 30, () => {
      if (!ok) {
        // путь удлиняется: лишний участок с тремя преградами, вопрос (ответы заново перемешаны) — перед финишем
        const extra = { type: 'run', x0: 0, len: 380, obs: [] }; this.segs.splice(idx + 1, 0, extra);
        const goal = this.segs.pop(), q2 = prepQuestion(s.q.src); q2.tries = s.q.tries;
        const runB = { type: 'run', x0: 0, len: 300, obs: [] }, dn = { type: 'door', x0: 0, len: this.doorLen(q2.answers.length), q: q2, doors: [], open: -1, ok: 0 };
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
    try { res = await API.quizFinish({ firstTry: this.first, total: this.total, wrong: this.wrong, coins: this.coins, seconds: sec }); HOUSE_STATE = await API.house(); } catch (e) {}
    this.result = { ...res, first: this.first, total: this.total, title, sec };
    try { notifyApp('result', { version: 1, game: 'korshiler', token: LAUNCH.token, runId: 'quiz-' + this.startedAt, tour: null, tourCode: 'quiz', success: true,
      quiz: { firstTry: this.first, total: this.total, wrong: this.wrong }, coins: res.coins, badges: res.badge ? [res.badge] : [], startedAt: new Date(this.startedAt).toISOString(),
      finishedAt: new Date().toISOString(), lang: LANG, clientVersion: CLIENT_VERSION }); } catch (e) {}
  },
  drawWorld() {
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
    this.drawWorld();
    // двери-ответы с табличками и лампой над дверью; выбранная открывается
    for (const s of this.segs) {
      if (s.type === 'door') s.doors.forEach((dx, i) => { const x = dx - cx; if (x < -40 || x > W + 40) return;
        const lit = s === this.cur && (this.state === 'ask' || this.pick === i);
        if (s.open === i) { const k = s.ok;
          rect(x - 13, GY - 66, 26, 66, '#2a2018'); ctx.fillStyle = 'rgba(242,198,106,.55)'; ctx.fillRect(x - 13, GY - 66, 26, 66);
          rect(x - 9, GY - 58, 3, 16, '#5a3a2a'); rect(x - 10, GY - 59, 5, 1, '#3a2a1a');
          const dw = Math.max(4, Math.round(26 * (1 - k))); sprite(QZ.door, x - 16, GY - 70, false, 0); rect(x - 16, GY - 70, 32, 4, '#2a2d32'); rect(x - 16, GY - 70, 3, 70, '#2a2d32'); rect(x + 13, GY - 70, 3, 70, '#2a2d32');
          rect(x + 13 - dw, GY - 66, dw, 66, '#3d4148'); rect(x + 13 - dw, GY - 66, 1, 66, '#14121a');
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(242,198,106,${(.07 * k).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(x - 13, GY); ctx.lineTo(x + 13, GY); ctx.lineTo(x + 30, GY + 30); ctx.lineTo(x - 30, GY + 30); ctx.fill(); ctx.restore();
        } else sprite(QZ.door, x - 16, GY - 70);
        rect(x - 10, GY - 86, 20, 13, '#14121a'); rect(x - 9, GY - 85, 18, 11, lit ? '#f2c94c' : '#c9c3b0'); rect(x - 9, GY - 85, 18, 1, lit ? '#fbe39a' : '#e4dfcf');
        text('ABCD'[i], x, GY - 83, { align: 'center', col: '#14121a' });
        rect(x - 11, GY + 1, 22, 2, 'rgba(242,210,122,.2)'); });
      if (s.type === 'goal') { const x = s.x0 + 140 - cx; if (x > -60 && x < W + 60) {
        sprite(QZ.goalDoor, x - 16, GY - 70); rect(x - 12, GY - 84, 24, 10, '#f4f3ee'); text('ОСИ', x, GY - 83, { align: 'center', col: '#2e6a5a', size: 6 });
        if (!this.bRun) { sprite(runnerSprite(BUMAZHKIN_R, 'idle'), x - 60, GY - 58, true); sprite(QZ.folder, x - 70, GY - 30); }
        else { sprite(runnerSprite(BUMAZHKIN_R, 'run' + ((t / 70 | 0) % 6)), x - 60 + this.bx, GY - 58); sprite(QZ.folder, x - 70, GY - 15); } } }
      if (s.obs) for (const o of s.obs) { const img = o.kind === 'rat' ? QZ.obs[(t / 110 | 0) % 2 ? 'rat0' : 'rat1'] : QZ.obs[o.kind], sx = o.x + o.mx - cx;
        if (sx > -40 && sx < W + 40) { sprite(img, sx, GY - img.height + 1, o.kind === 'rat', o.hit ? .45 : 1);
          ctx.save(); ctx.globalAlpha = .14; ctx.translate(Math.round(sx), GY + img.height); ctx.scale(1, -1); if (o.kind === 'rat') { ctx.translate(img.width, 0); ctx.scale(-1, 1); } ctx.drawImage(img, 0, 0); ctx.restore(); } }
    }
    // герой: отражение в полу, полосы скорости, пыль
    const fr = this.trip > 0 ? 'trip' : this.jy < 0 ? 'jump' : ['run', 'go'].includes(this.state) ? 'run' + ((t / 75 | 0) % 6) : 'idle';
    const alpha = this.state === 'enter' ? clamp(1 - (this.et - 300) / 320, 0, 1) : ['feedback', 'trans'].includes(this.state) ? 0 : this.trip > 0 && (t / 80 | 0) % 2 ? .5 : 1;
    const hsx = Math.round(this.hx - cx), hy = GY - 58 + Math.round(this.jy), img = runnerSprite(this.look, fr);
    if (alpha > 0) {
      ctx.save(); ctx.globalAlpha = .16 * alpha; ctx.translate(hsx, GY * 2 - hy); ctx.scale(1, -1); ctx.drawImage(img, 0, 0); ctx.restore();
      rect(hsx + 9, GY - 1, 22, 2, `rgba(0,0,0,${(.35 * (1 + this.jy / 80)).toFixed(2)})`);
      for (const d of this.dust) { const a = 1 - d.t / 450; ctx.fillStyle = `rgba(190,186,176,${(a * .6).toFixed(2)})`; ctx.fillRect(Math.round(d.x - cx), Math.round(d.y), Math.round(d.s * (1 + d.t / 300)), Math.round(d.s * (1 + d.t / 300))); }
      if (['run', 'go'].includes(this.state) && this.trip === 0) for (let i = 0; i < 3; i++) { const yy = hy + 22 + i * 8, len = 10 + ((t / 60 + i * 3) % 6); rect(hsx - len - 2 + (i === 1 ? -4 : 0), yy, len, 1, 'rgba(230,234,240,.45)'); }
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
    text(`₸${this.coins}`, 24 + this.total * 11 + 6, 6, { col: '#f2c94c', size: 6 });
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
    const lines = wrapText(L(q.q), 364, 8).slice(0, 3), ah = 15, h = 12 + lines.length * 11 + q.answers.length * ah + 4;
    frameBox(8, 24, 384, h, .95);
    lines.forEach((l, i) => text(l, 18, 30 + i * 11, { col: '#f4f3ee' }));
    q.answers.forEach((a, i) => { const y = 30 + lines.length * 11 + 3 + i * ah, sel = this.pick === i;
      rect(16, y, 368, ah - 2, sel ? '#3a4a3a' : '#1d2130'); rect(18, y + 2, 11, 9, sel ? '#f2c94c' : '#d8d2bf'); text('ABCD'[i], 23.5, y + 3, { col: '#1a1424', align: 'center', size: 6 });
      const s = L(a), sz = textW(s, 8) > 340 ? 6 : 8; text(s, 34, y + (sz === 8 ? 2 : 4), { col: sel ? '#f2c94c' : '#cfd6e4', size: sz });
      if (this.state === 'ask' && clickIn(16, y, 368, ah - 2)) this.choose(i); });
    if (this.state === 'ask') {
      const c = clicks.find(c => c.y > 24 + h); if (c) { const wx = c.x + this.cam, i = this.cur.doors.findIndex(d => Math.abs(d - wx) < 20); if (i >= 0) { clicks.splice(clicks.indexOf(c), 1); this.choose(i); } }
      const n = q.answers.length; if (hit('up') || hit('left')) this.pick = (this.pick + n - 1) % n; if (hit('down') || hit('right')) this.pick = (this.pick + 1) % n; if (hit('act') && this.pick >= 0) this.choose(this.pick);
    }
  },
  drawFeedback() {
    const f = this.fb, lines = wrapText(f.text, 340, 6).slice(0, 6), h = 34 + lines.length * 9 + (f.ok ? 0 : 11) + 24;
    frameBox(24, 40, 352, h, .96);
    text(f.ok ? L(UI.qzOk) : L(UI.qzNo), W / 2, 48, { align: 'center', col: f.ok ? '#7fe08a' : '#e98f6f' });
    if (f.ok) sprite(QZ.page, W / 2 - 5, 59);
    lines.forEach((l, i) => text(l, W / 2, 72 + i * 9, { align: 'center', col: '#f4f3ee', size: 6 }));
    if (!f.ok) text(L(UI.qzLonger), W / 2, 72 + lines.length * 9 + 1, { align: 'center', col: '#f2c94c', size: 6 });
    if (button(L(UI.next), W / 2, 40 + h - 20, 'primary') || hit('act')) this.next();
  },
  drawIntro() {
    rect(0, 0, W, H, 'rgba(10,12,20,.55)'); frameBox(40, 34, 320, 150, .96);
    rect(52, 50, 78, 108, '#1a1e26'); rect(52, 150, 78, 8, '#2a2e36');
    sprite(runnerSprite(BUMAZHKIN_R, 'idle'), 70, 94, true);
    for (let i = 0; i < 5; i++) { const a = this.t / 700 + i * 1.26; sprite(QZ.page, 86 + Math.round(Math.cos(a) * 28), 78 + Math.round(Math.sin(a) * 16)); }
    text(L(UI.qzTitle), 245, 44, { align: 'center', col: '#f2c94c' });
    wrapText(L(UI.qzIntro).replace('{n}', this.total), 210, 6).slice(0, 10).forEach((l, i) => text(l, 140, 60 + i * 9, { col: '#f4f3ee', size: 6 }));
    if (button(L(UI.qzGo), W / 2, 162, 'primary')) this.state = 'run';
  },
  drawEnd() {
    const r = this.result;
    rect(0, 0, W, H, 'rgba(10,12,20,.55)'); paper(70, 24, 260, 178, 7);
    text(L(UI.qzDone), W / 2, 34, { align: 'center', col: '#2e6a5a' });
    const rows = [[L(UI.qzFirst), `${r.first}/${r.total}`], [L(UI.qzWrongN), String(this.wrong)], [L(UI.rBudget), '+₸' + (r.coins ?? this.coins)]];
    rows.forEach(([a, b], i) => { text(a, 86, 54 + i * 13, { col: INK }); text(b, 314, 54 + i * 13, { col: INK, align: 'right' }); rect(86, 63 + i * 13, 228, 1, '#e2d9c2'); });
    const note = r.title ? L(UI.qzTitleGot) : L(UI.qzTitleNeed).replace('{p}', Math.round((this.cfg.titleThreshold ?? .8) * 100));
    wrapText(note, 220, 6).slice(0, 3).forEach((l, i) => text(l, W / 2, 98 + i * 9, { align: 'center', col: r.title ? INK_TEAL : INK, size: 6 }));
    if (r.title) { ctx.save(); ctx.translate(W / 2, 138); ctx.rotate(-.08); ctx.strokeStyle = '#2e6a5a'; ctx.lineWidth = 2; ctx.strokeRect(-62, -10, 124, 20); text(L(TITLES.zhkh_expert).toUpperCase(), 0, -4, { col: '#2e6a5a', align: 'center' }); ctx.restore(); }
    if (button(L(UI.again), W / 2 - 66, 176, 'alt')) irisTo(W / 2, 120, () => go('quiz'));
    if (button(L(UI.toHouse), W / 2 + 66, 176, 'primary')) irisTo(W / 2, 120, () => go('house'));
  },
  drawPause() {
    rect(0, 0, W, H, 'rgba(10,12,20,.7)'); frameBox(110, 60, 180, 96, .96);
    text(L(UI.pause), W / 2, 70, { align: 'center', col: '#f4f3ee' });
    if (button(L(UI.resume), W / 2, 92, 'primary')) this.paused = false;
    if (button(L(UI.quitLevel), W / 2, 118, 'danger')) irisTo(W / 2, 120, () => go('house'));
  },
};
