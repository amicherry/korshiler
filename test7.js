const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
 const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Әмина',look:{skin:'#e3ad86',hair:'curly',hairCol:'#a5503c',top:'leather',topCol:'#6b4a2e',hat:null},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html'); await pg.waitForTimeout(1500);
 await pg.keyboard.press('Enter'); await pg.waitForTimeout(1500);
 await pg.evaluate(()=>{ toasts.length=0; scene.talker.done=true; const h=scene.hero; h.floor=1; h.y=scene.base(1); h.x=388; scene.rats.forEach(r=>{r.st='roam'; r.x=120+Math.random()*60;}); });
 await pg.waitForTimeout(1200); await pg.evaluate(()=>{ scene.rats.forEach((r,i)=>{r.st='roam'; r.x=110+i*40; r.pause=0;}); }); await pg.waitForTimeout(100); await pg.screenshot({path:'shots/q0.png'});
 await pg.evaluate(()=>{ const [a,c]=scene.rats; a.st='in'; a.k=150; a.hole=236; a.dir=1; c.st='alert'; c.k=0; c.x=330; c.dir=1; });
 await pg.waitForTimeout(60); await pg.screenshot({path:'shots/q1.png'});
 await pg.waitForTimeout(1500); console.log(await pg.evaluate(()=>scene.rats.map(r=>r.st)));
 await pg.evaluate(()=>{ const h=scene.hero; h.floor=3; h.y=scene.base(3); }); await pg.waitForTimeout(3400);
 console.log(await pg.evaluate(()=>scene.rats.map(r=>r.st))); 
 await pg.evaluate(()=>{ const h=scene.hero; h.floor=1; h.y=scene.base(1); h.x=388; scene.rats.forEach(r=>{ if(r.st==='roam'){} }); }); await pg.waitForTimeout(40); await pg.screenshot({path:'shots/q2.png'});
 console.log(errs);
 await b.close();
})();
