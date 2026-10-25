/* Service Worker: nötig für die Installation als App und damit sie auch ohne Netz startet.
   Erst Netz, dann Cache - so kommt ein Update beim nächsten Öffnen sofort an.
   Firebase (andere Adresse) läuft nie über den Cache. */
const CACHE="babywochen-v1";
const DATEIEN=["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(DATEIEN)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys()
  .then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin) return;
  e.respondWith(fetch(e.request).then(res=>{
    const kopie=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,kopie)); return res;
  }).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
});
