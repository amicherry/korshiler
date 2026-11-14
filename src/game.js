/* ============================================================
   ИГРА: mock-сервер, диалоги, сцены
   ============================================================ */

/* ---------- Mock API: тот же набор запросов, что будет у настоящего сервера ---------- */
const API = {
  async auth() {
    // Из приложения E-KNOT придёт ?token=… и имя; здесь — гость или ?name=Әмина для демонстрации входа
    const q = new URLSearchParams(location.search);
    let uid = loadStr('d67_uid', ''); if (!uid) { uid = 'guest-' + Math.floor(Math.random() * 1e9); saveStr('d67_uid', uid); }
    return { userId: uid, name: q.get('name') || null, fromApp: q.has('token') };
  },
  async load() { try { return JSON.parse(loadStr('d67_save', 'null')); } catch (e) { return null; } },
  async save(s) { saveStr('d67_save', JSON.stringify(s)); },
  async tourStart(id) { return { run: id + '-' + Date.now(), at: Date.now() }; },
  // сервер сам пересчитывает итог по событиям, а не верит числу из игры
  async tourFinish(run, events, tour) {
    const signed = new Set();
    for (const e of events) if (e.t === 'yes') signed.add(e.apt);
    const n = signed.size, ok = n >= tour.goal;
    return { signatures: n, online: events.filter(e => e.t === 'yes' && e.via === 'online').length, success: ok, coins: n * 5 + (ok ? 25 : 0) };
  },
};
let USER = null, SAVE = null;
const DEFAULT_LOOK = { skin: '#e3ad86', hair: 'short', hairCol: '#2b2420', top: 'hoodie', topCol: '#2f8577', hat: null };
function persist() { API.save(SAVE); }

/* ---------- Диалоги в стиле Undertale ---------- */
const DLG = { open: false, name: '', port: null, voice: 400, text: '', shown: 0, choices: null, cursor: 0, resolve: null, expr: 'neutral', mood: null, blipAt: 0 };
function dlgOpen(name, port, voice = 400, mood = null) { Object.assign(DLG, { open: true, name, port, voice, mood, text: '', shown: 0, choices: null }); }
function dlgClose() { DLG.open = false; DLG.choices = null; DLG.resolve = null; }
// длинная реплика делится на страницы по 5 строк — ничего не обрезается
const DLG_LINES = 5, DLG_TW = 320;
function sayPage(t, expr) { return new Promise(res => Object.assign(DLG, { text: t, shown: 0, choices: null, expr, resolve: res })); }
async function say(t, expr = 'neutral') {
  const lines = wrapText(t, DLG_TW);
  for (let i = 0; i < lines.length; i += DLG_LINES) await sayPage(lines.slice(i, i + DLG_LINES).join(' '), expr);
}
function ask(opts) { return new Promise(res => Object.assign(DLG, { shown: DLG.text.length, choices: opts, cursor: 0, resolve: res })); }
const CH = { x0: 64, colW: 162, y0: 146, rowH: 18, bw: 156, bh: 16 };
function dlgUpdate(dt) {
  if (!DLG.open || !DLG.resolve) return;
  if (DLG.choices) {
    const n = DLG.choices.length;
    if (hit('right')) { DLG.cursor = (DLG.cursor + 1) % n; sfx.select(); }
    if (hit('left')) { DLG.cursor = (DLG.cursor + n - 1) % n; sfx.select(); }
    if (hit('down')) { DLG.cursor = (DLG.cursor + 2) % n; sfx.select(); }
    if (hit('up')) { DLG.cursor = (DLG.cursor + n - 2) % n; sfx.select(); }
    for (let i = 0; i < n; i++) {
      const x = CH.x0 + (i % 2) * CH.colW, y = CH.y0 + Math.floor(i / 2) * CH.rowH;
      if (clickIn(x - 1, y - 1, CH.bw + 2, CH.bh + 2)) { DLG.cursor = i; return choose(); }
    }
    if (hit('act')) return choose();
    return;
  }
  const len = DLG.text.length;
  if (DLG.shown < len) {
    DLG.shown = Math.min(len, DLG.shown + dt * .06);
    DLG.blipAt -= dt; if (DLG.blipAt <= 0) { sfx.blip(DLG.voice + Math.random() * 40); DLG.blipAt = 55; }
  }
  if (hit('act') || clickIn(6, 140, W - 12, 82)) {
    if (DLG.shown < len) DLG.shown = len; else { const r = DLG.resolve; DLG.resolve = null; r(); }
  }
  function choose() { const r = DLG.resolve, c = DLG.cursor; DLG.resolve = null; DLG.choices = null; sfx.select(); r(c); }
}
function dlgDraw() {
  if (!DLG.open) return;
  const x = 6, y = 140, w = W - 12, h = 82;
  rect(x, y, w, h, '#f4f3ee'); rect(x + 2, y + 2, w - 4, h - 4, '#0b0c10');
  // портрет
  rect(x + 7, y + 8, 44, 44, '#f4f3ee'); rect(x + 8, y + 9, 42, 42, '#20222b');
  if (DLG.port) sprite(DLG.port(DLG.expr), x + 9, y + 10);
  // имя под портретом: длинные имена — мельче и в две строки
  if (textW(DLG.name) <= 52) text(DLG.name, x + 29, y + 56, { align: 'center', col: '#f2c94c' });
  else { const parts = DLG.name.split(' '); parts.slice(0, 2).forEach((s, i) => text(s.slice(0, 9), x + 29, y + 55 + i * 9, { align: 'center', col: '#f2c94c', size: 6 })); }
  // текст
  if (!DLG.choices) wrapText(DLG.text.slice(0, Math.floor(DLG.shown)), DLG_TW).slice(0, DLG_LINES).forEach((l, i) => text(l, x + 58, y + 9 + i * 12));
  if (!DLG.choices && DLG.shown >= DLG.text.length && DLG.resolve) { if (Math.floor(performance.now() / 300) % 2) rect(x + w - 14, y + h - 12, 6, 4, '#f2c94c'); }
  if (DLG.choices) {
    // варианты — крупные кнопки в две колонки, нажимаются пальцем
    const rowsN = Math.ceil(DLG.choices.length / 2), y0 = y + Math.round((h - rowsN * CH.rowH) / 2) + 1;
    CH.y0 = y0;
    DLG.choices.forEach((c, i) => {
      const cx = CH.x0 + (i % 2) * CH.colW, cy = y0 + Math.floor(i / 2) * CH.rowH, sel = i === DLG.cursor;
      rect(cx, cy, CH.bw, CH.bh, sel ? '#f2c94c' : '#1d2130'); rect(cx, cy + CH.bh - 2, CH.bw, 2, sel ? '#b8902a' : '#11141d');
      rect(cx, cy, CH.bw, 1, sel ? '#ffe28a' : '#3a4157');
      const sz = textW(c.label) > CH.bw - 8 ? 6 : 8;
      text(c.label, cx + CH.bw / 2, cy + (sz === 8 ? 4 : 5), { align: 'center', size: sz, col: sel ? '#1b1a21' : (c.dim ? '#7d8394' : '#f4f3ee') });
    });
  }
  // настрой жильца
  if (DLG.mood) {
    const m = clamp(DLG.mood(), 0, 100), bx = 268, by = 128, bw = 118;
    rect(bx - 2, by - 2, bw + 4, 10, '#0b0c10'); rect(bx, by, bw, 6, '#2b2a33');
    const col = m < 30 ? '#d9534f' : m < 60 ? '#f2c94c' : '#4caf6e';
    rect(bx, by, Math.round(bw * m / 100), 6, col);
    rect(bx + Math.round(bw * .7), by - 2, 1, 10, '#f4f3ee');
  }
}

