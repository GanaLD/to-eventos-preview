# DIRETRIZES OPERACIONAIS — LP THAIS ORTIZ / TO EVENTOS

**Status:** obrigatório · **Revisão:** 2026-10-25 · **Escopo:** projeto existente no GitHub, preview público e produção Hostinger.

Este documento consolida as regras de desenvolvimento, interface, validação e publicação da LP Thais Ortiz. Ele é independente do manual técnico mestre, mas prevalece em caso de divergência de procedimento. A criação deste documento **não** autoriza publicação na Hostinger.

## Fonte oficial de verdade

- **Código:** repositório GitHub existente `GanaLD/to-eventos-preview`, sem repositórios paralelos.
- **Preview:** https://ganald.github.io/to-eventos-preview/
- **Site de produção:** https://toeventos.com/ — hospedagem Hostinger.
- **Branch principal do preview:** `main`; conteúdo web em `site/`; publicação automática de `site/` pelo workflow `.github/workflows/pages.yml`.
- **Identidade:** grafite `#1A1A1A`, off-white `#F4F4F2` e laranja `#FF4D00`; manter a paleta e as fontes previamente aprovadas.
- **Princípio:** GitHub é o lugar de edição; GitHub Pages é o lugar de aprovação; Hostinger é o destino da versão aprovada.

## Fluxo imutável de trabalho

**Pedido delimitado.** Interpretar literalmente a solicitação e listar os elementos que podem mudar. Elementos não citados ficam bloqueados, inclusive textos, imagens, mídia, animações, links, URLs, SEO, estrutura HTML, páginas e dispositivos.

**Diagnóstico da versão atual.** Ler o código no GitHub imediatamente antes da edição. Identificar CSS ativo, scripts, dependências, alterações concorrentes, testes e pontos sensíveis. Não usar versões antigas como base para sobrescrever melhorias recentes.

**Implementação exclusivamente no GitHub original.** Editar apenas os arquivos necessários. Não criar outro repositório, não entregar ZIP, não substituir o site por pacotes antigos e não executar mudanças diretamente na Hostinger.

**Validação técnica e visual.** Testar Desktop/Web e Mobile na versão atualizada; conferir que o conteúdo solicitado mudou e todo o restante permaneceu funcional. Executar os testes automatizados existentes e registrar limitações quando a verificação real em navegador não estiver disponível.

**Link de aprovação.** Entregar sempre o URL público e direto da versão de preview, identificando mudanças, testes executados e eventuais pendências. Não usar URL do repositório como substituto do link para visualizar o site.

**Aprovação expressa.** Somente a manifestação inequívoca do responsável pela LP autorizando publicação habilita a etapa de Hostinger. Aprovação de uma versão não vale para alterações posteriores. O pedido de mexer no preview **não** autoriza o site oficial.

**Publicação e conferência final.** Após autorização explícita, publicar na Hostinger a **mesma versão aprovada**, sem adicionar outras mudanças; verificar a produção pelo domínio `toeventos.com` em desktop e mobile. Se houver bloqueio técnico ou credencial ausente, relatar o impedimento de forma objetiva; jamais afirmar que publicou sem confirmação.

## Proibições absolutas

- Não gerar ZIP como artefato de entrega ou de atualização. Mudanças do website residem no GitHub existente.
- Não abrir repositório novo, não clonar layout antigo para substituir o atual, não criar versões alternativas descoordenadas.
- Não alterar a Hostinger sem autorização explícita dada **após** o preview.
- Não afirmar que há preview atualizado, CI aprovado ou site de produção publicado sem verificação.
- Não remover, reduzir, ocultar ou quebrar animações, vídeos, Heroscroll, transições, acordeões, menu, responsividade, links, indexação ou páginas que não façam parte do pedido.
- Não modificar textos comerciais, mídia, cores, fontes, copy SEO, metadados, formulários, contatos, destinos ou APIs sem o pedido correspondente.
- Não embutir senhas, tokens, chaves de API, segredos Hostinger ou credenciais no HTML, repositório, logs, documentação ou preview.
- Não aplicar correções globais que afetem componentes fora da área solicitada.
- Não remover evidências de erro, desabilitar testes ou contornar gates de qualidade para concluir uma publicação.

## Regra permanente de respiro editorial

Nenhum título, subtítulo, lead, parágrafo, legenda, link ou CTA poderá tocar visualmente outro bloco ou as bordas operacionais do viewport. A hierarquia de leitura exige espaçamento vertical e horizontal proporcional entre grupos, limites de coluna, `line-height` adequado, `gap` e `padding` consistentes.

- Títulos devem permitir leitura integral e quebra natural sem clipping ou sobreposição.
- Parágrafos devem ter entrelinha confortável e largura controlada, inclusive em telas pequenas.
- Grupos relacionados ficam visualmente próximos; seções independentes recebem espaçamento maior.
- Ajustes responsivos devem preservar o respiro e não comprimir texto apenas para fazer caber.
- Priorizar regras locais dos componentes. Não neutralizar intencionalmente o Heroscroll, containers fixados, galerias horizontais ou mídia de tela cheia com seletores amplos.

