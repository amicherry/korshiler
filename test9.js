const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage();
 const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/fonts.googleapis.com/**', r=>r.abort());
 await pg.goto('file://'+process.cwd()+'/index.html'); await pg.waitForTimeout(1200);
 const out=await pg.evaluate(()=>{ const rows=[]; for(let s=0;s<4;s++){ const res=makeResidents(TOURS.t1, 1000+s*77); const fl=[];
   for(let f=5;f>=1;f--){ fl.push(f+': '+[1,2,3,4].map(d=>{const r=res[(f-1)*4+d]; return r? r.arch+'('+r.v+')':'ME';}).join(' ')); } rows.push(fl.join('\n')); }
   const res=makeResidents(TOURS.t1, 5); const apas=Object.values(res).filter(r=>r.arch==='apa');
   const greets=apas.map(r=>{ const v=r.A.lines.greet; return r.name+': '+L(v[r.v%v.length]); });
   return rows.join('\n---\n')+'\n'+greets.join('\n'); });
 console.log(out, errs); await b.close(); })();
