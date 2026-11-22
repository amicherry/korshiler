const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n').slice(1,5).join(' | ')));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','${process.env.SL||'kz'}');localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Әмина',look:{body:'f',hair:'long'},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1500);
 const shot=n=>pg.screenshot({path:'shots/'+(process.env.SL||'kz')+'_'+n+'.png'});
 await pg.evaluate(()=>go('tour',{tour:'L1'})); await pg.waitForTimeout(800); await shot('pr_inter1');
 await pg.evaluate(()=>go('tour',{tour:'L1',skipInter:true})); await pg.waitForTimeout(6000); await shot('pr_tour1');
 const info=await pg.evaluate(()=>{ const s=scene, R=Object.values(s.res); const c={}; R.forEach(r=>c[r.arch]=(c[r.arch]||0)+1); return {n:R.length, c, app:s.app}; });
 console.log(JSON.stringify(info));
 await pg.evaluate(()=>{ const db=MockServer.debugDB(); for (const k in db.houses) db.houses[k].won=['L1']; db.houses[USER.userId]={fixed:[],decor:[],won:['L1'],claimDay:null}; HOUSE_STATE.won=['L1']; go('tour',{tour:'L2'}); });
 await pg.waitForTimeout(3000); await shot('pr_days');
 await pg.evaluate(()=>{ scene.phase='offer'; }); await pg.waitForTimeout(400); await shot('pr_offer');
 await pg.evaluate(()=>go('tour',{tour:'L2',skipInter:true})); await pg.waitForTimeout(1500);
 await pg.evaluate(()=>{ SAVE.racIntro=true; scene.rac.menu=true; }); await pg.waitForTimeout(500); await shot('pr_racmenu');
 await pg.evaluate(async()=>{ SAVE.racSeen={notify:1,call:1,redial:1,chat:1}; scene.rac.menu=false; await scene.useRac('notify'); }); await pg.waitForTimeout(1200); await shot('pr_notify');
 await pg.evaluate(()=>{ scene.minute+=scene.tour.duration*.1; }); await pg.waitForTimeout(300);
 await pg.evaluate(async()=>{ await scene.useRac('call'); }); await pg.waitForTimeout(1200); await shot('pr_call');
 await pg.evaluate(async()=>{ scene.minute+=scene.tour.duration*.15; await scene.useRac('redial'); scene.minute+=scene.tour.duration*.15; await scene.useRac('chat'); }); await pg.waitForTimeout(1500); await shot('pr_chat');
 await pg.evaluate(()=>{ scene.ballot=true; }); await pg.waitForTimeout(400); await shot('pr_ballot');
 const st=await pg.evaluate(()=>{ const s=scene, c={}; Object.values(s.res).forEach(r=>c[r.status]=(c[r.status]||0)+1); return {c, yes:s.signatures(), share:s.appShare(), out:s.outcome()}; });
 console.log(JSON.stringify(st));
 await pg.evaluate(()=>{ scene.ballot=false; scene.startedAt-=400000; const db=MockServer.debugDB(); for (const k in db.runs) db.runs[k].startedAt-=400000; scene.finish(false); }); await pg.waitForTimeout(2500); await shot('pr_result');
 await pg.evaluate(()=>go('house')); await pg.waitForTimeout(1200); await shot('pr_house');
 await pg.evaluate(()=>go('levels')); await pg.waitForTimeout(800); await shot('pr_levels');
 await pg.evaluate(()=>go('quiz',{tour:'L2',then:'L2'})); await pg.waitForTimeout(1200); await shot('pr_quiz');
 // победный протокол L2
 await pg.evaluate(()=>{ go('tour',{tour:'L2',skipInter:true}); }); await pg.waitForTimeout(800);
 await pg.evaluate(()=>{ const s=scene; let a=0; for (const r of Object.values(s.res)) { if (r.A.noVote) continue; a++; const v = a<=46?'yes':a<=50?'no':a<=56?'abstain':null; if(!v) continue; r.status=v; s.events.push({t:v,apt:r.apt,via:['door','notify','call','chat','paper','proxy','online'][a%7]}); }
   s.startedAt-=400000; const db=MockServer.debugDB(); for (const k in db.runs) db.runs[k].startedAt-=400000; s.finish(false); }); await pg.waitForTimeout(2800); await shot('pr_win');
 // квиз: вопрос с самыми длинными ответами
 await pg.evaluate(()=>go('quiz',{tour:'L2',then:'L2'})); await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{ const s=scene; const pool=quizPool(QUIZ_BUILTIN).filter(quizValidQ); const q=pool.sort((a,b)=>Math.max(...b.answers.map(x=>L(x).length))-Math.max(...a.answers.map(x=>L(x).length)))[0]; const seg=s.segs.find(g=>g.type==='door'); seg.q=prepQuestion(q); s.queue[0]=seg.q; s.state='run'; s.hx=seg.x0-40; }); 
 for (let i=0;i<40;i++){ await pg.waitForTimeout(150); if (await pg.evaluate(()=>scene.state==='ask')) break; } await pg.waitForTimeout(300); await shot('pr_qask');
 await pg.evaluate(()=>{ const s=scene; if (s.choose) s.choose((s.cur.q.correct+1)%s.cur.q.answers.length); }); for (let i=0;i<30;i++){ await pg.waitForTimeout(150); if (await pg.evaluate(()=>scene.state==='feedback')) break; } await pg.waitForTimeout(300); await shot('pr_qfb');
 console.log('errors', errs.slice(0,8)); await b.close(); })();
