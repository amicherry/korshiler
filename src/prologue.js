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
// детская коляска: 20×18, смотрит влево (ручка справа)
const PRAM = makeCanvas(22, 18, ({ r, p }) => {
  r(2, 2, 14, 8, '#3f5e7a'); r(2, 2, 14, 1, '#5a7c98'); r(2, 2, 6, 6, '#2e4a62'); r(3, 3, 4, 4, '#4a6c88');   // капюшон и люлька
  r(1, 9, 17, 3, '#2b2a33'); r(16, 2, 1, 8, '#2b2a33'); r(16, 1, 5, 1, '#2b2a33'); r(20, 0, 2, 2, '#2b2a33'); // ручка
  for (const x of [4, 14]) { r(x - 3, 12, 6, 6, '#1b1a21'); r(x - 2, 13, 4, 4, '#55595f'); p(x - 1, 14, '#8a8e96'); }
});

scenes.prologue = {
  enter() {
    this.t = 0; this.phase = 'street'; this.done = {}; this.busy = false; this.plan = null;
    this.hx = -12; this.dir = 1; this.moving = false; this.walkT = 0; this.stepAcc = 0;
    this.floors = HOUSE.floors; this.heroApt = HOUSE.heroApt;
    this.homeFloor = Math.ceil(this.heroApt / HOUSE.perFloor); this.homeX = DOOR_X[(this.heroApt - 1) % HOUSE.perFloor];
    this.npcs = PRO_NPC.map(n => ({ ...n, look: Object.assign({}, ARCH[n.arch].look), done: false, gone: 0 }));
    setTouch({ move: true });
  },
  focus() { return this.phase === 'stairs' ? { x: this.h.x - this.camX, y: this.h.y - this.camY - 14 } : { x: (this.phase === 'flat' ? this.fx : this.hx), y: 150 }; },
  base(f) { return floorBase(f, this.floors); },
  // реплика героя / соседа
  async talk(name, look, keys, expr = 'neutral', voice = 420) {
    dlgOpen(name, e => portrait(look, e), voice);
    for (const k of keys) await say(typeof k === 'string' ? L(PRO[k]) : L(k), expr);
    dlgClose();
  },
  think(k, expr = 'sad') { return this.talk(SAVE.name, SAVE.look, [k], expr); },
  finish() {
    SAVE.seenIntro = true; persist(); this.busy = true; dlgClose(); setTouch({});
    irisTo(W / 2, 140, () => go('tour', { tour: 'L1' }));
  },

  /* ---------- двор ---------- */
  updateStreet(dt) {
    let dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (dir) this.plan = null;
    if (!dir && this.plan != null) { if (Math.abs(this.plan - this.hx) > 1) dir = Math.sign(this.plan - this.hx); else this.plan = null; }
    this.moving = !!dir;
    if (dir) { this.dir = dir; this.hx = clamp(this.hx + dir * dt * .07, -12, W - 10); this.walkT += dt; this.stepAcc += dt; if (this.stepAcc > 240) { this.stepAcc = 0; sfx.step(); } }
    const atDoor = Math.abs(this.hx - STREET_DOOR_X) < 10;
    setTouch({ act: atDoor ? L(PRO.enter) : null, move: true });
    if (atDoor && (hit('act') || (this.plan == null && this.tapDoor))) this.enterHouse();
    const c = clicks.find(c => c.y > 16); if (c) { clicks.splice(clicks.indexOf(c), 1); this.plan = clamp(c.x, -12, W - 10); this.tapDoor = Math.abs(c.x - STREET_DOOR_X) < 14; sfx.select(); }
  },
  async enterHouse() {
    if (this.busy) return; this.busy = true; this.moving = false; this.plan = null;
    await this.think('door', 'angry');
    irisTo(STREET_DOOR_X, 150, () => this.toStairs());
  },
  toStairs() {
    this.phase = 'stairs'; this.busy = false;
    const R = rng(hashStr(USER.userId) + 9), look = {};
    for (let apt = 1; apt <= this.floors * HOUSE.perFloor; apt++) look[apt] = pick(R, DOOR_STYLES);
    look[this.heroApt] = { col: '#2f6f62', kind: 'metal' };
    this.bg = drawStairwell(this.floors, apt => look[apt], new Set());
    this.WH = this.bg.height;
    this.h = { x: 14, floor: 1, y: this.base(1), dir: 1, walkT: 0, moving: false, climb: null, jump: 0, slip: 0 };
    this.camY = clamp(this.h.y - 165, 0, this.WH - H); this.camX = 0;
    this.drops = [0, 400, 800].map(o => ({ t: o })); this.rat = null;
    irisFrom(this.h.x - this.camX, this.h.y - this.camY - 14);
  },

  /* ---------- подъезд ---------- */
  near(n) { const h = this.h; return !n.done && !n.gone && h.floor === n.floor && !h.climb && Math.abs(h.x - n.x) < 24; },
  updateStairs(dt) {
    const h = this.h;
    // крыса бежит навстречу, герой подпрыгивает
    if (this.rat) { const r = this.rat; r.t += dt; r.x -= dt * .2;
      if (!r.jumped && r.x - h.x < 22) { r.jumped = true; h.jump = 1; beep(740, .05, 'square', .05); beep(990, .07, 'square', .05, .06); }
      if (r.x < RAT_HOLES[0] + 2) { this.rat = null; this.afterRat(); } }
    if (h.jump) { h.jump += dt; if (h.jump > 480) h.jump = 0; }
    if (h.slip) { h.slip += dt; if (h.slip < 320) h.x += dt * .08; if (h.slip > 1500) { h.slip = 0; this.afterSlip(); } }
    for (const n of this.npcs) if (n.gone) n.gone += dt;
    if (this.busy || h.jump || h.slip || this.rat) {
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
    if (h.floor === 1 && !this.done.slip && this.done.rat && Math.abs(h.x - (PRO_PUD - 8)) < 4 && h.dir > 0) { this.done.slip = true; this.plan = null; h.slip = 1; sfx.no(); }
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
      dlgOpen(n.name, e => portrait(n.look, e), ARCH[n.arch].voice);
      const c = await ask([{ label: L(PRO.momHelp) }, { label: L(PRO.momBye) }]);
      if (c === 0) { dlgClose(); await this.talk(SAVE.name, SAVE.look, ['momHero'], 'happy');
        await this.talk(n.name, n.look, ['momThx'], 'happy', ARCH[n.arch].voice); SAVE.helpedMom = true; SAVE.trust = SAVE.trust || {}; for (let d = 1; d <= HOUSE.perFloor; d++) { const a = 8 * HOUSE.perFloor + d; SAVE.trust[a] = (SAVE.trust[a] || 0) + 5; } n.gone = 1; }
      else { await say(L(PRO.momSad), 'sad'); dlgClose(); }
    }
    n.done = true; this.busy = false;
  },
  async enterFlat() {
    if (this.busy) return; this.busy = true; sfx.door();
    irisTo(this.homeX - this.camX, this.h.y - this.camY - 20, () => { this.phase = 'flat'; this.fx = 374; this.fgoal = 250; this.flatTalk = false; irisFrom(374, 150); });
  },
  updateCam(dt) {
    const h = this.h, target = clamp(h.y - (DLG.open ? DLG_BOX.y - 6 : 165), 0, this.WH - H);
    this.camY = lerp(this.camY, target, Math.min(1, dt / 160));
    const sx = h.x - this.camX; let tx = this.camX;
    if (sx < 120) tx = h.x - 120; else if (sx > 280) tx = h.x - 280;
    this.camX = lerp(this.camX, clamp(tx, 0, SW - W), Math.min(1, dt / 200));
  },

  /* ---------- квартира ---------- */
  updateFlat(dt) {
    const d = this.fgoal - this.fx;
    if (Math.abs(d) > .5) { this.fx += Math.sign(d) * Math.min(Math.abs(d), dt * .06); this.moving = true; this.walkT += dt; }
    else { this.moving = false; if (!this.flatTalk) { this.flatTalk = true; this.flatMonologue(); } }
  },
  async flatMonologue() {
    await wait(300);
    dlgOpen(SAVE.name, e => portrait(SAVE.look, e), 420);
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
    drawStreet(dt, this.t);
    sprite(personSprite(SAVE.look, this.heroFrame(this.moving, this.walkT)), Math.round(this.hx) - 9, STREET_GROUND - PH, this.dir < 0);
    drawStreetFront();
    if (!this.busy && Math.abs(this.hx - STREET_DOOR_X) < 10 && Math.floor(this.t / 400) % 2) text(isTouch ? '▼' : 'E', STREET_DOOR_X, STREET_GROUND - PH - 14, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' });
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
    // крыса
    if (this.rat) sprite(RAT[Math.floor(this.rat.t / 60) % 2], Math.round(this.rat.x - 6), this.base(1) - cy - 5);
    // соседи
    for (const n of this.npcs) {
      if (n.gone > 1400) continue;
      const nb = this.base(n.floor) - cy; if (nb < -60 || nb > H + 60) continue;
      const leaving = n.gone > 0, nx = n.x + (leaving ? -n.gone * .05 : 0);
      if (n.pram) sprite(PRAM, Math.round(nx - 30 + (leaving ? 0 : 0)), nb - 18);
      const fr = leaving ? 'walk' + (Math.floor(n.gone / 95) % 8) : 'idle' + (Math.floor(t / 600) % 2);
      ctx.globalAlpha = leaving ? clamp(1 - (n.gone - 900) / 500, 0, 1) : 1;
      sprite(personSprite(n.look, fr), Math.round(nx) - 9, nb - PH, leaving || h.x < n.x);
      ctx.globalAlpha = 1;
      if (!n.done && !leaving && Math.floor(t / 400) % 2) text('!', nx, nb - PH - 12, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' });
    }
    // герой: прыжок от крысы, падение на луже
    const img = personSprite(Object.assign({ blink: Math.floor(t / 2600) % 3 === 0 }, SAVE.look), h.climb ? 'climb' + (Math.floor(h.walkT / 260) % 4) : h.slip || h.jump ? 'idle0' : this.heroFrame(h.moving, h.walkT));
    const hy = h.y - cy;
    if (h.slip) {
      const s = h.slip, a = s < 320 ? -s / 320 * Math.PI / 2 : s < 1100 ? -Math.PI / 2 : -Math.PI / 2 * (1 - (s - 1100) / 400);
      ctx.save(); ctx.translate(Math.round(h.x), Math.round(hy - 9 * Math.abs(Math.sin(a)))); ctx.rotate(a); ctx.drawImage(img, -9, -PH); ctx.restore();
      if (s > 300 && s < 1100) for (let i = 0; i < 3; i++) text('*', h.x - 30 + i * 8 + Math.sin(t / 120 + i) * 2, hy - 22 - (i % 2) * 4, { col: '#f2c94c', size: 6 });
    } else {
      const jy = h.jump ? Math.round(Math.sin(h.jump / 480 * Math.PI) * 18) : 0;
      sprite(img, Math.round(h.x) - 9, Math.round(hy - PH - jy), h.dir < 0);
      if (h.jump && h.jump < 300) text('!', h.x, hy - PH - jy - 12, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' });
    }
    // подсказки
    if (!this.busy && !h.climb && !h.slip && !this.rat) {
      if (Math.abs(h.x - STAIR_FOOT) < 10) text((h.floor < this.floors ? '▲' : '') + (h.floor > 1 ? '▼' : ''), STAIR_FOOT - 14, hy - 56, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' });
      if (h.floor === this.homeFloor && Math.abs(h.x - this.homeX) < 14 && Math.floor(t / 400) % 2) text(isTouch ? '▼' : 'E', this.homeX, hy - 86, { col: '#f2c94c', align: 'center', shadow: '#0b0c10' });
    }
    if (h.floor === this.homeFloor || (h.climb && h.climb.to === this.homeFloor)) { const b = this.base(this.homeFloor) - cy; sprite(ICONS.me, this.homeX + 9, b - 61); }
    ctx.restore();
    drawPops(dt, cx, cy);
  },
  drawFlat(dt) {
    if (!this.room) this.room = makeCanvas(W, H, ({ r, p, g }) => {
      const R = rng(53);
      r(0, 0, W, H, '#2a2230');
      // обои с мелким узором
      r(0, 0, W, 178, '#6b5d52'); for (let y = 6; y < 176; y += 12) for (let x = (y / 12 % 2) * 8; x < W; x += 16) { p(x, y, '#7a6b5e'); p(x + 1, y + 1, '#5e5148'); }
      r(0, 0, W, 6, '#4a3f38'); r(0, 170, W, 8, '#4a3a2e'); r(0, 170, W, 1, '#6a5444');
      // пол — доски
      r(0, 178, W, H - 178, '#5a3f2e'); for (let y = 182; y < H; y += 7) r(0, y, W, 1, '#4a3324'); for (let i = 0; i < 26; i++) r(R() * W, 179 + Math.floor(R() * 6) * 7, 1, 6, '#4a3324');
      // ковёр на стене над диваном
      r(22, 46, 120, 78, '#7a2a2a'); r(26, 50, 112, 70, '#9a3a32'); r(32, 56, 100, 58, '#7a2a2a');
      for (let i = 0; i < 5; i++) { const cx = 46 + i * 18, cy = 85; for (let k = 0; k < 7; k++) { p(cx + k, cy - k, '#e0b04a'); p(cx - k, cy - k, '#e0b04a'); p(cx + k, cy + k, '#e0b04a'); p(cx - k, cy + k, '#e0b04a'); } r(cx - 1, cy - 1, 3, 3, '#2e5a7a'); }
      for (let x = 24; x < 140; x += 4) { p(x, 124, '#d8c8a0'); p(x + 1, 125, '#d8c8a0'); }
      // диван
      r(18, 134, 130, 30, '#3f5e5a'); r(18, 134, 130, 2, '#5a7c76'); r(12, 128, 12, 42, '#34504c'); r(142, 128, 12, 42, '#34504c'); r(20, 160, 126, 10, '#2e4744');
      r(30, 142, 30, 16, '#4a6c66'); r(66, 142, 30, 16, '#4a6c66'); r(14, 170, 4, 8, '#1b1a21'); r(148, 170, 4, 8, '#1b1a21');
      // окно с ночным двором
      r(232, 40, 100, 84, '#3a3238'); r(236, 44, 92, 76, '#1c2238');
      for (let y = 44; y < 120; y++) r(236, y, 92, 1, `rgb(${24 + (y - 44) * .4 | 0},${30 + (y - 44) * .5 | 0},${56 + (y - 44) * .6 | 0})`);
      for (let i = 0; i < 10; i++) p(240 + R() * 84, 48 + R() * 16, '#9aa8c8');
      for (const [bx, bw, bt] of [[238, 36, 70], [280, 46, 62]]) { r(bx, bt, bw, 120 - bt, '#262d38'); for (let y = bt + 4; y < 116; y += 6) for (let x = bx + 3; x < bx + bw - 3; x += 5) r(x, y, 3, 3, R() < .3 ? '#e8b860' : '#1c222c'); }
      r(280, 44, 4, 76, '#3a3238'); r(236, 80, 92, 3, '#3a3238'); r(228, 122, 108, 5, '#d8d2bf'); r(228, 122, 108, 1, '#f0ead6');
      r(238, 128, 88, 10, '#7a7466'); for (let x = 240; x < 326; x += 4) r(x, 129, 2, 8, '#8a8476');        // батарея
      // стол, чайник, кружка
      r(200, 146, 70, 4, '#6a4a32'); r(204, 150, 4, 28, '#4a3324'); r(262, 150, 4, 28, '#4a3324');
      r(214, 132, 14, 14, '#c9c3b0'); r(216, 130, 10, 3, '#a8a290'); r(228, 136, 4, 4, '#c9c3b0'); r(211, 135, 3, 6, '#a8a290');
      r(242, 138, 8, 8, '#b8443f'); r(250, 140, 2, 4, '#b8443f');
      // календарь и часы
      r(170, 100, 26, 32, '#efe8d6'); r(170, 100, 26, 7, '#b8443f'); for (let y = 110; y < 130; y += 4) for (let x = 172; x < 194; x += 4) p(x, y, '#8a8472');
      r(352, 50, 18, 18, '#efe8d6'); r(353, 51, 16, 16, '#f4f3ee'); r(360, 53, 1, 7, '#2b2a33'); r(360, 59, 5, 1, '#2b2a33');
      // дверь, через которую вошли
      r(354, 82, 40, 96, '#2f6f62'); r(358, 86, 32, 88, '#357a6c'); r(384, 128, 3, 8, '#c9a95a');
    });
    const FY = -44; rect(0, 0, W, H, '#5a3f2e'); for (let y = 186; y < H; y += 7) rect(0, y, W, 1, '#4a3324');
    ctx.save(); ctx.translate(0, FY); sprite(this.room, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(190, 68, 2, 190, 130, 160); gr.addColorStop(0, 'rgba(255,214,140,.28)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.restore();
    rect(189, 0, 2, 60, '#1b1a21'); rect(180, 60, 20, 6, '#c9a95a'); rect(184, 66, 12, 2, '#fff1b8');
    // пар над чайником
    for (let i = 0; i < 3; i++) { const k = ((this.t / 900 + i / 3) % 1); ctx.globalAlpha = .5 * (1 - k); rect(220 + Math.sin(k * 6 + i) * 3, 128 - k * 22, 2, 2, '#e8e8e8'); } ctx.globalAlpha = 1;
    sprite(personSprite(SAVE.look, this.heroFrame(this.moving, this.walkT)), Math.round(this.fx) - 9, 178 - PH, this.fgoal < this.fx);
    ctx.restore();
  },
  drawTop() {
    if (this.phase === 'flat') return;
    rect(0, 0, W, 15, 'rgba(14,17,28,.88)'); rect(0, 15, W, 1, '#55607c');
    const h = this.h, f = this.homeFloor;
    const obj = this.phase === 'street' ? L(PRO.objHome) : h.floor < f ? L(PRO.objUp) : L(PRO.objDoor);
    text('★ ' + obj.replace('{a}', this.heroApt).replace('{f}', f), 6, 4, { col: '#f2c94c', size: 6 });
    if (this.phase === 'stairs') text(`${h.floor}${L(UI.floor)}`, 6, 20, { col: '#f4f3ee', shadow: '#0b0c10', size: 6 });
    const sw = textW(L(PRO.skip), 6) + 10;
    rect(W - sw - 3, 2, sw, 11, '#3a3946'); text(L(PRO.skip), W - 3 - sw / 2, 4, { col: '#c3c0cf', size: 6, align: 'center' });
    if (clickIn(W - sw - 3, 0, sw, 15) && !this.busy) { clicks.length = 0; this.finish(); }
  },
};
