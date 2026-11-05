/* Jogo Bolinhas: ordenar bolinhas por cor numa esteira.
   Toque numa coluna de blocos: o bloco da frente solta as bolinhas, que sobem na esteira.
   Quando uma bolinha passa na frente de uma bandeja da mesma cor, ela cai num dos 3 buracos.
   Bandeja cheia sai e a próxima da fila vem. Ganha quem esvazia todas as filas;
   perde quando a esteira enche de bolinhas que ninguém quer. */
(function () {
  'use strict';

  // ---------- constantes (tudo é desenhado num "mundo" de 720 de largura e depois escalado) ----------
  var VW = 720;
  var CS = 96, GAP = 10;          // célula do quadro e espaço entre células
  var BOLA = 17;                  // raio das bolinhas
  var BURACOS = 3;                // bolinhas que cabem em cada bandeja
  var POR_BLOCO = 9;              // bolinhas em cada bloco
  var TEMPO_VOLTA = 7;            // segundos para a esteira dar uma volta
  var L = 470, RP = 40, RPO = 66; // esteira: reta, raio do caminho das bolinhas, raio de fora
  var BAND_H = 64, BAND_PASSO = 38, VISIVEIS = 4;
  var TRAVA_SEG = 1.2;            // segundos sem saída para perder
  var CHAVE_NIVEL = 'joguinhos.bolinhas.nivel';
  var TRACO = '#6b5b53';

  // [cor, mais escura]
  var CORES = [
    ['#e45b5b', '#b53f3f'], ['#f5a3c7', '#d27ba0'], ['#e0904f', '#b56d33'], ['#4d7fe3', '#3159b3'],
    ['#6fd8e0', '#46aeb8'], ['#9a6fe0', '#7448b8'], ['#6cc57c', '#44985a'], ['#f4d35e', '#c9a73a']
  ];
  var CINZA = ['#9fb0b4', '#74878c'];

  var $ = function (id) { return document.getElementById(id); };
  var cv, ctx, W = 0, H = 0, dpr = 1, escala = 1, ox = 0, oy = 0;
  var rodando = false, ultimoQuadro = 0, idQuadro = 0, congelado = false;
  var jogo = null, geo = null, montado = false, simulando = false;
  var P = 2 * L + 2 * Math.PI * RP;   // comprimento do caminho da esteira
  var LH = L / 2;

  // ---------- util ----------
  function semente(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function embaralha(lista, rnd) {
    for (var i = lista.length - 1; i > 0; i--) {
      var k = Math.floor(rnd() * (i + 1)), t = lista[i]; lista[i] = lista[k]; lista[k] = t;
    }
    return lista;
  }
  function lerNivel() { try { return Math.max(1, parseInt(localStorage.getItem(CHAVE_NIVEL), 10) || 1); } catch (e) { return 1; } }
  function gravarNivel(n) { try { localStorage.setItem(CHAVE_NIVEL, String(n)); } catch (e) { /* ignora */ } }
  function mistura(hex, k) {   // clareia (k > 0) a cor
    var r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16);
    return 'rgb(' + Math.round(r + (255 - r) * k) + ',' + Math.round(g + (255 - g) * k) + ',' + Math.round(b + (255 - b) * k) + ')';
  }
  function suaviza(t) { return t * t * (3 - 2 * t); }
  function limita(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function som(nome) { if (!simulando) Som.tocar(nome); }

  // ---------- geração dos níveis ----------
  // Todo nível tem solução: as bandejas são distribuídas nas filas seguindo uma ordem de blocos
  // que funciona (cada bloco tem 3 bandejas da sua cor, e elas ficam todas na frente na hora certa).
  function sequenciaCores(total, nCores, janela, rnd) {
    var resto = [], seq = [], i;
    for (i = 0; i < nCores; i++) resto.push(Math.floor(total / nCores) + (i < total % nCores ? 1 : 0));
    for (var s = 0; s < total; s++) {
      var recentes = seq.slice(-janela), cand = [], max = 0;
      for (i = 0; i < nCores; i++) if (resto[i] > 0 && recentes.indexOf(i) < 0) cand.push(i);
      if (!cand.length) for (i = 0; i < nCores; i++) if (resto[i] > 0) cand.push(i);
      cand.forEach(function (c) { if (resto[c] > max) max = resto[c]; });
      cand = cand.filter(function (c) { return resto[c] === max; });
      var esc = cand[Math.floor(rnd() * cand.length)];
      seq.push(esc); resto[esc]--;
    }
    return seq;
  }

  function criarNivel(n, tentativa) {
    var rnd = semente(n * 7919 + 101 + (tentativa || 0) * 104729);
    var cols = n <= 2 ? 3 : n <= 6 ? 4 : 5;
    var linhas = n <= 2 ? 2 : n <= 4 ? 3 : n <= 8 ? 4 : n <= 14 ? 5 : 6;
    var alturas = [], total = 0, c;
    for (c = 0; c < cols; c++) {
      var h = linhas;
      if (n > 3 && (c === 0 || c === cols - 1)) h -= 1;
      if (n > 5 && rnd() < 0.25) h -= 1;
      h = Math.max(1, h);
      alturas.push(h); total += h;
    }
    var nCores = Math.min(8, 2 + Math.ceil(n / 3), total);
    var paleta = embaralha([0, 1, 2, 3, 4, 5, 6, 7], rnd).slice(0, nCores);
    // uma ordem de soltar os blocos (sempre o de baixo de uma coluna); as cores seguem uma
    // sequência sem repetir cor nos blocos vizinhos, senão uma bandeja pode ficar esperando à toa
    var seq = sequenciaCores(total, nCores, Math.min(3, nCores - 1), rnd);
    var resto = alturas.slice(), ordemCols = [], ordemCores = [], celulas = [];
    for (c = 0; c < cols; c++) celulas.push(new Array(alturas[c]));
    for (var s = 0; s < total; s++) {
      var abertas = [];
      for (c = 0; c < cols; c++) if (resto[c] > 0) abertas.push(c);
      var esc = abertas[Math.floor(rnd() * abertas.length)];
      var cor = paleta[seq[s]];
      celulas[esc][alturas[esc] - resto[esc]] = cor;
      ordemCols.push(esc);
      ordemCores.push(cor);
      resto[esc]--;
    }
    var Q = n <= 2 ? 3 : 4;
    var filas = [];
    for (var q = 0; q < Q; q++) filas.push([]);
    var idx = 0;
    var pOculta = n < 4 ? 0 : Math.min(0.45, 0.07 * (n - 3));
    ordemCores.forEach(function (cor) {
      for (var b = 0; b < 3; b++) {
        var fila = filas[idx % Q];
        fila.push({ cor: cor, oculta: fila.length > 0 && rnd() < pOculta });
        idx++;
      }
    });
    var K = n <= 2 ? 28 : limita(28 - Math.floor((n - 2) / 3), 18, 28);
    return { n: n, cols: cols, alturas: alturas, celulas: celulas, ordemCols: ordemCols, ordemCores: ordemCores, filas: filas, Q: Q, K: K, total: total, nCores: nCores };
  }

  // ---------- geometria do mundo ----------
  function calcularGeo() {
    var d = jogo.dados;
    var lm = Math.max(3, Math.max.apply(null, d.alturas));
    var g = { lm: lm };
    g.gridTop = 24;
    g.gridH = lm * CS + (lm - 1) * GAP;
    g.gridBottom = g.gridTop + g.gridH;
    g.gridW = d.cols * CS + (d.cols - 1) * GAP;
    g.gx0 = (VW - g.gridW) / 2;
    g.yAb = g.gridBottom + 12 + 120;          // abertura do funil
    g.yb = g.yAb + RPO - 18;                  // centro da esteira
    g.cx = VW / 2;
    g.TW = Math.min(138, (L + 40) / d.Q);
    g.trayW = g.TW - 14;
    g.qTop = g.yb + RPO + 14;
    g.altura = g.qTop + BAND_H + (VISIVEIS - 1) * BAND_PASSO + 44;
    return g;
  }
  function medir() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (!geo) return;
    var topo = 112, livre = H - topo - 8;
    escala = Math.min(W / VW, livre / geo.altura);
    ox = (W - VW * escala) / 2;
    oy = topo + (livre - geo.altura * escala) / 2;
  }

  // posição na esteira (relativa ao centro dela) para uma distância s ao longo do caminho
  function noCaminho(s) {
    s = ((s % P) + P) % P;
    if (s < L) return [-LH + s, -RP];
    s -= L;
    if (s < Math.PI * RP) { var a = -Math.PI / 2 + s / RP; return [LH + Math.cos(a) * RP, Math.sin(a) * RP]; }
    s -= Math.PI * RP;
    if (s < L) return [LH - s, RP];
    s -= L;
    var a2 = Math.PI / 2 + s / RP;
    return [-LH + Math.cos(a2) * RP, Math.sin(a2) * RP];
  }
  function distCirc(a, b) { return Math.abs((((a - b + P / 2) % P) + P) % P - P / 2); }
  function xBandeja(q) { return geo.cx + (q - (jogo.dados.Q - 1) / 2) * geo.TW; }
  function yBandeja(i) { return i === 0 ? geo.qTop : geo.qTop + BAND_H + (i - 1) * BAND_PASSO - 8; }
  function centroCelula(c, r) {
    return [geo.gx0 + c * (CS + GAP) + CS / 2, geo.gridBottom - r * (CS + GAP) - CS / 2];
  }
  // lugar da bolinha de número i esperando no funil
  function lugarNoFunil(i) {
    i = Math.min(i, 29);
    var col = i % 5, lin = Math.floor(i / 5);
    return [geo.cx + (col - 2) * (BOLA * 2.05) + (lin % 2 ? BOLA : 0) - (lin % 2 ? BOLA * 0.5 : 0), geo.yAb - 24 - lin * BOLA * 1.8];
  }

  // ---------- estado do jogo ----------
  function criarEstado(d) {
    var n = d.n;
    var estado = {
      n: n, dados: d, fase: 'jogando', t: 0, fim: 0, deslocamento: 0, travado: 0,
      celulas: d.celulas.map(function (col) { return col.slice(); }),
      filas: d.filas.map(function (fila, q) {
        return fila.map(function (b) { return { cor: b.cor, oculta: b.oculta, enchido: 0, chegando: 0, ult: -9, y: null, revela: 0, q: q }; });
      }),
      esteira: [], funil: [], voos: [], blocosSaindo: [], bandejasSaindo: [], restantes: d.total, tocados: 0
    };
    for (var k = 0; k < d.K; k++) estado.esteira.push(null);
    estado.filas.forEach(function (fila) { if (fila[0]) fila[0].oculta = false; });
    return estado;
  }

  // joga o nível sozinho, soltando os blocos na ordem do gerador, só quando a esteira está vazia
  function jogarSozinho(maxSeg) {
    var j = jogo, prox = 0, dt = 1 / 30;
    while (j.t < maxSeg && j.fase === 'jogando') {
      var parado = j.funil.length === 0 && j.voos.length === 0 && j.esteira.every(function (b) { return !b; });
      if (parado && prox < j.dados.ordemCols.length) liberar(j.dados.ordemCols[prox++]);
      atualizar(dt);
    }
    return j.fase === 'ganhou' ? j.t : -1;
  }

  // gera o nível e confere (por simulação) que dá para vencer; se não der, tenta outra variação
  function gerarNivel(n) {
    var salvoJogo = jogo, salvoGeo = geo, d = null;
    simulando = true;
    try {
      for (var tentativa = 0; tentativa < 60; tentativa++) {
        d = criarNivel(n, tentativa);
        d.tentativa = tentativa;
        jogo = criarEstado(d);
        geo = calcularGeo();
        if (jogarSozinho(900) >= 0) break;
      }
    } finally {
      simulando = false;
      jogo = salvoJogo; geo = salvoGeo;
    }
    return d;
  }

  function novoNivel(n) {
    jogo = criarEstado(gerarNivel(n));
    geo = calcularGeo();
    $('bo-n').textContent = n;
    $('bo-fim').hidden = true;
    $('bo-niveis').hidden = true;
    $('bo-opcoes').hidden = false;
    medir();
  }

  function liberar(c) {
    var j = jogo;
    if (!j || j.fase !== 'jogando') return false;
    var r = -1;
    for (var i = 0; i < j.celulas[c].length; i++) if (j.celulas[c][i] !== null) { r = i; break; }
    if (r < 0) return false;
    var cor = j.celulas[c][r];
    j.celulas[c][r] = null;
    j.restantes--;
    j.tocados++;
    var ce = centroCelula(c, r);
    j.blocosSaindo.push({ cor: cor, x: ce[0], y: ce[1], t: 0 });
    for (var b = 0; b < POR_BLOCO; b++) {
      var idx = j.funil.length;
      var al = lugarNoFunil(idx);
      j.funil.push({
        cor: cor, x0: ce[0] + ((b % 3) - 1) * 24, y0: ce[1] + (Math.floor(b / 3) - 1) * 24,
        t0: j.t + b * 0.05, dur: 0.5, chegou: false, px: ce[0], py: ce[1], alvo: al
      });
    }
    som('bloco');
    return true;
  }

  function podeCapturar(fr) { return fr && fr.enchido + fr.chegando < BURACOS; }

  function temSaida() {
    var j = jogo;
    var cheia = j.esteira.every(function (b) { return b !== null; });
    var semBlocos = j.restantes <= 0;
    if (!cheia && !semBlocos) return true;
    var abertas = {};
    j.filas.forEach(function (fila) { if (podeCapturar(fila[0])) abertas[fila[0].cor] = true; });
    var bolas = j.esteira.filter(function (b) { return b !== null; });
    if (!cheia) bolas = bolas.concat(j.funil);
    return bolas.some(function (b) { return abertas[b.cor]; });
  }

  function atualizar(dt) {
    var j = jogo, d = j.dados, K = d.K, passoS = P / K;
    j.t += dt;
    var jogando = j.fase === 'jogando';
    if (jogando) j.deslocamento = (j.deslocamento + P / TEMPO_VOLTA * dt) % P;

    // bolinhas no funil: chegada e posição
    j.funil.forEach(function (b, i) {
      if (!b.chegou && j.t >= b.t0 + b.dur) b.chegou = true;
      var p = limita((j.t - b.t0) / b.dur, 0, 1);
      var al = lugarNoFunil(i);
      if (!b.chegou) {
        b.px = b.x0 + (al[0] - b.x0) * p;
        b.py = b.y0 + (al[1] - b.y0) * p * p;
      } else {
        var m = Math.min(1, dt * 16);
        b.px += (al[0] - b.px) * m; b.py += (al[1] - b.py) * m;
      }
    });

    if (jogando) {
      // funil -> esteira
      if (j.funil.length && j.funil[0].chegou) {
        for (var k = 0; k < K; k++) {
          if (j.esteira[k]) continue;
          var s = (j.deslocamento + k * passoS) % P;
          if (distCirc(s, LH) < passoS * 0.5) {
            var b = j.funil.shift();
            j.esteira[k] = { cor: b.cor, ex: b.px, ey: b.py, te: 0 };
            break;
          }
        }
      }
      // esteira -> bandejas
      for (var q = 0; q < d.Q; q++) {
        var fr = j.filas[q][0];
        if (!podeCapturar(fr) || j.t - fr.ult < 0.09) continue;
        for (var k2 = 0; k2 < K; k2++) {
          var bola = j.esteira[k2];
          if (!bola || bola.te < 1 || bola.cor !== fr.cor) continue;
          var s2 = (j.deslocamento + k2 * passoS) % P;
          if (s2 < L + Math.PI * RP || s2 > 2 * L + Math.PI * RP) continue;   // só o trecho de baixo
          var pos = noCaminho(s2), x = geo.cx + pos[0];
          if (Math.abs(x - xBandeja(q)) > geo.trayW / 2 - 4) continue;
          var buraco = fr.enchido + fr.chegando;
          fr.chegando++;
          fr.ult = j.t;
          j.esteira[k2] = null;
          j.voos.push({ cor: fr.cor, x0: x, y0: geo.yb + pos[1], x1: xBandeja(q) + (buraco - 1) * 34, y1: geo.qTop + 38, t: 0, fr: fr });
          break;
        }
      }
    }
    j.esteira.forEach(function (b) { if (b && b.te < 1) b.te = Math.min(1, b.te + dt / 0.16); });

    // voos até os buracos
    for (var v = j.voos.length - 1; v >= 0; v--) {
      var vo = j.voos[v];
      vo.t += dt / 0.2;
      if (vo.t >= 1) {
        j.voos.splice(v, 1);
        var f = vo.fr;
        f.chegando--; f.enchido++;
        som('bola');
        if (f.enchido >= BURACOS) fecharBandeja(f);
      }
    }
    j.blocosSaindo = j.blocosSaindo.filter(function (b) { b.t += dt / 0.2; return b.t < 1; });
    j.bandejasSaindo = j.bandejasSaindo.filter(function (b) { b.t += dt / 0.4; return b.t < 1; });

    // posição das bandejas nas filas (deslizam suavemente)
    j.filas.forEach(function (fila, i0) {
      fila.forEach(function (b, i) {
        var alvo = yBandeja(i);
        if (b.y === null) b.y = alvo + 30;
        b.y += (alvo - b.y) * Math.min(1, dt * 12);
        if (i === 0 && b.oculta) { b.oculta = false; b.revela = 1; }
        if (b.revela > 0) b.revela = Math.max(0, b.revela - dt / 0.3);
      });
    });

    if (!jogando) {
      if (j.fim > 0) { j.fim -= dt; if (j.fim <= 0) mostrarFim(); }
      return;
    }
    // vitória e derrota
    var vazias = j.filas.every(function (fila) { return fila.length === 0; });
    if (vazias && j.voos.length === 0) {
      j.fase = 'ganhou'; j.fim = 0.8;
      if (!simulando) gravarNivel(Math.max(lerNivel(), j.n + 1));   // jogar um nível antigo não faz perder o avanço
      som('recorde');
      return;
    }
    var quieto = j.voos.length === 0 && j.esteira.every(function (b) { return !b || b.te >= 1; });
    if (quieto && !temSaida()) j.travado += dt; else j.travado = 0;
    if (j.travado > TRAVA_SEG) { j.fase = 'perdeu'; j.fim = 0.6; som('fim'); }
  }

  function fecharBandeja(f) {
    var j = jogo, fila = j.filas[f.q];
    var i = fila.indexOf(f);
    if (i >= 0) fila.splice(i, 1);
    j.bandejasSaindo.push({ cor: f.cor, x: xBandeja(f.q), y: f.y === null ? geo.qTop : f.y, t: 0, q: f.q });
    som('bandeja');
  }

  // ---------- desenho ----------
  function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }

  function desenharBola(x, y, cor, esc) {
    var c = CORES[cor], r = BOLA * (esc || 1);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = c[0]; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = c[1]; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - r * 0.32, y - r * 0.34, r * 0.3, 0, 7); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
  }

  function desenharBloco(x, y, cor, ativo, esc, alfa) {
    var c = CORES[cor];
    ctx.save();
    ctx.translate(x, y); ctx.scale(esc || 1, esc || 1);
    if (alfa !== undefined) ctx.globalAlpha = alfa;
    var s = CS - 6;
    rr(-s / 2, -s / 2 + 6, s, s - 4, 20); ctx.fillStyle = c[1]; ctx.fill();
    rr(-s / 2, -s / 2, s, s - 8, 20); ctx.fillStyle = c[0]; ctx.fill();
    if (ativo) {   // bloco da frente: mostra as bolinhas, como uma bandeja de bolhas
      for (var i = 0; i < 9; i++) {
        var bx = ((i % 3) - 1) * 26, by = (Math.floor(i / 3) - 1) * 26 - 3;
        ctx.beginPath(); ctx.arc(bx, by, 11, 0, 7); ctx.fillStyle = c[1]; ctx.fill();
        ctx.beginPath(); ctx.arc(bx, by - 1.5, 9, 0, 7); ctx.fillStyle = mistura(c[0], 0.2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx - 3, by - 5, 2.8, 0, 7); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
      }
    }
    ctx.restore();
  }

  function desenharBandeja(x, y, b, esc, alfa) {
    var tw = geo.trayW, front = b.q !== undefined && jogo.filas[b.q] && jogo.filas[b.q][0] === b;
    var c = b.oculta ? CINZA : CORES[b.cor];
    ctx.save();
    ctx.translate(x, y + BAND_H / 2); ctx.scale(esc || 1, esc || 1); ctx.translate(0, -BAND_H / 2);
    if (alfa !== undefined) ctx.globalAlpha = alfa;
    rr(-tw / 2, 0, tw, BAND_H, 16); ctx.fillStyle = c[1]; ctx.fill();
    rr(-tw / 2, 0, tw, BAND_H - 6, 16); ctx.fillStyle = c[0]; ctx.fill();
    if (b.oculta) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, BAND_H / 2 - 4);
    } else if (front || b.enchido > 0 || b.t !== undefined) {
      for (var i = 0; i < BURACOS; i++) {
        var hx = (i - 1) * 34, hy = 32;
        ctx.beginPath(); ctx.ellipse(hx, hy, 15, 13, 0, 0, 7); ctx.fillStyle = c[1]; ctx.fill();
        if (i < b.enchido) desenharBola(hx, hy, b.cor, 0.95);
      }
    } else {
      for (var i2 = 0; i2 < BURACOS; i2++) {
        ctx.beginPath(); ctx.ellipse((i2 - 1) * 34, 30, 13, 11, 0, 0, 7); ctx.fillStyle = c[1]; ctx.fill();
      }
    }
    ctx.restore();
  }

  function desenharPainel() {
    var g = geo, d = jogo.dados;
    var xe = g.gx0 - 20, xd = g.gx0 + g.gridW + 20, topo = g.gridTop - 12, base = g.gridBottom + 14;
    var boca = 100;
    ctx.beginPath();
    ctx.moveTo(xe + 28, topo);
    ctx.lineTo(xd - 28, topo); ctx.quadraticCurveTo(xd, topo, xd, topo + 28);
    ctx.lineTo(xd, base);
    ctx.bezierCurveTo(xd, base + 50, g.cx + boca, base + 40, g.cx + boca, g.yAb + 6);
    ctx.lineTo(g.cx - boca, g.yAb + 6);
    ctx.bezierCurveTo(g.cx - boca, base + 40, xe, base + 50, xe, base);
    ctx.lineTo(xe, topo + 28); ctx.quadraticCurveTo(xe, topo, xe + 28, topo);
    ctx.closePath();
    ctx.fillStyle = '#f3f6ee'; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = '#a9b49c'; ctx.lineJoin = 'round'; ctx.stroke();
    // fundo do quadro, mais escuro
    rr(g.gx0 - 10, g.gridTop - 4, g.gridW + 20, g.gridH + 12, 22); ctx.fillStyle = '#e6ecdc'; ctx.fill();
  }

  function desenharEsteira() {
    var g = geo, j = jogo, d = j.dados;
    var rpi = RP - 26;
    ctx.save();
    ctx.translate(g.cx, g.yb);
    rr(-LH - RPO, -RPO, 2 * (LH + RPO), 2 * RPO, RPO); ctx.fillStyle = '#eceae3'; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = '#a79d92'; ctx.stroke();
    rr(-LH - RP - 18, -RP - 18, 2 * (LH + RP + 18), 2 * (RP + 18), RP + 18); ctx.fillStyle = '#c9c4b8'; ctx.fill();
    // ilha do meio
    rr(-LH - rpi, -rpi, 2 * (LH + rpi), 2 * rpi, rpi); ctx.fillStyle = '#f7f5ef'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#a79d92'; ctx.stroke();
    // buraquinhos que andam com a esteira
    for (var k = 0; k < d.K; k++) {
      var p = noCaminho(j.deslocamento + k * P / d.K);
      ctx.beginPath(); ctx.arc(p[0], p[1], 8, 0, 7); ctx.fillStyle = '#b3ada1'; ctx.fill();
    }
    ctx.restore();
  }

  function desenhar() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!jogo || !geo) return;
    ctx.setTransform(dpr * escala, 0, 0, dpr * escala, dpr * ox, dpr * oy);
    var j = jogo, g = geo, d = j.dados, k;
    desenharPainel();

    // blocos do quadro
    for (var c = 0; c < d.cols; c++) {
      var achou = false;
      for (var r = 0; r < j.celulas[c].length; r++) {
        var cor = j.celulas[c][r];
        if (cor === null) continue;
        var ce = centroCelula(c, r);
        desenharBloco(ce[0], ce[1], cor, !achou);
        achou = true;
      }
    }
    j.blocosSaindo.forEach(function (b) { desenharBloco(b.x, b.y, b.cor, true, 1 + 0.15 * b.t, 1 - b.t); });

    // bolinhas a caminho do funil e esperando nele
    for (k = j.funil.length - 1; k >= 0; k--) {
      var f = j.funil[k];
      if (j.t < f.t0) continue;
      if (k > 29 && f.chegou) continue;
      desenharBola(f.px, f.py, f.cor);
    }

    desenharEsteira();

    // bolinhas na esteira
    for (k = 0; k < d.K; k++) {
      var bo = j.esteira[k];
      if (!bo) continue;
      var pos = noCaminho(j.deslocamento + k * P / d.K);
      var x = g.cx + pos[0], y = g.yb + pos[1];
      if (bo.te < 1) { var e = suaviza(bo.te); x = bo.ex + (x - bo.ex) * e; y = bo.ey + (y - bo.ey) * e; }
      desenharBola(x, y, bo.cor);
    }

    // filas de bandejas (de trás para a frente)
    for (var q = 0; q < d.Q; q++) {
      var fila = j.filas[q], xq = xBandeja(q);
      for (var i = Math.min(fila.length, VISIVEIS) - 1; i >= 0; i--) {
        var b = fila[i];
        desenharBandeja(xq, b.y === null ? yBandeja(i) : b.y, b, 1 + (b.revela > 0 ? 0.1 * suaviza(b.revela) : 0));
      }
      if (fila.length > VISIVEIS) {
        ctx.fillStyle = '#7a6d64'; ctx.font = 'bold 22px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('+' + (fila.length - VISIVEIS), xq, yBandeja(VISIVEIS - 1) + BAND_H + 16);
      }
    }
    j.bandejasSaindo.forEach(function (b) {
      var e = suaviza(b.t);
      desenharBandeja(b.x, b.y - 30 * e, { cor: b.cor, oculta: false, enchido: BURACOS, chegando: 0, t: 1 }, 1 - 0.2 * e, 1 - e);
    });

    // bolinhas voando para os buracos
    j.voos.forEach(function (v) {
      var e = suaviza(v.t);
      desenharBola(v.x0 + (v.x1 - v.x0) * e, v.y0 + (v.y1 - v.y0) * e - Math.sin(Math.PI * e) * 12, v.cor, 0.95);
    });
  }

  // ---------- telas ----------
  // escolha de nível: "Continuar" e a grade dos níveis já liberados
  function mostrarNiveis() {
    var max = lerNivel();
    $('bo-cont-n').textContent = max;
    var grade = $('bo-grade');
    grade.innerHTML = '';
    for (var n = 1; n <= max; n++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bo-nivel-btn' + (n === max ? ' atual' : '');
      b.textContent = n;
      b.setAttribute('data-n', n);
      grade.appendChild(b);
    }
    $('bo-niveis').hidden = false;
    $('bo-niveis').scrollTop = 0;
    $('bo-fim').hidden = true;
    $('bo-opcoes').hidden = true;
  }

  function mostrarFim() {
    var j = jogo, ganhou = j.fase === 'ganhou';
    $('bo-titulo').textContent = ganhou ? 'Muito bem!' : 'Ops, encheu!';
    $('bo-msg').textContent = ganhou ? 'Nível ' + j.n + ' completo' : 'A esteira ficou cheia';
    $('bo-proximo').hidden = !ganhou;
    $('bo-fim').hidden = false;
  }

  // ---------- toque ----------
  function aoPressionar(ev) {
    if (!jogo || jogo.fase !== 'jogando') return;
    ev.preventDefault();
    var r = cv.getBoundingClientRect();
    tocarNoMundo((ev.clientX - r.left - ox) / escala, (ev.clientY - r.top - oy) / escala);
  }
  // qualquer toque em cima de uma coluna solta o bloco da frente dela
  function tocarNoMundo(x, y) {
    if (y < geo.gridTop - 12 || y > geo.gridBottom + 14) return;
    for (var c = 0; c < jogo.dados.cols; c++) {
      var x0 = geo.gx0 + c * (CS + GAP) - GAP / 2;
      if (x >= x0 && x < x0 + CS + GAP) { liberar(c); return; }
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
    cv = $('cv-bolinhas');
    ctx = cv.getContext('2d');
    cv.addEventListener('pointerdown', aoPressionar);
    $('bo-reiniciar').addEventListener('click', function () { Som.liberar(); Som.tocar('voltar'); novoNivel(jogo.n); });
    $('bo-denovo').addEventListener('click', function () { Som.liberar(); Som.tocar('abrir'); novoNivel(jogo.n); });
    $('bo-proximo').addEventListener('click', function () { Som.liberar(); Som.tocar('abrir'); novoNivel(jogo.n + 1); });
    $('bo-opcoes').addEventListener('click', function () { Som.liberar(); Som.tocar('voltar'); mostrarNiveis(); });
    $('bo-continuar').addEventListener('click', function () { Som.liberar(); Som.tocar('abrir'); novoNivel(lerNivel()); });
    $('bo-grade').addEventListener('click', function (ev) {
      var b = ev.target.closest('.bo-nivel-btn');
      if (!b) return;
      Som.liberar(); Som.tocar('abrir');
      novoNivel(+b.getAttribute('data-n'));
    });
  }

  function redimensionar() { if (rodando) medir(); }

  window.Jogos = window.Jogos || {};
  window.Jogos.bolinhas = {
    entrar: function () {
      if (!montado) montar();
      rodando = true;
      congelado = false;
      medir();
      novoNivel(lerNivel());
      mostrarNiveis();
      window.addEventListener('resize', redimensionar);
      ultimoQuadro = performance.now();
      idQuadro = requestAnimationFrame(quadro);
    },
    sair: function () {
      rodando = false;
      cancelAnimationFrame(idQuadro);
      window.removeEventListener('resize', redimensionar);
    },
    // ganchos para os testes
    _teste: {
      jogo: function () { return jogo; },
      geo: function () { return geo; },
      criarNivel: criarNivel,
      gerarNivel: gerarNivel,
      nivel: function (n) { novoNivel(n); },
      passo: function (dt) { atualizar(dt); },
      congelar: function (v) { congelado = !!v; },
      desenhar: desenhar,
      liberar: liberar,
      tocar: tocarNoMundo,
      mundoParaTela: function (x, y) { return [ox + x * escala, oy + y * escala]; },
      constantes: function () { return { CS: CS, GAP: GAP, TRAVA_SEG: TRAVA_SEG, POR_BLOCO: POR_BLOCO, BURACOS: BURACOS }; },
      resolver: jogarSozinho
    }
  };
})();
