/* Navegação entre telas, botão de som e registro do service worker. */
(function () {
  'use strict';

  var TELAS = ['menu', 'colorir', 'desviar'];
  var atual = null;

  // Cada jogo se registra aqui e recebe entrar()/sair() quando a tela abre/fecha.
  window.Jogos = window.Jogos || {};

  function telaDoHash() {
    var nome = (location.hash || '').replace(/^#\/?/, '');
    return TELAS.indexOf(nome) >= 0 ? nome : 'menu';
  }

  function mostrar(nome) {
    if (nome === atual) return;
    var anterior = atual;
    if (anterior && window.Jogos[anterior] && window.Jogos[anterior].sair) window.Jogos[anterior].sair();
    TELAS.forEach(function (t) {
      document.getElementById('tela-' + t).hidden = (t !== nome);
    });
    atual = nome;
    if (window.Jogos[nome] && window.Jogos[nome].entrar) window.Jogos[nome].entrar();
  }

  function ir(nome) {
    location.hash = nome === 'menu' ? '#/' : '#/' + nome;
  }

  document.addEventListener('click', function (ev) {
    var alvo = ev.target.closest('[data-ir]');
    if (!alvo) return;
    Som.liberar();
    var destino = alvo.getAttribute('data-ir');
    Som.tocar(destino === 'menu' ? 'voltar' : 'abrir');
    ir(destino);
  });

  window.addEventListener('hashchange', function () { mostrar(telaDoHash()); });

  // Botão de som
  var btnSom = document.getElementById('btn-som');
  function pintarSom() {
    var mudo = Som.estaMudo();
    btnSom.setAttribute('aria-pressed', mudo ? 'true' : 'false');
    btnSom.setAttribute('aria-label', mudo ? 'Som desligado' : 'Som ligado');
  }
  btnSom.addEventListener('click', function () {
    Som.liberar();
    Som.definirMudo(!Som.estaMudo());
    pintarSom();
    Som.tocar('toque');
  });
  pintarSom();

  // Primeiro toque em qualquer lugar libera o áudio (exigência de Android/iOS)
  window.addEventListener('pointerdown', Som.liberar, { once: true });

  // Evita zoom por gesto de pinça e menu de contexto em toque longo
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  mostrar(telaDoHash());

  // PWA offline
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* sem SW (ex.: file://) o jogo segue online */ });
    });
  }
})();
