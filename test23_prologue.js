// Пролог: двор → подъезд (крыса, лужа, лифт) → соседи → мама с коляской → квартира → тур 1
const {chromium}=require('playwright'); const fs=require('fs');
const LANG = process.env.QLANG || 'ru';
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','${LANG}');localStorage.setItem('d67_save', JSON.stringify({created:true,name:'Әмина',look:{body:'f',hair:'long',hairCol:'#4a2e22',top:'hoodie',topCol:'#b8443f',bottom:'skirt',skin:'#e3ad86'},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1500);
 await pg.evaluate(()=>go('prologue')); await pg.waitForTimeout(700);
 const shot = async n => { await pg.screenshot({path:`shots/p_${n}${LANG==='ru'?'':'_'+LANG}.png`}); };
 const seen = {}; const log = [];
 const check=(name, ok, v='')=>console.log(ok?'✓':'✗ FAIL', name, v);
 for (let i=0; i<900; i++) {
   const s = await pg.evaluate(()=>{ const P=scenes.prologue, h=P.h||{};
     for (const k of ['left','right','up','down']) keys[k]=false;
     return { scene: scene===scenes.prologue?'prologue':Object.keys(scenes).find(k=>scenes[k]===scene), phase:P.phase, busy:P.busy, dlg:DLG.open, ch:!!DLG.choices, x:Math.round(h.x||P.hx), floor:h.floor, climb:!!h.climb, anim:h.anim&&h.anim.kind, at:h.anim&&h.anim.t, rat:!!P.rat, lift:P.done.lift, trans:trans.phase, name:DLG.name, text:DLG.text, mom:P.npcs.find(n=>n.id==='mom').done }; });
   if (s.scene !== 'prologue') { log.push('scene '+s.scene); break; }
   if (s.trans) { await pg.waitForTimeout(100); continue; }
   if (s.anim==='scare' && s.at>200 && !seen.jump) { seen.jump=1; await shot('rat'); }
   if (s.anim==='slip' && s.at>220 && !seen.slip) { seen.slip=1; await shot('slip'); }
   if (s.anim==='slip' && s.at>1100 && !seen.lie) { seen.lie=1; await shot('lie'); }
   if (s.anim==='smell' && !seen.smell) { seen.smell=1; await pg.waitForTimeout(300); await shot('smell'); }
   if (s.dlg) { const key = s.name+'|'+s.text.slice(0,20);
     if (!seen[key]) { seen[key]=1; log.push(s.name+': '+s.text.slice(0,60));
       if (s.phase==='street') await shot('street'); if (/Сара|Бекет|Ерлан/.test(s.name) && !seen[s.name]) { seen[s.name]=1; await pg.waitForTimeout(600); await shot('npc_'+s.name.split(' ')[0]); }
       if (s.name==='Әсел' && !seen.mom) { seen.mom=1; await pg.waitForTimeout(600); await shot('mom'); }
       if (s.phase==='flat' && !seen.flat) { seen.flat=1; await pg.waitForTimeout(700); await shot('flat'); } }
     await pg.waitForTimeout(80); await pg.evaluate(()=>{ DLG.shown = DLG.text.length; pressed.act = true; }); await pg.waitForTimeout(60); continue; }
   if (s.busy || s.climb || s.anim || s.rat) { await pg.waitForTimeout(100); continue; }
   await pg.evaluate(s=>{ const P=scenes.prologue;
     if (P.phase==='street') { if (Math.abs(P.hx-STREET_DOOR_X)<8) pressed.act=true; else keys.right=true; return; }
     if (P.phase!=='stairs') return; const h=P.h;
     const go = x => { if (Math.abs(h.x-x)<3) return true; if (x>h.x) keys.right=true; else keys.left=true; return false; };
     if (h.floor===1 && !P.done.lift) { if (go(LIFT_X)) pressed.act=true; return; }
     const n = P.npcs.find(n=>!n.done && !n.auto && n.floor===h.floor);
     if (n) { if (go(n.x-20)) pressed.act=true; return; }
     if (h.floor < P.homeFloor) { if (go(STAIR_FOOT)) pressed.up=true; return; }
     if (go(P.homeX)) pressed.act=true; }, s);
   if (s.phase==='stairs' && s.floor===1 && s.x>180 && !seen.f1) { seen.f1=1; await shot('floor1'); }
   if (s.phase==='stairs' && s.floor===7 && !seen.f7) { seen.f7=1; await pg.waitForTimeout(400); await shot('floor7'); }
   await pg.waitForTimeout(90);
 }
 console.log(log.join('\n'));
 const st = await pg.evaluate(()=>({ scene: Object.keys(scenes).find(k=>scenes[k]===scene), tour: scene.tour && scene.tour.id, seen: SAVE.seenIntro, mom: SAVE.helpedMom, trust: SAVE.trust[65] }));
 check('после квартиры — тур 1', st.scene==='tour' && st.tour==='L1', JSON.stringify(st));
 check('пролог отмечен', st.seen===true);
 check('крыса, лужа, вонь, лифт', !!(seen.jump && seen.slip && seen.lie && seen.smell), JSON.stringify(Object.keys(seen).filter(k=>!k.includes('|'))));
 check('помогли маме → соседи 9-го этажа доверяют', st.mom===true && st.trust===5);
 await pg.waitForTimeout(1500); await shot('tour1');
 const hud = await pg.evaluate(()=>({ app: scene.app, rac: scene.raccoon, menuOnline: false }));
 check('в туре 1 нет енота и онлайна', hud.app===false && hud.rac===0, JSON.stringify(hud));
 console.log('errors', errs); await b.close(); })();
