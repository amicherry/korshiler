const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','ru');if(!localStorage.getItem('kn_server_db'))localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Әмина',look:{skin:'#e3ad86',hair:'curly',hairCol:'#a5503c',top:'leather',topCol:'#6b4a2e'},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1600);
 // быстрый выход из уровня: повестка не должна появиться в меню
 await pg.evaluate(()=>go('tour',{tour:'L1'})); await pg.waitForTimeout(150);
 await pg.evaluate(()=>go('title')); await pg.waitForTimeout(1500);
 console.log('toasts after quick exit:', await pg.evaluate(()=>toasts.length));
 await pg.evaluate(()=>go('tour',{tour:'L1'})); await pg.waitForTimeout(900);
 console.log('toasts in level:', await pg.evaluate(()=>toasts.length));
 // 6 у дверей + 4 онлайн: итог должен показать 6, +4 и 10/6
 const res = await pg.evaluate(async()=>{ const run=await API.tourStart('L1'); MockServer.debugDB().runs[run.runId].startedAt-=180000;
   const ev=[]; for(let a=1;a<=6;a++) ev.push({t:'yes',apt:a}); for(let a=7;a<=10;a++) ev.push({t:'yes',apt:a,via:'online'});
   const r=await API.tourFinish(run, ev); go('result',{...r,tourId:'L1',goal:6,problem:PROBLEMS[0],against:0,thinking:0}); return [r.signatures,r.online]; });
 console.log('signatures/online', res); await pg.waitForTimeout(900); await pg.screenshot({path:'shots/r_6_4.png'});
 console.log(errs); await b.close(); })();
