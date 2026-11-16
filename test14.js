const {chromium,devices}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const errs=[];
 for (const [dn,dev] of [['iphone',devices['iPhone 13 landscape']],['android',devices['Pixel 7 landscape']]]) {
  const ctx=await b.newContext({...dev}); const pg=await ctx.newPage(); pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
  await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','ru');localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Әмина',look:{skin:'#e3ad86',hair:'curly',hairCol:'#a5503c',top:'leather',topCol:'#6b4a2e',hat:null},coins:0,tours:{},trust:{}}));`});
  await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1600);
  await pg.screenshot({path:`shots/p_${dn}_title.png`});
  const box=await pg.evaluate(()=>{const r=cv.getBoundingClientRect(); return [r.left,r.top,r.width,r.height, innerWidth, innerHeight];}); console.log(dn,'canvas',box.map(Math.round));
  const tapL=async(x,y)=>{ await pg.mouse.click(box[0]+x/400*box[2], box[1]+y/225*box[3]); };
  await tapL(60,140); for(let i=0;i<40 && !(await pg.evaluate(()=>scene===scenes.tour && !trans.phase));i++) await pg.waitForTimeout(100);
  await pg.evaluate(()=>{ toasts.length=0; scene.talker.done=true; }); await pg.waitForTimeout(400);
  await pg.screenshot({path:`shots/p_${dn}_tour.png`});
  await pg.evaluate(()=>{ const r=scene.res[14]; r.away=false; r.knocks=9; r.sleeping=false; const h=scene.hero; h.x=DOOR_X[1]-6; });
  await pg.waitForTimeout(200); await pg.evaluate(()=>{ scene.visit(scene.res[14]); });
  for(let i=0;i<8 && !(await pg.evaluate(()=>!!DLG.choices));i++){ await pg.waitForTimeout(900); await tapL(200,170); }
  await pg.waitForTimeout(300); await pg.screenshot({path:`shots/p_${dn}_choices.png`});
  console.log(dn, 'buttons hidden:', await pg.evaluate(()=>['left','right','act'].map(k=>touchBtn(k).hidden)));
  await ctx.close(); }
 console.log(errs); await b.close(); })();
