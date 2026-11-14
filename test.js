const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}});
 const errs=[]; pg.on('pageerror',e=>errs.push('PAGEERR '+e.message)); pg.on('console',m=>{ if(m.type()==='error' && !/fonts\.g/.test(m.text())) errs.push(m.text()); });
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort()); 
 await pg.goto('file://'+process.cwd()+'/index.html'); await pg.waitForTimeout(3200);
 const shot=async n=>{ await pg.screenshot({path:'shots/'+n+'.png'}); };
 const key=async (k,ms=80)=>{ await pg.keyboard.down(k); await pg.waitForTimeout(ms); await pg.keyboard.up(k); await pg.waitForTimeout(60); };
 await shot('01_title');
 await key('Enter'); await pg.waitForTimeout(900); await shot('02_creator');
 await pg.fill('#nameInput','Әмина'); await pg.evaluate(()=>document.activeElement.blur());
 await key('ArrowDown'); await key('ArrowRight'); await key('ArrowDown'); await key('ArrowRight'); await key('ArrowDown');await key('ArrowDown');await key('ArrowDown'); await key('ArrowRight'); await key('ArrowDown'); await key('ArrowRight');
 await shot('03_creator2');
 await key('Enter'); await pg.waitForTimeout(1500); await shot('04_prologue');
 for(let i=0;i<8;i++){ await key('Enter'); await pg.waitForTimeout(400);} await pg.waitForTimeout(1500); await shot('05_tour');
 // идём к двери 14 (слева от героя)
 await key('ArrowRight',620); await pg.waitForTimeout(200); await shot('06_neardoor');
 await key('KeyE'); await pg.waitForTimeout(1800); await shot('07_knock');
 for(let i=0;i<20;i++){ const st=await pg.evaluate(()=>({o:DLG.open,c:!!DLG.choices,t:DLG.text.slice(0,40)})); if(!st.o) break;
   if(st.c && i===3){ await key('ArrowRight'); await key('Enter'); await pg.waitForTimeout(300); await shot('08b_args'); await key('ArrowDown'); await key('ArrowDown'); await key('ArrowLeft'); }
   await key('Enter'); await pg.waitForTimeout(450); if(i==2) await shot('08_dialog'); }
 console.log('after visit', JSON.stringify(await pg.evaluate(()=>{const r=scene.res[14]; return {st:r.status,mood:r.mood,arch:r.arch}})));
 await pg.waitForTimeout(800); await shot('09_after');
 await key('KeyB'); await pg.waitForTimeout(300); await shot('10_ballot'); await key('KeyB');
 // к лестнице и вниз на 3 этаж (болтун)
 await key('ArrowLeft',2400); await key('ArrowDown'); await pg.waitForTimeout(1600); await shot('11_talker');
 for(let i=0;i<5;i++){ await key('Enter'); await pg.waitForTimeout(500);} 
 await key('KeyR'); await pg.waitForTimeout(700); await shot('12_raccoon'); await pg.waitForTimeout(1600);
 const st=await pg.evaluate(()=>({scene:Object.keys(scenes).find(k=>scenes[k]===scene), sig:scene.signatures&&scene.signatures(), min:scene.minute, statuses:scene.res&&Object.values(scene.res).map(r=>r.status).join(',')}));
 console.log(JSON.stringify(st));
 await pg.evaluate(()=>{ scene.minute=scene.end; }); await pg.waitForTimeout(3500); await shot('13_result');
 const err=await pg.evaluate(()=>document.getElementById('err').textContent);
 console.log('ERRORS:',errs, err);
 await b.close();
})();
