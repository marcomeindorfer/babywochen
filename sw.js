/* Service Worker: nötig für die Installation als App und damit sie auch ohne Netz startet.
   Erst Netz, dann Cache - so kommt ein Update beim nächsten Öffnen sofort an.
   Firebase (andere Adresse) läuft nie über den Cache. */
const CACHE="babywochen-v4";
const DATEIEN=["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{/* Jede Datei einzeln: fehlt eine, scheitert nicht gleich die ganze Installation */
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(DATEIEN.map(d=>c.add(d)))).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys()
  .then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin) return;
  e.respondWith(fetch(e.request).then(res=>{
    const kopie=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,kopie)); return res;
  }).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
});

/* Erinnerung zum Wochenstart: kommt vom GitHub-Job (.github/workflows/wochenstart.yml) */
self.addEventListener("push",e=>{
  let d={}; try{ d=e.data?e.data.json():{}; }catch(err){ d={body:e.data?e.data.text():""}; }
  e.waitUntil(self.registration.showNotification(d.title||"Babywochen-Kompass",{
    body:d.body||"", icon:"icon-192.png", badge:"icon-192.png", tag:d.tag||"wochenstart",
    data:{url:d.url||"./"}}));
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  const ziel=new URL((e.notification.data&&e.notification.data.url)||"./",self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(liste=>{
    const offen=liste.find(c=>c.url.startsWith(self.registration.scope));
    if(offen) return offen.navigate(ziel).then(c=>(c||offen).focus()).catch(()=>offen.focus());
    return self.clients.openWindow(ziel);
  }));
});
