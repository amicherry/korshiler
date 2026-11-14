const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage();
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.goto('file://'+process.cwd()+'/index.html'); await pg.waitForTimeout(1200);
 const url=await pg.evaluate(()=>{ const c=document.createElement('canvas'); c.width=5*44*6; c.height=2*50*6; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.scale(6,6); g.fillStyle='#20222b'; g.fillRect(0,0,c.width,c.height);
  const look=Object.assign({},ARCH.apa.look,{scarfCol:'#3f6f8c'}), look2=Object.assign({},ARCH.apa.look);
  ['neutral','happy','angry','think','sad'].forEach((e,i)=>{ g.drawImage(portrait(look,e),i*44,2); g.drawImage(portrait(look2,e),i*44,52); });
  return c.toDataURL(); });
 fs.writeFileSync('shots/port.png', Buffer.from(url.split(',')[1],'base64')); await b.close(); })();
