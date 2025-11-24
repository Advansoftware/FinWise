# Guia de Migração para MUI Mantendo o Tema Atual

## Objetivos
- Reproduzir o visual atual (cores, tipografia, espaçamentos, raios, sombras) em um tema MUI.
- Configurar tokens compartilhados para uso no MUI e, temporariamente, no Tailwind até a remoção completa.
- Migrar módulos de UI de Tailwind para MUI gradualmente, alinhando tudo ao sistema de grid do MUI.
- Componentizar o máximo possível, reduzindo duplicação e preparando a remoção definitiva do Tailwind.

---

## 1. Preparação do Tema

### 1.1 Inventário de Tokens
1. Ler `tailwind.config.ts` e `src/app/globals.css` para identificar variáveis/tokens existentes (`--primary`, `--background`, etc.).
2. Listar cores, bordas, raios, sombras, tipografia, espaçamentos.
3. Mapear cada token para um alias semântico (ex.: `colors.primary.main`, `colors.background.surface`).

### 1.2 Estrutura Recomendada
- Criar `src/theme/tokens.ts` com os tokens brutos (Sem imports do MUI).
- Criar `src/theme/mui-theme.ts` que usa `createTheme` e importa `tokens.ts`.
- Se necessário, gerar tipos em `src/theme/types.ts` (opcional) para garantir consistência ao manipular tokens.

### 1.3 Montagem do Tema
1. Definir `palette` com base nas chaves do Tailwind:
   - `primary`, `secondary`, `muted`, `accent`, `destructive`, `background`, `foreground`, `card`, `border`, `input`, `ring`.
   - Incluir esquemas especiais (`sidebar`, `chart`) em `palette` ou em `theme.custom`.
2. Ajustar `typography` para usar `var(--font-inter)` (ou fonte equivalente) como `fontFamily` padrão e replicar níveis (ex.: `h1` ↔ `text-3xl`).
3. Configurar `shape.borderRadius` com `var(--radius)` e adicionar radii específicos (`sm`, `md`, `lg`) em `theme.customRadii`.
4. Converter sombras do Tailwind (se houver) para `theme.shadows`.
5. Configurar `spacing`: definir `theme.spacing` para que `1` seja equivalente a `0.25rem` (padrão do Tailwind). Ex.: `spacing: factor => `${factor * 0.25}rem``.
6. Expor helpers (ex.: `getColor(colorName)` ou `spacingPx(n)`) se facilitar a migração.

### 1.4 Integração no App
1. Instalar dependências do MUI (`@mui/material`, `@emotion/react`, `@emotion/styled`).
2. Criar `src/theme/EmotionCacheProvider.tsx` para SSR no App Router (seguir docs do MUI para Next 13+).
3. Atualizar `src/app/layout.tsx` para envolver o app com:
   ```tsx
   <CacheProvider value={emotionCache}>
     <ThemeProvider theme={muiTheme}>
       <CssBaseline />
       {children}
     </ThemeProvider>
   </CacheProvider>
   ```
4. Garantir que `globals.css` continue carregado temporariamente até completar a migração.
5. Adicionar Storybook (opcional) ou páginas de preview para validar o tema.

### 1.5 Sincronização Temporária com Tailwind
- Enquanto Tailwind existir, importar `tokens` na configuração para manter coerência:
  ```ts
  import { colors, radius, spacing } from '@/theme/tokens';
  ```
- Automatizar, se necessário, a geração de tokens (ex.: script que lê `tailwind.config.ts` e atualiza `tokens.ts`).
- Após migração final, remover lógica de Tailwind e manter apenas o tema MUI.

---

## 2. Estratégia de Migração de Componentes

### 2.1 Princípios Gerais
- **Componentização máxima**: mover padrões recorrentes para `src/components/ui/` como wrappers MUI.
- **Grid do MUI**: usar `<Grid container spacing={...}>` e `<Grid item>` para layouts, substituindo combinações Tailwind de `flex`, `gap`, etc., quando fizer sentido. Em telas muito simples, `<Stack>` pode substituir `flex` com `gap`.
- **Estilos declarativos**: preferir `sx` ou styled API com tokens. Evitar valores literais de cor/tamanho; sempre usar `theme`.
- **Acessibilidade**: aproveitar componentes nativos do MUI (`Dialog`, `Menu`, `Tooltip`, etc.) para evitar reimplementar comportamentos.
- **Dark mode**: conectar o sistema atual (provavelmente via classe `dark`) ao `palette.mode` do MUI, de modo que alterações de tema escuro/claro reflitam no theme provider.