/* ---------- плавающие подписи (над дверями) ---------- */
const POPS = [];
function pop(x, y, s, col = '#f4f3ee') { POPS.push({ x, y, s, col, t: 0 }); }
function drawPops(dt, ox = 0, oy = 0) {
  for (const P of POPS) { P.t += dt; const a = Math.max(0, 1 - P.t / 1600); ctx.globalAlpha = a; text(P.s, P.x - ox, P.y - oy - P.t / 60, { col: P.col, align: 'center', shadow: '#0b0c10' }); ctx.globalAlpha = 1; }
  for (let i = POPS.length - 1; i >= 0; i--) if (POPS[i].t > 1600) POPS.splice(i, 1);
}

/* ---------- мелкие спрайты подъезда ---------- */
const PIXPAL = { k: '#2b2a33', g: '#8f949c', l: '#d8dad6', n: '#e79aa6', e: '#e9a23b', w: '#f4f3ee', c: '#5b8bd6' };
const fromRows = rows => makeCanvas(Math.max(...rows.map(r => r.length)), rows.length, ({ p }) => rows.forEach((row, y) => [...row].forEach((ch, x) => PIXPAL[ch] && p(x, y, PIXPAL[ch]))));
const RAT = [fromRows(["....kk..........", "...knnk.........", "..kgggkkkkkk....", ".kgkgggggggkk...", "nkggggggggggk...", ".kkgggggggggk.kk", "...kgk..kgk.kkk.", "...kk...kk......"]),
             fromRows(["....kk..........", "...knnk.........", "..kgggkkkkkk....", ".kgkgggggggkk...", "nkggggggggggk...", ".kkgggggggggk.kk", "....kgkkgk..kkk.", "....kk..kk......"])];
const CAT = fromRows(["k...k....", "kkkkk....", "kekek....", "kkkkk....", ".kkkk...k", ".kkkkk.k.", ".kkkkkk..", ".kk.kk..."]);
const PLANE = fromRows(["w.....", "www...", "wwwww.", "www...", "w....."]);

/* ============================================================
   СЦЕНА: титульный экран + настройки
   ============================================================ */
scenes.title = {
  enter() { this.settings = false; this.sure = false; this.done = false; setTouch({ act: L(UI.next) }); document.getElementById('rotate').textContent = L(UI.rotate); },
  update() {
    if (this.settings) { if (hit('back')) this.settings = false; return; }
    if (hit('act')) this.start();
  },
  start() {
    // пролог показываем один раз; «Продолжить» ведёт сразу в подъезд
    irisTo(60, 140, () => go(!(SAVE && SAVE.created) ? 'creator' : (SAVE.seenIntro || SAVE.tours.t1) ? 'tour' : 'prologue', { tour: 't1' }));
  },
  draw(dt) {
    drawNight(dt);
    // название слева, на фоне неба
    const tw = textW(L(UI.title), 16);
    text(L(UI.title), 18, 22, { size: 16, col: '#f4f3ee', shadow: '#0b0c10' });
    rect(18, 42, tw, 2, '#ff6a45'); rect(18, 44, tw, 1, '#7a2a1e');
    text(L(UI.subtitle), 18, 52, { col: '#f2c94c', shadow: '#0b0c10', size: 6 });
    text(L(UI.by), 18, 64, { col: '#9fd9c2', size: 6, shadow: '#0b0c10' });
    if (this.settings) return this.drawSettings();
    // панель меню в рамке
    const bw = Math.max(textW(L(UI.cont)), textW(L(UI.settings)), 96) + 16, py = SAVE && SAVE.name ? 112 : 124;
    frameBox(12, py, bw + 12, 196 - py - 8);
    if (SAVE && SAVE.name) text(L(UI.hello) + SAVE.name + '!', 18, py + 7, { col: '#cfd6e4', size: 6 });
    if (button(SAVE && SAVE.created ? L(UI.cont) : L(UI.play), 0, 140, 'primary', { left: 18, w: bw })) this.start();
    if (button(L(UI.settings), 0, 162, 'alt', { left: 18, w: bw })) { this.settings = true; this.sure = false; }
  },
  drawSettings() {
    rect(0, 0, W, H, 'rgba(11,12,16,.55)');
    paper(70, 30, 260, 170, 2);
    text(L(UI.settings), W / 2, 42, { align: 'center', col: INK_RED });
    text(L(UI.lang), W / 2, 62, { align: 'center', col: INK });
    if (button('ҚАЗАҚША', W / 2 - 56, 76, LANG === 'kz' ? 'primary' : 'off')) setLang('kz');
    if (button('РУССКИЙ', W / 2 + 56, 76, LANG === 'ru' ? 'primary' : 'off')) setLang('ru');
    text(L(UI.sound), W / 2, 100, { align: 'center', col: INK });
    if (button(SND.on ? L(UI.on) : L(UI.off), W / 2, 114, SND.on ? 'alt' : 'off')) { SND.on = !SND.on; saveStr('d67_sound', SND.on ? '1' : '0'); }
    if (button(this.done ? L(UI.resetDone) : this.sure ? L(UI.resetSure) : L(UI.reset), W / 2, 144, this.done ? 'off' : 'danger')) {
      if (this.done) {} else if (!this.sure) this.sure = true; else { SAVE = { created: false, coins: 0, tours: {}, trust: {} }; persist(); this.done = true; }
    }
    if (button(L(UI.back), W / 2, 176, 'alt')) this.settings = false;
  },
};
function setLang(l) { LANG = l; saveStr('d67_lang', l); document.getElementById('rotate').textContent = L(UI.rotate); }

/* ============================================================
   СЦЕНА: создание персонажа
   ============================================================ */
