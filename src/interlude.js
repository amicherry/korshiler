/* ============================================================
   ЗАСТАВКА перед туром (один раз): между 1 и 2 — «5 дней» (объявление о собрании,
   жильцы ходят на работу, лифт стоит); дальше — «прошло 6 месяцев», перед 7 — «прошло 2 года».
   В конце — квиз перед собранием (можно пропустить).
   ============================================================ */
const DAY_TINT = [['rgba(255,170,110,.20)', 'screen'], ['rgba(170,215,255,.30)', 'screen'], ['rgba(20,24,60,.0)', 'source-over']];
scenes.interlude = {
  enter(d) {
    this.T = TOURS[d.tour]; this.t = 0; this.walkers = []; this.spawn = 0; this.bubble = null;
    // 5 дней × (утро, день, вечер) — по 1,4 с на часть дня
    this.kind = this.T.n === 2 ? 'days' : this.T.n === 1 ? 'quiz' : this.T.n === 7 ? 'years' : 'months';
    this.phase = this.kind === 'quiz' ? 'offer' : 'show';
    setTouch(this.phase === 'show' ? { act: '▸▸' } : {});   // на телефоне пропуск — круглая кнопка, без длинной надписи
  },
  part() { return Math.floor(this.t / 1400); },   // 0…14
  update(dt) {
    this.t += dt;
    if (this.phase === 'show') {
      if (hit('act') || hit('back')) this.phase = 'offer';
      if (this.kind === 'days' && this.part() >= 15) this.phase = 'offer';
      if (this.kind !== 'days' && this.t > 5200) this.phase = 'offer';
      if (this.kind === 'days') this.updateYard(dt);
      if (this.phase === 'offer') setTouch({});
    }
  },
  // жильцы утром уходят на работу, вечером возвращаются; по пути говорят про собрание
  updateYard(dt) {
    const p = this.part() % 3;
    this.spawn -= dt;
    if (this.spawn <= 0 && p !== 1) { this.spawn = 700 + Math.random() * 700;
      const out = p === 0, look = varyLook(pick(Math.random, ['mom', 'dad', 'business', 'it', 'apa', 'teacher', 'night']), Math.random);
      this.walkers.push({ x: out ? STREET_DOOR_X : (Math.random() < .5 ? -10 : SWS + 10), to: out ? (Math.random() < .5 ? -20 : SWS + 20) : STREET_DOOR_X, look, t: 0 });
      if (Math.random() < .45) this.bubble = { w: this.walkers[this.walkers.length - 1], line: L(pick(Math.random, INTER_LINES)), t: 0 }; }
    for (const w of this.walkers) { const d = w.to - w.x; w.x += Math.sign(d) * Math.min(Math.abs(d), dt * .06); w.t += dt; w.done = Math.abs(d) < 1; }
    this.walkers = this.walkers.filter(w => !w.done);
    if (this.bubble) { this.bubble.t += dt; if (this.bubble.t > 2200 || !this.walkers.includes(this.bubble.w)) this.bubble = null; }
  },
  draw(dt) {
    const T = this.T;
    if (this.kind === 'days') {
      const cx = 150; drawStreet(dt, this.t, cx);
      ctx.save(); ctx.translate(-cx, 0);
      // объявление о собрании на двери подъезда
      rect(295, 80, 12, 14, '#f4f3ee'); rect(296, 82, 10, 1, '#b8443f'); for (let i = 0; i < 4; i++) rect(296, 85 + i * 2, 8 - (i % 2) * 3, 1, '#7a7466');
      for (const w of this.walkers) sprite(personSprite(w.look, 'walk' + (Math.floor(w.t / 95) % 8)), Math.round(w.x) - 9, STREET_GROUND - PH, w.to < w.x);
      ctx.restore();
      drawStreetFront(cx);
      const p = this.part() % 3, tint = DAY_TINT[p];
      ctx.save(); ctx.globalCompositeOperation = tint[1]; rect(0, 0, W, H, tint[0]); ctx.restore();
      if (this.bubble) { const bx = clamp(this.bubble.w.x - cx, 60, W - 60), lines = wrapText(this.bubble.line, 110, 6).slice(0, 2);
        frameBox(bx - 60, STREET_GROUND - PH - 30, 120, 10 + lines.length * 8, .95); lines.forEach((l, i) => text(l, bx, STREET_GROUND - PH - 25 + i * 8, { align: 'center', col: '#f4f3ee', size: 6 })); }
      const day = Math.min(5, Math.floor(this.part() / 3) + 1);
      rect(0, 0, W, 22, 'rgba(14,17,28,.85)');
      text(`${L(UI.day)} ${day}/5 · ${L([UI.morning, UI.noon, UI.evening][p])}`, 8, 4, { col: '#f2c94c', size: 6 });
      text(L(UI.notice5), 8, 13, { col: '#cfd6e4', size: 6 });
      text(L(UI.liftStill), W - 26, 4, { col: '#e88a7a', size: 6, align: 'right' });
    } else {
      drawHouseMap(this.t, null);
      rect(0, 0, W, H, 'rgba(10,12,20,.55)');
      // календарь: листы улетают
      const n = this.kind === 'years' ? 24 : 6, k = Math.min(n, Math.floor(this.t / (4200 / n)));
      const ttl = L(this.kind === 'years' ? UI.twoYears : UI.sixMonths), pw = Math.max(100, textW(ttl) + 24);   // лист шире надписи
      paper(Math.round(W / 2 - pw / 2), 40, pw, 70, 5); text(ttl, W / 2, 50, { align: 'center', col: INK_RED });
      text(String(k), W / 2, 70, { align: 'center', col: INK, size: 16 }); text(L(this.kind === 'years' ? UI.monthsWord : UI.monthsWord), W / 2, 94, { align: 'center', col: INK_MUTED, size: 6 });
      // бюджет полугодия: пришёл после прошлой победы
      const prev = LEVELS[T.n - 2], inc = prev ? prev.income : 0;
      if (inc) text(L(UI.budgetCame).replace('{m}', money(inc)), W / 2, 122, { align: 'center', col: '#f2c94c', size: 6 });
      if (this.kind === 'years') text(L(UI.savingsRoof), W / 2, 134, { align: 'center', col: '#9fd9c2', size: 6 });
      text(`${L(UI.budget)} ${money(HOUSE_STATE.coins)}`, W / 2, 146, { align: 'center', col: '#f4f3ee', size: 6 });
    }
    if (this.phase === 'show') { if (!isTouch && button(L(UI.skip), W, 200, 'dark')) this.phase = 'offer'; return; }   // ширина по тексту, прижата к правому краю
    // предложение: квиз перед собранием
    rect(0, 0, W, H, 'rgba(10,12,20,.55)'); frameBox(50, 40, 300, 146, .97);
    text(L(UI.meetingT).replace('{n}', T.n), W / 2, 50, { align: 'center', col: '#9fd9c2', size: 6 });
    wrapText(tourTitle(T), 280, 8).slice(0, 2).forEach((l, i) => text(l, W / 2, 62 + i * 11, { align: 'center', col: '#f4f3ee' }));
    wrapText(ruleText(T), 280, 6).slice(0, 2).forEach((l, i) => text(l, W / 2, 88 + i * 8, { align: 'center', col: '#cfd6e4', size: 6 }));
    wrapText(L(T.n >= 2 ? UI.quizOfferBonus : UI.quizOffer), 270, 6).slice(0, 3).forEach((l, i) => text(l, W / 2, 110 + i * 8, { align: 'center', col: '#f2c94c', size: 6 }));
    const done = () => { SAVE.inter = SAVE.inter || {}; SAVE.inter[T.id] = true; persist(); };
    if (button(L(UI.quizGo), W / 2 - 70, 152, 'primary', { w: 128 })) { done(); irisTo(W / 2, 120, () => go('quiz', { tour: T.id, then: T.id })); }
    if (button(L(UI.toMeeting), W / 2 + 70, 152, 'alt', { w: 128 })) { done(); irisTo(W / 2, 120, () => go('tour', { tour: T.id, skipInter: true })); }
  },
};
