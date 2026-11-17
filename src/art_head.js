/* ============================================================
   ГРАФИКА: всё рисуется кодом в маленькие холсты-спрайты
   ============================================================ */
const OUT = '#1b1a21';
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, v));
  return '#' + ((1 << 24) | (c((n >> 16) + amt) << 16) | (c((n >> 8 & 255) + amt) << 8) | c((n & 255) + amt)).toString(16).slice(1);
}


/* Пиксельное облако как в классических пиксель-артах: плоское дно, ступенчатые «шапки»,
   светлая кромка сверху и тень снизу. Цвета приглушённые — облако не спорит с домами. */
const CLOUD_PAL = { body: '#55497c', light: '#65588c', shadow: '#483d6a', edge: '#4e4374' };
function pxCloud(r, R, cx, cy, w, pal = CLOUD_PAL) {
  const bumps = []; for (let x = 0; x < w;) { const bw = (12 + R() * 14) * Math.max(1, w / 90); bumps.push([x + bw / 2, bw / 2, bw * (.5 + R() * .35)]); x += bw * .5; }
  const x0 = Math.round(cx - w / 2), cols = [];
  for (let i = 0; i < w; i += 2) { let h = 0, top = null;
    for (const b of bumps) { const d = (i + 1 - b[0]) / b[1]; if (Math.abs(d) < 1) { const v = b[2] * Math.sqrt(1 - d * d); if (v > h) { h = v; top = b; } } }
    h = Math.round(h * Math.pow(Math.sin(Math.PI * (i + 1) / w), .4) / 2) * 2; cols.push([i, h, top]); }
  for (const [i, h, b] of cols) { if (h < 2) continue; const x = x0 + i;
    r(x, cy - h, 2, h, pal.body);
    if (b && i + 1 < b[0]) r(x, cy - h, 2, 2, pal.light); else r(x, cy - h, 2, 1, pal.edge);   // свет на левой стороне «шапки»
    if (b && i + 1 > b[0] + b[1] * .45 && h > 6) r(x, cy - h + 2, 2, Math.min(4, h - 4), pal.edge); // мягкая тень на правой стороне
    r(x, cy - 3, 2, 3, pal.shadow); }
  r(x0 + 6, cy, Math.max(0, w - 12), 1, pal.edge);
}

/* Пиксельная крона: клетки 2×2 внутри неровного овала, свет сверху-слева, тень снизу-справа. */
const AUTUMN = ['#6e3024', '#9a4428', '#c4622f', '#e8913a'];
function pxCrown(r, R, cx, cy, rx, ry, pal = AUTUMN) {
  for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) {
    const d = (x / rx) ** 2 + (y / ry) ** 2 + (R() - .5) * .3; if (d > 1) continue;
    const l = (-x / rx * .45 - y / ry * .75) + (R() - .5) * .55 - d * .3;
    r(Math.round(cx + x), Math.round(cy + y), 2, 2, pal[l > .35 ? 3 : l > -.15 ? 2 : l > -.6 ? 1 : 0]);
  }
}
