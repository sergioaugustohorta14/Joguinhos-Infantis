/* Jogo Desviar: corrida em 3 pistas vista por trás.
   Gestos: esquerda/direita troca de pista, para cima pula, para baixo agacha.
   Visual calmo: cores suaves, sem flashes, sem tremida de tela. */
(function () {
  'use strict';

  // ---------- constantes ----------
  var D_MAX = 28;            // distância (em "passos") onde as coisas nascem
  var K = 0.16;              // perspectiva: escala = 1 / (1 + K * distância)
  var HORIZONTE = 0.30;      // altura do horizonte (fração da tela)
  var CHAO_JOGADOR = 0.80;   // altura dos pés do personagem
  var T_PULO = 0.78, PICO = 1.0, T_AGACHA = 0.7;
  var VIDAS = 3;
  // ---- dificuldade (mexa aqui para deixar mais fácil ou mais difícil) ----
  var VEL_INICIAL = 7;       // passos por segundo no começo da corrida
  var VEL_MAXIMA = 15;       // teto da velocidade
  var VEL_SOBE = 0.1;        // quanto a velocidade aumenta por segundo de jogo
  var ENTRE_LINHAS_INICIO = 1.75;  // segundos entre um obstáculo e o próximo, no começo
  var ENTRE_LINHAS_FIM = 1.1;      // ... e depois de 90 segundos de jogo
  var INVULNERAVEL = 1.8;    // segundos sem perder vida depois de bater
  // ---- fases (cada fase muda o cenário e os obstáculos; depois da última, volta à primeira) ----
  var FASE_TEMPO = 20;       // segundos de jogo em cada fase
  var FASE_TRANSICAO = 3;    // segundos para as cores do cenário mudarem, bem devagar
  var FASE_BONUS = 10;       // pontos ao chegar numa fase nova
  // ---- toque (dedinhos pequenos) ----
  var TOQUE_SIMPLES = true;  // um toquinho sem arrastar: lado esquerdo vai à esquerda, lado direito à direita, meio pula
  var TOQUE_PARADO = 12;     // até quantos px o dedo pode mexer e ainda contar como toquinho
  var TOQUE_RAPIDO = 380;    // ms: toquinho tem de ser rápido
  var FILA_PULO = 0.25;      // s: pedido de pulo feito um pouco antes de pousar vale para o próximo pulo
  var TRACO = '#4a403b';
  var CHAVE_RECORDE = 'joguinhos.desviar.recorde';

  // temas das fases. As cores do cenário se misturam suavemente de uma fase para a outra;
  // os obstáculos ('obs') ficam com o visual da fase em que nasceram.
  var TEMAS = [
    { nome: 'Campinho', ceu1: '#cfe5f0', ceu2: '#f7f0df', sol: '#fff4d6', nuvem: '#ffffff', col1: '#c9dfb8', col2: '#bcd7a9', chao1: '#c4dcad', chao2: '#a8cf93',
      estrada: '#e8dcc2', borda: '#fbf5e6', tracejado: '#fffaf0', copa: '#8fc08a', copa2: '#a6d3a0', tronco: '#a98563', arbusto: '#9bc995', arbusto2: '#8fc08a', estrelas: 0,
      cenario: ['arvore', 'arvore', 'arbusto', 'flor', 'flor'], flores: ['#f2a7b5', '#f6d462', '#ffffff', '#b9a5e6'],
      obs: { forma: 'pedra', pedra: '#b3ada3', pedra2: '#cfc9bf', bloco: '#dcb67f', poste: '#b58b5a', topo: '#e9c46a', faixa: '#d9776e', cerca: '#f2ede2' } },
    { nome: 'Praia', ceu1: '#bfe3ee', ceu2: '#fbf1dc', sol: '#fff1c9', nuvem: '#ffffff', col1: '#a9d6dd', col2: '#97cbd6', chao1: '#f2e4c0', chao2: '#e9d4a2',
      estrada: '#d9c08f', borda: '#f6ead0', tracejado: '#fff6e0', copa: '#8fc08a', copa2: '#a6d3a0', tronco: '#c9a77a', arbusto: '#9cc7a0', arbusto2: '#8fb894', estrelas: 0,
      cenario: ['palmeira', 'palmeira', 'guardasol', 'concha', 'concha'], flores: ['#f2b8b0', '#f9d9d3'],
      obs: { forma: 'concha', pedra: '#f2b8b0', pedra2: '#f9d9d3', bloco: '#e3b27a', poste: '#b58b5a', topo: '#f2c46d', faixa: '#5fb0c4', cerca: '#fff8ea' } },
    { nome: 'Neve', ceu1: '#d5e3f0', ceu2: '#f4f7fa', sol: '#fffbe8', nuvem: '#ffffff', col1: '#e6eef5', col2: '#dae6f0', chao1: '#eef3f8', chao2: '#dfe9f2',
      estrada: '#c9d8e6', borda: '#f6f9fc', tracejado: '#ffffff', copa: '#7fae92', copa2: '#92c0a4', tronco: '#a98563', arbusto: '#e9f1f7', arbusto2: '#d3e2ee', estrelas: 0,
      cenario: ['pinheiro', 'pinheiro', 'boneco', 'arbusto'], flores: ['#ffffff'],
      obs: { forma: 'bola', pedra: '#f7fbff', pedra2: '#d3e3f1', bloco: '#bfe0f0', poste: '#9aa7b8', topo: '#f4f7fb', faixa: '#d9776e', cerca: '#f4f7fb' } },
    { nome: 'Noite', ceu1: '#8f9fd0', ceu2: '#dccfe8', sol: '#fff4cf', nuvem: '#c9c6e6', col1: '#7e8cb8', col2: '#6f7da9', chao1: '#93a3c8', chao2: '#8191b9',
      estrada: '#b5b9dd', borda: '#e6e8fa', tracejado: '#eef0fc', copa: '#6f8fb8', copa2: '#86a5cb', tronco: '#7d6f9a', arbusto: '#7f9ac4', arbusto2: '#6f89b4', estrelas: 1,
      cenario: ['arvore', 'cogumelo', 'cogumelo', 'flor', 'flor'], flores: ['#fff4cf', '#d9c8f5', '#ffd7a8'],
      obs: { forma: 'cogumelo', pedra: '#c9a0d8', pedra2: '#e2c6ec', bloco: '#8c92b5', poste: '#7f6b9c', topo: '#f0c36b', faixa: '#8c6fb5', cerca: '#e6e8fa' } },
    { nome: 'Doces', ceu1: '#f9d9e6', ceu2: '#fff3e6', sol: '#fff0c2', nuvem: '#ffffff', col1: '#f5c6dd', col2: '#efb5d0', chao1: '#fbe3ee', chao2: '#f7cfe0',
      estrada: '#efdcc0', borda: '#fffaf0', tracejado: '#fffaf0', copa: '#f4b6d2', copa2: '#f9cfe1', tronco: '#c9a07a', arbusto: '#f2b9d2', arbusto2: '#e9a6c5', estrelas: 0,
      cenario: ['pirulito', 'pirulito', 'cupcake', 'arvore', 'flor'], flores: ['#f4a6a6', '#f6d462', '#b9a5e6', '#8fd3c4'],
      obs: { forma: 'bala', pedra: '#f4a6a6', pedra2: '#fbd1d1', bloco: '#b8855a', poste: '#d7a6c9', topo: '#8fd3c4', faixa: '#f4a6a6', cerca: '#fffaf0' } }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var cv, ctx, W = 0, H = 0, dpr = 1, yH = 0, yP = 0, laneW = 0, cx = 0;
  var rodando = false, ultimoQuadro = 0, idQuadro = 0, congelado = false; // congelado: só para os testes
  var estado = { fase: 'escolha', heroi: 'ourico' };
  var jogo = null;
  var toque = null;

  // ---------- util ----------
  function lerRecorde() { try { return parseInt(localStorage.getItem(CHAVE_RECORDE), 10) || 0; } catch (e) { return 0; } }
  function gravarRecorde(v) { try { localStorage.setItem(CHAVE_RECORDE, String(v)); } catch (e) { /* ignora */ } }
  function esc(d) { return 1 / (1 + K * d); }
  function yDe(s) { return yH + (yP - yH) * s; }
  function xDe(lane, s) { return cx + (lane - 1) * laneW * s; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function escolhe(lista) { return lista[Math.floor(Math.random() * lista.length)]; }
  function hexRgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  // cor (ou número) do cenário agora: mistura do tema que está saindo com o que está entrando
  function suave() { var m = jogo.mix; return m * m * (3 - 2 * m); }
  function cor(k) {
    var a = TEMAS[jogo.temaDe][k], b = TEMAS[jogo.temaPara][k];
    if (jogo.mix >= 1 || a === b) return b;
    var x = hexRgb(a), y = hexRgb(b), p = suave();
    return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * p) + ',' + Math.round(x[1] + (y[1] - x[1]) * p) + ',' + Math.round(x[2] + (y[2] - x[2]) * p) + ')';
  }
  function num(k) {
    var a = TEMAS[jogo.temaDe][k], b = TEMAS[jogo.temaPara][k];
    return a + (b - a) * (jogo.mix >= 1 ? 1 : suave());
  }

  // ---------- formas com contorno (coordenadas locais: 1 = largura de uma pista) ----------
  function forma(c, cor) {
    c.fillStyle = cor; c.fill();
    c.strokeStyle = TRACO; c.lineWidth = 0.034; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
  }
  function elipse(c, x, y, rx, ry, cor, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); forma(c, cor); }
  function poli(c, pts, cor) {
    c.beginPath();
    for (var i = 0; i < pts.length; i++) { if (i) c.lineTo(pts[i][0], pts[i][1]); else c.moveTo(pts[i][0], pts[i][1]); }
    c.closePath(); forma(c, cor);
  }
  function ret(c, x, y, w, h, r, cor) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
    forma(c, cor);
  }
  function linha(c, x1, y1, x2, y2, larg) {
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
    c.strokeStyle = TRACO; c.lineWidth = larg || 0.03; c.lineCap = 'round'; c.stroke();
  }
  function estrela(c, x, y, R, cor) {
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var r = i % 2 === 0 ? R : R * 0.5, a = -Math.PI / 2 + i * Math.PI / 5;
      var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (i) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.closePath(); forma(c, cor);
  }
  // desenha em coordenadas locais: origem nos pés, escala = largura da pista na profundidade
  function local(x, y, u, fn, alfa) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(u, u);
    if (alfa !== undefined) ctx.globalAlpha = alfa;
    fn(ctx);
    ctx.restore();
  }

  // ---------- personagens (por trás, no jogo) ----------
  function heroiCostas(c, heroi, anim, agacha) {
    var passo = Math.sin(anim * 11) * 0.05;
    c.save();
    if (agacha) c.scale(1.12, 0.58);
    if (heroi === 'ourico') {
      elipse(c, -0.13, -0.05 - Math.max(0, passo), 0.12, 0.065, '#e07a74');
      elipse(c, 0.13, -0.05 - Math.max(0, -passo), 0.12, 0.065, '#e07a74');
      elipse(c, 0, -0.31, 0.24, 0.27, '#7fb2dd');
      for (var i = 0; i < 6; i++) {
        var a = (-165 + i * 26) * Math.PI / 180;
        var bx = Math.cos(a) * 0.27, by = -0.6 + Math.sin(a) * 0.27;
        var tx = Math.cos(a) * 0.5, ty = -0.6 + Math.sin(a) * 0.5;
        var na = a + Math.PI / 2;
        poli(c, [[bx + Math.cos(na) * 0.1, by + Math.sin(na) * 0.1], [tx, ty], [bx - Math.cos(na) * 0.1, by - Math.sin(na) * 0.1]], '#5f8fbf');
      }
      elipse(c, 0, -0.6, 0.27, 0.26, '#7fb2dd');
      poli(c, [[-0.2, -0.78], [-0.17, -0.95], [-0.06, -0.83]], '#7fb2dd');
      poli(c, [[0.2, -0.78], [0.17, -0.95], [0.06, -0.83]], '#7fb2dd');
      linha(c, -0.1, -0.5, -0.1, -0.35, 0.025); linha(c, 0.1, -0.5, 0.1, -0.35, 0.025);
    } else {
      elipse(c, -0.12, -0.05 - Math.max(0, passo), 0.11, 0.06, '#8a6a4f');
      elipse(c, 0.12, -0.05 - Math.max(0, -passo), 0.11, 0.06, '#8a6a4f');
      elipse(c, 0.2 + Math.sin(anim * 9) * 0.04, -0.38, 0.06, 0.12, '#c99a6b', 0.6);
      elipse(c, 0, -0.3, 0.22, 0.26, '#d96a62');
      ret(c, -0.17, -0.33, 0.34, 0.06, 0.02, '#f6c945');
      elipse(c, 0, -0.62, 0.22, 0.21, '#d9b184');
      elipse(c, -0.22, -0.56, 0.07, 0.15, '#a9774b', 0.3);
      elipse(c, 0.22, -0.56, 0.07, 0.15, '#a9774b', -0.3);
      c.beginPath(); c.arc(0, -0.66, 0.24, Math.PI, 0); c.closePath(); forma(c, '#d9534f');
      elipse(c, 0, -0.66, 0.27, 0.045, '#c9443f');
      elipse(c, 0, -0.78, 0.05, 0.05, '#f6c945');
    }
    c.restore();
  }

  // retratos de frente (cartões de escolha)
  function retrato(canvas, heroi) {
    var c = canvas.getContext('2d'), n = canvas.width;
    c.clearRect(0, 0, n, n);
    c.save();
    c.translate(n / 2, n * 0.93);
    c.scale(n * 0.95, n * 0.95);
    if (heroi === 'ourico') {
      for (var i = 0; i < 7; i++) {
        var a = (-170 + i * 26.5) * Math.PI / 180;
        var bx = Math.cos(a) * 0.3, by = -0.55 + Math.sin(a) * 0.3, tx = Math.cos(a) * 0.56, ty = -0.55 + Math.sin(a) * 0.56, na = a + Math.PI / 2;
        poli(c, [[bx + Math.cos(na) * 0.11, by + Math.sin(na) * 0.11], [tx, ty], [bx - Math.cos(na) * 0.11, by - Math.sin(na) * 0.11]], '#5f8fbf');
      }
      elipse(c, -0.13, -0.05, 0.13, 0.06, '#e07a74'); elipse(c, 0.13, -0.05, 0.13, 0.06, '#e07a74');
      elipse(c, 0, -0.25, 0.2, 0.22, '#7fb2dd'); elipse(c, 0, -0.22, 0.12, 0.15, '#f4e6cf');
      elipse(c, 0, -0.55, 0.32, 0.3, '#7fb2dd');
      elipse(c, 0, -0.47, 0.17, 0.13, '#f4e6cf');
      elipse(c, 0, -0.52, 0.04, 0.03, TRACO);
      c.fillStyle = TRACO; c.beginPath(); c.arc(-0.12, -0.6, 0.032, 0, 7); c.arc(0.12, -0.6, 0.032, 0, 7); c.fill();
      c.beginPath(); c.arc(0, -0.47, 0.06, 0.2, Math.PI - 0.2); c.strokeStyle = TRACO; c.lineWidth = 0.025; c.lineCap = 'round'; c.stroke();
    } else {
      elipse(c, -0.12, -0.05, 0.12, 0.06, '#8a6a4f'); elipse(c, 0.12, -0.05, 0.12, 0.06, '#8a6a4f');
      elipse(c, 0, -0.25, 0.2, 0.22, '#d96a62'); ret(c, -0.15, -0.3, 0.3, 0.05, 0.02, '#f6c945');
      elipse(c, -0.31, -0.5, 0.09, 0.19, '#a9774b', 0.25); elipse(c, 0.31, -0.5, 0.09, 0.19, '#a9774b', -0.25);
      elipse(c, 0, -0.55, 0.28, 0.26, '#d9b184');
      elipse(c, 0, -0.47, 0.15, 0.11, '#f4e6cf'); elipse(c, 0, -0.52, 0.045, 0.03, TRACO);
      c.fillStyle = TRACO; c.beginPath(); c.arc(-0.11, -0.6, 0.03, 0, 7); c.arc(0.11, -0.6, 0.03, 0, 7); c.fill();
      c.beginPath(); c.arc(0, -0.47, 0.055, 0.2, Math.PI - 0.2); c.strokeStyle = TRACO; c.lineWidth = 0.025; c.lineCap = 'round'; c.stroke();
      c.beginPath(); c.arc(0, -0.64, 0.3, Math.PI, 0); c.closePath(); forma(c, '#d9534f');
      elipse(c, 0, -0.64, 0.34, 0.05, '#c9443f');
      poli(c, [[-0.05, -0.86], [0.05, -0.86], [0.05, -0.78], [0, -0.74], [-0.05, -0.78]], '#f6c945');
    }
    c.restore();
  }

  // ---------- obstáculos, estrelas, cenário ----------
  function desenharItem(it, alfa) {
    var s = esc(it.d), u = laneW * s, y = yDe(s);
    var x = it.lane === 'todas' ? cx : xDe(it.lane, s);
    var o = TEMAS[it.skin || 0].obs;
    local(x, y, u, function (c) {
      c.fillStyle = 'rgba(74,64,59,0.14)';
      switch (it.tipo) {
        case 'pedra':
          pedraDaFase(c, o);
          break;
        case 'bloco':
          ret(c, -0.37, -0.8, 0.74, 0.8, 0.05, o.bloco);
          linha(c, -0.37, -0.4, 0.37, -0.4); linha(c, -0.37, -0.8, 0.37, 0); linha(c, 0.37, -0.8, -0.37, 0);
          break;
        case 'alta':   // barra no alto: passar agachado
          ret(c, -0.44, -0.95, 0.08, 0.95, 0.03, o.poste); ret(c, 0.36, -0.95, 0.08, 0.95, 0.03, o.poste);
          ret(c, -0.48, -0.96, 0.96, 0.24, 0.05, o.topo); ret(c, -0.3, -0.96, 0.14, 0.24, 0, o.faixa); ret(c, 0.02, -0.96, 0.14, 0.24, 0, o.faixa);
          break;
        case 'baixaTodas': // cerquinha baixa em todas as pistas: pular
          ret(c, -1.55, -0.45, 0.09, 0.45, 0.03, o.poste); ret(c, 1.46, -0.45, 0.09, 0.45, 0.03, o.poste);
          ret(c, -1.55, -0.42, 3.1, 0.15, 0.05, o.cerca); ret(c, -1.0, -0.42, 0.32, 0.15, 0, o.faixa); ret(c, -0.16, -0.42, 0.32, 0.15, 0, o.faixa); ret(c, 0.68, -0.42, 0.32, 0.15, 0, o.faixa);
          break;
        case 'altaTodas': // barra alta em todas as pistas: agachar
          ret(c, -1.55, -0.95, 0.09, 0.95, 0.03, o.poste); ret(c, 1.46, -0.95, 0.09, 0.95, 0.03, o.poste);
          ret(c, -1.55, -0.96, 3.1, 0.24, 0.05, o.topo); ret(c, -1.0, -0.96, 0.32, 0.24, 0, o.faixa); ret(c, -0.16, -0.96, 0.32, 0.24, 0, o.faixa); ret(c, 0.68, -0.96, 0.32, 0.24, 0, o.faixa);
          break;
      }
    }, alfa);
  }
  // obstáculo baixo (pular ou desviar): muda de forma em cada fase, mas sempre da mesma altura
  function pedraDaFase(c, o) {
    switch (o.forma) {
      case 'concha':
        c.beginPath(); c.arc(0, -0.02, 0.32, Math.PI, 0); c.closePath(); forma(c, o.pedra);
        linha(c, 0, -0.02, -0.2, -0.25, 0.022); linha(c, 0, -0.02, 0, -0.34, 0.022); linha(c, 0, -0.02, 0.2, -0.25, 0.022);
        break;
      case 'bola':
        elipse(c, 0, -0.2, 0.21, 0.2, o.pedra); elipse(c, -0.07, -0.27, 0.07, 0.05, '#ffffff'); elipse(c, 0.08, -0.1, 0.1, 0.05, o.pedra2);
        break;
      case 'cogumelo':
        ret(c, -0.07, -0.22, 0.14, 0.22, 0.03, '#f3ead9');
        c.beginPath(); c.ellipse(0, -0.2, 0.3, 0.2, 0, Math.PI, 0); c.closePath(); forma(c, o.pedra);
        elipse(c, -0.12, -0.28, 0.045, 0.035, o.pedra2); elipse(c, 0.1, -0.32, 0.04, 0.03, o.pedra2);
        break;
      case 'bala':
        poli(c, [[-0.14, -0.17], [-0.34, -0.3], [-0.34, -0.04]], o.pedra2); poli(c, [[0.14, -0.17], [0.34, -0.3], [0.34, -0.04]], o.pedra2);
        elipse(c, 0, -0.17, 0.2, 0.15, o.pedra); linha(c, -0.06, -0.3, 0.02, -0.04, 0.022);
        break;
      default:
        elipse(c, 0, -0.14, 0.3, 0.17, o.pedra); elipse(c, -0.08, -0.2, 0.1, 0.06, o.pedra2);
    }
  }
  function desenharEstrela(e, alfa) {
    var s = esc(e.d), u = laneW * s;
    local(xDe(e.lane, s), yDe(s), u, function (c) {
      var bob = Math.sin(jogo.anim * 2.2 + e.fase) * 0.04;
      estrela(c, 0, -0.5 + bob, 0.2, '#f6d462');
    }, alfa);
  }
  function desenharCenario(o, alfa) {
    var s = esc(o.d), u = laneW * s;
    local(xDe(1 + o.lado * o.off, s), yDe(s), u, function (c) {
      switch (o.tipo) {
        case 'arvore':
          ret(c, -0.07, -0.5, 0.14, 0.5, 0.03, cor('tronco'));
          elipse(c, 0, -0.78, 0.38, 0.34, cor('copa')); elipse(c, -0.14, -0.9, 0.2, 0.18, cor('copa2'));
          break;
        case 'arbusto':
          elipse(c, 0, -0.16, 0.34, 0.2, cor('arbusto')); elipse(c, 0.18, -0.12, 0.2, 0.14, cor('arbusto2'));
          break;
        case 'palmeira':
          poli(c, [[-0.06, 0], [0.06, 0], [0.04, -0.8], [-0.04, -0.8]], cor('tronco'));
          elipse(c, -0.22, -0.82, 0.26, 0.07, cor('copa'), -0.45); elipse(c, 0.22, -0.82, 0.26, 0.07, cor('copa'), 0.45);
          elipse(c, -0.12, -0.9, 0.2, 0.06, cor('copa2'), -0.9); elipse(c, 0.12, -0.9, 0.2, 0.06, cor('copa2'), 0.9);
          break;
        case 'guardasol':
          linha(c, 0, 0, 0, -0.6, 0.03);
          c.beginPath(); c.arc(0, -0.6, 0.36, Math.PI, 0); c.closePath(); forma(c, '#f2b8b0');
          c.beginPath(); c.moveTo(0, -0.6); c.lineTo(-0.12, -0.94); c.lineTo(0.12, -0.94); c.closePath(); forma(c, '#fff8ea');
          break;
        case 'concha':
          c.beginPath(); c.arc(0, 0, 0.13, Math.PI, 0); c.closePath(); forma(c, o.cor);
          break;
        case 'pinheiro':
          ret(c, -0.05, -0.28, 0.1, 0.28, 0.02, cor('tronco'));
          poli(c, [[-0.32, -0.25], [0, -0.64], [0.32, -0.25]], cor('copa')); poli(c, [[-0.26, -0.5], [0, -0.88], [0.26, -0.5]], cor('copa2')); poli(c, [[-0.19, -0.72], [0, -1.02], [0.19, -0.72]], cor('copa'));
          poli(c, [[-0.07, -0.89], [0, -1.02], [0.07, -0.89]], '#f7fbff');
          break;
        case 'boneco':
          elipse(c, 0, -0.15, 0.21, 0.16, '#ffffff'); elipse(c, 0, -0.39, 0.15, 0.13, '#ffffff');
          ret(c, -0.15, -0.31, 0.3, 0.05, 0.02, '#d9776e'); poli(c, [[0, -0.4], [0.12, -0.38], [0, -0.36]], '#e9a24a');
          elipse(c, -0.05, -0.43, 0.015, 0.015, TRACO); elipse(c, 0.05, -0.43, 0.015, 0.015, TRACO);
          break;
        case 'cogumelo':
          ret(c, -0.06, -0.3, 0.12, 0.3, 0.03, '#f3ead9');
          c.beginPath(); c.ellipse(0, -0.3, 0.3, 0.26, 0, Math.PI, 0); c.closePath(); forma(c, o.cor);
          elipse(c, -0.12, -0.42, 0.045, 0.04, '#fff4cf'); elipse(c, 0.1, -0.46, 0.04, 0.035, '#fff4cf');
          break;
        case 'pirulito':
          ret(c, -0.02, -0.6, 0.04, 0.6, 0.01, '#f3ead9');
          elipse(c, 0, -0.76, 0.2, 0.2, o.cor); elipse(c, 0, -0.76, 0.11, 0.11, '#ffffff'); elipse(c, 0, -0.76, 0.04, 0.04, o.cor);
          break;
        case 'cupcake':
          poli(c, [[-0.16, 0], [0.16, 0], [0.2, -0.2], [-0.2, -0.2]], '#e6b98a');
          elipse(c, 0, -0.28, 0.23, 0.12, o.cor); elipse(c, 0, -0.4, 0.05, 0.05, '#e87a7a');
          break;
        default:   // flor
          linha(c, 0, 0, 0, -0.22, 0.03); elipse(c, 0, -0.27, 0.1, 0.08, o.cor);
      }
    }, alfa);
  }

  // ---------- cena ----------
  function desenharFundo() {
    var g = ctx.createLinearGradient(0, 0, 0, yH);
    g.addColorStop(0, cor('ceu1')); g.addColorStop(1, cor('ceu2'));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, yH + 1);
    // estrelinhas no céu (só na fase da noite)
    var ne = num('estrelas');
    if (ne > 0.02) {
      ctx.fillStyle = '#fffbea';
      ctx.globalAlpha = 0.75 * ne;
      for (var e = 0; e < 16; e++) {
        ctx.beginPath(); ctx.arc(((e * 97 + 31) % 100) / 100 * W, ((e * 53 + 17) % 100) / 100 * yH * 0.62 + 6, 1.6 + (e % 3) * 0.7, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // sol (ou lua) e nuvens (muito devagar)
    ctx.fillStyle = cor('sol'); ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(W * 0.8, yH * 0.42, Math.min(W, H) * 0.06, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.8; ctx.fillStyle = cor('nuvem');
    jogo.nuvens.forEach(function (n) {
      var r = n.r;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.arc(n.x + r * 0.9, n.y + r * 0.1, r * 0.8, 0, 7); ctx.arc(n.x - r * 0.9, n.y + r * 0.15, r * 0.7, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // colinas
    ctx.fillStyle = cor('col1'); ctx.beginPath(); ctx.ellipse(W * 0.2, yH + 4, W * 0.35, yH * 0.16, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = cor('col2'); ctx.beginPath(); ctx.ellipse(W * 0.78, yH + 4, W * 0.4, yH * 0.12, 0, Math.PI, 0); ctx.fill();
    // chão
    var gc = ctx.createLinearGradient(0, yH, 0, H);
    gc.addColorStop(0, cor('chao1')); gc.addColorStop(1, cor('chao2'));
    ctx.fillStyle = gc; ctx.fillRect(0, yH, W, H - yH);
    // estrada (triângulo até o horizonte)
    var sb = (H - yH) / (yP - yH), meia = 1.62 * laneW * sb;
    ctx.fillStyle = cor('estrada');
    ctx.beginPath(); ctx.moveTo(cx, yH); ctx.lineTo(cx + meia, H); ctx.lineTo(cx - meia, H); ctx.closePath(); ctx.fill();
    // faixas das bordas
    ctx.strokeStyle = cor('borda'); ctx.lineWidth = Math.max(2, laneW * 0.05);
    [-1.5, 1.5].forEach(function (k) {
      ctx.beginPath(); ctx.moveTo(cx, yH); ctx.lineTo(cx + k * laneW * sb, H); ctx.stroke();
    });
    // tracejado entre as pistas (anda com o chão)
    ctx.fillStyle = cor('tracejado');
    var passo = 3.2, desloc = jogo.dist % passo;
    for (var k = -1; k < D_MAX / passo + 1; k++) {
      var d1 = k * passo - desloc, d2 = d1 + 1.4;
      if (d2 < -1) continue;
      var s1 = esc(Math.max(d1, -1)), s2 = esc(Math.min(d2, D_MAX + 5));
      [-0.5, 0.5].forEach(function (b) {
        var w1 = laneW * s1 * 0.035, w2 = laneW * s2 * 0.035;
        ctx.beginPath();
        ctx.moveTo(xDe(1 + b, s1) - w1, yDe(s1)); ctx.lineTo(xDe(1 + b, s1) + w1, yDe(s1));
        ctx.lineTo(xDe(1 + b, s2) + w2, yDe(s2)); ctx.lineTo(xDe(1 + b, s2) - w2, yDe(s2));
        ctx.closePath(); ctx.fill();
      });
    }
  }

  function desenharJogador() {
    var u = laneW, x = cx + (jogo.xl - 1) * laneW, y = yP;
    var h = altura() * laneW;
    var sombra = 1 - Math.min(0.5, altura() * 0.4);
    ctx.save();
    ctx.fillStyle = 'rgba(74,64,59,0.18)';
    ctx.beginPath(); ctx.ellipse(x, y, laneW * 0.3 * sombra, laneW * 0.08 * sombra, 0, 0, 7); ctx.fill();
    ctx.restore();
    var alfa = 1;
    if (jogo.invul > 0) alfa = 0.62 + 0.22 * Math.sin(jogo.anim * 7);   // piscar lento e suave
    local(x, y - h, u, function (c) { heroiCostas(c, estado.heroi, jogo.anim, jogo.agacha > 0); }, alfa);
  }

  function desenhar() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    desenharFundo();
    // tudo que fica à frente do horizonte, de longe para perto
    var lista = [];
    jogo.cenario.forEach(function (o) { lista.push({ d: o.d, f: function (a) { desenharCenario(o, a); } }); });
    jogo.itens.forEach(function (i) { lista.push({ d: i.d, f: function (a) { desenharItem(i, a); } }); });
    jogo.estrelas.forEach(function (e) { if (!e.pegou) lista.push({ d: e.d, f: function (a) { desenharEstrela(e, a); } }); });
    lista.push({ d: 0, f: desenharJogador, jogador: true });
    lista.sort(function (a, b) { return b.d - a.d; });
    lista.forEach(function (o) {
      if (o.jogador) { o.f(); return; }
      var a = o.d > D_MAX - 5 ? Math.max(0, (D_MAX - o.d) / 5) : 1;   // surge suave, sem "pulo"
      if (a > 0) o.f(a);
    });
  }

  // ---------- regras ----------
  function altura() {
    if (jogo.pulo < 0) return 0;
    var p = jogo.pulo / T_PULO;
    return 4 * PICO * p * (1 - p);
  }

  function novoJogo() {
    var nuvens = [];
    for (var i = 0; i < 4; i++) nuvens.push({ x: rnd(0, W), y: rnd(yH * 0.12, yH * 0.6), r: rnd(16, 30) * Math.min(1.4, W / 600 + 0.5), v: rnd(3, 7) });
    jogo = {
      t: 0, anim: 0, v: 0, lento: 0, dist: 0,
      faixa: 1, xl: 1, pulo: -1, agacha: 0, invul: 0,
      vidas: VIDAS, pontos: 0, ultimoHud: -1,
      fase: 0, temaDe: 0, temaPara: 0, mix: 1, fila: 0, filaAte: 0,
      itens: [], estrelas: [], cenario: [], nuvens: nuvens,
      proxima: 1.6 * VEL_INICIAL, proxEstrela: 99, proxCenario: 0, ultimaLivre: [0, 1, 2],
      fimEm: 0
    };
    for (var d = 2; d < D_MAX; d += rnd(2.5, 4)) criarCenario(d);
  }

  function criarCenario(d) {
    var tema = TEMAS[jogo.temaPara];
    jogo.cenario.push({ d: d, tipo: escolhe(tema.cenario), lado: Math.random() < 0.5 ? -1 : 1, off: rnd(1.9, 3.1), cor: escolhe(tema.flores) });
  }

  // chegou numa fase nova: o cenário muda devagar, ganha bônus, um respiro e uma fileira de estrelas
  function mudarFase(n) {
    var j = jogo;
    j.fase = n;
    j.temaDe = j.temaPara;
    j.temaPara = n % TEMAS.length;
    j.mix = j.temaDe === j.temaPara ? 1 : 0;
    j.pontos += FASE_BONUS;
    j.proxima += j.v * 1.3;
    for (var lane = 0; lane < 3; lane++) {
      for (var k = 0; k < 2; k++) j.estrelas.push({ d: D_MAX + k * 1.6, lane: lane, pegou: false, fase: Math.random() * 6 });
    }
    Som.tocar('fase');
    pintarHud();
    mostrarFase();
  }

  function gerarLinha() {
    var nivel = Math.min(1, jogo.t / 90);
    var tipos = ['pedra', 'alta', 'bloco'];
    var itens = [];
    var r = Math.random();
    var livres;
    if (jogo.t < 8 || r < 0.5 - nivel * 0.1) {
      var l = Math.floor(Math.random() * 3);
      itens.push({ lane: l, tipo: escolhe(tipos) });
      livres = [0, 1, 2].filter(function (x) { return x !== l; });
    } else if (r < 0.83) {
      var livre = Math.floor(Math.random() * 3);
      livres = [livre];
      [0, 1, 2].forEach(function (x) { if (x !== livre) itens.push({ lane: x, tipo: escolhe(tipos) }); });
    } else {
      itens.push({ lane: 'todas', tipo: Math.random() < 0.5 ? 'baixaTodas' : 'altaTodas' });
      livres = [0, 1, 2];
    }
    itens.forEach(function (i) { jogo.itens.push({ d: D_MAX, lane: i.lane, tipo: i.tipo, hit: false, passou: false, skin: jogo.temaPara }); });
    jogo.ultimaLivre = livres;
    var tEntre = ENTRE_LINHAS_INICIO - (ENTRE_LINHAS_INICIO - ENTRE_LINHAS_FIM) * nivel;                       // segundos entre linhas: cai devagar
    var gap = Math.max(9, jogo.v * tEntre);
    jogo.proxima = gap;
    jogo.proxEstrela = gap * 0.5;
  }

  function gerarEstrelas() {
    var lane = escolhe(jogo.ultimaLivre);
    for (var i = 0; i < 3; i++) jogo.estrelas.push({ d: D_MAX + i * 1.5, lane: lane, pegou: false, fase: Math.random() * 6 });
    jogo.proxEstrela = 999;
  }

  function colidiu(it) {
    if (it.lane !== 'todas' && Math.abs(jogo.xl - it.lane) > 0.55) return false;
    var h = altura();
    switch (it.tipo) {
      case 'pedra': case 'baixaTodas': return h < 0.42;
      case 'alta': case 'altaTodas': return jogo.agacha <= 0;
      default: return true; // bloco
    }
  }

  function atualizar(dt) {
    var j = jogo;
    j.anim += dt;
    j.nuvens.forEach(function (n) { n.x += n.v * dt; if (n.x - n.r * 2 > W) n.x = -n.r * 2; });
    if (estado.fase === 'escolha') return;

    j.t += dt;
    var vivo = estado.fase === 'jogando';
    if (vivo) {
      var vBase = Math.min(VEL_MAXIMA, VEL_INICIAL + j.t * VEL_SOBE);
      j.lento = Math.max(0, j.lento - dt / 2.2);
      j.v = vBase * (1 - 0.35 * j.lento);
    } else {
      j.v = Math.max(0, j.v - 8 * dt);
    }
    var avanco = j.v * dt;
    j.dist += avanco;

    j.xl += (j.faixa - j.xl) * Math.min(1, dt * 14);
    if (j.pulo >= 0) { j.pulo += dt; if (j.pulo >= T_PULO) j.pulo = -1; }
    if (j.agacha > 0) j.agacha = Math.max(0, j.agacha - dt);
    if (j.invul > 0) j.invul = Math.max(0, j.invul - dt);
    if (j.mix < 1) j.mix = Math.min(1, j.mix + dt / FASE_TRANSICAO);
    if (vivo) {
      var fase = Math.floor(j.t / FASE_TEMPO);
      if (fase !== j.fase) mudarFase(fase);
      // pedido de pulo feito um pouco antes de pousar vale para o próximo pulo
      if (j.fila && j.pulo < 0) { j.fila = 0; if (j.t <= j.filaAte) acao('cima'); }
    }

    j.itens.forEach(function (i) { i.d -= avanco; });
    j.estrelas.forEach(function (e) { e.d -= avanco; });
    j.cenario.forEach(function (o) { o.d -= avanco; });

    if (vivo) {
      j.itens.forEach(function (it) {
        if (it.hit) return;
        if (it.d < 0.5 && it.d > -0.5 && j.invul <= 0 && colidiu(it)) {
          it.hit = true;
          j.vidas--;
          j.lento = 1;
          j.invul = INVULNERAVEL;
          Som.tocar('bate');
          pintarHud();
          if (j.vidas <= 0) terminar();
        }
        if (!it.passou && it.d < -0.5) { it.passou = true; if (!it.hit) { j.pontos += 1; pintarHud(); } }
      });
      j.estrelas.forEach(function (e) {
        if (!e.pegou && e.d < 0.55 && e.d > -0.55 && Math.abs(j.xl - e.lane) < 0.6) {
          e.pegou = true; j.pontos += 5; Som.tocar('ponto'); pintarHud();
        }
      });
      j.proxima -= avanco;
      if (j.proxima <= 0) gerarLinha();
      j.proxEstrela -= avanco;
      if (j.proxEstrela <= 0) gerarEstrelas();
    }
    j.proxCenario -= avanco;
    if (j.proxCenario <= 0) { criarCenario(D_MAX); j.proxCenario = rnd(2.2, 4); }

    j.itens = j.itens.filter(function (i) { return i.d > -3; });
    j.estrelas = j.estrelas.filter(function (e) { return e.d > -3 && !e.pegou; });
    j.cenario = j.cenario.filter(function (o) { return o.d > -3; });
  }

  // ---------- ações do jogador ----------
  function acao(dir) {
    if (estado.fase !== 'jogando') return;
    var j = jogo;
    if (dir === 'esq' && j.faixa > 0) { j.faixa--; Som.tocar('lado'); }
    else if (dir === 'dir' && j.faixa < 2) { j.faixa++; Som.tocar('lado'); }
    else if (dir === 'cima' && j.pulo < 0) { j.pulo = 0; j.agacha = 0; Som.tocar('pulo'); }
    else if (dir === 'cima' && j.pulo > T_PULO * 0.55) { j.fila = 1; j.filaAte = j.t + FILA_PULO; }
    else if (dir === 'baixo') {
      if (j.pulo >= 0) j.pulo = Math.max(j.pulo, T_PULO * 0.7);   // desce mais depressa
      j.agacha = T_AGACHA; Som.tocar('agacha');
    }
  }

  function aoPressionar(ev) {
    if (estado.fase !== 'jogando') return;
    ev.preventDefault();
    try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* ignora */ }
    toque = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, t: performance.now(), feito: false };
  }
  // quanto o dedo precisa andar para valer como deslize (curto, para dedinhos pequenos)
  function limiar() { return Math.max(14, Math.min(window.innerWidth, window.innerHeight) * 0.035); }
  function direcaoDe(dx, dy) { return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'dir' : 'esq') : (dy < 0 ? 'cima' : 'baixo'); }
  function aoMover(ev) {
    if (!toque || ev.pointerId !== toque.id || toque.feito) return;
    var dx = ev.clientX - toque.x, dy = ev.clientY - toque.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < limiar()) return;
    toque.feito = true;
    acao(direcaoDe(dx, dy));
  }
  function aoSoltar(ev) {
    if (!toque || ev.pointerId !== toque.id) return;
    var t = toque;
    toque = null;
    if (t.feito || ev.type === 'pointercancel') return;
    var dx = ev.clientX - t.x, dy = ev.clientY - t.y, mov = Math.max(Math.abs(dx), Math.abs(dy));
    if (mov >= limiar()) { acao(direcaoDe(dx, dy)); return; }          // deslize rápido que acabou antes do último movimento
    if (!TOQUE_SIMPLES || mov > TOQUE_PARADO || performance.now() - t.t > TOQUE_RAPIDO) return;
    var r = cv.getBoundingClientRect(), fr = (ev.clientX - r.left) / r.width;
    acao(fr < 1 / 3 ? 'esq' : fr > 2 / 3 ? 'dir' : 'cima');
  }

  var TECLAS = { ArrowLeft: 'esq', a: 'esq', A: 'esq', ArrowRight: 'dir', d: 'dir', D: 'dir', ArrowUp: 'cima', w: 'cima', W: 'cima', ' ': 'cima', ArrowDown: 'baixo', s: 'baixo', S: 'baixo' };
  function aoTeclar(ev) {
    var d = TECLAS[ev.key];
    if (!d || estado.fase !== 'jogando') return;
    ev.preventDefault();
    acao(d);
  }

  // ---------- telas ----------
  function pintarHud() {
    var j = jogo;
    $('dv-n').textContent = j.pontos;
    [].forEach.call(document.querySelectorAll('#dv-vidas .vida'), function (v, i) { v.classList.toggle('perdida', i >= j.vidas); });
  }

  var tempoAviso = 0;
  function mostrarFase() {
    var el = $('dv-fase');
    $('dv-fase-n').textContent = jogo.fase + 1;
    $('dv-fase-nome').textContent = TEMAS[jogo.temaPara].nome;
    el.hidden = false;
    el.classList.remove('mostra');
    void el.offsetWidth;   // reinicia a animação
    el.classList.add('mostra');
    clearTimeout(tempoAviso);
    tempoAviso = setTimeout(function () { el.hidden = true; }, 3400);
  }

  function mostrarEscolha() {
    estado.fase = 'escolha';
    novoJogo();
    $('dv-escolha').hidden = false;
    $('dv-fim').hidden = true;
    $('dv-hud').hidden = true;
    $('dv-fase').hidden = true;
    clearTimeout(tempoAviso);
    $('dv-rec').textContent = lerRecorde();
  }

  function comecar(heroi) {
    estado.heroi = heroi;
    novoJogo();
    jogo.v = VEL_INICIAL;
    estado.fase = 'jogando';
    $('dv-escolha').hidden = true;
    $('dv-fim').hidden = true;
    $('dv-hud').hidden = false;
    pintarHud();
    mostrarFase();
    Som.tocar('abrir');
  }

  function terminar() {
    estado.fase = 'fim';
    Som.tocar('fim');
    var recorde = lerRecorde(), novo = jogo.pontos > recorde;
    if (novo) gravarRecorde(jogo.pontos);
    setTimeout(function () {
      if (estado.fase !== 'fim') return;
      $('dv-final').textContent = jogo.pontos;
      $('dv-fase-fim').textContent = jogo.fase + 1;
      $('dv-recorde-fim').textContent = Math.max(recorde, jogo.pontos);
      $('dv-novo').hidden = !novo;
      $('dv-fim').hidden = false;
      $('dv-hud').hidden = true;
      if (novo) Som.tocar('recorde');
    }, 1100);
  }

  // ---------- laço principal ----------
  function medir() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    yH = H * HORIZONTE; yP = H * CHAO_JOGADOR; cx = W / 2;
    laneW = Math.min(W * 0.26, (yP - yH) * 0.62);
  }

  function quadro(t) {
    if (!rodando) return;
    var dt = Math.min(0.05, (t - ultimoQuadro) / 1000 || 0);
    ultimoQuadro = t;
    if (!congelado) atualizar(dt);
    desenhar();
    idQuadro = requestAnimationFrame(quadro);
  }

  var montado = false;
  function montar() {
    montado = true;
    cv = $('cv-jogo');
    ctx = cv.getContext('2d');
    for (var i = 0; i < VIDAS; i++) {
      var v = document.createElement('span');
      v.className = 'vida';
      v.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 41 C8 29 6 18 14 13 C19 10 23 12 24 16 C25 12 29 10 34 13 C42 18 40 29 24 41Z"/></svg>';
      $('dv-vidas').appendChild(v);
    }
    [].forEach.call(document.querySelectorAll('.dv-card'), function (b) {
      retrato(b.querySelector('canvas'), b.getAttribute('data-heroi'));
      b.addEventListener('click', function () { Som.liberar(); comecar(b.getAttribute('data-heroi')); });
    });
    $('dv-denovo').addEventListener('click', function () { Som.liberar(); comecar(estado.heroi); });
    $('dv-trocar').addEventListener('click', function () { Som.liberar(); Som.tocar('voltar'); mostrarEscolha(); });
    cv.addEventListener('pointerdown', aoPressionar);
    cv.addEventListener('pointermove', aoMover);
    cv.addEventListener('pointerup', aoSoltar);
    cv.addEventListener('pointercancel', aoSoltar);
  }

  function redimensionar() { if (rodando) { medir(); if (jogo) { jogo.nuvens.forEach(function (n) { n.y = Math.min(n.y, yH * 0.6); }); } } }

  window.Jogos = window.Jogos || {};
  window.Jogos.desviar = {
    entrar: function () {
      if (!montado) montar();
      rodando = true;
      congelado = false;
      medir();
      mostrarEscolha();
      window.addEventListener('resize', redimensionar);
      document.addEventListener('keydown', aoTeclar);
      ultimoQuadro = performance.now();
      idQuadro = requestAnimationFrame(quadro);
    },
    sair: function () {
      rodando = false;
      cancelAnimationFrame(idQuadro);
      window.removeEventListener('resize', redimensionar);
      document.removeEventListener('keydown', aoTeclar);
      toque = null;
    },
    // ganchos para os testes
    _teste: {
      estado: function () { return estado; },
      jogo: function () { return jogo; },
      passo: function (dt) { atualizar(dt); },
      congelar: function (v) { congelado = !!v; },
      desenhar: function () { desenhar(); },
      itemNovo: function (tipo, lane, d) { jogo.itens.push({ d: d, lane: lane, tipo: tipo, hit: false, passou: false, skin: jogo.temaPara }); },
      toqueSimples: function (v) { TOQUE_SIMPLES = !!v; },
      estrelaNova: function (lane, d) { jogo.estrelas.push({ d: d, lane: lane, pegou: false, fase: 0 }); },
      limpar: function () { jogo.itens = []; jogo.estrelas = []; jogo.proxima = 9999; jogo.proxEstrela = 9999; },
      altura: altura,
      irParaFase: function (n) { jogo.t = n * FASE_TEMPO; },
      temas: function () { return TEMAS.length; },
      constantes: function () { return { FASE_TEMPO: FASE_TEMPO, FASE_TRANSICAO: FASE_TRANSICAO, FASE_BONUS: FASE_BONUS }; }
    }
  };
})();
