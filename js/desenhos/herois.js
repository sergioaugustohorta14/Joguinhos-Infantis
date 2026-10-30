/* Heróis: 6 bases originais (ouriço veloz, raposa de duas caudas e três cãezinhos socorristas) */
(function () {
  'use strict';
  var H = Desenhos.H, E = H.E, ER = H.ER, C = H.C, P = H.P, L = H.L, par = H.par;
  var caoSentado = Desenhos.caoSentado, focinho = Desenhos.caoFocinho;

  var sapatos = function () { return par(function () { return E(412, 893, 82, 42) + L('M355 880 Q412 862 470 880'); }); };
  var bracos = function () { return par(function () { return ER(352, 695, 30, 90, 22) + C(332, 782, 38); }); };

  Desenhos.add({
    id: 'ourico', cat: 'herois', nome: 'Ouriço Turbo',
    cara: [500, 390, 1.45], cabeca: [500, 395, 170],
    corpo: function () {
      return par(function () { return P('M345 340 L165 275 L292 455Z') + P('M332 455 L150 478 L305 565Z') + P('M400 262 L330 112 L452 238Z'); }) +
        P('M458 250 L500 100 L542 250Z') +
        par(function () { return H.R(425, 835, 64, 60, 26); }) + sapatos() +
        E(500, 705, 135, 170) + E(500, 735, 82, 112) + bracos() +
        E(500, 395, 170, 165) + focinho(500, 390, 1.45);
    }
  });

  Desenhos.add({
    id: 'ourico2', cat: 'herois', nome: 'Ouriço correndo',
    cara: [570, 385, 1.4], cabeca: [565, 385, 165],
    corpo: function () {
      return L('M95 330 H215', 1.1) + L('M60 430 H165', 1.1) + L('M90 780 H200', 1.1) + L('M130 870 H235', 1.1) +
        P('M415 330 L205 295 L350 445Z') + P('M395 440 L175 490 L350 550Z') + P('M410 530 L215 640 L385 625Z') +
        ER(412, 650, 32, 90, 65) + C(335, 700, 38) +
        ER(440, 790, 34, 96, 48) + ER(335, 858, 80, 40, -12) +
        ER(535, 650, 128, 160, -16) + ER(545, 675, 78, 105, -16) +
        ER(655, 815, 34, 98, -38) + ER(745, 885, 82, 40, -18) +
        E(565, 385, 168, 160) + focinho(565, 385, 1.4) +
        ER(668, 600, 32, 88, -55) + C(738, 570, 38);
    }
  });

  Desenhos.add({
    id: 'raposa', cat: 'herois', nome: 'Raposa Turbo',
    cara: [500, 395, 1.5], cabeca: [500, 400, 175],
    corpo: function () {
      return par(function () { return P('M390 840 C240 880 95 800 92 650 C90 565 150 505 218 545 C252 605 312 650 392 685Z') + L('M128 590 Q175 570 214 592', 0.8); }) +
        par(function () { return H.R(425, 835, 64, 60, 26); }) + sapatos() +
        E(500, 725, 135, 165) + E(500, 755, 82, 112) + bracos() +
        par(function () { return P('M345 315 L298 90 L478 240Z') + P('M352 285 L322 160 L420 240Z', 0.7); }) +
        par(function () { return P('M338 440 L205 462 L335 535Z'); }) +
        E(500, 400, 185, 150) + focinho(500, 395, 1.5);
    }
  });

  Desenhos.add({
    id: 'bombeiro', cat: 'herois', nome: 'Cão Bombeiro', semChapeu: true,
    cara: [500, 396, 1.52], cabeca: [500, 400, 180],
    corpo: caoSentado({
      roupa: function () {
        return L('M334 770 Q500 828 666 770') + L('M338 806 Q500 864 662 806') + H.estrela(430, 690, 36, 0.5, 5, 0.8);
      },
      extra: function () {
        return P('M335 325 Q335 150 500 138 Q665 150 665 325 Q500 295 335 325Z') +
          P('M298 335 Q500 296 702 335 L690 372 Q500 338 310 372Z') +
          P('M468 205 L532 205 L532 255 Q500 288 468 255Z') + L('M500 218 V262', 0.8);
      }
    })
  });

  Desenhos.add({
    id: 'policial', cat: 'herois', nome: 'Cão Policial', semChapeu: true,
    cara: [500, 396, 1.52], cabeca: [500, 400, 180],
    corpo: caoSentado({
      orelhas: 'pe',
      roupa: function () {
        return P('M470 575 L530 575 L540 700 L500 730 L460 700Z') + H.estrela(570, 700, 34, 0.5, 5, 0.8) +
               L('M335 780 Q500 835 665 780');
      },
      extra: function () {
        return P('M345 335 Q345 190 500 180 Q655 190 655 335 Q500 305 345 335Z') +
          P('M338 328 Q500 296 662 328 L656 356 Q500 326 344 356Z') +
          P('M400 356 Q500 340 600 356 Q590 376 500 376 Q410 376 400 356Z') +
          H.estrela(500, 252, 34, 0.5, 5, 0.8);
      }
    })
  });

  Desenhos.add({
    id: 'piloto', cat: 'herois', nome: 'Cão Piloto', semChapeu: true,
    cara: [500, 396, 1.52], cabeca: [500, 400, 180],
    pescoco: [500, 575, 1.45],
    corpo: caoSentado({
      roupa: function () {
        return P('M592 612 L652 626 L672 770 L608 760Z') + L('M610 660 L660 672') + L('M614 710 L665 720');
      },
      extra: function () {
        return P('M338 345 Q330 165 500 150 Q670 165 662 345 Q500 300 338 345Z') +
          par(function () { return P('M342 335 Q298 405 335 475 Q374 432 374 352Z'); }) +
          par(function () { return C(432, 262, 46, 0.9) + C(432, 262, 24, 0.7); }) +
          L('M345 300 Q500 270 655 300') + L('M478 262 H522');
      }
    })
  });
})();
