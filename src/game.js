/* ============================================================
   ИГРА: mock-сервер, диалоги, сцены
   ============================================================ */

/* ---------- Mock API: тот же набор запросов, что будет у настоящего сервера ---------- */
let USER = null, SAVE = null;
const DEFAULT_LOOK = { body: 'm', bottom: 'pants', skin: '#e3ad86', hair: 'short', hairCol: '#2b2420', top: 'hoodie', topCol: '#2f8577', hat: null };
function persist() { API.save(SAVE).catch(() => toast('E-KNOT', L(UI.netSaveFail), 2400)); }
const NEW_SAVE = () => ({ created: false, coins: 0, tours: {}, trust: {} });
// индикатор связи с сервером: крутится в углу, пока идёт запрос дольше 0,3 с
let netShownAt = 0;
function drawNet(dt) {
  if (NET.pending > 0) netShownAt += dt; else netShownAt = 0;
  if (netShownAt < 300) return;
  const t = performance.now() / 120, x = W - 12, y = H - 12;
  rect(x - 7, y - 7, 15, 15, 'rgba(14,17,28,.85)');
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.globalAlpha = ((i + Math.floor(t)) % 8) / 8; rect(x + Math.round(Math.cos(a) * 4), y + Math.round(Math.sin(a) * 4), 1, 1, '#f2c94c'); }
  ctx.globalAlpha = 1;
}

/* ---------- Диалоги в стиле Undertale ---------- */
const DLG = { open: false, name: '', port: null, voice: 400, text: '', shown: 0, choices: null, cursor: 0, resolve: null, expr: 'neutral', mood: null, blipAt: 0 };
function dlgOpen(name, port, voice = 400, mood = null) { setTouch({ act: L(UI.next) }); Object.assign(DLG, { open: true, name, port, voice, mood, text: '', shown: 0, choices: null }); }
function dlgClose() { voiceStop(); DLG.open = false; DLG.choices = null; DLG.resolve = null; }
// длинная реплика делится на страницы по 5 строк — ничего не обрезается
const DLG_LINES = 5, DLG_TW = 320;
function sayPage(t, expr) { setTouch({ act: L(UI.next) }); return new Promise(res => Object.assign(DLG, { text: t, shown: 0, choices: null, expr, resolve: res })); }
async function say(t, expr = 'neutral') {
  voicePlay(t);   // есть mp3 — играет голос, нет — обычный «писк»
  const lines = wrapText(t, DLG_TW);
  for (let i = 0; i < lines.length; i += DLG_LINES) await sayPage(lines.slice(i, i + DLG_LINES).join(' '), expr);
}
function ask(opts) { setTouch({}); return new Promise(res => Object.assign(DLG, { shown: DLG.text.length, choices: opts, cursor: 0, resolve: res })); }
// на телефоне окно диалога выше, а кнопки выбора крупнее
const DLG_BOX = isTouch ? { y: 132, h: 90 } : { y: 140, h: 82 };
const CH = { x0: 64, colW: 162, y0: 146, rowH: isTouch ? 20 : 18, bw: 156, bh: isTouch ? 18 : 16 };
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
    DLG.blipAt -= dt; if (DLG.blipAt <= 0 && !VOICE.playing) { sfx.blip(DLG.voice + Math.random() * 40); DLG.blipAt = 55; }
  }
  if (hit('act') || clickIn(6, DLG_BOX.y, W - 12, DLG_BOX.h)) {
    if (DLG.shown < len) DLG.shown = len; else { const r = DLG.resolve; DLG.resolve = null; r(); }
  }
  function choose() { const r = DLG.resolve, c = DLG.cursor; DLG.resolve = null; DLG.choices = null; sfx.select(); r(c); }
}
function dlgDraw() {
  if (!DLG.open) return;
  const x = 6, y = DLG_BOX.y, w = W - 12, h = DLG_BOX.h;
  rect(x, y, w, h, '#f4f3ee'); rect(x + 2, y + 2, w - 4, h - 4, '#0b0c10');
  // портрет
  rect(x + 7, y + 8, 44, 44, '#f4f3ee'); rect(x + 8, y + 9, 42, 42, '#20222b');
  if (DLG.port) sprite(DLG.port(DLG.expr), x + 9, y + 10);
  // имя под портретом: длинные имена — мельче и в две строки
  if (textW(DLG.name) <= 52) text(DLG.name, x + 29, y + 56, { align: 'center', col: '#f2c94c' });
  else { const parts = DLG.name.split(' '); parts.slice(0, 2).forEach((s, i) => text(s.slice(0, 9), x + 29, y + 55 + i * 9, { align: 'center', col: '#f2c94c', size: 6 })); }
  // текст
  if (!DLG.choices) wrapText(DLG.text.slice(0, Math.floor(DLG.shown)), DLG_TW).slice(0, DLG_LINES).forEach((l, i) => text(l, x + 58, y + 9 + i * 12));
  if (!DLG.choices && DLG.shown >= DLG.text.length && DLG.resolve && !isTouch) { if (Math.floor(performance.now() / 300) % 2) rect(x + w - 14, y + h - 12, 6, 4, '#f2c94c'); }
  if (DLG.choices) {
    // варианты — крупные кнопки в две колонки, нажимаются пальцем
    const rowsN = Math.ceil(DLG.choices.length / 2), y0 = y + Math.round((h - rowsN * CH.rowH) / 2) + 1;
    CH.y0 = y0;
    DLG.choices.forEach((c, i) => {
      const cx = CH.x0 + (i % 2) * CH.colW, cy = y0 + Math.floor(i / 2) * CH.rowH, sel = i === DLG.cursor;
      rect(cx, cy, CH.bw, CH.bh, sel ? '#f2c94c' : '#1d2130'); rect(cx, cy + CH.bh - 2, CH.bw, 2, sel ? '#b8902a' : '#11141d');
      rect(cx, cy, CH.bw, 1, sel ? '#ffe28a' : '#3a4157');
      const sz = textW(c.label) > CH.bw - 8 ? 6 : 8;
      text(c.label, cx + CH.bw / 2, cy + Math.round((CH.bh - (sz === 8 ? 9 : 7)) / 2), { align: 'center', size: sz, col: sel ? '#1b1a21' : (c.dim ? '#7d8394' : '#f4f3ee') });
    });
  }
  // настрой жильца
  if (DLG.mood) {
    const m = clamp(DLG.mood(), 0, 100), bx = 268, by = DLG_BOX.y - 12, bw = 118;
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
const PIXPAL = { r: '#6e6872', k: '#2b2a33', g: '#8f949c', l: '#d8dad6', n: '#e79aa6', e: '#e9a23b', w: '#f4f3ee', c: '#5b8bd6' };
const fromRows = rows => makeCanvas(Math.max(...rows.map(r => r.length)), rows.length, ({ p }) => rows.forEach((row, y) => [...row].forEach((ch, x) => PIXPAL[ch] && p(x, y, PIXPAL[ch]))));
// крыса — маленькая (12×5), смотрит влево: розовый нос, уши, хвост
const RAT = [fromRows(["...kk.......", "..krrkkk....", "nkrrrrrrrk..", ".krrrrrrrkkk", "..k.k..k.k.."]),
             fromRows(["...kk.......", "..krrkkk....", "nkrrrrrrrk..", ".krrrrrrrkkk", "...k.kk.k..."])];
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
    // первый раз — редактор и вступление, дальше — сразу «Мой ЖК»
    irisTo(60, 140, () => go(!(SAVE && SAVE.created) ? 'creator' : !SAVE.seenIntro ? 'prologue' : HOUSE_STATE.won.length ? 'house' : 'tour', { tour: 'L1' }));
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
    let bw = Math.max(textW(L(UI.cont)), textW(L(UI.settings)), textW(L(UI.rating)), 96) + 16; const py = 104;
    let nm = SAVE && SAVE.name ? SAVE.name : ''; if (nm.length > 12) nm = nm.slice(0, 11) + '…';
    // имя и уровень — первой строкой, ЖК и звание — второй; длинное обрезаем, чтобы панель не закрывала дом
    const fit = (s, w) => { if (textW(s, 6) <= w) return s; while (s.length > 1 && textW(s + '…', 6) > w) s = s.slice(0, -1); return s + '…'; };
    const ttl = USER.title ? (TITLES[USER.title] ? L(TITLES[USER.title]) : USER.title) : '';
    let who = nm ? L(UI.hello) + nm + '!' + (USER.level != null ? ' · ' + L(UI.lvShort) + USER.level : '') : '';
    let sub = USER.guest ? L(UI.guestMode) : [USER.complex.name, USER.apartment ? L(UI.aptShort) + USER.apartment : '', ttl].filter(Boolean).join(' · ');
    bw = Math.min(196, Math.max(bw, textW(who, 6) + 4, textW(sub, 6) + 4)); who = fit(who, bw - 2); sub = fit(sub, bw - 2);
    frameBox(12, py, bw + 12, 104);
    if (who) text(who, 18, py + 6, { col: '#cfd6e4', size: 6 });
    text(sub, 18, py + 16, { col: USER.guest ? '#8792ad' : '#9fd9c2', size: 6 });
    if (button(SAVE && SAVE.created ? L(UI.cont) : L(UI.play), 0, 132, 'primary', { left: 18, w: bw })) this.start();
    if (button(L(UI.rating), 0, 154, 'alt', { left: 18, w: bw })) irisTo(40, 162, () => go('leaderboard', { from: 'title' }));
    if (button(L(UI.settings), 0, 176, 'alt', { left: 18, w: bw })) { this.settings = true; this.sure = false; }
  },
  drawSettings() {
    rect(0, 0, W, H, 'rgba(11,12,16,.55)');
    paper(70, 30, 260, 170, 2);
    text(L(UI.settings), W / 2, 42, { align: 'center', col: INK_RED });
    text(L(UI.lang), W / 2, 62, { align: 'center', col: INK });
    if (button('ҚАЗ', W / 2 - 42, 76, LANG === 'kz' ? 'primary' : 'off', { w: 76 })) setLang('kz');
    if (button('РУС', W / 2 + 42, 76, LANG === 'ru' ? 'primary' : 'off', { w: 76 })) setLang('ru');
    text(L(UI.sound), W / 2, 100, { align: 'center', col: INK });
    if (button(SND.on ? L(UI.on) : L(UI.off), W / 2, 114, SND.on ? 'alt' : 'off')) { SND.on = !SND.on; saveStr('d67_sound', SND.on ? '1' : '0'); }
    if (button(this.done ? L(UI.resetDone) : this.sure ? L(UI.resetSure) : L(UI.reset), W / 2, 144, this.done ? 'off' : 'danger')) {
      if (this.done) {} else if (!this.sure) this.sure = true; else { SAVE = NEW_SAVE(); API.reset().catch(() => {}); this.done = true; }
    }
    if (button(L(UI.back), W / 2, 176, 'alt')) this.settings = false;
  },
};
function setLang(l) { LANG = l === 'ru' ? 'ru' : 'kz'; saveStr('d67_lang', l); document.getElementById('rotate').textContent = L(UI.rotate); }

/* ============================================================
   СЦЕНА: создание персонажа
   ============================================================ */
