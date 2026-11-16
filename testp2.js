const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1200);
 const url=await pg.evaluate(()=>{ const looks=[]; for (const hair of ['short','long','bun','curly','bald']) for (const top of ['hoodie','shirt','jacket','leather','chapan']) looks.push({...DEFAULT_LOOK, hair, top, hairCol:'#a5503c', topCol:'#6b4a2e'});
  const c=document.createElement('canvas'); c.width=5*44*4; c.height=5*44*4; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.scale(4,4); g.fillStyle='#20222b'; g.fillRect(0,0,999,999);
  looks.forEach((l,i)=>g.drawImage(portrait(l,'neutral'),(i%5)*44,Math.floor(i/5)*44)); return c.toDataURL(); });
 fs.writeFileSync('shots/port2.png', Buffer.from(url.split(',')[1],'base64')); console.log(errs); await b.close(); })();
