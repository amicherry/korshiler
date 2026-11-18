const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch();
 for (const mode of ['online','offline']) {
 const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Әмина',look:{skin:'#e3ad86',hair:'curly',hairCol:'#a5503c',top:'leather',topCol:'#6b4a2e',hat:null},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(2600);
 await pg.keyboard.press('Enter'); await pg.waitForFunction(()=>scene===scenes.tour, null, {timeout:8000}); await pg.waitForTimeout(500);
 if (mode==='offline') await pg.evaluate(()=>{ API_CONFIG.failRate=1; location.search; });
 await pg.evaluate(()=>{ API_CONFIG.failRate = API_CONFIG.failRate; });
 await pg.evaluate((m)=>{ if(m==='offline'){ MockServer.handle = async()=>{ await wait(200); const e=new Error('network'); throw e; }; } [1,2,3].forEach(a=>scene.events.push({t:'yes',apt:a})); scene.finish(false); }, mode);
 await pg.waitForTimeout(m=mode==='offline'?9000:2500);
 console.log(mode, await pg.evaluate(()=>[Object.keys(scenes).find(k=>scenes[k]===scene), JSON.stringify(scene.d)]), errs);
 await pg.screenshot({path:'shots/fin_'+mode+'.png'}); await pg.close(); }
 await b.close(); })();
