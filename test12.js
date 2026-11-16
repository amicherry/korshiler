const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const errs=[];
 // 1) все тексты интерфейса и реплики: ничего не шире своего места
 for (const lang of ['kz','ru']) {
  const pg=await b.newPage({viewport:{width:1200,height:675}}); pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
  await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','${lang}');localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Председатель',look:{skin:'#e3ad86',hair:'curly',hairCol:'#a5503c',top:'leather',topCol:'#6b4a2e',hat:null},coins:0,tours:{},trust:{}}));`});
  await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1600);
  await pg.screenshot({path:`shots/o_title_${lang}.png`});
  const rep=await pg.evaluate(()=>{ const bad=[];
    // реплики жильцов: страница диалога ≤ 5 строк по 320px — say() делит, проверим, что слово не длиннее строки
    for (const a in ARCH) for (const k in ARCH[a].lines) { const v=ARCH[a].lines[k]; for (const x of (Array.isArray(v)?v:[v])) for (const s of [x, x.top, x.low]) if (s) { const t=L(s); for (const w of t.split(' ')) if (textW(w) > 320) bad.push(a+'.'+k+': '+w); } }
    // кнопки выбора в диалоге (156px, допускается 6px шрифт)
    for (const k of ['cExplain','aFacts','aBenefit','aNeighbors','aOnline','cListen','cLater','tListen','tLater','tChat']) if (UI[k] && textW(L(UI[k]),6) > 150) bad.push('choice '+k);
    // меню и протокол
    for (const k of ['rSigned','rOnline','rAgainst','rThinking','rScore','rRank','rCoins']) if (textW(L(UI[k])) > 200) bad.push('row '+k);
    for (const k of ['menu','rating','again']) if (textW(L(UI[k])) > 80) bad.push('btn '+k);
    for (const k of ['tabComplex','tabCity']) if (textW(L(UI[k])) > 88) bad.push('tab '+k);
    for (const k of ['noScore','netFail']) if (textW(L(UI[k]),6) > 270) bad.push('note '+k);
    return bad; });
  console.log(lang, rep); await pg.close();
 }
 // 2) ночной работник на 5 этаже — про крышу, на 2 этаже — про мебель сверху
 const pg=await b.newPage(); pg.on('pageerror',e=>console.log('PAGEERR',e.stack)); await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content:`localStorage.setItem('d67_lang','ru');localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'А',look:{},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1200); await pg.keyboard.press('Enter'); for(let i=0;i<60 && !(await pg.evaluate(()=>scene===scenes.tour && !!scene.res));i++) await pg.waitForTimeout(100); console.log('scene:', await pg.evaluate(()=>Object.keys(scenes).find(k=>scenes[k]===scene)));
 console.log(await pg.evaluate(async()=>{ const out=[]; const sc=scene;
   for (const apt of [19, 6]) { const r=sc.res[apt]; r.arch='night'; r.A=ARCH.night; r.v=1; r.away=false; r.knocks=9; r.sleeping=false;
     // повторяем логику выбора строки как в visit
     const v=r.A.lines.story; let line=v[r.v%v.length]; const top=Math.ceil(r.apt/sc.tour.perFloor)===sc.tour.floors; if(top&&line.top) line=line.top; else if(!top&&line.low) line=line.low; out.push(apt+': '+L(line)); }
   return out; }));
 console.log(errs); await b.close(); })();
