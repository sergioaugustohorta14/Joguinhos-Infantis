/* Navegação entre telas, botão de som e registro do service worker. */
(function () {
  'use strict';

  var TELAS = ['menu', 'colorir', 'desviar', 'bolinhas', 'basquete'];
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

  // ---------- instalar o app ----------
  // No Android (Chrome) o navegador avisa quando dá para instalar (beforeinstallprompt); no iPhone/iPad
  // e em outros navegadores não há esse aviso, então mostramos o passo a passo.
  var CHAVE_ADIADO = 'joguinhos.instalar.adiado';
  var ADIAR_DIAS = 7;
  var eventoInstalar = null;
  var folhaOferecida = false;
  var elBtnInstalar = document.getElementById('btn-instalar');
  var elFolha = document.getElementById('instalar-folha');

  function jaInstalado() {
    var m = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
    return m('(display-mode: standalone)') || m('(display-mode: fullscreen)') || m('(display-mode: minimal-ui)') || window.navigator.standalone === true;
  }
  function ehIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function lerAdiado() { try { return parseInt(localStorage.getItem(CHAVE_ADIADO), 10) || 0; } catch (e) { return 0; } }
  function gravarAdiado() { try { localStorage.setItem(CHAVE_ADIADO, String(Date.now())); } catch (e) { /* ignora */ } }

  function atualizarBotaoInstalar() { elBtnInstalar.hidden = jaInstalado(); }

  function abrirFolha() {
    if (jaInstalado()) return;
    var passos = document.getElementById('instalar-passos');
    var agora = document.getElementById('instalar-agora');
    if (eventoInstalar) {
      passos.hidden = true;
      agora.hidden = false;
    } else {
      // sem o aviso do navegador: ensina o caminho manual
      passos.innerHTML = ehIOS()
        ? '<li>No <b>Safari</b>, toque em <b>Compartilhar</b> (quadrado com uma seta para cima): no iPad fica no alto, perto da barra de endereço; no iPhone, embaixo.</li>'
        + '<li><b>Role a lista de ações para baixo</b> (depois de "Buscar na Página") e toque em <b>Adicionar à Tela de Início</b>. Se não aparecer, vá ao fim da lista, toque em <b>Editar Ações</b> e adicione.</li>'
        + '<li>Toque em <b>Adicionar</b>.</li>'
        : '<li>Abra o menu do navegador (os <b>três pontinhos</b>).</li><li>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li>';
      passos.hidden = false;
      agora.hidden = true;
    }
    document.getElementById('instalar-depois').textContent = eventoInstalar ? 'Agora não' : 'Entendi';
    elFolha.hidden = false;
  }
  function fecharFolha(adiar) {
    elFolha.hidden = true;
    if (adiar) gravarAdiado();
  }
  // oferece uma vez (e de novo só depois de uns dias), sempre no menu, nunca no meio de um jogo
  function talvezOferecer() {
    if (folhaOferecida || jaInstalado() || atual !== 'menu') return;
    if (Date.now() - lerAdiado() < ADIAR_DIAS * 86400000) return;
    folhaOferecida = true;
    abrirFolha();
  }

  window.addEventListener('beforeinstallprompt', function (ev) {
    ev.preventDefault();
    eventoInstalar = ev;
    atualizarBotaoInstalar();
    setTimeout(talvezOferecer, 800);
  });
  window.addEventListener('appinstalled', function () {
    eventoInstalar = null;
    elFolha.hidden = true;
    elBtnInstalar.hidden = true;
  });
  elBtnInstalar.addEventListener('click', function () { Som.liberar(); Som.tocar('toque'); abrirFolha(); });
  document.getElementById('instalar-agora').addEventListener('click', function () {
    Som.liberar();
    var ev = eventoInstalar;
    if (!ev) { fecharFolha(false); return; }
    eventoInstalar = null;
    elFolha.hidden = true;
    ev.prompt();
    if (ev.userChoice && ev.userChoice.then) ev.userChoice.then(function (r) { if (!r || r.outcome !== 'accepted') gravarAdiado(); });
  });
  document.getElementById('instalar-depois').addEventListener('click', function () { Som.liberar(); fecharFolha(true); });
  atualizarBotaoInstalar();
  // navegadores sem o aviso (iPhone, Firefox...): oferece o passo a passo uma vez, logo depois de abrir
  setTimeout(function () { if (!eventoInstalar) talvezOferecer(); }, 2500);

  mostrar(telaDoHash());

  // PWA offline
  if ('serviceWorker' in navigator) {
    // quando uma versão nova assume, recarrega sozinho, mas só se a criança estiver no menu
    // (nunca no meio de um desenho ou de uma corrida)
    var tinhaControle = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (tinhaControle && atual === 'menu') location.reload();
      tinhaControle = true;
    });
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* sem SW (ex.: file://) o jogo segue online */ });
    });
  }
})();
