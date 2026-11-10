/* Bank statement analyzer for the Smart Advisor tab.
   Reads a PDF statement in the browser with PDF.js (nothing is uploaded) and summarizes spending. */
(()=>{
const {store:S,u}=NX;const e=u.esc,M=u.money;
const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
let R=null,busy='',err='';
const DATE=/^\d{2}\/\d{2}\/\d{4}$/,NUM=/^[\d,]+\.\d{2}$/;
const iso=d=>d.slice(6)+'-'+d.slice(3,5)+'-'+d.slice(0,2);
const pretty=s=>s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
const hash=s=>{let h=5381;for(const c of s)h=(h*33^c.charCodeAt(0))>>>0;return h.toString(36)};

const loadLib=()=>window.pdfjsLib?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src=PDFJS+'pdf.min.js';s.onload=()=>{pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS+'pdf.worker.min.js';ok()};s.onerror=()=>no(new Error('lib'));document.head.appendChild(s)});

async function readPages(buf){
  let pw;
  for(;;){
    try{
      const doc=await pdfjsLib.getDocument({data:new Uint8Array(buf.slice(0)),password:pw}).promise,pages=[];
      for(let p=1;p<=doc.numPages;p++){const c=await(await doc.getPage(p)).getTextContent();
        pages.push(c.items.filter(i=>i.str.trim()).map(i=>({s:i.str.trim(),x:i.transform[4],y:i.transform[5],w:i.width||0})))}
      return pages;
    }catch(x){
      if(x&&x.name==='PasswordException'){pw=prompt(x.code===2?'Wrong password. Try again:':'This PDF is password protected. Enter the password (it stays on this device):');if(pw===null)throw new Error('cancelled');continue}
      throw x}}}

/* Turns one page of positioned text into transactions. Columns are found from the header row. */
function parsePage(items,cols){
  const c=i=>i.x+i.w/2,clean=s=>s.replace(/[₹\s]/g,'').toLowerCase();
  items.forEach(i=>{const k=clean(i.s);if(['details','debit','credit','balance'].includes(k)&&(!cols[k]||cols.page!==items))cols[k]={c:c(i),y:i.y}});
  if(!cols.debit||!cols.credit||!cols.balance||!cols.details)return[];
  const mid=(cols.details.c+cols.debit.c)/2,dateMax=cols.details.c-60,hy=cols.details.y;
  const body=items.filter(i=>i.y<hy-2&&!/^page\s*no/i.test(i.s));
  const dates=body.filter(i=>DATE.test(i.s)&&i.x<dateMax).sort((a,b)=>b.y-a.y||a.x-b.x);
  const anchors=[];dates.forEach(d=>{if(!anchors.length||Math.abs(anchors[anchors.length-1].y-d.y)>3)anchors.push(d)});
  if(!anchors.length)return[];
  const gaps=anchors.slice(1).map((a,i)=>anchors[i].y-a.y).sort((a,b)=>a-b),med=gaps.length?gaps[gaps.length>>1]:Infinity,lim=med*.7;
  const rows=anchors.map(a=>({a,det:[],num:{}}));
  body.forEach(i=>{
    if(DATE.test(i.s)&&i.x<dateMax)return;
    let best=null,bd=Infinity;rows.forEach(r=>{const d=Math.abs(r.a.y-i.y);if(d<bd){bd=d;best=r}});
    if(!best||bd>lim)return;
    if(NUM.test(i.s)&&c(i)>mid){const k=['debit','credit','balance'].reduce((p,q)=>Math.abs(cols[q].c-c(i))<Math.abs(cols[p].c-c(i))?q:p);best.num[k]=parseFloat(i.s.replace(/,/g,''))}
    else if(i.s!=='-'&&c(i)<mid)best.det.push(i)});
  return rows.map(r=>{
    const s=r.det.sort((a,b)=>b.y-a.y),lines=[];
    s.forEach(i=>{const L=lines[lines.length-1];if(L&&Math.abs(L.y-i.y)<3)L.t.push(i);else lines.push({y:i.y,t:[i]})});
    const details=lines.map(L=>L.t.sort((a,b)=>a.x-b.x).map(i=>i.s).join(' ')).join(' ');
    return{date:iso(r.a.s),details,party:party(details),debit:r.num.debit||0,credit:r.num.credit||0,balance:r.num.balance}
  }).filter(t=>t.debit>0||t.credit>0)}

function party(d){
  const m=d.match(/UPI\/(?:DR|CR)\/\d+\/([^\/]+)/i);
  if(m)return m[1].trim().replace(/\s+/g,' ').toUpperCase();
  const w=d.replace(/^(WDL|DEP)?\s*TFR\s*/i,'').replace(/[\d\/]+/g,' ').split(/\s+/).filter(Boolean).slice(0,3).join(' ');
  return(w||'OTHER').toUpperCase()}

