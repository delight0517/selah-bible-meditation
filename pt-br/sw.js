const CACHE="selah-shell-pt-br-v2";
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(["./","./reader.js","./manifest.json","../fil/analytics.js"])).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET"||new URL(event.request.url).origin!==location.origin)return;event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request)).then(cached=>cached||caches.open("selah-bible-pt-br").then(cache=>cache.match(event.request))).then(cached=>cached||fetch(event.request)))});
