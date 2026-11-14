const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
 const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_save', JSON.stringify({created:true,name:'Әмина',look:{skin:'#e3ad86',hair:'curly',hairCol:'#a5503c',top:'leather',topCol:'#6b4a2e',hat:null},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html'); await pg.waitForTimeout(2200);
 const key=async (k,ms=60)=>{ await pg.keyboard.down(k); await pg.waitForTimeout(ms); await pg.keyboard.up(k); await pg.waitForTimeout(50); };
 await key('Enter'); await pg.waitForTimeout(1000); for(let i=0;i<12;i++){ await key('Enter'); await pg.waitForTimeout(400); if(await pg.evaluate(()=>scene===scenes.tour)) break; } await pg.waitForTimeout(1500);
 await pg.evaluate(()=>{ toasts.length=0; scene.talker.done=true; scene.hero.x=230; });
 await pg.waitForTimeout(300); await pg.screenshot({path:'shots/t_tour.png'});
 // открытая дверь
 await pg.evaluate(()=>{ const r=scene.res[14]||scene.res[15]; r.door=1; });
 await pg.waitForTimeout(200); await pg.screenshot({path:'shots/t_open.png'});
 // подъём по лестнице: снимок в середине
 await pg.evaluate(()=>{ for(const r of Object.values(scene.res)) r.door=0; scene.hero.x=80; }); await key('ArrowUp'); await pg.waitForTimeout(900); await pg.screenshot({path:'shots/t_climb.png'});
 const t0=Date.now(); while(await pg.evaluate(()=>!!scene.hero.climb)) await pg.waitForTimeout(50); console.log('climb ms', Date.now()-t0+900);
 console.log(errs, await pg.evaluate(()=>document.getElementById('err').textContent));
 await b.close();
})();
