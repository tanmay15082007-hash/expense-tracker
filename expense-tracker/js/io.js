/* Export and import: JSON (full backup), CSV, Excel. */
(()=>{
const {store:S,u}=NX;const $=s=>document.querySelector(s);
const dl=(n,b)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
NX.exportMenu=()=>{
  if(!S.tx.length)return NX.toast('Nothing to export yet');
  const d=$('#dlg');d.innerHTML=`<h3>Export data</h3><p class="hint">${S.tx.length} transactions</p><div style="display:grid;gap:8px"><button class="btn" onclick="NX.exp('json')">JSON backup (re-importable)</button><button class="ghost" onclick="NX.exp('csv')">CSV</button><button class="ghost" onclick="NX.exp('xlsx')">Excel (.xlsx)</button><button class="ghost" onclick="NX.close()">Close</button></div>`;d.showModal()};
NX.exp=f=>{
  const rows=u.sorted(S.tx).map(t=>({id:t.id,type:t.type,amount:t.amount,category:t.category,date:t.date,note:t.note})),n=`expenses-${u.today()}`;
  if(f==='json')dl(n+'.json',new Blob([JSON.stringify({app:'expense-tracker',profile:S.prof,budgets:S.budgets,transactions:rows},null,2)],{type:'application/json'}));
  else if(f==='csv'){const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;dl(n+'.csv',new Blob([['id,type,amount,category,date,note',...rows.map(r=>[r.id,r.type,r.amount,r.category,r.date,r.note].map(q).join(','))].join('\n')],{type:'text/csv'}))}
  else{if(!window.XLSX)return NX.toast('Excel library not loaded yet. Connect once, or use CSV.');const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'Transactions');XLSX.writeFile(wb,n+'.xlsx')}
  S.prof.lastBackup=u.today();S.save();$('#dlg').close();NX.render();NX.toast('Exported')};
function parseCSV(t){const r=[];let row=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}else if(ch==='"')q=true;else if(ch===','){row.push(c);c=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;row.push(c);c='';if(row.some(x=>x!==''))r.push(row);row=[]}else c+=ch}
  row.push(c);if(row.some(x=>x!==''))r.push(row);const h=(r.shift()||[]).map(x=>x.trim().toLowerCase());return r.map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])))}
function norm(r){
  const o={};Object.keys(r).forEach(k=>o[k.toLowerCase().trim()]=r[k]);
  let d=o.date;if(typeof d==='number'&&window.XLSX){const p=XLSX.SSF.parse_date_code(d);d=`${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`}
  d=String(d||'').slice(0,10);const amount=Math.abs(parseFloat(o.amount));
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!(amount>0))return null;
  return{id:String(o.id||'').replace(/[^\w-]/g,'')||u.uid(),type:String(o.type||'').toLowerCase().startsWith('inc')?'income':'expense',amount,category:String(o.category||'Other'),date:d,note:String(o.note||'')}}
$('#file').onchange=async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{let rows;const n=f.name.toLowerCase();
    if(n.endsWith('.json')){const j=JSON.parse(await f.text());rows=Array.isArray(j)?j:j.transactions;if(!Array.isArray(j)){if(j.budgets)S.budgets={...S.budgets,...j.budgets};if(j.profile&&!S.prof.name)S.prof={...S.prof,...j.profile}}}
    else if(n.endsWith('.csv'))rows=parseCSV(await f.text());
    else{if(!window.XLSX)return NX.toast('Excel library not loaded. Use CSV or JSON.');const wb=XLSX.read(await f.arrayBuffer());rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])}
    const ids=new Set(S.tx.map(t=>t.id));let add=0,skip=0;
    (rows||[]).forEach(r=>{const t=norm(r);if(!t||ids.has(t.id)){skip++;return}ids.add(t.id);S.tx.push(t);add++});
    S.save();NX.render();NX.toast(`Imported ${add} transactions${skip?`, skipped ${skip}`:''}`)
  }catch{NX.toast('Could not read that file. Use a JSON, CSV or Excel export.')}};
})();
