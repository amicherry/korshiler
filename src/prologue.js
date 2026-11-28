/* ============================================================
   СЦЕНА: ПРОЛОГ — дорога домой (как в Undertale: ходишь сам)
   двор → подъезд: крыса, лужа с потолка, сломанный лифт →
   лестница, соседи жалуются → своя квартира → решение создать ОСИ
   ============================================================ */
const PRO_PUD = 150;                       // лужа на 1-м этаже под капающим потолком
const PRO_NPC = [
  { id: 'apa',   floor: 2, x: 168, name: 'Сара апа',  arch: 'apa',      lines: ['apa1', 'apa2'], dark: true },
  { id: 'biz',   floor: 3, x: 170, name: 'Ерлан',     arch: 'business', lines: ['biz1', 'biz2'] },
  { id: 'grump', floor: 5, x: 166, name: 'Бекет ата', arch: 'grump',    lines: ['grump1', 'grump2'] },
  { id: 'mom',   floor: 6, x: 236, name: 'Әсел',      arch: 'mom',      lines: ['mom1', 'mom2'], auto: true, pram: true },
];
// детская коляска (вид сбоку, ручка справа — со стороны мамы): глубокая люлька, капюшон, рессора, большие колёса
const PRAM = makeCanvas(30, 28, ({ r, p, ell }) => {
  const O = '#141a1e', B = '#3f5e78', BL = '#5a7c96', BD = '#2c465c', T = '#c8d4da';
  // ручка
  r(22, 4, 1, 1, O); for (let i = 0; i < 6; i++) { r(22 + i, 9 - i, 2, 1, O); } r(26, 2, 4, 2, O); r(27, 2, 2, 1, '#3a4248');
  // люлька: округлое дно
  for (let y = 9; y <= 18; y++) { const k = (y - 9) / 9, inset = Math.round(Math.pow(k, 2.2) * 6); r(2 + inset, y, 21 - inset * 2, 1, y > 15 ? BD : B); p(1 + inset, y, O); p(23 - inset, y, O); }
  r(4, 19, 17, 1, O); r(4, 11, 17, 1, BL); r(3, 13, 2, 3, BL);
  // кант по краю и капюшон над изголовьем (справа)
  r(1, 8, 23, 2, T); r(1, 8, 23, 1, '#e8eef0'); p(0, 8, O); p(24, 8, O);
  for (let y = 0; y <= 8; y++) { const w = Math.round(Math.sqrt(1 - Math.pow((8 - y) / 8.5, 2)) * 11); r(23 - w, y, w, 1, y < 2 ? BD : B); p(22 - w, y, O); }
  for (const k of [3, 6]) for (let y = 1; y < 8; y++) { const w = Math.round(Math.sqrt(1 - Math.pow((8 - y) / 8.5, 2)) * 11); if (w > k) p(23 - k - Math.round((w - k) * .0), y, BD); }
  r(13, 1, 10, 1, O);
  // рессора и колёса
  r(6, 20, 13, 1, '#2a3238'); p(5, 21, '#2a3238'); p(19, 21, '#2a3238');
  for (const cx of [6, 19]) { ell(cx, 23, 4, 4, O); ell(cx, 23, 3, 3, '#4a565e'); ell(cx, 23, 2, 2, '#22292e'); p(cx, 23, '#9aa6ae'); p(cx - 2, 23, '#6a767e'); p(cx + 2, 23, '#6a767e'); p(cx, 21, '#6a767e'); p(cx, 25, '#6a767e'); }
});

