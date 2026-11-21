# Abt Sonora

Marca de produção musical e sonora da Abt Tecnologia. Identidade Sulco escolhida em 17/11/2026; site em preparação local.

## Executar

Node.js 20 ou superior. Sem dependências JavaScript externas.

```sh
npm run dev
npm run check
npm run build
```

Site: http://127.0.0.1:4322/ · Identidade: http://127.0.0.1:4322/identidade.html

O build gera `dist/`. `vercel.json` prepara uma futura publicação estática na Vercel. Nenhum projeto de hospedagem foi registrado e nenhum domínio foi configurado. O site está com `noindex, nofollow` para esta etapa de apresentação; veja a seção SEO e indexação para liberar no lançamento.

## Conteúdo

- `index.html`: apresentação, serviços, estúdio, processo e contato.
- `assets/fonts`: Fraunces (títulos) e Instrument Sans (texto), ambas OFL, em woff2.
- `identidade.html`: prancha de assinatura, símbolo, cores, tipografia e orientações iniciais.
- `assets/abt-sonora-*.svg`: seis logos e símbolos em curvas, em três cores.
- `assets/fonts/`: fontes locais com licenças SIL OFL.
- `assets/audio/faixas.js`: lista das faixas que aparecem na seção Ouça (veja abaixo).
- `assets/img/`: seis imagens conceituais geradas com ImageGen, em WebP de 720 e 1440 px. Substituem as ilustrações anteriores, cujos SVGs foram preservados.
- `docs/ilustracoes-complementares.json`: prompts das três ilustrações de papel recortado (pandeiro, fones e cassete), em WebP com transparência de 400 e 720 px.
- `docs/imagens-geradas.json`: prompts completos, direção visual e origem dos novos arquivos. O script `make-illustrations.py` mantém apenas as ilustrações SVG antigas e não gera as imagens atuais.
- `docs/marca.md`: posicionamento, linguagem e decisões.
- `scripts/export-brand.py`: exporta os SVGs a partir dos masters Sulco em curvas; usa apenas a biblioteca padrão do Python. Executar `python3 scripts/export-brand.py`.

O contato usa o endereço institucional já existente, `contato@abt.dev.br`, com assunto da Abt Sonora. A página não tem formulário, rastreadores ou áudio automático. O interlúdio tem três pads de bateria sintetizados com Web Audio (bumbo, caixa e chimbal); cada clique ou ativação por teclado produz um som curto. Não foram inventados clientes, depoimentos, faixas ou resultados de projetos. O portfólio de áudio entra pela seção Ouça, quando houver faixas selecionadas pelo responsável.

## Adicionar faixas na seção Ouça

Cada faixa ganha uma capa gerada com as formas da marca, na cor do tipo (Jingle, Trilha ou Ambiente). Para usar uma capa própria, acrescente o campo `capa` com um caminho de imagem quadrada. Os atalhos do player são Espaço (toca e pausa) e as setas esquerda e direita (5 segundos).

1. Coloque os arquivos em `assets/audio/`. Use MP3 (128 a 192 kbps) ou M4A; arquivos de até alguns MB carregam rápido. Evite WAV.
2. Abra `assets/audio/faixas.js` e acrescente um bloco por faixa. O arquivo traz a explicação dos campos e um exemplo.
3. Rode `npm run dev`, abra a página e toque as faixas para conferir. Depois `npm run build`.

Enquanto a lista estiver vazia, o player mostra os seis esboços de exemplo (veja a seção de exemplos sonoros abaixo) com um aviso de que são esboços. Para ver o player em estado de espera, com o aviso e o link de contato, mude `window.FAIXAS_EXEMPLOS` para `false` em `assets/audio/faixas.js`. Nada toca sozinho: o áudio só começa quando a pessoa clica. A forma de onda é calculada no navegador a partir do próprio arquivo. Publique apenas faixas com autorização de divulgação.

## Exemplos sonoros nos serviços

Cada serviço (Jingles, Trilhas e Ambientes) tem uma área "Ouça como soa" com dois exemplos.

- **Sem trabalhos publicados:** a página toca esboços curtos sintetizados no próprio navegador (Web Audio), só para mostrar o estilo de cada serviço, e avisa que não são trabalhos de clientes. Os esboços estão em `site.js`, no objeto `SKETCHES`, e os títulos e descrições em `EXEMPLOS`.
- **Com trabalhos publicados:** se `assets/audio/faixas.js` tiver faixas com `categoria` igual a `Jingle`, `Trilha` ou `Ambiente`, as duas primeiras de cada categoria aparecem no lugar dos esboços, com o título e a descrição que você escreveu, e o aviso some. Categorias sem faixas continuam com os esboços.
- **No player da seção Ouça:** os mesmos seis esboços aparecem como faixas (com os filtros Jingle, Trilha e Ambiente, forma de onda e barra de posição), marcadas como "esboço". Eles são gerados no navegador na primeira vez que a faixa é tocada. Quando você publicar a primeira faixa real, todos os esboços saem do player.
- Só um áudio toca por vez. Começar um exemplo pausa o player da seção Ouça, e o contrário também. Nada toca sozinho.

