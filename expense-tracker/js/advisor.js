/* Rule-based advisor. Runs on-device against your own data. */
(()=>{
const {store:S,u}=NX;
const NEEDS=/rent|wifi|internet|bill|grocer|medic|dentist|doctor|taxi|transport|fuel|bus|metro|electric|water|insur|school|fee|emi|loan/i;
NX.advise=q=>{
  q=q.toLowerCase();
  if(!S.tx.length)return'Add a few transactions first, then ask me again.';
  const m=u.months()[0],a=S.tx.filter(t=>t.date.startsWith(m)),s=u.stats(a),cats=u.byCat(a),M=u.money;
  const catSum=re=>a.filter(t=>t.type==='expense'&&re.test(t.category)).reduce((x,t)=>x+t.amount,0);
  const needs=a.filter(t=>t.type==='expense'&&NEEDS.test(t.category)).reduce((x,t)=>x+t.amount,0),wants=s.e-needs,sav=Math.max(s.i-s.e,0);
  const pc=v=>s.i?Math.round(v/s.i*100)+'%':'n/a';
  if(/budget|limit/.test(q)){
    const k=Object.keys(S.budgets);if(!k.length)return'You have not set budgets yet. Go to Home, open Category, then tap Set budgets.';
    return`Budgets for ${u.mname(m)}:\n`+k.map(c=>{const sp=u.spentIn(m,c),l=S.budgets[c];return`${c}: ${M(sp)} of ${M(l)} ${sp>l?'(over by '+M(sp-l)+')':'('+Math.round(sp/l*100)+'% used)'}`}).join('\n')}
  if(/food|eat|pizza|burger|canteen|coffee|drink/.test(q)){const f=catSum(/food|pizza|burger|canteen|coffee|drink|lunch|dinner|snack|cafe/i);return`Food and drinks in ${u.mname(m)}: ${M(f)}${s.e?' ('+Math.round(f/s.e*100)+'% of your spending)':''}.`}
  if(/transport|taxi|travel|fuel|bus/.test(q))return`Transport in ${u.mname(m)}: ${M(catSum(/taxi|transport|fuel|bus|metro|travel|cab/i))}.`;
  if(/50|rule|need|want/.test(q))return`50/30/20 check for ${u.mname(m)}:\nNeeds: ${M(needs)} (${pc(needs)}, target 50%)\nWants: ${M(wants)} (${pc(wants)}, target 30%)\nSavings: ${M(sav)} (${pc(sav)}, target 20%)`;
  if(/save|saving|reduce|cut/.test(q)){const top=cats.find(c=>!NEEDS.test(c[0]));return top?`Your biggest flexible expense is “${top[0]}” at ${M(top[1])}. Trimming it by 20% would save ${M(top[1]*.2)} a month.`:'Most of your spending is on needs, so there is little to trim.'}
  return`${u.mname(m)} summary:\nIncome ${M(s.i)}, expenses ${M(s.e)}, balance ${M(s.b)}.\nTop category: ${cats[0]?cats[0][0]+' ('+M(cats[0][1])+')':'none yet'}.\n${s.b<0?'You spent more than you earned this month.':'You are within budget this month.'}`};
})();