const RAT_PAL = { k: '#1e1d24', r: '#5e6470', d: '#474c57', l: '#8a909a', n: '#d98a96', e: '#e04848' };
const ratRows = rows => makeCanvas(18, rows.length, ({ p }) => rows.forEach((row, y) => [...row].forEach((ch, x) => RAT_PAL[ch] && p(x, y, RAT_PAL[ch]))));
const RAT_BIG = [
  ratRows(["....kk............", "...krlkk..........", "..krrrrdkkkk......", ".kerrrrrrrrdk.....", "nkrrrrrrrrrrdk....", ".kllrrrrrrrrdkkn..", "..kkkllllrrdkk.nn.", "...k.k....k.k....n"]),
  ratRows(["....kk............", "...krlkk..........", "..krrrrdkkkk......", ".kerrrrrrrrdk.....", "nkrrrrrrrrrrdk....", ".kllrrrrrrrrdkk...", "..kkkllllrrdkknn..", "....k.k..k.k...nnn"]),
];
// анимации героя в прологе: кадры по времени (мс) — испуг от крысы и падение на луже, как в референсе
const HERO_ANIM = {
  scare: [[110, 'scare0'], [420, 'scare1'], [640, 'land']],
  slip:  [[150, 'slip0'], [400, 'slip1'], [900, 'sit'], [1700, 'lie'], [2100, 'sit'], [2350, 'land']],
  smell: [[1e9, 'smell']],
};
const DLG_Y0 = DLG_BOX.y;
// ночная комната героя, 200×113: сервант с кесе, телевизор на треноге, книжный шкаф, стол у окна, текемет
function buildRoom() {
  return makeCanvas(200, 113, ({ r, p, g, line, ell }) => {
    const R = rng(53);
    const C = { wall: '#1c3c47', wallD: '#163240', wallL: '#22495a', trim: '#10252d', floor: '#1d4446', floorD: '#163a3c', floorL: '#2a5f5c',
      f: '#22343a', fD: '#172429', fL: '#30484e', fE: '#3f5c62', glass: '#3c6470', cream: '#c8c0a0', creamD: '#9a9278' };
    // стена с едва заметными обоями
    r(0, 0, 200, 79, C.wall); for (let y = 2; y < 76; y += 6) for (let x = (y / 6 % 2) * 4; x < 200; x += 8) p(x, y, C.wallL);
    for (let i = 0; i < 6; i++) r(0, i, 200, 1, `rgba(6,16,20,${.5 - i * .08})`);
    r(0, 75, 200, 4, C.trim); r(0, 75, 200, 1, C.fL);
    // пол: доски сходятся к точке схода
    for (let y = 79; y < 113; y++) r(0, y, 200, 1, y < 90 ? C.floorD : C.floor);
    for (let i = -10; i <= 24; i++) line(100 + (i - 7) * 12, 79, 100 + (i - 7) * 30, 113, C.floorD);
    for (const y of [86, 95, 106]) r(0, y, 200, 1, 'rgba(10,30,32,.5)');
    // сервант: стекло с кесе и тарелками, ящики, дверцы с ромбами
    r(4, 18, 40, 61, C.fD); r(5, 19, 38, 59, C.f); r(4, 16, 40, 3, C.fL); r(4, 16, 40, 1, C.fE);
    for (const x of [7, 25]) { r(x, 21, 16, 28, C.glass); r(x, 21, 16, 1, '#5f8fa0'); r(x + 15, 21, 1, 28, C.fD);
      r(x, 34, 16, 1, C.fD); r(x + 2, 26, 4, 3, C.cream); r(x + 7, 27, 3, 2, C.cream); r(x + 11, 26, 3, 3, '#7aa0b0'); p(x + 3, 27, '#3f6f8c'); p(x + 8, 27, '#3f6f8c');
      r(x + 2, 37, 10, 1, C.creamD); r(x + 3, 36, 8, 1, C.cream); for (let k = 0; k < 4; k++) p(x + 4 + k * 2, 36, '#3f6f8c'); r(x + 12, 38, 2, 8, '#7a9a8a'); }
    r(5, 50, 38, 6, C.fL); for (const x of [10, 30]) r(x, 52, 6, 1, C.fD);
    for (const x of [7, 25]) { r(x, 58, 16, 18, C.fL); r(x, 58, 16, 1, C.fE); const cx = x + 8, cy = 67; for (let k = 0; k < 4; k++) { p(cx - k, cy - 3 + k, '#5f8fa0'); p(cx + k, cy - 3 + k, '#5f8fa0'); p(cx - k, cy + 3 - k, '#5f8fa0'); p(cx + k, cy + 3 - k, '#5f8fa0'); } p(x + 13, 67, C.cream); }
    // ваза с сухими ветками
    r(21, 11, 4, 5, '#5f8fa0'); r(22, 10, 2, 1, '#5f8fa0'); for (const [dx, h] of [[-4, 7], [0, 9], [3, 6], [-2, 5]]) { line(23, 10, 23 + dx, 10 - h, '#2a3a3a'); p(23 + dx, 10 - h, '#9ab0b8'); p(23 + dx + 1, 11 - h, '#9ab0b8'); }
    // календарь и телевизор на треноге
    r(54, 10, 16, 20, C.cream); r(54, 10, 16, 4, '#b04a4a'); for (let y = 17; y < 28; y += 3) for (let x = 56; x < 68; x += 3) p(x, y, C.creamD); r(55, 15, 14, 1, '#7aa0b0');
    line(56, 60, 50, 82, C.fD); line(62, 60, 62, 84, C.fD); line(68, 60, 74, 82, C.fD);
    r(49, 40, 26, 21, C.fD); r(50, 41, 24, 19, C.f); r(52, 43, 16, 14, '#22404a'); r(53, 44, 14, 12, '#2a4f58'); r(54, 45, 4, 2, '#4a7a84'); r(70, 45, 2, 2, '#5f8fa0'); r(70, 50, 2, 2, C.fE);
    // книжный шкаф с растением
    r(80, 20, 30, 59, C.fD); r(81, 21, 28, 57, C.f); r(80, 18, 30, 2, C.fL);
    const BOOK = ['#2f5a5a', '#3a4a5c', '#4a4040', '#5a5040', '#2a4a50', '#46564a', '#6a4a40'];
    for (const y0 of [22, 36, 50, 64]) { let x = 82; while (x < 107) { const w = 2 + Math.floor(R() * 2), h = 9 + Math.floor(R() * 4), c = BOOK[Math.floor(R() * BOOK.length)];
        if (R() < .12) { x += 2; continue; } r(x, y0 + 12 - h, w, h, c); p(x, y0 + 12 - h, shade(c, 25)); x += w; } r(81, y0 + 12, 28, 2, C.fL); }
    r(92, 12, 6, 6, '#3f5a50'); for (const [dx, dy] of [[-3, -4], [0, -6], [3, -5], [5, -2], [-5, -1]]) { line(95, 12, 95 + dx, 12 + dy, '#3f7a5a'); p(95 + dx, 12 + dy, '#5aa07a'); }
    // занавеска и окно: ночь, луна, соседний дом с огнями
    r(117, 12, 63, 50, C.fD);
    for (let y = 14; y < 60; y++) r(119, y, 58, 1, `rgb(${40 + (y - 14) * 1.2 | 0},${70 + (y - 14) * 1.6 | 0},${96 + (y - 14) * 1.5 | 0})`);
    for (let i = 0; i < 9; i++) p(121 + R() * 54, 16 + R() * 14, '#d8eef0');
    r(164, 18, 5, 5, '#e8f4ea'); r(165, 17, 3, 7, '#e8f4ea'); r(163, 19, 7, 3, '#e8f4ea'); r(167, 18, 2, 2, '#c8e0dc');
    for (const [bx, bw, bt] of [[119, 18, 40], [139, 24, 34], [163, 14, 44]]) { r(bx, bt, bw, 60 - bt, '#24404e'); for (let y = bt + 3; y < 58; y += 4) for (let x = bx + 2; x < bx + bw - 2; x += 3) if (R() < .22) r(x, y, 2, 2, R() < .4 ? '#e8c070' : '#a8c8c8'); }
    for (const x of [130, 142, 154, 166]) r(x, 14, 1, 46, C.fD); for (const y of [26, 37, 48]) r(119, y, 58, 1, C.fD);
    r(116, 60, 64, 3, '#5a7c80'); r(116, 60, 64, 1, '#8ab0b0');
    for (let x = 0; x < 8; x++) r(110 + x, 8, 1, 66 - (x % 3), x % 2 ? '#2a5458' : '#24484c'); r(110, 8, 9, 2, C.fL);
    // стол у окна: монитор, клавиатура, кружка, лампа
    r(120, 64, 58, 3, C.fL); r(120, 64, 58, 1, C.fE); r(122, 67, 2, 12, C.fD); r(158, 67, 18, 12, C.f); for (const y of [69, 73, 77]) { r(159, y, 16, 1, C.fD); p(167, y + 2, C.fE); }
    r(134, 48, 21, 15, C.fD); r(135, 49, 19, 13, C.f); r(137, 51, 15, 9, '#2a5560'); r(143, 62, 4, 2, C.fD); p(152, 60, '#d05050');
    r(135, 63, 16, 1, '#3a5458'); r(156, 59, 4, 5, '#3f6f8c'); r(160, 60, 1, 2, '#3f6f8c');
    line(172, 63, 168, 50, C.fD); line(168, 50, 160, 46, C.fD); r(157, 45, 5, 3, '#2a3a40'); r(170, 62, 6, 2, C.fD);
    // круглый столик с чайником и кесе
    r(181, 68, 19, 3, C.fL); r(181, 68, 19, 1, C.fE); line(184, 71, 182, 84, C.fD); line(196, 71, 198, 84, C.fD);
    r(185, 62, 7, 6, '#b04a4a'); r(186, 61, 5, 1, '#c86a5a'); r(192, 63, 2, 2, '#b04a4a'); r(194, 65, 4, 3, C.cream); p(195, 65, '#3f6f8c');
    // часы с маятником
    r(184, 4, 11, 26, C.fD); r(185, 5, 9, 9, C.cream); p(189, 7, C.fD); p(189, 8, C.fD); p(190, 9, C.fD); r(186, 15, 7, 13, '#1a2a30');
    // текемет на полу: войлок с орнаментом «қошқар мүйіз»
    { const rug = (y, x0, x1, col) => r(Math.round(x0), y, Math.round(x1 - x0), 1, col);
      for (let y = 88; y < 111; y++) { const k = (y - 88) / 23, x0 = 58 - k * 12, x1 = 146 + k * 12; rug(y, x0, x1, '#7a3a36');
        if (y === 89 || y === 109) rug(y, x0 + 2, x1 - 2, '#c8a870'); else if (y > 89 && y < 109) { p(x0 + 2, y, '#c8a870'); p(x1 - 3, y, '#c8a870'); } }
      for (let i = 0; i < 4; i++) { const cx = 76 + i * 18, cy = 99; r(cx - 1, cy - 1, 3, 3, '#c8a870');
        for (const sx of [-1, 1]) { p(cx + sx * 3, cy - 3, '#c8a870'); p(cx + sx * 4, cy - 2, '#c8a870'); p(cx + sx * 4, cy - 1, '#c8a870'); p(cx + sx * 3, cy + 3, '#c8a870'); p(cx + sx * 4, cy + 2, '#c8a870'); p(cx + sx * 2, cy - 3, '#c8a870'); } } }
    // подушка-корпе на полу (вентилятор убран — герой проходил сквозь него)
    r(122, 92, 18, 5, '#8a3a3a'); r(123, 91, 16, 1, '#a04a46'); r(122, 97, 18, 1, '#5a2626'); p(130, 94, '#c8a870');
    // виньетка: края комнаты темнее
    for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(6,14,18,${(.04 * (18 - i) / 18 * 3).toFixed(3)})`; g.fillRect(i, 0, 1, 113); g.fillRect(199 - i, 0, 1, 113); }
    for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(6,14,18,${(.05 * (10 - i) / 10 * 3).toFixed(3)})`; g.fillRect(0, 112 - i, 200, 1); }
  });
}
scenes.prologue = {
  enter() {
    this.t = 0; this.phase = 'street'; this.done = {}; this.busy = false; this.plan = null;
    this.hx = 110; this.dir = 1; this.scx = 0; this.moving = false; this.walkT = 0; this.stepAcc = 0;
    this.floors = HOUSE.floors; this.heroApt = HOUSE.heroApt;
    this.homeFloor = Math.ceil(this.heroApt / HOUSE.perFloor); this.homeX = DOOR_X[(this.heroApt - 1) % HOUSE.perFloor];
    // подъезд и квартиру рисуем заранее, пока идёт улица, — иначе у двери игра на миг «подвисала»
    this.preBg = null; this.room = null;
    setTimeout(() => { if (scene === this && !this.preBg) this.preBg = this.makeStairs(); }, 700);
    setTimeout(() => { if (scene === this && !this.room) this.room = buildRoom(); }, 1500);
    this.npcs = PRO_NPC.map(n => ({ ...n, look: Object.assign({}, ARCH[n.arch].look), done: false, gone: 0 }));
    setTouch({ move: true });
  },
  focus() { return this.phase === 'stairs' ? { x: this.h.x - this.camX, y: this.h.y - this.camY - 14 } : this.phase === 'flat' ? { x: this.fx * 2, y: 150 } : { x: this.hx - this.scx, y: STREET_GROUND - 20 }; },
  base(f) { return floorBase(f, this.floors); },
  // реплика героя / соседа
  async talk(name, look, keys, expr = 'neutral', voice = 420) {
    dlgOpen(name, e => portrait(look, e), voice, null, look.body === 'f');
    for (const k of keys) await say(typeof k === 'string' ? L(PRO[k]) : L(k), expr);
    dlgClose();
  },
  think(k, expr = 'sad') { return this.talk(SAVE.name, SAVE.look, [k], expr); },
  finish() {
    DLG_BOX.y = DLG_Y0;
    SAVE.seenIntro = true; persist(); this.busy = true; dlgClose(); setTouch({});
    irisTo(W / 2, 140, () => go('tour', { tour: 'L1' }));
  },

  /* ---------- двор ---------- */
  updateStreet(dt) {
    let dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (dir) this.plan = null;
    if (!dir && this.plan != null) { if (Math.abs(this.plan - this.hx) > 1) dir = Math.sign(this.plan - this.hx); else this.plan = null; }
    this.moving = !!dir;
    if (dir) { this.dir = dir; this.hx = clamp(this.hx + dir * dt * .07, 8, SWS - 10); this.walkT += dt; this.stepAcc += dt; if (this.stepAcc > 240) { this.stepAcc = 0; sfx.step(); } }
    const sx = this.hx - this.scx; let tx = this.scx; if (sx < 140) tx = this.hx - 140; else if (sx > 260) tx = this.hx - 260;
    this.scx = lerp(this.scx, camClamp(tx, SWS), Math.min(1, dt / 200));
    const atDoor = Math.abs(this.hx - STREET_DOOR_X) < 10;
    setTouch({ act: atDoor ? L(PRO.enter) : null, move: true });
    if (atDoor && (hit('act') || (this.plan == null && this.tapDoor))) this.enterHouse();
    const c = clicks.find(c => c.y > 16); if (c) { clicks.splice(clicks.indexOf(c), 1); this.plan = clamp(c.x + this.scx, 8, SWS - 10); this.tapDoor = Math.abs(c.x + this.scx - STREET_DOOR_X) < 16; sfx.select(); }
  },
  async enterHouse() {
    if (this.busy) return; this.busy = true; this.moving = false; this.plan = null;
    await this.think('door', 'angry');
    irisTo(STREET_DOOR_X - this.scx, 110, () => this.toStairs());
  },
  makeStairs() {
    const R = rng(hashStr(USER.userId) + 9), look = {};
    for (let apt = 1; apt <= this.floors * HOUSE.perFloor; apt++) look[apt] = pick(R, DOOR_STYLES);
    look[this.heroApt] = { col: '#2f6f62', kind: 'metal' };
    return drawStairwell(this.floors, apt => look[apt], new Set());
  },
  toStairs() {
    this.phase = 'stairs'; this.busy = false;
    this.bg = this.preBg || this.makeStairs();
    this.WH = this.bg.height;
    this.h = { x: 14, floor: 1, y: this.base(1), dir: 1, walkT: 0, moving: false, climb: null, anim: null };
    this.camY = clamp(this.h.y - 165, 0, this.WH - H); this.camX = camClamp(0, SW);
    this.drops = [0, 400, 800].map(o => ({ t: o })); this.rat = null; this.dust = []; this.stink = 0;
    irisFrom(this.h.x - this.camX, this.h.y - this.camY - 14);
  },

  /* ---------- подъезд ---------- */
  near(n) { const h = this.h; return !n.done && !n.gone && h.floor === n.floor && !h.climb && Math.abs(h.x - n.x) < 24; },
  updateStairs(dt) {
    const h = this.h;
    // крыса бежит навстречу, герой подпрыгивает
    if (this.rat) { const r = this.rat; r.t += dt; r.x -= dt * .19;
      if (!r.jumped && r.x - h.x < 34) { r.jumped = true; this.play('scare'); beep(740, .05, 'square', .05); beep(990, .07, 'square', .05, .06); }
      if (r.x < RAT_HOLES[0] + 2) { this.rat = null; this.afterRat(); } }
    if (h.anim) { const A = h.anim; A.t += dt;
      if (A.kind === 'slip') { const k = A.t < 150 ? .07 : A.t < 400 ? .06 : A.t < 900 ? .05 * (1 - (A.t - 400) / 500) : 0; h.x += dt * k;
        if (A.t > 400 && A.t < 900 && Math.random() < dt / 60) this.dust.push({ x: h.x - 8, y: h.y - 2, t: 0, dx: -.01 - Math.random() * .02 }); }
      if (A.kind !== 'smell' && A.t > HERO_ANIM[A.kind].slice(-1)[0][0]) { const k = A.kind; h.anim = null; if (k === 'slip') this.afterSlip(); } }
    for (const d of this.dust) { d.t += dt; d.x += d.dx * dt; } this.dust = this.dust.filter(d => d.t < 500);
    for (const n of this.npcs) if (n.gone) n.gone += dt;
    if (this.busy || h.anim || this.rat) {
      if (h.goal != null) { const d = h.goal - h.x; h.dir = Math.sign(d) || h.dir; h.moving = true; h.walkT += dt; h.x += Math.sign(d) * Math.min(Math.abs(d), dt * .075);
        if (Math.abs(d) < .6) { h.x = h.goal; h.goal = null; h.moving = false; } }
      else h.moving = false;
      this.updateCam(dt); return;
    }
    if (h.climb) {
      const c = h.climb; c.t += dt / 2600;
      const seg = c.t < .5 ? 0 : 1, k = Math.min(1, seg ? (c.t - .5) * 2 : c.t * 2), a = c.pts[seg], b = c.pts[seg + 1];
      h.x = lerp(a[0], b[0], k); h.y = lerp(a[1], b[1], k); h.dir = b[0] < a[0] ? -1 : 1; h.walkT += dt;
      this.stepAcc += dt; if (this.stepAcc > 260) { this.stepAcc = 0; sfx.step(); }
      if (c.t >= 1) { h.floor = c.to; h.x = c.pts[2][0]; h.y = this.base(c.to); h.climb = null; this.arrived(); }
      this.updateCam(dt); return;
    }
    let dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (dir || keys.up || keys.down) this.plan = null;
    if (!dir && this.plan) {
      const P = this.plan;
      if (P.floor !== h.floor) { if (Math.abs(h.x - STAIR_FOOT) > 1.5) dir = Math.sign(STAIR_FOOT - h.x); else { this.climb(Math.sign(P.floor - h.floor)); this.updateCam(dt); return; } }
      else if (Math.abs(h.x - P.x) > 1.5) dir = Math.sign(P.x - h.x);
      else { this.plan = null; if (P.act) this.act(); }
      const tx = P.floor !== h.floor ? STAIR_FOOT : P.x; if (dir && Math.abs(tx - h.x) < dt * .075) { h.x = tx; dir = 0; }
    }
    h.moving = dir !== 0;
    if (dir) { h.dir = dir; h.x = clamp(h.x + dir * dt * .075, WALK_MIN, WALK_MAX); h.walkT += dt; this.stepAcc += dt; if (this.stepAcc > 230) { this.stepAcc = 0; sfx.step(); } }
    h.y = this.base(h.floor);
    // события первого этажа
    if (h.floor === 1 && !this.done.rat && h.x > 64) { this.done.rat = true; this.rat = { x: h.x + 170, t: 0 }; this.plan = null; }
    if (h.floor === 1 && !this.done.slip && this.done.rat && Math.abs(h.x - (PRO_PUD - 12)) < 4 && h.dir > 0) { this.done.slip = true; this.plan = null; this.play('slip'); sfx.no(); }
    // у спуска в подвал пахнет сыростью: герой останавливается и зажимает нос
    if (h.floor === 1 && !this.done.smell && this.done.slip && h.x > STAIR_FOOT - 22) { this.done.smell = true; this.plan = null; this.smell(); return; }
    // мама с коляской сама останавливает на 6-м
    for (const n of this.npcs) if (n.auto && !n.done && h.floor === n.floor && Math.abs(h.x - n.x) < 60) { this.plan = null; return this.talkNpc(n); }
    const onStairs = Math.abs(h.x - STAIR_FOOT) < 10;
    if (onStairs && hit('up') && h.floor < this.floors) return this.climb(1);
    if (onStairs && hit('down') && h.floor > 1) return this.climb(-1);
    const npc = this.npcs.find(n => this.near(n)), lift = Math.abs(h.x - LIFT_X) < 12, home = h.floor === this.homeFloor && Math.abs(h.x - this.homeX) < 14;
    setTouch({ act: npc ? L(UI.talk) : home ? L(PRO.home) : lift ? L(UI.lift) : null, up: onStairs && h.floor < this.floors, down: onStairs && h.floor > 1, move: true });
    if (hit('act')) this.act();
    const c = clicks.find(c => c.y > 16); if (c) { clicks.splice(clicks.indexOf(c), 1); this.onTap(c.x + this.camX, c.y + this.camY); }
    this.updateCam(dt);
  },
  act() {
    const h = this.h, npc = this.npcs.find(n => this.near(n));
    if (npc) return this.talkNpc(npc);
    if (h.floor === this.homeFloor && Math.abs(h.x - this.homeX) < 14) return this.enterFlat();
    if (Math.abs(h.x - LIFT_X) < 12) return this.tryLift();
  },
  onTap(x, wy) {
    let f = 1; for (let k = 1; k <= this.floors; k++) { const b = this.base(k); if (wy > b - FLOOR_H + 6 && wy <= b + 8) f = k; }
    const P = { floor: f, x: clamp(x, WALK_MIN, WALK_MAX), act: false };
    for (const n of this.npcs) if (!n.done && !n.gone && n.floor === f && Math.abs(x - n.x) < 14) { P.x = n.x + (this.h.x < n.x ? -16 : 16); P.act = true; }
    if (f === this.homeFloor && Math.abs(x - this.homeX) < 17) { P.x = this.homeX; P.act = true; }
    if (Math.abs(x - LIFT_X) < 14) { P.x = LIFT_X; P.act = true; }
    else if (Math.abs(x - STAIR_FOOT) < 14 || (x > CORE_L && x < LIFT_X - 14)) P.x = STAIR_FOOT;
    this.plan = P; sfx.select();
  },
  climb(d) {
    const h = this.h, b = this.base(h.floor); this.plan = this.plan && this.plan.floor !== h.floor ? this.plan : null;
    h.climb = d > 0 ? { to: h.floor + 1, t: 0, pts: [[STAIR_FOOT, b], [STAIR_TOP, b - 50], [STAIR_FOOT, b - 100]] }
                    : { to: h.floor - 1, t: 0, pts: [[STAIR_FOOT, b], [STAIR_TOP, b + 50], [STAIR_FOOT, b + 100]] };
  },
  async arrived() {
    const h = this.h;
    if (h.floor === 2 && !this.done.dark) { this.done.dark = true; this.plan = null; this.busy = true; await this.think('dark', 'think'); this.busy = false; }
  },
  play(kind) { this.h.anim = { kind, t: 0 }; this.h.moving = false; },
  async smell() { this.busy = true; const h = this.h; h.dir = 1; this.stink = 1; await wait(500); this.play('smell');
    await this.think('smell', 'angry'); h.anim = null; this.busy = false; },
  async afterRat() { this.busy = true; await this.think('rat', 'angry'); this.busy = false; },
  async afterSlip() { this.busy = true; await this.think('slip', 'sad'); this.busy = false; },
  async tryLift() {
    if (this.busy) return; const h = this.h;
    pop(LIFT_X, h.y - 70, L(UI.liftBroken), '#e88a7a'); sfx.no();
    if (this.done.lift) return; this.done.lift = true; this.busy = true;
    beep(220, .12, 'square', .04); beep(196, .16, 'square', .04, .14);
    await wait(500); await this.think('lift', 'angry'); this.busy = false;
  },
  async talkNpc(n) {
    if (this.busy) return; this.busy = true; const h = this.h;
    h.dir = Math.sign(n.x - h.x) || 1;
    if (Math.abs(h.x - n.x) < 16) { h.goal = n.x - h.dir * 18; while (h.goal != null) await wait(30); }
    await this.talk(n.name, n.look, n.lines, n.arch === 'grump' ? 'angry' : 'sad', ARCH[n.arch].voice);
    if (n.pram) {
      dlgOpen(n.name, e => portrait(n.look, e), ARCH[n.arch].voice, null, n.look.body === 'f'); DLG.arch = n.arch;
      const c = await ask([{ label: L(PRO.momHelp) }, { label: L(PRO.momBye) }]);
      if (c === 0) { dlgClose(); await this.talk(SAVE.name, SAVE.look, ['momHero'], 'happy');
        await this.talk(n.name, n.look, ['momThx'], 'happy', ARCH[n.arch].voice); SAVE.helpedMom = true; SAVE.trust = SAVE.trust || {}; for (let d = 1; d <= HOUSE.perFloor; d++) { const a = 8 * HOUSE.perFloor + d; SAVE.trust[a] = (SAVE.trust[a] || 0) + 5; } n.gone = 1; }
      else { await say(L(PRO.momSad), 'sad'); dlgClose(); }
    }
    n.done = true; this.busy = false;
  },
  async enterFlat() {
    if (this.busy) return; this.busy = true; sfx.door();
    irisTo(this.homeX - this.camX, this.h.y - this.camY - 20, () => { this.phase = 'flat'; this.fx = 214; this.fgoal = 104; this.flatTalk = false; DLG_BOX.y = 4; irisFrom(380, 150); });
  },
  updateCam(dt) {
    const h = this.h, target = clamp(h.y - (DLG.open ? DLG_BOX.y - 6 : 165), 0, this.WH - H);
    this.camY = lerp(this.camY, target, Math.min(1, dt / 160));
    const sx = h.x - this.camX; let tx = this.camX;
    if (sx < 120) tx = h.x - 120; else if (sx > 280) tx = h.x - 280;
    this.camX = lerp(this.camX, camClamp(tx, SW), Math.min(1, dt / 200));
  },

  /* ---------- квартира ---------- */
  updateFlat(dt) {
    const d = this.fgoal - this.fx;
    if (Math.abs(d) > .5) { this.fx += Math.sign(d) * Math.min(Math.abs(d), dt * .04); this.moving = true; this.walkT += dt * .7; }
    else { this.moving = false; if (!this.flatTalk) { this.flatTalk = true; this.flatMonologue(); } }
  },
  async flatMonologue() {
    await wait(300);
    dlgOpen(SAVE.name, e => portrait(SAVE.look, e), heroVoice(), null, SAVE.look && SAVE.look.body === 'f'); DLG.hero = true;   // мысли героя — голосом героя
    await say(L(PRO.flat1), 'sad'); await say(L(PRO.flat2), 'think');
    await say(L(PRO.flat3).replace('{g}', TOURS.L1.goal).replace('{n}', APTS), 'happy');
    dlgClose(); this.finish();
  },

  update(dt) {
    this.t += dt; dlgUpdate(dt);
    if (this.phase === 'stairs' && DLG.open) this.updateCam(dt);
    if (trans.phase || DLG.open) return;
    if (this.phase === 'street' && !this.busy) this.updateStreet(dt);
    else if (this.phase === 'stairs') this.updateStairs(dt);
    else if (this.phase === 'flat') this.updateFlat(dt);
  },

  /* ---------- рисование ---------- */
  draw(dt) {
    if (this.phase === 'street') this.drawStreetPhase(dt);
    else if (this.phase === 'stairs') this.drawStairs(dt);
    else this.drawFlat(dt);
    this.drawTop();
    dlgDraw();
  },
  heroFrame(moving, walkT) { return moving ? 'walk' + (Math.floor(walkT / 95) % 8) : 'idle' + (Math.floor(this.t / 500) % 2); },
  drawStreetPhase(dt) {
    const cx = Math.round(this.scx);
    drawStreet(dt, this.t, cx);
    ctx.fillStyle = 'rgba(4,10,12,.4)'; ctx.fillRect(Math.round(this.hx) - 7 - cx, STREET_GROUND - 1, 14, 2);
    sprite(personSprite(SAVE.look, this.heroFrame(this.moving, this.walkT)), Math.round(this.hx) - 9 - cx, STREET_GROUND - PH, this.dir < 0);
    drawStreetFront(cx);
    if (!this.busy && Math.abs(this.hx - STREET_DOOR_X) < 10 && Math.floor(this.t / 400) % 2) text(isTouch ? '▼' : 'E', STREET_DOOR_X - cx, STREET_GROUND - PH - 14, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' });
  },
  drawStairs(dt) {
    const h = this.h, cy = Math.round(this.camY), cx = Math.round(this.camX), t = this.t;
    ctx.save(); ctx.translate(-cx, 0);
    ctx.drawImage(this.bg, 0, -cy);
    for (let f = 1; f <= this.floors; f++) {
      const b = this.base(f) - cy; if (b < -10 || b > H + 110) continue;
      for (const [li, lx] of [[0, 49], [1, 141], [2, 351], [3, 443]]) {
        const broken = (f === 2 && li === 1) || (f * 7 + li * 3) % 5 === 0;
        const on = !broken && Math.sin(t / 97 + f * 13 + li * 5) > -.75;
        rect(lx, b - 94, 1, 6, '#0e1011'); rect(lx - 5, b - 88, 11, 4, '#1c1f24'); rect(lx - 3, b - 85, 7, 3, on ? '#fff1b8' : '#4b4f4c');
        if (on) { if (!this.glow) this.glow = makeCanvas(220, 94, ({ g }) => { const gr = g.createRadialGradient(110, 10, 2, 110, 44, 110); gr.addColorStop(0, 'rgba(255,214,140,.30)'); gr.addColorStop(.5, 'rgba(255,190,110,.10)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, 220, 94); });
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .8; ctx.drawImage(this.glow, lx - 110, b - 94); ctx.restore(); }
      }
      // 2-й этаж у лестницы: тёмный, без лампы
      if (f === 2) { ctx.fillStyle = 'rgba(5,7,10,.35)'; ctx.fillRect(90, b - 92, 110, 92); }
    }
    // капли с потолка и лужа на 1-м этаже
    { const b = this.base(1) - cy, top = b - FLOOR_H + 8;
      rect(PRO_PUD - 2, top, 5, 3, 'rgba(110,80,40,.6)'); rect(PRO_PUD - 1, top + 3, 3, 4, 'rgba(90,64,34,.45)');
      for (const d of this.drops) { d.t = (d.t + dt) % 1200; const k = d.t / 900;
        if (k < 1) rect(PRO_PUD, top + 4 + k * k * (b - top - 6), 1, 2, '#9ec4e2');
        else { const s = (d.t - 900) / 300; rect(PRO_PUD - 2 - s * 4, b - 2 - Math.sin(s * Math.PI) * 3, 1, 1, '#9ec4e2'); rect(PRO_PUD + 2 + s * 4, b - 2 - Math.sin(s * Math.PI) * 3, 1, 1, '#9ec4e2'); } }
      ctx.fillStyle = 'rgba(120,170,210,.35)'; ctx.fillRect(PRO_PUD - 16, b - 1, 32, 1); ctx.fillRect(PRO_PUD - 11, b, 22, 1);
      rect(PRO_PUD - 6 + Math.round(Math.sin(t / 300) * 3), b - 1, 4, 1, 'rgba(220,240,255,.6)'); }
    // вонь из подвала: зеленоватые волны поднимаются из проёма
    if (this.stink) { this.stink += dt; const b = this.base(1) - cy;
      // струйки вони: волнистые, поднимаются из проёма лестницы в подвал и тают
      for (let i = 0; i < 9; i++) { const k = ((t / 2200 + i * .37) % 1), x0 = STAIR_FOOT + 4 + i * 8, a = Math.sin(k * Math.PI) * .75;
        ctx.globalAlpha = a; for (let j = 0; j < 14; j++) { const y = b + 10 - k * 64 - j * 2, x = x0 + Math.sin(t / 380 + j * .55 + i * 1.7) * 3;
          rect(Math.round(x), Math.round(y), 2, 2, j % 4 === 0 ? '#b6d07a' : '#86a85a'); } }
      ctx.globalAlpha = 1; }
    // крыса
    if (this.rat) sprite(RAT_BIG[Math.floor(this.rat.t / 70) % 2], Math.round(this.rat.x - 8), this.base(1) - cy - 8);
    // соседи
    for (const n of this.npcs) {
      if (n.gone > 1400) continue;
      const nb = this.base(n.floor) - cy; if (nb < -60 || nb > H + 60) continue;
      const leaving = n.gone > 0, nx = n.x + (leaving ? -n.gone * .05 : 0);
      if (n.pram) sprite(PRAM, Math.round(nx - 36), nb - 27);
      const fr = leaving ? 'walk' + (Math.floor(n.gone / 95) % 8) : 'idle' + (Math.floor(t / 600) % 2);
      ctx.globalAlpha = leaving ? clamp(1 - (n.gone - 900) / 500, 0, 1) : 1;
      sprite(personSprite(n.look, fr), Math.round(nx) - 9, nb - PH, leaving || h.x < n.x);
      ctx.globalAlpha = 1;
      if (!n.done && !leaving && Math.floor(t / 400) % 2) text('!', nx, nb - PH - 12, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' });
    }
    // герой: прыжок от крысы, падение на луже
    const hy = h.y - cy;
    for (const d of this.dust) { ctx.globalAlpha = 1 - d.t / 500; rect(Math.round(d.x), Math.round(d.y - cy - d.t / 120), 2 + (d.t > 250 ? 1 : 0), 2, '#c9d4dc'); } ctx.globalAlpha = 1;
    if (h.anim) {
      const A = h.anim, fr = HERO_ANIM[A.kind].find(f => A.t < f[0])?.[1] || 'land';
      if (fr === 'lie') { const L = lyingSprite(SAVE.look); sprite(L, Math.round(h.x - L.hip), Math.round(hy - L.bottom - 1));
        for (let i = 0; i < 3; i++) { const a = t / 260 + i * 2.1; text('*', h.x - 20 + Math.cos(a) * 9, hy - 18 + Math.sin(a) * 3, { col: '#f2c94c', size: 6 }); } }
      else { // прыжок от крысы — дугой вверх
        const lift = A.kind === 'scare' && A.t > 110 && A.t < 420 ? Math.round(Math.sin((A.t - 110) / 310 * Math.PI) * 16) : A.kind === 'slip' && A.t > 150 && A.t < 400 ? Math.round(Math.sin((A.t - 150) / 250 * Math.PI) * 6) : 0;
        sprite(personSprite(SAVE.look, 'pose_' + fr), Math.round(h.x) - 9 - POSE_OX, Math.round(hy - PH - POSE_OY - lift), h.dir < 0);
        if (A.kind === 'scare' && A.t < 500) text('!', h.x + 2, hy - PH - lift - 14, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' });
        if (A.kind === 'smell') for (let i = 0; i < 3; i++) { const k = (t / 900 + i / 3) % 1; ctx.globalAlpha = Math.sin(k * Math.PI) * .8; text('~', h.x + 10 + i * 5, hy - PH - 2 - k * 14, { col: '#b6d07a', size: 8, shadow: '#0b0c10' }); } ctx.globalAlpha = 1; }
    } else {
      const img = personSprite(Object.assign({ blink: Math.floor(t / 2600) % 3 === 0 }, SAVE.look), h.climb ? 'climb' + (Math.floor(h.walkT / 260) % 4) : this.heroFrame(h.moving, h.walkT));
      sprite(img, Math.round(h.x) - 9, Math.round(hy - PH), h.dir < 0);
    }
    // подсказки
    if (!this.busy && !h.climb && !h.anim && !this.rat) {
      if (Math.abs(h.x - STAIR_FOOT) < 10) text((h.floor < this.floors ? '▲' : '') + (h.floor > 1 ? '▼' : ''), STAIR_FOOT - 14, hy - 56, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' });
      if (h.floor === this.homeFloor && Math.abs(h.x - this.homeX) < 14 && Math.floor(t / 400) % 2) text(isTouch ? '▼' : 'E', this.homeX, hy - 86, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' });
    }
    if (h.floor === this.homeFloor || (h.climb && h.climb.to === this.homeFloor)) { const b = this.base(this.homeFloor) - cy; sprite(ICONS.me, this.homeX + 9, b - 61); }
    ctx.restore();
    drawPops(dt, cx, cy);
  },
  drawFlat(dt) {
    // комната рисуется в 200×113 и увеличивается вдвое — крупный пиксель, как в референсе
    if (!this.room) this.room = buildRoom();
    const t = this.t;
    ctx.save(); ctx.scale(2, 2);
    ctx.drawImage(this.room, 0, 0);
    // лунный свет из окна: луч на пол и пылинки в нём
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(150,220,205,.07)'; ctx.beginPath(); ctx.moveTo(119, 60); ctx.lineTo(177, 60); ctx.lineTo(170, 113); ctx.lineTo(64, 113); ctx.fill();
    ctx.fillStyle = 'rgba(150,220,205,.06)'; ctx.beginPath(); ctx.moveTo(119, 14); ctx.lineTo(177, 14); ctx.lineTo(177, 60); ctx.lineTo(119, 60); ctx.fill();
    for (let i = 0; i < 14; i++) { const k = (t / 9000 + i * .137) % 1, x = 80 + ((i * 53) % 90) + Math.sin(t / 1500 + i) * 4 - k * 20, y = 62 + ((i * 29) % 46) - k * 10;
      ctx.globalAlpha = Math.sin(k * Math.PI) * .7; rect(Math.round(x), Math.round(y), 1, 1, '#cfeee8'); }
    ctx.restore(); ctx.globalAlpha = 1;
    // экран монитора слегка мерцает, маятник часов качается
    rect(137, 51, 15, 9, Math.sin(t / 700) > .9 ? '#2f5f6a' : '#2a5560');
    { const a = Math.sin(t / 500) * .35, px = 189, py = 21; for (let i = 0; i < 7; i++) rect(Math.round(px + Math.sin(a) * i), py + i, 1, 1, '#8a9a8a'); rect(Math.round(px + Math.sin(a) * 7) - 1, py + 7, 3, 3, '#c9a95a'); }
    // герой
    const fr = this.heroFrame(this.moving, this.walkT);
    sprite(personSprite(SAVE.look, fr), Math.round(this.fx) - 9, 101 - PH, this.fgoal < this.fx);
    ctx.fillStyle = 'rgba(5,14,18,.35)'; ctx.fillRect(Math.round(this.fx) - 7, 100, 14, 2);
    ctx.restore();
  },
  drawTop() {
    if (this.phase === 'flat') return;
    rect(0, 0, W, 15, 'rgba(14,17,28,.88)'); rect(0, 15, W, 1, '#55607c');
    const h = this.h, f = this.homeFloor;
    const obj = this.phase === 'street' ? L(PRO.objHome) : h.floor < f ? L(PRO.objUp) : L(PRO.objDoor);
    text('★ ' + obj.replace('{a}', aptNo(this.heroApt)).replace('{f}', f), 6, 4, { col: '#f2c94c', size: 6 });
    if (this.phase === 'stairs') text(`${h.floor}${L(UI.floor)}`, 6, 20, { col: '#f4f3ee', shadow: '#0b0c10', size: 6 });
    const sw = textW(L(PRO.skip), 6) + 10;
    rect(W - sw - 3, 2, sw, 11, '#3a3946'); text(L(PRO.skip), W - 3 - sw / 2, 4, { col: '#c3c0cf', size: 6, align: 'center' });
    if (clickIn(W - sw - 3, 0, sw, 15) && !this.busy) { clicks.length = 0; this.finish(); }
  },
};
