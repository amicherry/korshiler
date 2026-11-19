/* ===================== Викторина «Знаток ЖКХ» =====================
   Аркада в том же подъезде, что и в игре. Бюрократ Бумажкин растащил страницы техпаспорта по этажам.
   Чиби-герой бежит по этажу, перепрыгивает преграды, у дверей квартир — вопрос:
   верная дверь — страница, монеты и этаж выше; неверная — объяснение, тот же этаж ещё раз, вопрос вернётся позже.
   Наверху, на 13 этаже, ждёт Бумажкин.
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

/* ---------- предметы на этаже: тот же стиль, что у подъезда (тёмный контур) ---------- */
function outlined(w, h, draw) {
  return makeCanvas(w, h, P => { draw(P);
    const g = P.g, img = g.getImageData(0, 0, w, h), d = img.data, a = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0, out = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1))) out.push([x, y]);
    for (const [x, y] of out) P.p(x, y, '#0e1011'); });
}
const QZ = { obs: {}, page: null, GY: 186 };
function buildQuizArt() {
  if (QZ.page) return;
  // ведро со шваброй
  QZ.obs.bucket = outlined(16, 22, ({ r, p }) => { r(10, 0, 1, 12, '#8a6a4a'); r(8, 1, 5, 1, '#6a5a4a');
    r(2, 12, 11, 9, '#5f6b74'); r(2, 12, 11, 1, '#8a98a2'); r(3, 13, 1, 7, '#7a8892'); r(11, 13, 1, 7, '#4a545c'); r(3, 14, 9, 2, '#4a6a8a'); r(1, 11, 13, 1, '#3e464c');
    r(8, 10, 5, 3, '#c9c3b0'); p(9, 12, '#a8a290'); r(2, 20, 11, 1, '#3e464c'); });
  // коробки от переезда
  QZ.obs.boxes = outlined(20, 18, ({ r, p }) => { r(1, 7, 18, 11, '#9a6e44'); r(1, 7, 18, 1, '#c09264'); r(1, 8, 1, 10, '#b0845a'); r(18, 8, 1, 10, '#7a5434'); r(9, 7, 2, 11, '#7a5434');
    r(4, 0, 12, 7, '#a87a4e'); r(4, 0, 12, 1, '#c99c6c'); r(9, 0, 2, 7, '#86603c'); r(5, 3, 3, 2, '#d8d2bf'); r(12, 11, 4, 3, '#d8d2bf'); p(13, 12, '#7a7466'); });
  // табличка «мокрый пол»
  QZ.obs.wet = outlined(14, 20, ({ r, p }) => { r(3, 0, 8, 1, '#e8b830'); r(2, 1, 10, 15, '#f2c94c'); r(2, 1, 1, 15, '#fbe39a'); r(11, 1, 1, 15, '#c09a2a');
    r(6, 4, 2, 6, '#1a1424'); r(6, 11, 2, 2, '#1a1424'); r(1, 16, 3, 4, '#b08a1e'); r(10, 16, 3, 4, '#b08a1e'); p(3, 3, '#ffffff'); });
  // крыса (2 кадра)
  const rat = (k) => outlined(16, 9, ({ r, p }) => { r(4, 2, 9, 5, '#5b5f66'); r(5, 2, 7, 1, '#7a7e86'); r(12, 3, 3, 3, '#6b6f76'); p(14, 4, '#e98f8f'); p(13, 3, '#0e1011');
    r(0, k ? 4 : 5, 4, 1, '#8a6a6a'); r(5, 7, 1, 2, '#3a3e46'); r(k ? 9 : 10, 7, 1, 2, '#3a3e46'); p(10, 1, '#8a8e96'); });
  QZ.obs.rat0 = rat(0); QZ.obs.rat1 = rat(1);
  QZ.page = outlined(10, 12, ({ r }) => { r(1, 1, 8, 10, '#f4f3ee'); r(6, 1, 3, 3, '#c9c3b0'); for (let y = 4; y < 10; y += 2) r(2, y, 5, 1, '#8a8478'); });
  QZ.folder = outlined(18, 14, ({ r }) => { r(1, 3, 16, 10, '#3f6f8c'); r(1, 1, 7, 3, '#3f6f8c'); r(1, 3, 16, 1, '#6a9ab8'); r(3, 6, 12, 1, '#f4f3ee'); r(3, 8, 9, 1, '#c9d6e6'); });
}
const QZ_SPEED = .115, QZ_JUMP = -.34, QZ_G = .0011, QZ_STOP = 300;
// подъезд викторины: тот же, что в игре (13 этажей, по 4 квартиры с каждой стороны)
function quizStairwell() {
  const R = rng(4242), look = {}; for (let apt = 1; apt <= APTS; apt++) look[apt] = pick(R, DOOR_STYLES);
  return { bg: drawStairwell(HOUSE.floors, apt => look[apt], new Set(HOUSE_STATE.fixed)), look };
}

