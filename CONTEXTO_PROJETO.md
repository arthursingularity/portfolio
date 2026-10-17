# 📦 CONTEXTO GERAL DO PROJETO — SECTOR STUDIO 3D

> **Última Atualização:** Outubro de 2026  
> **Objetivo:** Documento central de arquitetura, decisões técnicas, regras de negócio, convenções de design e histórico de implementações para contextualizar sessões futuras de desenvolvimento.

---

## 1. Visão Geral do Projeto

O **Sector Studio** é um estúdio web 3D de alta precisão para planejamento, modelagem e exportação de layouts industriais, logísticos e de armazenagem (armazéns, setores de estoque, linhas de montagem e logística interna).

### Filosofia de Design e UX
- **Inspirado no Blender + Vercel Design System**:
  - Extremamente limpo, técnico, minimalista, silencioso visualmente e de alta densidade de informação.
  - Paleta escura neutra: `#000000`, `#0a0a0a`, `#111115`, `#141416`, `#18181b`, `#1e1e21`.
  - Bordas sutis (`border: 1px solid rgba(255,255,255,0.08)`) em substituição a sombras pesadas.
  - Tipografia técnica mono e sans compacta com tracking levemente negativo.
  - Zero efeitos chamativos (sem neons cyberpunk, sem glassmorphism exagerado, sem animações lentas).

### Stack Tecnológica
- **Framework:** Next.js (App Router, Client Components)
- **3D Engine:** Three.js + React Three Fiber (`@react-three/fiber`) + Drei (`@react-three/drei`)
- **Estilização:** Tailwind CSS + Vanilla CSS tokens
- **Ícones:** `@iconify/react` (Lucide, Carbon, Solar, Ant Design) e `@carbon/icons-react`
- **Exportação:** `three/examples/jsm/exporters/GLTFExporter.js` (gera arquivo `.glb` standalone)

---

## 2. Arquitetura de Interface (`SectorStudio.jsx`)

O layout principal divide a tela em uma estrutura vertical com a barra estilo Blender no topo e as 3 seções abaixo:

```
+--------------------------------------------------------------------------------+
| BlenderTopBar: [Logo] * (Unsaved) - Blender 5.1.1                [—] [□] [✕]   |
| [Logo] File  Edit  Render  Window  Help | [Layout] Modeling ... Scripting  +   |
+-------------------------------------------------------+------------------------+
|                                                       | 1. Outliner / Árvore   |
|                                                       |    (TreeFolderSection) |
|                                                       |    - setor_principal.glb|
|       Cenário 3D Principal (SceneCanvas)              |    - Setor Principal   |
|       - Cobre altura total (rows 1 e 2)               |    - Lista de Modelos  |
|       - Câmera isométrica com OrbitControls           |    - Renomeação inline |
|       - Gizmo de Orientação no topo direito           +------------------------+
|       - Status Bar Blender no canto inferior esquerdo | 2. Propriedades        |
|       - TransformPopup Fixo no canto inferior direito |    (ItemInspector)     |
|         (Posição X/Y/Z + Rotação 90°/Graus)           |    - Config. Objeto    |
|                                                       |    - Trilho / Varal    |
|                                                       |    - Multiplicar Col.  |
|                                                       |    - Qtd. Caixas (0-6) |
|                                                       |    - Cores das Caixas  |
+-------------------------------------------------------+------------------------+
```

### Componentes Principais

0. **`BlenderTopBar.jsx`**
   - Barra superior autêntica do Blender com visual de engenharia dark mode.
   - Linha 1: Title Bar com ícone colorido do Blender, título do projeto/arquivo e controles de janela.
   - Linha 2: Menus suspensos (`File`, `Edit`, `Render`, `Window`, `Help`) e abas interativas de Workspaces (`Layout`, `Modeling`, `Sculpting`, `UV Editing`, `Texture Paint`, `Shading`, `Animation`, `Rendering`, `Compositing`, `Geometry Nodes`, `Scripting`, `+`).

