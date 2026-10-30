/* Gatinhos: 7 bases */
(function () {
  'use strict';
  var H = Desenhos.H, E = H.E, ER = H.ER, C = H.C, P = H.P, L = H.L, par = H.par;
  var r = Math.round;

  // orelhas pontudas com miolo (ficam atrás da cabeça)
  function orelhas(cx, cy, rx, ry) {
    var s = '';
    [-1, 1].forEach(function (d) {
      s += P('M' + r(cx + d * rx * 0.80) + ' ' + r(cy - ry * 0.45) + ' L' + r(cx + d * rx * 0.92) + ' ' + r(cy - ry * 1.55) + ' L' + r(cx + d * rx * 0.18) + ' ' + r(cy - ry * 0.88) + 'Z');
      s += P('M' + r(cx + d * rx * 0.74) + ' ' + r(cy - ry * 0.62) + ' L' + r(cx + d * rx * 0.84) + ' ' + r(cy - ry * 1.28) + ' L' + r(cx + d * rx * 0.36) + ' ' + r(cy - ry * 0.86) + 'Z', 0.7);
    });
    return s;
  }

  // cabeça + focinho + bigodes + listras da testa
  function cabecaGato(cx, cy, rx, ry) {
    var k = rx / 125, s = E(cx, cy, rx, ry);
    s += P('M' + r(cx - 11 * k) + ' ' + r(cy + 8 * k) + ' L' + r(cx + 11 * k) + ' ' + r(cy + 8 * k) + ' L' + cx + ' ' + r(cy + 22 * k) + 'Z', 0.7);
    [-1, 1].forEach(function (d) {
      s += L('M' + r(cx + d * rx * 0.8) + ' ' + r(cy + ry * 0.14) + ' L' + r(cx + d * rx * 1.22) + ' ' + r(cy + ry * 0.02));
      s += L('M' + r(cx + d * rx * 0.8) + ' ' + r(cy + ry * 0.3) + ' L' + r(cx + d * rx * 1.2) + ' ' + r(cy + ry * 0.34));
    });
    s += L('M' + cx + ' ' + r(cy - ry * 0.95) + ' L' + cx + ' ' + r(cy - ry * 0.62), 0.8);
    s += L('M' + r(cx - rx * 0.2) + ' ' + r(cy - ry * 0.93) + ' L' + r(cx - rx * 0.17) + ' ' + r(cy - ry * 0.66), 0.8);
    s += L('M' + r(cx + rx * 0.2) + ' ' + r(cy - ry * 0.93) + ' L' + r(cx + rx * 0.17) + ' ' + r(cy - ry * 0.66), 0.8);
    return s;
  }

  Desenhos.add({
    id: 'gato1', cat: 'gatinhos', nome: 'Gatinho sentado',
    cara: [500, 400, 1.6], cabeca: [500, 400, 185],
    corpo: function () {
      return P('M650 830 C780 840 850 750 820 650 C805 600 850 575 872 620 C920 720 880 895 700 905Z') +
        E(500, 735, 175, 185) + E(500, 775, 100, 125) +
        par(function () { return E(432, 892, 52, 38); }) +
        L('M330 690 L370 700') + L('M320 740 L362 742') + L('M670 690 L630 700') + L('M680 740 L638 742') +
        orelhas(500, 400, 200, 170) + cabecaGato(500, 400, 200, 170);
    }
  });

  Desenhos.add({
    id: 'gato2', cat: 'gatinhos', nome: 'Gatinho passeando',
    cara: [290, 515, 1.2], cabeca: [290, 510, 140],
    pescoco: [330, 630, 1.1],
    corpo: function () {
      return P('M770 690 C880 690 930 580 900 470 C890 440 930 425 945 455 C985 560 950 780 790 780Z') +
        H.R(360, 740, 66, 135, 30) + H.R(440, 750, 66, 125, 30) + H.R(650, 750, 66, 125, 30) + H.R(730, 740, 66, 135, 30) +
        E(560, 690, 245, 125) +
        L('M520 575 L540 625') + L('M590 570 L605 622') + L('M660 580 L672 628') +
        orelhas(290, 510, 150, 130) + cabecaGato(290, 510, 150, 130);
    }
  });

  Desenhos.add({
    id: 'gato3', cat: 'gatinhos', nome: 'Gatinho pãozinho',
    cara: [500, 405, 1.64], cabeca: [500, 405, 190],
    corpo: function () {
      return P('M820 850 Q930 860 940 770 Q945 720 900 725 Q910 790 810 790Z') +
        P('M170 760 Q150 590 330 565 L670 565 Q850 590 830 760 Q820 880 700 890 L300 890 Q180 880 170 760Z') +
        par(function () { return E(420, 872, 64, 38); }) +
        L('M300 660 L330 710') + L('M700 660 L670 710') + L('M250 740 L290 770') + L('M750 740 L710 770') +
        orelhas(500, 405, 205, 170) + cabecaGato(500, 405, 205, 170);
    }
  });

  Desenhos.add({
    id: 'gato4', cat: 'gatinhos', nome: 'Gatinho e novelo',
    cara: [500, 385, 1.52], cabeca: [500, 385, 175],
    corpo: function () {
      return E(500, 700, 165, 170) +
        orelhas(500, 385, 190, 160) + cabecaGato(500, 385, 190, 160) +
        L('M690 925 C740 975 820 955 880 980', 1.2) +
        C(640, 790, 135) + L('M520 738 Q640 690 750 762') + L('M512 800 Q640 760 764 836') + L('M565 892 Q650 850 735 905') +
        E(560, 745, 52, 38) + E(430, 800, 56, 40);
    }
  });

  Desenhos.add({
    id: 'gato5', cat: 'gatinhos', nome: 'Gatinho na caixa',
    cara: [500, 470, 1.48], cabeca: [500, 470, 175],
    corpo: function () {
      return orelhas(500, 470, 185, 160) + cabecaGato(500, 470, 185, 160) +
        H.R(180, 625, 640, 320, 26) + H.R(160, 595, 680, 70, 22) +
        H.R(390, 760, 220, 100, 16) + L('M440 800 H560') +
        par(function () { return E(410, 622, 52, 34); });
    }
  });

  Desenhos.add({
    id: 'gato6', cat: 'gatinhos', nome: 'Gatinho dormindo', expr: 'sono',
    cara: [390, 615, 1.2], cabeca: [390, 612, 140],
    pescoco: [450, 700, 1.0],
    corpo: function () {
      return E(500, 690, 350, 190) +
        P('M300 810 Q500 925 800 850 Q910 800 885 745 Q860 705 820 735 Q830 785 760 805 Q520 865 340 775Z') +
        ER(290, 785, 62, 36, -15) +
        orelhas(390, 612, 150, 130) + cabecaGato(390, 612, 150, 130) +
        L('M690 330 H760 L690 410 H760') + L('M800 240 H850 L800 300 H850');
    }
  });

  Desenhos.add({
    id: 'gato7', cat: 'gatinhos', nome: 'Gatinho de pé',
    cara: [500, 390, 1.6], cabeca: [500, 390, 185],
    corpo: function () {
      return P('M640 770 C760 770 825 650 795 550 C785 520 825 500 845 530 C895 630 845 810 650 840Z') +
        E(500, 700, 160, 190) + E(500, 745, 95, 125) +
        par(function () { return ER(342, 640, 38, 92, 28); }) +
        par(function () { return E(425, 890, 60, 36); }) +
        orelhas(500, 390, 200, 170) + cabecaGato(500, 390, 200, 170);
    }
  });
})();
