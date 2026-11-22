// Запуск из приложения E-KNOT: параметры в адресе, мост WebView ловит сообщения игры
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;window._msgs=[]; window.ReactNativeWebView={postMessage:m=>window._msgs.push(JSON.parse(m))};`});
 const q='token=eyJ-test-123&lang=ru&name='+encodeURIComponent('Динара')+'&level=4&tour=1&title=chairman&complex='+encodeURIComponent('ЖК «Нұрлы»')+'&stable';
 await pg.goto('file://'+process.cwd()+'/index.html?'+q); await pg.waitForTimeout(2600);
 const check=(name, got, want)=>console.log((JSON.stringify(got)===JSON.stringify(want)?'✓':'✗ FAIL'), name, JSON.stringify(got));
 const st = await pg.evaluate(()=>({ lang: LANG, name: USER.name, guest: USER.guest, level: USER.level, title: USER.title, complex: USER.complex.name, won: HOUSE_STATE.won, ready: window._msgs[0] && window._msgs[0].type }));
 check('язык из ссылки', st.lang, 'ru'); check('вход не гостем', st.guest, false); check('имя', st.name, 'Динара');
 check('уровень и звание', [st.level, st.title], [4, 'chairman']); check('ЖК', st.complex, 'ЖК «Нұрлы»');
 check('tour=1 → пройдены туры 0 и 1', st.won, ['L1','L2']); check('сообщение ready в приложение', st.ready, 'ready');
 await pg.screenshot({path:'shots/launch_menu.png'});
 // сыграть тур 3 (совет): нужен ремонт света — председатель чинит без собрания
 const p = await pg.evaluate(async()=>{ go('tour',{tour:'L2',skipInter:true}); for (let i=0;i<40 && !scene.run;i++) await wait(100);
   const s=scene; s.startedAt-=200000; MockServer.debugDB().runs[s.run.runId].startedAt-=200000;
   let a=1; for (const r of Object.values(s.res)) { if (a++ <= 40) { r.status='yes'; s.events.push({t:'yes',apt:r.apt}); } else if (a <= 60) { r.status='no'; s.events.push({t:'no',apt:r.apt}); } }
   await s.finish(false); await wait(300); return window._msgs.filter(m=>m.type==='result').pop(); });
 const r=p && p.payload; console.log(JSON.stringify({...r, events: r && r.events.length}));
 check('результат ушёл в приложение', !!r, true);
 check('поля результата', r && Object.keys(r).filter(k=>k!=='events').sort(), ['apartments','badges','clientVersion','daysLimit','daysUsed','eknotShare','finishedAt','firstWin','game','lang','offline','protocol','required','rule','runId','score','startedAt','success','token','tour','tourCode','version','votes'].sort());
 check('тур 2 (повтор) → tour=1, chairman, кворум', r && [r.tour, r.tourCode, r.rule, r.apartments, r.required.turnout], [1,'chairman','quorum_half_plus_one',100,51]);
 check('голоса: 40 за, 19 против, явка 59 → победа, значок уже был', r && [r.votes.yes, r.votes.no, r.votes.turnout, r.success, r.badges], [40,19,59,true,[]]);
 check('токен передан обратно', r && r.token, 'eyJ-test-123');
 // английского больше нет: lang=en → казахский
 await pg.goto('file://'+process.cwd()+'/index.html?lang=en&stable'); await pg.waitForTimeout(2600);
 check('lang=en игнорируется (только kz/ru)', ['kz','ru'].includes(await pg.evaluate(()=>LANG)), true);
 console.log(errs); await b.close(); })();
