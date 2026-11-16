const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const errs=[];
 for (const lang of ['ru','kz']) { const pg=await b.newPage({viewport:{width:1200,height:675}}); pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
  await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','${lang}');localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Председатель',look:{},coins:0,tours:{},trust:{}}));`});
  await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1600);
  await pg.screenshot({path:`shots/o_title_${lang}.png`});
  await pg.evaluate(()=>go('leaderboard',{})); await pg.waitForTimeout(900); await pg.screenshot({path:`shots/o_lb_${lang}.png`}); await pg.close(); }
 console.log(errs); await b.close(); })();
