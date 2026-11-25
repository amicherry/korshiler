// Скрины правок 25.11: подсказки, Данияр, цвета, подъезд изнутри, квиз
const {chromium}=require('playwright'); const fs=require('fs'); const SL=process.env.SL||'ru';
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','${SL}');localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,inter:{L1:1,L2:1,L3:1,L4:1,L5:1,L6:1,L7:1},name:'Әмина',look:{body:'f',hair:'long'},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1500);
 const shot=async n=>pg.screenshot({path:`shots/${SL}_q_${n}.png`});
 await pg.evaluate(()=>go('tour',{tour:'L1',skipInter:true})); await pg.waitForTimeout(2000); await shot('help_tour1');
 await pg.evaluate(()=>{ scene.help=false; SAVE.helpTour=true; }); await pg.waitForTimeout(300); await shot('tour1');
 // тур 2: Данияр
 await pg.evaluate(async()=>{ const db=MockServer.debugDB(); for (const k in db.houses) db.houses[k].won=['L1']; HOUSE_STATE=await API.house(); go('tour',{tour:'L2',skipInter:true}); }); await pg.waitForTimeout(7000);
 const dan = await pg.evaluate(()=>{ const s=scene; return s.dan ? { apt: s.dan.apt, floor: s.dan.floor, hero: s.hero.floor, app: s.app } : null; }); console.log('dan', JSON.stringify(dan));
 await shot('dan_toast');
 await pg.evaluate(async()=>{ const s=scene, r=s.dan; s.hero.floor=r.floor; s.hero.y=s.base(r.floor); s.camY=s.base(r.floor)-150; await new Promise(z=>setTimeout(z,300)); }); await pg.waitForTimeout(600); await shot('dan_door');
 await pg.evaluate(()=>{ say=async()=>{}; const s=scene; s.walkTo=async x=>{s.hero.x=x;}; s.visit(s.dan); }); await pg.waitForTimeout(3500);
 console.log('after', JSON.stringify(await pg.evaluate(()=>({ app: scene.app, racIntro: SAVE.racIntro, yes: scene.votes() }))));
 await pg.evaluate(()=>{ DLG.open=false; scene.busy=false; scene.rac.menu=true; toasts.length=0; }); await pg.waitForTimeout(500); await shot('racmenu');
 await pg.evaluate(()=>{ const s=scene; s.rac.menu=false; let i=0; for (const r of Object.values(s.res)) { i++; if (i%5===0) r.status='yes'; else if (i%11===0) r.status='no'; else if (i%13===0) r.status='abstain'; } s.ballot=true; }); await pg.waitForTimeout(400); await shot('ballot');
 await pg.evaluate(()=>{ scene.ballot=false; scene.help=true; }); await pg.waitForTimeout(400); await shot('help_tour2');
 // протокол
 await pg.evaluate(()=>{ const s=scene; s.help=false; let a=0; for (const r of Object.values(s.res)) { if (r.A.noVote) continue; a++; const v=a<=46?'yes':a<=50?'no':a<=56?'abstain':null; if(!v) continue; r.status=v; s.events.push({t:v,apt:r.apt,via:['door','notify','call','chat','paper'][a%5]}); } s.startedAt-=400000; const db=MockServer.debugDB(); for (const k in db.runs) db.runs[k].startedAt-=400000; s.finish(false); }); await pg.waitForTimeout(3000); await shot('protocol');
 // дом
 await pg.evaluate(async()=>{ const db=MockServer.debugDB(); for (const k in db.houses) { db.houses[k].fixed=['light','walls','cameras','door']; db.houses[k].won=['L1','L2']; db.houses[k].coins=865000; } HOUSE_STATE=await API.house(); go('house'); }); await pg.waitForTimeout(1500); await shot('house_help');
 await pg.evaluate(()=>{ scene.help=false; }); await pg.waitForTimeout(300); await shot('house');
 await pg.evaluate(()=>go('inside')); await pg.waitForTimeout(1500); await shot('inside');
 await pg.evaluate(()=>go('tour',{tour:'L3',skipInter:true})); await pg.waitForTimeout(1800); await pg.evaluate(()=>{toasts.length=0;}); await shot('tour_fixed');
 // чат дома и обиженная апа
 await pg.evaluate(async()=>{ const s=scene; SAVE.racIntro=true; s.app=true; s.rac.open=3; s.rac.readyDay.chat=0; SAVE.racSeen={notify:1,call:1,redial:1,chat:1}; for (const r of Object.values(s.res)) if (r.status==='unknown' && Math.random()<.3) r.status='yes'; s.useRac('chat'); }); await pg.waitForTimeout(500); await shot('chat_a'); await pg.waitForTimeout(4500); await shot('chat_b');
 await pg.evaluate(()=>{ scene.chatWin=null; const s=scene; const r=Object.values(s.res).find(r=>r.arch==='obida'); s.hero.floor=r.floor; s.hero.y=s.base(r.floor); s.camY=s.base(r.floor)-150; s.walkTo=async x=>{s.hero.x=x;}; r.away=false; r.sleeping=false; r.refuser=false; s.visit(r); }); await pg.waitForTimeout(4200); await shot('obida');
 // заставка и квиз
 await pg.evaluate(()=>go('interlude',{tour:'L4'})); await pg.waitForTimeout(3000); await shot('months');
 await pg.evaluate(()=>{ go('quiz',{tour:'L3',then:'L3'}); }); await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{ const s=scene; s.first=3; s.second=1; s.wrong=1; s.trips=2; s.total=5; s.result={first:3,total:5,coins:57000,bonus:false}; s.state='end'; }); await pg.waitForTimeout(500); await shot('quiz_end');
 console.log('errors', errs); await b.close(); })();
