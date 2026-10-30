/* Motor dos desenhos: 50 bases desenhadas em código (SVG 1000x1000) + 9 variações de cada = 500.
   Variação = rosto (expressão) + acessório + cenário. Tudo com contornos fechados, para o balde de tinta.
   Cada forma tem preenchimento branco: o que fica na frente esconde o traço de quem está atrás. */
(function () {
  'use strict';

  var SW0 = 10;     // espessura do traço em coordenadas do desenho
  var sw = SW0;     // espessura atual (muda dentro de grupos com escala)

  function f(v) { return Math.round(v * 10) / 10; }
  function w(m) { return ' stroke-width="' + f(sw * (m || 1)) + '"'; }

  // ---------- formas ----------
  var H = {
    E: function (cx, cy, rx, ry, m) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="#fff"' + w(m) + '/>'; },
    C: function (cx, cy, r, m) { return H.E(cx, cy, r, r, m); },
    // elipse girada (graus) em torno do próprio centro
    ER: function (cx, cy, rx, ry, g, m) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="#fff" transform="rotate(' + g + ' ' + f(cx) + ' ' + f(cy) + ')"' + w(m) + '/>'; },
    // elipse só com linha (não esconde o que está atrás)
    Eo: function (cx, cy, rx, ry, m) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="none"' + w(m) + '/>'; },
    P: function (d, m) { return '<path d="' + d + '" fill="#fff"' + w(m) + '/>'; },     // forma fechada
    L: function (d, m) { return '<path d="' + d + '" fill="none"' + w(m) + '/>'; },    // linha aberta
    D: function (cx, cy, r) { return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" fill="currentColor" stroke="none"/>'; }, // pontinho cheio (olhos)
    // elipse cheia (nariz de cachorro etc.)
    N: function (cx, cy, rx, ry) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="currentColor" stroke="none"/>'; },
    R: function (x, y, wd, ht, r, m) { return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(wd) + '" height="' + f(ht) + '" rx="' + f(r) + '" fill="#fff"' + w(m) + '/>'; },
    // gira um trecho em torno de (cx,cy)
    G: function (g, cx, cy, s) { return '<g transform="rotate(' + g + ' ' + f(cx) + ' ' + f(cy) + ')">' + s + '</g>'; },
    // espelha em torno do eixo central (x = 500)
    esp: function (s) { return '<g transform="translate(1000 0) scale(-1 1)">' + s + '</g>'; },
    // desenha o lado esquerdo e o espelho dele
    par: function (fn) { var s = fn(); return s + H.esp(s); },
    // sistema local: origem em (x,y), escala k, traço continua com a mesma espessura
    loc: function (x, y, k, fn, rot) {
      var antes = sw;
      sw = SW0 / k;
      var s = '<g transform="translate(' + f(x) + ' ' + f(y) + ')' + (rot ? ' rotate(' + rot + ')' : '') + ' scale(' + f(k * 1000) / 1000 + ')">' + fn() + '</g>';
      sw = antes;
      return s;
    },
    // estrela de n pontas (ponto mais fundo = prof)
    estrela: function (cx, cy, R, prof, n, m) {
      var pts = [];
      n = n || 5;
      for (var i = 0; i < n * 2; i++) {
        var r = i % 2 === 0 ? R : R * (prof || 0.5);
        var a = -Math.PI / 2 + i * Math.PI / n;
        pts.push(f(cx + r * Math.cos(a)) + ' ' + f(cy + r * Math.sin(a)));
      }
      return H.P('M' + pts.join(' L') + 'Z', m);
    }
  };

  // ---------- rosto ----------
  function cara(x, y, k, expr, semBoca) {
    return H.loc(x, y, k, function () {
      var E = H.E, D = H.D, L = H.L;
      var bochechas = E(-74, 28, 17, 11, 0.5) + E(74, 28, 17, 11, 0.5);
      var boca = function (s) { return semBoca ? '' : s; };
      switch (expr) {
        case 'sono':
          return L('M-60 2 Q-45 20 -30 2', 0.8) + L('M30 2 Q45 20 60 2', 0.8) + boca(E(0, 34, 8, 11, 0.7)) + bochechas;
        case 'surpreso':
          return D(-45, 0, 15) + D(45, 0, 15) + boca(E(0, 36, 10, 15, 0.7)) + bochechas;
        case 'piscadinha':
          return D(-45, 0, 12) + L('M30 6 Q45 -12 60 6', 0.8) + boca(L('M-18 24 Q0 44 18 24', 0.8)) + bochechas;
        case 'risada':
          return L('M-60 6 Q-45 -14 -30 6', 0.8) + L('M30 6 Q45 -14 60 6', 0.8) +
                 boca(H.P('M-26 18 Q0 14 26 18 Q22 54 0 54 Q-22 54 -26 18Z', 0.7)) + bochechas;
        default: // feliz
          return D(-45, 0, 12) + D(45, 0, 12) + boca(L('M-18 24 Q0 44 18 24', 0.8)) + bochechas;
      }
    });
  }

  // ---------- acessórios (cabeça local: centro 0,0 e raio 100) ----------
  function naCabeca(b, fn, rot) { return H.loc(b.cabeca[0], b.cabeca[1], b.cabeca[2] / 100, fn, rot); }

  var ACESSORIOS = {
    festa: function (b) {
      return naCabeca(b, function () {
        return H.P('M-50 -84 L0 -218 L50 -84 Q0 -66 -50 -84Z') + H.C(0, -222, 14) +
               H.L('M-34 -118 Q0 -104 34 -118', 0.8) + H.C(-8, -150, 6, 0.7) + H.C(10, -172, 5, 0.7);
      }, -10);
    },
    coroa: function (b) {
      return naCabeca(b, function () {
        return H.P('M-56 -82 L-64 -150 L-32 -116 L0 -168 L32 -116 L64 -150 L56 -82 Q0 -66 -56 -82Z') +
               H.C(0, -104, 9, 0.8) + H.C(-64, -154, 9, 0.8) + H.C(64, -154, 9, 0.8) + H.C(0, -172, 9, 0.8);
      });
    },
    oculos: function (b) {
      return H.loc(b.cara[0], b.cara[1], b.cara[2], function () {
        return H.Eo(-45, 2, 31, 25) + H.Eo(45, 2, 31, 25) + H.L('M-14 -2 Q0 -12 14 -2') +
               H.L('M-76 -2 L-96 -10') + H.L('M76 -2 L96 -10');
      });
    },
    bone: function (b) {
      return naCabeca(b, function () {
        return H.P('M-88 -48 Q-86 -140 0 -142 Q86 -140 88 -48 Q0 -76 -88 -48Z') +
               H.P('M26 -66 Q100 -78 124 -54 Q70 -36 26 -52Z') + H.C(0, -144, 9);
      }, -6);
    },
    gravata: function (b) {
      var p = b.pescoco || [b.cabeca[0], b.cabeca[1] + b.cabeca[2] * 0.95, b.cabeca[2] / 100];
      return H.loc(p[0], p[1], p[2], function () {
        return H.P('M0 0 L-58 -30 L-58 30Z') + H.P('M0 0 L58 -30 L58 30Z') + H.C(0, 0, 14);
      });
    },
    cachecol: function (b) {
      var p = b.pescoco || [b.cabeca[0], b.cabeca[1] + b.cabeca[2] * 0.9, b.cabeca[2] / 100];
      return H.loc(p[0], p[1], p[2], function () {
        return H.P('M44 18 L92 22 L96 128 L52 126Z') + H.L('M48 56 L94 60') + H.L('M50 92 L95 96') +
               H.P('M-104 -8 Q0 30 104 -8 L100 34 Q0 72 -100 34Z');
      });
    },
    cartola: function (b) {
      return naCabeca(b, function () {
        return H.P('M-48 -88 L-44 -172 Q0 -182 44 -172 L48 -88Z') + H.L('M-46 -116 Q0 -104 46 -116') +
               H.E(0, -88, 78, 16);
      }, 8);
    }
  };
  // laço e flor ficam deslocados para o lado da cabeça
  var ACC_ORDEM = ['festa', 'coroa', 'laco', 'oculos', 'bone', 'gravata', 'cachecol', 'flor', 'cartola'];
  var CHAPEUS = { festa: 1, coroa: 1, bone: 1, cartola: 1 };

  ACESSORIOS.laco = function (b) {
    return H.loc(b.cabeca[0] + b.cabeca[2] * 0.55, b.cabeca[1] - b.cabeca[2] * 0.78, b.cabeca[2] / 100, function () {
      return H.P('M0 0 L-58 -34 Q-70 0 -58 34Z') + H.P('M0 0 L58 -34 Q70 0 58 34Z') + H.C(0, 0, 14);
    }, 22);
  };
  ACESSORIOS.flor = function (b) {
    return H.loc(b.cabeca[0] - b.cabeca[2] * 0.55, b.cabeca[1] - b.cabeca[2] * 0.78, b.cabeca[2] / 100, function () {
      var s = '';
      for (var i = 0; i < 5; i++) {
        var a = -Math.PI / 2 + i * 2 * Math.PI / 5;
        s += H.C(Math.cos(a) * 26, Math.sin(a) * 26, 19, 0.8);
      }
      return s + H.C(0, 0, 12, 0.8);
    });
  };

  // ---------- cenários (desenhados atrás do personagem, nas bordas) ----------
  function nuvem(x, y, s) {
    return H.loc(x, y, s, function () {
      return H.P('M-70 30 C-104 30 -104 -22 -58 -26 C-54 -66 14 -72 28 -38 C60 -54 100 -22 78 12 C104 30 82 50 58 50 L-48 50 C-80 50 -92 36 -70 30Z');
    });
  }
  function coracao(x, y, s, g) {
    return H.loc(x, y, s, function () { return H.P('M0 40 C-76 -8 -44 -56 0 -20 C44 -56 76 -8 0 40Z'); }, g || 0);
  }
  function florzinha(x, y, s) {
    return H.loc(x, y, s, function () {
      var r = '';
      for (var i = 0; i < 5; i++) {
        var a = -Math.PI / 2 + i * 2 * Math.PI / 5;
        r += H.C(Math.cos(a) * 30, Math.sin(a) * 30, 22, 0.9);
      }
      return r + H.C(0, 0, 15, 0.9);
    });
  }
  function borboleta(x, y, s, g) {
    return H.loc(x, y, s, function () {
      return H.ER(-34, -22, 32, 24, -25, 0.9) + H.ER(34, -22, 32, 24, 25, 0.9) +
             H.ER(-26, 22, 24, 17, 25, 0.9) + H.ER(26, 22, 24, 17, -25, 0.9) +
             H.E(0, 0, 9, 34, 0.9) + H.L('M-4 -34 Q-14 -58 -26 -62', 0.8) + H.L('M4 -34 Q14 -58 26 -62', 0.8);
    }, g || 0);
  }
  function balao(x, y, s) {
    return H.loc(x, y, s, function () {
      return H.L('M0 62 Q-14 96 6 128 Q-6 150 4 170', 0.7) + H.E(0, 0, 46, 58) + H.P('M-9 62 L9 62 L0 74Z', 0.8) +
             H.L('M-24 -14 Q-22 -32 -8 -38', 0.6);
    });
  }
  function bolha(x, y, r) {
    return H.C(x, y, r, 0.8) + H.L('M' + f(x - r * 0.55) + ' ' + f(y - r * 0.1) + ' Q' + f(x - r * 0.45) + ' ' + f(y - r * 0.5) + ' ' + f(x - r * 0.1) + ' ' + f(y - r * 0.6), 0.6);
  }
  function lua(x, y, s) {
    return H.loc(x, y, s, function () { return H.P('M20 -70 A74 74 0 1 0 60 40 A58 58 0 0 1 20 -70Z'); });
  }
  function sol(x, y, s) {
    return H.loc(x, y, s, function () {
      var r = '';
      for (var i = 0; i < 10; i++) {
        var a = i * Math.PI / 5;
        r += H.L('M' + f(Math.cos(a) * 62) + ' ' + f(Math.sin(a) * 62) + ' L' + f(Math.cos(a) * 92) + ' ' + f(Math.sin(a) * 92));
      }
      return r + H.C(0, 0, 46);
    });
  }

  var CENAS = {
    nuvens: function () { return nuvem(180, 130, 1.1) + nuvem(840, 210, 0.85) + nuvem(110, 420, 0.6); },
    estrelas: function () {
      return H.estrela(150, 140, 62, 0.5) + H.estrela(860, 120, 48, 0.5) + H.estrela(900, 400, 36, 0.5) +
             H.estrela(100, 560, 38, 0.5) + H.estrela(820, 840, 54, 0.5) + H.estrela(170, 860, 44, 0.5);
    },
    coracoes: function () {
      return coracao(150, 150, 0.85, -12) + coracao(860, 130, 0.6, 14) + coracao(900, 420, 0.5, -8) +
             coracao(90, 560, 0.55, 10) + coracao(850, 850, 0.8, 8) + coracao(160, 870, 0.62, -10);
    },
    sol: function () { return sol(860, 140, 0.95) + nuvem(190, 150, 0.9) + nuvem(150, 440, 0.5); },
    arcoiris: function () {
      var cx = 500, cy = 490;
      function faixa(R, t) {
        return H.P('M' + (cx - R) + ' ' + cy + ' A' + R + ' ' + R + ' 0 0 1 ' + (cx + R) + ' ' + cy + ' L' + (cx + R - t) + ' ' + cy +
                   ' A' + (R - t) + ' ' + (R - t) + ' 0 0 0 ' + (cx - R + t) + ' ' + cy + 'Z', 0.9);
      }
      return faixa(400, 44) + faixa(356, 44) + faixa(312, 44) + faixa(268, 44) + nuvem(110, 505, 0.8) + nuvem(890, 505, 0.8);
    },
    baloes: function () { return balao(130, 150, 0.85) + balao(880, 190, 0.75) + balao(60, 520, 0.55) + balao(930, 520, 0.55); },
    bolhas: function () {
      return bolha(140, 150, 48) + bolha(220, 260, 26) + bolha(870, 140, 40) + bolha(810, 260, 22) +
             bolha(920, 560, 30) + bolha(90, 600, 34) + bolha(880, 860, 44) + bolha(150, 880, 38);
    },
    borboletas: function () { return borboleta(150, 160, 0.9, -15) + borboleta(860, 220, 0.7, 15) + borboleta(100, 520, 0.55, 10) + borboleta(900, 600, 0.5, -10); },
    flores: function () {
      return H.P('M0 920 Q240 868 500 910 Q760 950 1000 890 L1000 1000 L0 1000Z') +
             florzinha(130, 870, 0.8) + florzinha(880, 850, 0.7) + florzinha(300, 950, 0.45) + florzinha(740, 960, 0.5);
    },
    lua: function () { return lua(140, 160, 1.3) + H.estrela(860, 130, 46, 0.5) + H.estrela(780, 270, 30, 0.5) + H.estrela(920, 450, 34, 0.5) + H.estrela(110, 560, 30, 0.5) + H.estrela(850, 860, 42, 0.5); }
  };
  var CENA_ORDEM = ['nuvens', 'estrelas', 'coracoes', 'sol', 'arcoiris', 'baloes', 'bolhas', 'borboletas', 'flores', 'lua'];
  var EXPRESSOES = ['feliz', 'sono', 'surpreso', 'piscadinha', 'risada'];

  // ---------- catálogo ----------
  var CATEGORIAS = [
    { id: 'dinos', nome: 'Dinossauros' },
    { id: 'gatinhos', nome: 'Gatinhos' },
    { id: 'cachorrinhos', nome: 'Cachorrinhos' },
    { id: 'herois', nome: 'Heróis' },
    { id: 'bichinhos', nome: 'Bichinhos' },
    { id: 'natureza', nome: 'Natureza' }
  ];

  var bases = [];
  var lista = null;

  // gerador pseudo-aleatório fixo: a galeria é sempre igual em todos os aparelhos
  function variantesDe(i, b) {
    var out = [{ acc: null, cena: null, expr: b.expr || 'feliz' }];
    var vistos = { 'n|n': 1 };
    for (var j = 1; j <= 9; j++) {
      var acc = ACC_ORDEM[(j - 1 + i) % 9];
      if (b.semChapeu && CHAPEUS[acc]) acc = ['oculos', 'gravata', 'cachecol', 'laco'][(j + i) % 4];
      var cena = CENA_ORDEM[(j * 3 + i) % 10];
      var expr = EXPRESSOES[(j + i * 2) % 5];
      var chave = acc + '|' + cena;
      while (vistos[chave]) { cena = CENA_ORDEM[(CENA_ORDEM.indexOf(cena) + 1) % 10]; chave = acc + '|' + cena; }
      vistos[chave] = 1;
      out.push({ acc: acc, cena: cena, expr: expr });
    }
    return out;
  }

  function todos() {
    if (lista) return lista;
    lista = [];
    bases.forEach(function (b, i) {
      variantesDe(i, b).forEach(function (v, j) {
        lista.push({ id: b.id + '-' + j, cat: b.cat, base: b, variante: v });
      });
    });
    return lista;
  }

  // texto SVG do desenho; cor = cor do traço ('#000' para extrair o contorno)
  function svgTexto(d, cor) {
    sw = SW0;
    var b = d.base, v = d.variante;
    var s = '';
    if (v.cena) s += CENAS[v.cena]();
    sw = SW0;
    s += b.corpo();
    sw = SW0;
    s += cara(b.cara[0], b.cara[1], b.cara[2], v.expr, b.semBoca);
    if (v.acc) s += ACESSORIOS[v.acc](b);
    sw = SW0;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">' +
           '<g color="' + (cor || '#000') + '" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round">' + s + '</g></svg>';
  }

  window.Desenhos = {
    H: H,
    categorias: CATEGORIAS,
    add: function (b) { bases.push(b); },
    bases: function () { return bases; },
    todos: todos,
    daCategoria: function (cat) { return todos().filter(function (d) { return d.cat === cat; }); },
    porId: function (id) { return todos().filter(function (d) { return d.id === id; })[0]; },
    svgTexto: svgTexto
  };
})();
