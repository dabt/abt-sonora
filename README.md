# abt sonora

Estúdio independente de música e experimentação audiovisual. Reposicionamento aprovado em 23/11/2026. O nome é sempre escrito em minúsculas.

## Desenvolvimento

Node.js 20+, sem dependências externas.

```sh
npm run dev
npm run check
npm test
npm run build
```

Prévia: http://127.0.0.1:4322/. O build estático sai em `dist/`; `vercel.json` mantém a configuração de hospedagem. Não houve publicação nesta etapa. O ambiente de produção e o domínio não foram verificados.

## Estrutura

- `index.html`: abertura, seleção de obras, campos de exploração e apresentação editorial.
- `trabalhos/index.html`: catálogo com estado vazio e filtros quando houver mais de uma categoria publicada.
- `estudio/index.html`: visão, processo e contato institucional.
- `scripts/project-template.html`: modelo para páginas individuais, geradas em `/projetos/<slug>/`.
- `scripts/catalogue.mjs`: valida dados, renderiza obras e prepara metadados. Compartilhado entre desenvolvimento e build.
- `assets/catalogo.json`: fonte local do catálogo, inicialmente vazia.
- `site.js`: menu responsivo, filtros e coordenação de mídias com controles nativos.
- `estudos.js`: estudo demonstrativo de 12 segundos, em três arranjos sincronizados, iniciado somente após clique.
- `assets/fonts/lora-variable.ttf`: fonte de leitura Lora, com licença SIL OFL em `assets/fonts/OFL-lora.txt`.
- `styles.css`: tokens e estilos da direção California, lado B.
- `identidade.html` e `logos.html`: referências internas, disponíveis localmente e excluídas do build público.

Nenhuma obra, equipe, parceria, canal ou lançamento foi inventado. As cenas de estúdio californiano dos anos 70 são imagens conceituais geradas para a identidade, não fotografias de instalações reais nem capas de obras. Prompts, ferramenta e origens estão em `docs/imagens-california-70s.json` e `docs/imagens-polaroids-70s.json`. Molduras de polaroid são feitas em CSS; texturas e ícones são SVGs locais.

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

`SITE_URL` define a origem (padrão `https://sonora.abt.dev.br`). `INDEXAR=1` libera indexação e gera sitemap com home, catálogo, estúdio e obras publicadas. Sem a variável, `noindex` e `Disallow: /` permanecem. `SITE_URL=` remove metadados que exigem domínio; não pode ser combinado com `INDEXAR=1`. A página 404 sempre permanece `noindex`.

A imagem Open Graph vem de `scripts/og-template.html`; o ícone Apple vem de `scripts/icon-template.html`. O JSON-LD apresenta o estúdio e o site, sem serviços comerciais. Não há backend, CMS, autenticação, rastreadores ou integração com plataformas pagas.

## Materiais anteriores

As imagens e scripts de demonstração antigos foram preservados como fontes locais. `sound-design.js` e os exemplos de `assets/audio/` não são carregados pelo novo site; os dois arquivos de configuração de demonstração não entram no build. Não são obras do catálogo.

## Caderno de escuta provisório

O responsável autorizou exemplos provisórios. O estudo de síntese na home não representa um lançamento e não altera `assets/catalogo.json`. Nada toca automaticamente. Na primeira reprodução, três buffers são renderizados localmente; a troca usa ganhos no mesmo relógio de áudio. Há pausa, retomada, busca por teclado e mensagem de erro com nova tentativa. Os volumes médios são aproximados para a comparação. Mídias e estudo se interrompem mutuamente; ocultar ou sair da página pausa o estudo.

Gravações finais precisam ser alinhadas, autorizadas e revisadas antes da integração. Não cadastrar o exemplo sintetizado como obra publicada.

Lora: https://github.com/google/fonts/tree/main/ofl/lora. Fonte e licença locais, sem chamadas ao Google Fonts durante a visita.

## Ícones, animações e opções de botão

O rodapé usa a assinatura Sulco em vermelho, em `assets/abt-sonora-horizontal-vermelha.svg`, e não exibe o e-mail. O contato permanece na página Estúdio.

`botoes.html` é uma prancha local com cinco opções funcionais: Capa de disco, Fita de papel, Soul pill, Carimbo e Ingresso. Não entra no build público. Capa de disco está em uso nos botões principais e no player.

Animações: entrada única de blocos ao rolar, chegada do selo, movimento das ilustrações no hover e elevação suave das polaroids. Sem JavaScript, o conteúdo permanece disponível; com `prefers-reduced-motion`, as animações ficam desativadas. Nenhuma biblioteca foi adicionada.

Tipografia dos títulos e da navegação atualizada com Shrikhand e Caprasimo, em arquivos locais e licenças SIL OFL em `assets/fonts/`. Referências oficiais em https://github.com/google/fonts/tree/main/ofl/shrikhand e https://github.com/google/fonts/tree/main/ofl/caprasimo. O header usa moldura e faixas de cor, com menu recolhível no celular.
