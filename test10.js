const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}});
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','kz');`});
 await pg.goto('file://'+process.cwd()+'/index.html?token=demo&stable'); await pg.waitForTimeout(2200);
 await pg.screenshot({path:'shots/a_title.png'});
 const r=await pg.evaluate(async()=>{
   const out={user:USER.name+' '+USER.complex.name+' guest='+USER.guest};
   SAVE.name='Әмина'; SAVE.created=true; await API.save(SAVE);
   const run=await API.tourStart('L1');
   // «старим» попытку, чтобы она не выглядела подозрительно быстрой
   const db=JSON.parse(localStorage.getItem('kn_server_db')); db.runs[run.runId].startedAt-=200000; localStorage.setItem('kn_server_db',JSON.stringify(db));
   out.cheat=await (async()=>{ const r2=await API.tourStart('L1'); return (await API.tourFinish(r2,[1,2,3,4,5,6,7,8,9,10,11].map(a=>({t:'yes',apt:a})))).signatures; })();
   return out; });
 console.log(r);
 // перезагрузка нужна, т.к. заглушка держит БД в памяти — проверим, что состояние живёт между запусками
 const res=await pg.evaluate(async()=>{ const run=await API.tourStart('L1'); return run.runId; });
 await pg.evaluate(async(id)=>{ /* состарим */ }, res);
 const fin=await pg.evaluate(async()=>{ const run=await API.tourStart('L1'); await wait(10); 
   // через внутренности заглушки нельзя — поэтому подождём «по-честному» 16 сек? вместо этого 3 подписи (не подозрительно)
   return await API.tourFinish(run,[{t:'yes',apt:1},{t:'yes',apt:2},{t:'yes',apt:2},{t:'yes',apt:99},{t:'yes',apt:34}]); });
 console.log('fin (ожидаем 2 подписи: дубль, 99 и своя 34 не считаются)', fin.signatures, 'score', fin.score);
 const again=await pg.evaluate(async()=>{ const run=await API.tourStart('L1'); const a=await API.tourFinish(run,[{t:'yes',apt:1}]); const b2=await API.tourFinish(run,[{t:'yes',apt:1},{t:'yes',apt:2}]); return [a.signatures,b2.signatures]; });
 console.log('повторная отправка той же попытки', again);
 // показать результат с бонусом
 await pg.evaluate(()=>go('result',{signatures:10,online:3,success:true,score:1730,newBest:true,coins:75,reward:{points:50,status:'sent'},against:2,thinking:3}));
 await pg.waitForTimeout(1500); await pg.screenshot({path:'shots/a_result.png'});
 await pg.evaluate(()=>go('leaderboard',{})); await pg.waitForTimeout(900); await pg.screenshot({path:'shots/a_lb.png'});
 await pg.mouse.click(250/400*1200, 40/225*675); await pg.waitForTimeout(900); await pg.screenshot({path:'shots/a_lb_city.png'});
 console.log(errs, await pg.evaluate(()=>document.getElementById('err').textContent));
 await b.close(); })();
