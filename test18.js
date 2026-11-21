const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','ru');if(!localStorage.getItem('kn_server_db'))localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Әмина',look:{skin:'#e3ad86',hair:'curly',hairCol:'#a5503c',top:'leather',topCol:'#6b4a2e'},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1600);
 // сыграть собрание через сервер: yes — «за» (кв. 1…), no — «против» (кв. 54 вниз), как будто прошло 3 минуты
 const play=async(id, yes, no=0)=>pg.evaluate(async([id,yes,no])=>{ const run=await API.tourStart(id); MockServer.debugDB().runs[run.runId].startedAt-=180000;
   const skip=x=>x===53||(x>=5&&x<=8); const ev=[]; let a=1; while(ev.length<yes){ if(!skip(a)) ev.push({t:'yes',apt:a}); a++; } let b=104; for(let k=0;k<no;k++){ while(skip(b)) b--; ev.push({t:'no',apt:b--}); }
   const r=await API.tourFinish(run, ev); return {ok:r.success, yes:r.signatures, turnout:r.turnout, need:r.need, badges:r.badges, coins:r.totalCoins}; }, [id,yes,no]);
 const tryStart=id=>pg.evaluate(async id=>{ try { await API.tourStart(id); return 'ALLOWED'; } catch(e){ return e.code; } }, id);
 const buy=id=>pg.evaluate(async id=>{ try { HOUSE_STATE=await API.buy(id); return 'OK'; } catch(e){ return e.code; } }, id);
 const check=(name, got, want)=>console.log((JSON.stringify(got)===JSON.stringify(want)?'✓':'✗ FAIL'), name, JSON.stringify(got));
 check('100 кв. + 4 кладовые: пороги 10/51/67, явка 51 и 26 «за»', await pg.evaluate(()=>[APTS,TOURS.L1.goal,TOURS.L2.quorum,TOURS.L2.goal,TOURS.L4.goal,TOURS.L5.goal,TOURS.L6.goal,aptNo(4),aptNo(5),aptNo(9),aptNo(53),aptNo(104)]), [100,10,51,26,51,67,67,'4','К1','5','49','100']);
 check('L3 сразу нельзя', await tryStart('L3'), 'locked');
 check('L1: 9 мало', (await play('L1',9)).ok, false); const r1=await play('L1',10); check('L1: 10 подписей = 10 %', [r1.ok, r1.badges], [true,['initiative_group']]);
 check('свет до председателя нельзя', await buy('light'), 'not_chairman');
 check('L3 до председателя нельзя', await tryStart('L3'), 'locked');
 check('L2: 45 «за», явка 45 < 51', (await play('L2',45,0)).ok, false);
 check('L2: 25 «за» из 51 — не больше половины', (await play('L2',25,26)).ok, false);
 const r2=await play('L2',26,25); check('L2: 26 «за» из 51', [r2.ok, r2.turnout, r2.need, r2.badges], [true,51,26,['chairman_elected']]);
 check('L2: из 66 голосовавших нужно 34', [(await play('L2',33,33)).ok, (await play('L2',34,32)).ok], [false,true]);
 check('L3 без ремонта света нельзя', await tryStart('L3'), 'locked');
 check('председатель чинит свет без собрания', await buy('light'), 'OK');
 check('антенну без собрания 2/3 нельзя', await buy('antenna'), 'no_vote');
 check('L3: совет', (await play('L3',30,25)).ok, true);
 check('L4 до 3 ремонтов нельзя', await tryStart('L4'), 'locked');
 check('дверь', await buy('door'), 'OK'); check('крыша', await buy('roof'), 'OK');
 check('L4: 50 «за» мало, 51 — тариф', [(await play('L4',50)).ok, (await play('L4',51)).ok], [false,true]);
 check('L5: 66 мало, 67 = 2/3', [(await play('L5',66)).ok, (await play('L5',67)).ok], [false,true]);
 check('L6 до антенны нельзя', await tryStart('L6'), 'locked');
 let ant='no_money'; for(let k=0;k<20&&ant==='no_money';k++){ ant=await buy('antenna'); if(ant==='no_money') await play('L5',80); } check('антенна', ant, 'OK');
 const r6=await play('L6',67); check('L6: лифт', [r6.ok, r6.badges], [true,['all_tours']]);
 await pg.evaluate(async()=>{ HOUSE_STATE=await API.house(); }); await pg.evaluate(()=>go('house')); await pg.waitForTimeout(1400);
 await pg.screenshot({path:'shots/h_hub.png'});
 // накопим денег повторами и починим всё
 for (const id of ['lift','basement','playground','sign','bench','flowers','trees','lamps','parking']) { let r='no_money'; for(let k=0;k<30&&r==='no_money';k++){ r=await buy(id); if(r==='no_money') await play('L6',90); } if(r!=='OK') console.log('✗ FAIL buy', id, r); }
 await pg.evaluate(async()=>{ HOUSE_STATE=await API.house(); });
 console.log('final', JSON.stringify(await pg.evaluate(()=>[HOUSE_STATE.fixed.length, HOUSE_STATE.decor.length, HOUSE_STATE.won])));
 await pg.evaluate(()=>go('house')); await pg.waitForTimeout(1200); await pg.screenshot({path:'shots/h_full.png'});
 await pg.evaluate(()=>go('levels')); await pg.waitForTimeout(800); await pg.screenshot({path:'shots/h_levels.png'});
 await pg.evaluate(()=>go('title')); await pg.waitForTimeout(800); await pg.screenshot({path:'shots/h_title.png'});
 await pg.evaluate(()=>go('leaderboard',{})); await pg.waitForTimeout(900); await pg.screenshot({path:'shots/h_lb.png'});
 await pg.evaluate(()=>go('tour',{tour:'L2'})); await pg.waitForTimeout(1500); await pg.evaluate(()=>{toasts.length=0;}); await pg.screenshot({path:'shots/h_tour_fixed.png'});
 console.log(errs); await b.close(); })();