1. **`SectorStudio.jsx`**
   - Container mestre, organiza `BlenderTopBar` acima e as 3 seções no grid flexível (`flex-1 min-h-0`).
   - Conecta o hook de estado `useSectorState()` a todos os painéis.
   - Renderiza o `TransformPopup` condicionalmente quando há seleção ativa.

2. **`SceneCanvas.jsx`**
   - Configuração do Canvas R3F, câmera (`fov: 45`, `position: [12, 10, 14]`).
   - Iluminação industrial balanceada sem sombras duras.
   - Grid Blender customizado (`BlenderGrid.jsx`).
   - `GizmoViewport` (eixos X, Y, Z no canto superior direito).
   - Renderizador dos modelos (`EditableItem.jsx`).
   - Modal de transformação rápida via atalhos do teclado (`BlenderModalTransform.jsx`).

3. **`TreeFolderSection.jsx` (Outliner)**
   - Árvore hierárquica estilo Blender: Coleção de Cena -> Setor Principal -> Objetos.
   - Renomeação do nome do projeto GLB.
   - Renomeação inline de objetos: **duplo clique** sobre o nome ou clique no **ícone de lápis**.
   - Input inline com `Enter` para salvar, `Escape` para cancelar e auto-seleção de texto no foco.
   - Botão de visibilidade (ícone de olho) para ocultar/exibir cada modelo no 3D.
   - Barra de busca / filtro em tempo real.

4. **`ItemInspector.jsx` (Painel de Propriedades)**
   - Focado **exclusivamente nas propriedades paramétricas** de cada modelo (Trilho, Varal, Multiplicação, Cores, Quantidade de Caixas, Dimensões de Piso, Níveis de Rack).
   - **IMPORTANTE:** Não contém nenhum controle de posição ou rotação (transferidos para o `TransformPopup`).
   - Renomeação sincronizada com o Outliner no cabeçalho.
   - Botões de ação rápida no rodapé: `❐ Duplicar` e `✕ Excluir`.

5. **`TransformPopup.jsx` (Manipulador Fixo do Cenário 3D)**
   - Localizado em `absolute bottom-3 right-3 z-30` dentro do Cenário 3D.
   - Exibido automaticamente sempre que **1 ou mais modelos** estiverem selecionados.
   - **Posição (Metros):**
     - $X$: Eixo lateral (vermelho) -> Three.js `position[0]`
     - $Y$: Profundidade no chão (verde) -> Three.js `position[2]`
     - $Z$: Altura vertical (azul) -> Three.js `position[1]`
     - Botão **Chão** ($Z = 0$): apoia o objeto diretamente no solo.
   - **Rotação (Graus):**
     - Botões rápidos **-90°** e **+90°**.
     - Input numérico de graus com botão **0°** de reset.
   - **Suporte a Multi-Seleção:** calcula o delta e atualiza todos os itens selecionados de forma sincronizada via `onUpdateTransforms`.

6. **`HoverBoundingBox.jsx`**
   - Caixa delimitadora azul com bordas finas que envolve o objeto.
   - **Regra:** Permanece visível tanto quando o objeto está sob o cursor (**hover**) quanto quando está **selecionado** (não desaparece após o clique).

7. **`ItemPalette.jsx`**
   - Menu de contexto flutuante do Blender (`Shift + A` ou clique com botão direito no 3D) para adicionar novos modelos à cena.

---

## 3. Modelo Principal de Caixas e Trilho (`BoxModel.jsx`)

O `BoxModel` é o componente mais customizável do sistema, representando uma coluna de caixas industriais com base de trilho de aço e estrutura de varal superior.

### Dimensões Exatas e Fator de Escala
- **Fator de Escala:** `FATOR_ESCALA = 1.95` (compatibilidade matemática exata com `EstoqueModel`).
- **Largura da Caixa ($X$):** `CAIXA_LARGURA = 0.298096 * 1.95 = 0.5812872 m`
- **Profundidade da Caixa ($Z$):** `CAIXA_COMPRIMENTO = 0.466947 * 1.95 = 0.91054665 m`
- **Altura da Caixa ($Y$):** `CAIXA_ALTURA = 0.193756 * 1.95 = 0.3778242 m`
- **Gap Vertical entre Caixas:** `GAP_Y = 0.003 m` (3mm de separação estética).
- **Gap Lateral entre Colunas Multiplicadas:** `GAP_LATERAL = GAP_Y = 0.003 m` (exatamente igual ao vertical).

