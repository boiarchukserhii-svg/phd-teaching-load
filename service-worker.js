const CACHE='phd-teaching-load-shell-v21-program-hours-accents-20261015';
const SHELL=['./','./index.html','./styles.css?v=21','./data.js?v=21','./app.js?v=21','./manifest.webmanifest','./nubip-logo.png','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('phd-teaching-load-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 const navigation=request.mode==='navigate',key=navigation?'./index.html':request;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(request,{cache:'no-store'});
   if(response.ok){await cache.put(key,response.clone());return response;}
   return (await cache.match(key))||response;
  }catch{return (await cache.match(key))||Response.error();}
 })());
});



