const OPT = {
  skin: ['#f1c7a3', '#e3ad86', '#c98e66', '#9a6748'],
  hair: ['short', 'long', 'bun', 'curly', 'bald'],
  hairCol: ['#2b2420', '#4a2e22', '#a5503c', '#d9b43a', '#8f949c'],
  top: ['hoodie', 'shirt', 'jacket', 'leather', 'chapan'],
  topCol: ['#2f8577', '#3f6f8c', '#b8443f', '#c79a3b', '#5d6b5a', '#7d4f8a'],
  hat: [null, 'tyube', 'cap'],
};
const OPT_ROWS = ['skin', 'hair', 'hairCol', 'top', 'topCol', 'hat'];
scenes.creator = {
  enter() {
    this.look = Object.assign({}, DEFAULT_LOOK, SAVE.look || {}); this.row = 0; this.t = 0;
    const box = document.getElementById('nameBox'), inp = document.getElementById('nameInput');
    inp.value = SAVE.name || USER.name || ''; inp.placeholder = LANG === 'kz' ? 'Атың' : 'Имя'; box.hidden = false;
    setTouch({ act: L(UI.ready), up: true, down: true });
  },
  leave() { document.getElementById('nameBox').hidden = true; },
  focus() { return { x: 100, y: 120 }; },
  update(dt) {
    this.t += dt;
    const box = document.getElementById('nameBox'), r = cv.getBoundingClientRect();
    box.style.left = (r.left + r.width * (282 / W)) + 'px'; box.style.top = (r.top + r.height * (30 / H)) + 'px';
    document.getElementById('nameInput').style.width = Math.round(r.width * (200 / W)) + 'px';
    if (hit('up')) { this.row = (this.row + OPT_ROWS.length) % (OPT_ROWS.length + 1); sfx.select(); }
    if (hit('down')) { this.row = (this.row + 1) % (OPT_ROWS.length + 1); sfx.select(); }
    if (this.row < OPT_ROWS.length) { if (hit('left')) this.change(OPT_ROWS[this.row], -1); if (hit('right')) this.change(OPT_ROWS[this.row], 1); }
    if (hit('act') && (this.row === OPT_ROWS.length || isTouch || document.activeElement === document.getElementById('nameInput'))) this.done();
  },
  change(k, d) { const a = OPT[k], i = a.indexOf(this.look[k] ?? null); this.look[k] = a[(i + d + a.length) % a.length]; sfx.select(); },
  done() {
    const name = (document.getElementById('nameInput').value || '').trim().slice(0, 12) || (LANG === 'kz' ? 'Төраға' : 'Председатель');
    SAVE.name = name; SAVE.look = this.look; SAVE.created = true; persist(); this.leave();
    irisTo(100, 120, () => go('prologue'));
  },
  draw() {
    rect(0, 0, W, H, '#2a3348');
    for (let y = 0; y < H; y += 8) rect(0, y, W, 1, 'rgba(255,255,255,.03)');
    paper(16, 14, 168, 196, 5);
    text(L(UI.creator), 100, 24, { align: 'center', col: INK_RED });
    const fr = ['idle0', 'idle1'][Math.floor(this.t / 500) % 2];
    ctx.save(); ctx.translate(73, 34); ctx.scale(3, 3); ctx.drawImage(personSprite(this.look, fr), 0, 0); ctx.restore();
    sprite(portrait(this.look, 'happy'), 26, 162);
    text(L(UI.hello).trim(), 74, 172, { col: INK }); text((document.getElementById('nameInput').value || '…').slice(0, 12), 74, 186, { col: INK_TEAL });
    text(L(UI.name), 200, 22, { col: '#f2c94c' });
    OPT_ROWS.forEach((k, i) => {
      const y = 62 + i * 19, sel = this.row === i;
      if (sel) rect(194, y - 3, 200, 17, 'rgba(242,201,76,.15)');
      text(L(UI[k]), 200, y + 2, { col: sel ? '#f2c94c' : '#f4f3ee' });
      if (button('◂', 0, y - 2, 'dark', { left: 300, w: 16 })) { this.row = i; this.change(k, -1); }
      if (button('▸', 0, y - 2, 'dark', { left: 372, w: 16 })) { this.row = i; this.change(k, 1); }
      const v = this.look[k] ?? null;
      if (k === 'skin' || k === 'hairCol' || k === 'topCol') { rect(322, y, 44, 12, OUT); rect(323, y + 1, 42, 10, v); }
      else { const names = { short: 'Қысқа|Короткие', long: 'Ұзын|Длинные', bun: 'Түйін|Пучок', bald: 'Жоқ|Нет', curly: 'Бұйра|Кудри', leather: 'Күртеше|Куртка', hoodie: 'Худи|Худи', shirt: 'Көйлек|Рубашка', jacket: 'Пиджак|Пиджак', chapan: 'Шапан|Чапан', tyube: 'Тақия|Тюбетейка', cap: 'Кепка|Кепка', null: '—|—' };
        const s = (names[v] || '—|—').split('|')[LANG === 'kz' ? 0 : 1]; text(s, 344, y + 2, { align: 'center', col: '#9fd9c2', size: s.length > 6 ? 6 : 8 }); }
    });
    if (button(L(UI.ready), 296, 190, 'primary', { selected: this.row === OPT_ROWS.length })) this.done();
  },
};

/* ============================================================
   СЦЕНА: пролог
   ============================================================ */
scenes.prologue = {
  enter() {
    this.t = 0; this.hx = -20; this.goal = 150; this.dir = 1; setTouch({ act: L(UI.next) });
    this.run();
  },
  focus() { return { x: W / 2, y: 150 }; },
  async run() {
    await new Promise(r => { this.arrived = r; });
    dlgOpen('E-KNOT', () => EKNOT_PORT, 900);
    await say(L(UI.pushOSI));
    dlgOpen(SAVE.name, e => portrait(SAVE.look, e), 420);
    await say(L(UI.heroIntro1), 'sad');
    await say(L(UI.heroIntro2), 'happy');
    dlgClose();
    SAVE.seenIntro = true; persist();
    this.goal = STREET_DOOR_X; await new Promise(r => { this.arrived = r; });
    irisTo(STREET_DOOR_X, 160, () => go('tour', { tour: 't1' }));
  },
  update(dt) {
    this.t += dt; dlgUpdate(dt);
    const d = this.goal - this.hx;
    if (Math.abs(d) > .5) { this.hx += Math.sign(d) * Math.min(Math.abs(d), dt * .07); this.moving = true; }
    else if (this.moving) { this.moving = false; const a = this.arrived; this.arrived = null; a && a(); }
  },
  draw(dt) {
    drawStreet(dt, this.t);
    const fr = this.moving ? 'walk' + (Math.floor(this.t / 130) % 4) : 'idle' + (Math.floor(this.t / 500) % 2);
    sprite(personSprite(SAVE.look, fr), Math.round(this.hx) - 9, STREET_GROUND - PH);
    dlgDraw();
  },
};

/* ============================================================
   СЦЕНА: ТУР — обход подъезда
   ============================================================ */
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function makeResidents(tour, seed) {
  const R = rng(seed), pool = tour.mix.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  // раскладываем по этажам так, чтобы на одном этаже не было двух одинаковых жильцов,
  // а одинаковые типы не скапливались на соседних этажах
  const apts = []; for (let apt = 1; apt <= tour.floors * tour.perFloor; apt++) if (apt !== tour.heroApt) apts.push(apt);
  const fl = apt => Math.ceil(apt / tour.perFloor);
  let mix = null, bestCost = 1e9;
  for (let attempt = 0; attempt < 40 && bestCost > 0; attempt++) {
    const left = pool.slice(), order = apts.slice().sort(() => R() - .5), put = {}, onFloor = {};
    for (const apt of order) {
      const f = fl(apt), here = onFloor[f] || (onFloor[f] = []), near = [...(onFloor[f - 1] || []), ...(onFloor[f + 1] || [])];
      const score = a => (here.includes(a) ? 10 : 0) + (near.includes(a) ? 1 : 0) + R() * .5;
      let best = 0; for (let i = 1; i < left.length; i++) if (score(left[i]) < score(left[best])) best = i;
      put[apt] = left.splice(best, 1)[0]; here.push(put[apt]);
    }
    let cost = 0; for (const f in onFloor) cost += onFloor[f].length - new Set(onFloor[f]).size;
    if (cost < bestCost) { bestCost = cost; mix = apts.map(a => put[a]); }
  }
  const seen = {}, vOff = Math.floor(R() * 4);
  const res = {}; let k = 0; const used = new Set();
  for (let apt = 1; apt <= tour.floors * tour.perFloor; apt++) {
    if (apt === tour.heroApt) continue;
    const a = mix[k++], A = ARCH[a];
    let name = pick(R, NAMES[a]); let tries = 0; while (used.has(name) && tries++ < 5) name = pick(R, NAMES[a]); used.add(name);
    const look = Object.assign({}, A.look);
    if (a !== 'apa') look.skin = pick(R, ['#f1c7a3', '#e3ad86', '#d9a77c', '#c98e66']);
    if (!['apa', 'grump'].includes(a)) look.topCol = pick(R, ['#3f6f8c', '#b8443f', '#c79a3b', '#5d6b5a', '#7d4f8a', '#2f8577', '#9aa0a5']);
    if (a === 'mom' || a === 'renter') look.hair = pick(R, ['bun', 'long']);
    if (a === 'apa') look.scarfCol = pick(R, ['#c8414a', '#3f6f8c', '#4f7a4a', '#7d4f8a']);
    const away = !A.renter && a !== 'apa' && !A.sleeper && R() < tour.awayShare;
    const trust = (SAVE.trust && SAVE.trust[apt]) || 0;
    res[apt] = { apt, arch: a, A, name, look, mood: A.mood + trust + Math.round((R() - .5) * 8), status: A.renter ? 'unknown' : 'unknown',
      away, returnAt: tour.start + 8 + Math.floor(R() * 34) + (R() < .2 ? 999 : 0), knocks: 0, listened: false, v: (seen[a] = (seen[a] || 0) + 1) + vOff, last: {}, sleeping: !!A.sleeper, door: 0, met: false,
      floor: Math.ceil(apt / tour.perFloor), d: (apt - 1) % tour.perFloor };
  }
  return res;
}

