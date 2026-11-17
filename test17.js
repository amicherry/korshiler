const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Әмина',look:{},coins:0,tours:{t1:{tries:1,best:10,done:true},t2:{tries:1,best:52,done:true}},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1500);
 await pg.screenshot({path:'shots/t2_ant.png'}); await pg.keyboard.press('Enter'); await pg.waitForTimeout(1200); await pg.screenshot({path:'shots/t2_tours2.png'});
 console.log(errs); await b.close(); })();