### Trilho Laranja (`rail` / `trilho`)
- Altura do trilho: `railH = 0.070 m`.
- Cor: Laranja de aço `#FF6600`.
- **Regra de Largura:** O trilho possui **exatamente a mesma largura lateral das caixas** (`crateW = 0.5812872 m`). Não transborda para fora.
- Pés de apoio escuros nas extremidades externas. Quando conectado lateralmente a outra coluna (`isConnL` ou `isConnR`), omite o pé interno para continuidade limpa.

### Estrutura do Varal (`varal`)
- Habilitado opcionalmente atrás das caixas (só pode ser ativado se o Trilho estiver ativo).
- Postes verticais: `postW = 0.04 m`, `postD = 0.02 m`, cor `#FF6600`.
- Barra horizontal superior: `beamH = 0.045 m`, cor `#FF6600`.
- Placa central superior preta: `tabW = 0.25 m`, `tabH = 0.09 m`, cor `#18181b`.
- **Regra de Continuidade:** Quando conectado com vizinhos (`connectedLeft` ou `connectedRight`), a barra superior e o trilho estendem metade do gap lateral (`GAP_LATERAL / 2`) para conectar perfeitamente sem costura.

### Quantidade de Caixas: `0 a 6`
- O usuário pode selecionar de **0 até 6 caixas**.
- **Caso 0 caixas:**
  - O grupo de caixas brancas não é renderizado.
  - Apenas o trilho laranja e o varal (se ativos) permanecem visíveis na cena.
  - Se o usuário selecionar 0 e o trilho estiver desativado, o trilho é ativado automaticamente para evitar objeto invisível.

### Paleta Base de Cores e Regra de Fidelidade
A paleta oficial é composta por 6 cores funcionais fixas:
```javascript
Verde:    #009F5A
Vermelho: #B65241
Azul:     #4C75B7
Amarelo:  #DAB900
Cinza:    #676767
Branco:   #E0E0E0
```

#### Regra Absoluta de Variação de Cores:
- **Matiz (Hue) e Saturação (Saturation) NUNCA são alterados.** (O verde é sempre o mesmo verde puro, o amarelo nunca vira mostarda, o azul nunca vira azul-marinho pesado, etc.).
- A aleatoriedade atua **exclusivamente na Luminosidade ($L$)**, calibrada suavemente por cor:
  - `Verde (#009F5A)`: variação máxima de até `~2.0%` (evita caixas excessivamente escuras/musgo, pois o verde já possui baixa luminosidade natural ~31%).
  - `Amarelo (#DAB900)`: variação máxima de até `~2.2%` (mantém o tom solar sem tender a mostarda/oliva escuro).
  - `Azul (#4C75B7)`: variação máxima de até `~2.6%` (mantém o tom azul industrial limpo sem manchas pretas/marinho).
  - `Vermelho (#B65241)`: variação máxima de até `~2.6%`.
  - `Cinza (#676767)`: variação máxima de até `~2.8%`.
  - `Branco (#E0E0E0)`: variação máxima de até `~3.5%`.
- `const darkFactor = rand * maxEscurecimento;`
- `const newL = Math.max(0.10, hsl.l - darkFactor);`
- `col.setHSL(hsl.h, hsl.s, newL);`
- Cada modelo possui uma semente única determinística baseada no seu `itemId` e `colorSeed` (`seedBase`).
- **Resultado:** Caixas empilhadas e multiplicadas apresentam textura e profundidade orgânica suave, sem nenhuma caixa desproporcionalmente escura ou destoante.

---

## 4. Multiplicação de Colunas (`multiplyColumns`)

