/* Bichinhos: 12 bases */
(function () {
  'use strict';
  var H = Desenhos.H, E = H.E, ER = H.ER, C = H.C, P = H.P, L = H.L, D = H.D, N = H.N, par = H.par, G = H.G;
  var focinho = Desenhos.caoFocinho;
  var r = Math.round;

  function nariz(cx, cy, k) {
    return P('M' + r(cx - 11 * k) + ' ' + r(cy + 8 * k) + ' L' + r(cx + 11 * k) + ' ' + r(cy + 8 * k) + ' L' + cx + ' ' + r(cy + 22 * k) + 'Z', 0.7);
  }
  function pes(x, y, rx, ry) { return par(function () { return E(x, y, rx || 60, ry || 36); }); }

  Desenhos.add({
    id: 'coelho', cat: 'bichinhos', nome: 'Coelhinho',
    cara: [500, 430, 1.45], cabeca: [500, 430, 175],
    corpo: function () {
      return par(function () { return E(420, 190, 58, 140) + E(420, 200, 28, 92, 0.7); }) +
        C(675, 835, 44) + E(500, 750, 150, 165) + E(500, 785, 88, 115) + pes(415, 898) +
        P('M455 700 L545 700 L500 850Z') + ER(480, 678, 12, 28, -22) + ER(500, 668, 12, 32, 0) + ER(520, 678, 12, 28, 22) +
        L('M474 735 L490 740') + L('M512 765 L528 770') +
        E(500, 430, 180, 155) + nariz(500, 430, 1.45) + H.R(486, 474, 28, 30, 6, 0.7);
    }
  });

  Desenhos.add({
    id: 'urso', cat: 'bichinhos', nome: 'Ursinho',
    cara: [500, 400, 1.48], cabeca: [500, 400, 185],
    corpo: function () {
      return par(function () { return C(350, 283, 60) + C(352, 288, 30, 0.7); }) +
        E(500, 745, 175, 170) + E(500, 770, 105, 125) +
        P('M500 850 C438 808 452 748 500 775 C548 748 562 808 500 850Z') +
        par(function () { return ER(335, 705, 42, 95, 25); }) + pes(410, 892, 62, 38) +
        E(500, 400, 185, 165) + focinho(500, 400, 1.48);
    }
  });

  Desenhos.add({
    id: 'panda', cat: 'bichinhos', nome: 'Pandinha',
    cara: [500, 405, 1.48], cabeca: [500, 405, 185],
    corpo: function () {
      return par(function () { return C(345, 290, 60) + C(347, 294, 32, 0.7); }) +
        R(722, 520, 48, 390) + L('M722 610 H770') + L('M722 730 H770') + L('M722 850 H770') +
        ER(800, 545, 54, 16, -28) + ER(700, 485, 52, 16, 26) +
        E(500, 745, 175, 170) + E(500, 775, 108, 125) +
        par(function () { return ER(335, 705, 42, 95, 25); }) + pes(410, 890, 70, 42) +
        E(500, 405, 185, 165) +
        par(function () { return ER(428, 400, 48, 62, 20); }) + focinho(500, 405, 1.48);
      function R(x, y, w, h) { return H.R(x, y, w, h, 14); }
    }
  });

  Desenhos.add({
    id: 'porquinho', cat: 'bichinhos', nome: 'Porquinho',
    cara: [500, 395, 1.5], cabeca: [500, 400, 185],
    corpo: function () {
      return L('M680 800 Q745 790 735 745 Q725 715 692 735', 1.1) +
        par(function () { return P('M350 330 Q285 265 318 205 Q395 215 450 275Z'); }) +
        E(500, 745, 185, 170) + E(500, 775, 110, 120) +
        par(function () { return ER(330, 710, 38, 88, 25); }) + pes(410, 892, 62, 38) +
        E(500, 400, 190, 165) + E(500, 427, 66, 52) + D(480, 417, 9) + D(520, 417, 9);
    }
  });

  Desenhos.add({
    id: 'patinho', cat: 'bichinhos', nome: 'Patinho',
    cara: [500, 395, 1.5], cabeca: [500, 395, 170],
    corpo: function () {
      return par(function () { return P('M410 868 L338 922 Q375 944 412 928 Q442 946 482 920Z'); }) +
        E(500, 710, 172, 170) + E(500, 745, 100, 112) +
        par(function () { return ER(328, 705, 42, 96, 18); }) +
        L('M500 232 Q500 182 466 166', 1.2) + L('M520 235 Q540 188 578 194', 1.2) +
        E(500, 395, 175, 165) +
        P('M420 440 Q500 402 580 440 Q564 498 500 500 Q436 498 420 440Z');
    }
  });

  Desenhos.add({
    id: 'ovelha', cat: 'bichinhos', nome: 'Ovelhinha',
    cara: [500, 430, 1.05], cabeca: [500, 432, 130],
    corpo: function () {
      var s = par(function () { return H.R(410, 840, 52, 100, 22); });
      for (var i = 0; i < 10; i++) { var a = i * Math.PI / 5; s += C(500 + Math.cos(a) * 150, 745 + Math.sin(a) * 130, 72); }
      s += E(500, 745, 165, 150);
      for (var j = 0; j < 12; j++) { var b = j * Math.PI / 6; s += C(500 + Math.cos(b) * 178, 425 + Math.sin(b) * 178, 62); }
      s += E(500, 425, 190, 190);
      return s + par(function () { return ER(372, 420, 54, 28, -20); }) + E(500, 438, 118, 128) + focinho(500, 430, 1.05);
    }
  });

  Desenhos.add({
    id: 'elefante', cat: 'bichinhos', nome: 'Elefantinho',
    cara: [500, 410, 1.4], cabeca: [500, 415, 170],
    corpo: function () {
      return L('M690 770 Q745 780 738 850', 1.1) + ER(738, 862, 18, 30, 0) +
        E(500, 755, 190, 160) + E(500, 790, 112, 105) + pes(405, 905, 68, 40) +
        par(function () { return C(298, 430, 125) + C(302, 436, 78, 0.7); }) +
        E(500, 415, 172, 160) +
        P('M462 445 Q452 625 516 692 Q578 722 606 668 Q572 668 552 640 Q528 600 540 445Z');
    }
  });

  Desenhos.add({
    id: 'girafa', cat: 'bichinhos', nome: 'Girafinha',
    cara: [500, 285, 1.0], cabeca: [500, 290, 100],
    pescoco: [500, 365, 1.0],
    corpo: function () {
      return L('M725 800 Q790 790 780 868', 1.1) + C(780, 880, 22) +
        par(function () { return H.R(365, 870, 66, 100, 28); }) +
        P('M418 880 L440 350 L560 350 L582 880Z') +
        C(480, 520, 28, 0.8) + C(528, 635, 34, 0.8) + C(474, 745, 30, 0.8) + C(535, 440, 22, 0.8) +
        E(500, 805, 230, 120) + C(380, 770, 30, 0.8) + C(618, 800, 34, 0.8) + C(540, 745, 20, 0.8) +
        par(function () { return L('M446 205 L433 150', 1.6) + C(431, 138, 17); }) +
        par(function () { return ER(380, 262, 40, 20, -30); }) +
        E(500, 288, 112, 94) + focinho(500, 285, 1.0);
    }
  });

  Desenhos.add({
    id: 'leao', cat: 'bichinhos', nome: 'Leãozinho',
    cara: [500, 415, 1.3], cabeca: [500, 418, 150],
    corpo: function () {
      var juba = '';
      for (var i = 0; i < 12; i++) juba += G(i * 30, 500, 415, E(500, 245, 60, 82));
      return L('M650 850 Q765 850 772 765', 1.2) + ER(775, 742, 28, 38, 0) +
        E(500, 790, 150, 150) + E(500, 820, 88, 105) + pes(425, 905, 58, 36) +
        juba + C(500, 418, 192) +
        par(function () { return C(390, 290, 40) + C(391, 293, 20, 0.7); }) +
        E(500, 418, 152, 140) + focinho(500, 415, 1.3);
    }
  });

  Desenhos.add({
    id: 'sapo', cat: 'bichinhos', nome: 'Sapinho',
    cara: [500, 300, 1.6], cabeca: [500, 400, 190],
    corpo: function () {
      return par(function () { return ER(285, 855, 90, 46, -12); }) +
        E(500, 740, 235, 185) + E(500, 785, 150, 130) +
        par(function () { return ER(320, 735, 36, 72, 22); }) +
        E(500, 480, 255, 170) +
        par(function () { return C(395, 300, 76); }) + D(482, 392, 6) + D(518, 392, 6);
    }
  });

  Desenhos.add({
    id: 'coruja', cat: 'bichinhos', nome: 'Corujinha',
    cara: [500, 415, 1.6], cabeca: [500, 420, 220], semBoca: true,
    pescoco: [500, 660, 1.5],
    corpo: function () {
      return par(function () { return P('M285 290 L255 160 L405 250Z'); }) +
        par(function () { return ER(262, 665, 50, 150, 8); }) +
        P('M268 465 Q268 215 500 215 Q732 215 732 465 L752 720 Q757 905 500 912 Q243 905 248 720Z') +
        par(function () { return L('M405 650 Q435 685 465 650') + L('M345 720 Q375 755 405 720') + L('M410 790 Q440 825 470 790'); }) +
        par(function () { return E(425, 935, 62, 26); }) +
        par(function () { return C(408, 415, 90); }) +
        P('M474 445 L526 445 L500 498Z');
    }
  });

  Desenhos.add({
    id: 'baleia', cat: 'bichinhos', nome: 'Baleinha',
    cara: [500, 565, 1.8], cabeca: [500, 580, 230],
    pescoco: [500, 830, 1.8],
    corpo: function () {
      return L('M500 335 V262', 1.3) + L('M500 275 Q450 232 405 268') + L('M500 275 Q550 232 595 268') +
        C(375, 215, 14, 0.8) + C(625, 215, 14, 0.8) + C(500, 215, 14, 0.8) +
        P('M780 560 C875 560 930 495 922 395 C885 430 840 430 810 400 C800 480 765 520 720 545Z') +
        E(500, 600, 320, 270) +
        L('M255 705 Q500 830 745 705') + L('M295 775 Q500 880 705 775') +
        ER(222, 690, 30, 80, 38);
    }
  });
})();
