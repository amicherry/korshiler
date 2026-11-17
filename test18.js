const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1200,height:675}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.addInitScript({content: fs.readFileSync('widefont.js','utf8')+`;localStorage.setItem('d67_lang','ru');if(!localStorage.getItem('kn_server_db'))localStorage.setItem('d67_save', JSON.stringify({created:true,seenIntro:true,name:'Әмина',look:{skin:'#e3ad86',hair:'curly',hairCol:'#a5503c',top:'leather',topCol:'#6b4a2e'},coins:0,tours:{},trust:{}}));`});
 await pg.goto('file://'+process.cwd()+'/index.html?stable'); await pg.waitForTimeout(1600);
 // выиграть собрание 1 через сервер (как будто прошло 3 минуты)
 const win=async(id, n)=>pg.evaluate(async([id,n])=>{ const run=await API.tourStart(id); MockServer.debugDB().runs[run.runId].startedAt-=180000;
   const ev=[]; for(let a=1;a<=n;a++) if(a!==34) ev.push({t:'yes',apt:a}); return API.tourFinish(run, ev); }, [id,n]);
 const t0=Date.now();
 // попытка прыгнуть на 3-е собрание — сервер не пустит
 console.log('skip L3:', await pg.evaluate(async()=>{ try { await API.tourStart('L3'); return 'ALLOWED'; } catch(e){ return e.code; } }));
 console.log('L1', JSON.stringify(await win('L1', 8)));
 console.log('buy door before light:', await pg.evaluate(async()=>{ try{ await API.buy('door'); return 'ALLOWED'; } catch(e){ return e.code; } }));
 console.log('L2 before fix:', await pg.evaluate(async()=>{ try { await API.tourStart('L2'); return 'ALLOWED'; } catch(e){ return e.code; } }));
 await pg.evaluate(async()=>{ HOUSE_STATE=await API.house(); }); await pg.keyboard.press('Enter'); await pg.waitForTimeout(1400);
 console.log('scene', await pg.evaluate(()=>Object.keys(scenes).find(k=>scenes[k]===scene)));
 await pg.screenshot({path:'shots/h_hub.png'});
 // выбрать свет и починить
 await pg.mouse.click(200*3, 112*3); await pg.waitForTimeout(300); await pg.screenshot({path:'shots/h_panel.png'});
 await pg.mouse.click(318*3, 180*3); await pg.waitForTimeout(1900); await pg.screenshot({path:'shots/h_anim.png'});
 await pg.waitForTimeout(1500); await pg.screenshot({path:'shots/h_after.png'});
 console.log('state', JSON.stringify(await pg.evaluate(()=>HOUSE_STATE)));
 // накопим денег и починим всё, чтобы посмотреть готовый двор
 for (let i=2;i<=8;i++){ await win('L'+i, 14); await pg.evaluate(async(i)=>{ for(let k=0;k<4;k++){ try{ HOUSE_STATE=await API.buy(PROBLEMS[i-1].id); break; }catch(e){ const run=await API.tourStart('L'+i); MockServer.debugDB().runs[run.runId].startedAt-=180000; const ev=[]; for(let a=1;a<=20;a++) if(a!==34) ev.push({t:'yes',apt:a}); await API.tourFinish(run,ev); } } }, i); }
 await pg.evaluate(async()=>{ for(const d of DECOR){ for(let k=0;k<3;k++){ try{ HOUSE_STATE=await API.buy(d.id); break;}catch(e){ const run=await API.tourStart('L8'); MockServer.debugDB().runs[run.runId].startedAt-=180000; const ev=[]; for(let a=1;a<=30;a++) if(a!==34) ev.push({t:'yes',apt:a}); await API.tourFinish(run,ev);} } } HOUSE_STATE=await API.house(); });
 console.log('final', JSON.stringify(await pg.evaluate(()=>[HOUSE_STATE.fixed.length, HOUSE_STATE.decor.length, HOUSE_STATE.score])));
 await pg.evaluate(()=>go('house')); await pg.waitForTimeout(1200); await pg.screenshot({path:'shots/h_full.png'});
 await pg.evaluate(()=>go('levels')); await pg.waitForTimeout(800); await pg.screenshot({path:'shots/h_levels.png'});
 await pg.evaluate(()=>go('title')); await pg.waitForTimeout(800); await pg.screenshot({path:'shots/h_title.png'});
 await pg.evaluate(()=>go('leaderboard',{})); await pg.waitForTimeout(900); await pg.screenshot({path:'shots/h_lb.png'});
 await pg.evaluate(()=>go('tour',{tour:'L8'})); await pg.waitForTimeout(1500); await pg.evaluate(()=>{toasts.length=0;}); await pg.screenshot({path:'shots/h_tour_fixed.png'});
 console.log(errs); await b.close(); })();
