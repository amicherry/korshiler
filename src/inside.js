/* ---------- «Подъезд изнутри»: со страницы дома видно, как ремонты изменили подъезд ---------- */
const INSIDE_ITEMS = ['light', 'walls', 'cameras', 'door', 'lift'];   // то, что видно внутри
scenes.inside = {
  enter() {
    this.fixed = new Set(HOUSE_STATE.fixed); this.floors = HOUSE.floors;
    const R = rng(hashStr(USER.userId) + 9), look = {};
    for (let apt = 1; apt <= HOUSE.floors * HOUSE.perFloor; apt++) look[apt] = pick(R, DOOR_STYLES);
    look[HOUSE.heroApt] = { col: '#2f6f62', kind: 'metal' };
    this.bg = drawStairwell(this.floors, a => look[a], this.fixed);
    const heroF = Math.ceil(HOUSE.heroApt / HOUSE.perFloor);
    this.camY = clamp(floorBase(heroF, this.floors) - 150, 0, this.bg.height - H); this.camX = 0; this.vy = 0; this.vx = 0; this.drag = null;
    setTouch({ up: true, down: true });
  },
  update(dt) {
    const k = dt / 16;
    if (keys.up) this.camY -= 4 * k; if (keys.down) this.camY += 4 * k;
    if (keys.left) this.camX -= 4 * k; if (keys.right) this.camX += 4 * k;
    // палец/мышь: тянем подъезд
    if (pointer.down && pointer.y > 20) { if (!this.drag) this.drag = { x: pointer.x, y: pointer.y, cx: this.camX, cy: this.camY };
      else { this.camY = this.drag.cy - (pointer.y - this.drag.y); this.camX = this.drag.cx - (pointer.x - this.drag.x); } }
    else this.drag = null;
    this.camY = clamp(this.camY, 0, this.bg.height - H); this.camX = clamp(this.camX, 0, SW - W);
    if (hit('back')) irisTo(W / 2, 120, () => go('house'));
  },
  draw(dt) {
    const cy = Math.round(this.camY), cx = Math.round(this.camX), t = performance.now(), light = this.fixed.has('light');
    rect(0, 0, W, H, '#0f1210');
    ctx.save(); ctx.translate(-cx, 0); ctx.drawImage(this.bg, 0, -cy);
    for (let f = 1; f <= this.floors; f++) { const b = floorBase(f, this.floors) - cy; if (b < -10 || b > H + 110) continue;
      for (const [li, lx] of [[0, 49], [1, 141], [2, 351], [3, 443]]) {
        const broken = !light && (f * 7 + li * 3) % 5 === 0, on = light || (!broken && Math.sin(t / 97 + f * 13 + li * 5) > -.75);
        rect(lx, b - 94, 1, 6, '#0e1011'); rect(lx - 5, b - 88, 11, 4, '#1c1f24'); rect(lx - 3, b - 85, 7, 3, on ? '#fff1b8' : '#4b4f4c');
        if (on) { if (!this.glow) this.glow = makeCanvas(220, 94, ({ g }) => { const gr = g.createRadialGradient(110, 10, 2, 110, 44, 110); gr.addColorStop(0, 'rgba(255,214,140,.30)'); gr.addColorStop(.5, 'rgba(255,190,110,.10)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, 220, 94); });
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = light ? 1 : .8; ctx.drawImage(this.glow, lx - 110, b - 94); ctx.restore(); } }
      text(`${f}`, cx + 6, b - 92, { col: 'rgba(244,243,238,.55)', size: 6 }); }
    ctx.restore();
    if (!light) { ctx.fillStyle = 'rgba(5,8,6,.28)'; ctx.fillRect(0, 0, W, H); }
    // верх: назад и название
    rect(0, 0, W, 19, '#0e111c'); rect(0, 19, W, 1, '#55607c');
    if (button(L(UI.back), 0, 1, 'dark', { left: 2 })) irisTo(W / 2, 120, () => go('house'));
    text(L(UI.insideT), W / 2, 6, { align: 'center', col: '#f4f3ee', size: 6 });
    // список: что уже сделано внутри
    const rows = INSIDE_ITEMS.map(id => PROBLEMS.find(p => p.id === id)).filter(Boolean);
    const pw = Math.max(...rows.map(p => textW(L(p.name), 6))) + 24, ph = rows.length * 10 + 18;
    frameBox(W - pw - 4, 24, pw, ph, .9); text(L(UI.insideDone), W - pw + 4, 29, { col: '#9fd9c2', size: 6 });
    rows.forEach((p, i) => { const ok = this.fixed.has(p.id), y = 40 + i * 10;
      rect(W - pw + 4, y + 1, 6, 6, ok ? '#4caf6e' : '#3a3f52'); if (ok) { rect(W - pw + 5, y + 4, 1, 1, '#0e111c'); rect(W - pw + 6, y + 5, 1, 1, '#0e111c'); rect(W - pw + 7, y + 2, 1, 3, '#0e111c'); }
      text(L(p.name), W - pw + 14, y, { col: ok ? '#f4f3ee' : '#8792ad', size: 6 }); });
    if (!isTouch) text(L(UI.insideHint), W / 2, H - 10, { align: 'center', col: 'rgba(244,243,238,.7)', size: 6 });
  },
};