function analyze(t){
  const ex=t.filter(x=>x.debit>0),inc=t.filter(x=>x.credit>0),g={};
  ex.forEach(x=>{const o=g[x.party]=g[x.party]||{name:x.party,sum:0,n:0};o.sum+=x.debit;o.n++});
  const P=Object.values(g),spent=ex.reduce((s,x)=>s+x.debit,0),earned=inc.reduce((s,x)=>s+x.credit,0);
  const ds=t.map(x=>x.date).sort(),from=ds[0],to=ds[ds.length-1],span=Math.round((new Date(to)-new Date(from))/864e5)+1;
  const day={},wk=[0,0,0,0,0,0,0];ex.forEach(x=>{day[x.date]=(day[x.date]||0)+x.debit;wk[new Date(x.date+'T00:00').getDay()]+=x.debit});
  const topDay=Object.entries(day).sort((a,b)=>b[1]-a[1])[0],wi=wk.indexOf(Math.max(...wk));
  const small=ex.filter(x=>x.debit<50);
  return{t,spent,earned,n:t.length,nEx:ex.length,from,to,span,perDay:spent/span,
    byAmt:[...P].sort((a,b)=>b.sum-a.sum),byFreq:[...P].sort((a,b)=>b.n-a.n||b.sum-a.sum),
    biggest:[...ex].sort((a,b)=>b.debit-a.debit)[0],topDay,
    weekday:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][wi],
    small:{n:small.length,sum:small.reduce((s,x)=>s+x.debit,0)},closing:[...t].sort((a,b)=>a.date.localeCompare(b.date)).pop().balance}}

NX.stmtLoad=async f=>{
  if(!f)return;err='';R=null;busy='Reading statement…';NX.render();
  try{
    await loadLib();const pages=await readPages(await f.arrayBuffer()),cols={},all=[];
    pages.forEach(p=>{cols.page=p;all.push(...parsePage(p,cols))});
    if(!all.length)throw new Error('none');
    R=analyze(all);
  }catch(x){err=x.message==='cancelled'?'Cancelled.':x.message==='lib'?'Could not load the PDF reader. Connect to the internet once and try again.':x.message==='none'?'No transactions found. This works with text-based bank PDFs (not scanned photos) that have Debit, Credit and Balance columns.':'Could not read that PDF.'}
  busy='';NX.render()};
NX.stmtClear=()=>{R=null;err='';NX.render()};
NX.stmtImport=()=>{
  if(!R)return;const ids=new Set(S.tx.map(t=>t.id));let n=0;
  R.t.forEach(x=>{const amt=x.debit||x.credit,type=x.debit?'expense':'income',id='bs'+hash(x.date+type+amt+x.details);
    if(ids.has(id))return;ids.add(id);S.tx.push({id,type,amount:amt,category:pretty(x.party),date:x.date,note:'Bank statement'});n++});
  S.save();NX.render();NX.toast(n?`Added ${n} transactions`:'Already imported')};

const list=(a,key)=>{const mx=Math.max(...a.map(x=>x[key]),1);return a.slice(0,6).map(x=>`<div class="bl"><span>${e(pretty(x.name))}</span><span>${key==='n'?x.n+' payments · '+M(x.sum):M(x.sum)+' · '+x.n+'x'}</span></div><div class="bar"><i style="width:${x[key]/mx*100}%"></i></div>`).join('')};
NX.stmtCard=()=>{
  let h=`<div class="card"><h3>Bank statement analysis</h3><p class="hint">Upload your account statement PDF. It is read on this device and never uploaded.</p><input type="file" accept="application/pdf" aria-label="Upload bank statement PDF" onchange="NX.stmtLoad(this.files[0])">`;
  if(busy)h+=`<p class="hint">${busy}</p>`;
  if(err)h+=`<p class="ex" style="margin-top:10px">${e(err)}</p>`;
  if(R){const r=R,pct=v=>Math.round(v/r.spent*100);
    h+=`<div class="stats" style="margin-top:14px"><div class="stat"><span>Spent</span><b class="ex">${M(r.spent)}</b></div><div class="stat"><span>Received</span><b class="in">${M(r.earned)}</b></div><div class="stat"><span>Closing balance</span><b>${M(r.closing)}</b></div></div>
    <p class="hint">${r.from} to ${r.to} · ${r.n} transactions</p>
    <h3 style="margin-top:10px">Where you spent the most</h3>${list(r.byAmt,'sum')}
    <h3>Most frequent payments</h3>${list(r.byFreq,'n')}
    <h3>Insights</h3><div class="msg ai" style="max-width:100%;margin-top:8px">• You spent about ${M(r.perDay)} a day over ${r.span} days.
• ${pretty(r.byAmt[0].name)} took the most money: ${M(r.byAmt[0].sum)} (${pct(r.byAmt[0].sum)}% of spending).
• ${pretty(r.byFreq[0].name)} was paid most often: ${r.byFreq[0].n} times, about ${M(r.byFreq[0].sum/r.byFreq[0].n)} each.
• ${r.small.n} payments were under ${M(50)}, adding up to ${M(r.small.sum)}. Small payments add up quickly.
• Highest-spend day: ${r.topDay[0]} (${M(r.topDay[1])}). You spend most on ${r.weekday}s.
• Biggest single payment: ${M(r.biggest.debit)} to ${pretty(r.biggest.party)} on ${r.biggest.date}.</div>
    <div class="row" style="margin-top:12px"><button class="btn" onclick="NX.stmtImport()">Add to my tracker</button><button class="ghost" onclick="NX.stmtClear()">Clear</button></div>`}
  return h+'</div>'};
NX._stmt={parsePage,party,analyze};
})();
