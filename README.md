# Abt Sonora

Estúdio criativo independente de música, paisagens sonoras e experimentação audiovisual. A identidade de 24/11/2026 aplica o painel Abt Sonora e a composição do Estúdio Sonoro ao Pôr do Sol.

## Desenvolvimento

Node.js 20+, sem dependências externas.

```sh
npm run dev
npm run check
npm test
npm run build
```

A prévia de desenvolvimento abre em http://127.0.0.1:4322/. O build estático sai em `dist/`. A configuração de hospedagem está em `vercel.json`.

## Estrutura

- `index.html`: abertura, navegação pelas coleções, player de escuta, laboratório de arranjo e seleção de projetos.
- `trabalhos/index.html`: catálogo com estado vazio e filtros quando houver mais de uma categoria publicada.
- `playlists/index.html`: Ambientes, Cinemáticas, Natureza e Foco, com controles compactos e prévias demonstrativas em `assets/audio/escutas/`.
- `estudio/index.html`: apresentação, processo e contato.
- `scripts/project-template.html`: modelo para páginas individuais, geradas em `/projetos/<slug>/`.
- `scripts/catalogue.mjs`: valida dados, renderiza obras e prepara metadados. Compartilhado entre desenvolvimento e build.
- `assets/catalogo.json`: fonte local do catálogo, inicialmente vazia.
- `site.js`: menu responsivo, navegação pelas coleções, filtros e coordenação da reprodução.
- `logo.js`: iluminação e ondulação do símbolo em WebGL, com a assinatura estática disponível quando o efeito está desativado.
- `estudos.js`: estudo demonstrativo de 12 segundos, em três arranjos sincronizados, iniciado somente após clique.
- `player.js` e `player.css`: controles das prévias, fila da vitrola, pausa compacta e espectro radial alimentado por Web Audio.
- `sonora.css`: paleta, tipografia, layout responsivo e transições.
- `assets/identidade/`: assinaturas extraídas do painel original, fotos WebP, ícones e imagem de compartilhamento.
- `identidade.html`: prancha local da identidade. `logos.html`, `botoes.html` e `styles.css` preservam os estudos anteriores fora do build público.

## Identidade e imagens

A paleta usa Midnight `#0B0B0E`, Sand `#F5EBD6`, Sunset `#FF7A00`, Coral `#E63966`, Violet `#7A3FF2` e Pacific `#00A7E1`. Archivo é a fonte dos títulos e Instrument Sans é a fonte de leitura e controles. São fontes locais, com licenças SIL OFL em `assets/fonts/`. O Contorno espectral destaca as ações principais. A combinação pode ser comparada com as demais opções na página local `/opcoes/`.

