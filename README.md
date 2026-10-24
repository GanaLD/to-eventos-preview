# TO Eventos | Prévia GitHub Pages (V3)

Ambiente público de **homologação** da LP editorial de Thais Ortiz / TO Eventos. A versão final será hospedada em `toeventos.com`, pela Hostinger, após aprovação.

## Arquitetura
- HERO com espaço reservado para vídeo cinematográfico novo, controlado pelo scroll (quando for entregue).
- Seção editorial: posicionamento + papoulas e soluções.
- Projetos: painéis de GSAP/ScrollTrigger com deslocamento horizontal no desktop; empilhamento no mobile.
- Contato ao final do percurso.
- Identidade: grafite `#1A1A1A`, off-white `#F4F4F2` e laranja `#FF4D00`.

## Mídias do preview
- Papoulas originais convertidas para WebP proporcional (800×1067), sem esticamento/corte. O PNG de origem está guardado fora do repositório.
- Fotografia/frame real do Summit.
- Vídeo de apresentação: **proxy comprimido para homologação** (854 px / 18 fps), não é o arquivo Full HD de entrega. O original permanece no pacote fonte para Hostinger.
- HERO cinematográfico: **ainda não fornecido**, placeholder intencional.

## Desenvolvimento e publicação
O site está em `site/` com HTML/CSS/JavaScript sem framework e URLs de assets relativos.
O workflow `.github/workflows/pages.yml` publica o conteúdo de `site/` no GitHub Pages. Em Settings → Pages, selecione **GitHub Actions** quando necessário.

**Importante:** conteúdo do GitHub Pages é público. Não alterar DNS ou arquivos da Hostinger durante homologação. Para migrar à hospedagem definitiva, enviar a pasta `site/` e substituir o vídeo proxy pelo original otimizado aprovado.
