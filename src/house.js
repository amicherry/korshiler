/* ============================================================
   КАРТА ЖК — главный экран между собраниями.
   Весь дом и двор на одной картинке. Каждая проблема и украшение
   рисуются в двух состояниях: «до» и «после ремонта»; покупка
   запускает анимацию установки, и изменение остаётся навсегда.
   ============================================================ */
let HOUSE_STATE = { fixed: [], decor: [], won: [], coins: 0, score: 0, bonus: 0, claimable: false };
const has = id => HOUSE_STATE.fixed.includes(id) || HOUSE_STATE.decor.includes(id);
function levelInfo(i) {
  const p = PROBLEMS[i], L = LEVELS[i];
  return { p, L, fixed: HOUSE_STATE.fixed.includes(p.id), won: HOUSE_STATE.won.includes(L.id), open: i === 0 || HOUSE_STATE.fixed.includes(PROBLEMS[i - 1].id) };
}

// геометрия дома на карте
const HM = { x0: 120, x1: 280, top: 46, fh: 15, floors: 9, ground: 186 };
HM.bottom = HM.top + HM.fh * HM.floors;   // 181
const HSPOT = {   // где на карте каждая вещь (для подсветки и нажатия)
  light: [200, 112, 20, 120], door: [200, 172, 22, 16], roof: [150, 50, 60, 16], basement: [150, 185, 50, 8],
  playground: [346, 206, 80, 30], lift: [200, 34, 30, 14], antenna: [268, 30, 22, 24], sign: [200, 16, 140, 14],
  bench: [240, 196, 30, 12], flowers: [252, 186, 50, 6], trees: [52, 170, 90, 50], lamps: [104, 172, 16, 40], parking: [48, 212, 80, 18],
};

const HOUSE_ART = { built: false };
function buildHouseArt() {
  const R = rng(5);
  HOUSE_ART.bg = makeCanvas(W, H, ({ r, p }) => {
    for (let y = 0; y < H; y++) { const k = y / H; r(0, y, W, 1, `rgb(${22 + k * 40 | 0},${32 + k * 40 | 0},${62 + k * 40 | 0})`); }
    for (let y = 130; y < 190; y++) r(0, y, W, 1, `rgba(220,130,90,${((y - 130) / 60 * .25).toFixed(3)})`);
    for (let i = 0; i < 50; i++) p(R() * W, R() * 100, R() < .2 ? '#f4f3ee' : '#9fb0cc');
    // дальние дома
    let x = -4; while (x < W) { const w = 14 + R() * 26, h = 20 + R() * 50; r(x, 186 - h, w, h, '#26304a'); for (let yy = 190 - h; yy < 182; yy += 5) for (let xx = x + 2; xx < x + w - 2; xx += 4) if (R() < .12) r(xx, yy, 2, 2, '#c9a65e'); x += w + 2; }
    // земля: тротуар и двор
    r(0, HM.ground, W, H - HM.ground, '#3a4258'); r(0, HM.ground, W, 6, '#565f78'); r(0, HM.ground, W, 1, '#7a84a0');
    for (let i = 0; i < 120; i++) p(R() * W, HM.ground + 7 + R() * 30, pick(R, ['#323a50', '#444d66']));
    // дом: фасад, швы панелей, балконные плиты
    const { x0, x1, top, fh, floors } = HM;
    r(x0, top, x1 - x0, HM.bottom - top + 5, '#5d6884'); r(x0, top, 2, HM.bottom - top + 5, '#7682a0'); r(x1 - 2, top, 2, HM.bottom - top + 5, '#4a5470');
    r(176, top, 48, HM.bottom - top + 5, '#56607c');                              // лестничная клетка
    for (let f = 0; f <= floors; f++) { const y = top + f * fh; r(x0, y, x1 - x0, 1, '#4c5570'); }
    for (const sx of [148, 176, 224, 252]) r(sx, top, 1, HM.bottom - top, '#4c5570');
    r(x0 - 2, top - 4, x1 - x0 + 4, 4, '#3b4460');                                  // парапет
    r(x0, HM.bottom, x1 - x0, 5, '#3a4152');                                       // цоколь
    // козырёк подъезда
    r(184, 166, 32, 3, '#7a84a0'); r(184, 169, 32, 1, '#2c3346');
  });
  // окна квартир: свет то загорается, то гаснет
  HOUSE_ART.win = [];
  for (let f = 0; f < HM.floors; f++) for (const wx of [126, 142, 158, 230, 246, 262]) HOUSE_ART.win.push({ x: wx, y: HM.top + f * HM.fh + 4, on: R() < .4, warm: pick(R, ['#f2c66a', '#f7e3a1', '#e8a85a']) });
  // тарелки жильцов на балконах (пока нет общей антенны)
  HOUSE_ART.dishes = Array.from({ length: 7 }, () => ({ x: pick(R, [126, 142, 158, 230, 246, 262]) + 8, y: HM.top + Math.floor(R() * 9) * HM.fh + 2 }));
  HOUSE_ART.built = true;
}

