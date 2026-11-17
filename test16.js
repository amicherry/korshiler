const {chromium,devices}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const errs=[];
 const ctx=await b.newContext({viewport:{width:1200,height:675}}); const pg=await ctx.newPage(); pg.on('pageerror',e=>errs.push(e.message+' '+e.stack.split('\n')[1]));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','kz');if(!localStorage.getItem('kn_server_db'))localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Әмина',look:{skin:'#e3ad86',hair:'curly',hairCol:'#a5503c',top:'leather',topCol:'#6b4a2e'},coins:0,tours:{t1:{tries:2,best:11,done:true}},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1500);
 await pg.keyboard.press('Enter'); await pg.waitForTimeout(1200);
 console.log('after continue:', await pg.evaluate(()=>Object.keys(scenes).find(k=>scenes[k]===scene)));
 await pg.screenshot({path:'shots/t2_tours.png'});
 await pg.keyboard.press('Enter'); await pg.waitForTimeout(1600);
 console.log('scene', await pg.evaluate(()=>[Object.keys(scenes).find(k=>scenes[k]===scene), scene.tour&&scene.tour.id, Object.keys(scene.res||{}).length]));
 await pg.screenshot({path:'shots/t2_intro.png'});
 for(let i=0;i<12 && await pg.evaluate(()=>DLG.open);i++){ await pg.keyboard.press('Enter'); await pg.waitForTimeout(500); }
 // имитируем 18 «да» в своём подъезде и одну рассылку
 await pg.evaluate(()=>{ toasts.length=0; scene.talker.done=true; let k=0; for(const r of Object.values(scene.res)){ if(k++<18 && !r.A.renter){ r.status='yes'; scene.events.push({t:'yes',apt:r.apt,via:'door'}); } } });
 await pg.evaluate(()=>scene.useRaccoon()); await pg.waitForTimeout(3500);
 console.log('own', await pg.evaluate(()=>[scene.signatures(), scene.remoteTarget(), Math.floor(scene.remoteShown), scene.votes()]));
 await pg.screenshot({path:'shots/t2_hud.png'});
 await pg.evaluate(()=>{ scene.ballot=true; }); await pg.waitForTimeout(300); await pg.screenshot({path:'shots/t2_ballot.png'});
 await pg.evaluate(()=>{ scene.ballot=false; const h=scene.hero; h.floor=9; h.y=scene.base(9); }); await pg.waitForTimeout(900); await pg.screenshot({path:'shots/t2_top.png'});
 // сервер против подозрительно быстрых — состарим попытку
 await pg.evaluate(()=>{ scene.run && (scene.run._); });
 await pg.waitForTimeout(12000);
 await pg.evaluate(()=>scene.finish(false)); await pg.waitForTimeout(2500);
 console.log('result', await pg.evaluate(()=>JSON.stringify(scene.d)));
 await pg.screenshot({path:'shots/t2_result.png'});
 await pg.evaluate(()=>go('title')); await pg.waitForTimeout(800); await pg.screenshot({path:'shots/t2_title.png'});
 console.log(errs); await b.close(); })();