### 2.2 Fluxo para Cada Módulo/Componente
1. **Levantamento**: identificar classes Tailwind utilizadas e layout atual.
2. **Modelagem**: mapear para componentes MUI adequados (ex.: `div` com `flex` → `<Stack direction="row">`).
3. **Estilização**: aplicar estilos via `sx`, `styled`, ou `makeStyles` (preferir `sx`). Usar tokens.
4. **Extração**: se notar padrões repetidos (botões, cards, badges), mover para `components/ui/`.
5. **Testes**: verificar em Storybook ou página real; comparar com o layout antigo.
6. **Checklist**: marcar no TODO abaixo quando o módulo estiver migrado.

### 2.3 Itens que Exigem Atenção Especial
- **Formulários**: migrar inputs para componentes MUI (`TextField`, `Select`, `Autocomplete`), criar wrappers se necessário para manter APIs.
- **Tipografia**: substituir `className="text-sm font-medium"` por `<Typography variant="body2" fontWeight={500}>`.
- **Espaçamentos**: converter `mt-6` para `sx={{ mt: 6 }}` (observando que `theme.spacing(6)` corresponde ao fator desejado).
- **Estados**: estados `hover`, `focus`, `disabled` devem ser configurados nas props do componente ou em `sx`, evitando classes utilitárias.
- **Animacoes**: converter animações custom (`accordion-down`) para `@keyframes` via `styled` ou usar componentes MUI equivalentes.

---

## 3. Checklist de Migração (TODO)

> Marque cada item quando o módulo estiver completamente migrado para MUI seguindo este guia. Atualize este arquivo conforme finaliza cada etapa.

### 3.1 Fundamentos
- [ ] Criar `src/theme/tokens.ts` com tokens extraídos.
- [ ] Criar `src/theme/mui-theme.ts` com `createTheme` configurado.
- [ ] Configurar `EmotionCacheProvider` e `ThemeProvider` no layout raiz.
- [ ] Garantir documentação do tema (ex.: Storybook, MDX, ou docs internos).

### 3.2 UI Base (`src/components/ui`)
- [ ] Button
- [ ] Card
- [ ] Badge/Chip
- [ ] Dialog/Modal
- [ ] Tooltip
- [ ] Input/TextField wrappers
- [ ] Select/Autocomplete wrappers
- [ ] Table/DataGrid wrappers
- [ ] Tabs/Accordion components

### 3.3 Layout e Navegação
- [ ] Header/AppNav (`src/app/app-nav.tsx` e derivados)
- [ ] Sidebars e menus (`src/components/...`
- [ ] Breadcrumbs/Navigation aids
- [ ] Layouts de página principais (`src/app/(app)/**/layout.tsx`)

### 3.4 Domínio Aplicacional
- [ ] Auth (login/signup forms)
- [ ] Dashboard (charts, cards, status widgets)
- [ ] Transactions module
- [ ] Budgets module
- [ ] Goals module
- [ ] Reports module
- [ ] Wallets module
- [ ] Credits/AI module
- [ ] Settings module
- [ ] Billing module
- [ ] Blog/Docs pages (garantir tipografia MUI)

### 3.5 Recursos Compartilhados
- [ ] Hooks/contexts atualizados para usar componentes MUI (quando aplicável)
- [ ] Temas escuro/claro sincronizados com MUI
- [ ] Remover dependências de Tailwind (config, plugins, classes residuais)

### 3.6 Encerramento
- [ ] Rodar auditoria visual final
- [ ] Remover `tailwind.config.ts`, `postcss` e classes utilitárias
- [ ] Atualizar documentação informando uso exclusivo do MUI

---

## 4. Boas Práticas Complementares
- Documentar decisões de design (MDX ou README) para consultoria futura.
- Usar ESLint/Stylelint para impedir novas classes Tailwind durante a migração.
- Considerar Storybook para snapshot visual.
- Manter commits pequenos por módulo para facilitar review.
- Validar acessibilidade (ARIA, contraste) em cada componente migrado.

---

## 5. Observações Finais
- Este arquivo serve de referência temporária para a migração. Após concluir todos os itens da checklist e remover Tailwind, arquive-o ou mova-o para `docs/archive/`.
- Atualize o checklist regularmente para manter o progresso visível.
