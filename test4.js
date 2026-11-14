const {chromium,devices}=require('playwright'); const fs=require('fs');
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({...devices['iPhone 13 landscape']});
 const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_save', JSON.stringify({created:true,name:'Әмина',look:{skin:'#e3ad86',hair:'bun',hairCol:'#2b2420',top:'hoodie',topCol:'#b8443f',hat:null},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html'); await pg.waitForTimeout(2500);
 await pg.screenshot({path:'shots/m_title.png'});
 await pg.tap('[data-k=act]'); await pg.waitForTimeout(1200); for(let i=0;i<9;i++){ await pg.tap('[data-k=act]'); await pg.waitForTimeout(450); if(await pg.evaluate(()=>scene===scenes.tour)) break; } await pg.waitForTimeout(1500);
 await pg.screenshot({path:'shots/m_tour.png'});
 await pg.evaluate(()=>{ scene.hero.x=DOOR_X[1]-6; }); await pg.waitForTimeout(200); await pg.screenshot({path:'shots/m_door.png'});
 await pg.tap('[data-k=act]'); await pg.waitForTimeout(1600); await pg.tap('#cv'); await pg.waitForTimeout(300); await pg.screenshot({path:'shots/m_dialog.png'});
 console.log(errs, await pg.evaluate(()=>document.getElementById('err').textContent), await pg.evaluate(()=>({o:DLG.open, s:Object.keys(scenes).find(k=>scenes[k]===scene)})));
 await b.close();
})();
