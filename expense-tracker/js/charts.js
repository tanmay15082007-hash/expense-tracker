/* Inline SVG charts: donut and six-month trend. */
(()=>{
const {u}=NX;
const COL=['#35e0ff','#8a5cff','#3dffb0','#ff5d8f','#ffb938','#5c8aff','#ff8a5c','#c15cff','#5cffe0','#e0ff5c'];
NX.COL=COL;
NX.charts={
  donut(cats,total,label){
    const C=2*Math.PI*40;let acc=0;
    const arcs=cats.map(([k,v],i)=>{const l=v/total*C;const s=`<circle cx="60" cy="60" r="40" fill="none" stroke="${COL[i%COL.length]}" stroke-width="14" stroke-dasharray="${Math.max(l-1.2,.5)} ${C}" stroke-dashoffset="${-acc}" transform="rotate(-90 60 60)"/>`;acc+=l;return s}).join('');
    return`<div class="ring"><svg viewBox="0 0 120 120" role="img" aria-label="Spending by category"><circle cx="60" cy="60" r="40" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="14"/>${arcs}</svg><div class="mid"><small>${label}</small><b>${u.money(total)}</b></div></div>`},
  trend(tx){
    const ms=u.months(tx).slice(0,6).reverse();if(!ms.length)return'';
    const d=ms.map(m=>({m,...u.stats(tx.filter(t=>t.date.startsWith(m)))}));
    const max=Math.max(...d.map(x=>Math.max(x.i,x.e)),1),W=300,bw=14,gap=(W-d.length*(bw*2+4))/(d.length+1);
    const bars=d.map((x,j)=>{const X=gap*(j+1)+j*(bw*2+4),hi=x.i/max*88,he=x.e/max*88;
      return`<rect x="${X}" y="${100-hi}" width="${bw}" height="${hi}" rx="3" style="fill:var(--in)"/><rect x="${X+bw+4}" y="${100-he}" width="${bw}" height="${he}" rx="3" style="fill:var(--ex)"/><text x="${X+bw+2}" y="113">${new Date(x.m+'-01T00:00').toLocaleString('en',{month:'short'})}</text>`}).join('');
    return`<svg class="trend" viewBox="0 0 300 120" role="img" aria-label="Income and expense by month">${bars}</svg><div class="key"><span class="in">■ Income</span><span class="ex">■ Expense</span></div>`}
};
})();
