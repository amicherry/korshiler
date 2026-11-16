const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch();
 // телефон 20:9 с вырезом камеры слева (как у Әмины): 800x360, отступ слева 48px
 const ctx=await b.newContext({viewport:{width:800,height:360},deviceScaleFactor:3,isMobile:true,hasTouch:true}); const pg=await ctx.newPage();
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','kz');`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1500);
 // эмулируем env(safe-area-inset-left) нельзя напрямую — подменим переменную как сделал бы браузер
 await pg.addStyleTag({content:'.touch body{--side:max(48px,0px)!important}'}); await pg.evaluate(()=>fit()); await pg.waitForTimeout(200);
 console.log(await pg.evaluate(()=>{const r=cv.getBoundingClientRect(); return {left:Math.round(r.left), right:Math.round(innerWidth-r.right), w:Math.round(r.width), h:Math.round(r.height)};}));
 await b.close(); })();
