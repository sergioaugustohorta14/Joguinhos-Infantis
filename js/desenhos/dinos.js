/* Dinossauros: 9 bases */
(function () {
  'use strict';
  var H = Desenhos.H, E = H.E, ER = H.ER, C = H.C, P = H.P, L = H.L, par = H.par, G = H.G;

  var pes = function (x, y) { return par(function () { return E(x, y, 78, 46); }); };

  Desenhos.add({
    id: 'trex', cat: 'dinos', nome: 'Dino Rex',
    cara: [500, 385, 1.6], cabeca: [500, 395, 195],
    corpo: function () {
      return P('M650 730 C780 700 880 750 905 850 C830 855 760 830 650 830Z') +
        pes(385, 870) +
        E(500, 690, 195, 190) + E(500, 735, 120, 135) +
        par(function () { return ER(318, 665, 40, 27, 30); }) +
        P('M435 238 L470 170 L500 238Z') + P('M500 238 L535 170 L565 238Z') +
        E(500, 395, 225, 175);
    }
  });

  Desenhos.add({
    id: 'tricera', cat: 'dinos', nome: 'Tricerátops',
    cara: [500, 420, 1.45], cabeca: [500, 420, 165],
    corpo: function () {
      var babados = '';
      for (var i = 0; i < 9; i++) {
        var a = Math.PI + i * Math.PI / 8;
        babados += C(500 + Math.cos(a) * 262, 400 + Math.sin(a) * 235, 40);
      }
      return pes(375, 880) + E(500, 730, 205, 170) + E(500, 760, 120, 115) +
        babados + E(500, 400, 262, 235) +
        P('M395 330 L352 175 L440 300Z') + P('M605 330 L648 175 L560 300Z') +
        E(500, 425, 178, 160) + P('M462 305 L500 232 L538 305Z');
    }
  });

  Desenhos.add({
    id: 'stego', cat: 'dinos', nome: 'Estegossauro',
    cara: [500, 440, 1.4], cabeca: [500, 440, 155],
    corpo: function () {
      var placas = '';
      for (var i = 0; i < 7; i++) {
        var ang = (i - 3) * 24, y = 440 - 168;
        var x = 500;
        placas += G(ang, 500, 440, P('M' + (x - 44) + ' ' + y + ' L' + x + ' ' + (y - 100) + ' L' + (x + 44) + ' ' + y + ' L' + x + ' ' + (y + 46) + 'Z'));
      }
      return P('M690 740 C790 700 890 730 925 790 L860 800 L890 850 L800 835 L760 880 L700 840Z') +
        pes(375, 885) + placas + E(500, 740, 215, 160) + E(500, 770, 120, 100) +
        E(500, 440, 160, 150);
    }
  });

  Desenhos.add({
    id: 'braquio', cat: 'dinos', nome: 'Braquiossauro',
    cara: [440, 235, 1.1], cabeca: [440, 240, 118],
    pescoco: [440, 345, 1.1],
    corpo: function () {
      return P('M690 770 C800 750 890 790 925 870 C850 870 790 855 690 850Z') +
        pes(370, 905) +
        P('M330 800 C300 650 330 480 385 335 L495 335 C520 480 590 650 650 800Z') +
        E(500, 790, 270, 150) +
        C(400, 760, 26, 0.7) + C(560, 740, 20, 0.7) + C(640, 820, 24, 0.7) + C(330, 840, 16, 0.7) +
        E(440, 240, 125, 108) + P('M385 150 L400 105 L418 150Z', 0.7) + P('M462 140 L482 98 L496 146Z', 0.7);
    }
  });

  Desenhos.add({
    id: 'ovo', cat: 'dinos', nome: 'Dino no ovo', semChapeu: true,
    cara: [500, 480, 1.45], cabeca: [500, 480, 170],
    corpo: function () {
      return P('M370 330 L405 262 L440 322Z') + P('M460 300 L500 220 L540 300Z') + P('M560 322 L595 262 L630 330Z') +
        E(500, 480, 175, 165) +
        P('M175 645 L255 590 L320 660 L395 585 L460 660 L535 585 L605 660 L675 590 L745 660 L825 645 Q850 760 790 840 Q700 925 500 925 Q300 925 210 840 Q150 760 175 645Z') +
        C(330, 770, 26, 0.8) + C(660, 800, 20, 0.8) + C(520, 840, 14, 0.8);
    }
  });

  Desenhos.add({
    id: 'ptero', cat: 'dinos', nome: 'Pterodáctilo',
    cara: [500, 440, 1.15], cabeca: [500, 435, 110],
    corpo: function () {
      return par(function () {
        return P('M432 520 C330 380 190 340 60 400 C130 430 150 470 130 535 C190 500 245 520 258 585 C310 545 370 575 432 640Z');
      }) + par(function () { return E(448, 800, 46, 26); }) +
        E(500, 650, 115, 160) + E(500, 690, 66, 105) +
        P('M455 345 L500 205 L545 345Z') +
        E(500, 440, 118, 108);
    }
  });

  Desenhos.add({
    id: 'anquilo', cat: 'dinos', nome: 'Anquilossauro',
    cara: [500, 600, 1.4], cabeca: [500, 600, 155],
    corpo: function () {
      var placas = '', espinhos = '';
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 5 - (r % 2); c++) {
          placas += E(500 + (c - (4 - (r % 2)) / 2) * 110, 330 + r * 90, 38, 30, 0.8);
        }
      }
      for (var i = 0; i < 7; i++) {
        var a = Math.PI + 0.25 + i * (Math.PI - 0.5) / 6;
        var x = 500 + Math.cos(a) * 296, y = 610 + Math.sin(a) * 345;
        espinhos += G(a * 180 / Math.PI + 90, x, y, P('M' + (x - 32) + ' ' + y + ' L' + x + ' ' + (y - 64) + ' L' + (x + 32) + ' ' + y + 'Z'));
      }
      return L('M770 660 L860 745', 2.6) + E(880, 760, 62, 46) +
        pes(385, 765) + espinhos +
        P('M210 640 Q200 260 500 250 Q800 260 790 640Z') + placas +
        E(500, 600, 160, 150);
    }
  });

  Desenhos.add({
    id: 'dinoverde', cat: 'dinos', nome: 'Dino sentadinho',
    cara: [500, 360, 1.5], cabeca: [500, 365, 175],
    corpo: function () {
      return P('M690 760 C790 740 870 780 895 855 C830 865 760 855 690 845Z') +
        P('M455 205 L500 130 L545 205Z') + P('M335 255 L360 175 L420 235Z') + P('M665 255 L640 175 L580 235Z') +
        pes(385, 880) + E(500, 650, 235, 250) + E(500, 715, 135, 160) +
        par(function () { return ER(262, 660, 38, 62, 20); }) +
        E(500, 365, 180, 165) +
        C(322, 545, 18, 0.7) + C(690, 570, 15, 0.7);
    }
  });

  Desenhos.add({
    id: 'espino', cat: 'dinos', nome: 'Espinossauro',
    cara: [500, 460, 1.5], cabeca: [500, 470, 185],
    corpo: function () {
      return P('M690 760 C790 725 890 755 925 835 L845 840 L880 890 L780 875 L730 905 L690 850Z') +
        P('M262 590 Q252 140 500 108 Q748 140 738 590Z') +
        L('M500 130 L500 330') + L('M380 170 L400 330') + L('M620 170 L600 330') + L('M310 290 L350 400') + L('M690 290 L650 400') +
        pes(385, 888) + E(500, 760, 205, 150) + E(500, 790, 118, 100) +
        E(500, 470, 190, 160) + E(500, 545, 118, 72);
    }
  });
})();
