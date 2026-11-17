const {chromium,devices}=require('playwright'); const fs=require('fs');
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({...devices['iPhone 13 landscape']}); const pg=await ctx.newPage();
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','kz');localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Әмина',look:{skin:'#e3ad86',hair:'curly',hairCol:'#a5503c',top:'leather',topCol:'#6b4a2e',hat:null},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html'); await pg.waitForTimeout(2600);
 const tapL=async(x,y)=>{ const r=await pg.evaluate(()=>{const b=cv.getBoundingClientRect(); return {l:b.left,t:b.top,w:b.width,h:b.height};}); await pg.mouse.click(r.l+x/400*r.w, r.t+y/225*r.h); };
 await tapL(60,139); for(let i=0;i<40 && !(await pg.evaluate(()=>scene===scenes.tour && !trans.phase && !!scene.talker));i++) await pg.waitForTimeout(100);
 console.log('scene', await pg.evaluate(()=>Object.keys(scenes).find(k=>scenes[k]===scene)));
 // найдём апа и сделаем её доступной
 const apt=await pg.evaluate(()=>{ toasts.length=0; scene.talker.done=true; const r=Object.values(scene.res).find(r=>r.arch==='apa'); r.away=false; r.knocks=9; r.sleeping=false; return r.apt; });
 const fl=Math.ceil(apt/6), d=(apt-1)%6; console.log('apa apt', apt, 'floor', fl, 'hero floor', await pg.evaluate(()=>scene.hero.floor));
 // нажимаем по двери на её этаже: вычислим экранный y
 await pg.evaluate((fl)=>{ scene.camY=clamp(scene.base(fl)-165,0,scene.WH-225); },fl);
 const sy=await pg.evaluate((fl)=>scene.base(fl)-scene.camY-20, fl);
 const sx=[26,72,118,282,328,374][d];
 // если этаж не виден — нажимаем по видимой части, а камера потом догонит
 await tapL(sx, Math.min(215, Math.max(30, sy)));
 const t0=Date.now(); while(!(await pg.evaluate(()=>DLG.open)) && Date.now()-t0<20000) await pg.waitForTimeout(100);
 console.log('dialog after', Date.now()-t0, 'ms, floor', await pg.evaluate(()=>scene.hero.floor));
 await pg.waitForTimeout(1200); await pg.screenshot({path:'shots/m_apa.png'});
 for(let i=0;i<4 && !(await pg.evaluate(()=>!!DLG.choices));i++){ await tapL(200,180); await pg.waitForTimeout(700); }
 await pg.waitForTimeout(200); await pg.screenshot({path:'shots/m_choices.png'});
 await tapL(64+162+70, await pg.evaluate(()=>CH.y0+8)); await pg.waitForTimeout(400);
 console.log('after tap choice text:', await pg.evaluate(()=>DLG.text.slice(0,40)));
 console.log(errs, await pg.evaluate(()=>document.getElementById('err').textContent));
 await b.close();
})();
