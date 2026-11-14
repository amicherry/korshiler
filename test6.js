const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
 const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Әмина',look:{skin:'#e3ad86',hair:'curly',hairCol:'#a5503c',top:'leather',topCol:'#6b4a2e',hat:null},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html'); await pg.waitForTimeout(2000);
 const t0=Date.now(); await pg.keyboard.press('Enter'); while(!(await pg.evaluate(()=>scene===scenes.tour && !trans.phase))) await pg.waitForTimeout(30); console.log('continue→tour ms', Date.now()-t0);
 await pg.evaluate(()=>{ toasts.length=0; scene.talker.done=true; });
 // крысы: герой на 2 этаже, спускается
 await pg.evaluate(()=>{ const h=scene.hero; h.floor=2; h.y=scene.base(2); h.x=80; scene.camY=scene.WH-225; }); await pg.waitForTimeout(600);
 await pg.screenshot({path:'shots/r0.png'});
 await pg.keyboard.down('ArrowDown'); await pg.waitForTimeout(80); await pg.keyboard.up('ArrowDown');
 for(let i=0;i<40;i++){ const st=await pg.evaluate(()=>scene.rats.map(r=>r.st)); if(st.includes('in')) break; await pg.waitForTimeout(25);} await pg.screenshot({path:'shots/r1.png'});
 await pg.waitForTimeout(500); await pg.screenshot({path:'shots/r2.png'});
 console.log(await pg.evaluate(()=>scene.rats.map(r=>r.st)));
 await pg.waitForTimeout(2000); console.log(await pg.evaluate(()=>scene.rats.map(r=>r.st)));
 // визит: герой отходит в сторону
 await pg.evaluate(()=>{ const r=scene.res[14]; r.away=false; r.knocks=9; r.A=Object.assign({},r.A,{deaf:0}); const h=scene.hero; h.floor=4; h.y=scene.base(4); h.x=DOOR_X[1]-6; });
 await pg.waitForTimeout(400); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(2200); await pg.screenshot({path:'shots/r3.png'});
 console.log(errs, await pg.evaluate(()=>document.getElementById('err').textContent));
 await b.close();
})();
