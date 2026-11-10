const CACHE='expense-tracker-v3';
const CORE=['./','index.html','manifest.json','css/nexus-ui.css','css/variables.css','css/base.css','css/layout.css','css/components.css','css/effects.css','js/store.js','js/statement.js','js/charts.js','js/advisor.js','js/io.js','js/app.js','assets/icons/icon.svg','assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/apple-touch-icon.png','assets/icons/favicon-32.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// Stale-while-revalidate: instant from cache, refreshed in the background (fonts and the Excel library get cached on first use).
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(c=>{
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(CACHE).then(x=>x.put(r,cp))}return res}).catch(()=>c||(r.mode==='navigate'?caches.match('index.html'):Response.error()));
    return c||net}))});
