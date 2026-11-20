const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
 const b=await chromium.launch();
 for(const lang of ['kz','ru','en']){
 const pg=await b.newPage({viewport:{width:1200,height:675}});
 const errs=[]; pg.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','${lang}');`});
 await pg.goto('file://'+process.cwd()+'/index.html'); await pg.waitForTimeout(2500);
 const key=async (k,ms=60)=>{ await pg.keyboard.down(k); await pg.waitForTimeout(ms); await pg.keyboard.up(k); await pg.waitForTimeout(50); };
 const shot=async n=>pg.screenshot({path:`shots/${lang}_${n}.png`});
 await shot('a_title');
 await pg.mouse.click(600+186, 610+12); await pg.waitForTimeout(400); await shot('b_settings'); await key('Escape');
 await key('Enter'); await pg.waitForTimeout(1200); await pg.fill('#nameInput','Әмина'); await shot('c_creator');
 await pg.evaluate(()=>scenes.creator.done()); await pg.waitForTimeout(1300); await pg.waitForTimeout(1500); await shot('d_prologue');
 await pg.evaluate(()=>scenes.prologue.finish()); for(let i=0;i<40;i++){ await pg.waitForTimeout(300); if(await pg.evaluate(()=>scene===scenes.tour)) break; } await pg.waitForTimeout(900);
 await pg.evaluate(()=>{ scene.talker.done=true; for(const r of Object.values(scene.res)){ r.status=['yes','no','thinking','away','noanswer','online','unknown'][r.apt%7]; if(r.A.renter) r.status='renter'; } });
 await key('KeyB'); await pg.waitForTimeout(300); await shot('e_ballot'); await key('KeyB');
 await pg.evaluate(()=>{ const r=Object.values(scene.res).find(r=>!r.A.renter); r.status='unknown'; r.away=false; r.knocks=5; scene.hero.floor=r.floor; scene.hero.y=scene.base(r.floor); scene.hero.x=DOOR_X[r.d]-8; });
 await key('KeyE'); await pg.waitForTimeout(1600); await key('Enter'); await pg.waitForTimeout(300); await shot('f_dialog');
 await key('ArrowRight'); await key('Enter'); await pg.waitForTimeout(300); await shot('g_args');
 await pg.evaluate(()=>{ DLG.open=false; scene.busy=false; scene.minute=scene.end; }); await pg.waitForTimeout(3600); await shot('h_result');
 console.log(lang, errs, await pg.evaluate(()=>document.getElementById('err').textContent));
 await pg.close(); }
 await b.close();
})();