## SEO e indexação

O endereço definido para o site é `https://sonora.abt.dev.br`. Ele continua com `noindex, nofollow` e `robots.txt` com `Disallow: /` até a publicação. O build decide isso por duas variáveis de ambiente (na Vercel, em Settings > Environment Variables):

| Variável | Efeito |
| --- | --- |
| `SITE_URL` | Endereço final, sem barra no fim. O padrão do build é `https://sonora.abt.dev.br`, então `canonical`, Open Graph, Twitter e JSON-LD já saem preenchidos. Com `SITE_URL=` vazia, essas tags saem do HTML. |
| `INDEXAR=1` | Troca o robots para `index, follow`, gera `sitemap.xml` e `robots.txt` liberado. Exige `SITE_URL`. |

Para testar a versão indexável localmente: `INDEXAR=1 npm run build` e conferir `dist/index.html`, `dist/robots.txt` e `dist/sitemap.xml`.

O que já está pronto: título e descrição próprios, `canonical`, Open Graph, Twitter Card, JSON-LD (Organization, WebSite e três Service, só com informações que já estão na página), `lang="pt-BR"`, um único `h1`, `alt` descritivo nas imagens de conteúdo, fontes com preload, cabeçalhos de cache em `vercel.json` e página `404.html`.

A imagem de compartilhamento `assets/og-abt-sonora.png` (1200 por 630) e o `assets/apple-touch-icon.png` (180 por 180) são gerados a partir de `scripts/og-template.html` e `scripts/icon-template.html` com o Chrome em modo headless:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --allow-file-access-from-files --force-device-scale-factor=1 --virtual-time-budget=4000 --screenshot="$PWD/assets/og-abt-sonora.png" --window-size=1200,630 "file://$PWD/scripts/og-template.html"
```

Depois da publicação: cadastrar o domínio no Google Search Console e no Bing Webmaster Tools, enviar `sitemap.xml` e conferir o resultado com o teste de resultados avançados do Google. `identidade.html` e `logos.html` são páginas internas, com `noindex`, e podem ser removidas do build antes do lançamento.

## Antes de publicar

Pesquisar disponibilidade do nome; apontar `sonora.abt.dev.br` para a hospedagem (registro CNAME no DNS de `abt.dev.br`, conforme a Vercel indicar); conferir serviços e contato; selecionar áudios autorizados para divulgação; preparar os termos de contratação e uso; revisar SEO e indexação. Não prometer exclusividade, cessão irrestrita ou direitos de utilização sem verificar a cadeia de direitos de cada peça.

## Sound design e comparação antes/depois

O quarto serviço apresenta efeitos, impactos, transições e texturas sonoras. A seção `#antes-depois` permite alternar entre duas versões sem reiniciar o trecho, com pausa, retomada e uma posição compartilhada. A troca usa duas fontes no mesmo relógio Web Audio com transição suave de volume. Iniciar a comparação interrompe o player e os exemplos; iniciar outro áudio interrompe a comparação.

Sem gravações publicadas, há um estudo de interface de oito segundos, sintetizado no navegador e identificado como demonstração. As duas versões compartilham os mesmos sinais; a segunda acrescenta movimentos, impactos e ressonâncias. Os volumes médios da demonstração são aproximados para reduzir a influência de volume na comparação. Não é um trabalho de cliente nem demonstração de restauração ou mixagem de uma gravação real.

Para publicar um par real:

1. Coloque as versões autorizadas em `assets/audio/`, com o mesmo início e a mesma duração. Ajuste os volumes para uma comparação justa.
2. Em `assets/audio/comparacao.js`, preencha `antes` e `depois` com os caminhos dos arquivos. Personalize título, descrição, rótulos e os momentos que devem aparecer na cena; use `momentos: []` se não houver marcações.
3. Confira troca, pausa e avanço no navegador. Diferenças maiores que 0,15 segundo na duração dos arquivos são rejeitadas para evitar comparações desalinhadas.

Para ocultar o estudo sintetizado sem publicar arquivos, defina `demo: false`. O HTML mantém um aviso quando não há suporte ao áudio. A implementação fica em `sound-design.js`; nada toca automaticamente.
