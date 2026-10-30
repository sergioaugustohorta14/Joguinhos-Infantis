/* Ícones dos botões (desenhados em código, 48x48, cor = cor do texto do botão). */
(function () {
  'use strict';

  var L = 'fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"';

  var FORMAS = {
    casa: '<path d="M8 24 24 9l16 15v15H29V29H19v10H8z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>',
    galeria: '<g ' + L + '><rect x="8" y="8" width="13" height="13" rx="3.5"/><rect x="27" y="8" width="13" height="13" rx="3.5"/><rect x="8" y="27" width="13" height="13" rx="3.5"/><rect x="27" y="27" width="13" height="13" rx="3.5"/></g>',
    lapis: '<g ' + L + '><path d="M9 39 L11 30 L31 10 L38 17 L18 37Z"/><path d="M27 14 L34 21"/></g><path d="M9 39 L11 30 L18 37Z" fill="currentColor"/>',
    pincel: '<g ' + L + '><path d="M40 8 L25 23" stroke-width="6.5"/></g><path d="M22 24 C12 23 8 31 9 39 C18 40 27 37 28 29Z" fill="currentColor"/>',
    borracha: '<g ' + L + '><path d="M9 30 L26 12 L40 25 L28 39 L16 39Z"/><path d="M18 21 L33 35"/></g>',
    balde: '<g ' + L + '><path d="M10 25 L23 12 L37 26 L24 39Z"/><path d="M23 12 C18 4 10 6 10 14"/><path d="M12 28 L35 28" /></g><path d="M41 27 C45 33 45 38 41 40 C37 38 37 33 41 27Z" fill="currentColor"/>',
    desfazer: '<g ' + L + '><path d="M18 12 L9 21 L18 30"/><path d="M10 21 H29 A10 10 0 0 1 29 41 H19"/></g>',
    limpar: '<g ' + L + '><path d="M10 14 H38"/><path d="M19 14 V9 H29 V14"/><path d="M13 14 L15 40 H33 L35 14"/><path d="M21 21 V33 M27 21 V33"/></g>',
    salvar: '<g ' + L + '><path d="M24 7 V29"/><path d="M14 20 L24 30 L34 20"/><path d="M9 34 V41 H39 V34"/></g>',
    som: ''
  };

  window.Icones = {
    // retorna o <svg> pronto para colocar dentro de um botão
    svg: function (nome) {
      return '<svg viewBox="0 0 48 48" class="ico" aria-hidden="true">' + (FORMAS[nome] || '') + '</svg>';
    }
  };
})();
