@AGENTS.md
@CONTEXTO_PROJETO.md

# Sector Studio 3D — Guia Rápido

Para a documentação técnica completa de arquitetura, convenções, dimensões industriais e histórico de desenvolvimento, consulte [CONTEXTO_PROJETO.md](file:///c:/Users/arthu/OneDrive/Desktop/Projetos/Portfolio/portfolio/CONTEXTO_PROJETO.md).

## Regras Críticas do Projeto:
1. **Posicionamento e Rotação**:
   - Todo controle de posição ($X, Y, Z$) e rotação reside exclusivamente em [TransformPopup.jsx](file:///c:/Users/arthu/OneDrive/Desktop/Projetos/Portfolio/portfolio/src/components/viewport/TransformPopup.jsx) (canto inferior direito do Cenário 3D).
   - [ItemInspector.jsx](file:///c:/Users/arthu/OneDrive/Desktop/Projetos/Portfolio/portfolio/src/components/viewport/ItemInspector.jsx) cuida apenas de propriedades específicas dos modelos (Trilho, Varal, Multiplicação, Cores, Quantidade de Caixas).

2. **BoxModel.jsx (Caixas e Trilho)**:
   - Dimensões calibradas com `FATOR_ESCALA = 1.95`.
   - `CAIXA_LARGURA = 0.5812872`, `CAIXA_COMPRIMENTO = 0.91054665`, `CAIXA_ALTURA = 0.3778242`.
   - `GAP_LATERAL = GAP_Y = 0.003`. Trilho e varal têm a mesma largura lateral das caixas e conectam sem costura.
   - Quantidade de caixas: **0 a 6**. Se 0, renderiza apenas o trilho e varal.
   - Cores Bases Oficiais: Verde `#009F5A`, Vermelho `#B65241`, Azul `#4C75B7`, Amarelo `#DAB900`, Cinza `#676767`, Branco `#E0E0E0`.
   - Variação de cores orgânica por modelo: semente determinística `seedBase` alterando exclusivamente a **Luminosidade ($L$)** (0% a 8% mais escura), sem nunca distorcer a matiz (Hue) ou saturação das cores bases.

3. **Multiplicação de Colunas**:
   - `multiplyColumns` em [sectorState.js](file:///c:/Users/arthu/OneDrive/Desktop/Projetos/Portfolio/portfolio/src/components/viewport/sectorState.js) herda exatamente o estado do BoxModel original (se estiver sem trilho/varal, as cópias permanecem sem trilho/varal).

4. **Estética**:
   - Vercel Engineering Aesthetic: tema escuro neutro, bordas de 1px discretas, tipografia monospaçada e sem elementos visuais supérfluos.
