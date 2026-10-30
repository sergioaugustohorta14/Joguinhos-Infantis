/* Unicórnios: 6 bases (60 desenhos) */
(function () {
  'use strict';
  var H = Desenhos.H, E = H.E, ER = H.ER, C = H.C, P = H.P, L = H.L, D = H.D, par = H.par, G = H.G;
  var r = Math.round;

  // chifre em espiral: cone + listras (a base fica por cima da testa)
  function chifre(x, baseY, alt, larg) {
    var s = P('M' + (x - larg) + ' ' + baseY + ' L' + x + ' ' + (baseY - alt) + ' L' + (x + larg) + ' ' + baseY + 'Z');
    for (var i = 1; i <= 3; i++) {
      var y = baseY - alt * i / 4, hw = larg * (1 - i / 4);
      s += L('M' + r(x - hw) + ' ' + r(y + 10) + ' L' + r(x + hw) + ' ' + r(y - 10), 0.8);
    }
    return s;
  }
  // rostinho fofo: só olhos, bochechas e sorriso (sem focinho)
  function focinho() { return ''; }
  // orelhas finas, em pé, perto do chifre
  function orelhas(cx, cy, rx, ry) {
    var s = '';
    [-1, 1].forEach(function (d) {
      s += P('M' + r(cx + d * rx * 0.66) + ' ' + r(cy - ry * 0.62) + ' L' + r(cx + d * rx * 0.56) + ' ' + r(cy - ry * 1.5) + ' L' + r(cx + d * rx * 0.26) + ' ' + r(cy - ry * 0.92) + 'Z');
      s += P('M' + r(cx + d * rx * 0.58) + ' ' + r(cy - ry * 0.8) + ' L' + r(cx + d * rx * 0.55) + ' ' + r(cy - ry * 1.28) + ' L' + r(cx + d * rx * 0.38) + ' ' + r(cy - ry * 0.95) + 'Z', 0.7);
    });
    return s;
  }
  // crina comprida: duas mechas em forma de chama, caindo de cada lado da cabeça
  function crina(cx, cy, rx, ry) {
    function m(k) { return r(k); }
    return par(function () {
      var x = function (f) { return m(cx - rx * f); }, y = function (f) { return m(cy + ry * f); };
      return C(x(0.62), y(-0.84), rx * 0.2) +
        P('M' + x(0.5) + ' ' + y(-0.75) + ' C' + x(1.3) + ' ' + y(-0.6) + ' ' + x(1.4) + ' ' + y(0.5) + ' ' + x(1.08) + ' ' + y(1.3) +
          ' C' + x(1.0) + ' ' + y(0.85) + ' ' + x(0.78) + ' ' + y(0.7) + ' ' + x(0.8) + ' ' + y(0.3) + ' C' + x(0.7) + ' ' + y(0.1) + ' ' + x(0.62) + ' ' + y(-0.1) + ' ' + x(0.6) + ' ' + y(-0.3) + 'Z') +
        P('M' + x(0.8) + ' ' + y(0.5) + ' C' + x(1.05) + ' ' + y(0.7) + ' ' + x(0.95) + ' ' + y(1.1) + ' ' + x(0.72) + ' ' + y(1.45) +
          ' C' + x(0.66) + ' ' + y(1.1) + ' ' + x(0.6) + ' ' + y(0.8) + ' ' + x(0.62) + ' ' + y(0.45) + 'Z', 0.8);
    });
  }
  function franja(cx, cy, ry) {
    return P('M' + (cx - 48) + ' ' + r(cy - ry * 0.98) + ' C' + (cx - 90) + ' ' + r(cy - ry * 0.9) + ' ' + (cx - 100) + ' ' + r(cy - ry * 0.45) + ' ' + (cx - 78) + ' ' + r(cy - ry * 0.18) + ' C' + (cx - 48) + ' ' + r(cy - ry * 0.4) + ' ' + (cx - 14) + ' ' + r(cy - ry * 0.7) + ' ' + cx + ' ' + r(cy - ry * 0.98) + 'Z');
  }
  function florzinha(x, y, s) {
    return H.loc(x, y, s, function () {
      var o = '';
      for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / 5; o += C(Math.cos(a) * 26, Math.sin(a) * 26, 19, 0.9); }
      return o + C(0, 0, 13, 0.9);
    });
  }
  var cauda = 'M640 820 C790 850 900 770 880 640 C870 585 935 600 942 685 C962 815 880 935 690 915Z';

  Desenhos.add({
    id: 'uni1', cat: 'unicornios', nome: 'Unicórnio sentadinho', semChapeu: true,
    cara: [500, 400, 1.5], cabeca: [500, 400, 185],
    corpo: function () {
      return P(cauda) + L('M700 840 C800 850 860 790 862 700', 0.8) +
        E(500, 730, 172, 185) + E(500, 770, 100, 120) + H.estrela(572, 700, 34, 0.5, 5, 0.8) +
        par(function () { return E(432, 892, 52, 38); }) +
        orelhas(500, 400, 185, 165) + crina(500, 400, 185, 165) +
        E(500, 400, 185, 165) + focinho(500, 396, 1.5) + chifre(500, 262, 190, 34) + franja(500, 400, 165);
    }
  });

  Desenhos.add({
    id: 'uni2', cat: 'unicornios', nome: 'Unicórnio trotando', semChapeu: true,
    cara: [290, 510, 1.2], cabeca: [290, 505, 140], pescoco: [340, 630, 1.1],
    corpo: function () {
      return P('M770 650 C880 620 960 700 940 800 C920 890 820 905 785 835 C850 810 868 740 780 725Z') + L('M800 760 C880 770 905 800 880 850', 0.8) +
        H.R(360, 740, 66, 135, 30) + H.R(440, 750, 66, 125, 30) + H.R(650, 750, 66, 125, 30) + H.R(730, 740, 66, 135, 30) +
        C(400, 585, 52) + C(470, 560, 54) + C(545, 545, 54) + C(620, 548, 52) +
        E(560, 690, 245, 125) + H.estrela(610, 690, 32, 0.5, 5, 0.8) +
        orelhas(290, 505, 150, 135) +
        C(165, 470, 48) + C(150, 545, 42) +
        E(290, 505, 150, 135) + focinho(290, 506, 1.2) + chifre(290, 392, 150, 28) + franja(290, 505, 135);
    }
  });

  Desenhos.add({
    id: 'uni3', cat: 'unicornios', nome: 'Potrinho', semChapeu: true,
    cara: [500, 385, 1.6], cabeca: [500, 385, 195],
    corpo: function () {
      return P('M630 845 C730 870 800 810 775 730 C768 695 815 700 822 745 C838 830 770 915 650 905Z') +
        E(500, 745, 130, 140) + E(500, 775, 76, 95) +
        par(function () { return H.R(405, 850, 64, 55, 24); }) +
        orelhas(500, 385, 200, 175) + crina(500, 385, 200, 175) +
        E(500, 385, 200, 175) + focinho(500, 382, 1.6) + chifre(500, 240, 130, 30) + franja(500, 385, 175);
    }
  });

  Desenhos.add({
    id: 'uni4', cat: 'unicornios', nome: 'Unicórnio com asas', semChapeu: true,
    cara: [500, 400, 1.45], cabeca: [500, 400, 178],
    corpo: function () {
      return par(function () {
        return P('M412 560 C300 420 175 415 100 505 C145 530 155 575 135 618 C188 598 232 620 242 670 C292 640 345 660 415 722Z');
      }) + P(cauda) + L('M700 840 C800 850 860 790 862 700', 0.8) +
        E(500, 730, 165, 185) + E(500, 770, 96, 120) + H.estrela(570, 700, 32, 0.5, 5, 0.8) +
        par(function () { return E(432, 892, 52, 38); }) +
        orelhas(500, 400, 178, 160) + crina(500, 400, 178, 160) +
        E(500, 400, 178, 160) + focinho(500, 396, 1.45) + chifre(500, 270, 180, 33) + franja(500, 400, 160);
    }
  });

  Desenhos.add({
    id: 'uni5', cat: 'unicornios', nome: 'Unicórnio na nuvem', semChapeu: true,
    cara: [500, 335, 1.4], cabeca: [500, 335, 170],
    corpo: function () {
      return E(500, 620, 150, 170) + E(500, 650, 88, 110) + par(function () { return E(430, 770, 50, 36); }) +
        orelhas(500, 335, 172, 152) + crina(500, 335, 172, 152) +
        E(500, 335, 172, 152) + focinho(500, 332, 1.4) + chifre(500, 205, 150, 30) + franja(500, 335, 152) +
        H.loc(500, 850, 2.7, function () {
          return P('M-70 30 C-104 30 -104 -22 -58 -26 C-54 -66 14 -72 28 -38 C60 -54 100 -22 78 12 C104 30 82 50 58 50 L-48 50 C-80 50 -92 36 -70 30Z');
        });
    }
  });

  Desenhos.add({
    id: 'uni6', cat: 'unicornios', nome: 'Carinha de unicórnio', semChapeu: true,
    cara: [500, 500, 2.2], cabeca: [500, 500, 270],
    corpo: function () {
      return crina(500, 500, 285, 255) +
        orelhas(500, 500, 285, 255) +
        E(500, 500, 285, 255) + focinho(500, 496, 2.2) + chifre(500, 262, 210, 42) + franja(500, 500, 255) +
        florzinha(238, 395, 0.9) + florzinha(176, 590, 0.75);
    }
  });
})();
