// Тур 2: сосед знакомит с E-KNOT и енотом, онлайн-голоса приходят по ходу собрания, отказы на пороге, монеты за енота не растут
const {chromium}=require('playwright'); const fs=require('fs');
const LANG = process.env.QLANG || 'kz';
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','${LANG}');localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Әмина',look:{body:'f',hair:'long'},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1500);
 const check=(name, ok, v='')=>console.log(ok?'✓':'✗ FAIL', name, v);
 // тур 1: без енота, без онлайн-ответа в меню
 const t1 = await pg.evaluate(async()=>{ go('tour',{tour:'L1'}); await wait(300); const s=scene; let menu=null; const oa=ask, os=say, ow=wait, otd=tweenDoor; say=async()=>{}; wait=async()=>{}; tweenDoor=async()=>{}; ask=async m=>{ menu=m.map(x=>x.k); return m.length-1; };
   const r=Object.values(s.res).find(r=>!r.A.renter && !r.refuser && !r.away && !r.sleeping); r.A={...r.A, deaf:0}; s.walkTo=async()=>{}; await s.visit(r); ask=oa; say=os; wait=ow; tweenDoor=otd; DLG.open=false; s.busy=false;
   return { app: s.app, rac: s.raccoon, menu, refusers: Object.values(s.res).filter(r=>r.refuser).length }; });
 check('тур 1: нет E-KNOT, енота и пункта «онлайн»', !t1.app && t1.rac===0 && !t1.menu.includes('online'), JSON.stringify(t1));
 check('в доме есть отказники', t1.refusers >= 4, t1.refusers);
 await pg.screenshot({path:`shots/o_tour1_${LANG}.png`});
 // тур 2: знакомство с енотом
 await pg.evaluate(()=>{ HOUSE_STATE.won=['L1']; const db=MockServer.debugDB(); for (const k in db.houses) db.houses[k].won=['L1']; db.houses[USER.userId]={fixed:[],decor:[],won:['L1'],claimDay:null}; go('tour',{tour:'L2'}); }); await pg.waitForTimeout(6600);
 let shotIntro=false;
 for (let i=0;i<12;i++){ const o=await pg.evaluate(()=>({open:DLG.open,name:DLG.name})); if(o.open){ if(!shotIntro){ shotIntro=true; await pg.waitForTimeout(500); await pg.screenshot({path:`shots/o_racintro_${LANG}.png`}); } await pg.evaluate(()=>{DLG.shown=DLG.text.length; pressed.act=true}); } await pg.waitForTimeout(250); }
 const t2 = await pg.evaluate(()=>({ app: scene.app, rac: scene.raccoon, intro: SAVE.racIntro }));
 check('тур 2: сосед рассказал про енота → енот доступен', t2.app && t2.rac===2 && t2.intro, JSON.stringify(t2));
 // отказ на пороге
 const ref = await pg.evaluate(async()=>{ const s=scene; const r=Object.values(s.res).find(r=>r.refuser); r.away=false; r.sleeping=false; r.A={...r.A,deaf:0}; s.walkTo=async()=>{};
   const os=say, ow=wait, otd=tweenDoor; wait=async()=>{}; tweenDoor=async()=>{}; let line=''; say=async t=>{ line=t; }; await s.visit(r); say=os; wait=ow; tweenDoor=otd; DLG.open=false; s.busy=false; return { st: r.status, line }; });
 check('отказник говорит «нет» сразу', ref.st==='no', ref.line);
 // енот: вторая рассылка слабее первой
 const rac = await pg.evaluate(async()=>{ const s=scene; const n=[]; const ot=toast; let last=''; toast=(a,b)=>{ last=b; };
   const cnt=()=>Object.values(s.res).filter(r=>r.status==='online').length;
   let a=cnt(); s.useRaccoon(); n.push(cnt()-a); a=cnt(); s.useRaccoon(); n.push(cnt()-a); s.useRaccoon(); toast=ot; return {n, left:s.raccoon}; });
 check('енот: вторая рассылка слабее, больше двух нельзя', rac.n[1] < rac.n[0] && rac.left===0, JSON.stringify(rac));
 // время идёт — онлайн-голоса приходят, счётчик в HUD меняется
 const before = await pg.evaluate(()=>[scene.onYes, scene.onNo]);
 await pg.evaluate(()=>{ scene.minute += scene.tour.duration*.4; }); await pg.waitForTimeout(400);
 await pg.screenshot({path:`shots/o_hud_${LANG}.png`});
 const after = await pg.evaluate(()=>[scene.onYes, scene.onNo, Object.values(scene.res).filter(r=>r.viaApp).length]);
 check('онлайн-голоса пришли по ходу собрания', after[0]+after[1] > before[0]+before[1], JSON.stringify({before, after}));
 // монеты: рассылки не дают доплаты сверх 10 голосов у дверей
 const coins = await pg.evaluate(async()=>{ const s=scene; for (let i=0;i<40 && !s.run;i++) await new Promise(r=>setTimeout(r,100)); if(!s.run) s.run=await API.tourStart(s.tour.id); s.startedAt-=300000; MockServer.debugDB().runs[s.run.runId].startedAt-=300000;
   let k=0; for (const r of Object.values(s.res)) { if (r.status==='unknown' && k<70) { r.status='online'; r.onlineAt=1e9; s.events.push({t:'online',apt:r.apt,via:'raccoon'}); k++; } }
   const om=Math.random; Math.random=()=>0.1; await s.finish(false); Math.random=om; await new Promise(r=>setTimeout(r,400)); return MockServer.debugDB().runs[s.run.runId].result; });
 check('много онлайн-голосов: только базовая награда', coins.success && coins.coins <= 320 + 10*11, JSON.stringify(coins));
 console.log('errors', errs); await b.close(); })();
