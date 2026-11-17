const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1500);
 const url=await pg.evaluate(()=>{ const frames=['idle0','idle1',...[0,1,2,3,4,5,6,7].map(i=>'walk'+i),'climb0','climb1','knock'];
  const looks=[{...DEFAULT_LOOK, top:'jacket', topCol:'#a0714a', hair:'short', hairCol:'#4a2e22', pants:'#3a3d48'}, {...DEFAULT_LOOK, body:'f', hair:'long', hairCol:'#a5503c', top:'leather', topCol:'#6b4a2e', bottom:'skirt'}, ARCH.apa.look, ARCH.grump.look, ARCH.student.look];
  const c=document.createElement('canvas'); c.width=frames.length*22*5; c.height=looks.length*46*5; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.scale(5,5); g.fillStyle='#e8e4dc'; g.fillRect(0,0,999,999);
  looks.forEach((l,j)=>frames.forEach((f,i)=>g.drawImage(personSprite(l,f), i*22+2, j*46+2))); return c.toDataURL(); });
 fs.writeFileSync('shots/walk.png', Buffer.from(url.split(',')[1],'base64')); console.log(errs); await b.close(); })();
