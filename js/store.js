/* Data layer: everything lives in localStorage. No servers, no accounts. */
window.NX=window.NX||{};
(()=>{
const CUR={INR:'₹',USD:'$',EUR:'€',GBP:'£'};
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const today=()=>new Date().toISOString().slice(0,10);
const S={
  tx:get('nx_tx',[]),
  prof:get('nx_profile',{name:'',phone:'',cur:'INR',since:today().slice(0,7)}),
  budgets:get('nx_budgets',{}),
  save(){return [put('nx_tx',S.tx),put('nx_profile',S.prof),put('nx_budgets',S.budgets)].every(Boolean)},
  add(t){S.tx.push({id:u.uid(),...t});return S.save()},
  update(id,p){const t=S.tx.find(x=>x.id===id);if(t)Object.assign(t,p);return S.save()},
  remove(id){const i=S.tx.findIndex(x=>x.id===id);if(i<0)return null;const[t]=S.tx.splice(i,1);S.save();return t},
  restore(t){S.tx.push(t);S.save()},
  reset(){S.tx=[];S.budgets={};S.prof={name:'',phone:'',cur:'INR',since:today().slice(0,7)};S.save()}
};
const u={
  today,
  esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  uid:()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7),
  sym:()=>CUR[S.prof.cur]||'',
  money:n=>u.sym()+Number(n).toFixed(2),
  months:(a=S.tx)=>[...new Set(a.map(t=>t.date.slice(0,7)))].sort().reverse(),
  mname:m=>new Date(m+'-01T00:00').toLocaleString('en',{month:'long',year:'numeric'}),
  sum:(a,ty)=>a.filter(t=>t.type===ty).reduce((s,t)=>s+t.amount,0),
  stats:a=>{const i=u.sum(a,'income'),e=u.sum(a,'expense');return{i,e,b:i-e}},
  sorted:a=>[...a].sort((x,y)=>y.date.localeCompare(x.date)||y.id.localeCompare(x.id)),
  byCat:a=>{const m={};a.filter(t=>t.type==='expense').forEach(t=>{const k=t.category.trim()||'Other';m[k]=(m[k]||0)+t.amount});return Object.entries(m).sort((x,y)=>y[1]-x[1])},
  spentIn:(m,cat)=>S.tx.filter(t=>t.type==='expense'&&t.date.startsWith(m)&&t.category.toLowerCase()===cat.toLowerCase()).reduce((s,t)=>s+t.amount,0)
};
NX.store=S;NX.u=u;NX.CUR=CUR;
})();
