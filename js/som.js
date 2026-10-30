/* Sons gerados no código (Web Audio): sem arquivos de áudio, volume baixo e timbre suave. */
(function () {
  'use strict';

  var ctx = null;
  var mudo = false;

  try { mudo = localStorage.getItem('joguinhos.mudo') === '1'; } catch (e) { /* sem storage: segue com som */ }

  function contexto() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Navegadores só liberam áudio depois de um toque do usuário.
  function liberar() { contexto(); }

  // nota: frequência (Hz), início (s depois de agora), duração (s), volume 0..1
  function nota(freq, inicio, dur, vol, tipo) {
    var c = contexto();
    if (!c || mudo) return;
    var t0 = c.currentTime + inicio;
    var osc = c.createOscillator();
    var gan = c.createGain();
    osc.type = tipo || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gan.gain.setValueAtTime(0.0001, t0);
    gan.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gan.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gan).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  var SONS = {
    toque:   function () { nota(523, 0, 0.14, 0.12); },
    abrir:   function () { nota(392, 0, 0.14, 0.12); nota(523, 0.09, 0.2, 0.12); },
    voltar:  function () { nota(523, 0, 0.14, 0.12); nota(392, 0.09, 0.2, 0.12); },
    ponto:   function () { nota(659, 0, 0.12, 0.1); nota(880, 0.08, 0.18, 0.1); },
    pulo:    function () { nota(330, 0, 0.1, 0.1); nota(494, 0.06, 0.14, 0.1); },
    agacha:  function () { nota(262, 0, 0.12, 0.1); nota(196, 0.06, 0.16, 0.1); },
    bate:    function () { nota(220, 0, 0.25, 0.1, 'triangle'); },
    lado:    function () { nota(440, 0, 0.07, 0.07); nota(500, 0.04, 0.09, 0.06); },
    recorde: function () { nota(523, 0, 0.18, 0.1); nota(659, 0.16, 0.18, 0.1); nota(784, 0.32, 0.4, 0.1); },
    fim:     function () { nota(392, 0, 0.3, 0.1); nota(330, 0.25, 0.3, 0.1); nota(262, 0.5, 0.5, 0.1); }
  };

  window.Som = {
    liberar: liberar,
    tocar: function (nome) { if (SONS[nome]) SONS[nome](); },
    estaMudo: function () { return mudo; },
    definirMudo: function (v) {
      mudo = !!v;
      try { localStorage.setItem('joguinhos.mudo', mudo ? '1' : '0'); } catch (e) { /* ignora */ }
    }
  };
})();