/* ---------- сцена ---------- */
scenes.quiz = {
  async enter() {
    buildQuizArt(); setTouch({ act: L(UI.qzJump) });
    this.state = 'loading'; this.t = 0; this.coins = 0; this.first = 0; this.done = 0; this.wrong = 0; this.paused = false; this.result = null;
    this.look = Object.assign({}, DEFAULT_LOOK, SAVE.look || {});
    const S = quizStairwell(); this.bg = S.bg; this.doorLook = S.look;
    const d = await loadQuiz(); this.cfg = d;
    const pool = shuffle(d.questions.filter(quizValidQ)); this.total = Math.min(d.questionsPerRun || 8, pool.length, HOUSE.floors - 1);
    this.queue = pool.slice(0, this.total).map(prepQuestion);
    this.startFloor = HOUSE.floors - this.total;                     // 8 вопросов — старт с 5 этажа, финиш на 13
    this.floor = this.startFloor; this.floorsRun = 0; this.newStage(false);
    this.startedAt = Date.now(); this.state = 'intro';
  },
  // этаж: преграды на пути к дверям; на «повторном» этаже (после ошибки) их больше
  newStage(detour) {
    this.hx = 8; this.jy = 0; this.vy = 0; this.trip = 0; this.buffer = 0; this.pick = -1; this.fb = null; this.open = 0; this.floorsRun++;
    const goal = this.done >= this.total || !this.queue.length;
    this.stage = { floor: goal ? HOUSE.floors : this.floor, goal, q: goal ? null : this.queue.shift(), obs: [] };
    const spots = detour ? [70, 140, 290] : pick(Math.random, [[90, 160], [120, 290], [80, 285]]);
    for (const x of spots) this.stage.obs.push({ x: x + Math.round((Math.random() - .5) * 16), kind: pick(Math.random, ['bucket', 'boxes', 'wet', 'rat']), hit: false, mx: 0 });
    if (this.stage.q) this.stage.doors = DOOR_X.slice(-this.stage.q.answers.length);
    this.bx = 430; this.bRun = 0;                                      // Бумажкин на финальном этаже
    this.cam = clamp(this.hx - 110, 0, SW - W);
  },
  base() { return floorBase(this.stage.floor, HOUSE.floors); },
  focus() { return { x: this.hx - this.cam + 9, y: QZ.GY - 12 }; },
  jump() {
    if (this.state !== 'run' || this.trip > 0) return;
    if (this.jy < 0) { if (this.jy > -14 && this.vy > 0) this.buffer = 160; return; }     // нажал чуть раньше приземления — прыгнет сразу после
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
    // прыжок
    if (this.jy < 0 || this.vy < 0) { this.vy += QZ_G * dt; this.jy = Math.min(0, this.jy + this.vy * dt);
      if (this.jy === 0) { this.vy = 0; if (this.buffer > 0) { this.buffer = 0; this.vy = QZ_JUMP; } } }
    this.buffer = Math.max(0, this.buffer - dt); this.trip = Math.max(0, this.trip - dt);
    const st = this.stage;
    if (this.state === 'run' && this.trip === 0) {
      this.hx += QZ_SPEED * dt;
      if (!st.goal && this.hx >= QZ_STOP) { this.hx = QZ_STOP; this.state = 'ask'; this.pick = -1; setTouch({}); beep(660, .06, 'sine', .04); }
      if (st.goal && this.hx >= this.bx - 30 && !this.bRun) { this.bRun = 1; beep(330, .1, 'square', .04); }
      if (st.goal && this.hx >= 400) { this.hx = 400; this.finishRun(); }
      // преграды: попадание — если ноги ниже верха преграды (с запасом в 4 px)
      for (const o of st.obs) {
        if (o.kind === 'rat' && !o.hit && o.x + o.mx - this.hx < 200 && o.mx > -50) o.mx -= .035 * dt;
        const img = QZ.obs[o.kind === 'rat' ? 'rat0' : o.kind], ox = o.x + o.mx;
        if (o.hit || this.hx + 13 < ox + 3 || this.hx + 5 > ox + img.width - 3) continue;
        if (-this.jy < img.height - 4) { o.hit = true; this.trip = 480; this.coins = Math.max(0, this.coins - 2); beep(180, .12, 'sawtooth', .05); }
      }
    }
    if (this.bRun) this.bx += .16 * dt;                               // Бумажкин убегает на крышу, бросив папку
    if (this.state === 'go') {                                          // к выбранной двери
      const tx = st.doors[this.pick] - 9; this.hx = Math.min(tx, this.hx + QZ_SPEED * 1.4 * dt);
      if (this.hx >= tx) { this.state = 'enter'; this.et = 0; beep(300, .08, 'square', .04); }
    }
    if (this.state === 'enter') { this.et += dt; this.open = Math.min(1, this.et / 280); if (this.et > 700 && !this.fb) this.answer(); }
    this.cam = lerp(this.cam, clamp(this.hx - 110, 0, SW - W), Math.min(1, dt / 160));
  },
  choose(i) { if (this.state !== 'ask') return; this.pick = i; this.state = 'go'; },
  answer() {
    const q = this.stage.q, ok = this.pick === q.correct; q.tries = (q.tries || 0) + 1;
    if (ok) { const c = q.tries === 1 ? (this.cfg.coinsFirstTry ?? 20) : (this.cfg.coinsRetry ?? 5); this.coins += c; this.done++; if (q.tries === 1) this.first++;
      this.fb = { ok: true, text: L(UI.qzRight).replace('{c}', c).replace('{n}', this.done).replace('{t}', this.total) }; sfx.stamp && sfx.stamp(); }
    else { this.wrong++; const q2 = prepQuestion(q.src); q2.tries = q.tries; this.queue.push(q2);
      this.fb = { ok: false, text: L(UI.qzWrong).replace('{a}', 'ABCD'[q.correct] + ' — ' + L(q.answers[q.correct])) + (q.explain ? ' ' + L(q.explain) : '') }; beep(160, .2, 'sawtooth', .05); }
    this.state = 'feedback'; setTouch({ act: L(UI.next) });
  },
  next() {
    if (this.state !== 'feedback') return;
    const ok = this.fb.ok; this.state = 'trans';
    // пиксельный переход: верно — этаж выше, неверно — тот же этаж ещё раз
    irisTo(this.hx - this.cam + 9, QZ.GY - 12, () => { if (ok) this.floor = Math.min(HOUSE.floors - 1, this.startFloor + this.done); this.newStage(!ok);
      irisFrom(this.hx - this.cam + 9, QZ.GY - 12); this.state = 'run'; setTouch({ act: L(UI.qzJump) }); });
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
  draw(dt) {
    if (this.state === 'loading') { rect(0, 0, W, H, '#0b0c10'); return; }
    const st = this.stage, cx = Math.round(this.cam), b = this.base(), cy = b - QZ.GY, t = performance.now();
    ctx.save(); ctx.translate(-cx, 0);
    ctx.drawImage(this.bg, 0, -cy);
    // лампы этажа — как в игре: до ремонта света мигают
    const fixedLight = HOUSE_STATE.fixed.includes('light');
    for (const [li, lx] of [[0, 49], [1, 141], [2, 351], [3, 443]]) {
      const on = fixedLight || Math.sin(t / 97 + st.floor * 13 + li * 5) > -.75, y = QZ.GY;
      rect(lx, y - 94, 1, 6, '#0e1011'); rect(lx - 5, y - 88, 11, 4, '#1c1f24'); rect(lx - 3, y - 85, 7, 3, on ? '#fff1b8' : '#4b4f4c');
      if (on) { if (!this.glow) this.glow = makeCanvas(220, 94, ({ g }) => { const gr = g.createRadialGradient(110, 10, 2, 110, 44, 110); gr.addColorStop(0, 'rgba(255,214,140,.30)'); gr.addColorStop(.5, 'rgba(255,190,110,.10)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, 220, 94); });
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fixedLight ? 1 : .8; ctx.drawImage(this.glow, lx - 110, y - 94); ctx.restore(); }
    }
    // двери-ответы: свет под дверью, табличка с буквой; выбранная открывается, как у жильцов в игре
    if (st.doors) st.doors.forEach((x, i) => {
      const apt = (st.floor - 1) * DOOR_X.length + DOOR_X.indexOf(x) + 1, y = QZ.GY, sel = this.pick === i && ['enter', 'feedback', 'trans'].includes(this.state);
      if (sel) { const ow = Math.round(26 * this.open);
        rect(x - 13, y - 48, 26, 48, '#2a2018'); ctx.fillStyle = 'rgba(242,198,106,.5)'; ctx.fillRect(x - 13, y - 48, 26, 48);
        rect(x - 10, y - 40, 3, 12, '#5a3a2a'); rect(x - 11, y - 41, 5, 1, '#3a2a1a');                                // вешалка в прихожей
        const dw = Math.max(3, 26 - ow); rect(x + 13 - dw, y - 48, dw, 48, this.doorLook[apt].col); rect(x + 13 - dw, y - 48, 1, 48, '#0e0f12');
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(242,198,106,.14)'; ctx.beginPath(); ctx.moveTo(x - 13, y); ctx.lineTo(x + 13, y); ctx.lineTo(x + 34, y + 1); ctx.lineTo(x - 34, y + 1); ctx.fill(); ctx.restore();
      } else { rect(x - 11, y - 2, 22, 1, '#f2d27a'); ctx.fillStyle = 'rgba(242,210,122,.22)'; ctx.fillRect(x - 13, y - 1, 26, 1); }
      const lit = this.state === 'ask' || this.pick === i;
      rect(x - 7, y - 64, 14, 12, '#0e1011'); rect(x - 6, y - 63, 12, 10, lit ? '#f2c94c' : '#b8b2a0'); rect(x - 6, y - 63, 12, 1, lit ? '#fbe39a' : '#d8d2bf');
      text('ABCD'[i], x, y - 62, { align: 'center', col: '#1a1424', size: 8 });
    });
    // преграды
    for (const o of st.obs) { const img = o.kind === 'rat' ? QZ.obs[(this.t / 110 | 0) % 2 ? 'rat0' : 'rat1'] : QZ.obs[o.kind];
      sprite(img, o.x + o.mx, QZ.GY - img.height + 1, o.kind === 'rat', o.hit ? .4 : 1); }
    // финал: Бумажкин с папкой у выхода на крышу
    if (st.goal) { if (!this.bRun) { sprite(chibiSprite(BUMAZHKIN, 'idle'), this.bx, QZ.GY - 23, true); sprite(QZ.folder, this.bx - 12, QZ.GY - 20); }
      else { if (this.bx < SW + 20) sprite(chibiSprite(BUMAZHKIN, 'run' + ((this.t / 70 | 0) % 4)), this.bx, QZ.GY - 23); sprite(QZ.folder, 404, QZ.GY - 14); } }
    // чиби
    const fr = this.trip > 0 ? 'trip' : this.jy < 0 ? 'jump' : ['run', 'go'].includes(this.state) ? 'run' + ((this.t / 85 | 0) % 4) : 'idle';
    const alpha = this.state === 'enter' ? clamp(1 - (this.et - 300) / 300, 0, 1) : ['feedback', 'trans'].includes(this.state) ? 0 : (this.trip > 0 && (this.t / 80 | 0) % 2 ? .5 : 1);
    if (alpha > 0) { rect(this.hx + 3, QZ.GY - 1, 12, 2, 'rgba(0,0,0,.35)'); sprite(chibiSprite(this.look, fr), this.hx, QZ.GY - 23 + Math.round(this.jy), false, alpha); }
    ctx.restore();
    // HUD: страницы, монеты, этаж
    rect(0, 0, W, 20, 'rgba(11,12,16,.88)');
    if (button('II', 0, 2, 'dark', { left: 2, w: 16 })) this.paused = true;
    for (let i = 0; i < this.total; i++) sprite(QZ.page, 24 + i * 11, 4, false, i < this.done ? 1 : .22);
    text(`₸${this.coins}`, 24 + this.total * 11 + 6, 6, { col: '#f2c94c', size: 6 });
    text(`${L(UI.qzFloor)} ${st.floor}/${HOUSE.floors}`, 392, 6, { col: '#cfd6e4', size: 6, align: 'right' });
    if (['ask', 'go', 'enter'].includes(this.state) && st.q) this.drawCard(st.q);
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
      const c = clicks.find(c => c.y > 24 + h); if (c) { const wx = c.x + this.cam, i = this.stage.doors.findIndex(d => Math.abs(d - wx) < 18); if (i >= 0) { clicks.splice(clicks.indexOf(c), 1); this.choose(i); } }
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
    rect(0, 0, W, H, 'rgba(10,12,20,.62)'); frameBox(40, 34, 320, 150, .96);
    // Бумажкин с папкой, вокруг кружат страницы
    rect(56, 64, 70, 70, '#161a22'); rect(56, 128, 70, 6, '#2a2e36');
    ctx.save(); ctx.translate(70, 76); ctx.scale(2, 2); sprite(chibiSprite(BUMAZHKIN, 'idle' ), 0, 0); ctx.restore();
    sprite(QZ.folder, 92, 112);
    for (let i = 0; i < 5; i++) { const a = this.t / 700 + i * 1.26; sprite(QZ.page, 86 + Math.round(Math.cos(a) * 26), 92 + Math.round(Math.sin(a) * 18)); }
    text(L(UI.qzTitle), 240, 44, { align: 'center', col: '#f2c94c' });
    wrapText(L(UI.qzIntro).replace('{n}', this.total), 200, 6).slice(0, 10).forEach((l, i) => text(l, 140, 60 + i * 9, { col: '#f4f3ee', size: 6 }));
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
