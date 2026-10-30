/* Service worker: guarda tudo no aparelho para funcionar sem internet.
   Ao mudar qualquer arquivo do app, aumente a VERSAO para os aparelhos atualizarem. */
var VERSAO = 'joguinhos-v4';

var ARQUIVOS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'css/colorir.css',
  'css/desviar.css',
  'js/som.js',
  'js/app.js',
  'js/icones.js',
  'js/colorir.js',
  'js/desviar.js',
  'js/desenhos/motor.js',
  'js/desenhos/dinos.js',
  'js/desenhos/gatos.js',
  'js/desenhos/caes.js',
  'js/desenhos/herois.js',
  'js/desenhos/bichinhos.js',
  'js/desenhos/natureza.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];

self.addEventListener('install', function (ev) {
  ev.waitUntil(caches.open(VERSAO).then(function (c) { return c.addAll(ARQUIVOS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(nomes.filter(function (n) { return n !== VERSAO; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Cache primeiro; o que não estiver guardado vem da rede e é guardado para a próxima vez.
self.addEventListener('fetch', function (ev) {
  if (ev.request.method !== 'GET') return;
  ev.respondWith(
    caches.match(ev.request).then(function (achado) {
      if (achado) return achado;
      return fetch(ev.request).then(function (resp) {
        if (resp && resp.ok && new URL(ev.request.url).origin === self.location.origin) {
          var copia = resp.clone();
          caches.open(VERSAO).then(function (c) { c.put(ev.request, copia); });
        }
        return resp;
      });
    })
  );
});
