// Только для теста: в песочнице нет шрифта Press Start 2P (у него каждый знак шириной 1em),
// поэтому растягиваем запасной моноширинный шрифт до той же ширины, чтобы проверить вёрстку.
(()=>{ const P=CanvasRenderingContext2D.prototype, mt=P.measureText, ft=P.fillText; const K=1/0.602;
  P.measureText=function(s){ const m=mt.call(this,s); return {width:m.width*K}; };
  P.fillText=function(s,x,y){ const w=mt.call(this,s).width*K, a=this.textAlign; const sx=a==='center'?x-w/2:a==='right'?x-w:x;
    this.save(); this.textAlign='left'; this.translate(sx,y); this.scale(K,1); ft.call(this,s,0,0); this.restore(); };
})();
