/* Service worker: guarda tudo no aparelho para funcionar sem internet.
   Ao mudar qualquer arquivo do app, aumente a VERSAO para os aparelhos atualizarem. */
var VERSAO = 'joguinhos-v8';

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
  'js/desenhos/unicornios.js',
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

// Rede primeiro (assim as novidades chegam logo, sem precisar limpar nada);
// sem internet, ou se a rede demorar demais, usa o que está guardado no aparelho.
function comTempo(promessa, ms) {
  return new Promise(function (ok, erro) {
    var t = setTimeout(function () { erro(new Error('demorou')); }, ms);
    promessa.then(function (r) { clearTimeout(t); ok(r); }, function (e) { clearTimeout(t); erro(e); });
  });
}

self.addEventListener('fetch', function (ev) {
  if (ev.request.method !== 'GET') return;
  if (new URL(ev.request.url).origin !== self.location.origin) return;
  ev.respondWith(
    comTempo(fetch(ev.request, { cache: 'no-cache' }), 4000).then(function (resp) {
      if (resp && resp.ok) {
        var copia = resp.clone();
        caches.open(VERSAO).then(function (c) { c.put(ev.request, copia); });
      }
      return resp;
    }).catch(function () {
      return caches.match(ev.request).then(function (achado) { return achado || caches.match('index.html'); });
    })
  );
});
