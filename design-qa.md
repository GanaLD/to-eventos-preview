# TO Eventos — seção Connect e visualizadores

Data: 2026-10-31.

## Referência e estado

- Fonte visual: `C:/Users/gabri/AppData/Local/Temp/codex-clipboard-95375dac-cad2-4917-984a-a02576c7f198.png` (1705 × 1022 px).
- As marcações do usuário pedem dois grupos superiores alinhados, tipografia menor e vídeo maior abaixo. As bordas coloridas são anotações e não elementos a reproduzir na página.
- A referência foi normalizada retirando 157 px de navegador: conteúdo de 1705 × 865 px, com 2 px de preenchimento inferior na prancha de comparação. A implementação usa viewport CSS de 1705 × 867, densidade 1. Essa diferença de 2 px não foi tratada como desvio do produto.
- Implementação: `qa-artifacts/connect-layout-1705.png`; também 1440 × 900 e 390 × 844 (`connect-layout-1440.png`, `connect-layout-390.png`).
- Estado comparado: primeiro painel dos projetos, após as animações de entrada. Os quadros do vídeo diferem porque o mesmo take está em reprodução; a comparação avalia o enquadramento, proporção e geometria do player.
- Comparação de tela completa, vista no mesmo input: `qa-artifacts/connect-design-comparison.png`.
- Comparação focada do cabeçalho, vista no mesmo input: `qa-artifacts/connect-header-comparison.png`.

## Histórico de revisão

1. [P1] Título excessivo e cabeçalho sem as mesmas bordas do vídeo. Correção: largura compartilhada para a seção; duas colunas iguais com início superior alinhado; título de até 54 px; descrição reduzida. No viewport de referência, cabeçalho e vídeo começam em x=329,7 e medem 1043,5 px de largura. As duas colunas começam em y=72,7. O player ficou aproximadamente 22% mais largo que os 855 px mostrados na captura do usuário.
2. [P2] Vídeo perto do indicador inferior. Correção: reservar altura para textos e controles da seção. O vídeo termina em y=798,6 no viewport de 867 px; termina em y=831,2 no viewport de 900 px. Não há overflow horizontal.
3. [P0] Expansão dependente da conclusão da API nativa. Correção: diálogo na camada superior abre imediatamente, fora dos ancestrais transformados do GSAP. Tela cheia nativa é solicitada no conteúdo do diálogo quando permitida. Recusa e promessa pendente mantêm a expansão utilizável. Botão e Esc fecham em todos esses cenários.
4. [P0] Revisão visual intermediária encontrou barra do PDF fora da altura visível e página cortada. Correção: linha do diálogo com mínimo zero, canvas com `object-fit: contain` e barra reservada. Evidência final: `qa-artifacts/pdf-expanded-denied-1705.png` e `qa-artifacts/pdf-expanded-allowed-390.png`. Botão de fechar ocupa y=801–843 no desktop de 867 px e y=728–770 no celular de 844 px.
5. [P2] Verificação em notebook de 1280 × 600 encontrou altura mínima do painel maior que a janela. Correção restrita ao primeiro projeto: conteúdo usa a altura real da janela e título menor nesse breakpoint. Vídeo termina em y=546,1, sem cortar a mídia ou esconder controles. Evidência: `qa-artifacts/connect-layout-1280.png`.
6. [P0] No Chrome do perfil do usuário, a solicitação nativa de tela cheia da versão publicada voltou ao estado normal. O novo visualizador mantém o diálogo aberto se a tela cheia nativa termina com perda de foco. Regressão reproduz essa condição em vídeo e PDF nos quatro tamanhos: ambos continuam visíveis e fecham pelo botão. A causa específica da saída nativa no perfil não foi isolada.

## Superfícies de fidelidade

- **Tipografia:** fontes existentes Romana, Bebas Neue e Inter preservadas. Títulos reduzidos de propósito, conforme a anotação. Cabeçalhos sem cortes ou colisão. No celular, grupos empilhados e largura de 350 px.
- **Espaçamento e layout:** título, descrição e vídeo pertencem ao mesmo eixo. Vídeo 16:9 integral, sem recorte. Respiro abaixo do player; controles de expansão dentro da janela. Comparações completa e focada inspecionadas.
- **Cores e tokens:** off-white, grafite e laranja originais preservados. Nenhum cartão, borda ornamental, mosaico ou ilustração novo foi adicionado. Fechar tem contraste claro sobre fundo escuro.
- **Imagens e mídias:** mesmo take Connect e PDF oficial. Conteúdo integral com `contain`, incluindo PDF expandido. Nenhuma mídia ou controle do Hero foi alterado. Florais móveis e carregamento por seção mantidos.
- **Conteúdo:** descrição reduzida a “Conteúdo, negócios e experiências de marca. Planejamento e produção por Thais Ortiz.” Nome do projeto e 300 participantes preservados.

## Verificação funcional

- `tests/interaction-regressions.mjs`: passou em desktop e celular emulado; API nativa e modo sem API; botão e Esc; vídeo retoma o ponto; PDF conserva página, iframe e scroll; Hero percorre ida e volta.
- `tests/media-dialog-regressions.mjs`: passou em 1705 × 867, 1440 × 900, 1280 × 600 e 390 × 844; API permitida, recusada e pendente; modais na camada superior; botão de fechar dentro da viewport; PDF sem barra escondida; posição preservada.
- `tests/mobile-loading-regressions.mjs`: passou; carregamento adiado e mídias ativadas ao chegar às seções.
- Console: nenhuma exceção de página nos cenários de diálogo capturados.
- Limite: Chrome isolado com emulação móvel; não representa validação em aparelho físico ou em todas as extensões do perfil pessoal.

## Checklist final

- [x] Aplicar a composição indicada na anotação.
- [x] Comparar fonte e implementação juntas e corrigir P0/P1/P2 encontrados.
- [x] Verificar a imagem integral e todos os botões dentro da tela.
- [x] Exercitar recusa e travamento da API de tela cheia.
- [x] Preservar Hero, mídias originais e carregamento móvel.

Sem P0/P1/P2 acionável na implementação verificada. A aprovação estética final continua com o usuário.

final result: passed