// одна вещь в состоянии k: 0 — сломано/нет, 1 — отремонтировано. Между ними — анимация установки
function drawHouseItem(id, k, t) {
  const A = (a, f) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, a); f(); ctx.restore(); };
  switch (id) {
    case 'light': {   // окна лестницы: до — тёмные и мигают, после — зажигаются этаж за этажом снизу вверх
      for (let f = 0; f < HM.floors; f++) { const y = HM.bottom - (f + 1) * HM.fh + 3, lit = k >= (f + 1) / HM.floors, flick = Math.sin(t / 90 + f * 7) > .6 && f % 3 === 1;
        rect(196, y, 8, 10, lit ? '#f4e6a8' : flick ? '#8a8a66' : '#1f2538'); if (lit) A(.25, () => rect(193, y - 2, 14, 14, '#ffe9a8')); }
      break; }
    case 'door': {    // дверь подъезда: до — висит криво, после — новая с домофоном
      A(1 - k, () => { rect(193, 171, 14, 10, '#141821'); rect(194, 172, 6, 9, '#3a4256'); rect(201, 173, 5, 8, '#3a4256'); rect(202, 172, 1, 1, '#c45a4a'); });
      A(k, () => { rect(193, 171, 14, 10, '#2c3e50'); rect(194, 172, 12, 9, '#3f5a72'); rect(199, 172, 1, 9, '#2c3e50'); rect(208, 173, 3, 4, '#1b1f27'); rect(209, 174, 1, 1, Math.sin(t / 300) > 0 ? '#7fe08a' : '#3c7a46'); });
      break; }
    case 'roof': {    // крыша: до — ржавые потёки по верхним этажам, после — новая кровля
      A(1 - k, () => { for (const [x, l] of [[130, 22], [164, 14], [236, 26], [270, 18]]) { rect(x, HM.top, 2, l, 'rgba(110,80,40,.7)'); rect(x - 1, HM.top, 4, 3, 'rgba(110,80,40,.6)'); } });
      A(k, () => { rect(HM.x0 - 2, HM.top - 4, HM.x1 - HM.x0 + 4, 2, '#b8c2d6'); rect(HM.x0 - 2, HM.top - 4, (HM.x1 - HM.x0 + 4) * Math.min(1, k * 1.2), 1, '#e6ecf5'); });
      break; }
    case 'basement': {   // подвал: до — бегают крысы, лужа; после — решётки на продухах
      for (const vx of [134, 160, 240, 266]) { rect(vx, 182, 8, 3, '#0b0d12'); A(k, () => { for (let i = 0; i < 4; i++) rect(vx + 1 + i * 2, 182, 1, 3, '#8792ad'); }); }
      A(1 - k, () => { rect(244, 186, 20, 2, '#3d5a7a'); for (let i = 0; i < 2; i++) { const rx = 120 + ((t / 18 + i * 130) % 180); rect(rx, 184, 4, 2, '#5b5f66'); rect(rx + 4, 185, 2, 1, '#5b5f66'); } });
      break; }
    case 'playground': {   // площадка: до — ржавая рама одних качелей, после — горка, качели, песочница
      A(1 - k, () => { rect(312, 196, 1, 18, '#7a4a36'); rect(340, 196, 1, 18, '#7a4a36'); rect(312, 196, 29, 1, '#7a4a36'); rect(322, 197, 1, 9, '#5b5f66'); rect(366, 210, 10, 4, '#2a2a2a'); });
      const s = k < 1 ? Math.max(0, Math.min(1, k * 1.4)) : 1, bounce = k < 1 ? 1 + Math.sin(k * Math.PI) * .15 : 1;
      A(s, () => {
        ctx.save(); ctx.translate(346, 214); ctx.scale(bounce, bounce); ctx.translate(-346, -214);
        rect(304, 214, 86, 2, '#c9b07a');                                         // бортик
        rect(308, 196, 2, 18, '#e05a4a'); rect(334, 196, 2, 18, '#e05a4a'); rect(308, 195, 28, 2, '#f2c94c');   // качели
        const sw = Math.sin(t / 400) * 3; rect(318 + sw, 197, 1, 10, '#cfd6e4'); rect(326 + sw, 197, 1, 10, '#cfd6e4'); rect(316 + sw, 207, 12, 2, '#4c9a84');
        rect(350, 200, 2, 14, '#3f6f8c'); rect(350, 199, 10, 2, '#3f6f8c'); for (let i = 0; i < 12; i++) rect(358 + i, 201 + i, 3, 2, '#f2c94c');   // горка
        rect(372, 208, 16, 6, '#e8d39a'); rect(372, 208, 16, 1, '#c45a4a');                                                                       // песочница
        ctx.restore();
      });
      break; }
    case 'lift': {    // машинное помещение лифта на крыше: после ремонта горит окно и огонёк
      rect(186, 34, 28, 12, '#3b4460'); rect(186, 34, 28, 1, '#55607c');
      rect(196, 37, 8, 5, k > .5 ? '#f4e6a8' : '#1f2538'); if (k > .5 && Math.sin(t / 250) > 0) rect(212, 35, 1, 1, '#7fe08a');
      A(1 - k, () => { rect(190, 38, 3, 3, '#b8443f'); });
      break; }
    case 'antenna': {   // общая антенна: опускается сверху на тросе; тарелки с балконов исчезают
      A(1 - k, () => { for (const d of HOUSE_ART.dishes) { rect(d.x, d.y, 3, 4, '#c9cdd6'); rect(d.x - 1, d.y + 1, 1, 2, '#8792ad'); } });
      if (k > 0) { const y = 30 - (1 - Math.min(1, k * 1.3)) * 50;
        if (k < .8) rect(268, -10, 1, y + 10, '#8792ad');
        rect(268, y + 4, 1, 12, '#8792ad'); rect(264, y + 14, 9, 1, '#5d6884'); rect(262, y - 2, 4, 9, '#e6ecf5'); rect(263, y - 3, 5, 1, '#e6ecf5'); rect(265, y + 1, 3, 1, '#8792ad');
        if (k >= 1 && Math.sin(t / 300) > 0) rect(268, y + 3, 1, 1, '#ff4a3a'); }
      break; }
    case 'sign': {    // вывеска на крыше: до — почти вся тёмная, после — буквы загораются по очереди
      const s = signText(), x0 = 200 - Math.round(textW(s, 6) / 2);
      rect(x0 - 4, 10, textW(s, 6) + 8, 11, '#140b0d'); for (const px of [x0 + 10, 200, x0 + textW(s, 6) - 10]) rect(px, 21, 1, 21, '#1a1e2a');
      let acc = 0; [...s].forEach((ch, i) => {
        const on = k >= (i + 1) / s.length || (k === 0 && i % 4 === 1 && Math.sin(t / 130 + i) > -.3);
        text(ch, x0 + acc, 12, { size: 6, col: on ? '#ff6a45' : '#3c1714' }); acc += textW(ch, 6); });
      if (k >= 1) A(.25 + .05 * Math.sin(t / 140), () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; rect(x0 - 6, 8, textW(s, 6) + 12, 15, '#ff4a30'); ctx.restore(); });
      break; }
    case 'bench': A(k, () => { for (const bx of [228, 252]) { rect(bx, 193, 14, 2, '#8a5a3a'); rect(bx, 190, 14, 1, '#8a5a3a'); rect(bx + 1, 195, 1, 3, '#2a2a2a'); rect(bx + 12, 195, 1, 3, '#2a2a2a'); } }); break;
    case 'flowers': A(k, () => { for (const fx of [126, 150, 228, 254]) { rect(fx, 186, 20, 3, '#4a3a2a'); for (let i = 0; i < 6; i++) rect(fx + 1 + i * 3, 184 + (i % 2), 2, 2, ['#e05a7a', '#f2c94c', '#f4f3ee'][i % 3]); } }); break;
    case 'trees': A(k, () => { for (const [tx, s] of [[22, 1], [58, 1.2], [92, .9]]) { const h = Math.round(22 * s * Math.min(1, k * 1.2));
      rect(tx, 200 - h, 2, h, '#5a3e2e'); ctx.fillStyle = '#3f7a52'; ctx.beginPath(); ctx.arc(tx + 1, 200 - h, 9 * s * Math.min(1, k * 1.2), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a9a66'; ctx.beginPath(); ctx.arc(tx - 2, 198 - h, 4 * s * Math.min(1, k * 1.2), 0, Math.PI * 2); ctx.fill(); } }); break;
    case 'lamps': A(k, () => { for (const lx of [104, 296]) { rect(lx, 160, 1, 32, '#1a1e28'); rect(lx - 3, 159, 7, 2, '#2a2f3c'); rect(lx - 2, 161, 5, 1, '#fff1b8');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .18; ctx.fillStyle = '#ffd890'; ctx.beginPath(); ctx.moveTo(lx - 2, 162); ctx.lineTo(lx + 3, 162); ctx.lineTo(lx + 14, 192); ctx.lineTo(lx - 13, 192); ctx.fill(); ctx.restore(); } }); break;
    case 'parking': A(k, () => { rect(8, 204, 84, 18, '#2a3142'); for (let i = 0; i <= 4; i++) rect(8 + i * 21, 204, 1, 18, '#cfd6e4');
      for (const [cx, col] of [[12, '#b8443f'], [54, '#3f6f8c']]) { rect(cx, 210, 16, 6, col); rect(cx + 3, 207, 10, 3, col); rect(cx + 4, 208, 3, 2, '#1b2030'); rect(cx + 8, 208, 4, 2, '#1b2030'); rect(cx + 2, 216, 3, 2, '#0d0f14'); rect(cx + 11, 216, 3, 2, '#0d0f14'); } }); break;
  }
}

function drawHouseMap(t, anim) {
  if (!HOUSE_ART.built) buildHouseArt();
  sprite(HOUSE_ART.bg, 0, 0);
  if (Math.random() < 1 / 40) { const w = pick(Math.random, HOUSE_ART.win); w.on = !w.on; }
  for (const w of HOUSE_ART.win) rect(w.x, w.y, 10, 8, w.on ? w.warm : '#1f2538');
  const ids = [...PROBLEMS.map(p => p.id), ...DECOR.map(d => d.id)];
  for (const id of ids) {
    let k = has(id) ? 1 : 0;
    if (anim && anim.id === id) k = Math.max(0, Math.min(1, (anim.t - 1300) / 1300));
    drawHouseItem(id, k, t);
  }
  // идёт ремонт: леса, рабочие, искры
  if (anim && anim.t < 2700) {
    const [cx, cy, w, h] = HSPOT[anim.id], a = Math.min(1, anim.t / 200) * (anim.t > 2300 ? (2700 - anim.t) / 400 : 1);
    ctx.save(); ctx.globalAlpha = a;
    rect(cx - w / 2 - 3, cy - h / 2 - 3, 1, h + 6, '#c9a95a'); rect(cx + w / 2 + 2, cy - h / 2 - 3, 1, h + 6, '#c9a95a');
    for (let yy = cy - h / 2 - 3; yy < cy + h / 2 + 3; yy += 6) rect(cx - w / 2 - 3, yy, w + 6, 1, 'rgba(201,169,90,.7)');
    for (let i = 0; i < 2; i++) { const wx = cx - w / 2 + ((anim.t / 12 + i * w / 2) % w), wy = cy + h / 2 - 1;
      rect(wx, wy - 7, 3, 4, '#f2a33a'); rect(wx, wy - 3, 3, 3, '#2c3e50'); rect(wx + 1, wy - 9, 2, 2, '#e3ad86'); rect(wx, wy - 10, 3, 1, '#f2c94c'); }
    for (let i = 0; i < 6; i++) { const ang = anim.t / 120 + i, d = (anim.t / 7 + i * 13) % 14; rect(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d * .6, 1, 1, i % 2 ? '#fff1b8' : '#f2c94c'); }
    ctx.restore();
  }
}

/* ---------- сцена «Мой ЖК» ---------- */
scenes.house = {
  enter(d) { this.t = 0; this.sel = null; this.anim = null; this.busy = false; setTouch({}); this.refresh(); if (d && d.focus) this.sel = d.focus; },
  refresh() { API.house().then(h => { HOUSE_STATE = h; SAVE.coins = h.coins; }).catch(() => {}); },
  // что можно сделать с вещью сейчас
  status(id) {
    const pi = PROBLEMS.findIndex(p => p.id === id);
    if (pi >= 0) { const I = levelInfo(pi);
      if (I.fixed) return { kind: 'done' };
      if (!I.open) return { kind: 'locked', text: L(UI.hNeedPrev) };
      if (!I.won) return { kind: 'vote', text: L(UI.hNeedVote).replace('{n}', I.L.n), level: I.L.id };
      return { kind: 'buy', cost: I.p.cost };
    }
    const d = DECOR.find(x => x.id === id);
    if (has(id)) return { kind: 'done' };
    if (HOUSE_STATE.fixed.length < d.after) return { kind: 'locked', text: L(UI.hDecorLock).replace('{n}', d.after) };
    return { kind: 'buy', cost: d.cost };
  },
  async buy(id) {
    if (this.busy) return; this.busy = true;
    try {
      const h = await API.buy(id);
      this.anim = { id, t: 0 }; this.sel = null; sfx.stamp();
      setTimeout(() => { HOUSE_STATE = h; SAVE.coins = h.coins; persist(); }, 1300);
      const p = PROBLEMS.find(x => x.id === id);
      setTimeout(() => { toast('E-KNOT', p ? L(UI.hFixedToast).replace('{p}', L(p.name)) : L(UI.hDecorToast), 3600); this.anim = null; }, 2800);
    } catch (e) { toast('E-KNOT', L(e.code === 'no_money' ? UI.hNoMoney : UI.netFail), 2600); }
    this.busy = false;
  },
  update(dt) {
    this.t += dt; if (this.anim) this.anim.t += dt;
    if (hit('back')) irisTo(W / 2, 120, () => go('title'));
  },
  draw(dt) {
    drawHouseMap(this.t, this.anim);
    // маркеры: «!» — можно действовать, замок — пока закрыто
    const ids = [...PROBLEMS.map(p => p.id), ...DECOR.map(d => d.id)];
    if (!this.anim) for (const id of ids) {
      const st = this.status(id), [cx, cy] = HSPOT[id]; if (st.kind === 'done') continue;
      const pulse = Math.floor(this.t / 350) % 2;
      if (st.kind === 'buy') { rect(cx - 5, cy - 5, 10, 10, HOUSE_STATE.coins >= st.cost ? (pulse ? '#f2c94c' : '#e0b03a') : '#8792ad'); text('!', cx, cy - 3, { align: 'center', col: '#1b1a21', size: 6 }); }
      else if (st.kind === 'vote') { rect(cx - 5, cy - 5, 10, 10, pulse ? '#7fc4a8' : '#5fa488'); text('?', cx, cy - 3, { align: 'center', col: '#1b1a21', size: 6 }); }
      else if (PROBLEMS.some(p => p.id === id)) { ctx.globalAlpha = .55; rect(cx - 3, cy - 2, 6, 5, '#55607c'); rect(cx - 2, cy - 5, 4, 3, '#55607c'); ctx.globalAlpha = 1; }
    }
    // верхняя панель
    rect(0, 0, W, 19, '#0e111c'); rect(0, 19, W, 1, '#55607c');
    text(`${L(UI.budget)} ₸${HOUSE_STATE.coins}`, 6, 5, { col: '#f2c94c' });
    text(`★${HOUSE_STATE.score}`, 128, 5, { col: '#9fd9c2' });
    if (button(L(UI.meetings), 0, 1, 'primary', { left: 176 })) irisTo(W / 2, 120, () => go('levels'));
    if (button(L(UI.menu), 0, 1, 'dark', { left: 344 })) irisTo(W / 2, 120, () => go('title'));
    if (HOUSE_STATE.claimable && button(`${L(UI.bonusDay)} +${HOUSE_STATE.bonus}`, 0, 22, 'alt', { left: 6 }))
      API.claim().then(r => { HOUSE_STATE = r.house; toast('E-KNOT', L(r.reward.status === 'sent' ? UI.rRewardSent : UI.rRewardGuest).replace('{n}', r.reward.points), 3200); }).catch(() => {});
    // выбор вещи на карте
    if (!this.anim && !this.busy) {
      for (const id of ids) { const [cx, cy, w, h] = HSPOT[id]; if (clickIn(cx - w / 2 - 4, cy - h / 2 - 4, w + 8, h + 8) && this.status(id).kind !== 'done') { this.sel = this.sel === id ? null : id; sfx.select(); } }
    }
    if (this.sel && !this.anim) this.drawPanel(this.sel);
    else if (!this.anim) { rect(0, H - 13, W, 13, 'rgba(10,12,20,.75)'); text(L(UI.hHint), W / 2, H - 9, { align: 'center', col: '#cfd6e4', size: 6 }); }
  },
  drawPanel(id) {
    const p = PROBLEMS.find(x => x.id === id), d = DECOR.find(x => x.id === id), st = this.status(id);
    frameBox(8, 150, W - 16, 70, .95);
    text(L((p || d).name), 16, 157, { col: '#f4f3ee' });
    if (p) wrapText(L(p.desc), 230, 6).slice(0, 2).forEach((l, i) => text(l, 16, 170 + i * 9, { col: '#cfd6e4', size: 6 }));
    else text(L(UI.hDecorDesc).replace('{n}', d.pts), 16, 170, { col: '#cfd6e4', size: 6 });
    const bx = 318;
    if (st.kind === 'buy') {
      const ok = HOUSE_STATE.coins >= st.cost;
      text(`₸${st.cost}`, bx, 160, { align: 'center', col: ok ? '#f2c94c' : '#e88a7a' });
      if (button(ok ? L(UI.hFix) : L(UI.hEarn), bx, 178, ok ? 'primary' : 'alt', { w: 120 })) {
        if (ok) this.buy(id); else irisTo(W / 2, 120, () => go('levels'));
      }
      if (!ok) wrapText(L(UI.hNoMoneyHint), 200, 6).slice(0, 2).forEach((l, i) => text(l, 16, 196 + i * 9, { col: '#e88a7a', size: 6 }));
    } else if (st.kind === 'vote') {
      wrapText(st.text, 200, 6).slice(0, 2).forEach((l, i) => text(l, 16, 196 + i * 9, { col: '#9fd9c2', size: 6 }));
      if (button(L(UI.hGoVote), bx, 178, 'primary', { w: 120 })) irisTo(W / 2, 120, () => go('tour', { tour: st.level }));
    } else if (st.kind === 'locked') wrapText(st.text, 360, 6).slice(0, 2).forEach((l, i) => text(l, 16, 196 + i * 9, { col: '#8792ad', size: 6 }));
  },
};

/* ---------- список собраний ---------- */
scenes.levels = {
  enter() { setTouch({}); },
  update() { if (hit('back')) irisTo(W / 2, 120, () => go('house')); },
  draw(dt) {
    drawHouseMap(performance.now(), null);
    rect(0, 0, W, H, 'rgba(10,12,20,.55)');
    frameBox(20, 8, 360, 210, .95);
    text(L(UI.meetings), W / 2, 15, { align: 'center', col: '#f4f3ee' });
    text(`₸${HOUSE_STATE.coins}`, 370, 15, { align: 'right', col: '#f2c94c', size: 6 });
    PROBLEMS.forEach((_, i) => {
      const I = levelInfo(i), y = 28 + i * 20, x = 30;
      rect(x, y, 340, 19, I.open ? '#1d2130' : '#151822'); rect(x, y + 18, 340, 1, '#0a0c12');
      text(`${I.L.n}.`, x + 6, y + 6, { col: I.open ? '#f2c94c' : '#55607c', size: 6 });
      text(L(I.p.name), x + 22, y + 3, { col: I.open ? '#f4f3ee' : '#55607c', size: 6 });
      const info = !I.open ? L(UI.lvLocked) : `${L(UI.lvGoal).replace('{g}', I.L.goal)} · +₸${I.won ? I.L.reward.replay : I.L.reward.first}`;
      text(info, x + 22, y + 11, { col: I.open ? '#9fd9c2' : '#55607c', size: 6 });
      const mark = I.fixed ? '✓' : I.won ? '★' : '';
      if (mark) text(mark, x + 266, y + 6, { col: I.fixed ? '#7fc4a8' : '#f2c94c', size: 6, align: 'center' });
      if (I.open && button(L(UI.play2), x + 306, y + 2, I.won ? 'alt' : 'primary', { w: 60 })) irisTo(W / 2, 120, () => go('tour', { tour: I.L.id }));
    });
    if (button(L(UI.back), W / 2, 200, 'alt')) irisTo(W / 2, 120, () => go('house'));
  },
};
