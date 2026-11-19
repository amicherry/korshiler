// Викторина «Знаток ЖКХ»: бот бежит, прыгает, отвечает (один раз нарочно ошибается)
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 const lang=process.env.QLANG||'ru';
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','${lang}');localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Әмина',look:{body:'f',bottom:'skirt',hair:'long',hairCol:'#5a3a2a',top:'leather',topCol:'#7a2e3a'},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?token=demo&stable'); await pg.waitForTimeout(2600);
 const check=(name, got, want)=>console.log((JSON.stringify(got)===JSON.stringify(want)?'✓':'✗ FAIL'), name, JSON.stringify(got));
 // перемешивание: правильный ответ в JSON всегда первый, после перемешивания — на разных местах
 check('ответы перемешиваются', await pg.evaluate(async()=>{ const d=await loadQuiz(); const pos=new Set(); for(let i=0;i<40;i++) pos.add(prepQuestion(d.questions[0]).correct); return pos.size>=3; }), true);
 check('вопросы перемешиваются', await pg.evaluate(async()=>{ const d=await loadQuiz(); const a=shuffle(d.questions).map(q=>q.id).join(), b2=shuffle(d.questions).map(q=>q.id).join(); return a!==b2; }), true);
 check('битые вопросы отсеиваются', await pg.evaluate(()=>[quizValidQ({q:{ru:'?'},answers:[{ru:'a'}],correct:0}), quizValidQ({q:{ru:'?'},answers:[{ru:'a'},{ru:'b'}],correct:5}), quizValidQ(QUIZ_BUILTIN.questions[0])]), [false,false,true]);
 const coins0 = await pg.evaluate(()=>HOUSE_STATE.coins);
 await pg.evaluate(()=>{ go('levels'); }); await pg.waitForTimeout(900); await pg.screenshot({path:'shots/q_levels.png'});
 await pg.evaluate(()=>{ go('quiz'); }); await pg.waitForTimeout(900); await pg.screenshot({path:'shots/q_intro.png'});
 // бот: прыгает перед преградой, отвечает, листает
 await pg.evaluate(()=>{ window._wrongDone=false; window._lens=[]; window._shots={};
   window._bot=setInterval(()=>{ const s=scene; if(s!==scenes.quiz) return;
     if(s.state==='intro') s.state='run';
     if(s.state==='run' && !s.trip) for(const g of s.segs) if(g.obs) for(const o of g.obs){ const d=o.x+o.mx-s.hx; if(!o.hit && d>4 && d<(o.kind==='rat'?40:32) && s.jy===0) s.jump(); }
     for(const g of s.segs) if(g.obs) for(const o of g.obs) if(o.hit && !o.logged){ o.logged=1; (window._hits=window._hits||[]).push(o.kind+' d='+(o.x+o.mx-s.hx).toFixed(0)+' jy='+s.jy.toFixed(0)+' st='+s.state); }
     if(s.state==='ask' && !window._asking){ window._asking=true; setTimeout(()=>{ window._asking=false; const q=s.cur.q; let i=q.correct; if(!window._wrongDone){ i=(q.correct+1)%q.answers.length; window._wrongDone=true; window._lens.push(s.totalLen()); } s.choose(i); }, 600); }
     if(s.state==='feedback' && !window._fb){ window._fb=true; setTimeout(()=>{ window._fb=false; if(!s.fb.ok) window._lens.push(s.totalLen()); s.next(); if(window._lens.length===2) window._lens.push(s.totalLen()); }, 900); }
   }, 30); });
 for(let i=0;i<20;i++){ await pg.waitForTimeout(500); const st=await pg.evaluate(()=>scene.state); if(st==='ask'){ await pg.screenshot({path:'shots/q_ask.png'}); break; } }
 for(let i=0;i<20;i++){ await pg.waitForTimeout(150); const st=await pg.evaluate(()=>scene.state); if(st==='feedback'){ await pg.screenshot({path:'shots/q_wrong.png'}); break; } }
 await pg.waitForTimeout(1500); await pg.screenshot({path:'shots/q_run.png'});
 for(let i=0;i<180;i++){ await pg.waitForTimeout(500); const st=await pg.evaluate(()=>[scene.state, !!scene.result]); if(st[0]==='end' && st[1]) break; }
 await pg.waitForTimeout(800); await pg.screenshot({path:'shots/q_end.png'});
 const r = await pg.evaluate(()=>({ state: scene.state, res: scene.result, done: scene.done, total: scene.total, first: scene.first, wrong: scene.wrong, lens: window._lens, trips: scene.segs.flatMap(s=>s.obs||[]).filter(o=>o.hit).length, last: window.KORSHILER_LAST }));
 check('дошёл до конца', r.state, 'end'); check('собраны все страницы', r.done, r.total);
 check('ошибка: путь удлинился', r.lens.length>=3 && r.lens[2] > r.lens[0], true);
 check('ошибка: вопрос вернулся — ответов всего total+1', r.first + r.wrong, r.total);
 check('звание: 7 из 8 с первой попытки ≥ 80 %', [r.first, r.res && r.res.title, r.res && r.res.badge], [r.total-1, true, 'zhkh_expert']);
 console.log('монеты', r.res && r.res.coins, 'споткнулся', r.trips);
 check('монеты пришли в бюджет ЖК', await pg.evaluate(()=>HOUSE_STATE.coins) - coins0, r.res && r.res.coins);
 check('результат ушёл в приложение', r.last && [r.last.type, r.last.payload.tourCode, r.last.payload.badges], ['result','quiz',['zhkh_expert']]);
 console.log((await pg.evaluate(()=>window._hits||[])).slice(0,8)); console.log(errs); await b.close(); })();