Implementada em `sectorState.js`:
- O usuário define a quantidade multiplicadora (ex: 2x a 200x).
- **Passo da Coluna:** `PASSO_COLUNA = CAIXA_LARGURA + GAP_X = 0.5812872 + 0.003 = 0.5842872 m`.
- O vetor de deslocamento respeita a rotação Euler do modelo original (`dir.applyEuler(rot)`).
- **Herança Fiel:**
  - Se o modelo original **não tiver** Trilho ou Varal, todas as cópias geradas **permanecem sem Trilho e sem Varal**.
  - Se tiver Trilho e Varal, todas as colunas herdam a estrutura e conectam as vigas superiores automaticamente (`connectedLeft: true, connectedRight: true`).
- Cada coluna multiplicada é um objeto completamente independente no Outliner e no estado, recebendo um ID próprio e seu próprio `colorSeed`.

---

## 5. Gerenciamento de Estado (`sectorState.js`)

Centraliza todo o estado da aplicação via hook `useSectorState()`:
- `items`: Lista de todos os objetos no setor.
- `selectedId`: ID do item principal selecionado.
- `selectedIds`: Array de IDs de todos os itens selecionados (suporte a seleção múltipla).
- `pushHistory()`: Pilha de Undo / Redo com limite de histórico.
- Métodos principais:
  - `addItem(type)`
  - `updateTransform(id, { position, rotation })`
  - `updateTransforms(updates)`: Atualização em lote para multi-seleção simultânea.
  - `updateProps(id, propUpdates)`
  - `updateName(id, name)`: Renomeação com registro no histórico.
  - `duplicateItem(id)`: Duplicação individual ou em lote.
  - `multiplyColumns(id, count)`: Multiplicação horizontal inteligente de BoxModels.
  - `removeItem(id)`
  - `toggleVisibility(id)`
  - `copyItem()` / `pasteItem()`: Copiar e colar via clipboard local e atalhos Ctrl+C / Ctrl+V.

---

## 6. Exportação GLB (`exportGlb.js`)

- Converte o grupo de exportação Three.js em um arquivo `.glb` para download imediato.
- **Filtro de Limpeza:** Remove automaticamente elementos auxiliares de desenvolvimento e seleção:
  - `TransformControls` e planos de controle.
  - Objetos com prefixo `__helper` ou `userData.isHelper`.
  - Bounding boxes de hover/seleção.
- Nome do arquivo sincronizado com o nome do projeto (ex: `setor_principal.glb`).

---

## 7. Atalhos de Teclado Suportados

| Atalho | Ação |
|---|---|
| `G` | Iniciar movimentação do(s) objeto(s) selecionado(s) pelo cursor do mouse |
| `R` | Iniciar rotação do(s) objeto(s) selecionado(s) pelo cursor do mouse |
| `X` / `Y` / `Z` | Travar movimento/rotação no respectivo eixo |
| `Shift + Clique` | Selecionar múltiplos objetos (Blender multi-selection) |
| `Ctrl + Clique` | Alternar seleção de múltiplos objetos |
| `Shift + A` / `Botão Direito` | Abrir menu de contexto de adição de modelos |
| `Shift + D` | Duplicar objeto(s) selecionado(s) |
| `Delete` / `Backspace` | Excluir objeto(s) selecionado(s) |
| `Ctrl + Z` | Desfazer (Undo) |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Refazer (Redo) |
| `Ctrl + C` / `Ctrl + V` | Copiar e Colar objetos |

---

## 8. Convenções para Futuras Alterações

1. **Nunca misturar transformações no `ItemInspector`**: Toda manipulação de coordenadas e rotações pertence ao `TransformPopup.jsx`.
2. **Manter proporções de `BoxModel`**: Qualquer alteração em dimensões de caixa, trilho ou varal deve manter `FATOR_ESCALA = 1.95` e `GAP_LATERAL = GAP_Y = 0.003`.
3. **Fidelidade de Cores**: Variações em caixas devem usar semente determinística e alterar somente luminosidade ($L$), nunca matiz ($H$) ou saturação ($S$).
4. **Multiplicação Segura**: Sempre respeitar o estado do item de origem ao multiplicar ou duplicar.
5. **Estética Vercel**: Evitar cores chamativas, sombras difusas ou quebras de alinhamento no grid. Priorizar densidade elegante e velocidade.
