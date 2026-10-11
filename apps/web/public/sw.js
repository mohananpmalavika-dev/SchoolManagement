const CACHE='hustlertech-static-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/hustlertech-logo.png','/offline.html'])));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('hustlertech-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request;const url=new URL(request.url);
 // Never retain authenticated pages, API responses, or user records in shared browser caches.
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||request.headers.has('Authorization'))return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match('/offline.html')));return;}
 if(url.pathname!=='/hustlertech-logo.png'&&!url.pathname.startsWith('/_next/static/'))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response;}));
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
