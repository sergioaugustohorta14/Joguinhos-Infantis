/* Cachorrinhos: 7 bases (e o gerador de cão sentado usado também pelos heróis) */
(function () {
  'use strict';
  var H = Desenhos.H, E = H.E, ER = H.ER, C = H.C, P = H.P, L = H.L, N = H.N, par = H.par;
  var r = Math.round;

  // focinho claro + nariz (k = escala do rosto; mesmo padrão do rosto: olhos em y, nariz em y+12k)
  function focinho(cx, cy, k) {
    return E(cx, cy + 30 * k, 50 * k, 32 * k) + N(cx, cy + 14 * k, 15 * k, 10 * k);
  }

  // orelhas caídas dos dois lados da cabeça
  function orelhasCaidas(cx, cy, rx, ry) {
    return ER(cx - rx * 0.98, cy + ry * 0.35, rx * 0.3, ry * 0.7, 14) + ER(cx + rx * 0.98, cy + ry * 0.35, rx * 0.3, ry * 0.7, -14);
  }
  // orelhas em pé com a pontinha dobrada
  function orelhasPe(cx, cy, rx, ry) {
    var s = '';
    [-1, 1].forEach(function (d) {
      s += P('M' + r(cx + d * rx * 0.85) + ' ' + r(cy - ry * 0.4) + ' Q' + r(cx + d * rx * 1.1) + ' ' + r(cy - ry * 1.35) + ' ' + r(cx + d * rx * 0.9) + ' ' + r(cy - ry * 1.55) + ' Q' + r(cx + d * rx * 0.5) + ' ' + r(cy - ry * 1.3) + ' ' + r(cx + d * rx * 0.25) + ' ' + r(cy - ry * 0.9) + 'Z');
    });
    return s;
  }

  // cão sentado de frente. cfg: { orelhas, extra(depois da cabeça), roupa(sobre o corpo), coleira }
  function caoSentado(cfg) {
    cfg = cfg || {};
    return function () {
      var cx = 500, cy = 400, rx = 190, ry = 165, k = rx / 125;
      var s = P('M660 850 C745 860 800 800 785 735 L738 758 C742 805 705 825 655 815Z') +
        E(500, 725, 172, 190) + E(500, 765, 100, 125) +
        par(function () { return E(430, 885, 54, 38); });
      if (cfg.roupa) s += cfg.roupa();
      if (cfg.coleira) s += P('M362 555 Q500 610 638 555 L628 598 Q500 652 372 598Z') + C(500, 640, 24);
      s += (cfg.orelhas === 'pe' ? orelhasPe(cx, cy, rx, ry) : orelhasCaidas(cx, cy, rx, ry));
      s += E(cx, cy, rx, ry);
      if (cfg.antes) s += cfg.antes();
      s += focinho(cx, cfg.cy || cy - 4, k);
      if (cfg.extra) s += cfg.extra();
      return s;
    };
  }
  Desenhos.caoSentado = caoSentado;
  Desenhos.caoFocinho = focinho;

  Desenhos.add({
    id: 'cao1', cat: 'cachorrinhos', nome: 'Cachorrinho sentado',
    cara: [500, 396, 1.52], cabeca: [500, 400, 180],
    pescoco: [500, 570, 1.5],
    corpo: caoSentado({ coleira: true })
  });

  Desenhos.add({
    id: 'cao2', cat: 'cachorrinhos', nome: 'Filhote com osso',
    cara: [500, 385, 1.45], cabeca: [500, 390, 175],
    corpo: function () {
      return E(500, 690, 150, 150) + par(function () { return E(415, 858, 56, 34); }) +
        orelhasCaidas(500, 385, 180, 160) + E(500, 385, 180, 160) + focinho(500, 385, 1.45) +
        H.R(345, 770, 310, 64, 32) + C(342, 772, 32) + C(342, 832, 32) + C(658, 772, 32) + C(658, 832, 32);
    }
  });

  Desenhos.add({
    id: 'cao3', cat: 'cachorrinhos', nome: 'Dálmata',
    cara: [500, 400, 1.5], cabeca: [500, 400, 180],
    corpo: function () {
      var manchas = C(560, 705, 24, 0.8) + C(420, 770, 18, 0.8) + C(580, 820, 20, 0.8) + C(430, 660, 14, 0.8);
      return P('M650 800 C740 790 800 740 790 670 L742 690 C748 740 710 765 650 765Z') +
        par(function () { return H.R(392, 770, 76, 150, 34); }) +
        E(500, 700, 155, 185) + manchas +
        par(function () { return P('M352 295 C260 300 225 430 255 540 C300 560 350 500 358 400Z'); }) +
        E(500, 400, 182, 163) + focinho(500, 400, 1.5) +
        C(425, 300, 24, 0.8) + C(590, 322, 18, 0.8);
    }
  });

  Desenhos.add({
    id: 'cao4', cat: 'cachorrinhos', nome: 'Salsicha',
    cara: [235, 495, 1.15], cabeca: [235, 495, 135],
    pescoco: [300, 610, 1.0],
    corpo: function () {
      return P('M790 610 Q870 570 895 485 L925 505 Q905 610 835 660Z') +
        H.R(250, 745, 66, 115, 28) + H.R(340, 755, 66, 105, 28) + H.R(660, 755, 66, 105, 28) + H.R(750, 745, 66, 115, 28) +
        H.R(190, 560, 640, 220, 110) +
        L('M520 600 L535 650') + L('M610 595 L622 648') + L('M700 605 L710 650') +
        ER(95, 565, 38, 85, 18) + ER(375, 565, 38, 85, -18) +
        E(235, 495, 140, 125) + focinho(235, 495, 1.15);
    }
  });

  Desenhos.add({
    id: 'cao5', cat: 'cachorrinhos', nome: 'Poodle',
    cara: [500, 400, 1.35], cabeca: [500, 395, 165],
    corpo: function () {
      return C(690, 780, 52) + L('M650 800 L560 830') +
        par(function () { return C(405, 900, 52); }) + E(500, 745, 175, 165) +
        par(function () { return C(360, 560, 70); }) +
        par(function () { return C(318, 430, 80); }) + par(function () { return C(300, 520, 48); }) +
        C(500, 215, 70) +
        E(500, 395, 160, 150) + focinho(500, 400, 1.35);
    }
  });

  Desenhos.add({
    id: 'cao6', cat: 'cachorrinhos', nome: 'Cachorrinho deitado',
    cara: [500, 430, 1.52], cabeca: [500, 430, 180],
    corpo: function () {
      return P('M770 800 C860 800 905 750 890 690 L845 706 C850 745 815 760 770 755Z') +
        E(500, 745, 310, 150) +
        par(function () { return ER(240, 790, 50, 85, 25); }) +
        orelhasCaidas(500, 430, 185, 160) + E(500, 430, 185, 160) + focinho(500, 430, 1.5) +
        par(function () { return E(400, 880, 76, 42); }) +
        L('M360 850 V880') + L('M440 850 V880');
    }
  });

  Desenhos.add({
    id: 'cao7', cat: 'cachorrinhos', nome: 'Cachorrinho com bola',
    cara: [500, 400, 1.5], cabeca: [500, 400, 180],
    corpo: caoSentado({
      orelhas: 'pe',
      antes: function () { return ER(428, 385, 60, 74, -12, 0.9); }
    })
  });
  // a bola entra por cima do cão: redefine o corpo da última base
  (function () {
    var bases = Desenhos.bases(), b = bases[bases.length - 1], antes = b.corpo;
    b.corpo = function () {
      return antes() + C(715, 835, 88) + L('M640 800 Q715 760 790 800') + L('M640 870 Q715 910 790 870') + L('M715 748 V922', 0.8);
    };
  })();
})();