## Regra permanente de títulos e seções sem enumeração

Não exibir números editoriais como `01 / TRAJETÓRIA`, `02 / SERVIÇOS`, `01` em cards ou títulos ou qualquer sequenciamento ornamental nas seções. O conteúdo deve ser identificado por assunto, não por índice. Números que comprovam informações reais, como mais de 10 anos de experiência, 300 participantes, 5.000 pessoas ou paginação funcional de um PDF, **não** são enumeração editorial e devem ser preservados.

## Regra permanente sem setas decorativas

É proibido mostrar glyphs de seta (`↗`, `→`, `➜`, `❯` e similares) nos títulos, seções, links ou botões. Remover a decoração sem alterar o link de destino, sem desativar funções de navegação e sem retirar um controle de acessibilidade. Acordeões podem usar indicadores não direcionais, como mais/menos, mantendo operação por teclado.

## Regra permanente para botões e CTAs

Botões devem apresentar identidade visual coerente, texto centralizado nos eixos horizontal e vertical, `padding` suficiente, legibilidade em múltiplas linhas, superfície com iluminação sutil e sombreamento contido. Preservar a paleta e o caráter editorial da marca.

É obrigatório validar os estados `default`, `hover`, `focus-visible`, `active` e `disabled`, quando aplicáveis. Não permitir clipping, estouro lateral, quebra de palavra inadequada, contraste insuficiente ou ícones desnecessários. Os alvos de toque devem permitir operação confortável no celular.

## Proteção de componentes existentes

Preservar especificamente: vídeo principal e controles do Heroscroll; vídeos e imagens originais e seus crop/contain aprovados; a animação de papoulas; navegação superior, menu lateral e menu de mobile; transição Sobre/Soluções; projetos horizontais e navegação por scroll; portfólio PDF e paginação funcional; galeria accordion; botão flutuante de WhatsApp; página `/sobre/`; SEO e URLs canônicas; acessibilidade, redução de movimento e funcionalidades válidas.

Nenhuma diretriz estética justifica substituir ou desativar uma funcionalidade preservada.

## Testes obrigatórios antes de enviar a prévia

**Desktop/Web:** testar pelo menos viewport de notebook e desktop, verificar quebras de títulos, espaçamento, botões, hover/focus, links, vídeos, scroll, acordeão, galeria, menu e console. Confirmar que não há transbordamento horizontal, cortes de textos ou regressões.

**Mobile:** testar largura pequena e comum, navegação por toque, espaçamento lateral, textos, CTA, menu, rolagem, mídia vertical, PDF e accordion. Confirmar que os botões permanecem legíveis e utilizáveis.

**Automatizados:** executar os testes do projeto; para solicitações de UI, manter ao menos um teste de regressão que verifique o contrato alterado. O GitHub Actions publica o preview; o workflow de QA visual da LP deve ser consultado sempre que disponível. Não declarar aprovação visual sem screenshot ou inspeção real de browser.

**Checklist de aceite:** só considerar concluído o que foi realmente modificado e validado. Informar explicitamente qualquer item não conferido.

## Organização do projeto e versionamento

- `site/`: arquivos reais da LP e páginas, código e mídias de preview.
- `site/assets/`: assets organizados por responsabilidade, respeitando versões aprovadas, nomes estáveis e formatos adequados.
- `tests/`: testes de regressão funcionais e visuais.
- `.github/workflows/`: pipelines do GitHub Pages e verificação.
- `docs/`: decisões de design, diretrizes e documentação técnica, fora da árvore publicada.
- Mudanças devem ter commits com finalidade identificável e delta limitado ao pedido. Antes de editar, usar a versão remota mais recente.
- Mudanças concorrentes não devem ser sobrescritas; comparar e preservar o estado remoto já atualizado.
- Rollback só é opção controlada para reparar falha; jamais voltar a versões antigas perdendo melhorias aprovadas.

## Política de SEO, domínio e produção

Não tocar em DNS, domínio, Search Console, sitemap, robots.txt, canonical, rotas, redirects, dados estruturados ou integrações enquanto o pedido tratar apenas de UI. O preview do GitHub Pages não deve disputar indexação com o site oficial. Quando o assunto for SEO, o trabalho terá autorização de escopo específica e documentação de teste antes da publicação.

## Registro de solicitação e aprovação

Para cada entrega, registrar: solicitação literal, arquivos realmente modificados, funções preservadas, teste desktop, teste mobile, resultados CI, URL direto do preview e status da aprovação. Após autorização e publicação, registrar domínio oficial testado, data e status do deploy. Separar claramente `pendente`, `aprovado`, `publicado` e `verificado`.

**Regra final:** nunca alterar o que não foi pedido; nunca regredir; trabalhar sempre no GitHub original; enviar sempre preview testado; publicar na Hostinger somente após aprovação explícita e então confirmar no site oficial.
