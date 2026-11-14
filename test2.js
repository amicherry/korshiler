const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}});
 const errs=[]; pg.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript(()=>{ localStorage.setItem('d67_save', JSON.stringify({created:true,name:'Әмина',look:{skin:'#e3ad86',hair:'long',hairCol:'#2b2420',top:'chapan',topCol:'#3f6f8c',hat:'tyube'},coins:0,tours:{},trust:{}})); localStorage.setItem('d67_lang','kz'); });
 await pg.goto('file://'+process.cwd()+'/index.html'); await pg.waitForTimeout(2500);
 const key=async (k,ms=60)=>{ await pg.keyboard.down(k); await pg.waitForTimeout(ms); await pg.keyboard.up(k); await pg.waitForTimeout(50); };
 await key('Enter'); await pg.waitForTimeout(1200); for(let i=0;i<6;i++){ await key('Enter'); await pg.waitForTimeout(350);} await pg.waitForTimeout(1500);
 console.log('scene', await pg.evaluate(()=>Object.keys(scenes).find(k=>scenes[k]===scene)));
 await pg.evaluate(()=>{ scene.talker.done=true; });
 const apts=await pg.evaluate(()=>Object.keys(scene.res).map(Number));
 let shotN=0;
 for(const apt of apts){
   for(let attempt=0; attempt<3; attempt++){
     await pg.evaluate(a=>{ const r=scene.res[a]; scene.minute=Math.min(scene.minute, scene.end-12); scene.hero.floor=r.floor; scene.hero.y=scene.base(r.floor); scene.hero.x=DOOR_X[r.d]-8; scene.hero.climb=null; }, apt);
     await pg.waitForTimeout(80); await key('KeyE'); await pg.waitForTimeout(1300);
     for(let i=0;i<40;i++){
       const st=await pg.evaluate(()=>({o:DLG.open,c:DLG.choices?DLG.choices.length:0,busy:scene.busy}));
       if(!st.o && !st.busy) break;
       if(st.c){ const n=Math.floor(Math.random()*st.c); for(let j=0;j<n;j++) await key('ArrowRight'); if(shotN<4 && Math.random()<.3){ await pg.screenshot({path:`shots/d${shotN++}.png`}); } }
       await key('Enter'); await pg.waitForTimeout(220);
     }
     await pg.waitForTimeout(400);
     const s=await pg.evaluate(a=>scene.res[a].status, apt);
     if(['yes','no','renter','online'].includes(s)) break;
   }
 }
 const sum=await pg.evaluate(()=>{ const c={}; for(const r of Object.values(scene.res)) c[r.status]=(c[r.status]||0)+1; return {c, sig:scene.signatures(), min:Math.round(scene.minute-scene.tour.start)}; });
 console.log(JSON.stringify(sum));
 await key('KeyB'); await pg.waitForTimeout(300); await pg.screenshot({path:'shots/ballot2.png'}); await key('KeyB');
 await pg.evaluate(()=>{ scene.minute=scene.end; }); await pg.waitForTimeout(3600); await pg.screenshot({path:'shots/result2.png'});
 console.log('ERR', errs, await pg.evaluate(()=>document.getElementById('err').textContent));
 await b.close();
})();
