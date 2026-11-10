/* UI: tabs, forms, budgets, PWA install and offline. */
(()=>{
const {store:S,u,charts:C,COL}=NX;
const $=s=>document.querySelector(s),e=u.esc,M=u.money;
const st={tab:'home',view:'overview',filter:'all',q:'',chat:[]};
NX.close=()=>$('#dlg').close();
NX.toast=(m,label,fn)=>{const t=$('#toast');t.innerHTML=e(m)+(label?` <button class="undo">${e(label)}</button>`:'');t.classList.add('show');t.classList.toggle('act',!!label);
  if(label)t.querySelector('button').onclick=()=>{fn();t.classList.remove('show')};
  clearTimeout(NX.toast.t);NX.toast.t=setTimeout(()=>t.classList.remove('show'),label?5000:2200)};

const base=()=>st.filter==='all'?S.tx:S.tx.filter(t=>t.date.startsWith(st.filter));
const statsHTML=a=>{const s=u.stats(a);return`<div class="stats"><div class="stat"><span>Income</span><b class="in">${M(s.i)}</b></div><div class="stat"><span>Expense</span><b class="ex">${M(s.e)}</b></div><div class="stat"><span>Balance</span><b>${M(s.b)}</b></div></div>`};
const row=t=>`<div class="tx ${t.type}"><div><b class="${t.type==='income'?'in':'ex'}">${t.type==='income'?'+':'−'} ${M(t.amount)}</b><br><small>${e(t.category)} · ${t.date}${t.note?' · '+e(t.note):''}</small></div><button class="ed" onclick="NX.edit('${t.id}')">Edit</button><button class="del" onclick="NX.del('${t.id}')">Delete</button></div>`;
function listHTML(){
  const q=st.q.toLowerCase(),a=u.sorted(base()).filter(t=>!q||(t.category+' '+t.note).toLowerCase().includes(q));
  if(a.length)return a.map(row).join('');
  return S.tx.length?`<div class="empty card"><h3>No matches</h3><p>Try a different search or month.</p></div>`:`<div class="empty card"><h3>No transactions yet</h3><p>Tap “+ Add” to record your first income or expense, or import a backup from the Me tab.</p></div>`}

function home(){
  const a=base(),ms=u.months();
  let h=`<header><div><h1>Expense Tracker</h1><small>${a.length} transactions</small></div><div class="hb">${NX.deferred?'<button class="ghost" onclick="NX.install()">Install</button>':''}<button class="btn" onclick="NX.add()">+ Add</button></div></header>
  <div class="chips"><button class="chip ${st.filter==='all'?'on':''}" onclick="NX.setF('all')">All</button>${ms.map(m=>`<button class="chip ${st.filter===m?'on':''}" onclick="NX.setF('${m}')">${u.mname(m)}</button>`).join('')}</div>
  <div class="seg"><button class="${st.view==='overview'?'on':''}" onclick="NX.setV('overview')">Overview</button><button class="${st.view==='category'?'on':''}" onclick="NX.setV('category')">Category</button></div>`;
  if(st.view==='overview')return h+statsHTML(a)+`<input id="sq" type="search" placeholder="Search category or note" value="${e(st.q)}" aria-label="Search transactions" style="margin-bottom:10px" oninput="NX.setQ(this.value)"><div id="txl">${listHTML()}</div>`;
  const cats=u.byCat(a),tot=cats.reduce((s,c)=>s+c[1],0);
  h+=tot?`<div class="card">${C.donut(cats,tot,'Total spent')}${cats.map(([k,v],i)=>`<div class="leg"><span class="dot" style="background:${COL[i%COL.length]}"></span><span>${e(k)}</span><span>${M(v)}</span><em>${(v/tot*100).toFixed(1)}%</em></div>`).join('')}</div>`:`<div class="empty card"><h3>No expenses to chart</h3><p>Add an expense to see where your money goes.</p></div>`;
  const pm=st.filter==='all'?ms[0]:st.filter,bk=Object.keys(S.budgets);
  h+=`<div class="card"><div class="row" style="align-items:center"><h3>Budgets${pm?' · '+u.mname(pm):''}</h3><button class="ghost" style="flex:0;white-space:nowrap" onclick="NX.budgets()">Set budgets</button></div>`;
  h+=bk.length&&pm?bk.map(c=>{const sp=u.spentIn(pm,c),l=S.budgets[c],p=Math.min(sp/l*100,100);return`<div style="margin-top:12px"><div class="bl"><span>${e(c)}</span><span class="${sp>l?'ex':''}">${M(sp)} / ${M(l)}</span></div><div class="bar ${sp>l?'over':''}" style="margin-bottom:0"><i style="width:${p}%"></i></div></div>`}).join(''):`<p class="hint">Set a monthly limit for a category and track it here.</p>`;
  return h+'</div>'}

function history(){
  const ms=u.months();
  return`<header><div><h1>History</h1><small>${S.tx.length} transactions</small></div><button class="ghost" onclick="NX.exportMenu()">Export</button></header>${statsHTML(S.tx)}`+
  (ms.length?`<div class="card"><h3>Last 6 months</h3>${C.trend(S.tx)}</div>`+ms.map(m=>{const a=S.tx.filter(t=>t.date.startsWith(m)),s=u.stats(a);
  return`<button class="card month" onclick="NX.setF('${m}');NX.go('home')"><div><h3>${u.mname(m)}</h3><small class="hint">${a.length} transactions</small></div><div style="text-align:right"><div class="in">+ ${M(s.i)}</div><div class="ex">− ${M(s.e)}</div><span class="pill ${s.b<0?'neg':''}">${M(s.b)}</span></div></button>`}).join(''):`<div class="empty card"><h3>No history yet</h3><p>Monthly summaries appear once you add transactions.</p></div>`)}

function explore(){
  const m=u.months()[0];
  return`<header><div><h1>Smart Advisor</h1><small>Answers from your own data. Nothing leaves this device.</small></div></header>
  <div class="chips">${['Summary','Food spending','Transport','50/30/20 rule','Budgets','How can I save?'].map(x=>`<button class="chip" onclick="NX.ask('${x}')">${x}</button>`).join('')}</div>
  <div class="card"><div class="chat" id="chat">${st.chat.length?st.chat.map(c=>`<div class="msg ${c.r}">${e(c.t)}</div>`).join(''):`<div class="msg ai">Ask about ${m?u.mname(m):'your spending'}: a summary, food or transport costs, budgets, the 50/30/20 rule, or ways to save.</div>`}</div>
  <form class="row" onsubmit="event.preventDefault();NX.ask(this.q.value);this.q.value=''"><input name="q" placeholder="Ask about your spending" autocomplete="off" aria-label="Ask the advisor"><button class="btn" style="flex:0">Ask</button></form></div>${NX.stmtCard()}`}

const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
function me(){
  const p=S.prof,ini=(p.name||'You').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const inst=standalone()?'<p class="hint">Installed. Works offline.</p>':NX.deferred?'<button class="btn" onclick="NX.install()">Install app</button>':'<p class="hint">Chrome or Edge: use the install icon in the address bar. iPhone: tap Share, then Add to Home Screen.</p>';
  return`<header><div><h1>Profile</h1><small>Stored only in this browser</small></div></header>
  <div class="card row" style="align-items:center"><div style="flex:0;min-width:56px;height:56px;border-radius:50%;display:grid;place-content:center;background:linear-gradient(120deg,var(--cy),var(--vi));color:#05061a;font:800 18px var(--font-d)">${e(ini)}</div><div><h3>${e(p.name||'Your name')}</h3><small class="hint">Member since ${u.mname(p.since)}</small></div></div>
  <div class="card"><h3>Personal details</h3><label for="pn">Full name</label><input id="pn" value="${e(p.name)}"><label for="pp">Phone (optional)</label><input id="pp" value="${e(p.phone)}" placeholder="For your own reference"><label for="pc">Currency</label><select id="pc">${Object.keys(NX.CUR).map(c=>`<option ${c===p.cur?'selected':''}>${c}</option>`).join('')}</select><br><button class="btn" onclick="NX.saveProf()">Save changes</button></div>
  <div class="card"><h3>Install and offline</h3><p class="hint">Add this app to your home screen. It works without internet once loaded.</p>${inst}</div>
  <div class="card"><h3>Your data</h3><p class="hint">${p.lastBackup?'Last backup: '+p.lastBackup:'No backup yet. Browser data can be cleared, so export now and then.'}</p><div class="row"><button class="ghost" onclick="NX.exportMenu()">Export</button><button class="ghost" onclick="document.getElementById('file').click()">Import</button></div><br><button class="del" onclick="NX.wipe()">Delete all data</button></div>`}

const TABS=[['home','◈','Home',home],['history','▦','History',history],['explore','✦','Advisor',explore],['me','◉','Me',me]];
NX.render=()=>{
  $('#app').innerHTML=TABS.find(t=>t[0]===st.tab)[3]();
  $('#nav').innerHTML=TABS.map(t=>`<button class="${t[0]===st.tab?'on':''}" ${t[0]===st.tab?'aria-current="page"':''} onclick="NX.go('${t[0]}')"><i>${t[1]}</i>${t[2]}</button>`).join('');
  const c=$('#chat');if(c)c.scrollTop=c.scrollHeight};
NX.go=t=>{st.tab=t;NX.render();scrollTo(0,0)};
NX.setF=f=>{st.filter=f;NX.render()};NX.setV=v=>{st.view=v;NX.render()};
NX.setQ=v=>{st.q=v;$('#txl').innerHTML=listHTML()};
NX.del=id=>{const t=S.remove(id);if(!t)return;NX.render();NX.toast('Transaction deleted','Undo',()=>{S.restore(t);NX.render()})};
NX.ask=q=>{q=q.trim();if(!q)return;st.chat.push({r:'me',t:q},{r:'ai',t:NX.advise(q)});NX.render()};
NX.saveProf=()=>{S.prof.name=$('#pn').value.trim();S.prof.phone=$('#pp').value.trim();S.prof.cur=$('#pc').value;S.save();NX.render();NX.toast('Saved')};
NX.wipe=()=>{if(confirm('Delete every transaction, budget and your profile on this device? Export first if unsure.')){S.reset();st.filter='all';NX.render();NX.toast('All data deleted')}};

NX.add=()=>form();NX.edit=id=>form(id);
NX.setType=t=>{$('#dlg').dataset.type=t;$('#te').classList.toggle('on',t==='expense');$('#ti').classList.toggle('on',t==='income')};
function form(id){
  const t=id?S.tx.find(x=>x.id===id):null,d=$('#dlg'),ty=t?t.type:'expense';d.dataset.type=ty;
  d.innerHTML=`<form id="af"><h3>${t?'Edit':'Add'} transaction</h3>
  <div class="seg" style="margin-top:12px"><button type="button" id="te" class="${ty==='expense'?'on':''}" onclick="NX.setType('expense')">Expense</button><button type="button" id="ti" class="${ty==='income'?'on':''}" onclick="NX.setType('income')">Income</button></div>
  <label for="am">Amount</label><input id="am" type="number" min="0.01" step="0.01" required inputmode="decimal" value="${t?t.amount:''}">
  <label for="ct">Category</label><input id="ct" list="cl" required placeholder="Food, Salary, Rent…" value="${t?e(t.category):''}"><datalist id="cl">${[...new Set(S.tx.map(x=>x.category))].map(c=>`<option value="${e(c)}">`).join('')}</datalist>
  <div class="row"><div><label for="dt">Date</label><input id="dt" type="date" required value="${t?t.date:u.today()}"></div><div><label for="nt">Note</label><input id="nt" placeholder="Optional" value="${t?e(t.note):''}"></div></div>
  <div class="row" style="margin-top:16px"><button type="button" class="ghost" onclick="NX.close()">Cancel</button><button class="btn">${t?'Save':'Add'}</button></div></form>`;
  d.showModal();
  $('#af').onsubmit=ev=>{ev.preventDefault();const amount=parseFloat($('#am').value);if(!(amount>0))return NX.toast('Enter an amount above 0');
    const p={type:d.dataset.type,amount,category:$('#ct').value.trim()||'Other',date:$('#dt').value,note:$('#nt').value.trim()};
    const ok=t?S.update(t.id,p):S.add(p);d.close();NX.render();NX.toast(ok?(t?'Saved':'Added'):'Could not save. Browser storage is full or blocked.')}}

NX.budgets=()=>{
  const d=$('#dlg'),cats=[...new Set([...u.byCat(S.tx).map(c=>c[0]),...Object.keys(S.budgets)])];
  d.innerHTML=`<form id="bf"><h3>Monthly budgets</h3><p class="hint">Set a monthly limit per category. Clear a field to remove its budget.</p>${cats.map(c=>`<label>${e(c)}<input data-c="${e(c)}" type="number" min="0" step="1" value="${S.budgets[c]||''}"></label>`).join('')}
  <label>New category</label><div class="row"><input id="nc" placeholder="Category"><input id="nl" type="number" min="0" placeholder="Limit"></div>
  <div class="row" style="margin-top:16px"><button type="button" class="ghost" onclick="NX.close()">Cancel</button><button class="btn">Save budgets</button></div></form>`;
  d.showModal();
  $('#bf').onsubmit=ev=>{ev.preventDefault();
    d.querySelectorAll('[data-c]').forEach(i=>{const v=parseFloat(i.value);if(v>0)S.budgets[i.dataset.c]=v;else delete S.budgets[i.dataset.c]});
    const nc=$('#nc').value.trim(),nl=parseFloat($('#nl').value);if(nc&&nl>0)S.budgets[nc]=nl;
    S.save();d.close();NX.render();NX.toast('Budgets saved')}};

/* PWA: install prompt, offline notices, service worker */
addEventListener('beforeinstallprompt',ev=>{ev.preventDefault();NX.deferred=ev;NX.render()});
addEventListener('appinstalled',()=>{NX.deferred=null;NX.render();NX.toast('Installed')});
NX.install=async()=>{if(!NX.deferred)return;NX.deferred.prompt();await NX.deferred.userChoice;NX.deferred=null;NX.render()};
addEventListener('offline',()=>NX.toast('You are offline. Everything still works.'));
addEventListener('online',()=>NX.toast('Back online'));
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
NX.render();
})();
