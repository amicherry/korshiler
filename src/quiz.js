/* ===================== Викторина «Знаток ЖКХ» =====================
   Аркада в коридоре подъезда. Бюрократ Бумажкин растащил страницы техпаспорта дома.
   Чиби-герой бежит, перепрыгивает преграды (тап / пробел), у трёх дверей — вопрос:
   верная дверь — страница и монеты, неверная — объяснение, путь удлиняется, вопрос вернётся позже.
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

/* ---------- коридор подъезда: тайл 480 px (стиль лестничной клетки) ---------- */
const QZ = { tile: null, doors: {}, obs: {}, page: null, GY: 186 };
function buildQuizArt() {
  if (QZ.tile) return;
  const R = rng(77);
  QZ.tile = makeCanvas(480, H, ({ r, p }) => {
    r(0, 0, 480, 22, '#1b1d1a'); r(0, 20, 480, 2, '#2c302a');                                    // потолок
    r(0, 22, 480, 92, '#5d6a4e'); r(0, 114, 480, 72, '#2f5a57'); r(0, 112, 480, 2, '#1f2a24');   // стена: олива и бирюзовая панель
    for (let i = 0; i < 1400; i++) p(R() * 480, 22 + R() * 164, pick(R, ['#566248', '#64714f', '#2a5250', '#356360']));
    for (let x = 0; x < 480; x += 60) { r(x, 116, 1, 68, '#29504d'); }                          // швы панели
    r(0, 182, 480, 4, '#20302c'); r(0, 182, 480, 1, '#3a5a54');                                 // плинтус
    r(0, 186, 480, 39, '#3e3830'); for (let x = 0; x < 480; x += 24) r(x, 186, 1, 39, '#332e28'); r(0, 186, 480, 1, '#5a5244');
    for (let i = 0; i < 300; i++) p(R() * 480, 187 + R() * 37, pick(R, ['#36312a', '#463f35']));
    // трубы под потолком, провод
    r(0, 26, 480, 3, '#4a5e6a'); r(0, 26, 480, 1, '#6a8090'); for (let x = 30; x < 480; x += 90) r(x, 25, 3, 5, '#3a4a54');
    for (let x = 0; x < 480; x++) p(x, 33 + Math.round(Math.sin(x / 480 * Math.PI * 4) * 2), '#1a1d1b');
    // бра и тёплый свет, объявления, щиток, почтовые ящики
    for (const lx of [80, 320]) { r(lx - 3, 50, 7, 5, '#c9a95a'); r(lx - 2, 55, 5, 2, '#f4e6a8'); r(lx, 46, 1, 4, '#1a1d1b'); }
    r(190, 64, 9, 12, '#d8d2bf'); r(191, 66, 6, 1, '#7a7466'); r(191, 69, 5, 1, '#7a7466'); r(203, 68, 8, 10, '#c9d6e6');
    r(410, 60, 16, 22, '#3a4038'); r(411, 61, 14, 20, '#4a5248'); r(416, 66, 4, 4, '#b8443f');
    r(250, 124, 30, 18, '#3a4a48'); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) r(252 + i * 9, 126 + j * 8, 8, 7, '#55706a');
    r(30, 150, 30, 14, '#7a6a58'); for (let x = 32; x < 58; x += 4) r(x, 151, 2, 12, '#5a4a3a');   // батарея
  });
  QZ.light = makeCanvas(60, 70, ({ g }) => { const gr = g.createRadialGradient(30, 10, 2, 30, 30, 40); gr.addColorStop(0, 'rgba(255,220,150,.28)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, 60, 70); });
  DOOR_STYLES.forEach((L0, i) => { QZ.doors[i] = makeCanvas(34, 54, P => drawDoorPanel(P, 17, 53, L0)); });
  QZ.doorOpen = makeCanvas(34, 54, ({ r }) => { r(1, 2, 32, 51, '#1a1d1b'); r(4, 5, 26, 48, '#0b0c10'); r(4, 5, 5, 48, '#2a2e2a'); r(26, 5, 4, 48, '#3a3530'); });
  QZ.obs.bucket = makeCanvas(12, 12, ({ r }) => { r(1, 3, 10, 9, '#6a7480'); r(2, 3, 8, 1, '#8a96a2'); r(1, 2, 10, 1, '#4a525c'); r(3, 0, 6, 1, '#2a2e34'); r(2, 1, 1, 2, '#2a2e34'); r(9, 1, 1, 2, '#2a2e34'); r(2, 4, 8, 2, '#5a8ad0'); });
  QZ.obs.boxes = makeCanvas(16, 15, ({ r }) => { r(0, 5, 16, 10, '#a87a4a'); r(0, 5, 16, 1, '#c89a6a'); r(7, 5, 2, 10, '#8a5a3a'); r(3, 0, 10, 6, '#b88a5a'); r(3, 0, 10, 1, '#d8aa7a'); r(7, 0, 2, 6, '#9a6a4a'); });
  QZ.obs.wet = makeCanvas(12, 16, ({ r, p }) => { r(2, 2, 8, 12, '#f2c94c'); r(1, 14, 2, 2, '#b08a1e'); r(9, 14, 2, 2, '#b08a1e'); r(3, 1, 6, 1, '#f2c94c'); r(5, 4, 2, 5, '#1a1424'); r(5, 10, 2, 2, '#1a1424'); p(2, 2, '#fbe39a'); });
  QZ.obs.rat0 = makeCanvas(14, 7, ({ r, p }) => { r(3, 2, 8, 4, '#5b5f66'); r(10, 3, 3, 2, '#6b6f76'); p(12, 3, '#1a1424'); p(13, 4, '#e98f8f'); r(0, 4, 3, 1, '#8a6a6a'); r(4, 6, 1, 1, '#3a3e46'); r(8, 6, 1, 1, '#3a3e46'); p(9, 1, '#7a7e86'); });
  QZ.obs.rat1 = makeCanvas(14, 7, ({ r, p }) => { r(3, 2, 8, 4, '#5b5f66'); r(10, 3, 3, 2, '#6b6f76'); p(12, 3, '#1a1424'); p(13, 4, '#e98f8f'); r(0, 3, 3, 1, '#8a6a6a'); r(5, 6, 1, 1, '#3a3e46'); r(7, 6, 1, 1, '#3a3e46'); p(9, 1, '#7a7e86'); });
  QZ.page = makeCanvas(9, 11, ({ r }) => { r(0, 0, 9, 11, '#1a1424'); r(1, 1, 7, 9, '#f4f3ee'); r(6, 1, 2, 2, '#c9c3b0'); for (let y = 3; y < 9; y += 2) r(2, y, 5, 1, '#8a8478'); });
  QZ.goal = makeCanvas(120, 80, ({ r, g }) => {
    r(10, 6, 40, 74, '#1a1d1b'); r(13, 9, 34, 71, '#2e6a5a'); r(16, 12, 28, 30, '#357a68'); r(16, 46, 28, 30, '#357a68'); r(40, 46, 3, 3, '#c9a95a');
    r(14, -2 + 2, 32, 8, '#f4f3ee'); g.font = '8px ' + FONT; g.fillStyle = '#2e6a5a'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('ОСИ', 30, 1);
    r(64, 50, 50, 4, '#8a5a3a'); r(66, 54, 3, 26, '#6a4a2a'); r(108, 54, 3, 26, '#6a4a2a');                        // стол
    r(78, 40, 22, 10, '#3f6f8c'); r(78, 40, 22, 1, '#6a9ab8'); r(80, 42, 18, 1, '#f4f3ee');                           // папка «Техпаспорт»
  });
}

/* ---------- сцена ---------- */
const QZ_SPEED = .12, QZ_JUMP = -.3, QZ_G = .0012;
scenes.quiz = {
  async enter() {
    buildQuizArt(); setTouch({ act: L(UI.qzJump) });
    this.state = 'loading'; this.t = 0; this.coins = 0; this.first = 0; this.done = 0; this.wrong = 0; this.paused = false; this.result = null; this.sent = false;
    this.look = Object.assign({}, DEFAULT_LOOK, SAVE.look || {});
    const d = await loadQuiz(); this.cfg = d;
    const pool = shuffle(d.questions.filter(quizValidQ)), n = Math.min(d.questionsPerRun || 8, pool.length);
    this.total = n; this.queue = pool.slice(0, n).map(prepQuestion);
    // трасса: [бег, двери] × n, затем бег и финиш
    this.segs = []; let x = 40;
    for (const q of this.queue) { x = this.addRun(x, 260 + Math.random() * 80, 2); x = this.addDoors(x, q); }
    x = this.addRun(x, 220, 1); this.segs.push({ type: 'goal', x0: x, len: 220 });
    this.hx = 20; this.jy = 0; this.vy = 0; this.trip = 0; this.cam = 0; this.cur = null; this.pick = -1; this.fb = null;
    this.startedAt = Date.now(); this.state = 'intro';
  },
  // участок бега с преградами (не ближе 110 px друг к другу — успеть приземлиться)
  addRun(x, len, nObs) {
    const obs = [], kinds = ['bucket', 'boxes', 'wet', 'rat'], slot = len / (nObs + 1);
    for (let i = 1; i <= nObs; i++) obs.push({ x: x + Math.round(slot * i + (Math.random() - .5) * slot * .3), kind: pick(Math.random, kinds), hit: false, mx: 0 });
    this.segs.push({ type: 'run', x0: x, len, obs }); return x + len;
  },
  addDoors(x, q) {
    const n = q.answers.length, gap = n === 4 ? 70 : 84, doors = q.answers.map((_, i) => x + 60 + i * gap);
    this.segs.push({ type: 'door', x0: x, len: 60 + (n - 1) * gap + 70, q, doors, style: Math.floor(Math.random() * DOOR_STYLES.length), open: -1 });
    return x + 60 + (n - 1) * gap + 70;
  },
  // после ответа: всё, что ещё впереди, сдвигается — трасса перестраивается (игрок в это время «за дверью»)
  relayout(fromIdx) { let x = this.segs[fromIdx].x0 + this.segs[fromIdx].len;
    for (let i = fromIdx + 1; i < this.segs.length; i++) { const s = this.segs[i], dx = x - s.x0; s.x0 = x;
      if (s.obs) for (const o of s.obs) o.x += dx; if (s.doors) s.doors = s.doors.map(v => v + dx); x += s.len; } },
  totalLen() { const s = this.segs[this.segs.length - 1]; return s.x0 + 60; },
  segAt(x) { return this.segs.find(s => x >= s.x0 && x < s.x0 + s.len); },
  focus() { return { x: this.hx - this.cam + 8, y: QZ.GY - 12 }; },
  jump() { if (this.jy === 0 && this.state === 'run' && !this.trip) { this.vy = QZ_JUMP; sfx.step && sfx.step(); beep(520, .05, 'square', .03); } },
  update(dt) {
    if (this.state === 'loading') return;
    this.t += dt;
    if (hit('back') && !['end', 'intro'].includes(this.state)) this.paused = !this.paused;
    if (this.paused) return;
    if (this.state === 'intro') { if (hit('act')) this.state = 'run'; return; }
    // прыжок: пробел/стрелка вверх/кнопка; тап по коридору — тоже прыжок (во время бега)
    if (this.state === 'run' && (hit('act') || hit('up'))) this.jump();
    if (this.state === 'run') { const c = clicks.find(c => c.y > 24 && c.y < 200); if (c) { clicks.splice(clicks.indexOf(c), 1); this.jump(); } }
    // физика прыжка
    if (this.jy < 0 || this.vy < 0) { this.vy += QZ_G * dt; this.jy = Math.min(0, this.jy + this.vy * dt); if (this.jy === 0) this.vy = 0; }
    if (this.trip > 0) { this.trip -= dt; }
    if (this.state === 'run' && this.trip <= 0) {
      const nx = this.hx + QZ_SPEED * dt;
      // упёрлись в двери — вопрос
      const ds = this.segs.find(s => s.type === 'door' && s.open < 0 && !s.done && nx >= s.x0 + 14 && this.hx < s.x0 + 14 + 1);
      if (ds) { this.hx = ds.x0 + 14; this.cur = ds; this.state = 'ask'; this.pick = -1; setTouch({}); beep(660, .06, 'sine', .04); }
      else this.hx = nx;
      // преграды
      for (const s of this.segs) if (s.obs) for (const o of s.obs) {
        if (o.kind === 'rat' && !o.hit && o.x + o.mx - this.hx < 220 && o.mx > -60) o.mx -= .04 * dt;   // крыса, заметив героя, бежит навстречу
        const img = QZ.obs[o.kind === 'rat' ? 'rat0' : o.kind], ox = o.x + o.mx;
        if (o.hit || this.hx + 12 < ox || this.hx + 4 > ox + img.width) continue;
        if (-this.jy < img.height - 2) { o.hit = true; this.trip = 520; this.coins = Math.max(0, this.coins - 2); beep(180, .12, 'sawtooth', .05); }
      }
      const g = this.segs[this.segs.length - 1]; if (this.hx >= g.x0 + 60) this.finishRun();
    }
    if (this.state === 'go') {                                                                    // бежит к выбранной двери
      const tx = this.cur.doors[this.pick] - 8; this.hx = Math.min(tx, this.hx + QZ_SPEED * 1.3 * dt);
      if (this.hx >= tx) { this.state = 'enter'; this.cur.open = this.pick; this.et = 0; beep(300, .08, 'square', .04); }
    }
    if (this.state === 'enter') { this.et += dt; if (this.et > 420 && !this.fb) this.answer(); }
    this.cam = clamp(this.hx - 110, 0, Math.max(0, this.totalLen() - W + 40));
  },
  choose(i) { if (this.state !== 'ask') return; this.pick = i; this.state = 'go'; },
  answer() {
    const s = this.cur, q = s.q, ok = this.pick === q.correct;
    q.tries = (q.tries || 0) + 1;
    if (ok) { const c = q.tries === 1 ? (this.cfg.coinsFirstTry ?? 20) : (this.cfg.coinsRetry ?? 5); this.coins += c; this.done++; if (q.tries === 1) this.first++;
      this.fb = { ok: true, text: L(UI.qzRight).replace('{c}', c).replace('{n}', this.done).replace('{t}', this.total) }; sfx.stamp && sfx.stamp(); }
    else { this.wrong++;
      this.fb = { ok: false, text: L(UI.qzWrong).replace('{a}', 'ABCD'[q.correct] + ' — ' + L(q.answers[q.correct])) + (q.explain ? ' ' + L(q.explain) : '') }; beep(160, .2, 'sawtooth', .05); }
    this.state = 'feedback'; setTouch({ act: L(UI.next) });
  },
  next() {
    const s = this.cur, idx = this.segs.indexOf(s), ok = this.fb.ok; s.done = true; this.fb = null;
    if (!ok) {
      // путь удлиняется: лишний участок с преградами, а вопрос (с перемешанными ответами) — позже, перед финишем
      const extra = { type: 'run', x0: 0, len: 340, obs: [] }; this.segs.splice(idx + 1, 0, extra);
      const goal = this.segs.pop(); const q2 = prepQuestion(s.q.src); q2.tries = s.q.tries;
      const at = this.segs.length; this.segs.push({ type: 'run', x0: 0, len: 260, obs: [] }); this.segs.push({ type: 'door', x0: 0, len: 0, q: q2, doors: [], style: Math.floor(Math.random() * DOOR_STYLES.length), open: -1 }); this.segs.push(goal);
      // разложить новые участки: размеры и преграды
      const fill = (seg, nObs) => { const slot = seg.len / (nObs + 1); seg.obs = []; for (let i = 1; i <= nObs; i++) seg.obs.push({ x: seg.x0 + Math.round(slot * i), kind: pick(Math.random, ['bucket', 'boxes', 'wet', 'rat']), hit: false, mx: 0 }); };
      const dn = this.segs[at + 1], n = q2.answers.length, gap = n === 4 ? 70 : 84; dn.len = 60 + (n - 1) * gap + 70;
      this.relayout(idx); fill(extra, 3); fill(this.segs[at], 2); dn.doors = q2.answers.map((_, i) => dn.x0 + 60 + i * gap);
    } else this.relayout(idx);
    // выходим из двери уже за блоком дверей
    this.hx = s.x0 + s.len + 2; this.jy = 0; this.vy = 0; this.cur = null; this.pick = -1;
    irisFrom(110 + 8, QZ.GY - 12); this.state = 'run'; setTouch({ act: L(UI.qzJump) });
  },
  async finishRun() {
    this.state = 'end'; setTouch({});
    const sec = Math.round((Date.now() - this.startedAt) / 1000), ratio = this.total ? this.first / this.total : 0;
    const title = ratio >= (this.cfg.titleThreshold ?? .8);
    let res = { coins: this.coins, badge: title ? 'zhkh_expert' : null, offline: true };
    try { res = await API.quizFinish({ firstTry: this.first, total: this.total, wrong: this.wrong, coins: this.coins, seconds: sec }); HOUSE_STATE = await API.house(); } catch (e) {}
    this.result = { ...res, first: this.first, total: this.total, title, sec };
    try { notifyApp('result', { version: 1, game: 'korshiler', token: LAUNCH.token, runId: 'quiz-' + this.startedAt, tour: null, tourCode: 'quiz', success: true,
      quiz: { firstTry: this.first, total: this.total, wrong: this.wrong }, coins: res.coins, badges: res.badge ? [res.badge] : [], startedAt: new Date(this.startedAt).toISOString(),
      finishedAt: new Date().toISOString(), lang: LANG, clientVersion: CLIENT_VERSION }); } catch (e) {}
  },
  draw(dt) {
    if (this.state === 'loading') { rect(0, 0, W, H, '#0b0c10'); text('…', W / 2, H / 2, { align: 'center' }); return; }
    const cx = Math.round(this.cam);
    // коридор
    for (let x = -(cx % 480); x < W; x += 480) ctx.drawImage(QZ.tile, x, 0);
    for (let x = -(cx % 480); x < W; x += 480) for (const lx of [80, 320]) ctx.drawImage(QZ.light, x + lx - 30, 48);
    // двери, таблички с буквами
    for (const s of this.segs) {
      if (s.type === 'door') s.doors.forEach((dx, i) => { const sx = dx - cx - 17; if (sx < -40 || sx > W + 10) return;
        sprite(s.open === i ? QZ.doorOpen : QZ.doors[(s.style + i) % DOOR_STYLES.length], sx, QZ.GY - 53);
        const lit = s === this.cur && (this.pick === i || this.state === 'ask');
        rect(sx + 9, QZ.GY - 70, 16, 13, '#1a1424'); rect(sx + 10, QZ.GY - 69, 14, 11, lit ? '#f2c94c' : '#d8d2bf');
        text('ABCD'[i], sx + 17, QZ.GY - 67, { align: 'center', col: '#1a1424' }); });
      if (s.type === 'goal') { const sx = s.x0 - cx; if (sx < W) { sprite(QZ.goal, sx + 30, QZ.GY - 80); if (this.state !== 'end') sprite(chibiSprite(BUMAZHKIN, 'idle'), sx + 6, QZ.GY - 22, true); } }
      if (s.obs) for (const o of s.obs) { const img = o.kind === 'rat' ? QZ.obs[(this.t / 120 | 0) % 2 ? 'rat0' : 'rat1'] : QZ.obs[o.kind], sx = o.x + o.mx - cx;
        if (sx > -20 && sx < W + 20) sprite(img, sx, QZ.GY - img.height, o.kind === 'rat', o.hit ? .45 : 1); }
    }
    // герой-чиби
    const fr = this.trip > 0 ? 'trip' : this.jy < 0 ? 'jump' : ['run', 'go'].includes(this.state) ? 'run' + ((this.t / 90 | 0) % 4) : 'idle';
    const alpha = this.state === 'enter' ? Math.max(0, 1 - this.et / 400) : (this.trip > 0 && (this.t / 80 | 0) % 2 ? .5 : 1);
    rect(this.hx - cx + 3, QZ.GY - 1, 12, 2, 'rgba(0,0,0,.35)');
    if (this.state !== 'feedback') sprite(chibiSprite(this.look, fr), this.hx - cx, QZ.GY - 23 + Math.round(this.jy), false, alpha);
    // HUD: страницы, монеты, путь
    rect(0, 0, W, 20, 'rgba(11,12,16,.85)');
    if (button('II', 0, 2, 'dark', { left: 2, w: 16 })) this.paused = true;
    for (let i = 0; i < this.total; i++) sprite(QZ.page, 24 + i * 11, 4, false, i < this.done ? 1 : .22);
    text(`₸${this.coins}`, 24 + this.total * 11 + 6, 6, { col: '#f2c94c', size: 6 });
    const prog = clamp(this.hx / this.totalLen(), 0, 1), bx = 250, bw = 140;
    rect(bx, 8, bw, 4, '#2b2a33'); rect(bx, 8, Math.round(bw * prog), 4, '#7fc4a8'); rect(bx + bw - 2, 5, 4, 10, '#2e6a5a');
    text(L(UI.qzPath), bx - 4, 6, { col: '#9fb0cc', size: 6, align: 'right' });
    // карточка вопроса / ответа
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
      let s = L(a), sz = 8; if (textW(s, 8) > 340) sz = 6; text(s, 34, y + (sz === 8 ? 2 : 4), { col: sel ? '#f2c94c' : '#cfd6e4', size: sz });
      if (this.state === 'ask' && clickIn(16, y, 368, ah - 2)) this.choose(i); });
    // тап по двери в коридоре
    if (this.state === 'ask') { const c = clicks.find(c => c.y > 24 + h); if (c) { const wx = c.x + this.cam; const i = this.cur.doors.findIndex(d => Math.abs(d - wx) < 20); if (i >= 0) { clicks.splice(clicks.indexOf(c), 1); this.choose(i); } } }
    if (this.state === 'ask') { for (let i = 0; i < q.answers.length; i++) if (hit('a' + i)) this.choose(i); if (hit('up')) this.pick = (this.pick + q.answers.length - 1) % q.answers.length; if (hit('down')) this.pick = (this.pick + 1) % q.answers.length; if (hit('act') && this.pick >= 0) this.choose(this.pick); }
  },
  drawFeedback() {
    const f = this.fb, lines = wrapText(f.text, 340, 6).slice(0, 6), h = 34 + lines.length * 9 + (f.ok ? 0 : 11) + 24;
    frameBox(24, 40, 352, h, .96);
    text(f.ok ? L(UI.qzOk) : L(UI.qzNo), W / 2, 48, { align: 'center', col: f.ok ? '#7fe08a' : '#e98f6f' });
    if (f.ok) sprite(QZ.page, W / 2 - 4, 60);
    lines.forEach((l, i) => text(l, W / 2, 72 + i * 9, { align: 'center', col: '#f4f3ee', size: 6 }));
    if (!f.ok) text(L(UI.qzLonger), W / 2, 72 + lines.length * 9 + 1, { align: 'center', col: '#f2c94c', size: 6 });
    if (button(L(UI.next), W / 2, 40 + h - 20, 'primary') || hit('act')) this.next();
  },
  drawIntro() {
    rect(0, 0, W, H, 'rgba(10,12,20,.6)'); frameBox(40, 34, 320, 150, .96);
    ctx.save(); ctx.translate(58, 70); ctx.scale(3, 3); sprite(chibiSprite(BUMAZHKIN, 'idle'), 0, 0); ctx.restore();
    // портфель Бумажкина и разлетающиеся страницы
    rect(108, 118, 14, 10, '#5a3a2a'); rect(112, 115, 6, 3, '#3a2a1a');
    for (let i = 0; i < 4; i++) sprite(QZ.page, 96 + i * 8 + Math.round(Math.sin(this.t / 300 + i) * 3), 96 - i * 11 + Math.round(Math.cos(this.t / 260 + i) * 2));
    text(L(UI.qzTitle), 230, 44, { align: 'center', col: '#f2c94c' });
    wrapText(L(UI.qzIntro).replace('{n}', this.total), 200, 6).slice(0, 9).forEach((l, i) => text(l, 140, 60 + i * 9, { col: '#f4f3ee', size: 6 }));
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