scenes.tour = {
  enter(data) {
    const tour = this.tour = TOURS[data.tour || 't1'];
    this.res = makeResidents(tour, hashStr(USER.userId + tour.id) + (SAVE.tours[tour.id]?.tries || 0));
    const R = rng(hashStr(USER.userId) + 9);
    this.doorLook = {}; for (let apt = 1; apt <= 20; apt++) this.doorLook[apt] = pick(R, DOOR_STYLES);
    this.doorLook[tour.heroApt] = { col: '#2f6f62', kind: 'metal' };
    this.bg = drawStairwell(tour.floors, apt => this.doorLook[apt]);
    this.WH = this.bg.height;
    const hf = Math.ceil(tour.heroApt / tour.perFloor);
    this.hero = { x: DOOR_X[(tour.heroApt - 1) % tour.perFloor] + 20, floor: hf, y: floorBase(hf, tour.floors), dir: -1, walkT: 0, moving: false, climb: null, knockT: 0 };
    this.minute = tour.start; this.end = tour.start + tour.duration;
    this.events = []; this.raccoon = tour.raccoon; this.busy = false; this.ballot = false; this.goalShown = false; this.over = false;
    this.camY = clamp(this.hero.y - 165, 0, this.WH - H);
    this.talker = { floor: tour.talkerFloor, x: 112, done: false, look: { skin: '#d6a07a', hair: 'short', hairCol: '#3a2a20', top: 'hoodie', topCol: '#3b3f55', pants: '#2b2a33', hat: 'cap', capCol: '#3f6f8c', beard: true } };
    this.helper = { state: 'hidden', floor: 2, x: 104, look: { skin: '#e3ad86', hair: 'long', hairCol: '#1b1a21', top: 'jacket', topCol: '#7d4f8a' } };
    this.rats = [{ x: 170, dir: 1, t: 0, st: 'roam', k: 0, pause: 0 }, { x: 300, dir: -1, t: 300, st: 'roam', k: 0, pause: 0 }];
    this.racAnim = null; this.lampSeed = Math.random() * 1000; this.stepAcc = 0;
    API.tourStart(tour.id).then(r => this.run = r);
    this.plan = null;
    setTimeout(() => { toast('E-KNOT', L(UI.tutTap)); setTimeout(() => !this.over && toast('E-KNOT', L(UI.tut1)), 4500); }, 600);
  },
  focus() { return { x: this.hero.x, y: this.hero.y - this.camY - 14 }; },
  signatures() { return Object.values(this.res).filter(r => r.status === 'yes').length; },
  addTime(m) { this.minute += m; },
  base(f) { return floorBase(f, this.tour.floors); },
  nearDoor() { const h = this.hero; if (h.climb) return null; for (let d = 0; d < 4; d++) if (Math.abs(h.x - DOOR_X[d]) < 12) return (h.floor - 1) * 4 + d + 1; return null; },
  nearNPC() {
    const h = this.hero; if (h.climb) return null;
    if (this.helper.state === 'shown' && h.floor === this.helper.floor && Math.abs(h.x - this.helper.x) < 16) return 'helper';
    return null;
  },

  update(dt) {
    if (this.over) return;
    dlgUpdate(dt);
    const h = this.hero, T = this.tour;
    // время идёт, пока игрок ходит (в диалоге и в бюллетене — пауза)
    if (!this.busy && !this.ballot && !trans.phase) this.minute += dt / 1000 / T.secPerMin;
    if (this.minute >= this.end && !this.busy) { this.finish(true); return; }
    // помощница возвращается с результатом
    if (this.helper.state === 'busy' && this.minute >= this.helper.doneAt) this.helperDone();
    if (this.helper.state === 'hidden' && this.signatures() >= T.helperAfter) this.helper.state = 'shown';
    // крысы
    this.updateRats(dt);
    if (this.racAnim) { this.racAnim.t += dt; if (this.racAnim.t > 1800) this.racAnim = null; }

    if (this.ballot) { if (hit('ballot') || hit('back') || hit('act')) this.ballot = false; return; }
    if (this.busy) {
      if (h.goal != null) { const d = h.goal - h.x; h.dir = Math.sign(d) || h.dir; h.moving = true; h.walkT += dt; h.x += Math.sign(d) * Math.min(Math.abs(d), dt * .075);
        if (Math.abs(h.goal - h.x) < .5) { h.x = h.goal; h.goal = null; h.moving = false; const a = h.arrive; h.arrive = null; a && a(); } }
      else h.moving = false;
      this.updateCam(dt); return;
    }

    if (hit('ballot')) { this.ballot = true; return; }
    if (hit('raccoon')) this.useRaccoon();

    // лестница
    if (h.climb) {
      const c = h.climb; c.t += dt / 2600;
      const pts = c.pts, seg = c.t < .5 ? 0 : 1, k = seg ? (c.t - .5) * 2 : c.t * 2;
      const a = pts[seg], b = pts[seg + 1];
      h.x = lerp(a[0], b[0], Math.min(1, k)); h.y = lerp(a[1], b[1], Math.min(1, k)); h.dir = b[0] < a[0] ? -1 : 1; h.walkT += dt;
      this.stepAcc += dt; if (this.stepAcc > 260) { this.stepAcc = 0; sfx.step(); }
      if (c.t >= 1) { h.floor = c.to; h.x = pts[2][0]; h.y = this.base(c.to); h.climb = null; this.addTime(1); }
      this.updateCam(dt); return;
    }
    let dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (dir || keys.up || keys.down) this.plan = null;          // клавиши отменяют маршрут
    if (!dir && this.plan) {
      const P = this.plan;
      if (P.floor !== h.floor) {                                   // сначала к лестнице и по этажам
        const sx = STAIR_X - 6;
        if (Math.abs(h.x - sx) > 1.5) dir = Math.sign(sx - h.x);
        else { this.startClimb(Math.sign(P.floor - h.floor)); this.updateCam(dt); return; }
      } else if (Math.abs(h.x - P.x) > 1.5) dir = Math.sign(P.x - h.x);
      else {
        this.plan = null; h.moving = false;
        if (P.door) { if (P.door === T.heroApt) toast('E-KNOT', L(UI.yourDoor), 2400); else this.visit(this.res[P.door]); this.updateCam(dt); return; }
        if (P.npc) { this.runHelper(); this.updateCam(dt); return; }
      }
      if (dir && Math.abs((P.floor !== h.floor ? STAIR_X - 6 : P.x) - h.x) < dt * .075) { h.x = P.floor !== h.floor ? STAIR_X - 6 : P.x; dir = 0; }
    }
    h.moving = dir !== 0;
    if (dir) { h.dir = dir; h.x = clamp(h.x + dir * dt * .075, STAIR_X - 6, 388); h.walkT += dt; this.stepAcc += dt; if (this.stepAcc > 230) { this.stepAcc = 0; sfx.step(); } }
    h.y = this.base(h.floor);
    const onStairs = h.x < STAIR_X + 8;
    if (onStairs && hit('up') && h.floor < T.floors) this.startClimb(1);
    else if (onStairs && hit('down') && h.floor > 1) this.startClimb(-1);
    // болтун перехватывает
    if (!this.talker.done && h.floor === this.talker.floor && h.x < 170) { this.runTalker(); return; }
    const door = this.nearDoor(), npc = this.nearNPC();
    setTouch({ act: npc ? L(UI.talk) : door ? L(UI.knock) : null, up: onStairs && h.floor < T.floors, down: onStairs && h.floor > 1 });
    if (hit('act')) {
      if (npc === 'helper') this.runHelper();
      else if (door === T.heroApt) toast('E-KNOT', L(UI.yourDoor), 2400);
      else if (door) this.visit(this.res[door]);
    }
    this.updateCam(dt);
  },
  updateCam(dt) {
    const target = clamp(this.hero.y - (DLG.open ? 118 : 165), 0, this.WH - H);
    this.camY = lerp(this.camY, target, Math.min(1, dt / 160));
  },
  startClimb(d) {
    const h = this.hero, b = this.base(h.floor);
    h.climb = d > 0 ? { to: h.floor + 1, t: 0, pts: [[STAIR_X - 8, b], [12, b - 50], [STAIR_X - 4, b - 100]] }
                    : { to: h.floor - 1, t: 0, pts: [[STAIR_X - 4, b], [12, b + 50], [STAIR_X - 8, b + 100]] };
  },

  onTap(x, wy) {
    const T = this.tour; let f = 1;
    for (let k = 1; k <= T.floors; k++) { const b = this.base(k); if (wy > b - FLOOR_H + 6 && wy <= b + 8) f = k; }
    if (wy < this.base(T.floors) - FLOOR_H + 6) f = T.floors;
    const plan = { floor: f, x: clamp(x, STAIR_X - 6, 388) };
    for (let d = 0; d < 4; d++) if (Math.abs(x - DOOR_X[d]) < 17) { plan.x = DOOR_X[d] + (x < DOOR_X[d] ? -4 : 4); plan.door = (f - 1) * 4 + d + 1; }
    if (this.helper.state === 'shown' && f === this.helper.floor && Math.abs(x - this.helper.x) < 12) { plan.x = this.helper.x + 12; plan.npc = 'helper'; plan.door = null; }
    if (x < STAIR_X + 4) plan.x = STAIR_X - 6;
    this.plan = plan; sfx.select();
  },
  walkTo(x) { const h = this.hero; return new Promise(res => { h.goal = x; h.arrive = res; }); },
  /* ---- крысы: бегают по первому этажу, при виде героя прячутся в норы ---- */
  updateRats(dt) {
    const h = this.hero, near = h.floor === 1 || (h.climb && h.climb.to === 1);
    for (const r of this.rats) {
      r.t += dt; r.k += dt;
      const scared = near && (h.climb || Math.abs(h.x - r.x) < 96);
      if (r.st === 'roam') {
        if (scared) { r.st = 'alert'; r.k = 0; continue; }
        if (r.pause > 0) { r.pause -= dt; continue; }
        r.x += r.dir * dt * .045; if (r.x < 100 || r.x > 380) r.dir *= -1;
        if (Math.random() < dt / 2500) r.pause = 300 + Math.random() * 900; if (Math.random() < dt / 4000) r.dir *= -1;
      } else if (r.st === 'alert') {                         // замерла, «!» — и бежит
        if (r.k > 260) { r.st = 'flee'; r.k = 0;
          const away = RAT_HOLES.filter(x => Math.sign(x - r.x) !== Math.sign(h.x - r.x) || h.climb);
          r.hole = (away.length ? away : RAT_HOLES).reduce((a, x) => Math.abs(x - r.x) < Math.abs(a - r.x) ? x : a); r.dir = Math.sign(r.hole - r.x) || 1; }
      } else if (r.st === 'flee') {
        const goal = r.hole - r.dir * 9, d = goal - r.x; r.x += Math.sign(d) * Math.min(Math.abs(d), dt * .2);
        if (Math.abs(d) < 1) { r.st = 'in'; r.k = 0; }
      } else if (r.st === 'in') { if (r.k > 320) { r.st = 'hidden'; r.k = 0; } }
      else if (r.st === 'hidden') { if (near) r.k = 0; else if (r.k > 2200 + Math.random() * 800) { r.st = 'out'; r.k = 0; r.dir = Math.random() < .5 ? -1 : 1; } }
      else if (r.st === 'out') { if (r.k > 320) { r.st = 'roam'; r.k = 0; r.x = r.hole + r.dir * 9; } }
    }
  },
  drawRats(cy, t) {
    const b = this.base(1) - cy;
    for (const r of this.rats) {
      const fr = RAT[r.st === 'flee' ? Math.floor(r.t / 60) % 2 : r.st === 'roam' && r.pause <= 0 ? Math.floor(r.t / 120) % 2 : 0];
      if (r.st === 'hidden') { if (Math.floor(t / 1700 + r.x) % 3 === 0 && (t % 1700) < 1200) { rect(r.hole - 2, b - 5, 1, 1, '#e8d36a'); rect(r.hole + 1, b - 5, 1, 1, '#e8d36a'); } continue; }
      if (r.st === 'in' || r.st === 'out') {
        // ныряет в нору головой вперёд (или вылезает): часть за краем норы скрыта
        const k = Math.min(1, r.k / 320), x = r.st === 'in' ? r.hole - r.dir * 9 + r.dir * 18 * k : r.hole - r.dir * 9 + r.dir * 18 * k;
        const hideSide = r.st === 'in' ? r.dir : -r.dir;
        ctx.save(); ctx.beginPath(); if (hideSide > 0) ctx.rect(0, 0, r.hole, H); else ctx.rect(r.hole + 1, 0, W, H); ctx.clip();
        sprite(fr, Math.round(x - 8), b - 8, r.dir > 0); ctx.restore();
        continue;
      }
      sprite(fr, Math.round(r.x - 8), b - 8, r.dir > 0);
      if (r.st === 'alert') text('!', r.x, b - 18, { col: '#f2c94c', align: 'center', size: 6, shadow: '#0b0c10' });
    }
  },

  /* ---- стук в дверь и разговор ---- */
  async visit(r) {
    this.busy = true; const h = this.hero;
    // встаём сбоку от двери, чтобы жилец вышел на порог, а не «в» героя
    const side = h.x <= DOOR_X[r.d] ? -1 : 1; await this.walkTo(DOOR_X[r.d] + side * 23); h.dir = -side;
    h.knockT = 700; sfx.knock(); this.addTime(.5); pop(DOOR_X[r.d], this.base(r.floor) - 30, LANG === 'kz' ? 'тық-тық' : 'тук-тук', '#c9cdc8');
    await wait(750);
    const m = this.minute, A = r.A;
    if (r.status === 'online') { pop(DOOR_X[r.d], this.base(r.floor) - 70, L(UI.st.online), '#9fd9c2'); this.busy = false; return; }
    const away = r.away && m < r.returnAt;
    if (away) { r.status = r.status === 'unknown' ? 'away' : r.status; r.knocks++; pop(DOOR_X[r.d], this.base(r.floor) - 70, '...', '#9fb0cc'); toast('E-KNOT', L(UI.nobody), 2400); this.busy = false; return; }
    const pNo = (r.sleeping ? .5 : A.deaf) * Math.pow(.45, r.knocks);
    if (Math.random() < pNo) { r.knocks++; if (r.status === 'unknown' || r.status === 'away') r.status = 'noanswer'; pop(DOOR_X[r.d], this.base(r.floor) - 70, '...', '#8f949c'); toast('E-KNOT', L(UI.noOpen), 2400); this.busy = false; return; }
    // открывают
    sfx.door(); await tweenDoor(r, 1);
    if (r.sleeping) { r.mood -= 8; r.sleeping = false; }
    r.away = false; this.addTime(.5);
    dlgOpen(r.name, e => portrait(r.look, e), A.voice, A.renter ? null : () => r.mood);
    // у каждого жильца свой вариант приветствия/истории/ответа; реакции чередуются без повторов подряд
    const Ln = k => { const v = A.lines[k] || GENERIC[k]; if (!Array.isArray(v)) return L(v);
      if (['good', 'meh', 'bad'].includes(k)) { let i; do i = Math.floor(Math.random() * v.length); while (v.length > 1 && i === r.last[k]); r.last[k] = i; return L(v[i]); }
      return L(v[r.v % v.length]); };
    if (A.renter) { await say(Ln('greet')); r.status = 'renter'; return this.endVisit(r); }
    if (r.status === 'yes') { await say(L(GENERIC.already), 'happy'); return this.endVisit(r); }
    if (r.status === 'no') { await say(L(GENERIC.againNo), 'angry'); return this.endVisit(r); }
    if (r.status === 'thinking') { r.mood += 4; await say(Ln('again')); } else await say(Ln('greet'), r.mood < 30 ? 'angry' : 'neutral');
    const hero = e => portrait(SAVE.look, e);
    for (let round = 0; round < 3; round++) {
      const menu = [{ label: L(UI.cExplain), k: 'explain' }, { label: L(UI.aFacts), k: 'facts' }, { label: L(UI.aBenefit), k: 'benefit' }, { label: L(UI.aNeighbors), k: 'neighbors' },
        { label: L(UI.aOnline), k: 'online' }, { label: L(UI.cListen), k: 'listen', dim: r.listened }, { label: L(UI.cLater), k: 'later' }];
      const c = menu[await ask(menu)].k;
      if (c === 'later') { await say(L(GENERIC.bye)); if (r.status !== 'yes') r.status = 'thinking'; return this.endVisit(r); }
      // реплика героя
      const heroLine = { explain: UI.heroExplain, facts: UI.heroFacts, benefit: UI.heroBenefit, neighbors: UI.heroNeighbors, online: UI.heroOnline, listen: UI.heroListen }[c];
      const swap = DLG.port, swapName = DLG.name, swapMood = DLG.mood;
      DLG.port = hero; DLG.name = SAVE.name; DLG.voice = 420;
      await say(L(heroLine).replace('{n}', this.signatures()), 'happy');
      DLG.port = swap; DLG.name = swapName; DLG.voice = A.voice; DLG.mood = swapMood;
      if (c === 'online') {
        this.addTime(.5);
        if (A.onlineOk) { r.status = 'online'; await say(Ln('online'), 'happy'); this.events.push({ t: 'online', apt: r.apt }); return this.endVisit(r); }
        r.mood += A.likes.online; await say(Ln('noOnline'), 'angry');
      } else if (c === 'listen') {
        this.addTime(3);
        if (r.listened) { await say(L(GENERIC.storyDone)); }
        else { r.listened = true; r.mood += A.listen; await say(Ln('story'), A.listen > 0 ? 'sad' : 'angry'); SAVE.trust[r.apt] = (SAVE.trust[r.apt] || 0) + 4; }
      } else {
        this.addTime(1);
        let d = A.likes[c] + Math.round((Math.random() - .5) * 6);
        if (c === 'neighbors' && A.likes.neighbors > 0) d += Math.min(14, this.signatures() * 2);
        r.mood += d;
        await say(Ln(d >= 10 ? 'good' : d <= 0 ? 'bad' : 'meh'), d >= 10 ? 'happy' : d <= 0 ? 'angry' : 'think');
      }
      r.mood = clamp(r.mood, 0, 100);
      if (r.mood >= 70) { r.status = 'yes'; await say(Ln('yes'), 'happy'); this.signed(r, 'door'); return this.endVisit(r); }
      if (r.mood <= 12) { r.status = 'no'; sfx.no(); await say(Ln('no'), 'angry'); this.events.push({ t: 'no', apt: r.apt }); return this.endVisit(r); }
    }
    await say(Ln('think'), 'think'); r.status = 'thinking'; return this.endVisit(r);
  },
  signed(r, via) {
    sfx.stamp(); this.events.push({ t: 'yes', apt: r.apt, via });
    pop(DOOR_X[r.d], this.base(r.floor) - 70, '+1 ✓', '#4caf6e');
    this.stampT = 900;
    if (!this.goalShown && this.signatures() >= this.tour.goal) { this.goalShown = true; setTimeout(() => toast('E-KNOT', L(UI.goalDone), 4200), 400); }
  },
  async endVisit(r) { dlgClose(); sfx.door(); await tweenDoor(r, 0); this.busy = false; },

  /* ---- болтун на лестнице ---- */
  async runTalker() {
    this.busy = true; this.talker.done = true;
    const look = this.talker.look;
    dlgOpen(L(UI.talkerName), e => portrait(look, e), 230);
    await say(L(UI.talker1), 'happy');
    const c = await ask([{ label: L(UI.tListen) }, { label: L(UI.tLater) }, { label: L(UI.tChat) }]);
    const floorRes = Object.values(this.res).filter(r => r.floor === this.talker.floor);
    if (c === 0) { this.addTime(3); floorRes.forEach(r => r.mood += 10); await say(L(UI.talkerListen), 'happy'); }
    if (c === 1) { floorRes.forEach(r => r.mood -= 5); await say(L(UI.talkerLater), 'angry'); }
    if (c === 2) { this.addTime(.5); await say(L(UI.talkerChat), 'think'); }
    dlgClose(); this.talker.leaving = 1; this.busy = false;
  },
  /* ---- помощница-активистка ---- */
  async runHelper() {
    this.busy = true; const f = this.tour.helperFloor, look = this.helper.look;
    dlgOpen(L(UI.helperName), e => portrait(look, e), 470);
    await say(L(UI.helper1).replace('{f}', f), 'happy');
    const c = await ask([{ label: L(UI.hYes) }, { label: L(UI.hNo) }]);
    if (c === 0) { await say(L(UI.helperOk), 'happy'); this.helper.state = 'busy'; this.helper.doneAt = this.minute + 8; }
    else { await say(L(UI.helperNo)); this.helper.state = 'done'; }
    dlgClose(); this.busy = false;
  },
  helperDone() {
    this.helper.state = 'done'; const f = this.tour.helperFloor; let n = 0;
    for (const r of Object.values(this.res)) {
      if (r.floor !== f || r.A.renter || ['yes', 'no', 'online'].includes(r.status)) continue;
      if (r.away && this.minute < r.returnAt) continue;
      r.mood += 22; if (r.mood >= 60) { r.status = 'yes'; this.events.push({ t: 'yes', apt: r.apt, via: 'helper' }); n++; } else r.status = 'thinking';
    }
    toast(L(UI.helperName), L(UI.helperDone).replace('{f}', f).replace('{n}', n));
    if (!this.goalShown && this.signatures() >= this.tour.goal) { this.goalShown = true; setTimeout(() => toast('E-KNOT', L(UI.goalDone), 4200), 4000); }
  },
  /* ---- енот: рассылка в E-KNOT ---- */
  useRaccoon() {
    if (this.busy) return;
    if (this.raccoon <= 0) { toast(L(UI.raccoon), L(UI.noRaccoon), 2400); return; }
    this.raccoon--; this.racAnim = { t: 0 }; beep(988, .06, 'square', .04); beep(1318, .1, 'square', .04, .08);
    let n = 0;
    // уведомление доходит до всех, но откликаются те, кто уже пользуется приложением и не против
    const R = rng(hashStr(USER.userId) + Math.floor(this.minute));
    for (const r of Object.values(this.res)) {
      if (!r.A.onlineOk) continue;
      const chance = { away: .75, noanswer: .75, thinking: r.mood >= 40 ? .6 : 0, unknown: .3 }[r.status] || 0;
      if (R() >= chance) continue;
      r.status = 'online'; this.events.push({ t: 'online', apt: r.apt, via: 'raccoon' }); n++;
    }
    setTimeout(() => toast(L(UI.raccoonT), L(UI.raccoonB) + ' (+' + n + ')'), 900);
  },
  /* ---- конец тура ---- */
  async finish(timeUp) {
    if (this.over) return; this.over = true; setTouch({});
    if (timeUp) toast('E-KNOT', L(UI.timeUp), 2000);
    // онлайн-подписи приходят к концу тура
    for (const r of Object.values(this.res)) if (r.status === 'online') {
      if (Math.random() < (r.arch === 'night' ? .9 : .82)) { r.status = 'yes'; this.events.push({ t: 'yes', apt: r.apt, via: 'online' }); } else r.status = 'thinking';
    }
    const result = await API.tourFinish(this.run, this.events, this.tour);
    const T = this.tour.id, prev = SAVE.tours[T] || { tries: 0, best: 0, done: false };
    SAVE.tours[T] = { tries: prev.tries + 1, best: Math.max(prev.best, result.signatures), done: prev.done || result.success };
    SAVE.coins = (SAVE.coins || 0) + result.coins; persist();
    const stats = { ...result, against: Object.values(this.res).filter(r => r.status === 'no').length, thinking: Object.values(this.res).filter(r => r.status === 'thinking').length };
    setTimeout(() => irisTo(this.hero.x, this.hero.y - this.camY - 14, () => go('result', stats)), timeUp ? 1200 : 200);
  },

  draw(dt) {
    const T = this.tour, h = this.hero, cy = Math.round(this.camY);
    ctx.drawImage(this.bg, 0, -cy);
    const t = performance.now();
    for (let f = 1; f <= T.floors; f++) {
      const b = this.base(f) - cy; if (b < -10 || b > H + 110) continue;
      // лампа на потолке
      // лампа: на нечётных этажах мигает; свет — тёплое пятно поверх тёмных стен
      const lampOn = (f % 2 === 0) || Math.sin(t / 97 + f * 13 + this.lampSeed) > -.85;
      rect(236, b - 94, 1, 6, '#0e1011'); rect(231, b - 88, 11, 4, '#1c1f24'); rect(233, b - 85, 7, 3, lampOn ? '#fff1b8' : '#4b4f4c');
      if (lampOn) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        if (!this.glow) this.glow = makeCanvas(220, 94, ({ g }) => { const gr = g.createRadialGradient(110, 10, 2, 110, 44, 110); gr.addColorStop(0, 'rgba(255,214,140,.30)'); gr.addColorStop(.5, 'rgba(255,190,110,.10)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, 220, 94); });
        ctx.drawImage(this.glow, 126, b - 94);
        for (let i = 0; i < 6; i++) { const dx = Math.sin(t / 2200 + i * 2.1 + f) * 46, dy = ((t / 60 + i * 37 + f * 11) % 70); rect(236 + dx, b - 80 + dy, 1, 1, 'rgba(255,236,190,.5)'); }
        ctx.restore();
      }
      for (let d = 0; d < 4; d++) {
        const apt = (f - 1) * 4 + d + 1, x = DOOR_X[d], r = this.res[apt];
        if (apt === T.heroApt) { sprite(ICONS.me, x + 16, b - 40); continue; }
        if (!r) continue;
        const home = !(r.away && this.minute < r.returnAt);
        if (home && !r.sleeping && r.door === 0) { rect(x - 11, b - 2, 22, 1, '#f2d27a'); ctx.fillStyle = 'rgba(242,210,122,.25)'; ctx.fillRect(x - 13, b - 1, 26, 1); }
        if (r.door > 0) {
          // дверь открывается: тёплый свет из квартиры, жилец выходит на порог
          const ow = Math.round(26 * r.door);
          rect(x - 13, b - 48, 26, 48, '#2a2018'); ctx.fillStyle = 'rgba(242,198,106,.45)'; ctx.fillRect(x - 13, b - 48, 26, 48);
          sprite(personSprite(r.look, 'idle' + (Math.floor(t / 600) % 2)), x - 9 + (h.x < x ? -2 : 2) * r.door, b - PH, h.x < x);
          const dw = Math.max(3, 26 - ow); rect(x + 13 - dw, b - 48, dw, 48, this.doorLook[apt].col); rect(x + 13 - dw, b - 48, 1, 48, '#0e0f12');
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(242,198,106,.12)';
          ctx.beginPath(); ctx.moveTo(x - 13, b); ctx.lineTo(x + 13, b); ctx.lineTo(x + 34, b + 1); ctx.lineTo(x - 34, b + 1); ctx.fill();
          ctx.fillRect(x - 40, b - 2, 80, 2); ctx.restore();
        }
        const ic = ICONS[r.status]; if (ic) { rect(x + 15, b - 41, 11, 11, 'rgba(10,12,16,.55)'); sprite(ic, x + 16, b - 40); }
      }
    }
    // кот на окне 4-го этажа, крысы на 1-м
    if (T.floors >= 4) sprite(CAT, 30, this.base(4) - FLOOR_H + 22 - cy);
    this.drawRats(cy, t);
    // болтун
    const tk = this.talker;
    if (this.plan && !this.busy) { const P = this.plan, mx = P.x, my = this.base(P.floor) - cy; if (Math.floor(t / 300) % 2) { rect(mx - 3, my - 2, 7, 1, '#f2c94c'); rect(mx - 1, my - 3, 3, 1, '#f2c94c'); } }
    if (!tk.done || (tk.leaving && tk.leaving < 1400)) {
      if (tk.leaving) tk.leaving += dt;
      const x = tk.x + (tk.leaving ? tk.leaving * .05 : 0);
      if (!tk.leaving || tk.leaving < 1400) sprite(personSprite(tk.look, tk.leaving ? ['walk0', 'walk1', 'walk2', 'walk3'][Math.floor(tk.leaving / 120) % 4] : ['idle0', 'idle1'][Math.floor(t / 600) % 2]), x - 9, this.base(tk.floor) - PH - cy, !tk.leaving && h.x < x);
    }
    // помощница
    if (this.helper.state === 'shown') {
      const hb = this.base(this.helper.floor) - cy;
      sprite(personSprite(this.helper.look, ['idle0', 'idle1'][Math.floor(t / 500) % 2]), this.helper.x - 9, hb - PH, h.x < this.helper.x);
      if (Math.floor(t / 400) % 2) text('!', this.helper.x, hb - PH - 12, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' });
    }
    // герой
    let fr = 'idle' + (Math.floor(t / 500) % 2);
    if (h.knockT > 0) { h.knockT -= dt; fr = Math.floor(h.knockT / 120) % 2 ? 'knock' : 'idle0'; }
    else if (h.climb) fr = 'climb' + (Math.floor(h.walkT / 260) % 4);
    else if (h.moving) fr = 'walk' + (Math.floor(h.walkT / 130) % 4);
    sprite(personSprite(Object.assign({ blink: Math.floor(t / 2600) % 3 === 0 }, SAVE.look), fr), h.x - 9, h.y - PH - cy, h.dir < 0);
    // подсказка над дверью
    if (!this.busy && !DLG.open && !h.climb) {
      const door = this.nearDoor(), npc = this.nearNPC();
      if (door || npc) { const px = npc ? this.helper.x : DOOR_X[(door - 1) % 4]; const s = isTouch ? '▼' : 'E';
        if (Math.floor(t / 400) % 2) text(s, px, h.y - cy - 86, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' }); }
      if (h.x < STAIR_X + 8) text((h.floor < T.floors ? '▲' : '') + (h.floor > 1 ? '▼' : ''), STAIR_X - 20, h.y - cy - 56, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' });
    }
    drawPops(dt, 0, cy);
    // енот с рассылкой
    if (this.racAnim) {
      const k = this.racAnim.t / 1800, rx = lerp(W + 20, -30, k), ry = 40 + Math.sin(k * Math.PI) * 30;
      sprite(RACCOON, rx, ry);
      for (let i = 0; i < 8; i++) { const pk = clamp(k * 1.6 - i * .08, 0, 1); if (pk <= 0 || pk >= 1) continue; sprite(PLANE, rx + 10 + pk * 140 * Math.cos(i), ry + pk * 160 * Math.sin(i * .7 + .4)); }
    }
    if (this.stampT > 0) { this.stampT -= dt; const s = 1 + Math.max(0, (this.stampT - 600) / 300) * 1.5; ctx.save(); ctx.globalAlpha = Math.min(1, this.stampT / 300);
      ctx.translate(W / 2, 92); ctx.rotate(-.18); ctx.scale(s, s); rect(-34, -12, 68, 24, 'rgba(76,175,110,.25)'); ctx.strokeStyle = '#4caf6e'; ctx.lineWidth = 2; ctx.strokeRect(-34, -12, 68, 24);
      text(LANG === 'kz' ? 'ҚОЛ ҚОЙДЫ' : 'ПОДПИСАНО', 0, -4, { col: '#4caf6e', align: 'center' }); ctx.restore(); }
    this.drawHUD();
    dlgDraw();
    if (this.ballot) this.drawBallot();
    // нажатие по подъезду: герой сам идёт к двери / на нужный этаж
    if (!this.busy && !DLG.open && !this.ballot && !this.over) { const c = clicks.find(c => c.y > 24); if (c) { clicks.splice(clicks.indexOf(c), 1); this.onTap(c.x, c.y + cy); } }
  },
  drawHUD() {
    const T = this.tour;
    rect(0, 0, W, 19, 'rgba(14,17,28,.94)'); rect(0, 19, W, 1, '#55607c'); rect(0, 20, W, 1, 'rgba(5,6,10,.6)');
    rect(126, 3, 1, 13, '#2c3346'); rect(238, 3, 1, 13, '#2c3346');
    const m = Math.floor(this.minute), hh = Math.floor(m / 60), mm = m % 60;
    const left = this.end - this.minute;
    // часы
    rect(6, 4, 9, 9, '#f4f3ee'); rect(7, 5, 7, 7, '#2b2a33'); rect(10, 6, 1, 3, '#f4f3ee'); rect(10, 8, 2, 1, '#f4f3ee');
    text(`${hh}:${String(mm).padStart(2, '0')}`, 19, 5, { col: left < 8 ? '#e98f6f' : '#f4f3ee' });
    rect(64, 6, 60, 6, '#2b2a33'); rect(64, 6, Math.round(60 * clamp(left / T.duration, 0, 1)), 6, left < 8 ? '#e98f6f' : '#7fc4a8');
    // подписи
    const n = this.signatures();
    text(`${L(UI.signs)} ${n}/${T.goal}`, 132, 5, { col: n >= T.goal ? '#4caf6e' : '#f2c94c' });
    if (button(L(UI.ballot), 0, 1, 'dark', { left: 244 }) && !this.busy && !DLG.open) this.ballot = !this.ballot;
    if (button(`${L(UI.raccoon)}×${this.raccoon}`, 0, 1, this.raccoon ? 'alt' : 'off', { left: 330 })) this.useRaccoon();
    text(`${this.hero.floor}${L(UI.floor)}`, 8, 22, { col: '#f4f3ee', shadow: '#0b0c10', size: 6 });
    if (n >= T.goal && !this.busy && !DLG.open) { if (button(L(UI.finish), W / 2, 22, 'primary')) this.finish(false); }
  },
  drawBallot() {
    const T = this.tour;
    rect(0, 0, W, H, 'rgba(11,12,16,.55)');
    paper(40, 22, 320, 192, 8);
    text(L(UI.ballotTitle), W / 2, 30, { align: 'center', col: INK_RED });
    for (let f = T.floors; f >= 1; f--) {
      const y = 46 + (T.floors - f) * 24;
      text(`${f}`, 54, y + 6, { col: INK_MUTED });
      for (let d = 0; d < 4; d++) {
        const apt = (f - 1) * 4 + d + 1, x = 68 + d * 70, r = this.res[apt];
        rect(x, y, 64, 20, '#e2d9c2'); rect(x, y + 19, 64, 1, '#cfc3a5');
        text(String(apt), x + 3, y + 7, { col: INK, size: 6 });
        const st = apt === T.heroApt ? 'me' : r.status;
        if (ICONS[st]) sprite(ICONS[st], x + 17, y + 5);
        const nm = apt === T.heroApt ? L(UI.st.me) : (r.status === 'unknown' ? '' : r.name.split(' ')[0]);
        text(nm.length > 6 ? nm.slice(0, 5) + '.' : nm, x + 28, y + 7, { col: INK_MUTED, size: 6 });
      }
    }
    const cnt = s => Object.values(this.res).filter(r => r.status === s).length;
    const leg = [['yes', cnt('yes')], ['online', cnt('online')], ['thinking', cnt('thinking')], ['no', cnt('no')], ['away', cnt('away')], ['noanswer', cnt('noanswer')]];
    leg.forEach(([k, v], i) => { const x = 62 + i * 46; sprite(ICONS[k], x, 170); text(String(v), x + 12, 171, { col: INK }); });
    if (button(L(UI.close), W / 2, 188, 'alt')) this.ballot = false;
  },
};
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function tweenDoor(r, to) { return new Promise(res => { const from = r.door, t0 = performance.now(); (function step() { const k = Math.min(1, (performance.now() - t0) / 260); r.door = lerp(from, to, k); if (k < 1) requestAnimationFrame(step); else res(); })(); }); }

/* ============================================================
   СЦЕНА: итог тура (протокол)
   ============================================================ */
scenes.result = {
  enter(d) { this.d = d; this.t = 0; setTouch({ act: L(UI.next) }); if (d.success) setTimeout(() => sfx.stamp(), 500); },
  update(dt) { this.t += dt; if (hit('act')) irisTo(W / 2, 200, () => go('title')); },
  draw(dt) {
    const d = this.d;
    drawNight(dt);
    paper(60, 16, 280, 196, 11);
    text(L(UI.protocol), W / 2, 26, { align: 'center', col: INK_MUTED });
    text(d.success ? L(UI.win) : L(UI.lose), W / 2, 42, { align: 'center', col: d.success ? INK_TEAL : INK_RED });
    const rows = [[L(UI.rSigned), `${d.signatures}/${TOURS.t1.goal}`], ['  ' + L(UI.rOnline), String(d.online)], [L(UI.rAgainst), String(d.against)], [L(UI.rThinking), String(d.thinking)], [L(UI.rCoins), '+' + d.coins]];
    rows.forEach(([a, b], i) => { text(a, 80, 66 + i * 14, { col: INK }); text(b, 320, 66 + i * 14, { col: INK, align: 'right' }); rect(80, 76 + i * 14, 240, 1, '#e2d9c2'); });
    wrapText(d.success ? L(UI.rNext) : L(UI.rRetry), 240).forEach((l, i) => text(l, W / 2, 142 + i * 11, { align: 'center', col: d.success ? INK_TEAL : INK_MUTED }));
    if (d.success && this.t > 500) { const k = Math.min(1, (this.t - 500) / 200), s = 1 + (1 - k) * 1.5; ctx.save(); ctx.translate(290, 52); ctx.rotate(-.25); ctx.scale(s, s); ctx.globalAlpha = k;
      ctx.strokeStyle = '#b8443f'; ctx.lineWidth = 2; ctx.strokeRect(-30, -10, 60, 20); text('ОСИ', 0, -4, { col: '#b8443f', align: 'center' }); ctx.restore(); }
    if (button(L(UI.menu), W / 2 - 60, 186, 'alt')) irisTo(W / 2 - 60, 194, () => go('title'));
    if (button(L(UI.again), W / 2 + 60, 186, 'primary')) irisTo(W / 2 + 60, 194, () => go('tour', { tour: 't1' }));
  },
};

/* ============================================================
   ЗАПУСК
   ============================================================ */
(async function boot() {
  try { if (document.fonts) await Promise.race([document.fonts.load('8px "Press Start 2P"', 'ҮЙ №67 ӘҒҚҢӨҰҮҺІ әғқңөұүһі'), wait(2500)]); } catch (e) {}
  USER = await API.auth();
  SAVE = (await API.load()) || { created: false, coins: 0, tours: {}, trust: {} };
  SAVE.tours = SAVE.tours || {}; SAVE.trust = SAVE.trust || {};
  if (USER.name && !SAVE.name) SAVE.name = USER.name;
  document.getElementById('rotate').textContent = L(UI.rotate);
  go('title');
  requestAnimationFrame(frame);
})();
