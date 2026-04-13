const CACHE_NAME = 'sampcount-v1';
const urlsToCache = [
  './SampCount.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// Service Workerをインストールし、必要なファイルをキャッシュに保存
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// オフライン時でもキャッシュからレスポンスを返すようにする
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュ内に該当データがあればそれを返す（オフライン対応）
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
