// Баланс: бот-«хороший игрок» проходит туры на настоящей логике жильцов и времени.
// Диалоги отвечаются мгновенно, ходьба по этажу и между этажами списывает игровое время.
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','ru');localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,racIntro:true,inter:{L1:1,L2:1,L3:1,L4:1,L5:1,L6:1,L7:1},racSeen:{notify:1,call:1,redial:1,chat:1},name:'Bot',look:{},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1600);
 const NOISE=+(process.env.NOISE||0), WALK=+(process.env.WALK||1), RUNS=+(process.env.RUNS||24), IDS=(process.env.IDS||'L1,L2,L3,L4,L5,L6,L7').split(','), RACF=process.env.RAC??'1', ONL=+(process.env.ONL??1);
 const res = await pg.evaluate(async([NOISE,WALK,RUNS,process_ids,process_rac,ONL])=>{
   say = async()=>{}; sayPage = async()=>{}; wait = async()=>{}; tweenDoor = async()=>{}; toast = ()=>{}; pop = ()=>{};
   let R0 = null;
   ask = async(menu)=>{ const r=R0, A=r.A, ks=menu.map(m=>m.k);
     if (Math.random() < NOISE) { const opts=['explain','facts','benefit','neighbors','listen']; return ks.indexOf(opts[Math.floor(Math.random()*opts.length)]); }
     if (ks.includes('invite')) return ks.indexOf('invite');
     if (ks.includes('proxy')) return ks.indexOf(ks.includes('online') ? 'online' : 'proxy');
     if (A.onlineOk && !A.paperOnly && ks.includes('online') && Math.random() < ONL) return ks.indexOf('online');
     if (!r.listened && A.listen >= 10) return ks.indexOf('listen');
     let best='explain'; for (const k of ['explain','facts','benefit','neighbors']) if ((A.likes||{})[k] > (A.likes||{})[best]) best=k; return Math.max(0, ks.indexOf(best)); };
   const out = {};
   for (const id of (process_ids)) {
     const runs=[];
     for (let s=0; s<RUNS; s++) {
       SAVE.trust = {}; SAVE.tours[id] = { tries: s }; USER.userId = 'bot-'+s;
       HOUSE_STATE.fixed = { L1: [], L2: [], L3: ['door'], L4: ['door','walls'], L5: ['door','walls','light','pit','yard','cameras','letnik'], L6: ['door','walls','light','pit','yard','cameras','letnik','antenna'], L7: ['door','walls','light','pit','yard','cameras','letnik','antenna','lift'] }[id];
       go('tour', { tour: id, skipInter: true }); const sc = scenes.tour, T = sc.tour; sc.run = null;
       const walk = (fromX, toX, df) => { sc.minute += (Math.abs(toX-fromX)/75/T.secPerMin + Math.abs(df)*0.7) * WALK; };
       let pass = 0; const RAC = !!+(process_rac);
       const useRac = async () => { if (!RAC || !sc.app) return; for (const k of RAC_ACTS) if (sc.racReady(k).ok) { sc.busy = false; await sc.useRac(k); sc.busy = false; } };
       while ((T.noTimer || sc.minute < sc.end) && !sc.goalMet() && pass < 6) {
         for (let f=1; f<=T.floors && sc.minute < sc.end && !sc.goalMet(); f++) {
           const fl = pass % 2 ? T.floors + 1 - f : f;
           for (const r of Object.values(sc.res)) { if (r.floor !== fl) continue;
             if (['yes','no','online','abstain','novote'].includes(r.status)) continue;
             if (sc.minute >= sc.end || sc.goalMet()) break;
             walk(sc.hero.x, DOOR_X[r.d], fl - sc.hero.floor); sc.hero.floor = fl; sc.hero.y = sc.base(fl); sc.hero.x = DOOR_X[r.d] - 23;
             R0 = r; sc.walkTo = async x => { sc.hero.x = x; }; await sc.visit(r); sc.busy = false; DLG.open = false; sc.tickCouncil(); sc.tickOnline();
           }
           if (f % 3 === 0) await useRac();
         }
         pass++; await useRac();
       }
       // конец тура: оставшиеся обещания приходят, как в finish()
       for (const r of Object.values(sc.res)) if (r.status === 'online') sc.resolveOnline(r);
       const yes = sc.signatures(), no = sc.against(), ab = sc.abstained(), final = voteOutcome(T, yes, no, ab);
       runs.push({ ok: final.ok, yes, no, ab, share: sc.appShare(), turnout: final.turnout, day: sc.day() });
       sc.over = true;
     }
     const ok = runs.filter(r=>r.ok).length, avg = k => (runs.reduce((a,r)=>a+r[k],0)/runs.length).toFixed(1);
     out[id] = { goal: TOURS[id].goal, quorum: TOURS[id].quorum||'-', wins: ok+'/'+runs.length, yes: avg('yes'), 'E-KNOT%': avg('share'), no: avg('no'), abst: avg('ab'), dayEnd: avg('day') };
   }
   return out; }, [NOISE,WALK,RUNS,IDS,RACF,ONL]);
 console.table(res); console.log(errs.slice(0,3)); await b.close(); })();
