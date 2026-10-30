/* Jogo Colorir: galeria de desenhos + editor com duas camadas (tinta embaixo, contorno em cima). */
(function () {
  'use strict';

  var N = 1024;                 // resolução interna das camadas
  var COR_TRACO = [74, 64, 59]; // cor do contorno
  var MAX_DESFAZER = 40;

  var PALETA = [
    ['#e45b5b', 'Vermelho'], ['#f08a4b', 'Laranja'], ['#f6c945', 'Amarelo'], ['#a6d65a', 'Verde-limão'],
    ['#4caf6a', 'Verde'], ['#3fb8af', 'Turquesa'], ['#5aaee8', 'Azul-claro'], ['#3f6fd1', 'Azul'],
    ['#7e5bd1', 'Roxo'], ['#e37bc0', 'Rosa'], ['#f6b8c4', 'Rosa-claro'], ['#8b5a3c', 'Marrom'],
    ['#f2d2a9', 'Bege'], ['#9aa0a6', 'Cinza'], ['#2f2f33', 'Preto'], ['#ffffff', 'Branco']
  ];
  // espessuras (pequena, média, grande) em pixels da camada de 1024
  var TAMANHOS = { lapis: [4, 8, 13], pincel: [18, 34, 58], borracha: [26, 52, 96] };
  var FERRAMENTAS = [['lapis', 'Lápis'], ['pincel', 'Pincel'], ['borracha', 'Borracha'], ['balde', 'Balde de tinta']];

  var $ = function (id) { return document.getElementById(id); };
  var el = {};
  var ctxTinta, ctxContorno, scratch, ctxScratch;
  var barreira = new Uint8Array(N * N);   // 1 = linha do contorno (a tinta não passa)
  var marca = new Uint8Array(N * N);

  var estado = {
    ferramenta: 'pincel', tam: 1, cor: PALETA[0][0],
    desenho: null, pronto: false, vista: 'galeria', categoria: 'dinos'
  };
  var hist = [], posHist = 0, bbox = null;
  var ativo = null, ultimo = null;
  var observador = null, avisoTimer = null;

  // ---------- util ----------
  function guardar(k, v) { try { localStorage.setItem('joguinhos.colorir.' + k, v); } catch (e) { /* ignora */ } }
  function ler(k) { try { return localStorage.getItem('joguinhos.colorir.' + k); } catch (e) { return null; } }
  function dataUrl(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
  function hexParaRgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function botao(classe, rotulo, html, extra) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = classe;
    b.setAttribute('aria-label', rotulo);
    b.innerHTML = html;
    if (extra) Object.keys(extra).forEach(function (k) { b.setAttribute(k, extra[k]); });
    return b;
  }

  // ---------- galeria ----------
  function construirGaleria() {
    var abas = $('col-abas');
    Desenhos.categorias.forEach(function (c) {
      var primeiro = Desenhos.daCategoria(c.id)[0];
      var b = botao('aba', c.nome,
        '<img alt="" src="' + dataUrl(Desenhos.svgTexto(primeiro, '#5a4e48')) + '"><span>' + c.nome + '</span>', { 'data-cat': c.id });
      abas.appendChild(b);
    });
    abas.addEventListener('click', function (ev) {
      var b = ev.target.closest('.aba');
      if (!b) return;
      Som.liberar(); Som.tocar('toque');
      mostrarCategoria(b.getAttribute('data-cat'));
    });
    $('col-grade').addEventListener('click', function (ev) {
      var t = ev.target.closest('.tile');
      if (!t) return;
      Som.liberar(); Som.tocar('abrir');
      abrirDesenho(t.getAttribute('data-id'));
    });
  }

  function mostrarCategoria(cat) {
    estado.categoria = cat;
    guardar('categoria', cat);
    [].forEach.call(document.querySelectorAll('.aba'), function (a) {
      a.setAttribute('aria-pressed', a.getAttribute('data-cat') === cat ? 'true' : 'false');
    });
    var grade = $('col-grade');
    if (observador) observador.disconnect();
    grade.innerHTML = '';
    grade.scrollTop = 0;
    var itens = Desenhos.daCategoria(cat);
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var img = en.target.firstChild;
        var d = Desenhos.porId(en.target.getAttribute('data-id'));
        img.src = dataUrl(Desenhos.svgTexto(d, '#5a4e48'));
        observador.unobserve(en.target);
      });
    }, { root: grade, rootMargin: '300px' });
    var frag = document.createDocumentFragment();
    itens.forEach(function (d, i) {
      var t = botao('tile', 'Desenho ' + (i + 1), '<img alt="" decoding="async">', { 'data-id': d.id });
      frag.appendChild(t);
    });
    grade.appendChild(frag);
    [].forEach.call(grade.children, function (t) { observador.observe(t); });
  }

  function mostrarVista(v) {
    estado.vista = v;
    $('col-galeria').hidden = v !== 'galeria';
    $('col-editor').hidden = v !== 'editor';
  }

  // ---------- editor: montagem ----------
  function construirEditor() {
    var acoes = $('ed-acoes'), ferr = $('ed-ferr'), tam = $('ed-tam'), pal = $('ed-paleta');

    acoes.appendChild(botao('btn-ed', 'Voltar para o início', Icones.svg('casa'), { 'data-ir': 'menu' }));
    acoes.appendChild(botao('btn-ed', 'Escolher outro desenho', Icones.svg('galeria'), { id: 'ed-galeria' }));
    acoes.appendChild(botao('btn-ed', 'Desfazer', Icones.svg('desfazer'), { id: 'ed-desfazer' }));
    acoes.appendChild(botao('btn-ed espelho', 'Refazer', Icones.svg('desfazer'), { id: 'ed-refazer' }));
    acoes.appendChild(botao('btn-ed', 'Limpar tudo', Icones.svg('limpar'), { id: 'ed-limpar' }));
    acoes.appendChild(botao('btn-ed', 'Salvar desenho', Icones.svg('salvar'), { id: 'ed-salvar' }));

    FERRAMENTAS.forEach(function (f) {
      ferr.appendChild(botao('btn-ed ferr', f[1], Icones.svg(f[0]), { 'data-ferr': f[0] }));
    });
    [10, 17, 25].forEach(function (d, i) {
      tam.appendChild(botao('btn-ed tamanho', ['Pequeno', 'Médio', 'Grande'][i],
        '<span class="ponto" style="width:' + d + 'px;height:' + d + 'px"></span>', { 'data-tam': i }));
    });

    PALETA.forEach(function (c) {
      var b = botao('cor', c[1], '', { 'data-cor': c[0] });
      b.style.background = c[0];
      pal.appendChild(b);
    });
    var outra = document.createElement('label');
    outra.className = 'cor cor-outra';
    outra.setAttribute('aria-label', 'Escolher outra cor');
    outra.innerHTML = '<input type="color" id="ed-cor-livre" value="#e45b5b" aria-label="Escolher outra cor">';
    pal.appendChild(outra);

    el.pagina = $('ed-pagina');
    el.tinta = $('cv-tinta');
    el.contorno = $('cv-contorno');
    el.tinta.width = el.tinta.height = el.contorno.width = el.contorno.height = N;
    ctxTinta = el.tinta.getContext('2d', { willReadFrequently: true });
    ctxContorno = el.contorno.getContext('2d');
    scratch = document.createElement('canvas');
    scratch.width = scratch.height = N;
    ctxScratch = scratch.getContext('2d', { willReadFrequently: true });

    $('col-editor').addEventListener('click', function (ev) {
      var b = ev.target.closest('button, label.cor-outra');
      if (!b) return;
      Som.liberar();
      if (b.hasAttribute('data-ferr')) { escolherFerramenta(b.getAttribute('data-ferr')); Som.tocar('toque'); }
      else if (b.hasAttribute('data-tam')) { escolherTamanho(+b.getAttribute('data-tam')); Som.tocar('toque'); }
      else if (b.hasAttribute('data-cor')) { escolherCor(b.getAttribute('data-cor')); Som.tocar('toque'); }
      else if (b.id === 'ed-galeria') { Som.tocar('voltar'); mostrarVista('galeria'); estado.desenho = null; estado.pronto = false; }
      else if (b.id === 'ed-desfazer') { desfazer(); }
      else if (b.id === 'ed-refazer') { refazer(); }
      else if (b.id === 'ed-limpar') { limpar(); }
      else if (b.id === 'ed-salvar') { salvar(); }
    });
    $('ed-cor-livre').addEventListener('input', function (ev) { escolherCor(ev.target.value, true); });

    ligarPonteiro();
    escolherFerramenta(estado.ferramenta);
    escolherTamanho(estado.tam);
    escolherCor(estado.cor);
    atualizarBotoes();
  }

  function escolherFerramenta(f) {
    estado.ferramenta = f;
    [].forEach.call(document.querySelectorAll('.ferr'), function (b) { b.classList.toggle('sel', b.getAttribute('data-ferr') === f); b.setAttribute('aria-pressed', b.getAttribute('data-ferr') === f); });
    $('ed-tam').classList.toggle('apagado', f === 'balde');
    // o ponto dos botões de tamanho acompanha a ferramenta (lápis fino, pincel e borracha mais grossos)
    var esc = f === 'lapis' ? 0.55 : f === 'borracha' ? 1.15 : 1;
    [].forEach.call(document.querySelectorAll('.tamanho .ponto'), function (p, i) {
      var d = [10, 17, 25][i] * esc;
      p.style.width = p.style.height = Math.round(d) + 'px';
    });
  }
  function escolherTamanho(i) {
    estado.tam = i;
    [].forEach.call(document.querySelectorAll('.tamanho'), function (b) { b.classList.toggle('sel', +b.getAttribute('data-tam') === i); b.setAttribute('aria-pressed', +b.getAttribute('data-tam') === i); });
  }
  function escolherCor(c, livre) {
    estado.cor = c;
    [].forEach.call(document.querySelectorAll('.cor[data-cor]'), function (b) { b.classList.toggle('sel', !livre && b.getAttribute('data-cor') === c); });
    var outra = document.querySelector('.cor-outra');
    outra.classList.toggle('sel', !!livre);
    if (estado.ferramenta === 'borracha') escolherFerramenta('pincel'); // escolher cor sai da borracha
  }

  // ---------- editor: abrir desenho ----------
  function abrirDesenho(id) {
    var d = Desenhos.porId(id);
    estado.desenho = d;
    estado.pronto = false;
    mostrarVista('editor');
    ctxTinta.clearRect(0, 0, N, N);
    ctxContorno.clearRect(0, 0, N, N);
    hist = []; posHist = 0;
    atualizarBotoes();

    var img = new Image();
    img.onload = function () {
      if (estado.desenho !== d) return;
      var tmp = document.createElement('canvas');
      tmp.width = tmp.height = N;
      var c = tmp.getContext('2d', { willReadFrequently: true });
      c.fillStyle = '#fff';
      c.fillRect(0, 0, N, N);
      c.drawImage(img, 0, 0, N, N);
      var dados = c.getImageData(0, 0, N, N);
      var px = dados.data;
      for (var i = 0, j = 0; i < px.length; i += 4, j++) {
        var a = 255 - px[i];                     // traço preto => opaco; branco => transparente
        barreira[j] = a >= 230 ? 1 : 0;
        px[i] = COR_TRACO[0]; px[i + 1] = COR_TRACO[1]; px[i + 2] = COR_TRACO[2]; px[i + 3] = a;
      }
      ctxContorno.putImageData(dados, 0, 0);
      estado.pronto = true;
    };
    img.src = dataUrl(Desenhos.svgTexto(d, '#000'));
  }

  // ---------- histórico (guarda só o retângulo que mudou) ----------
  function iniciarAcao() {
    ctxScratch.clearRect(0, 0, N, N);
    ctxScratch.drawImage(el.tinta, 0, 0);
    bbox = null;
  }
  function marcar(x0, y0, x1, y1) {
    if (!bbox) bbox = [x0, y0, x1, y1];
    else { bbox[0] = Math.min(bbox[0], x0); bbox[1] = Math.min(bbox[1], y0); bbox[2] = Math.max(bbox[2], x1); bbox[3] = Math.max(bbox[3], y1); }
  }
  function fimAcao() {
    if (!bbox) return;
    var x = Math.max(0, Math.floor(bbox[0])), y = Math.max(0, Math.floor(bbox[1]));
    var w = Math.min(N, Math.ceil(bbox[2])) - x, h = Math.min(N, Math.ceil(bbox[3])) - y;
    bbox = null;
    if (w <= 0 || h <= 0) return;
    hist.length = posHist;
    hist.push({ x: x, y: y, antes: ctxScratch.getImageData(x, y, w, h), depois: ctxTinta.getImageData(x, y, w, h) });
    if (hist.length > MAX_DESFAZER) hist.shift();
    posHist = hist.length;
    atualizarBotoes();
  }
  function desfazer() {
    if (posHist <= 0) return;
    var a = hist[--posHist];
    ctxTinta.putImageData(a.antes, a.x, a.y);
    Som.tocar('voltar');
    atualizarBotoes();
  }
  function refazer() {
    if (posHist >= hist.length) return;
    var a = hist[posHist++];
    ctxTinta.putImageData(a.depois, a.x, a.y);
    Som.tocar('abrir');
    atualizarBotoes();
  }
  function atualizarBotoes() {
    var d = $('ed-desfazer'), r = $('ed-refazer');
    if (d) d.disabled = posHist <= 0;
    if (r) r.disabled = posHist >= hist.length;
  }
  function limpar() {
    if (!estado.pronto) return;
    iniciarAcao();
    ctxTinta.clearRect(0, 0, N, N);
    marcar(0, 0, N, N);
    fimAcao();
    Som.tocar('toque');
  }

  // ---------- desenhar ----------
  function posicao(ev) {
    var r = el.pagina.getBoundingClientRect();
    return { x: (ev.clientX - r.left) / r.width * N, y: (ev.clientY - r.top) / r.height * N };
  }
  function espessura() { return TAMANHOS[estado.ferramenta][estado.tam]; }
  function configurarTraco() {
    ctxTinta.lineCap = ctxTinta.lineJoin = 'round';
    ctxTinta.lineWidth = espessura();
    ctxTinta.strokeStyle = ctxTinta.fillStyle = estado.cor;
    ctxTinta.globalCompositeOperation = estado.ferramenta === 'borracha' ? 'destination-out' : 'source-over';
  }
  function ponto(p) {
    configurarTraco();
    var r = espessura() / 2;
    ctxTinta.beginPath();
    ctxTinta.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctxTinta.fill();
    marcar(p.x - r - 2, p.y - r - 2, p.x + r + 2, p.y + r + 2);
  }
  function segmento(a, b) {
    configurarTraco();
    var r = espessura() / 2;
    ctxTinta.beginPath();
    ctxTinta.moveTo(a.x, a.y);
    ctxTinta.lineTo(b.x, b.y);
    ctxTinta.stroke();
    marcar(Math.min(a.x, b.x) - r - 2, Math.min(a.y, b.y) - r - 2, Math.max(a.x, b.x) + r + 2, Math.max(a.y, b.y) + r + 2);
  }

  function ligarPonteiro() {
    var pg = el.pagina;
    pg.addEventListener('pointerdown', function (ev) {
      if (!estado.pronto || ativo !== null) return;
      ev.preventDefault();
      Som.liberar();
      try { pg.setPointerCapture(ev.pointerId); } catch (e) { /* ignora */ }
      ativo = ev.pointerId;
      var p = posicao(ev);
      iniciarAcao();
      if (estado.ferramenta === 'balde') {
        preencher(p);
        fimAcao();
        ativo = null;
        return;
      }
      ponto(p);
      ultimo = p;
    });
    pg.addEventListener('pointermove', function (ev) {
      if (ev.pointerId !== ativo || estado.ferramenta === 'balde') return;
      var lista = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [];
      if (!lista.length) lista = [ev];
      lista.forEach(function (e) { var p = posicao(e); segmento(ultimo, p); ultimo = p; });
    });
    function fim(ev) {
      if (ev.pointerId !== ativo) return;
      ativo = null; ultimo = null;
      ctxTinta.globalCompositeOperation = 'source-over';
      fimAcao();
    }
    pg.addEventListener('pointerup', fim);
    pg.addEventListener('pointercancel', fim);
  }

  // ---------- balde de tinta ----------
  function preencher(p) {
    var x0 = Math.max(0, Math.min(N - 1, Math.round(p.x))), y0 = Math.max(0, Math.min(N - 1, Math.round(p.y)));
    if (barreira[y0 * N + x0]) {
      // caiu em cima da linha: procura o pontinho livre mais perto (dedinho grande)
      var achou = false;
      for (var raio = 1; raio <= 14 && !achou; raio++) {
        for (var dy = -raio; dy <= raio && !achou; dy++) {
          for (var dx = -raio; dx <= raio; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== raio) continue;
            var xx = x0 + dx, yy = y0 + dy;
            if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
            if (!barreira[yy * N + xx]) { x0 = xx; y0 = yy; achou = true; break; }
          }
        }
      }
      if (!achou) return;
    }
    marca.fill(0);
    var pilha = [x0, y0];
    var minX = x0, maxX = x0, minY = y0, maxY = y0;
    while (pilha.length) {
      var y = pilha.pop(), x = pilha.pop();
      var base = y * N;
      if (marca[base + x] || barreira[base + x]) continue;
      var xl = x, xr = x;
      while (xl > 0 && !barreira[base + xl - 1] && !marca[base + xl - 1]) xl--;
      while (xr < N - 1 && !barreira[base + xr + 1] && !marca[base + xr + 1]) xr++;
      for (var i = xl; i <= xr; i++) marca[base + i] = 1;
      if (xl < minX) minX = xl;
      if (xr > maxX) maxX = xr;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (var d = -1; d <= 1; d += 2) {
        var yy2 = y + d;
        if (yy2 < 0 || yy2 >= N) continue;
        var b2 = yy2 * N, dentro = false;
        for (var k = xl; k <= xr; k++) {
          if (!barreira[b2 + k] && !marca[b2 + k]) {
            if (!dentro) { pilha.push(k, yy2); dentro = true; }
          } else dentro = false;
        }
      }
    }
    var w = maxX - minX + 1, h = maxY - minY + 1;
    var img = ctxTinta.getImageData(minX, minY, w, h), px = img.data;
    var rgb = hexParaRgb(estado.cor);
    for (var yy3 = 0; yy3 < h; yy3++) {
      var linha = (minY + yy3) * N + minX;
      for (var xx3 = 0; xx3 < w; xx3++) {
        if (marca[linha + xx3]) {
          var o = (yy3 * w + xx3) * 4;
          px[o] = rgb[0]; px[o + 1] = rgb[1]; px[o + 2] = rgb[2]; px[o + 3] = 255;
        }
      }
    }
    ctxTinta.putImageData(img, minX, minY);
    marcar(minX, minY, maxX + 1, maxY + 1);
    Som.tocar('ponto');
  }

  // ---------- salvar ----------
  function aviso(texto) {
    var a = $('ed-aviso');
    a.textContent = texto;
    a.hidden = false;
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { a.hidden = true; }, 2600);
  }
  function salvar() {
    if (!estado.pronto) return;
    var c = document.createElement('canvas');
    c.width = c.height = N;
    var x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, N, N);
    x.drawImage(el.tinta, 0, 0);
    x.drawImage(el.contorno, 0, 0);
    c.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'desenho-' + estado.desenho.id + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      Som.tocar('ponto');
      aviso('Desenho salvo! Procure em Downloads.');
    }, 'image/png');
  }

  // ---------- ciclo de vida ----------
  var construido = false;
  window.Jogos = window.Jogos || {};
  window.Jogos.colorir = {
    entrar: function () {
      if (!construido) {
        construido = true;
        construirGaleria();
        construirEditor();
        var cat = ler('categoria');
        mostrarCategoria(Desenhos.categorias.some(function (c) { return c.id === cat; }) ? cat : 'dinos');
        mostrarVista('galeria');
      }
    },
    sair: function () { ativo = null; },
    // para os testes
    _estado: estado
  };
})();
