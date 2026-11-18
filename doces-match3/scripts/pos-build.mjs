// Depois do build: lista os arquivos de ../doces para o service worker dos Joguinhos guardar
// (assim o jogo funciona sem internet) e sobe a VERSAO do sw.js para os aparelhos atualizarem.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../../', import.meta.url));
const saida = join(raiz, 'doces');

function listar(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? listar(caminho) : [caminho];
  });
}

const arquivos = listar(saida)
  .map((c) => 'doces/' + relative(saida, c).split('\\').join('/'))
  .filter((a) => a !== 'doces/arquivos.js')
  .sort();
writeFileSync(
  join(saida, 'arquivos.js'),
  '/* Gerado por doces-match3/scripts/pos-build.mjs: não edite à mão. */\n' +
    'var DOCES_ARQUIVOS = ' + JSON.stringify(['doces/', ...arquivos], null, 1) + ';\n',
);

const sw = join(raiz, 'sw.js');
const texto = readFileSync(sw, 'utf8');
const m = texto.match(/joguinhos-v(\d+)/);
if (m) writeFileSync(sw, texto.replace(m[0], 'joguinhos-v' + (Number(m[1]) + 1)));
console.log(`doces/arquivos.js: ${arquivos.length + 1} arquivos; sw.js: ${m ? 'joguinhos-v' + (Number(m[1]) + 1) : 'sem versão'}`);
