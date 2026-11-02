# Desenhos de imagem do Colorir

Esta pasta guarda os desenhos que vieram de imagens prontas (as subpastas de cada categoria e o arquivo `lista.js` são gerados pelo script, não mexa à mão). Eles aparecem **na frente** dos desenhos feitos em código em cada categoria. A aba **Bobbie Goods** só aparece quando tem pelo menos um desenho.

## Como acrescentar desenhos
1. Crie `desenhos-novos/<categoria>/` na pasta do projeto e coloque as imagens (PNG, JPG ou WEBP, preto no branco). Categorias: `dinos`, `gatinhos`, `cachorrinhos`, `herois`, `unicornios`, `bichinhos`, `natureza`, `bobbie`.
2. Rode: `.\.venv\Scripts\python.exe tools\importar_desenhos.py`
3. Abra o jogo, confira, rode `tests\test_imagens.py`, commite e faça o `git push`.

Opções: `--aparar 0.06,0,0,0` corta uma fração do topo, da base, da esquerda e da direita antes de tudo (serve para tirar marca d'água ou texto); `--engrossar` engrossa o traço em 1 pixel (fecha furinhos).

## O que dá bom resultado
- Traço **fino a médio, contínuo e fechado** (sem pontilhado nem falhas), fundo **branco liso**, sem sombra nem cinza.
- **Um assunto grande** por imagem, com cenário simples. Várias figuras numa folha só funcionam, mas cada uma fica pequena para o dedinho.
- Imagem com pelo menos uns 1000 px no lado maior. Quanto mais fechadas as regiões, melhor o balde de tinta funciona; se vazar, use `--engrossar`.
- Só use imagens que você tem direito de usar. O repositório do GitHub Pages é **público**: o que entra aqui fica visível para qualquer pessoa.

## Modelo de pedido para gerar as imagens (qualquer gerador de imagens)
> Página de livro de colorir infantil, preto e branco, traço limpo e contínuo de espessura média, sem sombreamento e sem tons de cinza, fundo branco liso, estilo fofo e arredondado, olhos grandes e brilhantes, cenário simples ao redor, sem texto, sem marca d'água, quadrado. Assunto: **[ASSUNTO]**.

Troque `[ASSUNTO]` por ideias como as abaixo e peça várias variações de cada.

| Categoria | Ideias de assunto |
|---|---|
| dinos | filhote de brontossauro sorrindo no campo; tricerátops com flores; estegossauro dormindo; trex bebê saindo do ovo; dino de óculos de sol na praia; dino com balões; dino pescando; dino andando de bicicleta |
| gatinhos | gatinho sentado com flores; gatinho brincando com novelo de lã; gatinhos dormindo juntos; gatinho de chapéu de aniversário; gatinho olhando peixinhos; gatinho na janela com lua |
| cachorrinhos | filhote sentado de língua de fora; cachorro com osso; cachorrinho com bola; cachorro na casinha; cachorro de capa de chuva; dois filhotes brincando |
| herois | menino herói com capa e máscara; menina heroína voando; herói cachorro com capa; herói gato; heróis em time; herói salvando um balão |
| unicornios | unicórnio com asas e borboletas; potrinho unicórnio na nuvem; unicórnio com arco-íris; unicórnio com coroa de flores; unicórnio no castelo; unicórnio dormindo na lua |
| bichinhos | leão, hipopótamo, macaco e girafa; coelhinho com cenoura; ursinho com mel; coruja nos galhos; tartaruga na lagoa; elefante com balão; panda comendo bambu; pinguim com cachecol |
| natureza | sol sorrindo, nuvens e estrada; árvore grande com pássaros; jardim de flores com borboletas; cogumelos na floresta; cachoeira com arco-íris; barquinho no lago; vaso de girassóis |
| bobbie | ursinho na praia com sorvete e guarda-sol; coelhinha fazendo piquenique; gatinha lendo livro entre almofadas; cachorrinho de pijama na cama; festa de aniversário de bichinhos; bichinhos jardinando; biblioteca fofa com bichinhos |