const OPT = {
  body: ['m', 'f'],
  bottom: ['pants', 'skirt'],
  skin: ['#f1c7a3', '#e3ad86', '#c98e66', '#9a6748'],
  hair: ['short', 'long', 'bun', 'curly', 'bald'],
  hairCol: ['#2b2420', '#4a2e22', '#a5503c', '#d9b43a', '#8f949c'],
  top: ['hoodie', 'shirt', 'jacket', 'leather', 'chapan'],
  topCol: ['#2f8577', '#3f6f8c', '#b8443f', '#c79a3b', '#5d6b5a', '#7d4f8a'],
  hat: [null, 'tyube', 'cap'],
};
const OPT_ROWS = ['body', 'skin', 'hair', 'hairCol', 'top', 'topCol', 'bottom', 'hat'];
scenes.creator = {
  enter() {
    this.look = Object.assign({}, DEFAULT_LOOK, SAVE.look || {}); this.row = 0; this.t = 0;
    const box = document.getElementById('nameBox'), inp = document.getElementById('nameInput');
    inp.value = SAVE.name || USER.name || ''; inp.placeholder = ['Атың', 'Имя', 'Name'][LI()]; box.hidden = false;
    setTouch({ act: L(UI.ready), up: true, down: true, move: true });
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
  change(k, d) { const a = OPT[k], i = a.indexOf(this.look[k] ?? null); this.look[k] = a[(i + d + a.length) % a.length]; sfx.select();
    // смена пола подбирает подходящие по умолчанию причёску и низ — дальше можно поменять
    if (k === 'body') { const f = this.look.body === 'f'; this.look.bottom = f ? 'skirt' : 'pants';
      if (f && this.look.hair === 'short') this.look.hair = 'long'; if (!f && (this.look.hair === 'long' || this.look.hair === 'bun')) this.look.hair = 'short'; } },
  done() {
    const name = (document.getElementById('nameInput').value || '').trim().slice(0, 12) || ['Төраға', 'Председатель', 'Chairman'][LI()];
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
      const y = 50 + i * 16, sel = this.row === i;
      if (sel) rect(194, y - 3, 200, 15, 'rgba(242,201,76,.15)');
      text(L(UI[k]), 200, y + 2, { col: sel ? '#f2c94c' : '#f4f3ee' });
      if (button('◂', 0, y - 2, 'dark', { left: 300, w: 16 })) { this.row = i; this.change(k, -1); }
      if (button('▸', 0, y - 2, 'dark', { left: 372, w: 16 })) { this.row = i; this.change(k, 1); }
      const v = this.look[k] ?? null;
      if (k === 'skin' || k === 'hairCol' || k === 'topCol') { rect(322, y, 44, 12, OUT); rect(323, y + 1, 42, 10, v); }
      else { const names = { short: 'Қысқа|Короткие|Short', long: 'Ұзын|Длинные|Long', bun: 'Түйін|Пучок|Bun', bald: 'Жоқ|Нет|None', curly: 'Бұйра|Кудри|Curly', leather: 'Күртеше|Куртка|Jacket', hoodie: 'Худи|Худи|Hoodie', shirt: 'Көйлек|Рубашка|Shirt', jacket: 'Пиджак|Пиджак|Blazer', chapan: 'Шапан|Чапан|Chapan', tyube: 'Тақия|Тюбетейка|Takiya', cap: 'Кепка|Кепка|Cap', null: '—|—|—', m: 'Ер|Парень|Guy', f: 'Қыз|Девушка|Girl', pants: 'Шалбар|Брюки|Trousers', skirt: 'Юбка|Юбка|Skirt' };
        const s = (names[v] || '—|—|—').split('|')[LI()]; text(s, 344, y + 2, { align: 'center', col: '#9fd9c2', size: s.length > 6 ? 6 : 8 }); }
    });
    if (button(L(UI.ready), 296, 190, 'primary', { selected: this.row === OPT_ROWS.length })) this.done();
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
  const apts = []; for (let apt = 1; apt <= tour.floors * tour.perFloor; apt++) if (apt !== tour.heroApt && !isStorage(apt)) apts.push(apt);
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
    if (apt === tour.heroApt || isStorage(apt)) continue;
    const a = mix[k++], A = ARCH[a];
    // у каждого жильца своя внешность и имя по полу и возрасту — не «одна моделька на всех»
    const look = varyLook(a, R), pool = namePool(a, look);
    let name = pick(R, pool); let tries = 0; while (used.has(name) && tries++ < 8) name = pick(R, pool); used.add(name);
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
    const tour = this.tour = TOURS[data.tour || 'L1'];
    // первый заход в тур: сначала заставка («5 дней», «прошло полгода»…) и квиз перед собранием
    SAVE.inter = SAVE.inter || {};
    if (!data.skipInter && !SAVE.inter[tour.id]) { go('interlude', { tour: tour.id }); return; }
    this.fixed = new Set(HOUSE_STATE.fixed); this.problem = tour.problem ? PROBLEMS.find(p => p.id === tour.problem) : null;
    this.startedAt = Date.now();
    this.res = makeResidents(tour, hashStr(USER.userId + tour.id) + (SAVE.tours[tour.id]?.tries || 0));
    // каждый сделанный ремонт — доверие к председателю: соседи видят результат
    const repaired = Math.min(5, HOUSE_STATE.fixed.length); for (const r of Object.values(this.res)) r.mood += repaired * 4;
    // кто-то откажет сразу на пороге (ворчуны — чаще); ремонты делают отказников реже
    // с собрания 2 (есть E-KNOT) часть соседей сама голосует в приложении — «за» или «против»
    const RR = rng(hashStr(USER.userId + tour.id) + 77 + (SAVE.tours[tour.id]?.tries || 0)), app = tour.n >= 2;
    for (const r of Object.values(this.res)) {
      if (!r.A.renter && !r.A.notOwner && !r.A.noVote && RR() < (REFUSE[r.arch] || 0) * (1 - repaired * .1)) r.refuser = true;
      if (app && r.A.onlineOk && !r.A.paperOnly && !r.A.renter && !r.A.notOwner && RR() < .12) r.selfAt = tour.start + tour.duration * (.08 + RR() * .8);
    }
    this.app = app; this.onYes = 0; this.onNo = 0; this.onFlash = 0;
    // подростки курят на лестнице, пока нет камер; «нехорошая квартира» — пока нет домофона с доступом из E-KNOT
    const fl = 3 + Math.floor(RR() * 9);
    this.teens = this.fixed.has('cameras') ? null : { floor: fl === Math.ceil(tour.heroApt / tour.perFloor) ? fl + 1 : fl, x: 150 + RR() * 40, st: 'here', backAt: 0, t: 0 };
    if (this.teens) for (const r of Object.values(this.res)) if (r.floor === this.teens.floor) r.mood -= 3;
    this.shady = Object.values(this.res).find(r => r.A.noVote) || null;
    // енот: 4 действия по очереди, вместо лимитов — паузы в игровых днях; бонус квиза — ещё одно дожатие
    this.rac = { open: 0, uses: { notify: 0, call: 0, redial: 0, chat: 0 }, readyDay: { notify: 0, call: 0, redial: 0, chat: 0 }, bonus: (SAVE.quizBonus && SAVE.quizBonus[tour.id]) ? 1 : 0, menu: false };
    const R = rng(hashStr(USER.userId) + 9);
    this.doorLook = {}; for (let apt = 1; apt <= tour.floors * tour.perFloor; apt++) this.doorLook[apt] = pick(R, DOOR_STYLES);
    this.doorLook[tour.heroApt] = { col: '#2f6f62', kind: 'metal' };
    this.bg = drawStairwell(tour.floors, apt => this.doorLook[apt], this.fixed);
    this.WH = this.bg.height;
    const hf = Math.ceil(tour.heroApt / tour.perFloor);
    this.hero = { x: DOOR_X[(tour.heroApt - 1) % tour.perFloor] + 20, floor: hf, y: floorBase(hf, tour.floors), dir: -1, walkT: 0, moving: false, climb: null, knockT: 0 };
    this.minute = tour.start; this.end = tour.start + tour.duration;
    this.events = []; this.broadcasts = 0; this.busy = false; this.ballot = false; this.goalShown = false; this.over = false;
    this.camY = clamp(this.hero.y - 165, 0, this.WH - H); this.camX = clamp(this.hero.x - W / 2, 0, SW - W);
    this.talker = { floor: tour.talkerFloor, x: 95, done: false, look: { skin: '#d6a07a', hair: 'short', hairCol: '#3a2a20', top: 'hoodie', topCol: '#3b3f55', pants: '#2b2a33', hat: 'cap', capCol: '#3f6f8c', beard: true } };
    this.helper = { state: 'hidden', floor: 2, x: 397, look: { skin: '#e3ad86', hair: 'long', hairCol: '#1b1a21', top: 'jacket', topCol: '#7d4f8a' } };
    this.rats = this.fixed.has('basement') ? [] : [{ x: 80, dir: 1, t: 0, st: 'roam', k: 0, pause: 0 }, { x: 380, dir: -1, t: 300, st: 'roam', k: 0, pause: 0 }];
    this.liftPick = false; this.drops = []; this.paused = false;
    this.racAnim = null; this.lampSeed = Math.random() * 1000; this.stepAcc = 0;
    this.run = null; API.tourStart(tour.id).then(r => this.run = r).catch(() => {});
    this.plan = null;
    // повестка собрания: какая жалоба и сколько подписей нужно
    const runId = this.runId = (this.runId || 0) + 1, here = () => scene === scenes.tour && this.runId === runId && !this.over;
    setTimeout(() => { if (!here()) return; toast(L(UI.meetingT).replace('{n}', tour.n), L(UI.meetingB).replace('{t}', L(tour.title)).replace('{r}', ruleText(tour)), 5200);
      if (tour.n === 1) setTimeout(() => here() && toast('E-KNOT', L(UI.tutTap)), 4600);
      if (tour.n >= 2 && !SAVE.racIntro) setTimeout(() => here() && this.racIntro(), 5400); }, 500);
    setTouch({ move: true });
  },
  focus() { return { x: this.hero.x - this.camX, y: this.hero.y - this.camY - 14 }; },
  signatures() { return Object.values(this.res).filter(r => r.status === 'yes').length; },
  votes() { return this.signatures(); },
  against() { return Object.values(this.res).filter(r => r.status === 'no').length; },
  abstained() { return Object.values(this.res).filter(r => r.status === 'abstain').length; },
  outcome() { return voteOutcome(this.tour, this.votes(), this.against(), this.abstained()); },
  // доля голосов «за», собранных приложением (уведомление, обзвон, дожатие, чат, приглашение хозяину)
  appShare() { const y = this.events.filter(e => e.t === 'yes'), app = y.filter(e => APP_VIA.includes(e.via)).length; return y.length ? Math.round(app / y.length * 100) : 0; },
  goalMet() { return this.outcome().ok; },
  // с учётом обещавших проголосовать онлайн: можно закрыть собрание и дождаться их голосов
  goalLikely() { const pend = Object.values(this.res).filter(r => r.status === 'online').length; return voteOutcome(this.tour, this.votes() + pend, this.against(), this.abstained()).ok; },
  // игровой день 1…60: время тура растянуто на 60 дней
  day() { const T = this.tour; return clamp(Math.floor((this.minute - T.start) / T.duration * T.days) + 1, 1, T.days); },
  // после первого собрания сосед рассказывает про приложение E-KNOT и енота
  async racIntro() {
    if (this.busy || DLG.open) return setTimeout(() => scene === this && !this.over && !SAVE.racIntro && this.racIntro(), 1500);
    this.busy = true; this.plan = null;
    const look = ARCH.it.look, h = this.hero, side = h.x + 26 < WALK_MAX ? 1 : -1;
    this.racNpc = { x: h.x + side * 26, floor: h.floor, look }; h.dir = side;
    dlgOpen('Данияр', e => portrait(look, e), ARCH.it.voice);
    await say(L(PRO.rac1), 'happy'); await say(L(PRO.rac2));
    dlgOpen('E-KNOT', () => RACCOON_PORT, 900); await say(L(RAC_INTRO.notify), 'happy'); await say(L(UI.racMenuHint), 'happy'); dlgClose();
    SAVE.racIntro = true; SAVE.racSeen = { ...(SAVE.racSeen || {}), notify: true }; persist(); this.busy = false; this.racNpc.leaving = 1;
  },
  // обещал проголосовать онлайн: голос придёт позже, через несколько игровых дней
  goOnline(r, via) { r.status = 'online'; r.channel = via; r.onlineAt = this.minute + 4 + Math.random() * this.tour.duration * .25; this.events.push({ t: 'online', apt: r.apt, via }); },
  onlineVote(r, yes) {
    r.status = yes ? 'yes' : 'no'; r.viaApp = true; this.onFlash = 700;
    this.events.push({ t: yes ? 'yes' : 'no', apt: r.apt, via: r.channel && r.channel !== 'door' ? r.channel : 'online' });
    if (yes) this.onYes++; else this.onNo++;
    if (this.hero.floor === r.floor) pop(DOOR_X[r.d], this.base(r.floor) - 70, yes ? '+1 E-KNOT' : '−1 E-KNOT', yes ? '#7fc4a8' : '#e88a7a');
    if (yes) this.checkGoal(300);
  },
  // онлайн-голоса приходят по ходу собрания — счётчик в HUD меняется
  tickOnline() {
    const m = this.minute;
    for (const r of Object.values(this.res)) {
      if (r.status === 'online' && m >= r.onlineAt) this.resolveOnline(r);
      else if (this.app && r.selfAt && m >= r.selfAt) { r.selfAt = null;
        if (!['unknown', 'away', 'noanswer', 'thinking'].includes(r.status)) continue;
        if (r.mood >= 40 && !r.refuser) this.onlineVote(r, true); else if (r.mood < 28 || r.refuser) this.onlineVote(r, false); }
    }
  },
  // обещанный онлайн-голос пришёл: «за», реже «против»; хозяева арендаторов и братья — через раз; «не за» в этом туре — воздержался
  resolveOnline(r) {
    const k = Math.random(), sc = scenFor(r.arch, this.tour);
    if (r.ownerP != null) { if (k < r.ownerP) this.onlineVote(r, true); else { r.status = 'novote'; r.onlineAt = null; } return; }
    if (sc && (sc.noYes || sc.abstainOnly)) { r.status = 'abstain'; r.viaApp = true; this.events.push({ t: 'abstain', apt: r.apt, via: r.channel || 'online' }); return; }
    const py = r.arch === 'night' ? .9 : .84;
    if (k < py) this.onlineVote(r, true); else if (k < py + .05) this.onlineVote(r, false); else { r.status = 'thinking'; r.onlineAt = null; }
  },
  addTime(m) { this.minute += m; },
  base(f) { return floorBase(f, this.tour.floors); },
  nearDoor() { const h = this.hero; if (h.climb || h.ride) return null; for (let d = 0; d < DOOR_X.length; d++) if (Math.abs(h.x - DOOR_X[d]) < 12) { const a = (h.floor - 1) * DOOR_X.length + d + 1; return isStorage(a) ? null : a; } return null; },
  nearLift() { const h = this.hero; return !h.climb && !h.ride && Math.abs(h.x - LIFT_X) < 12; },
  // лифт: пока не отремонтирован — только табличка; после ремонта возит на любой этаж
  useLift(to) {
    const h = this.hero;
    if (!this.fixed.has('lift')) { pop(LIFT_X, h.y - 70, L(UI.liftBroken), '#e88a7a'); sfx.no(); return false; }
    if (to == null) { this.liftPick = true; return true; }
    if (to === h.floor) return true;
    h.ride = { from: h.floor, to, t: 0 }; h.x = LIFT_X; beep(660, .08, 'sine', .04); beep(880, .08, 'sine', .04, .1); return true;
  },
  nearNPC() {
    const h = this.hero; if (h.climb) return null;
    if (this.helper.state === 'shown' && h.floor === this.helper.floor && Math.abs(h.x - this.helper.x) < 16) return 'helper';
    return null;
  },

  update(dt) {
    if (this.over) return;
    // пауза: время стоит, можно продолжить или выйти из уровня
    if (this.paused) { setTouch({}); if (hit('back')) this.paused = false; return; }
    if (hit('back') && !this.busy && !DLG.open && !this.ballot && !this.liftPick) { this.paused = true; return; }
    dlgUpdate(dt);
    const h = this.hero, T = this.tour;
    // время идёт, пока игрок ходит (в диалоге и в бюллетене — пауза)
    if (!this.busy && !this.ballot && !trans.phase) this.minute += dt / 1000 / T.secPerMin;
    if (!T.noTimer && this.minute >= this.end && !this.busy) { this.finish(true); return; }
    this.updateTeens(dt);
    this.tickCouncil(); this.tickOnline(); if (this.onFlash > 0) this.onFlash -= dt;
    // помощница возвращается с результатом
    if (this.helper.state === 'busy' && this.minute >= this.helper.doneAt) this.helperDone();
    if (this.helper.state === 'hidden' && this.signatures() >= T.helperAfter) this.helper.state = 'shown';
    // крысы
    this.updateRats(dt);
    if (this.racAnim) { this.racAnim.t += dt; if (this.racAnim.t > (this.racAnim.kind === 'chat' ? 4200 : 2200)) this.racAnim = null; }

    if (this.ballot) { if (hit('ballot') || hit('back') || hit('act')) this.ballot = false; return; }
    if (this.liftPick) { if (hit('back')) this.liftPick = false; for (let k = 1; k <= 9; k++) if (pressed['Digit' + k]) { this.liftPick = false; this.useLift(k); } return; }
    // поездка на лифте
    if (h.ride) { const R0 = h.ride; R0.t += dt; const dur = 500 + Math.abs(R0.to - R0.from) * 250, k = Math.min(1, R0.t / dur);
      h.y = lerp(this.base(R0.from), this.base(R0.to), k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
      if (k >= 1) { h.floor = R0.to; h.y = this.base(R0.to); h.ride = null; this.addTime(.3); beep(988, .1, 'sine', .04); }
      this.updateCam(dt); return; }
    if (this.busy) {
      if (h.goal != null) { const d = h.goal - h.x; h.dir = Math.sign(d) || h.dir; h.moving = true; h.walkT += dt; h.x += Math.sign(d) * Math.min(Math.abs(d), dt * .075);
        if (Math.abs(h.goal - h.x) < .5) { h.x = h.goal; h.goal = null; h.moving = false; const a = h.arrive; h.arrive = null; a && a(); } }
      else h.moving = false;
      this.updateCam(dt); return;
    }

    if (hit('ballot')) { this.ballot = true; return; }
    if (hit('raccoon') && this.app) this.rac.menu = !this.rac.menu;

    // лестница
    if (h.climb) {
      const c = h.climb; c.t += dt / 2600;
      const pts = c.pts, seg = c.t < .5 ? 0 : 1, k = seg ? (c.t - .5) * 2 : c.t * 2;
      const a = pts[seg], b = pts[seg + 1];
      h.x = lerp(a[0], b[0], Math.min(1, k)); h.y = lerp(a[1], b[1], Math.min(1, k)); h.dir = b[0] < a[0] ? -1 : 1; h.walkT += dt;
      this.stepAcc += dt; if (this.stepAcc > 260) { this.stepAcc = 0; sfx.step(); }
      if (c.t >= 1) { h.floor = c.to; h.x = pts[2][0]; h.y = this.base(c.to); h.climb = null; this.addTime(.5); }
      this.updateCam(dt); return;
    }
    let dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (dir || keys.up || keys.down) this.plan = null;          // клавиши отменяют маршрут
    if (!dir && this.plan) {
      const P = this.plan;
      const viaLift = this.fixed.has('lift'), sx = viaLift ? LIFT_X : STAIR_FOOT;
      if (P.floor !== h.floor) {                                   // сначала к лестнице (или лифту) и по этажам
        if (Math.abs(h.x - sx) > 1.5) dir = Math.sign(sx - h.x);
        else { if (viaLift) this.useLift(P.floor); else this.startClimb(Math.sign(P.floor - h.floor)); this.updateCam(dt); return; }
      } else if (Math.abs(h.x - P.x) > 1.5) dir = Math.sign(P.x - h.x);
      else {
        this.plan = null; h.moving = false;
        if (P.door) { if (P.door === T.heroApt) toast('E-KNOT', L(UI.yourDoor), 2400); else if (isStorage(P.door)) toast(aptNo(P.door), L(UI.storage), 2200); else this.visit(this.res[P.door]); this.updateCam(dt); return; }
        if (P.npc) { this.runHelper(); this.updateCam(dt); return; }
        if (P.lift) { this.useLift(); this.updateCam(dt); return; }
      }
      if (dir && Math.abs((P.floor !== h.floor ? sx : P.x) - h.x) < dt * .075) { h.x = P.floor !== h.floor ? sx : P.x; dir = 0; }
    }
    h.moving = dir !== 0;
    if (dir) { h.dir = dir; h.x = clamp(h.x + dir * dt * .075, WALK_MIN, WALK_MAX); h.walkT += dt; this.stepAcc += dt; if (this.stepAcc > 230) { this.stepAcc = 0; sfx.step(); } }
    h.y = this.base(h.floor);
    const onStairs = Math.abs(h.x - STAIR_FOOT) < 10;
    if (onStairs && hit('up') && h.floor < T.floors) this.startClimb(1);
    else if (onStairs && hit('down') && h.floor > 1) this.startClimb(-1);
    // болтун перехватывает
    if (!this.talker.done && h.floor === this.talker.floor && Math.abs(h.x - this.talker.x) < 40) { this.runTalker(); return; }
    const door = this.nearDoor(), npc = this.nearNPC(), lift = this.nearLift();
    setTouch({ act: npc ? L(UI.talk) : door ? L(UI.knock) : lift ? L(UI.lift) : null, up: onStairs && h.floor < T.floors, down: onStairs && h.floor > 1, move: true });
    if (hit('act')) {
      if (npc === 'helper') this.runHelper();
      else if (door === T.heroApt) toast('E-KNOT', L(UI.yourDoor), 2400);
      else if (door && isStorage(door)) toast(aptNo(door), L(UI.storage), 2200);
      else if (door) this.visit(this.res[door]);
      else if (lift) this.useLift();
    }
    this.updateCam(dt);
  },
  updateCam(dt) {
    const target = clamp(this.hero.y - (DLG.open ? DLG_BOX.y - 22 : 165), 0, this.WH - H);
    this.camY = lerp(this.camY, target, Math.min(1, dt / 160));
    // по горизонтали камера стоит, пока герой в средней части экрана (лестница целиком в ней) — без качки на пролётах
    const sx = this.hero.x - this.camX; let tx = this.camX;
    if (sx < 120) tx = this.hero.x - 120; else if (sx > 280) tx = this.hero.x - 280;
    this.camX = lerp(this.camX, clamp(tx, 0, SW - W), Math.min(1, dt / 200));
  },
  startClimb(d) {
    const h = this.hero, b = this.base(h.floor);
    // пролёт вправо до площадки, затем влево — на следующий этаж
    h.climb = d > 0 ? { to: h.floor + 1, t: 0, pts: [[STAIR_FOOT, b], [STAIR_TOP, b - 50], [STAIR_FOOT, b - 100]] }
                    : { to: h.floor - 1, t: 0, pts: [[STAIR_FOOT, b], [STAIR_TOP, b + 50], [STAIR_FOOT, b + 100]] };
  },

  onTap(x, wy) {
    const T = this.tour; let f = 1;
    for (let k = 1; k <= T.floors; k++) { const b = this.base(k); if (wy > b - FLOOR_H + 6 && wy <= b + 8) f = k; }
    if (wy < this.base(T.floors) - FLOOR_H + 6) f = T.floors;
    const plan = { floor: f, x: clamp(x, WALK_MIN, WALK_MAX) };
    for (let d = 0; d < DOOR_X.length; d++) if (Math.abs(x - DOOR_X[d]) < 17) { plan.x = DOOR_X[d] + (x < DOOR_X[d] ? -4 : 4); plan.door = (f - 1) * DOOR_X.length + d + 1; }
    if (this.helper.state === 'shown' && f === this.helper.floor && Math.abs(x - this.helper.x) < 12) { plan.x = this.helper.x + 12; plan.npc = 'helper'; plan.door = null; }
    if (Math.abs(x - STAIR_FOOT) < 14 || (x > CORE_L && x < LIFT_X - 14)) plan.x = STAIR_FOOT;
    if (Math.abs(x - LIFT_X) < 14 && f === this.hero.floor) { plan.x = LIFT_X; plan.lift = true; }
    this.plan = plan; sfx.select();
  },
  // на что жалуется жилец: только на то, что ещё не отремонтировано. Чаще — на тему собрания;
  // когда осталась одна проблема, о ней говорят все
  complaint(r) {
    const left = PROBLEMS.filter(p => !this.fixed.has(p.id)); if (!left.length) return null;
    let pool = left.filter(p => !p.floors || (r.floor >= p.floors[0] && r.floor <= p.floors[1])); if (!pool.length) pool = left;
    let p;
    if (left.length === 1) p = left[0];
    else if ((r.v + r.apt) % 2 === 0 && pool.includes(this.problem)) p = this.problem;
    else p = pool[(r.apt * 7 + r.v) % pool.length];
    return p.lines[(r.v + r.apt) % p.lines.length];
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
        r.x += r.dir * dt * .045; if (r.x < 20 || r.x > SW - 20) r.dir *= -1;
        if (Math.random() < dt / 2500) r.pause = 300 + Math.random() * 900; if (Math.random() < dt / 4000) r.dir *= -1;
      } else if (r.st === 'alert') {                         // замерла, «!» — и бежит
        if (r.k > 260) { r.st = 'flee'; r.k = 0;
          const away = RAT_HOLES.filter(x => Math.sign(x - r.x) !== Math.sign(h.x - r.x) || h.climb);
          r.hole = (away.length ? away : RAT_HOLES).reduce((a, x) => Math.abs(x - r.x) < Math.abs(a - r.x) ? x : a); r.dir = Math.sign(r.hole - r.x) || 1; }
      } else if (r.st === 'flee') {
        const goal = r.hole - r.dir * 7, d = goal - r.x; r.x += Math.sign(d) * Math.min(Math.abs(d), dt * .2);
        if (Math.abs(d) < 1) { r.st = 'in'; r.k = 0; }
      } else if (r.st === 'in') { if (r.k > 320) { r.st = 'hidden'; r.k = 0; } }
      else if (r.st === 'hidden') { if (near) r.k = 0; else if (r.k > 2200 + Math.random() * 800) { r.st = 'out'; r.k = 0; r.dir = Math.random() < .5 ? -1 : 1; } }
      else if (r.st === 'out') { if (r.k > 320) { r.st = 'roam'; r.k = 0; r.x = r.hole + r.dir * 7; } }
    }
  },
  drawRats(cy, t) {
    const b = this.base(1) - cy;
    for (const r of this.rats) {
      const fr = RAT[r.st === 'flee' ? Math.floor(r.t / 60) % 2 : r.st === 'roam' && r.pause <= 0 ? Math.floor(r.t / 120) % 2 : 0];
      if (r.st === 'hidden') { if (Math.floor(t / 1700 + r.x) % 3 === 0 && (t % 1700) < 1200) { rect(r.hole - 1, b - 3, 1, 1, '#e8d36a'); rect(r.hole + 1, b - 3, 1, 1, '#e8d36a'); } continue; }
      if (r.st === 'in' || r.st === 'out') {
        // ныряет в нору головой вперёд (или вылезает): часть за краем норы скрыта
        const k = Math.min(1, r.k / 320), x = r.hole - r.dir * 7 + r.dir * 14 * k;
        const hideSide = r.st === 'in' ? r.dir : -r.dir;
        ctx.save(); ctx.beginPath(); if (hideSide > 0) ctx.rect(0, 0, r.hole, H); else ctx.rect(r.hole + 1, 0, W, H); ctx.clip();
        sprite(fr, Math.round(x - 6), b - 5, r.dir > 0); ctx.restore();
        continue;
      }
      sprite(fr, Math.round(r.x - 6), b - 5, r.dir > 0);
      if (r.st === 'alert') text('!', r.x, b - 14, { col: '#f2c94c', align: 'center', size: 6, shadow: '#0b0c10' });
    }
  },

  /* ---- стук в дверь и разговор ---- */
  // реплика героя в разговоре с жильцом (его портрет и голос), потом — обратно к жильцу
  async heroSay(r, line, expr = 'happy') {
    const swap = DLG.port, swapName = DLG.name, swapMood = DLG.mood;
    DLG.port = e => portrait(SAVE.look, e); DLG.name = SAVE.name; DLG.voice = 420;
    await say(this.fmt(r, line), expr);
    DLG.port = swap; DLG.name = swapName; DLG.voice = r.A.voice; DLG.mood = swapMood;
  },
  fmt(r, v) { const T = this.tour; return fmtLine(typeof v === 'string' ? v : L(v), { f: r.floor, apt: aptNo(r.apt), g: T.goal, q: T.quorum || '' }).replace('{n}', this.signatures()); },
  async visit(r) {
    this.busy = true; const h = this.hero, T = this.tour;
    // встаём сбоку от двери, чтобы жилец вышел на порог, а не «в» героя
    let side = h.x <= DOOR_X[r.d] ? -1 : 1; if (DOOR_X[r.d] + side * 23 < WALK_MIN) side = 1; if (DOOR_X[r.d] + side * 23 > WALK_MAX) side = -1;
    await this.walkTo(DOOR_X[r.d] + side * 23); h.dir = -side;
    h.knockT = 700; sfx.knock(); this.addTime(.5); pop(DOOR_X[r.d], this.base(r.floor) - 30, ['тық-тық', 'тук-тук'][LI()] || 'тук-тук', '#c9cdc8');
    await wait(750);
    const m = this.minute, A = r.A;
    if (r.status === 'online') { pop(DOOR_X[r.d], this.base(r.floor) - 70, L(UI.st.online), '#9fd9c2'); this.busy = false; return; }
    const away = r.away && m < r.returnAt;
    if (away) { r.status = r.status === 'unknown' ? 'away' : r.status; r.knocks++; pop(DOOR_X[r.d], this.base(r.floor) - 70, '...', '#9fb0cc'); toast('E-KNOT', L(UI.nobody), 2400); this.busy = false; return; }
    // бумажный голос или доверенность ждут героя — открывают сразу
    const expecting = ['paper', 'proxy'].includes(r.status);
    const pNo = expecting ? 0 : (r.sleeping ? .5 : A.deaf) * Math.pow(.45, r.knocks);
    if (Math.random() < pNo) { r.knocks++; if (r.status === 'unknown' || r.status === 'away') r.status = 'noanswer'; pop(DOOR_X[r.d], this.base(r.floor) - 70, '...', '#8f949c'); toast('E-KNOT', L(UI.noOpen), 2400); this.busy = false; return; }
    // открывают
    sfx.door(); await tweenDoor(r, 1);
    if (r.sleeping) { r.mood -= 8; r.sleeping = false; }
    r.away = false; this.addTime(.5);
    const sc = A.noVote || A.renter || A.notOwner ? null : scenFor(r.arch, T);
    dlgOpen(r.name, e => portrait(r.look, e), A.voice, A.noVote || A.renter || A.notOwner ? null : () => r.mood);
    // реплика жильца: из сценария тура, иначе из характера; у каждого свой вариант, реакции без повторов подряд
    const Ln = (k, src) => {
      if (k === 'story') { const c = this.complaint(r); if (c) return this.fmt(r, c); }
      let v = src !== undefined ? src : (sc && sc[k]) || A.lines[k] || GENERIC[k]; if (!v) return '';
      if (!Array.isArray(v)) { if (v.top || v.low) { const top = r.floor === T.floors; v = (top && v.top) || (!top && v.low) || v; } return this.fmt(r, v); }
      if (['good', 'meh', 'bad'].includes(k)) { let i; do i = Math.floor(Math.random() * v.length); while (v.length > 1 && i === r.last[k]); r.last[k] = i; return this.fmt(r, v[i]); }
      let line = v[r.v % v.length]; const top = r.floor === T.floors;
      if (top && line.top) line = line.top; else if (!top && line.low) line = line.low;
      return this.fmt(r, line); };
    const tourLine = A.lines[T.scen];          // арендатор и не собственник: своя реплика в турах 4, 6, 7
    if (A.noVote) return this.visitShady(r, Ln);
    if (A.renter) return this.visitRenter(r, Ln, tourLine);
    if (A.notOwner) return this.visitNotOwner(r, Ln, tourLine);
    if (r.status === 'yes') { await say(L(GENERIC.already), 'happy'); return this.endVisit(r); }
    if (r.status === 'no') { await say(L(GENERIC.againNo), 'angry'); return this.endVisit(r); }
    if (r.status === 'abstain') { await say(Ln('think'), 'think'); return this.endVisit(r); }
    if (r.refuser) { const v = PRO.refuse[(r.apt + r.v) % PRO.refuse.length]; sfx.no(); await say(L(v), 'angry'); r.status = 'no'; this.events.push({ t: 'no', apt: r.apt, via: 'door' }); return this.endVisit(r); }
    // бумажный бюллетень (тур 2+): голос вносится в E-KNOT с пометкой «бумага»
    const paper = r.status === 'paper' && T.n >= 2;
    if (paper) { await say(this.fmt(r, PAPER[r.arch] || PAPER.apa), 'happy'); r.mood += 8; }
    else if (r.status === 'thinking') { r.mood += 4; await say(Ln('again')); }
    else await say(Ln('greet'), r.mood < 30 ? 'angry' : 'neutral');
    const via = paper ? 'paper' : 'door';
    if (paper && r.mood >= 60) return this.decide(r, sc, Ln, via);
    if (r.holdLeft == null) r.holdLeft = A.hold || 0;
    for (let round = 0; round < 3; round++) {
      const canOnline = this.app && !paper;
      const menu = [{ label: L(UI.cExplain), k: 'explain' }, { label: L(UI.aFacts), k: 'facts' }, { label: L(UI.aBenefit), k: 'benefit' }, { label: L(UI.aNeighbors), k: 'neighbors' },
        { label: L(UI.aOnline), k: 'online' }, { label: L(UI.cListen), k: 'listen', dim: r.listened }, { label: L(UI.cLater), k: 'later' }].filter(m => m.k !== 'online' || canOnline);
      const c = menu[await ask(menu)].k;
      if (c === 'later') {
        // новосёлка не отпускает: «я ещё не досказала!»
        if (r.holdLeft > 0) { r.holdLeft--; await say(this.fmt(r, pickLine(A.lines.hold, A.hold - r.holdLeft - 1)), 'angry'); this.addTime(1); round--; continue; }
        await say(L(GENERIC.bye)); if (!['yes', 'paper'].includes(r.status)) r.status = 'thinking'; return this.endVisit(r);
      }
      // реплика героя: из сценария тура (объяснить / факты / выгода), остальное — общие фразы
      const heroLine = (sc && sc.hero && sc.hero[c]) || { explain: UI.heroExplain, facts: UI.heroFacts, benefit: UI.heroBenefit, neighbors: UI.heroNeighbors, online: UI.heroOnline, listen: UI.heroListen }[c];
      await this.heroSay(r, heroLine);
      if (c === 'online') {
        this.addTime(.5);
        if (A.onlineOk && !A.paperOnly) { this.goOnline(r, 'door'); await say(Ln('online', (sc && sc.online) || A.lines.online || GENERIC.online), 'happy'); return this.endVisit(r); }
        // от онлайна отказался — отметка 📄: герой придёт с бумажным бюллетенем
        r.mood += A.likes.online; await say(Ln('noOnline', A.lines.noOnline || GENERIC.noOnline), 'angry');
        if (T.n >= 2 && A.paperOnly) { r.status = 'paper'; pop(DOOR_X[r.d], this.base(r.floor) - 70, '📄', '#d8d2bf'); }
      } else if (c === 'listen') {
        this.addTime(3);
        if (r.listened) { await say(L(GENERIC.storyDone)); }
        else { r.listened = true; r.mood += A.listen || 0; await say(Ln('story'), (A.listen || 0) > 0 ? 'sad' : 'angry'); SAVE.trust[r.apt] = (SAVE.trust[r.apt] || 0) + 4; }
      } else {
        this.addTime(1);
        let d = (A.likes[c] || 0) + Math.round((Math.random() - .5) * 6);
        if (c === 'neighbors' && A.likes.neighbors > 0) d += Math.min(14, this.signatures() * 2);
        r.mood += d;
        await say(Ln(d >= 10 ? 'good' : d <= 0 ? 'bad' : 'meh'), d >= 10 ? 'happy' : d <= 0 ? 'angry' : 'think');
      }
      r.mood = clamp(r.mood, 0, 100);
      if (r.mood >= 70) return this.decide(r, sc, Ln, via);
      if (r.mood <= 12) return this.refuse(r, Ln);
    }
    await say(Ln('think'), 'think'); if (r.status !== 'paper') r.status = 'thinking'; return this.endVisit(r);
  },
  // жилец решился: «за»; но в некоторых турах характер «за» не голосует — только воздерживается или «подумаю»
  async decide(r, sc, Ln, via) {
    if (sc && sc.abstainOnly) { await say(this.fmt(r, sc.abstain || sc.think), 'think'); return this.abstain(r, via); }
    if (sc && sc.noYes) { const t = sc.think || sc.abstain; await say(this.fmt(r, t), 'think');
      if (/оздерж|қалыс/i.test((t.ru || '') + (t.kz || ''))) return this.abstain(r, via);
      r.status = 'thinking'; return this.endVisit(r); }
    r.status = 'yes'; await say(Ln('yes'), 'happy'); this.signed(r, via); return this.endVisit(r);
  },
  async refuse(r, Ln) { r.status = 'no'; sfx.no(); await say(Ln('no'), 'angry'); this.events.push({ t: 'no', apt: r.apt, via: 'door' }); return this.endVisit(r); },
  abstain(r, via) { r.status = 'abstain'; this.events.push({ t: 'abstain', apt: r.apt, via }); pop(DOOR_X[r.d], this.base(r.floor) - 70, '⏸', '#c9c3b0'); this.checkGoal(300); return this.endVisit(r); },
  // «нехорошая квартира»: дверь открывают нехотя, голоса нет — только намёк
  async visitShady(r, Ln) {
    if (r.status === 'novote') await say(Ln('again'), 'angry');
    else { await say(Ln('greet'), 'angry'); await say(Ln('owner'), 'think'); r.status = 'novote'; }
    return this.endVisit(r);
  },
  // арендатор: тур 1 — доверенность хозяйки, с тура 2 — приглашение хозяйке в E-KNOT
  async visitRenter(r, Ln, tourLine) {
    const T = this.tour, A = r.A;
    if (r.status === 'proxy') return this.proxyVisit(r, .4);
    if (r.status === 'online' || r.status === 'yes') { await say(Ln('again'), 'happy'); return this.endVisit(r); }
    await say(tourLine ? this.fmt(r, pickLine(tourLine)) : Ln(T.n >= 2 ? 'greetApp' : 'greet'), 'happy');
    if (!tourLine) await say(Ln('support'));
    const menu = [T.n >= 2 ? { label: L(UI.aInvite), k: 'invite' } : { label: L(UI.aProxy), k: 'proxy' }, { label: L(UI.cLater), k: 'later' }];
    const c = menu[await ask(menu)].k;
    if (c === 'invite') { await say(Ln('online'), 'happy'); this.goOnline(r, 'owner'); r.ownerP = .5; return this.endVisit(r); }
    if (c === 'proxy') { await this.heroSay(r, A.lines.proxyAsk); await say(this.fmt(r, A.lines.proxyOk), 'happy'); r.status = 'proxy'; return this.endVisit(r); }
    await say(L(GENERIC.bye)); if (r.status === 'unknown') r.status = 'novote'; return this.endVisit(r);
  },
  // не собственник: живёт у брата. greet → любой довод → «квартира брата» → доверенность / онлайн / уйти
  async visitNotOwner(r, Ln, tourLine) {
    const T = this.tour, A = r.A;
    if (r.status === 'proxy') return this.proxyVisit(r, .6);
    if (r.status === 'online' || r.status === 'yes') { await say(Ln('again'), 'neutral'); return this.endVisit(r); }
    if (r.revealed) await say(Ln('again'), 'neutral');
    else {
      await say(tourLine ? this.fmt(r, pickLine(tourLine)) : Ln('greet'), 'neutral');
      const m0 = [{ label: L(UI.cExplain), k: 'explain' }, { label: L(UI.aFacts), k: 'facts' }, { label: L(UI.aBenefit), k: 'benefit' }];
      const c0 = m0[await ask(m0)].k;
      await this.heroSay(r, { explain: UI.heroExplain, facts: UI.heroFacts, benefit: UI.heroBenefit }[c0]);
      await say(Ln('reveal1'), 'think'); await say(Ln('reveal2'), 'neutral'); r.revealed = true;
    }
    const menu = [{ label: L(UI.aProxy), k: 'proxy' }, ...(T.n >= 2 ? [{ label: L(UI.aOnline), k: 'online' }] : []), { label: L(UI.cLater), k: 'later' }];
    const c = menu[await ask(menu)].k;
    if (c === 'proxy') { await this.heroSay(r, A.lines.proxyAsk); await say(this.fmt(r, A.lines.proxyOk), 'happy'); r.status = 'proxy'; return this.endVisit(r); }
    if (c === 'online') { await say(Ln('online'), 'neutral'); this.goOnline(r, 'owner'); r.ownerP = .5; return this.endVisit(r); }
    await say(Ln('bye'), 'neutral'); r.status = 'novote'; return this.endVisit(r);
  },
  // доверенность: на следующем визите хозяин (брат) мог её оформить — тогда голос «за» по доверенности
  async proxyVisit(r, p) {
    const A = r.A;
    if (Math.random() < p) { await say(this.fmt(r, A.lines.proxyYes), 'happy'); r.status = 'yes'; this.signed(r, 'proxy'); }
    else await say(this.fmt(r, A.lines.proxyNotYet), 'think');
    return this.endVisit(r);
  },
  signed(r, via) {
    sfx.stamp(); this.events.push({ t: 'yes', apt: r.apt, via });
    // сосед подписал — остальным на этаже проще решиться; бата ақсақала — ещё теплее
    const bata = r.A.bata || 0;
    for (const o of Object.values(this.res)) if (o !== r && !['yes', 'no', 'novote', 'abstain'].includes(o.status)) { const df = Math.abs(o.floor - r.floor); if (df === 0) o.mood += 8 + bata; else if (df === 1) o.mood += 3 + bata; }
    if (bata) toast(r.name, L(UI.bata), 2600);
    pop(DOOR_X[r.d], this.base(r.floor) - 70, via === 'paper' ? '+1 📄' : via === 'proxy' ? '+1 🔑' : '+1 ✓', '#4caf6e');
    this.stampT = 900;
    this.checkGoal(400);
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
  // совет дома (после собрания 3): трижды за собрание обходит этаж, где больше всего нерешённых
  tickCouncil() {
    const T = this.tour; if (T.n < 3) return;
    this.councilDone = this.councilDone || 0; if (this.councilDone >= 3) return;
    if (this.minute < T.start + T.duration * (.15 + this.councilDone * .17)) return;
    this.councilDone++;
    const open = r => !r.A.renter && !r.A.notOwner && !r.A.noVote && !['yes', 'no', 'online', 'abstain', 'novote'].includes(r.status);
    let best = 1, bn = -1; for (let f = 1; f <= T.floors; f++) { const k = Object.values(this.res).filter(r => r.floor === f && open(r)).length; if (k > bn) { bn = k; best = f; } }
    let n = 0;
    for (const r of Object.values(this.res)) { if (r.floor !== best || !open(r)) continue;
      r.mood += 20; const sc = scenFor(r.arch, T); if (r.mood >= 60 && !(sc && (sc.noYes || sc.abstainOnly))) { r.status = 'yes'; this.events.push({ t: 'yes', apt: r.apt, via: 'council' }); n++; } else if (r.status === 'unknown') r.status = 'thinking'; }
    toast(L(UI.councilName), L(UI.councilDone).replace('{f}', best).replace('{n}', n), 3600);
  },
  helperDone() {
    this.helper.state = 'done'; const f = this.tour.helperFloor; let n = 0;
    for (const r of Object.values(this.res)) {
      if (r.floor !== f || r.A.renter || r.A.notOwner || r.A.noVote || ['yes', 'no', 'online', 'abstain', 'novote'].includes(r.status)) continue;
      if (r.away && this.minute < r.returnAt) continue;
      r.mood += 22; const sc = scenFor(r.arch, this.tour); if (r.mood >= 60 && !(sc && (sc.noYes || sc.abstainOnly))) { r.status = 'yes'; this.events.push({ t: 'yes', apt: r.apt, via: 'helper' }); n++; } else if (r.status !== 'paper') r.status = 'thinking';
    }
    toast(L(UI.helperName), L(UI.helperDone).replace('{f}', f).replace('{n}', n));
    this.checkGoal(4000);
  },
  checkGoal(delay = 0) {
    if (this.goalShown || !this.goalMet()) return; this.goalShown = true;
    setTimeout(() => toast('E-KNOT', L(UI.goalDone), 4200), delay);
  },
  /* ---- енот E-KNOT: 4 действия по очереди (уведомление → обзвон → дожатие → чат дома), между применениями — пауза ---- */
  racReady(k) { const R = this.rac, i = RAC_ACTS.indexOf(k); if (i > R.open) return { ok: false, why: 'locked' };
    if (k === 'redial' && R.bonus > 0) return { ok: true, bonus: true };
    const d = R.readyDay[k] - this.day(); return d > 0 ? { ok: false, why: 'wait', days: d } : { ok: true }; },
  async useRac(k) {
    if (this.busy || !this.app) return;
    const st = this.racReady(k); if (!st.ok) { toast(L(UI.raccoon), st.why === 'locked' ? L(UI.racLocked) : L(UI.racWait).replace('{n}', st.days), 2200); return; }
    const R = this.rac; R.menu = false;
    // при первом появлении действия Енот коротко объясняет, что оно делает
    SAVE.racSeen = SAVE.racSeen || {};
    if (!SAVE.racSeen[k]) { SAVE.racSeen[k] = true; persist(); this.busy = true; dlgOpen('E-KNOT', () => RACCOON_PORT, 900); await say(L(RAC_INTRO[k]), 'happy'); dlgClose(); this.busy = false; }
    if (k === 'redial' && st.bonus) R.bonus--; else R.readyDay[k] = this.day() + RAC_PAUSE[k];
    const fat = Math.pow(.6, R.uses[k]); R.uses[k]++; R.open = Math.max(R.open, Math.min(3, RAC_ACTS.indexOf(k) + 1));
    this.racAnim = { kind: k, t: 0 }; beep(988, .06, 'square', .04); beep(1318, .1, 'square', .04, .08);
    const T = this.tour, all = Object.values(this.res), seed = rng(hashStr(USER.userId + k) + Math.floor(this.minute)), rnd = () => seed();
    const undecided = r => ['unknown', 'thinking', 'away', 'noanswer'].includes(r.status) && !r.refuser && !r.A.noVote;
    const social = Math.min(.3, this.signatures() / APTS * .7);
    let n = 0, pp = 0, body = '';
    if (k === 'notify') {
      // уведомление всем, у кого есть E-KNOT: откликаются нерешившие (у повторов отклик ниже)
      for (const r of all) { if (!undecided(r) || !r.A.onlineOk || r.A.paperOnly || r.A.renter || r.A.notOwner) continue;
        if (rnd() < (.2 + social * .4) * fat) { this.goOnline(r, 'notify'); n++; } }
      body = L(RAC.notifyB).replace('{n}', n);
    } else if (k === 'call') {
      // обзвон: с приложением — онлайн; «бумажные» (апа, ата, ворчун) — отметка 📄, к ним идёт герой
      const said = [];
      for (const r of all) { if (!undecided(r) || r.A.renter || r.A.notOwner) continue;
        if (r.A.paperOnly) { if (T.n >= 2 && rnd() < .9 * Math.max(.5, fat)) { r.status = 'paper'; r.mood += 6; pp++; said.push([r, 'ansPaper']); } continue; }
        if (!r.A.onlineOk) continue;
        const ch = (r.status === 'away' ? .4 : .3) * fat;
        if (rnd() < ch) { this.goOnline(r, 'call'); n++; if (said.length < 4) said.push([r, 'ansApp']); } else if (r.mood < 25 && rnd() < .3) said.push([r, 'ansRefuse']); }
      body = L(RAC.callB).replace('{n}', n).replace('{p}', pp);
      said.slice(0, 4).forEach(([r, a], i) => setTimeout(() => r.floor === this.hero.floor && pop(DOOR_X[r.d], this.base(r.floor) - 74, L(RAC[a]).slice(0, 26), a === 'ansRefuse' ? '#e88a7a' : '#9fd9c2'), 600 + i * 500));
    } else if (k === 'redial') {
      // дожатие: обещавшие голосуют сразу, «подумаю» и «не открыл» при хорошем настрое — чаще «за»
      for (const r of all) {
        if (r.status === 'online') { r.channel = r.channel === 'door' ? 'redial' : r.channel; this.resolveOnline(r); n++; continue; }
        if (!['thinking', 'noanswer'].includes(r.status) || r.A.paperOnly || !r.A.onlineOk || r.refuser || r.A.renter || r.A.notOwner) continue;
        if (r.mood >= 35 && rnd() < .6 * Math.max(.5, fat)) { r.channel = 'redial'; this.resolveOnline(r); n++; } }
      body = L(RAC.redialB).replace('{n}', n);
    } else if (k === 'chat') {
      // WhatsApp/Telegram: ссылка без установки приложения — отсутствующие хозяева; ИИ-помощник подбирает каждому его довод
      const half = this.signatures() >= T.goal / 2;
      for (const r of all) {
        if ((r.A.renter || r.A.notOwner) && ['unknown', 'novote', 'proxy'].includes(r.status) && rnd() < .5 * fat) { this.goOnline(r, 'chat'); r.ownerP = 1; n++; continue; }
        if (!undecided(r) || r.A.renter || r.A.notOwner) continue;
        if (r.status === 'away' && !r.A.paperOnly && rnd() < .35 * fat) { this.goOnline(r, 'chat'); n++; continue; }
        r.mood += half ? 4 : 1;
        const best = Math.max(...Object.values(r.A.likes || { x: 0 })); r.mood += Math.round(best * .6 * Math.max(.5, fat));
        if (r.mood >= 70 && !r.A.paperOnly) { this.goOnline(r, 'chat'); r.onlineAt = this.minute + 1; n++; }
      }
      const ai = AI_CHAT[T.scen]; this.racAnim.chat = ai ? { q: fmtLine(L(ai.q)), a: fmtLine(L(ai.a)) } : null;
      body = fmtLine(L(RAC.chatMsg).replace('{t}', tourTitle(T)).replace('{n}', this.signatures()).replace('{g}', T.goal));
    }
    this.events.push({ t: 'broadcast', via: k }); this.broadcasts++;
    setTimeout(() => toast(L(RAC[k + 'T']), body, 3600), 900);
    this.checkGoal(1200);
  },
  /* ---- подростки на лестнице: курят, при виде героя убегают; через несколько дней — на другом этаже ---- */
  updateTeens(dt) {
    const G = this.teens; if (!G) return; G.t += dt;
    if (G.st === 'here' && this.hero.floor === G.floor && !this.hero.climb && Math.abs(this.hero.x - G.x) < 60) {
      G.st = 'flee'; G.fleeT = 0; const line = TEENS.flee[Math.floor(Math.random() * TEENS.flee.length)];
      pop(G.x, this.base(G.floor) - 56, L(line), '#c9c3b0'); sfx.select();
      if (!this.teensSeen) { this.teensSeen = true; setTimeout(() => scene === this && !this.over && toast(SAVE.name, L(TEENS.hero), 3200), 1400); }
    }
    if (G.st === 'flee') { G.fleeT += dt; if (G.fleeT > 1400) { G.st = 'gone'; G.backAt = this.day() + 6; for (const r of Object.values(this.res)) if (r.floor === G.floor) r.mood += 3; } }
    if (G.st === 'gone' && this.day() >= G.backAt) { let f; do f = 3 + Math.floor(Math.random() * 10); while (f === this.hero.floor || f === G.floor);
      G.floor = f; G.st = 'here'; for (const r of Object.values(this.res)) if (r.floor === f) r.mood -= 3; }
  },
  /* ---- конец тура ---- */
  async finish(timeUp) {
    if (this.over) return; this.over = true; setTouch({});
    if (timeUp) toast('E-KNOT', L(UI.timeUp), 2000);
    // онлайн-подписи приходят к концу тура
    for (const r of Object.values(this.res)) if (r.status === 'online') this.resolveOnline(r);
    let result;
    try { result = await API.tourFinish(this.run, this.events); }
    catch (e) {
      // сервер не ответил — показываем итог, посчитанный в игре, но без рейтинга и бонусов
      const n = this.signatures(), against = this.against(), ab = this.abstained(), out = voteOutcome(this.tour, n, against, ab);
      result = { signatures: n, own: n, against, abstain: ab, turnout: out.turnout, need: out.need, success: out.ok, coins: 0, score: null, offline: true };
    }
    const T = this.tour.id, prev = SAVE.tours[T] || { tries: 0, best: 0, done: false };
    SAVE.tours[T] = { tries: prev.tries + 1, best: Math.max(prev.best, result.signatures), done: prev.done || result.success };
    if (result.totalCoins != null) SAVE.coins = result.totalCoins; persist();
    if (result.first && !HOUSE_STATE.won.includes(this.tour.id)) HOUSE_STATE.won.push(this.tour.id);
    // результат — в приложение E-KNOT (WebView) и на его сервер (docs/API.md)
    try { const payload = buildResult(this, result); notifyApp('result', payload); sendResultToServer(payload); } catch (e) { console.warn(e); }
    // источники голосов для протокола: у дверей, бумага, доверенность, каналы E-KNOT
    const src = {}; for (const e of this.events) if (e.t === 'yes') src[e.via || 'door'] = (src[e.via || 'door'] || 0) + 1;
    const stats = { ...result, tourId: this.tour.id, goal: this.tour.goal, problem: this.problem, against: this.against(), abstain: this.abstained(), src, appShare: this.appShare(), day: this.day(),
      thinking: Object.values(this.res).filter(r => r.status === 'thinking').length, notVoted: Object.values(this.res).filter(r => !['yes', 'no', 'abstain'].includes(r.status)).length };
    setTimeout(() => irisTo(this.hero.x - this.camX, this.hero.y - this.camY - 14, () => go('result', stats)), timeUp ? 1200 : 200);
  },

  draw(dt) {
    const T = this.tour, h = this.hero, cy = Math.round(this.camY), cx = Math.round(this.camX);
    ctx.save(); ctx.translate(-cx, 0);
    ctx.drawImage(this.bg, 0, -cy);
    const t = performance.now();
    for (let f = 1; f <= T.floors; f++) {
      const b = this.base(f) - cy; if (b < -10 || b > H + 110) continue;
      // лампы: до ремонта света часть не горит, часть мигает; после — горят ровно
      for (const [li, lx] of [[0, 49], [1, 141], [2, 351], [3, 443]]) {
        const broken = !this.fixed.has('light') && (f * 7 + li * 3) % 5 === 0;
        const lampOn = this.fixed.has('light') || (!broken && Math.sin(t / 97 + f * 13 + li * 5 + this.lampSeed) > -.75);
        rect(lx, b - 94, 1, 6, '#0e1011'); rect(lx - 5, b - 88, 11, 4, '#1c1f24'); rect(lx - 3, b - 85, 7, 3, lampOn ? '#fff1b8' : '#4b4f4c');
        if (lampOn) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          if (!this.glow) this.glow = makeCanvas(220, 94, ({ g }) => { const gr = g.createRadialGradient(110, 10, 2, 110, 44, 110); gr.addColorStop(0, 'rgba(255,214,140,.30)'); gr.addColorStop(.5, 'rgba(255,190,110,.10)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, 220, 94); });
          ctx.globalAlpha = this.fixed.has('light') ? 1 : .8; ctx.drawImage(this.glow, lx - 110, b - 94);
          for (let i = 0; i < 4; i++) { const dx = Math.sin(t / 2200 + i * 2.1 + f + li) * 40, dy = ((t / 60 + i * 37 + f * 11) % 70); rect(lx + dx, b - 80 + dy, 1, 1, 'rgba(255,236,190,.5)'); }
          ctx.restore();
        }
      }
      // крыша течёт: капли на верхнем этаже
      if (f === T.floors && !this.fixed.has('roof')) for (let i = 0; i < 5; i++) { const x = 30 + i * 83, k = ((t / 900 + i * .37) % 1); rect(x, b - 92 + k * 88, 1, 2, '#7fb0d6'); if (k > .95) rect(x - 2, b - 2, 5, 1, '#7fb0d6'); }
      for (let d = 0; d < DOOR_X.length; d++) {
        const apt = (f - 1) * DOOR_X.length + d + 1, x = DOOR_X[d], r = this.res[apt];
        if (apt === T.heroApt) { sprite(ICONS.me, x + 9, b - 61); continue; }
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
        const ic = ICONS[r.status]; if (ic) { rect(x + 8, b - 62, 11, 11, 'rgba(10,12,16,.55)'); sprite(ic, x + 9, b - 61); }
      }
    }
    // кот на окне 4-го этажа, крысы на 1-м
    if (T.floors >= 4) sprite(CAT, STAIR_TOP - 2, this.base(4) - 50 - 8 - cy);
    this.drawRats(cy, t);
    // болтун
    const tk = this.talker;
    if (this.plan && !this.busy) { const P = this.plan, mx = P.x, my = this.base(P.floor) - cy; if (Math.floor(t / 300) % 2) { rect(mx - 3, my - 2, 7, 1, '#f2c94c'); rect(mx - 1, my - 3, 3, 1, '#f2c94c'); } }
    if (!tk.done || (tk.leaving && tk.leaving < 1400)) {
      if (tk.leaving) tk.leaving += dt;
      const x = tk.x + (tk.leaving ? tk.leaving * .05 : 0);
      if (!tk.leaving || tk.leaving < 1400) sprite(personSprite(tk.look, tk.leaving ? 'walk' + (Math.floor(tk.leaving / 95) % 8) : ['idle0', 'idle1'][Math.floor(t / 600) % 2]), x - 9, this.base(tk.floor) - PH - cy, !tk.leaving && h.x < x);
    }
    // Данияр рассказывает про E-KNOT и уходит
    if (this.racNpc) { const n = this.racNpc; if (n.leaving) n.leaving += dt;
      if (n.leaving > 1600) this.racNpc = null;
      else { ctx.globalAlpha = n.leaving ? clamp(1 - (n.leaving - 1000) / 600, 0, 1) : 1;
        sprite(personSprite(n.look, n.leaving ? 'walk' + (Math.floor(n.leaving / 95) % 8) : 'idle' + (Math.floor(t / 600) % 2)), n.x + (n.leaving ? n.leaving * .05 : 0) - 9, this.base(n.floor) - PH - cy, !n.leaving && h.x < n.x);
        ctx.globalAlpha = 1; } }
    // подростки курят на площадке; при виде героя — бегом к лестнице
    if (this.teens && this.teens.st !== 'gone') { const G = this.teens, gb = this.base(G.floor) - cy;
      if (gb > -60 && gb < H + 60) for (let i = 0; i < 3; i++) {
        const fx = G.st === 'flee' ? G.x + (STAIR_FOOT - G.x) * Math.min(1, G.fleeT / 1200) + i * 6 : G.x + i * 13 - 13;
        ctx.globalAlpha = G.st === 'flee' ? clamp(1 - (G.fleeT - 900) / 500, 0, 1) : 1;
        sprite(personSprite(TEEN_LOOKS[i], G.st === 'flee' ? 'walk' + (Math.floor((G.fleeT + i * 90) / 80) % 8) : 'idle' + (Math.floor(t / 700 + i) % 2)), Math.round(fx) - 9, gb - PH + 2, G.st === 'flee' ? STAIR_FOOT < G.x : i === 2);
        if (G.st === 'here' && i !== 1) { const k = ((t / 1600 + i * .4) % 1); ctx.globalAlpha = .5 * (1 - k); rect(Math.round(fx + 4 + Math.sin(k * 6) * 2), Math.round(gb - PH + 12 - k * 16), 2, 2, '#c9cdc8'); }
        ctx.globalAlpha = 1; } }
    // «нехорошая квартира»: громкая музыка или посетители, пока нет домофона с доступом из E-KNOT
    if (this.shady && !this.fixed.has('door')) { const r = this.shady, sb = this.base(r.floor) - cy, x = DOOR_X[r.d];
      if (sb > -60 && sb < H + 60) { if (r.apt % 2) { for (let i = 0; i < 2; i++) { const k = ((t / 900 + i * .5) % 1); ctx.globalAlpha = 1 - k; text('♪', x - 6 + i * 10 + Math.sin(k * 7) * 3, sb - 66 - k * 14, { col: '#b88ad0', size: 6 }); } ctx.globalAlpha = 1; }
        else { const k = (t % 9000) / 9000; if (k < .25) { const vx = x + 60 - k * 4 * 60; sprite(personSprite(SHADY_GUEST, 'walk' + (Math.floor(t / 95) % 8)), Math.round(vx) - 9, sb - PH, true); } } } }
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
    else if (h.moving) fr = 'walk' + (Math.floor(h.walkT / 95) % 8);
    if (!h.ride) sprite(personSprite(Object.assign({ blink: Math.floor(t / 2600) % 3 === 0 }, SAVE.look), fr), h.x - 9, h.y - PH - cy, h.dir < 0);
    else { const yb = Math.round(h.y - cy); rect(LIFT_X - 12, yb - 46, 24, 46, 'rgba(255,236,170,.22)'); }
    // подсказка над дверью
    if (!this.busy && !DLG.open && !h.climb) {
      const door = this.nearDoor(), npc = this.nearNPC();
      if (door || npc) { const px = npc ? this.helper.x : DOOR_X[(door - 1) % DOOR_X.length]; const s = isTouch ? '▼' : 'E';
        if (Math.floor(t / 400) % 2) text(s, px, h.y - cy - 86, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' }); }
      if (Math.abs(h.x - STAIR_FOOT) < 10) text((h.floor < T.floors ? '▲' : '') + (h.floor > 1 ? '▼' : ''), STAIR_FOOT - 14, h.y - cy - 56, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' });
    }
    ctx.restore();
    drawPops(dt, cx, cy);
    // енот: у каждого действия своя анимация
    if (this.racAnim) this.drawRacAnim(t);
    if (this.stampT > 0) { this.stampT -= dt; const s = 1 + Math.max(0, (this.stampT - 600) / 300) * 1.5; ctx.save(); ctx.globalAlpha = Math.min(1, this.stampT / 300);
      ctx.translate(W / 2, 92); ctx.rotate(-.18); ctx.scale(s, s); rect(-34, -12, 68, 24, 'rgba(76,175,110,.25)'); ctx.strokeStyle = '#4caf6e'; ctx.lineWidth = 2; ctx.strokeRect(-34, -12, 68, 24);
      text(['ҚОЛ ҚОЙДЫ', 'ПОДПИСАНО', 'SIGNED'][LI()], 0, -4, { col: '#4caf6e', align: 'center' }); ctx.restore(); }
    this.drawHUD();
    if (this.rac.menu && !this.busy && !DLG.open) this.drawRacMenu();
    dlgDraw();
    if (this.ballot) this.drawBallot();
    if (this.paused) {
      rect(0, 0, W, H, 'rgba(11,10,20,.65)'); frameBox(120, 50, 160, 120);
      text(L(UI.pause), W / 2, 62, { align: 'center', col: '#f4f3ee' });
      wrapText(L(UI.pauseNote), 140, 6).slice(0, 3).forEach((l, i) => text(l, W / 2, 76 + i * 8, { align: 'center', col: '#8f86a8', size: 6 }));
      if (button(L(UI.resume), W / 2, 104, 'primary', { w: 130 })) this.paused = false;
      if (button(L(UI.quitLevel), W / 2, 130, 'alt', { w: 130 })) { this.over = true; this.paused = false; DLG.open = false; setTouch({});
        irisTo(W / 2, 110, () => go(HOUSE_STATE.won.length ? 'house' : 'title')); }
      clicks.length = 0; return;
    }
    if (this.liftPick) {
      rect(0, 0, W, H, 'rgba(11,12,16,.5)'); frameBox(120, 30, 160, 170); text(L(UI.lift), W / 2, 40, { align: 'center', col: '#f4f3ee' });
      const nf = T.floors, rows = Math.ceil(nf / 4);
      for (let k = 1; k <= nf; k++) { const c = (k - 1) % 4, rr = rows - 1 - Math.floor((k - 1) / 4), bx = 146 + c * 36, by = 56 + rr * 28;
        if (button(String(k), bx, by, k === this.hero.floor ? 'off' : 'primary', { w: 28 })) { this.liftPick = false; this.useLift(k); } }
      if (button(L(UI.close), W / 2, 56 + rows * 28 + 4, 'alt')) this.liftPick = false;
    }
    // нажатие по подъезду: герой сам идёт к двери / на нужный этаж
    if (!this.busy && !DLG.open && !this.ballot && !this.liftPick && !this.over && !this.hero.ride && !this.rac.menu) { const c = clicks.find(c => c.y > 24); if (c) { clicks.splice(clicks.indexOf(c), 1); this.onTap(c.x + cx, c.y + cy); } }
  },
  drawRacAnim(t) {
    const A = this.racAnim, k = A.t / 2200, cy = Math.round(this.camY), cx = Math.round(this.camX);
    const rx = lerp(W + 20, W - 60, Math.min(1, A.t / 400)), ry = 30;
    if (A.kind === 'notify') {          // экраны телефонов загораются в окнах-дверях
      for (const r of Object.values(this.res)) { if (r.status !== 'online' || r.channel !== 'notify') continue; const y = this.base(r.floor) - cy - 52, x = DOOR_X[r.d] - cx;
        if (y < 20 || y > H) continue; const on = (A.t / 140 + r.apt) % 3 < 2; rect(x - 3, y, 6, 9, '#0e111c'); rect(x - 2, y + 1, 4, 6, on ? '#9fe8d0' : '#2f8577'); }
    } else if (A.kind === 'call') {     // волна звонков по этажам
      for (let f = 1; f <= this.tour.floors; f++) { const y = this.base(f) - cy - 40; if (y < 20 || y > H) continue; const kk = clamp(k * 2 - (this.tour.floors - f) * .05, 0, 1);
        if (kk > 0 && kk < 1) { ctx.globalAlpha = 1 - kk; ctx.strokeStyle = '#9fd9c2'; ctx.lineWidth = 1; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(this.hero.x - cx, y, 8 + kk * 220 + i * 10, -0.6, 0.6); ctx.stroke(); ctx.beginPath(); ctx.arc(this.hero.x - cx, y, 8 + kk * 220 + i * 10, Math.PI - .6, Math.PI + .6); ctx.stroke(); } ctx.globalAlpha = 1; } }
    } else if (A.kind === 'redial') {   // пульсирующие метки над дверями, куда дозвонились
      for (const r of Object.values(this.res)) { if (r.channel !== 'redial') continue; const y = this.base(r.floor) - cy - 80, x = DOOR_X[r.d] - cx; if (y < 20 || y > H) continue;
        const s = 3 + Math.sin(A.t / 120) * 2; rect(x - s, y - s, s * 2, s * 2, 'rgba(242,201,76,.35)'); text('☎', x, y - 3, { col: '#f2c94c', align: 'center', size: 6 }); }
    } else if (A.kind === 'chat' && A.chat) {   // чат дома: вопрос жителя и ответ ИИ-помощника E-KNOT
      const a = Math.min(1, A.t / 300) * Math.min(1, (4200 - A.t) / 300); ctx.globalAlpha = a;
      const q = wrapText(A.chat.q, 190, 6), an = wrapText(A.chat.a, 196, 6), qh = q.length * 8 + 6, ah = an.length * 8 + 6;
      const y0 = 80, fh = 10 + qh + 12 + ah + 8; frameBox(70, y0, 260, fh, .96);
      const qw = Math.min(204, q.reduce((m, l) => Math.max(m, textW(l, 6)), 0) + 12);
      rect(80, y0 + 8, qw, qh, '#3a4a5a'); q.forEach((l, i) => text(l, 86, y0 + 11 + i * 8, { col: '#f4f3ee', size: 6 }));
      if (A.t > 1100) { const ya = y0 + 8 + qh + 12; text(L(UI.aiName), 320, ya - 9, { col: '#9fd9c2', size: 6, align: 'right' });
        rect(114, ya, 208, ah, '#2f8577'); an.forEach((l, i) => text(l, 120, ya + 3 + i * 8, { col: '#f4f3ee', size: 6 })); }
      ctx.globalAlpha = 1;
    }
    sprite(RACCOON, rx, ry);
  },
  // меню енота: 4 действия, открываются по очереди; у каждого — пауза в днях
  drawRacMenu() {
    frameBox(214, 22, 182, 92, .97);
    text(L(UI.raccoon), 222, 28, { col: '#9fd9c2', size: 6 });
    RAC_ACTS.forEach((k, i) => { const st = this.racReady(k), y = 38 + i * 18;
      const lbl = L(UI['rac_' + k]) + (st.ok ? (st.bonus ? ' +1' : '') : st.why === 'locked' ? ' 🔒' : ` · ${st.days} ${L(UI.daysShort)}`);
      if (button(lbl, 305, y, st.ok ? 'alt' : 'off', { w: 176 })) this.useRac(k); });
    if (clicks.length) clicks.length = 0;
  },
  drawHUD() {
    const T = this.tour;
    rect(0, 0, W, 19, '#0e111c'); rect(0, 19, W, 1, '#55607c'); rect(0, 20, W, 1, 'rgba(5,6,10,.6)');
    if (button('II', 0, 1, 'dark', { left: 1, w: 16 }) && !this.busy && !DLG.open) this.paused = true;
    // дни — с тура 2 (в туре 1 таймера нет)
    if (!T.noTimer) { const left = this.end - this.minute, late = left < T.duration * .12;
      text(`${L(UI.day)} ${this.day()}/${T.days}`, 22, 3, { col: late ? '#e98f6f' : '#f4f3ee', size: 6 });
      rect(22, 12, 56, 3, '#2b2a33'); rect(22, 12, Math.round(56 * clamp(left / T.duration, 0, 1)), 3, late ? '#e98f6f' : '#7fc4a8'); }
    // «За X / нужно Y», кворум (в туре 1 без таймера — счётчик слева, подпись после него)
    const n = this.votes(), o = this.outcome(), x0 = T.noTimer ? 22 : 84;
    if (T.noTimer) text(L(UI.noTimerHud), x0 + textW(`${L(UI.yesShort)} ${n}/${o.need}`, 6) + 10, 7, { col: '#8792ad', size: 6 });
    text(`${L(UI.yesShort)} ${n}/${o.need}`, x0, T.rule === 'quorum' ? 3 : 7, { col: n >= o.need ? '#4caf6e' : '#f2c94c', size: 6 });
    if (T.rule === 'quorum') { const k = clamp(o.turnout / T.quorum, 0, 1); rect(x0, 12, 40, 3, '#2b2a33'); rect(x0, 12, Math.round(40 * k), 3, o.turnout >= T.quorum ? '#4caf6e' : '#9fb0cc');
      text(`${o.turnout}/${T.quorum}`, x0 + 43, 10, { col: '#9fb0cc', size: 6 }); }
    // доля E-KNOT и онлайн-голоса
    if (this.app) { const ox = 172, fl = this.onFlash > 0 && Math.floor(this.onFlash / 120) % 2;
      rect(ox, 4, 6, 11, fl ? '#f4f3ee' : '#7fc4a8'); rect(ox + 1, 5, 4, 7, '#0e111c'); rect(ox + 2, 13, 2, 1, '#0e111c');
      text(`E-KNOT ${this.appShare()}%`, ox + 9, 3, { col: '#9fd9c2', size: 6 }); text('+' + this.onYes + ' −' + this.onNo, ox + 9, 11, { col: '#8792ad', size: 6 }); }
    if (button(L(UI.ballot), 0, 1, 'dark', { left: 252 }) && !this.busy && !DLG.open) this.ballot = !this.ballot;
    if (this.app && button(L(UI.raccoon), 0, 1, this.rac.menu ? 'primary' : 'alt', { left: 338 }) && !this.busy && !DLG.open) { this.rac.menu = !this.rac.menu; if (this.rac.menu) toasts.length = 0; }
    const pend = Object.values(this.res).filter(r => r.status === 'online').length, papers = Object.values(this.res).filter(r => r.status === 'paper').length;
    let hy = 22; text(`${this.hero.floor}${L(UI.floor)}`, 8, hy, { col: '#f4f3ee', shadow: '#0b0c10', size: 6 });
    if (pend) text(L(UI.hudOnline).replace('{n}', pend), 84, hy, { col: '#7fc4a8', size: 6, shadow: '#0b0c10' });
    if (papers) text(`📄 ${papers}`, 220, hy, { col: '#d8d2bf', size: 6, shadow: '#0b0c10' });
    if ((this.goalMet() || this.goalLikely()) && !this.busy && !DLG.open) { if (button(L(UI.finish), W / 2, 30, 'primary')) this.finish(false); }
  },
  drawBallot() {
    const T = this.tour;
    rect(0, 0, W, H, 'rgba(11,12,16,.55)');
    paper(40, 22, 320, 192, 8);
    text(L(UI.ballotTitle), W / 2, 30, { align: 'center', col: INK_RED });
    const rowH = 10, ch = rowH - 1;
    for (let f = T.floors; f >= 1; f--) {
      const y = 42 + (T.floors - f) * rowH;
      text(`${f}`, 54, y + Math.round(ch / 2) - 3, { col: INK_MUTED, size: 6 });
      const nd = DOOR_X.length, cw = Math.floor(272 / nd) - 3;
      for (let d = 0; d < nd; d++) {
        const apt = (f - 1) * nd + d + 1, x = 66 + d * (cw + 3), r = this.res[apt];
        rect(x, y, cw, ch, '#e2d9c2'); rect(x, y + ch - 1, cw, 1, '#cfc3a5');
        const ty = y + Math.round(ch / 2) - 3;
        text(aptNo(apt), x + 2, ty, { col: isStorage(apt) ? INK_MUTED : INK, size: 6 });
        if (isStorage(apt)) { rect(x, y, cw, ch, 'rgba(120,110,90,.18)'); sprite(ICONS.novote, x + cw - 9, y); continue; }
        const st = apt === T.heroApt ? 'me' : r.status === 'renter' ? 'novote' : r.status;
        if (ICONS[st]) sprite(ICONS[st], x + cw - 9, y);
      }
    }
    const cnt = s => Object.values(this.res).filter(r => r.status === s).length;
    const leg = [['yes', cnt('yes')], ['no', cnt('no')], ['abstain', cnt('abstain')], ['thinking', cnt('thinking')], ['online', cnt('online')], ['paper', cnt('paper')], ['proxy', cnt('proxy')], ['novote', cnt('novote') + HOUSE.storage.length]];
    leg.forEach(([k, v], i) => { const x = 58 + i * 37; sprite(ICONS[k], x, 176); text(String(v), x + 11, 177, { col: INK, size: 6 }); });
    if (button(L(UI.close), W / 2, 190, 'alt')) this.ballot = false;
  },
};
const REFUSE = { grump: .4, business: .15, night: .1, mom: .04, apa: .04, ata: .03, teacher: .05, dad: .06, it: .08, novosel: .02 };
const RAC_ACTS = ['notify', 'call', 'redial', 'chat'], RAC_PAUSE = { notify: 5, call: 7, redial: 5, chat: 7 };
// каналы, через которые голос собрало приложение E-KNOT (в протоколе — доля E-KNOT)
const APP_VIA = ['online', 'notify', 'call', 'redial', 'chat', 'owner'];
// внешность жильца: пол, возраст, причёска, седина, очки, борода, головной убор, одежда и цвета
const SKINS = ['#f1c7a3', '#e8b892', '#e3ad86', '#d9a77c', '#c98e66', '#b07a56'];
const HAIR_Y = ['#2b2420', '#1b1a21', '#4a2e22', '#6a4028', '#a5503c', '#3a2a20', '#2b2420'], HAIR_O = ['#c9c6c0', '#9c9a96', '#8f8a84', '#6e6a66', '#b8b4ac'];
const TOPS_C = ['#3f6f8c', '#b8443f', '#c79a3b', '#5d6b5a', '#7d4f8a', '#2f8577', '#9aa0a5', '#4a5a7a', '#8a5a3a', '#3a4a3a', '#6a3a4a', '#a86a7a', '#2b2a33'];
const PANTS_C = ['#3d5277', '#2b2a33', '#4a4a52', '#3a4a3a', '#5a4a3a', '#46506a'], SKIRT_C = ['#4a3a52', '#3a3a4a', '#5a4a6e', '#6a3a3a', '#3a4a5a', '#5a5a4a'];
function varyLook(a, R) {
  const A = ARCH[a], ch = p => R() < p, any = arr => pick(R, arr);
  const L = { skin: any(SKINS), topCol: any(TOPS_C), pants: any(PANTS_C) };
  const youngF = () => Object.assign(L, { body: 'f', hair: any(['long', 'bun', 'curly', 'long']), hairCol: any(HAIR_Y), bottom: ch(.45) ? 'skirt' : 'pants', skirtCol: any(SKIRT_C) });
  const youngM = () => Object.assign(L, { body: 'm', hair: any(['short', 'short', 'curly']), hairCol: any(HAIR_Y) });
  switch (a) {
    case 'apa': Object.assign(L, { body: 'f', old: true, bottom: 'skirt', skirtCol: any(SKIRT_C), top: ch(.25) ? 'chapan' : 'shirt', glasses: ch(.3) });
      if (ch(.7)) Object.assign(L, { hair: 'scarf', hat: 'scarf', hairCol: any(HAIR_O), scarfCol: any(['#c8414a', '#3f6f8c', '#4f7a4a', '#7d4f8a', '#c79a3b', '#2f6f62']) });
      else Object.assign(L, { hair: 'bun', hairCol: any(HAIR_O) }); break;
    case 'ata': Object.assign(L, { body: 'm', old: true, hair: ch(.6) ? 'bald' : 'short', hairCol: any(HAIR_O), beard: ch(.6), glasses: ch(.3), top: any(['chapan', 'chapan', 'jacket', 'shirt']), topCol: any(['#4a3a5a', '#3a4a5a', '#5a4a3a', '#2b2a33', '#4a5a4a']) });
      const h = R(); L.hat = h < .5 ? 'tyube' : h < .65 ? 'cap' : null; if (L.hat === 'cap') L.capCol = any(['#4a4a52', '#5a4a3a']); break;
    case 'grump': Object.assign(L, { body: 'm', old: true, hair: ch(.5) ? 'bald' : 'short', hairCol: any(HAIR_O), glasses: ch(.5), beard: ch(.4), top: ch(.35) ? 'leather' : 'shirt', topCol: any(['#5d6b5a', '#4a4a52', '#5a4a3a', '#3a4a5a', '#6a5a4a']) });
      if (ch(.2)) Object.assign(L, { hat: 'cap', capCol: any(['#3a3a42', '#4a3a2a']) }); break;
    case 'teacher': Object.assign(L, { body: 'f', old: true, hair: any(['bun', 'bun', 'short', 'curly']), hairCol: ch(.6) ? any(HAIR_O) : any(['#6a2a2a', '#4a2e22', '#8a4a3a']), glasses: ch(.75), top: ch(.6) ? 'jacket' : 'shirt', bottom: ch(.7) ? 'skirt' : 'pants', skirtCol: any(SKIRT_C) }); break;
    case 'mom': youngF(); L.top = any(['shirt', 'hoodie', 'shirt', 'jacket']); break;
    case 'dad': youngM(); Object.assign(L, { beard: ch(.4), top: any(['hoodie', 'shirt', 'leather']) }); if (ch(.25)) Object.assign(L, { hat: 'cap', capCol: any(['#b8443f', '#3f6f8c', '#2b2a33']) }); break;
    case 'novosel': youngF(); L.top = any(['shirt', 'jacket', 'hoodie']); break;
    case 'renter': youngF(); L.top = any(['hoodie', 'shirt']); L.headphones = ch(.25); break;
    case 'shady': youngM(); Object.assign(L, { top: 'leather', topCol: any(['#2b2a33', '#3a2a2a']), beard: ch(.5) }); break;
    case 'notowner': ch(.5) ? youngF() : youngM(); Object.assign(L, { top: ch(.65) ? 'hoodie' : 'shirt', headphones: ch(.4), glasses: ch(.2) });
      if (L.body === 'm' && ch(.25)) Object.assign(L, { hat: 'cap', capCol: any(['#b8443f', '#3f6f8c', '#c79a3b', '#2b2a33']) }); break;
    case 'business': if (ch(.7)) youngM(); else { youngF(); L.hair = any(['bun', 'long']); L.bottom = 'skirt'; }
      Object.assign(L, { top: ch(.8) ? 'jacket' : 'leather', topCol: any(['#2b2a33', '#3a4a5a', '#4a4a52', '#5a3a3a']), glasses: ch(.25), beard: L.body === 'm' && ch(.15) }); break;
    case 'it': if (ch(.7)) youngM(); else youngF(); Object.assign(L, { top: 'hoodie', topCol: any(['#2b2a33', '#3a4a5a', '#4a3a5a', '#2f8577', '#5d6b5a']), glasses: ch(.55), headphones: ch(.4) }); break;
    case 'night': if (ch(.85)) youngM(); else youngF(); Object.assign(L, { beard: L.body === 'm' && ch(.5), top: any(['shirt', 'leather', 'hoodie']), topCol: any(['#9aa0a5', '#4a4a52', '#3a4a3a', '#5a4a3a', '#2b2a33']) });
      if (L.body === 'm' && ch(.15)) L.hair = 'bald'; if (ch(.35)) Object.assign(L, { hat: 'cap', capCol: any(['#2b2a33', '#4a4a52', '#3f6f8c']) }); break;
    default: ch(.5) ? youngF() : youngM(); L.top = any(['hoodie', 'shirt', 'leather']); L.headphones = ch(.2);
  }
  if (!L.top) L.top = 'shirt';
  return L;
}
const ONLINE_HUD_X = 208;
const TEEN_LOOKS = [{ body: 'm', skin: '#e3ad86', hair: 'short', hairCol: '#2b2420', top: 'hoodie', topCol: '#2b2a33', hat: 'cap', capCol: '#b8443f' }, { body: 'm', skin: '#d9a77c', hair: 'curly', hairCol: '#3a2a20', top: 'hoodie', topCol: '#4a5a7a' }, { body: 'f', skin: '#f1c7a3', hair: 'long', hairCol: '#4a2e22', top: 'hoodie', topCol: '#6a3a4a', bottom: 'pants' }];
const SHADY_GUEST = { body: 'm', skin: '#c98e66', hair: 'short', hairCol: '#1b1a21', top: 'leather', topCol: '#2b2a33', hat: 'cap', capCol: '#2b2a33' };
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function tweenDoor(r, to) { return new Promise(res => { const from = r.door, t0 = performance.now(); (function step() { const k = Math.min(1, (performance.now() - t0) / 260); r.door = lerp(from, to, k); if (k < 1) requestAnimationFrame(step); else res(); })(); }); }

/* ============================================================
   СЦЕНА: итог тура (протокол)
   ============================================================ */
scenes.result = {
  enter(d) { this.d = d; this.t = 0; setTouch({ act: L(UI.next) }); if (d.success) setTimeout(() => sfx.stamp(), 500);
    this.rank = null; if (!d.offline) API.leaderboard('complex').then(r => this.rank = r.mine).catch(() => {}); },
  update(dt) { this.t += dt; if (hit('act')) irisTo(W / 2, 200, () => go('house')); },
  draw(dt) {
    const d = this.d, TT = TOURS[d.tourId] || TOURS.L1, ekn = TT.n >= 2;
    drawNight(dt);
    paper(40, 6, 320, 214, 11);
    // тур 1 — бумажный «Протокол № 1» инициативной группы; туры 2–7 — протокол, сформированный в E-KNOT
    text(ekn ? L(UI.protEkn).replace('{n}', '0' + TT.n) : L(UI.prot1), W / 2, 12, { align: 'center', col: INK_MUTED, size: 6 });
    if (ekn) text(L(UI.protEknSub), W / 2, 20, { align: 'center', col: INK_TEAL, size: 6 });
    const addr = L(UI.protEntrance) + ' · ' + L(UI.day) + ' ' + (d.day || 1);
    if (!ekn) text(addr, W / 2, 20, { align: 'center', col: INK_MUTED, size: 6 });
    // повестка — одной строкой (длинная сокращается), итог крупно
    let ag = L(UI.protAgenda) + ' ' + tourTitle(TT); while (textW(ag, 6) > 292 && ag.length > 10) ag = ag.slice(0, -2).trimEnd() + '…';
    text(ag, W / 2, 30, { align: 'center', col: INK, size: 6 });
    const quorumFail = TT.rule === 'quorum' && (d.turnout || 0) < TT.quorum;
    text(d.success ? L(TT.winT) : quorumFail ? L(UI.noQuorum) : L(UI.lose), W / 2, 41, { align: 'center', col: d.success ? INK_TEAL : INK_RED });
    // четыре цифры: явка, «за», «против», «воздержались»
    const need = d.need || TT.goal, src = d.src || {}, tw = 70;
    const tiles = [[L(UI.protQuorum), `${d.turnout || 0}`, TT.quorum ? '≥' + TT.quorum : '/100', TT.quorum ? (quorumFail ? INK_RED : INK_TEAL) : INK],
      [L(UI.yesShort), String(d.signatures), '≥' + need, d.signatures >= need ? INK_TEAL : INK_RED],
      [L(UI.rAgainst), String(d.against || 0), '', INK], [L(UI.protAbstain), String(d.abstain || 0), '', INK]];
    tiles.forEach(([lbl, big, sub, c], i) => { const x = 54 + i * (tw + 4);
      rect(x, 58, tw, 32, 'rgba(120,100,60,.08)'); rect(x, 58, tw, 1, '#e2d9c2'); rect(x, 89, tw, 1, '#e2d9c2');
      text(big, x + 5, 61, { col: c }); if (sub) text(sub, x + 7 + textW(big), 63, { col: INK_MUTED, size: 6 });
      wrapText(lbl, tw - 8, 6).slice(0, 2).forEach((l, k) => text(l, x + 5, 73 + k * 7, { col: INK_MUTED, size: 6 })); });
    let y = 96;
    const sum = (...k) => k.reduce((a, x) => a + (src[x] || 0), 0);
    if (ekn) {   // доля E-KNOT — полосой
      const sh = clamp(d.appShare || 0, 0, 100), bw0 = 292, wE = Math.round(bw0 * sh / 100);
      text('E-KNOT ' + sh + ' %', 54, y, { col: INK_TEAL, size: 6 }); text(L(UI.srcDoor) + ' ' + (100 - sh) + ' %', 346, y, { col: '#8a6a3a', size: 6, align: 'right' });
      rect(54, y + 9, bw0, 5, '#d9c9a3'); rect(54, y + 9, wE, 5, '#2e8a76'); y += 20;
    }
    // источники «за» — одна-две короткие строки
    const chans = [[UI.srcDoor, sum('door', 'helper', 'council')], [UI.srcPaper, sum('paper')], [UI.srcProxy, sum('proxy')], [UI.srcOnline, sum('online', 'owner')],
      [UI.rac_notify, sum('notify')], [UI.rac_call, sum('call')], [UI.rac_redial, sum('redial')], [UI.rac_chat, sum('chat')]].filter(c => c[1]).map(([l, v]) => L(l) + ' ' + v);
    // раскладываем по строкам целыми кусками, без «·» на конце строки
    const cl = [''];
    for (const c of chans) { const cur = cl[cl.length - 1], nx = cur ? cur + '  ·  ' + c : c; if (textW(nx, 6) > 292 && cur) cl.push(c); else cl[cl.length - 1] = nx; }
    if (chans.length) cl.slice(0, 2).forEach(l => { text(l, 54, y, { col: INK_MUTED, size: 6 }); y += 8; });
    y += 4; rect(54, y - 3, 292, 1, '#e2d9c2');
    if (!d.offline) { text(`${L(UI.rScore)} ${d.score}${d.newBest ? '★' : ''} · ${this.rank ? '#' + this.rank.rank : '…'}`, 54, y + 2, { col: d.newBest ? INK_GOLD : INK, size: 6 });
      if (d.coins) text('+' + money(d.coins), 346, y, { col: INK_TEAL, align: 'right' }); }
    y += 14;
    let note, col = INK_MUTED;
    if (d.offline) note = L(UI.rOffline);
    else if (d.suspicious) { note = L(UI.rSuspicious); col = INK_RED; }
    else note = d.success ? (d.first ? fmtLine(L(TT.winNote)) : L(UI.rReplay)) : L(UI.rRetry);
    wrapText(note, 292, 6).slice(0, 3).forEach(l => { text(l, W / 2, y, { align: 'center', col, size: 6 }); y += 8; });
    // значки — коротко: «🏅 Төраға сайланды, Үй кеңесі · +70»
    if (!d.offline && !d.suspicious && d.reward) { const b = (d.reward.badges || [d.reward.badge]).map(k => BADGES[k] ? L(BADGES[k]) : '').filter(Boolean).join(', ');
      let rt = '★ ' + b + ' · +' + d.reward.points; while (textW(rt, 6) > 292 && rt.length > 8) rt = rt.slice(0, -2);
      y += 2; text(rt, W / 2, y, { align: 'center', col: d.reward.status === 'sent' ? INK_TEAL : INK_GOLD, size: 6 }); y += 8; }
    // подписи — мелко внизу
    text(ekn ? L(UI.protSign) : L(UI.protSign1).replace('{n}', d.signatures), W / 2, 188, { align: 'center', col: '#b5a888', size: 6 });
    if (d.success && this.t > 500) { const k = Math.min(1, (this.t - 500) / 200), s = 1 + (1 - k) * 1.5; ctx.save(); ctx.translate(324, 47); ctx.rotate(-.15); ctx.scale(s, s); ctx.globalAlpha = k;
      ctx.strokeStyle = '#b8443f'; ctx.lineWidth = 2; ctx.strokeRect(-24, -9, 48, 18); text(d.tourId === 'L1' ? 'ОСИ' : ['ИӘ', 'ЗА'][LI()] || 'ЗА', 0, -4, { col: '#b8443f', align: 'center' }); ctx.restore(); }
    const bw = 84;
    if (button(L(UI.toHouse), 108, 200, 'primary', { w: bw })) irisTo(108, 194, () => go('house', { focus: null }));
    if (button(L(UI.rating), 200, 200, 'alt', { w: bw })) irisTo(200, 194, () => go('leaderboard', { from: 'result' }));
    if (button(L(UI.again), 292, 200, 'alt', { w: bw })) irisTo(292, 194, () => go('tour', { tour: d.tourId || 'L1', skipInter: true }));
  },
};

/* ============================================================
   СЦЕНА: рейтинг — соседи по ЖК и весь город
   ============================================================ */
scenes.leaderboard = {
  enter(d) { this.from = d && d.from; this.scope = 'house'; this.fetch(); setTouch({ act: L(UI.back) }); },
  fetch() {
    this.data = null; this.err = false; const scope = this.scope;
    API.leaderboard(scope).then(r => { if (this.scope === scope) this.data = r; }).catch(() => { this.err = true; });
  },
  update() { if (hit('act') || hit('back')) irisTo(W / 2, 200, () => go('title')); { const dd = hit('left') ? 2 : hit('right') ? 1 : 0; if (dd) { const o = ['house', 'complex', 'city']; this.scope = o[(o.indexOf(this.scope) + dd) % 3]; this.fetch(); } } },
  draw(dt) {
    drawNight(dt);
    frameBox(60, 10, 280, 206);
    text(L(UI.rating), W / 2, 20, { align: 'center', col: '#f4f3ee' });
    for (const [sc, lbl, cx] of [['house', UI.tabHouse, 118], ['complex', UI.tabComplex, 200], ['city', UI.tabCity, 282]])
      if (button(L(lbl), cx, 34, this.scope === sc ? 'primary' : 'off', { w: 80 }) && this.scope !== sc) { this.scope = sc; this.fetch(); }
    const D = this.data;
    if (this.err) { text(L(UI.netFail), W / 2, 100, { align: 'center', col: '#e88a7a', size: 6 }); if (button(L(UI.retry), W / 2, 116, 'alt')) this.fetch(); }
    else if (!D) text('…', W / 2, 100, { align: 'center', col: '#8792ad' });
    else {
      if (USER.guest) wrapText(L(UI.guestNote), 260, 6).slice(0, 2).forEach((l, i) => text(l, W / 2, 53 + i * 7, { align: 'center', col: '#8792ad', size: 6 }));
      else if (this.scope === 'complex' && D.complexName) text(D.complexName, W / 2, 56, { align: 'center', col: '#9fd9c2', size: 6 });
      const row = (r, y) => {
        if (r.me) rect(72, y - 3, 256, 13, 'rgba(242,201,76,.18)');
        const c = r.me ? '#f2c94c' : r.rank <= 3 ? '#f4f3ee' : '#cfd6e4';
        text(String(r.rank), 84, y, { col: r.rank <= 3 ? ['#f2c94c', '#cfd6e4', '#d39a6a'][r.rank - 1] : '#8792ad', align: 'center' });
        text(r.me ? r.name + ' (' + L(UI.you) + ')' : r.name, 100, y, { col: c });
        text(String(r.best), 320, y, { col: c, align: 'right' });
      };
      const meIn = D.top.some(r => r.me), top = D.mine && !meIn ? D.top.slice(0, 7) : D.top;
      top.forEach((r, i) => row(r, 68 + i * 14));
      if (D.mine && !meIn) { text('···', W / 2, 68 + top.length * 14 - 3, { align: 'center', col: '#55607c' }); row(D.mine, 68 + top.length * 14 + 6); }
      if (!D.mine) text(L(UI.noScore), W / 2, 186, { align: 'center', col: '#8792ad', size: 6 });
    }
    if (button(L(UI.back), W / 2, 196, 'alt')) irisTo(W / 2, 204, () => go(this.from === 'result' ? 'title' : 'title'));
  },
};

/* ============================================================
   ЗАПУСК
   ============================================================ */
(async function boot() {
  try { if (document.fonts) await Promise.race([document.fonts.load('8px "Press Start 2P"', 'ҮЙ №67 ӘҒҚҢӨҰҮҺІ әғқңөұүһі'), wait(2500)]); } catch (e) {}
  // вход через сервер (пока — заглушка). Если связи нет, пробуем снова
  for (let i = 0; ; i++) {
    try { USER = await API.auth(); SAVE = (await API.load()) || (await migrateOldSave()) || NEW_SAVE(); break; }
    catch (e) { const m = document.getElementById('err'); m.textContent = 'E-KNOT: байланыс жоқ / нет связи… (' + (i + 1) + ')'; m.hidden = false; await wait(1500); }
  }
  document.getElementById('err').hidden = true; document.getElementById('err').textContent = '';
  if (LAUNCH.lang) setLang(LAUNCH.lang);
  flushResults();                                   // результаты, не дошедшие до сервера в прошлый раз
  notifyApp('ready', { clientVersion: CLIENT_VERSION, guest: USER.guest });
  SAVE.tours = SAVE.tours || {}; SAVE.trust = SAVE.trust || {};
  SAVE.look = { ...DEFAULT_LOOK, ...(SAVE.look || {}) };
  try { HOUSE_STATE = await API.house(); SAVE.coins = HOUSE_STATE.coins; } catch (e) {}   // неполное сохранение не должно ломать отрисовку героя
  if (USER.name && !SAVE.name) SAVE.name = USER.name;
  document.getElementById('rotate').textContent = L(UI.rotate);
  go('title');
  requestAnimationFrame(frame);
})();
