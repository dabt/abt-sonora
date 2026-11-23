# Ícones, cor, movimento e botões

23/11/2026. Pedidos atendidos: assinatura da marca em vermelho no rodapé, remoção do e-mail somente nessa área, cinco ilustrações de época, mais cor, animações e cinco opções de botão.

- Cinco imagens geradas com image_gen; transparência conferida. Versões de 200 e 400px em WebP, com prompts e origens em `icones-retro-70s.json`.
- Página local `botoes.html` com Capa de disco, Fita de papel, Soul pill, Carimbo e Ingresso. A opção 1 está aplicada provisoriamente. Página fora do build público.
- Desktop: cinco links com altura mínima de 48px, todos apontando para o estudo. Clique no Carimbo abriu a seção de escuta sem reproduzir áudio automaticamente. Navegação por Tab conferida.
- Comparação de botões em 390px e home em 320px sem rolagem horizontal nos estados inspecionados. Revisão visual de cores, ilustrações, logo e revelação dos blocos em desktop.
- Animações com regras de movimento reduzido. Não foi alterada a preferência do sistema para testá-la; comportamento preparado em CSS e JS.
- npm run check, cinco testes existentes, build e git diff --check passaram.
- 84 referências locais verificadas no build; rodapé correto nas quatro páginas geradas; dez WebP com canal alpha transparente. Nenhum arquivo ausente.

Sem auditoria integral de WCAG ou performance. Sem publicação, commit ou push. Sem dependências novas.
