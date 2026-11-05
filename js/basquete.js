/* Jogo Basquete: arraste para trás, mire pela linha pontilhada e solte para arremessar.
   Cesta sem encostar no aro é "chuá" (+2 pontos e mais tempo); sequências ativam
   "Pegando fogo" (pontos x2) e "Elétrico" (pontos x3). Tudo fica só neste aparelho:
   recordes, estrelas, desafios do dia, vestiário e conquistas. */
(function () {
  'use strict';

  // ---------- constantes ----------
  var G = 1450;                    // gravidade (unidades do mundo por s²)
  var R = 22;                      // raio da bola
  var K_PUXAR = 11.5;              // velocidade = puxada x K (maior = não precisa arrastar tanto)
  var PUXAR_MAX = 190;             // puxada máxima (mundo)
  var PUXAR_MIN_PX = 10;           // puxada mínima em pixels da tela (menos que isso cancela)
  var ASSISTE_MIRA = 0.5;          // ajuda de mira: 0 desliga; 0.5 corrige metade do erro quando o tiro já está perto
  var ASSISTE_ALCANCE = 170;       // até que erro de velocidade a ajuda atua
  var PALMA_PX = 110;              // toque mais largo que isso é a palma da mão
  var ARO_LARG = 88;               // abertura do aro (bola = 44): generosa
  var REST_ARO = 0.6, REST_CHAO = 0.5;
  var FOGO_SEQ = 5, ELETRICO_SEQ = 3;
  var TEMPOS = { relogio: 30, minuto: 90 };
  var NOMES_MODO = { relogio: 'Contra o relógio', minuto: 'Por tempo' };
  var CHAVE = 'joguinhos.basquete';
  var VW = 540, VH = 900;          // mundo mínimo visível

  var BOLAS = [
    { id: 'classica', nome: 'Clássica', preco: 0, cor: '#e8812e', linha: '#3a1f10' },
    { id: 'street', nome: 'Streetball', preco: 60, cor: '#b8653a', linha: '#2a1a12' },
    { id: 'neon', nome: 'Neon', preco: 100, cor: '#74e063', linha: '#1d4d1b' },
    { id: 'azul', nome: 'Azulão', preco: 150, cor: '#4ea6ff', linha: '#0e2c63' },
    { id: 'roxa', nome: 'Roxa', preco: 200, cor: '#a578ff', linha: '#2d1a63' },
    { id: 'ouro', nome: 'Dourada', preco: 350, cor: '#f5c84b', linha: '#6b4a08' }
  ];
  var QUADRAS = [
    { id: 'azul', nome: 'Azul', preco: 0, topo: '#1b2a55', base: '#0c1228', faixa: '#25397a', piso: '#c8935a' },
    { id: 'noite', nome: 'Noite', preco: 80, topo: '#10131f', base: '#05060b', faixa: '#1a2033', piso: '#7a5b3a' },
    { id: 'verde', nome: 'Verde', preco: 120, topo: '#0f3a2a', base: '#06150f', faixa: '#17583f', piso: '#d0a86a' },
    { id: 'rosa', nome: 'Rosa', preco: 200, topo: '#3a1445', base: '#14061a', faixa: '#5b2470', piso: '#d6a47c' }
  ];

  var POOL_DESAFIOS = [
    { tipo: 'chuas', ns: [3, 5], texto: function (n) { return 'Faça ' + n + ' chuás em uma partida'; } },
    { tipo: 'pontos', ns: [20, 30, 40], texto: function (n) { return 'Faça ' + n + ' pontos em uma partida'; } },
    { tipo: 'sequencia', ns: [5, 8, 10], texto: function (n) { return 'Faça uma sequência de ' + n; } },
    { tipo: 'cestas', ns: [8, 12, 15], texto: function (n) { return 'Acerte ' + n + ' cestas em uma partida'; } },
    { tipo: 'partidas', ns: [3], texto: function (n) { return 'Jogue ' + n + ' partidas hoje'; } },
    { tipo: 'eletrico', ns: [1], texto: function () { return 'Ative o modo Elétrico'; } },
    { tipo: 'fogo', ns: [1], texto: function () { return 'Ative o Pegando fogo'; } }
  ];
  var RECOMPENSA_DESAFIO = 20;

  var CONQUISTAS = [
    { id: 'primeira', nome: 'Primeira cesta', desc: 'Acerte uma cesta', ok: function (d) { return d.stats.cestas >= 1; } },
    { id: 'chua10', nome: 'Mão de seda', desc: '10 chuás no total', ok: function (d) { return d.stats.chuas >= 10; } },
    { id: 'cestas100', nome: 'Cestinha', desc: '100 cestas no total', ok: function (d) { return d.stats.cestas >= 100; } },
    { id: 'seq10', nome: 'Em chamas', desc: 'Sequência de 10', ok: function (d) { return d.stats.maxSeq >= 10; } },
    { id: 'pts50', nome: 'Cinquentão', desc: '50 pontos numa partida', ok: function (d) { return d.stats.maxPontos >= 50; } },
    { id: 'pts100', nome: 'Centena', desc: '100 pontos numa partida', ok: function (d) { return d.stats.maxPontos >= 100; } },
    { id: 'fogo', nome: 'Pegou fogo', desc: 'Ative o Pegando fogo', ok: function (d) { return d.stats.fogo; } },
    { id: 'eletrico', nome: 'Eletrizante', desc: 'Ative o Elétrico', ok: function (d) { return d.stats.eletrico; } },
    { id: 'vestiario', nome: 'Estilo', desc: 'Compre um item no vestiário', ok: function (d) { return d.comprados.length > 0; } },
    { id: 'desafios10', nome: 'Dedicação', desc: 'Complete 10 desafios do dia', ok: function (d) { return d.stats.desafios >= 10; } }
  ];
  var RECOMPENSA_CONQUISTA = 25;

  var $ = function (id) { return document.getElementById(id); };
  var cv, ctx, W = 0, H = 0, dpr = 1, escala = 1, ox = 0, mw = VW, mh = VH, chaoY = 0, quicaY = 0, hudBaixoPx = 0;
  var rodando = false, ultimoQuadro = 0, idQuadro = 0, congelado = false, montado = false;
  var tela = 'menu';           // menu | jogando | fim
  var jg = null;
  var dados = null;            // progresso salvo

  // ---------- util ----------
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function limita(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hoje() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function semente(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function som(n) { Som.tocar(n); }

  // ---------- dados salvos ----------
  function dadosPadrao() {
    return {
      estrelas: 0, rec: { relogio: 0, minuto: 0 }, top: { relogio: [], minuto: [] },
      bola: 'classica', quadra: 'azul', comprados: [], conquistas: {},
      stats: { cestas: 0, chuas: 0, maxSeq: 0, maxPontos: 0, fogo: false, eletrico: false, desafios: 0, partidas: 0 },
      dia: { data: '', itens: [], partidas: 0 }
    };
  }
  function carregar() {
    var d = dadosPadrao();
    try {
      var s = JSON.parse(localStorage.getItem(CHAVE) || 'null');
      if (s && typeof s === 'object') {
        ['estrelas', 'bola', 'quadra'].forEach(function (k) { if (s[k] !== undefined) d[k] = s[k]; });
        if (s.rec) { d.rec.relogio = s.rec.relogio | 0; d.rec.minuto = s.rec.minuto | 0; }
        if (s.top) { d.top.relogio = (s.top.relogio || []).slice(0, 5); d.top.minuto = (s.top.minuto || []).slice(0, 5); }
        if (Array.isArray(s.comprados)) d.comprados = s.comprados;
        if (s.conquistas) d.conquistas = s.conquistas;
        if (s.stats) Object.keys(d.stats).forEach(function (k) { if (s.stats[k] !== undefined) d.stats[k] = s.stats[k]; });
        if (s.dia) d.dia = s.dia;
      }
    } catch (e) { /* começa do zero */ }
    return d;
  }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) { /* ignora */ } }
  function tem(tipo, id) { return id === 'classica' || id === 'azul' || dados.comprados.indexOf(tipo + ':' + id) >= 0; }
  function itemSel(lista, id) { return lista.filter(function (x) { return x.id === id; })[0] || lista[0]; }

  // desafios do dia: os mesmos o dia todo, sorteados pela data
  function garantirDesafios() {
    var h = hoje();
    if (dados.dia.data === h && dados.dia.itens.length === 3) return;
    var r = semente(parseInt(h.replace(/-/g, ''), 10));
    var pool = POOL_DESAFIOS.slice(), itens = [];
    for (var i = 0; i < 3; i++) {
      var k = Math.floor(r() * pool.length), p = pool.splice(k, 1)[0];
      itens.push({ tipo: p.tipo, n: p.ns[Math.floor(r() * p.ns.length)], feito: false });
    }
    dados.dia = { data: h, itens: itens, partidas: 0 };
    salvar();
  }
  function textoDesafio(it) {
    return POOL_DESAFIOS.filter(function (p) { return p.tipo === it.tipo; })[0].texto(it.n);
  }
  function progressoDesafio(it) {
    var j = jg;
    switch (it.tipo) {
      case 'chuas': return j ? j.chuas : 0;
      case 'pontos': return j ? j.pontos : 0;
      case 'sequencia': return j ? j.maxSeq : 0;
      case 'cestas': return j ? j.cestas : 0;
      case 'partidas': return dados.dia.partidas;
      case 'eletrico': return j && j.eletricoUsou ? 1 : 0;
      case 'fogo': return j && j.fogoUsou ? 1 : 0;
    }
    return 0;
  }
  // confere os desafios durante e depois da partida; devolve os recém-completos
  function conferirDesafios() {
    var novos = [];
    dados.dia.itens.forEach(function (it) {
      if (it.feito) return;
      if (progressoDesafio(it) >= it.n) {
        it.feito = true;
        dados.stats.desafios++;
        if (jg) jg.estrelasDesafio += RECOMPENSA_DESAFIO;
        dados.estrelas += RECOMPENSA_DESAFIO;
        novos.push(it);
      }
    });
    if (novos.length) {
      salvar();
      if (jg && tela === 'jogando') {
        avisar('Desafio do dia! ' + textoDesafio(novos[0]) + '  +' + RECOMPENSA_DESAFIO);
        som('cesta');
      }
    }
    return novos;
  }
  function conferirConquistas() {
    var novas = [];
    CONQUISTAS.forEach(function (c) {
      if (!dados.conquistas[c.id] && c.ok(dados)) {
        dados.conquistas[c.id] = hoje();
        dados.estrelas += RECOMPENSA_CONQUISTA;
        novas.push(c);
      }
    });
    if (novas.length) salvar();
    return novas;
  }

  // ---------- geometria ----------
  function medir() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    escala = Math.min(W / VW, H / VH);
    mw = Math.min(W / escala, 640); mh = H / escala;
    ox = (W - mw * escala) / 2;     // em tela larga o jogo fica numa coluna no meio
    chaoY = mh - 105;          // topo do piso de madeira
    quicaY = chaoY + 28;       // onde a bola quica
    hudBaixoPx = 120 + 92;     // o placar ocupa isso no alto da tela
  }
  function aroXs() { var x1 = mw - 34, x0 = x1 - ARO_LARG; return [x0, x1]; }
  function aroY() {
    var amp = limita(((jg ? jg.pontos : 0) - 15) * 2, 0, 45);
    return jg.aro.y + amp * Math.sin(jg.t * 1.3);
  }

  // ---------- partida ----------
  function novoJogo(modo) {
    garantirDesafios();
    jg = {
      modo: modo, tempo: TEMPOS[modo], comecou: false, pontos: 0, seq: 0, chuaSeq: 0, cestas: 0, chuas: 0, maxSeq: 0,
      fogoUsou: false, eletricoUsou: false, bolas: [], pronta: null, espera: 0, puxando: null,
      aro: { y: 0, alvo: 0 }, rede: 0, particulas: [], textos: [], raio: 0, t: 0, fimPend: false, fimEm: 0,
      estrelasDesafio: 0, tempoExtra: 0, moverAro: false
    };
    posicionarAro(true);
    criarPronta();
  }
  function posicionarAro(imediato) {
    var lo = hudBaixoPx / escala + 120, hi = chaoY - 360;
    if (hi < lo + 20) hi = lo + 20;
    var y = rnd(lo, hi);
    jg.aro.alvo = y;
    if (imediato) jg.aro.y = y;
  }
  function criarPronta() {
    jg.pronta = { x: rnd(R + 50, mw * 0.5), y: chaoY + 22, vx: 0, vy: 0, rot: 0, tocou: false, feita: false, errou: false, voando: false, anterior: 0, rastro: [], fogo: false, eletrico: false, idade: 0 };
  }

  function lancar(vx, vy) {
    var j = jg, b = j.pronta;
    if (!b) return false;
    b.vx = vx; b.vy = vy; b.voando = true; b.anterior = b.y;
    b.eletrico = j.chuaSeq >= ELETRICO_SEQ;
    b.fogo = !b.eletrico && j.seq >= FOGO_SEQ;
    j.bolas.push(b);
    j.pronta = null;
    j.comecou = true;
    j.espera = 0.3;
    j.moverAro = true;
    som('arremesso');
    return true;
  }

  function colidirPonto(b, px, py) {
    var dx = b.x - px, dy = b.y - py, d = Math.sqrt(dx * dx + dy * dy), lim = R + 6;
    if (d >= lim || d === 0) return;
    var nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny;
    b.x = px + nx * lim; b.y = py + ny * lim;
    if (vn < 0) { b.vx -= (1 + REST_ARO) * vn * nx; b.vy -= (1 + REST_ARO) * vn * ny; }
    if (!b.tocou) { b.tocou = true; }
    som('aro');
    jg.rede = Math.max(jg.rede, 0.5);
  }

  function marcar(b) {
    var j = jg;
    b.feita = true;
    var chua = !b.tocou;
    j.cestas++;
    dados.stats.cestas++;
    j.seq++;
    if (j.seq > j.maxSeq) j.maxSeq = j.seq;
    if (chua) { j.chuaSeq++; j.chuas++; dados.stats.chuas++; } else j.chuaSeq = 0;
    var eletrico = j.chuaSeq >= ELETRICO_SEQ;
    var fogo = j.seq >= FOGO_SEQ;
    if (eletrico) { j.eletricoUsou = true; dados.stats.eletrico = true; }
    if (fogo) { j.fogoUsou = true; dados.stats.fogo = true; }
    var mult = eletrico ? 3 : fogo ? 2 : 1;
    var pts = (chua ? 2 : 1) * mult;
    var extra = j.modo === 'relogio' ? (chua ? 3 : 2) + (fogo ? 1 : 0) + (eletrico ? 2 : 0) : 0;
    j.pontos += pts;
    j.tempo += extra;
    if (extra) j.tempoExtra += extra;
    if (j.pontos > dados.stats.maxPontos) dados.stats.maxPontos = j.pontos;
    if (j.maxSeq > dados.stats.maxSeq) dados.stats.maxSeq = j.maxSeq;
    j.rede = 1;
    var cor = eletrico ? '#7fd6ff' : fogo ? '#ffa24a' : chua ? '#6dffb0' : '#ffffff';
    var tit = eletrico ? 'ELÉTRICO!' : fogo ? 'PEGANDO FOGO!' : chua ? 'CHUÁ!' : 'CESTA!';
    var sub = '+' + pts + (extra ? '  +' + extra + ' s' : '') + (mult > 1 ? '  PONTOS ×' + mult : '');
    j.textos.push({ txt: tit, sub: sub, t: 0, cor: cor });
    if (eletrico) j.raio = 0.4;
    var xs = aroXs();
    for (var i = 0; i < (chua ? 26 : 14); i++) {
      j.particulas.push({ x: (xs[0] + xs[1]) / 2, y: aroY(), vx: rnd(-220, 220), vy: rnd(-380, -80), t: 0, vida: rnd(0.6, 1.1), cor: eletrico ? (i % 2 ? '#7fd6ff' : '#ffffff') : fogo ? (i % 2 ? '#ffa24a' : '#ffd166') : (i % 2 ? '#6dffb0' : '#ffffff'), tam: rnd(4, 8) });
    }
    som(eletrico ? 'eletrico' : chua ? 'chua' : 'cesta');
    b.vx *= 0.3; b.vy *= 0.75;
    conferirDesafios();
  }

  function errou(b) {
    b.errou = true;
    if (jg.seq > 0 || jg.chuaSeq > 0) { jg.seq = 0; jg.chuaSeq = 0; }
  }

  function passoBola(b, dt) {
    var j = jg, xs = aroXs(), ay = aroY();
    b.anterior = b.y;
    b.vy += G * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.rot += b.vx * dt * 0.025;
    b.idade += dt;
    b.rastro.push([b.x, b.y]); if (b.rastro.length > 9) b.rastro.shift();
    if (!b.feita && !b.errou) {
      colidirPonto(b, xs[0], ay);
      colidirPonto(b, xs[1], ay);
      var bx = xs[1] + 4;          // tabela
      if (b.x + R > bx && b.y > ay - 100 && b.y < ay + 26) {
        b.x = bx - R; b.vx = -Math.abs(b.vx) * 0.55; b.tocou = true; som('aro');
      }
      if (b.vy > 0 && b.anterior < ay && b.y >= ay && b.x > xs[0] + 8 && b.x < xs[1] - 8) marcar(b);
      else if (b.y > ay + 70 && b.vy > 0) errou(b);
    }
    if (b.y > quicaY) {
      b.y = quicaY;
      if (Math.abs(b.vy) > 140) { b.vy = -b.vy * REST_CHAO; som('quique'); } else b.vy = 0;
      b.vx *= 0.85;
      if (!b.feita && !b.errou) errou(b);
    }
    if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) * 0.6; }
    if (b.x > mw - R) { b.x = mw - R; b.vx = -Math.abs(b.vx) * 0.6; }
  }

  function atualizar(dt) {
    if (!jg) return;
    var j = jg;
    j.t += dt;
    j.aro.y += (j.aro.alvo - j.aro.y) * Math.min(1, dt * 6);
    j.rede = Math.max(0, j.rede - dt * 1.6);
    j.raio = Math.max(0, j.raio - dt);
    j.particulas = j.particulas.filter(function (p) { p.t += dt; p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; return p.t < p.vida; });
    j.textos = j.textos.filter(function (x) { x.t += dt; return x.t < 1.3; });
    if (tela !== 'jogando') { j.bolas.forEach(function (b) { passoBola(b, dt); }); return; }

    // tempo
    if (j.comecou && !j.fimPend) {
      j.tempo -= dt;
      if (j.tempo <= 0) { j.tempo = 0; j.fimPend = true; j.fimEm = 0; j.pronta = null; }
    }
    // bolas em voo (passos curtos para não atravessar o aro)
    var n = Math.max(1, Math.ceil(dt / (1 / 120)));
    for (var s = 0; s < n; s++) j.bolas.forEach(function (b) { passoBola(b, dt / n); });
    j.bolas = j.bolas.filter(function (b) { return b.y < mh + 200 && b.idade < 4.5 && !(b.idade > 1.2 && (b.feita || b.errou) && Math.abs(b.vy) < 5 && b.y >= quicaY - 1); });
    // bola nova pronta
    if (!j.pronta && !j.fimPend) {
      j.espera -= dt;
      if (j.espera <= 0) criarPronta();      // a bola nova já fica pronta logo depois do tiro
    }
    // o aro só muda de lugar quando nenhuma bola está no ar (não muda no meio do arremesso)
    if (j.moverAro && !j.fimPend && !j.bolas.some(function (b) { return !b.feita && !b.errou && b.idade < 3; })) {
      j.moverAro = false;
      posicionarAro(false);
    }
    if (j.fimPend) {
      j.fimEm += dt;
      var emVoo = j.bolas.some(function (b) { return !b.feita && !b.errou; });
      if (!emVoo || j.fimEm > 3) terminar();
    }
  }

  function terminar() {
    var j = jg;
    tela = 'fim';
    j.pronta = null;
    dados.dia.partidas++;
    dados.stats.partidas++;
    var novoRec = j.pontos > dados.rec[j.modo] && j.pontos > 0;
    if (novoRec) dados.rec[j.modo] = j.pontos;
    if (j.pontos > 0) {
      var lista = dados.top[j.modo];
      lista.push({ p: j.pontos, d: hoje() });
      lista.sort(function (a, b) { return b.p - a.p; });
      dados.top[j.modo] = lista.slice(0, 5);
    }
    var bonusRec = novoRec ? 5 : 0;
    var estrelas = j.cestas + j.chuas + bonusRec;
    dados.estrelas += estrelas;
    var desafios = conferirDesafios();
    var conquistas = conferirConquistas();
    salvar();
    j.resumo = { novoRec: novoRec, estrelas: estrelas + j.estrelasDesafio + conquistas.length * RECOMPENSA_CONQUISTA, cestas: j.cestas, chuas: j.chuas, bonusRec: bonusRec, desafios: j.estrelasDesafio, conquistas: conquistas };
    som(novoRec ? 'recorde' : 'fim');
    setTimeout(function () { if (tela === 'fim') mostrarFim(); }, 700);
  }

  // ---------- desenho ----------
  // clareia (k > 0) ou escurece (k < 0) uma cor '#rrggbb'
  function tom(hex, k) {
    var r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16);
    var alvo = k > 0 ? 255 : 0, a = Math.abs(k);
    return 'rgb(' + Math.round(r + (alvo - r) * a) + ',' + Math.round(g + (alvo - g) * a) + ',' + Math.round(b + (alvo - b) * a) + ')';
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }

  function bolaDesenho(c, x, y, r, sk, rot) {
    c.save();
    c.translate(x, y);
    var g = c.createRadialGradient(-r * 0.38, -r * 0.42, r * 0.08, 0, 0, r * 1.05);
    g.addColorStop(0, tom(sk.cor, 0.38)); g.addColorStop(0.5, sk.cor); g.addColorStop(1, tom(sk.cor, -0.5));
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = g; c.fill();
    c.save();
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.clip();
    c.rotate(rot || 0);
    c.fillStyle = 'rgba(0,0,0,0.13)';                 // textura de bola de couro
    var passo = r * 0.3;
    for (var j = -4; j <= 4; j++) for (var i = -4; i <= 4; i++) {
      c.beginPath(); c.arc(i * passo + (j % 2 ? passo / 2 : 0), j * passo * 0.87, r * 0.045, 0, 7); c.fill();
    }
    c.strokeStyle = sk.linha; c.lineWidth = Math.max(1.6, r * 0.1); c.lineCap = 'round';
    c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.moveTo(0, -r); c.lineTo(0, r); c.stroke();
    c.beginPath(); c.arc(-r * 1.25, 0, r * 0.98, -0.85, 0.85); c.stroke();
    c.beginPath(); c.arc(r * 1.25, 0, r * 0.98, Math.PI - 0.85, Math.PI + 0.85); c.stroke();
    c.restore();
    c.beginPath(); c.arc(0, 0, r - 0.5, 0, 7); c.strokeStyle = tom(sk.cor, -0.62); c.lineWidth = Math.max(1.4, r * 0.07); c.stroke();
    c.beginPath(); c.ellipse(-r * 0.36, -r * 0.46, r * 0.26, r * 0.14, -0.6, 0, 7); c.fillStyle = 'rgba(255,255,255,0.32)'; c.fill();
    c.restore();
  }

  function desenharFundo() {
    var q = itemSel(QUADRAS, dados.quadra);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, q.topo); g.addColorStop(1, q.base);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(dpr * escala, 0, 0, dpr * escala, dpr * ox, 0);
    var xa = -ox / escala, xb = (W - ox) / escala;   // da borda esquerda à direita da tela
    // formas grandes e suaves ao fundo (arquibancada), dão profundidade
    [[0.12, 0.62, 420, 250, -0.35], [0.95, 0.38, 340, 220, 0.5], [0.3, 0.2, 300, 180, 0.25], [0.8, 0.72, 380, 200, -0.2]].forEach(function (f) {
      ctx.save(); ctx.translate(mw * f[0], mh * f[1]); ctx.rotate(f[4]);
      ctx.fillStyle = 'rgba(255,255,255,0.028)'; rr(ctx, -f[2] / 2, -f[3] / 2, f[2], f[3], 60); ctx.fill(); ctx.restore();
    });
    // painéis da parede
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 2;
    for (var x = 0; x <= mw; x += 135) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, chaoY - 40); ctx.stroke(); }
    for (var y = 130; y < chaoY - 40; y += 270) { ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.stroke(); }
    // faixa laranja, arquibancada azul, linha branca e piso de madeira
    var lg = ctx.createLinearGradient(0, chaoY - 70, 0, chaoY - 36);
    lg.addColorStop(0, 'rgba(255,140,40,0)'); lg.addColorStop(1, 'rgba(255,140,40,0.35)');
    ctx.fillStyle = lg; ctx.fillRect(xa, chaoY - 70, xb - xa, 34);
    ctx.fillStyle = '#ff8a2a'; ctx.fillRect(xa, chaoY - 38, xb - xa, 3);
    ctx.fillStyle = q.faixa; ctx.fillRect(xa, chaoY - 35, xb - xa, 105);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (var px = Math.ceil(xa / 135) * 135; px < xb; px += 135) ctx.fillRect(px - 2, chaoY - 35, 4, 105);
    ctx.fillStyle = '#e9edf5'; ctx.fillRect(xa, chaoY + 70, xb - xa, 4);
    ctx.fillStyle = q.piso; ctx.fillRect(xa, chaoY + 74, xb - xa, mh - chaoY);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (var ty = chaoY + 100; ty < mh; ty += 34) ctx.fillRect(xa, ty, xb - xa, 2);
  }

  function desenharAro(frente) {
    var xs = aroXs(), ay = jg ? aroY() : 300, bx = xs[1] + 4, cx = (xs[0] + xs[1]) / 2, rx = ARO_LARG / 2;
    if (!frente) {
      // tabela de vidro (em perspectiva): reflexo, quadrado de mira e moldura
      var gv = ctx.createLinearGradient(bx - 6, 0, bx + 26, 0);
      gv.addColorStop(0, 'rgba(200,232,255,0.62)'); gv.addColorStop(1, 'rgba(110,160,210,0.32)');
      ctx.beginPath(); ctx.moveTo(bx - 6, ay - 138); ctx.lineTo(bx + 26, ay - 172); ctx.lineTo(bx + 26, ay + 56); ctx.lineTo(bx - 6, ay + 20); ctx.closePath();
      ctx.fillStyle = gv; ctx.fill();
      ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(235,248,255,0.85)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx - 1, ay - 112); ctx.lineTo(bx + 14, ay - 128); ctx.lineTo(bx + 14, ay - 70); ctx.lineTo(bx - 1, ay - 58); ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx - 1, ay - 54); ctx.lineTo(bx + 14, ay - 64); ctx.lineTo(bx + 14, ay + 2); ctx.lineTo(bx - 1, ay + 8); ctx.closePath();
      ctx.strokeStyle = 'rgba(255,150,70,0.9)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + 4, ay - 150); ctx.lineTo(bx + 20, ay - 168); ctx.lineTo(bx + 24, ay - 120); ctx.lineTo(bx + 8, ay - 98); ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
      // suporte metálico e metade de trás do aro
      ctx.strokeStyle = '#7d8896'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(xs[1] - 2, ay + 2); ctx.lineTo(bx + 2, ay + 2); ctx.stroke();
      ctx.strokeStyle = '#ff8a2a'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.ellipse(cx, ay, rx, 10, 0, Math.PI, 0); ctx.stroke();
      return;
    }
    // rede (balança ao acertar) e metade da frente do aro
    var bal = Math.sin(jg.t * 22) * 9 * jg.rede;
    ctx.strokeStyle = 'rgba(255,255,255,0.88)'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
    var n = 8, fundo = 66;
    for (var i = 0; i <= n; i++) {
      var f = i / n, ax = cx - rx + f * rx * 2, ex = cx + (f - 0.5) * rx * 0.72 + bal;
      ctx.beginPath(); ctx.moveTo(ax, ay + 4); ctx.lineTo(ex, ay + fundo); ctx.stroke();
    }
    for (var k = 1; k <= 4; k++) {
      var yy = ay + 4 + k * 15, ancho = rx * (1 - k * 0.07);
      ctx.beginPath();
      for (var m = 0; m <= n; m++) {
        var fx = cx + (m / n - 0.5) * ancho * 2 + bal * (k / 4);
        if (m) ctx.lineTo(fx, yy + (m % 2 ? 7 : 0)); else ctx.moveTo(fx, yy);
      }
      ctx.stroke();
    }
    var ga = ctx.createLinearGradient(0, ay - 10, 0, ay + 12);
    ga.addColorStop(0, '#ffb25c'); ga.addColorStop(1, '#e8641a');
    ctx.strokeStyle = ga; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(cx, ay, rx, 10, 0, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.arc(xs[0], ay, 6, 0, 7); ctx.fill();
  }

  function digito7(c, x, y, w, h, d, ligado, apagado) {
    // segmentos: a(topo) b(dir-cima) c(dir-baixo) d(base) e(esq-baixo) f(esq-cima) g(meio)
    var seg = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' }[d];
    var t = w * 0.2, m = h / 2;
    var pos = {
      a: [x + t * 0.6, y, w - t * 1.2, t], d: [x + t * 0.6, y + h - t, w - t * 1.2, t], g: [x + t * 0.6, y + m - t / 2, w - t * 1.2, t],
      f: [x, y + t * 0.6, t, m - t * 0.9], b: [x + w - t, y + t * 0.6, t, m - t * 0.9],
      e: [x, y + m + t * 0.3, t, m - t * 0.9], c: [x + w - t, y + m + t * 0.3, t, m - t * 0.9]
    };
    'abcdefg'.split('').forEach(function (s) {
      var r = pos[s];
      c.fillStyle = seg.indexOf(s) >= 0 ? ligado : apagado;
      c.beginPath(); if (c.roundRect) c.roundRect(r[0], r[1], r[2], r[3], t * 0.4); else c.rect(r[0], r[1], r[2], r[3]); c.fill();
    });
  }

  function chama(c, x, y, w, h, cor1, cor2, fase) {
    var g = c.createLinearGradient(0, y - h, 0, y);
    g.addColorStop(0, cor1); g.addColorStop(1, cor2);
    c.fillStyle = g;
    c.beginPath(); c.moveTo(x - w / 2, y);
    c.quadraticCurveTo(x - w * 0.55, y - h * 0.5, x + Math.sin(fase) * w * 0.15, y - h);
    c.quadraticCurveTo(x + w * 0.55, y - h * 0.5, x + w / 2, y);
    c.closePath(); c.fill();
  }
  function estrelaDesenho(c, x, y, r) {
    var g = c.createLinearGradient(0, y - r, 0, y + r);
    g.addColorStop(0, '#ffe98a'); g.addColorStop(1, '#f29a1a');
    c.beginPath();
    for (var i = 0; i < 10; i++) { var rr2 = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
    c.closePath(); c.fillStyle = g; c.fill(); c.lineJoin = 'round'; c.lineWidth = 2; c.strokeStyle = '#c47a14'; c.stroke();
  }

  function desenharPlacar() {
    var j = jg;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var topo = 116, mult = j.chuaSeq >= ELETRICO_SEQ ? 3 : j.seq >= FOGO_SEQ ? 2 : 1;
    var cor = mult === 3 ? '#7fd6ff' : mult === 2 ? '#ffb04a' : '#ffffff';
    var xe = ox + 18, xd = ox + mw * escala - 18, xc = ox + mw * escala / 2;
    ctx.textBaseline = 'alphabetic';
    // quantidade de estrelas (ao lado da casinha)
    var sx = ox + 112, sy = 40;
    var gp = ctx.createLinearGradient(0, sy, 0, sy + 50);
    gp.addColorStop(0, 'rgba(255,255,255,0.28)'); gp.addColorStop(1, 'rgba(255,255,255,0.10)');
    rr(ctx, sx, sy, 126, 50, 25); ctx.fillStyle = gp; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    estrelaDesenho(ctx, sx + 27, sy + 26, 17);
    ctx.fillStyle = '#ffffff'; ctx.font = '800 28px "Trebuchet MS", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(String(dados.estrelas), sx + 54, sy + 36);
    // medidor de fogo (enche com a sequência; chama quando ativa)
    var fx = xd - 140, fy = 74, fw = 140, prog = mult > 1 ? 1 : Math.min(1, j.seq / FOGO_SEQ);
    var quente = mult === 3 ? ['#e8fbff', '#46b8ff'] : ['#ffe07a', '#ff7a1f'];
    ctx.save();
    rr(ctx, fx, fy, fw, 20, 10); ctx.fillStyle = 'rgba(40,18,8,0.85)'; ctx.fill();
    ctx.save(); rr(ctx, fx, fy, fw, 20, 10); ctx.clip();
    var gf = ctx.createLinearGradient(fx, 0, fx + fw, 0); gf.addColorStop(0, mult === 3 ? '#2f86d8' : '#d9531a'); gf.addColorStop(1, quente[0]);
    ctx.fillStyle = gf; ctx.fillRect(fx, fy, fw * prog, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(fx, fy + 2, fw * prog, 5);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,200,120,0.55)'; ctx.lineWidth = 2; rr(ctx, fx, fy, fw, 20, 10); ctx.stroke();
    var nch = Math.round(prog * 7);
    for (var q = 0; q < nch; q++) {
      var cx2 = fx + 12 + q * ((fw - 24) / 6), alt = (mult > 1 ? 34 : 22) + Math.sin(j.t * 9 + q * 1.7) * 6;
      chama(ctx, cx2, fy + 4, 20, alt, quente[0], quente[1], j.t * 6 + q);
    }
    ctx.restore();
    // pontos e recorde (cartão de vidro)
    rr(ctx, xe - 12, topo + 2, 124, 100, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.09)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = mult > 1 ? cor : 'rgba(255,255,255,0.72)'; ctx.font = '700 15px "Trebuchet MS", sans-serif';
    ctx.fillText('PONTOS' + (mult > 1 ? ' ×' + mult : ''), xe, topo + 24);
    ctx.fillStyle = '#ffffff'; ctx.font = '800 46px "Trebuchet MS", sans-serif';
    ctx.fillText(String(j.pontos), xe, topo + 68);
    ctx.fillStyle = '#e8c176'; ctx.font = '700 14px "Trebuchet MS", sans-serif';
    ctx.fillText('RECORDE ' + Math.max(dados.rec[j.modo], 0), xe, topo + 90);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.font = '700 15px "Trebuchet MS", sans-serif';
    ctx.fillText('SEQUÊNCIA', xd, topo + 24);
    ctx.fillStyle = '#ffffff'; ctx.font = '800 46px "Trebuchet MS", sans-serif';
    ctx.fillText('×' + j.seq, xd, topo + 68);
    // placar de LEDs
    var bw = 136, bh = 88, bx = xc - bw / 2;
    var gm = ctx.createLinearGradient(0, topo, 0, topo + bh); gm.addColorStop(0, '#454a58'); gm.addColorStop(1, '#1d2029');
    rr(ctx, bx, topo, bw, bh, 14); ctx.fillStyle = gm; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.stroke();
    rr(ctx, bx + 8, topo + 10, bw - 16, bh - 20, 8); ctx.fillStyle = '#07080c'; ctx.fill();
    var seg = Math.min(99, Math.ceil(j.tempo - 0.001));
    if (seg < 0) seg = 0;
    var d1 = Math.floor(seg / 10), d2 = seg % 10;
    var ligado = seg <= 5 && j.comecou ? '#ff6a58' : '#ff3b2f';
    ctx.save(); ctx.shadowColor = 'rgba(255,60,40,0.8)'; ctx.shadowBlur = 10;
    digito7(ctx, bx + 25, topo + 21, 34, 46, d1, ligado, '#3a1210');
    digito7(ctx, bx + bw - 25 - 34, topo + 21, 34, 46, d2, ligado, '#3a1210');
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; rr(ctx, bx + 10, topo + 12, bw - 20, 18, 7); ctx.fill();
  }

  function desenharCena() {
    var j = jg;
    desenharFundo();
    ctx.setTransform(dpr * escala, 0, 0, dpr * escala, dpr * ox, 0);
    desenharAro(false);
    var sk = itemSel(BOLAS, dados.bola);
    // mira: curva luminosa que afina, pontinhos brancos e seta no fim
    if (j.puxando && j.pronta) {
      var v = velDaPuxada(j.puxando);
      if (v) {
        var N = 26, pts = [];
        for (var i = 0; i <= N; i++) {
          var t = i * 0.036;
          pts.push([j.pronta.x + v[0] * t, j.pronta.y + v[1] * t + 0.5 * G * t * t]);
        }
        ctx.save();
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(80,225,255,0.95)'; ctx.shadowBlur = 16 * dpr;
        for (var k = 0; k < N; k++) {
          var fr = k / N;
          ctx.strokeStyle = 'rgba(120,232,255,' + (0.9 - fr * 0.55).toFixed(2) + ')';
          ctx.lineWidth = 11 - fr * 8;
          ctx.beginPath(); ctx.moveTo(pts[k][0], pts[k][1]); ctx.lineTo(pts[k + 1][0], pts[k + 1][1]); ctx.stroke();
        }
        ctx.shadowBlur = 0;
        for (var d = 1; d < N; d += 2) {
          ctx.fillStyle = 'rgba(255,255,255,' + (0.95 - d * 0.025).toFixed(2) + ')';
          ctx.beginPath(); ctx.arc(pts[d][0], pts[d][1], 4.6 - d * 0.1, 0, 7); ctx.fill();
        }
        var a = pts[N], b = pts[N - 1], ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
        ctx.translate(a[0], a[1]); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(150,240,255,0.95)';
        ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-6, -11); ctx.lineTo(-1, 0); ctx.lineTo(-6, 11); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    // bolas em voo (com rastro de fogo ou eletricidade)
    j.bolas.forEach(function (b) {
      if (b.fogo || b.eletrico) {
        for (var k = 0; k < b.rastro.length; k++) {
          var f = k / b.rastro.length;
          ctx.fillStyle = (b.eletrico ? 'rgba(127,214,255,' : 'rgba(255,150,40,') + (f * 0.45).toFixed(2) + ')';
          ctx.beginPath(); ctx.arc(b.rastro[k][0], b.rastro[k][1], R * f * 0.9, 0, 7); ctx.fill();
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(b.x, quicaY + R * 0.9, R * 0.8 * limita(1 - (quicaY - b.y) / 900, 0.3, 1), 6, 0, 0, 7); ctx.fill();
      bolaDesenho(ctx, b.x, b.y, R, sk, b.rot);
    });
    if (j.pronta && tela !== 'menu') {
      var p = j.pronta;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(p.x, quicaY + R * 0.9, R * 0.8, 6, 0, 0, 7); ctx.fill();
      bolaDesenho(ctx, p.x, p.y, R, sk, 0);
    }
    desenharAro(true);
    // raio elétrico
    if (j.raio > 0) {
      var xs = aroXs(), ay = aroY(), cx = (xs[0] + xs[1]) / 2;
      ctx.strokeStyle = 'rgba(180,235,255,' + Math.min(1, j.raio * 4).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(cx + 40, 0);
      var yy = 0, sem = Math.floor(j.t * 30);
      while (yy < ay) { yy += 40; ctx.lineTo(cx + 20 * Math.sin(yy * 0.3 + sem) + (ay - yy) * 0.1, Math.min(yy, ay)); }
      ctx.stroke();
    }
    // partículas
    j.particulas.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.vida);
      ctx.fillStyle = p.cor; ctx.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
    });
    ctx.globalAlpha = 1;
    // textos
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    j.textos.forEach(function (x) {
      var a = x.t < 0.15 ? x.t / 0.15 : x.t > 1.0 ? Math.max(0, (1.3 - x.t) / 0.3) : 1;
      var y = hudBaixoPx + 70 - x.t * 24, esc = x.t < 0.15 ? 0.7 + x.t * 2 : 1;
      ctx.save();
      ctx.globalAlpha = a; ctx.translate(ox + mw * escala / 2, y); ctx.scale(esc, esc);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 ' + Math.round(Math.min(46, W / 9)) + 'px "Trebuchet MS", sans-serif';
      ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineJoin = 'round';
      ctx.strokeText(x.txt, 0, 0); ctx.fillStyle = x.cor; ctx.fillText(x.txt, 0, 0);
      ctx.font = '700 22px "Trebuchet MS", sans-serif';
      ctx.fillStyle = '#ffffff'; ctx.fillText(x.sub, 0, 34);
      ctx.restore();
    });
    if (tela === 'jogando') desenharPlacar();
    if (tela === 'jogando' && !j.comecou && !j.puxando) {
      var pw = Math.min(360, W - 40), px0 = ox + mw * escala / 2 - pw / 2, py0 = H * 0.58;
      var gh = ctx.createLinearGradient(0, py0, 0, py0 + 58);
      gh.addColorStop(0, 'rgba(255,255,255,0.30)'); gh.addColorStop(1, 'rgba(255,255,255,0.12)');
      rr(ctx, px0, py0, pw, 58, 29); ctx.fillStyle = gh; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '800 24px "Trebuchet MS", sans-serif';
      ctx.fillText('«  Arraste para trás e solte', px0 + pw / 2, py0 + 30);
    }
  }

  function desenhar() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!dados) return;
    if (!jg) novoJogoMenu();
    desenharCena();
  }
  function novoJogoMenu() { novoJogo('relogio'); }

  // ---------- toque ----------
  // ajuda de mira: se o tiro já vai perto do aro, empurra a velocidade na direção de um tiro que passa
  // pelo centro (só arcos altos, que não batem no aro na subida). A linha pontilhada mostra o resultado.
  function assistir(x0, y0, vx, vy) {
    if (ASSISTE_MIRA <= 0) return [vx, vy];
    var xs = aroXs(), cx = (xs[0] + xs[1]) / 2, cy = aroY(), melhor = null, dmin = 1e9;
    for (var t = 1.2; t <= 2.1; t += 0.02) {
      var ux = (cx - x0) / t, uy = (cy - y0 - 0.5 * G * t * t) / t;
      if (uy + G * t <= 60) continue;                       // tem de chegar ao aro descendo
      var d = Math.sqrt((ux - vx) * (ux - vx) + (uy - vy) * (uy - vy));
      if (d < dmin) { dmin = d; melhor = [ux, uy]; }
    }
    if (!melhor || dmin > ASSISTE_ALCANCE) return [vx, vy];
    var f = ASSISTE_MIRA * (1 - 0.5 * dmin / ASSISTE_ALCANCE);   // quanto mais perto, mais ajuda
    return [vx + (melhor[0] - vx) * f, vy + (melhor[1] - vy) * f];
  }
  function velDaPuxada(p) {
    var px = (p.x0 - p.x) / escala, py = (p.y0 - p.y) / escala;
    var len = Math.sqrt(px * px + py * py);
    if (len * escala < PUXAR_MIN_PX || py > -4 || !jg || !jg.pronta) return null;   // pouco ou para cima: não vale
    if (len > PUXAR_MAX) { px *= PUXAR_MAX / len; py *= PUXAR_MAX / len; }
    return assistir(jg.pronta.x, jg.pronta.y, px * K_PUXAR, py * K_PUXAR);
  }
  function aoPressionar(ev) {
    if (tela !== 'jogando' || !jg || !jg.pronta || jg.fimPend || jg.puxando) return;
    if (ev.pointerType === 'touch' && Math.max(ev.width || 0, ev.height || 0) > PALMA_PX) return;   // palma da mão
    ev.preventDefault();
    try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* ignora */ }
    var r = cv.getBoundingClientRect();
    var x = ev.clientX - r.left, y = ev.clientY - r.top;
    jg.puxando = { id: ev.pointerId, x0: x, y0: y, x: x, y: y };
  }
  function aoMover(ev) {
    if (!jg || !jg.puxando || ev.pointerId !== jg.puxando.id) return;
    var r = cv.getBoundingClientRect();
    jg.puxando.x = ev.clientX - r.left; jg.puxando.y = ev.clientY - r.top;
  }
  function aoSoltar(ev) {
    if (!jg || !jg.puxando || ev.pointerId !== jg.puxando.id) return;
    var r = cv.getBoundingClientRect();
    jg.puxando.x = ev.clientX - r.left; jg.puxando.y = ev.clientY - r.top;
    var v = ev.type === 'pointercancel' ? null : velDaPuxada(jg.puxando);
    jg.puxando = null;
    if (v) lancar(v[0], v[1]);
  }

  // ---------- telas (menu, painéis, fim) ----------
  function mostrarMenu() {
    tela = 'menu';
    novoJogoMenu();
    $('bk-menu').hidden = false;
    $('bk-painel').hidden = true;
    $('bk-fim').hidden = true;
    $('bk-estrelas').textContent = dados.estrelas;
    $('bk-rec-relogio').textContent = dados.rec.relogio;
    $('bk-rec-minuto').textContent = dados.rec.minuto;
    var notif = dados.dia.itens.filter(function (i) { return !i.feito; }).length;
    var b = $('bk-notif-desafios');
    b.textContent = notif; b.hidden = notif === 0;
  }
  function comecar(modo) {
    novoJogo(modo);
    tela = 'jogando';
    $('bk-menu').hidden = true; $('bk-painel').hidden = true; $('bk-fim').hidden = true;
    som('abrir');
  }
  function avisar(txt) {
    var a = $('bk-aviso');
    a.textContent = txt; a.hidden = false;
    a.classList.remove('mostra'); void a.offsetWidth; a.classList.add('mostra');
    clearTimeout(avisar.t);
    avisar.t = setTimeout(function () { a.hidden = true; }, 3200);
  }
  function mostrarFim() {
    var j = jg, r = j.resumo;
    $('bk-fim-modo').textContent = NOMES_MODO[j.modo];
    $('bk-fim-pontos').textContent = j.pontos;
    $('bk-fim-rec').textContent = r.novoRec ? 'Novo recorde!' : 'Recorde: ' + dados.rec[j.modo];
    $('bk-fim-estrelas').textContent = '+' + r.estrelas + ' estrelas';
    var partes = ['cestas +' + r.cestas, 'chuás +' + r.chuas];
    if (r.bonusRec) partes.push('recorde +' + r.bonusRec);
    if (r.desafios) partes.push('desafios +' + r.desafios);
    if (r.conquistas.length) partes.push('conquistas +' + r.conquistas.length * RECOMPENSA_CONQUISTA);
    $('bk-fim-detalhe').textContent = partes.join(' · ');
    $('bk-fim-novas').textContent = r.conquistas.map(function (c) { return 'Conquista: ' + c.nome; }).join('  ');
    $('bk-fim').hidden = false;
  }

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function miniBola(sk) {
    var c = document.createElement('canvas'); c.width = c.height = 96;
    bolaDesenho(c.getContext('2d'), 48, 48, 40, sk, 0.4);
    return c;
  }
  function miniQuadra(q) {
    var c = document.createElement('canvas'); c.width = 120; c.height = 96;
    var x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 96);
    g.addColorStop(0, q.topo); g.addColorStop(1, q.base);
    x.fillStyle = g; x.fillRect(0, 0, 120, 96);
    x.fillStyle = q.faixa; x.fillRect(0, 50, 120, 22);
    x.fillStyle = '#ff8a2a'; x.fillRect(0, 48, 120, 2);
    x.fillStyle = q.piso; x.fillRect(0, 74, 120, 22);
    return c;
  }

  function abrirPainel(aba) {
    var corpo = $('bk-painel-corpo'), titulo = $('bk-painel-titulo');
    corpo.innerHTML = '';
    $('bk-menu').hidden = true; $('bk-painel').hidden = false;
    if (aba === 'desafios') {
      titulo.textContent = 'Desafios do dia';
      garantirDesafios();
      dados.dia.itens.forEach(function (it) {
        var prog = Math.min(it.n, it.feito ? it.n : progressoDesafio(it));
        var l = el('div', 'bk-linha' + (it.feito ? ' feito' : ''));
        l.appendChild(el('span', 'bk-check', it.feito ? '✓' : ''));
        var t = el('div', 'bk-texto');
        t.appendChild(el('b', '', textoDesafio(it)));
        t.appendChild(el('small', '', it.feito ? 'Feito!' : (it.tipo === 'partidas' ? prog + ' de ' + it.n : 'Vale em uma partida')));
        l.appendChild(t);
        l.appendChild(el('span', 'bk-premio', '★ +' + RECOMPENSA_DESAFIO));
        corpo.appendChild(l);
      });
      corpo.appendChild(el('p', 'bk-nota', 'Os desafios mudam todo dia.'));
    } else if (aba === 'vestiario') {
      titulo.textContent = 'Vestiário';
      corpo.appendChild(el('p', 'bk-estrelas-linha', '★ ' + dados.estrelas + ' estrelas'));
      var grade = el('div', 'bk-grade');
      function item(tipo, lista, atual, montar) {
        lista.forEach(function (x) {
          var comprado = x.preco === 0 || dados.comprados.indexOf(tipo + ':' + x.id) >= 0;
          var c = el('button', 'bk-item' + (atual === x.id ? ' sel' : ''));
          c.type = 'button';
          c.appendChild(montar(x));
          c.appendChild(el('b', '', x.nome));
          c.appendChild(el('small', '', atual === x.id ? 'Em uso' : comprado ? 'Usar' : '★ ' + x.preco));
          if (!comprado && dados.estrelas < x.preco) c.classList.add('caro');
          c.addEventListener('click', function () {
            Som.liberar();
            if (!comprado) {
              if (dados.estrelas < x.preco) { som('bate'); return; }
              dados.estrelas -= x.preco; dados.comprados.push(tipo + ':' + x.id);
              conferirConquistas();
              som('chua');
            } else som('toque');
            if (tipo === 'bola') dados.bola = x.id; else dados.quadra = x.id;
            salvar(); abrirPainel('vestiario');
          });
          grade.appendChild(c);
        });
      }
      corpo.appendChild(el('h3', '', 'Bolas'));
      item('bola', BOLAS, dados.bola, miniBola);
      corpo.appendChild(grade);
      var grade2 = el('div', 'bk-grade');
      corpo.appendChild(el('h3', '', 'Quadras'));
      grade = grade2;
      item('quadra', QUADRAS, dados.quadra, miniQuadra);
      corpo.appendChild(grade2);
    } else if (aba === 'recordes') {
      titulo.textContent = 'Recordes';
      ['relogio', 'minuto'].forEach(function (m) {
        corpo.appendChild(el('h3', '', NOMES_MODO[m]));
        var lista = dados.top[m];
        if (!lista.length) corpo.appendChild(el('p', 'bk-nota', 'Ainda sem partidas.'));
        lista.forEach(function (x, i) {
          var d = x.d.split('-');
          var l = el('div', 'bk-linha');
          l.appendChild(el('span', 'bk-pos', String(i + 1)));
          l.appendChild(el('div', 'bk-texto', '<b>' + x.p + ' pontos</b><small>' + d[2] + '/' + d[1] + '</small>'));
          corpo.appendChild(l);
        });
      });
      corpo.appendChild(el('p', 'bk-nota', 'Os recordes ficam só neste aparelho.'));
    } else {
      titulo.textContent = 'Conquistas';
      var total = CONQUISTAS.filter(function (c) { return dados.conquistas[c.id]; }).length;
      corpo.appendChild(el('p', 'bk-estrelas-linha', total + ' de ' + CONQUISTAS.length));
      CONQUISTAS.forEach(function (c) {
        var ok = !!dados.conquistas[c.id];
        var l = el('div', 'bk-linha' + (ok ? ' feito' : ''));
        l.appendChild(el('span', 'bk-check', ok ? '✓' : ''));
        l.appendChild(el('div', 'bk-texto', '<b>' + c.nome + '</b><small>' + c.desc + '</small>'));
        l.appendChild(el('span', 'bk-premio', '★ +' + RECOMPENSA_CONQUISTA));
        corpo.appendChild(l);
      });
    }
  }

  // ---------- laço principal ----------
  function quadro(t) {
    if (!rodando) return;
    var dt = Math.min(0.05, (t - ultimoQuadro) / 1000 || 0);
    ultimoQuadro = t;
    if (!congelado) atualizar(dt);
    desenhar();
    idQuadro = requestAnimationFrame(quadro);
  }

  function montar() {
    montado = true;
    cv = $('cv-basquete');
    ctx = cv.getContext('2d');
    cv.addEventListener('pointerdown', aoPressionar);
    cv.addEventListener('pointermove', aoMover);
    cv.addEventListener('pointerup', aoSoltar);
    cv.addEventListener('pointercancel', aoSoltar);
    $('bk-modo-relogio').addEventListener('click', function () { Som.liberar(); comecar('relogio'); });
    $('bk-modo-minuto').addEventListener('click', function () { Som.liberar(); comecar('minuto'); });
    [].forEach.call(document.querySelectorAll('.bk-aba'), function (b) {
      b.addEventListener('click', function () { Som.liberar(); som('toque'); abrirPainel(b.getAttribute('data-aba')); });
    });
    $('bk-painel-voltar').addEventListener('click', function () { Som.liberar(); som('voltar'); mostrarMenu(); });
    $('bk-denovo').addEventListener('click', function () { Som.liberar(); comecar(jg.modo); });
    $('bk-fim-menu').addEventListener('click', function () { Som.liberar(); som('voltar'); mostrarMenu(); });
  }

  function redimensionar() { if (rodando) { medir(); if (jg && jg.aro) posicionarAro(true); } }

  window.Jogos = window.Jogos || {};
  window.Jogos.basquete = {
    entrar: function () {
      if (!montado) montar();
      dados = carregar();
      rodando = true; congelado = false;
      medir();
      garantirDesafios();
      mostrarMenu();
      window.addEventListener('resize', redimensionar);
      ultimoQuadro = performance.now();
      idQuadro = requestAnimationFrame(quadro);
    },
    sair: function () {
      rodando = false;
      cancelAnimationFrame(idQuadro);
      window.removeEventListener('resize', redimensionar);
      clearTimeout(avisar.t);
    },
    // ganchos para os testes
    _teste: {
      jogo: function () { return jg; },
      dados: function () { return dados; },
      tela: function () { return tela; },
      passo: function (dt) { atualizar(dt); },
      congelar: function (v) { congelado = !!v; },
      desenhar: desenhar,
      lancar: lancar,
      assistir: assistir,
      comecar: comecar,
      geo: function () { var xs = aroXs(); return { x0: xs[0], x1: xs[1], y: aroY(), mw: mw, mh: mh, chaoY: chaoY, escala: escala }; },
      constantes: function () { return { G: G, R: R, FOGO_SEQ: FOGO_SEQ, ELETRICO_SEQ: ELETRICO_SEQ, TEMPOS: TEMPOS }; },
      // velocidade que faz a bola passar pelo centro do aro em t segundos (chuá certo)
      mirar: function (t) {
        var b = jg.pronta, xs = aroXs(), ay = jg.aro.y;
        t = t || 1.35;
        return [((xs[0] + xs[1]) / 2 - b.x) / t, (ay - b.y - 0.5 * G * t * t) / t];
      },
      zerarAmplitude: function () { jg.pontos = Math.min(jg.pontos, 15); },
      avancar: function (seg) { var n = Math.round(seg * 60); for (var i = 0; i < n; i++) { atualizar(1 / 60); } }
    }
  };
})();
