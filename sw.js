const CACHE = 'oskar-uiuii-2fb40-clean-cache-20260520-v1';
const ASSETS = ["icon.svg", "index.html", "manifest.webmanifest", "oskar-core-fix.js", "oskar-mobile-app-polish.js", "qr.mp3", "إدارة-الحسابات.html", "إضافة-المصاريف.html", "إضافة-صنف.html", "إضافة-مبيعات.html", "إضافة-مشتريات.html", "إعدادات-الباركود.html", "استيراد-العملاء-والموردين.html", "استيراد-بيانات-الأصناف.html", "استيراد-بيانات-المبيعات.html", "استيراد-كميات-افتتاحية.html", "الأجور.html", "الأكثر-مبيعا.html", "الإعدادات.html", "الديون.html", "الشحن-والتوصيل.html", "العملاء.html", "الفواتير.html", "الكاشير.html", "المخزون-التالف.html", "الموردين.html", "الموظفين.html", "تحديث-الأسعار.html", "تحويل-مالي.html", "تقرير-الأرباح.html", "تقرير-الحسابات.html", "تقرير-الديون.html", "تقرير-العملاء-والموردين.html", "تقرير-المبيعات-مفصل.html", "تقرير-المخزون.html", "تقرير-المشتريات.html", "تقرير-المصاريف.html", "تقرير-مناوبة-الموظفين.html", "حركات-الأصناف.html", "خصومات-ترويجية.html", "سجل-الحسابات.html", "سجل-الكاشير.html", "سجل-المشتريات.html", "سجل-نشاطات-الموظفين.html", "شروحات.html", "شكل-الفاتورة.html", "ضمانات-الأصناف.html", "طابعات-الإيصالات.html", "طباعة-الملصقات.html", "عروض-الأسعار.html", "فئات-المصاريف.html", "فروع-مخازن.html", "قائمة-المصاريف.html", "كاميرا-الكاشير.html", "كل-الأصناف.html", "كل-المبيعات.html", "كل-المشتريات.html", "لوحة-المتابعة.html", "ماركات-الأصناف.html", "متغيرات-الأصناف.html", "مجموعات-الأسعار.html", "مجموعات-الأصناف.html", "مجموعات-العملاء.html", "مرجع-المبيعات.html", "مرجع-المشتريات.html", "مسودات-البيع.html", "مطعم-الحجوزات.html", "مطعم-الطاولات.html", "مطعم-المطبخ.html", "مطعم-المنيو-الرقمي.html", "مطعم-الوصفات-والتكلفة.html", "مطعم-تحليلات-الأرباح.html", "مطعم-كاشير-المطعم.html", "مطعم-مخزون-المطعم.html", "معدلات-الضرائب.html", "نقل-مخزني.html", "وحدات-الأصناف.html"];
const NETWORK_ONLY_HOSTS = ['firebaseio.com','googleapis.com','gstatic.com','firebaseapp.com'];
const NETWORK_FIRST_EXT = ['.html','.js','.json','.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      await Promise.allSettled(ASSETS.map(url => cache.add(new Request(url, { cache: 'reload' }))));
    } catch(e) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch(e) {}
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if(event.data && event.data.type === 'CLEAR_OSKAR_CACHE') {
    event.waitUntil((async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      } catch(e) {}
    })());
  }
});

function sameOrigin(req) {
  try { return new URL(req.url).origin === self.location.origin; } catch(e) { return false; }
}
function isFirebaseOrExternal(req) {
  try {
    const u = new URL(req.url);
    return req.method !== 'GET' || NETWORK_ONLY_HOSTS.some(h => u.hostname.includes(h));
  } catch(e) { return true; }
}
function isCriticalAppFile(req) {
  try {
    const u = new URL(req.url);
    const p = u.pathname.toLowerCase();
    if(p.endsWith('/sw.js') || p.endsWith('/firebase.js') || p.endsWith('/firebase-config.js')) return true;
    return NETWORK_FIRST_EXT.some(ext => p.endsWith(ext));
  } catch(e) { return true; }
}
async function putCache(req, res) {
  try {
    if(res && res.ok && sameOrigin(req)) {
      const c = await caches.open(CACHE);
      await c.put(req, res.clone());
    }
  } catch(e) {}
}
async function networkOnly(req) {
  return fetch(req, { cache: 'no-store' });
}
async function networkFirst(req) {
  try {
    const res = await fetch(req, { cache: 'no-store' });
    await putCache(req, res);
    return res;
  } catch(e) {
    const cached = await caches.match(req, { ignoreSearch: true });
    if(cached) return cached;
    if(req.mode === 'navigate') return caches.match('index.html', { ignoreSearch: true }) || Response.error();
    return Response.error();
  }
}
async function cacheFirst(req) {
  const cached = await caches.match(req, { ignoreSearch: true });
  if(cached) return cached;
  const res = await fetch(req);
  await putCache(req, res);
  return res;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if(isFirebaseOrExternal(req)) { event.respondWith(networkOnly(req)); return; }
  if(req.mode === 'navigate' || isCriticalAppFile(req)) { event.respondWith(networkFirst(req)); return; }
  event.respondWith(cacheFirst(req));
});
