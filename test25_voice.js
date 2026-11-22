// Озвучка: каждая строка таблицы находит свой id, а реплики, которые игра реально говорит в туре, находят mp3-id.
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,racIntro:true,inter:{L1:1,L2:1,L3:1,L4:1,L5:1,L6:1,L7:1},racSeen:{notify:1,call:1,redial:1,chat:1},name:'Bot',look:{},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1500);
 const rows = fs.readFileSync('voice/voice_lines.csv','utf8').replace(/^﻿/,'').trim().split('\n').slice(1).map(l=>l.split(';').map(x=>x.replace(/^"|"$/g,'')));
 const res = await pg.evaluate(async (rows)=>{
   const bad=[]; for (const lang of ['kz','ru']) { LANG=lang; for (const r of rows) { const t=(lang==='kz'?r[5]:r[6]).replace(/\{f\}/g,'5').replace(/\{up\}/g,'1 000 ₸').replace(/\{op\}/g,'Kcell'); const id=voiceId(t); if (id!==r[0] && !(id && rows.find(x=>x[0]===id && (lang==='kz'?x[5]:x[6])===(lang==='kz'?r[5]:r[6])))) bad.push(lang+':'+r[0]+'→'+id); } }
   // что реально звучит в туре
   const heard={hit:0,miss:[]}; const said=[];
   say = async(t)=>{ said.push(String(t)); }; sayPage = async()=>{}; wait = async()=>{}; tweenDoor = async()=>{}; toast=()=>{}; pop=()=>{};
   let R0=null; ask = async(m)=>{ const ks=m.map(x=>x.k); return Math.floor(Math.random()*ks.length); };
   const out={};
   for (const lang of ['ru','kz']) { LANG=lang; for (const id of ['L1','L2','L4']) { for (let s=0;s<3;s++) { SAVE.trust={}; go('tour',{tour:id,skipInter:true}); const sc=scenes.tour; sc.walkTo=async x=>{sc.hero.x=x;};
     for (const r of Object.values(sc.res)) { said.length=0; await sc.visit(r); sc.busy=false; DLG.open=false;
       for (const t of said) { if (/^\d|Кв\.|Пәт/.test(t)) continue; voiceId(t) ? heard.hit++ : heard.miss.push(r.arch+': '+t.slice(0,60)); } } sc.over=true; } } }
   const top={}; for (const m of heard.miss) { const a=m.split(':')[0]; top[a]=(top[a]||0)+1; }
   return { bad: bad.slice(0,10), nBad: bad.length, hit: heard.hit, miss: heard.miss.length, byArch: top, sample: [...new Set(heard.miss.map(m=>m.replace(/\d+/g,'N')))].sort() };
 }, rows);
 fs.writeFileSync('voice/bez_ozvuchki.txt', 'Реплики, которых нет в voice_lines.csv (звучат «писком»):\n'+res.sample.join('\n')+'\n'); delete res.sample; console.log(JSON.stringify(res)); console.log('errors', errs.slice(0,3)); await b.close(); })();
