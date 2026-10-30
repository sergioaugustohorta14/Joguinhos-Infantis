/* Natureza: 9 bases (flores, cogumelo, cacto, árvore, arco-íris e sol) */
(function () {
  'use strict';
  var H = Desenhos.H, E = H.E, ER = H.ER, C = H.C, P = H.P, L = H.L, par = H.par, G = H.G;

  var haste = function (x, topo) { return P('M' + (x - 30) + ' ' + topo + ' L' + (x - 34) + ' 965 L' + (x + 34) + ' 965 L' + (x + 30) + ' ' + topo + 'Z'); };
  var folhas = function () {
    return P('M470 790 Q340 720 280 790 Q350 865 470 830Z') + L('M470 805 Q380 790 318 790', 0.7) +
           P('M530 720 Q660 650 722 720 Q652 795 530 760Z') + L('M530 735 Q620 720 682 720', 0.7);
  };

  Desenhos.add({
    id: 'girassol', cat: 'natureza', nome: 'Girassol',
    cara: [500, 430, 1.5], cabeca: [500, 430, 150],
    pescoco: [500, 600, 1.2],
    corpo: function () {
      var a = '', b = '', i;
      for (i = 0; i < 14; i++) a += G(i * 360 / 14 + 12.8, 500, 430, E(500, 192, 46, 88));
      for (i = 0; i < 14; i++) b += G(i * 360 / 14, 500, 430, E(500, 175, 48, 96));
      return haste(500, 560) + folhas() + a + b + C(500, 430, 152);
    }
  });

  Desenhos.add({
    id: 'margarida', cat: 'natureza', nome: 'Margarida',
    cara: [500, 430, 1.05], cabeca: [500, 430, 120],
    pescoco: [500, 600, 1.0],
    corpo: function () {
      var p = '';
      for (var i = 0; i < 9; i++) p += G(i * 40, 500, 430, E(500, 215, 60, 118));
      return haste(500, 560) + folhas() + p + C(500, 430, 122);
    }
  });

  Desenhos.add({
    id: 'tulipa', cat: 'natureza', nome: 'Tulipa',
    cara: [500, 440, 1.3], cabeca: [500, 440, 150],
    pescoco: [500, 600, 1.2],
    corpo: function () {
      return haste(500, 580) +
        P('M485 960 Q310 880 270 640 Q420 700 485 860Z') + P('M515 960 Q690 880 730 640 Q580 700 515 860Z') +
        P('M338 470 Q308 300 350 195 Q430 268 500 188 Q570 268 650 195 Q692 300 662 470 Q640 592 500 596 Q360 592 338 470Z');
    }
  });

  Desenhos.add({
    id: 'florzinha', cat: 'natureza', nome: 'Florzinha',
    cara: [500, 440, 1.15], cabeca: [500, 440, 130],
    pescoco: [500, 640, 1.0],
    corpo: function () {
      var p = '';
      for (var i = 0; i < 5; i++) p += G(i * 72, 500, 440, E(500, 252, 108, 128));
      return haste(500, 640) + folhas() + p + C(500, 440, 128);
    }
  });

  Desenhos.add({
    id: 'cogumelo', cat: 'natureza', nome: 'Cogumelo',
    cara: [500, 735, 1.4], cabeca: [500, 730, 150],
    pescoco: [500, 600, 1.2],
    corpo: function () {
      return L('M130 930 Q150 880 170 930 M200 940 Q225 870 250 940 M740 935 Q765 875 790 935 M815 925 Q835 885 855 925') +
        P('M385 560 Q362 800 320 900 Q500 960 680 900 Q638 800 615 560Z') +
        P('M140 575 Q140 185 500 165 Q860 185 860 575 Q500 625 140 575Z') +
        C(330, 335, 56, 0.9) + C(565, 275, 72, 0.9) + C(718, 435, 46, 0.9) + C(430, 475, 40, 0.9) + C(250, 480, 28, 0.9);
    }
  });

  Desenhos.add({
    id: 'cacto', cat: 'natureza', nome: 'Cactinho',
    cara: [500, 500, 1.5], cabeca: [500, 500, 120],
    corpo: function () {
      return par(function () { return P('M390 640 L285 640 Q232 640 232 590 L232 480 Q232 436 274 436 Q316 436 316 480 L316 558 L390 558Z'); }) +
        H.R(380, 235, 240, 590, 120) +
        L('M470 290 v24 M530 290 v24 M500 330 v24') +
        par(function () { return L('M274 470 v24 M262 520 v20'); }) +
        H.loc(500, 205, 0.5, function () {
          var s = '';
          for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / 5; s += C(Math.cos(a) * 32, Math.sin(a) * 32, 24, 1.2); }
          return s + C(0, 0, 17, 1.2);
        }) +
        P('M318 810 L682 810 L642 975 L358 975Z') + H.R(298, 780, 404, 56, 18) + L('M420 870 H580', 0.8);
    }
  });

  Desenhos.add({
    id: 'arvore', cat: 'natureza', nome: 'Árvore',
    cara: [500, 400, 1.8], cabeca: [500, 400, 225],
    pescoco: [500, 640, 1.5],
    corpo: function () {
      var copa = '', i;
      for (i = 0; i < 12; i++) { var a = i * Math.PI / 6; copa += C(500 + Math.cos(a) * 205, 395 + Math.sin(a) * 195, 88); }
      return P('M425 965 L452 600 L548 600 L575 965Z') + L('M470 770 L395 700') + L('M530 790 L610 720') +
        copa + E(500, 395, 255, 245) +
        C(330, 520, 24, 0.9) + C(680, 300, 26, 0.9) + C(640, 540, 22, 0.9) + C(310, 280, 22, 0.9);
    }
  });

  Desenhos.add({
    id: 'arcoiris', cat: 'natureza', nome: 'Arco-íris',
    cara: [500, 735, 1.6], cabeca: [500, 735, 170],
    pescoco: [500, 860, 1.5],
    corpo: function () {
      var cx = 500, cy = 640;
      function faixa(R, t) {
        return P('M' + (cx - R) + ' ' + cy + ' A' + R + ' ' + R + ' 0 0 1 ' + (cx + R) + ' ' + cy + ' L' + (cx + R - t) + ' ' + cy +
                 ' A' + (R - t) + ' ' + (R - t) + ' 0 0 0 ' + (cx - R + t) + ' ' + cy + 'Z');
      }
      return faixa(440, 70) + faixa(370, 70) + faixa(300, 70) + faixa(230, 70) +
        H.loc(500, 740, 2.6, function () {
          return P('M-70 30 C-104 30 -104 -22 -58 -26 C-54 -66 14 -72 28 -38 C60 -54 100 -22 78 12 C104 30 82 50 58 50 L-48 50 C-80 50 -92 36 -70 30Z');
        });
    }
  });

  Desenhos.add({
    id: 'sol', cat: 'natureza', nome: 'Solzinho',
    cara: [500, 465, 1.9], cabeca: [500, 470, 200],
    pescoco: [500, 700, 1.6],
    corpo: function () {
      var raios = '';
      for (var i = 0; i < 12; i++) raios += G(i * 30, 500, 470, P('M466 262 L500 130 L534 262Z'));
      return raios + C(500, 470, 205) +
        H.loc(690, 810, 1.8, function () {
          return P('M-70 30 C-104 30 -104 -22 -58 -26 C-54 -66 14 -72 28 -38 C60 -54 100 -22 78 12 C104 30 82 50 58 50 L-48 50 C-80 50 -92 36 -70 30Z');
        });
    }
  });
})();
