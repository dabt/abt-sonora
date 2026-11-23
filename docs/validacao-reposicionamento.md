# Validação do reposicionamento — 23/11/2026

## Verificado

- `npm run check`: sintaxe de JavaScript e módulos Node.
- `npm test`: cinco testes de catálogo vazio, publicação e rascunhos, dados inseguros, modelo de obra e SEO.
- Build padrão e build com `INDEXAR=1`: concluídos. O resultado final em `dist/` voltou ao padrão sem indexação.
- Sitemap indexável: home, trabalhos e estúdio; 404 permanece sem indexação.
- 61 referências locais de páginas geradas: arquivos presentes. Um h1 por página, sem tokens de template pendentes, marca em minúsculas e sem dados estruturados de serviços.
- Navegador local: home, trabalhos e estúdio em desktop; home e estúdio a 390px; home e trabalhos a 320px. Sem rolagem horizontal na home e no catálogo a 320px após ajustes.
- Menu móvel: abrir, fechar e Escape, com atualização de aria-expanded e retorno do foco ao botão.
- Console do navegador: sem erros ou avisos durante a navegação inspecionada.
- Assets: imagem de compartilhamento 1200×630; ícone Apple 180×180; fontes locais e imagens carregadas na home.
- `git diff --check`: sem problemas de espaços.

## Limites

Não houve auditoria completa de WCAG, teste com leitor de tela, Lighthouse ou medição de Core Web Vitals em produção. Reprodução de obras reais não foi testada porque o catálogo está vazio; o modelo de áudio e vídeo usa controles nativos, sem autoplay e com preload desativado. Filtros e geração de páginas com catálogo preenchido foram cobertos por testes de renderização, sem publicar exemplos fictícios. Legendas, transcrições e audiodescrição precisam ser avaliadas por obra.

Não houve publicação, commit ou push. Nenhum domínio, conta externa ou configuração de produção foi alterado.