A iluminação da marca e os controles táteis aplicam as previsões de gradientes luminosos e interfaces expressivas do Canva. A fotografia com granulação analógica segue a direção editorial das previsões da Envato. A combinação de luz quente e sombras frias aproxima o contraste entre natureza e tecnologia descrito pela WGSN e Coloro. [Canva](https://www.canva.com/design-trends/) [Envato](https://elements.envato.com/learn/graphic-design-trends) [WGSN e Coloro](https://www.wgsn.com/en/wgsn/press/press-releases/wgsn-and-coloro-reveal-colour-year-2027-luminous-blue-and-s-s-27-key)

As cenas são imagens conceituais geradas com ImageGen integrado. A fotografia da abertura, suas duas resoluções e as seis imagens editoriais estão em `assets/identidade/`. Os três pedidos de geração foram:

- Abertura panorâmica do estúdio com sombra à esquerda e, à direita, janela para o pôr do sol na costa californiana, com palmeiras, toca-discos e fones em primeiro plano. Fotografia de cinema com grão sutil, sem texto ou interface.
- Prancha 2 × 2 com cabana sob chuva, palmeiras ao anoitecer, onda do Pacífico e vinil iluminado por luz laranja. Cada quadrante em 3:2, com contraste entre azul escuro e luz quente, sem texto ou bordas.
- Prancha com dois panoramas separados ao meio. Costa rochosa de Big Sur em luz dourada na metade superior e mesa de mixagem analógica com faders, medidores âmbar e sombras azuladas na metade inferior.

## Publicar uma obra

Adicione um objeto em `assets/catalogo.json`. Campos:

| Campo | Uso |
| --- | --- |
| `slug` | Identificador único, letras minúsculas, números e hífens |
| `estado` | `rascunho` ou `publicado` |
| `titulo`, `descricao` | Nome e apresentação reais da obra |
| `categoria` | `musica`, `audiovisual` ou `experimento` |
| `capa`, `capaAlt` | Imagem local em `/assets/` e descrição acessível |
| `ano` | Opcional, somente quando confirmado |
| `destaque` | Opcional; seleciona para a home. Na ausência, entram as duas primeiras publicadas |
| `audio`, `video` | Opcionais, arquivos locais em `/assets/` |
| `contexto` | Lista opcional de parágrafos |
| `creditos` | Lista opcional de objetos com `funcao` e `nome` |
| `links` | Lista opcional de objetos com `titulo` e `url` HTTPS |

A ordem da lista determina a ordem das obras. O catálogo só mostra projetos com `estado: publicado`; eles também ganham páginas estáticas próprias. Rascunhos não ganham páginas nem aparecem no JSON do build. **Arquivos dentro de `assets/` são públicos:** não coloque materiais confidenciais ou de rascunhos privados nessa pasta. Para publicações com vídeo, revise legendas, transcrição e audiodescrição conforme o conteúdo, antes de divulgar. Apenas publique materiais autorizados, com créditos e contexto do processo, incluindo ferramentas generativas quando aplicável.

Nenhuma mídia toca automaticamente. Áudio e vídeo usam `preload="none"`, e iniciar um pausa os demais. O build falha se uma obra publicada tiver arquivo ausente, campo obrigatório inválido ou URL insegura.

## SEO

`SITE_URL` define a origem canônica. Quando essa variável está ausente, o build usa o domínio de produção informado pela Vercel ou `https://sonora.abt.dev.br`. A Vercel libera a indexação nos builds de produção. Defina `INDEXAR=0` para manter uma publicação fora da busca. Em outros provedores, use `INDEXAR=1` com a origem de produção. `SITE_URL=` remove os metadados que exigem domínio.

Prévias e builds locais padrão usam `noindex` e omitem o sitemap. Seu `robots.txt` permite o acesso às páginas para que os buscadores leiam o `noindex`. A 404 sempre usa `noindex` e fica fora do sitemap.

O sitemap de produção lista as quatro páginas principais e as obras publicadas. Títulos e descrições de compartilhamento são derivados do HTML. Cada ficha de projeto usa a própria capa e a mesma trilha de navegação no HTML e no JSON-LD. A home identifica o site e o estúdio no JSON-LD.

Para validar uma versão indexável localmente, execute `SITE_URL=https://sonora.abt.dev.br INDEXAR=1 npm run build` e confira `dist/robots.txt` e `dist/sitemap.xml`. Depois que o domínio responder com a versão publicada, envie `sitemap.xml` no Google Search Console e confira a home na ferramenta de inspeção de URL.

## Reprodução e movimento

A sessão de escuta da home e a página de playlists apresentam quatro esboços demonstrativos de 24 segundos. O som de maré é uma recriação sintetizada. A home também apresenta um estudo de síntese de 12 segundos com três arranjos sincronizados em `/#laboratorio`. O conteúdo demonstrativo fica fora de `assets/catalogo.json`.

Cada prévia oferece AAC em cerca de 240 KiB e preserva o MP3 como alternativa. O áudio é carregado sob demanda. Na home, a pausa compacta aparece durante a reprodução quando o controle principal sai da tela.

A reprodução começa por ação do visitante. Iniciar outra mídia pausa a anterior. O espectro radial analisa a faixa durante a reprodução e pausa suas atualizações quando sai da área visível. O WebGL anima a onda da assinatura por intervalos breves, com a imagem original disponível durante a leitura e em navegadores sem WebGL. A preferência por movimento reduzido desativa esses efeitos e as transições decorativas.
