# abt sonora — base da marca

Direção aprovada em 23/11/2026. Este documento substitui o posicionamento comercial anterior. Histórico de alterações preservado no Git.

## Nome e posicionamento

**abt sonora**, sempre em minúsculas, inclusive nos títulos, descrições e créditos. Estúdio independente de música e experimentação audiovisual. Independência refere-se à direção artística; a associação à ABT Tecnologia permanece discreta.

Criamos composições, paisagens sonoras e trabalhos que exploram a relação entre som e imagem. O site apresenta pesquisa e obras autorais. Serviços, orçamentos, pacotes, briefing comercial e FAQ de contratação deixam de ser a proposta pública.

Assinatura: **Sound beyond boundaries.** O texto principal permanece em português brasileiro, com expressões curtas em inglês quando contribuírem para a marca.

## Campos

- Música: composições, faixas e identidades musicais.
- Audiovisual: som e imagem pensados em conjunto.
- Experimentos: estudos de textura, interação e movimento.

Rimehollow e Amberline são referências de projetos possíveis, não lançamentos confirmados. Não são exibidos no catálogo sem obras reais.

## Direção visual: California, lado B

Revisada a pedido do responsável em 23/11/2026. A direção escura e contida foi substituída pela atmosfera colorida de um estúdio californiano dos anos 70. Trata-se de uma referência estética, sem alegar sede na Califórnia ou fundação nos anos 70.

Paleta fornecida como referência: Iron Core #222A2A, Industrial Aqua #4FBBBC, Rust Signal #EC4624, Heat Marker #F39120 e Architectural Cream #E2DAC2. Creme ocupa o fundo principal; aqua, vermelho e âmbar têm áreas próprias. O título sobre creme usa vermelho escuro #A12D1B por contraste. Texto pequeno sobre vermelho usa #101716.

Logo Sulco preservado, nome sempre minúsculo. Shrikhand nas chamadas principais, Caprasimo nos títulos de seção e na navegação, Lora nos textos e Instrument Sans nos controles. Header alinhado, abertura como pôster, fotografias em polaroids, grafismos de fitas e capas, textura fina de papel, campos criativos coloridos. Sem ondas metálicas abstratas.

Duas imagens editoriais geradas com a ferramenta integrada image_gen representam cenas imaginadas: sala de criação com palmeiras, luz dourada e equipamento analógico; gravador de fita e objetos de processo ao sol. Não documentam instalações reais ou obras publicadas. Arquivos WebP responsivos em `assets/img/california-*`; prompts e origens em `docs/imagens-california-70s.json`.

## Conteúdo e arquitetura

Início, Trabalhos e Estúdio. Páginas de projeto são geradas a partir de `assets/catalogo.json`. Sem obras publicadas, apresentar estado vazio honesto; não criar lançamentos fictícios, contagens, canais ou botões sem destino. Sem Featured Work e Latest Works duplicados.

Sem reprodução automática. Mídias só carregam após interação. Movimento reduzido, foco visível, links claros e navegação por teclado são requisitos da interface. Acessibilidade das obras deve ser avaliada a cada publicação.

A bancada interna de produção é um projeto separado; não faz parte deste redesign. Nenhum backend, banco de dados, autenticação ou CMS foi adicionado.

## Texturas, fotografias e polaroids

Refinamento solicitado em 23/11/2026. A paleta é preservada. Fotografias ganham bordas claras, rodapé maior, sombras suaves, fita translúcida e pequenas rotações, como polaroids sobre uma mesa. A abertura combina duas fotos; o caderno editorial apresenta um piano ao sol, e a página Estúdio recebe uma pequena sequência de imagens. Todas são cenas conceituais.

Texturas locais distintas: papel com fibras nas molduras e áreas do catálogo; retícula em áreas editoriais e rodapé; trama de tecido nos campos criativos e bloco aqua. Granulação geral discreta. Arquivos SVG pequenos, repetíveis, sem dependências ou requisições externas.

Ícones próprios em SVG: nota musical, câmera de filme, rolo de fita, estrela e sol. Usados como ilustrações decorativas, sem fingir controles clicáveis. Header permanece alinhado e o catálogo continua vazio. As novas imagens, prompts e destinos estão em `docs/imagens-polaroids-70s.json`.

## Tipografia de leitura e caderno de escuta

Refinamento de 23/11/2026: Lora passa a compor os textos de leitura; Instrument Sans permanece nos controles e na navegação. Arquivo local obtido do repositório oficial Google Fonts, com licença SIL OFL. Fraunces permanece nos títulos.

O responsável autorizou estudos provisórios. A home apresenta um motivo musical de 12 segundos nos arranjos Essência, Pulso e Horizonte. Eles compartilham melodia, duração e posição. O exemplo é identificado como demonstração e não entra no catálogo de obras.

Os textos explicam decisões de composição, arranjo, timbre, silêncio e edição. A página Estúdio utiliza a formação em produção musical e o trabalho com Ableton Live informados pelo responsável, sem inventar equipe, equipamentos próprios, prêmios ou histórico.

## Mais cor e ilustrações de época

Refinamento solicitado em 23/11/2026: logo Sulco vermelha no rodapé, sem e-mail nessa área. Blocos aqua e âmbar ampliados na abertura, na escuta, no catálogo e no rodapé, preservando o contraste do texto.

Cinco ilustrações geradas substituem os ícones de traço: nota musical, câmera, rolo de fita, sol e estrela, com recorte e textura de impressão dos anos 70. As imagens são decorativas e mantêm a transparência. Os ícones vetoriais anteriores permanecem arquivados.

Cinco opções de botão estão em `botoes.html`, uma prancha local. A opção Capa de disco foi aplicada provisoriamente; não se presume uma escolha definitiva. Animações discretas respeitam movimento reduzido e não reproduzem áudio automaticamente.

## Rodapé e botão mantido

Após retorno positivo, o botão Capa de disco permanece em uso. O rodapé foi revisto: assinatura Sulco pequena em vermelho, papel claro, frase “A escuta continua”, navegação essencial e ABT Tecnologia integrada ao crédito de copyright. Sai a frase “Parte do universo ABT”. O e-mail continua fora do rodapé.

A pedido do responsável, foi removida do caderno a frase “As fotografias são cenas imaginadas para a identidade visual do estúdio”. A origem e os prompts dos assets continuam documentados nos arquivos internos.


### Tipografia e header com referências dos anos 70

Shrikhand nas chamadas principais e no fechamento, Caprasimo nos títulos de seção e na navegação. As duas fontes usam arquivos locais e licenças SIL OFL preservadas em assets/fonts. Lora mantém a leitura e Fraunces permanece nas legendas das polaroids. A assinatura Sulco continua em curvas.

O header mantém os elementos alinhados, com moldura, sombra de impressão, faixas vermelha, laranja e aqua e navegação arredondada. A descrição central aparece nas telas largas; no celular, o menu recolhível preserva o espaço da marca.

Fontes oficiais consultadas
- https://github.com/google/fonts/tree/main/ofl/shrikhand
- https://github.com/google/fonts/tree/main/ofl/caprasimo


### K7 do caderno de escuta

Fotografia conceitual gerada com image_gen e fundo transparente, em duas resoluções WebP. Etiqueta abt sonora e faixas nas cores do site. Os miolos dos carretéis são recortes circulares da própria fotografia em CSS. A rotação só ocorre durante a reprodução, pausa preserva o ângulo e movimento reduzido desativa a animação. Prompt, origem e arquivos em docs/imagem-k7.json.
