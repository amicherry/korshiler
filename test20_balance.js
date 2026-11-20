// Баланс: бот-«хороший игрок» проходит туры на настоящей логике жильцов и времени.
// Диалоги отвечаются мгновенно, ходьба по этажу и между этажами списывает игровое время.
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','ru');localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,racIntro:true,name:'Bot',look:{},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1600);
 const NOISE=+(process.env.NOISE||0), WALK=+(process.env.WALK||1), RUNS=+(process.env.RUNS||24);
 const res = await pg.evaluate(async([NOISE,WALK,RUNS])=>{
   say = async()=>{}; sayPage = async()=>{}; wait = async()=>{}; tweenDoor = async()=>{}; toast = ()=>{}; pop = ()=>{};
   let R0 = null;
   ask = async(menu)=>{ const r=R0, A=r.A, ks=menu.map(m=>m.k);
     if (Math.random() < NOISE) { const opts=['explain','facts','benefit','neighbors','listen']; return ks.indexOf(opts[Math.floor(Math.random()*opts.length)]); }
     if (A.onlineOk && ks.includes('online')) return ks.indexOf('online');
     if (!r.listened && A.listen >= 10) return ks.indexOf('listen');
     let best='explain'; for (const k of ['explain','facts','benefit','neighbors']) if (A.likes[k] > A.likes[best]) best=k; return ks.indexOf(best); };
   const out = {};
   for (const id of ['L1','L2','L3','L4','L5','L6']) {
     const runs=[];
     for (let s=0; s<RUNS; s++) {
       SAVE.trust = {}; SAVE.tours[id] = { tries: s }; USER.userId = 'bot-'+s;
       HOUSE_STATE.fixed = { L1: [], L2: [], L3: ['light'], L4: ['light','door','roof'], L5: ['light','door','roof'], L6: ['light','door','roof','antenna'] }[id];
       go('tour', { tour: id }); const sc = scenes.tour, T = sc.tour; sc.run = null;
       const walk = (fromX, toX, df) => { sc.minute += (Math.abs(toX-fromX)/75/T.secPerMin + Math.abs(df)*0.7) * WALK; };
       let rac = T.raccoon, pass = 0;
       while (sc.minute < sc.end && !sc.goalMet() && pass < 6) {
         for (let f=1; f<=T.floors && sc.minute < sc.end && !sc.goalMet(); f++) {
           const fl = pass % 2 ? T.floors + 1 - f : f;
           for (const r of Object.values(sc.res)) { if (r.floor !== fl) continue;
             if (['yes','no','online','renter'].includes(r.status)) continue;
             if (sc.minute >= sc.end || sc.goalMet()) break;
             walk(sc.hero.x, DOOR_X[r.d], fl - sc.hero.floor); sc.hero.floor = fl; sc.hero.y = sc.base(fl); sc.hero.x = DOOR_X[r.d] - 23;
             R0 = r; sc.walkTo = async x => { sc.hero.x = x; }; await sc.visit(r); sc.busy = false; DLG.open = false; sc.tickCouncil(); sc.tickOnline();
           }
         }
         pass++; if (rac > 0) { rac--; sc.busy = false; sc.useRaccoon(); }
       }
       const yes = sc.signatures(), online = Object.values(sc.res).filter(r=>r.status==='online').length, no = sc.against();
       const final = voteOutcome(T, yes + Math.round(online*.82), no);
       runs.push({ ok: final.ok, yes, online, no, turnout: final.turnout, day: sc.day() });
       sc.over = true;
     }
     const ok = runs.filter(r=>r.ok).length, avg = k => (runs.reduce((a,r)=>a+r[k],0)/runs.length).toFixed(1);
     out[id] = { goal: TOURS[id].goal, quorum: TOURS[id].quorum||'-', wins: ok+'/'+runs.length, yes: avg('yes'), online: avg('online'), no: avg('no'), dayEnd: avg('day') };
   }
   return out; }, [NOISE,WALK,RUNS]);
 console.table(res); console.log(errs.slice(0,3)); await b.close(); })();
