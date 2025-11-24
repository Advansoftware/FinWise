# Instruções para Migração de Componentes Tailwind → MUI

## ⚠️ IMPORTANTE
Este arquivo contém instruções para migração de componentes individuais do Tailwind para o MUI.
**APÓS A MIGRAÇÃO COMPLETA, ESTE DIRETÓRIO DEVE SER REMOVIDO OU ARQUIVADO.**

---

## 🎯 Objetivo
Migrar cada componente, módulo e página de Tailwind para MUI mantendo:
- **Visual idêntico** ao tema atual
- **Funcionalidade preservada**  
- **Componentização máxima**
- **Uso dos tokens** definidos em `src/theme/tokens.ts`

---

## 📚 Recursos Disponíveis

### Tokens Centralizados
- **Localização**: `src/theme/tokens.ts`
- **Conteúdo**: Cores (dark/light), tipografia, espaçamentos, raios, sombras, breakpoints, z-index, transições.
- **Uso**: Sempre referenciar tokens via `theme` do MUI, nunca valores hardcoded.

### Tema MUI
- **Localização**: `src/theme/mui-theme.ts`
- **Exporta**: `themeDark`, `themeLight`, `getTheme(mode)`
- **Uso**: Acessar via `theme` prop em componentes ou hooks `useTheme()`

### Provider
- **Localização**: `src/theme/MuiThemeProvider.tsx`
- **Responsabilidade**: Envolve a aplicação com ThemeProvider + EmotionCache
- **Dark mode**: Sincroniza automaticamente com classe `light` no `<html>`

---

## 🔄 Fluxo de Migração de um Componente

### 1. Análise Prévia
- Ler o componente atual identificando:
  - Classes Tailwind utilizadas
  - Layout (flex, grid, absolute, etc.)
  - Estados (hover, focus, disabled, active)
  - Responsividade (breakpoints)
  - Variantes (primary, secondary, sizes, etc.)
  - Props customizadas

### 2. Mapear para Componentes MUI
- **Botões**: `<Button>` do MUI com variant, size, color
- **Cards**: `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardActions>`
- **Inputs**: `<TextField>`, `<Select>`, `<Autocomplete>`
- **Layout**: `<Grid>`, `<Stack>`, `<Box>`
- **Tipografia**: `<Typography variant="...">`
- **Diálogos**: `<Dialog>`, `<DialogTitle>`, `<DialogContent>`, `<DialogActions>`
- **Menus**: `<Menu>`, `<MenuItem>`
- **Tooltips**: `<Tooltip>`
- **Chips**: `<Chip>`
- **Skeleton**: `<Skeleton>`

### 3. Estilização com `sx` Prop
- Preferir `sx` prop para estilos inline declarativos.
- **Não usar valores literais**, sempre referenciar `theme`:

```tsx
// ❌ Errado
<Box sx={{ color: '#9ca3af', padding: '12px' }} />

// ✅ Correto
<Box sx={{ 
  color: 'custom.mutedForeground',  // ou theme.palette.text.secondary
  p: 3,  // theme.spacing(3) = 0.75rem
}} />
```

### 4. Mapeamento de Tailwind para MUI `sx`

| Tailwind | MUI `sx` | Observação |
|----------|----------|------------|
| `flex` | `display: 'flex'` | - |
| `flex-col` | `flexDirection: 'column'` | Ou usar `<Stack direction="column">` |
| `gap-4` | `gap: 4` | 1 unidade = 0.25rem |
| `mt-6` | `mt: 6` | margin-top |
| `p-4` | `p: 4` | padding |
| `rounded-lg` | `borderRadius: (theme) => theme.shape.borderRadius` | Ou valor customizado |
| `text-sm` | `fontSize: (theme) => theme.typography.body2.fontSize` | Ou usar `<Typography variant="body2">` |
| `font-medium` | `fontWeight: 500` | - |
| `bg-card` | `bgcolor: 'custom.card'` | Referenciar custom palette |
| `text-foreground` | `color: 'text.primary'` | - |
| `border border-border` | `border: '1px solid', borderColor: 'custom.border'` | - |
| `hover:bg-accent` | `'&:hover': { bgcolor: 'custom.accent' }` | - |
| `sm:flex-row` | `{ xs: 'column', sm: 'row' }` para `flexDirection` | Responsivo |

### 5. Responsividade
- Usar breakpoints do theme:

```tsx
<Box sx={{
  display: { xs: 'block', md: 'flex' },
  flexDirection: { xs: 'column', md: 'row' },
  gap: { xs: 2, md: 4 },
}} />
```

### 6. Componentização
- Se um padrão se repete > 2 vezes, criar wrapper em `src/components/ui/`.
- Manter API simples e consistente com o padrão anterior (quando possível).

Exemplo de wrapper para Button:

```tsx
// src/components/ui/button-mui.tsx
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(MuiButton)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: theme.shape.borderRadius,
  // Customizações adicionais...
}));

export type ButtonProps = MuiButtonProps & {
  // Props customizadas se necessário
};

export function Button({ children, ...props }: ButtonProps) {
  return <StyledButton {...props}>{children}</StyledButton>;
}
```

### 7. Testes Visuais
- Comparar visualmente antes/depois.
- Verificar em modo claro e escuro.
- Testar responsividade em diferentes viewports.
- Validar estados (hover, focus, disabled).

### 8. Atualizar Checklist
- Marcar item como concluído no `docs/mui-migration/theme-migration-guide.md`.

---

## 🧩 Exemplos de Migração

### Exemplo 1: Card Simples

**Antes (Tailwind)**:
```tsx
<div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
  <h3 className="text-2xl font-semibold">Título</h3>
  <p className="text-sm text-muted-foreground">Descrição</p>
</div>
```

**Depois (MUI)**:
```tsx
<Card sx={{ p: 6 }}>
  <Typography variant="h4" fontWeight={600}>
    Título
  </Typography>
  <Typography variant="body2" color="custom.mutedForeground">
    Descrição
  </Typography>
</Card>
```

### Exemplo 2: Botão com Variantes

**Antes (Tailwind)**:
```tsx
<button className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium">
  Clique
</button>
```

**Depois (MUI)**:
```tsx
<Button variant="contained" color="primary" size="medium">
  Clique
</Button>
```

### Exemplo 3: Layout com Grid

**Antes (Tailwind)**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {items.map(item => <div key={item.id}>{item.name}</div>)}
</div>
```

**Depois (MUI)**:
```tsx
<Grid container spacing={6}>
  {items.map(item => (
    <Grid item xs={12} md={6} lg={3} key={item.id}>
      {item.name}
    </Grid>
  ))}
</Grid>
```

### Exemplo 4: Stack (Flexbox)

**Antes (Tailwind)**:
```tsx
<div className="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

**Depois (MUI)**:
```tsx
<Stack spacing={4}>
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>
```

---

## ⚙️ Casos Especiais

### Dark Mode Dinâmico
- O tema já está sincronizado automaticamente via `MuiThemeProvider`.
- Não é necessário lógica manual para trocar paleta.
- Cores do `palette.custom` se ajustam automaticamente com base em `mode`.

### Animações
- Animações customizadas do Tailwind (`accordion-down`, etc.) devem ser migradas para:
  - Componentes MUI nativos (ex: `<Accordion>` com animação built-in)
  - Ou `@keyframes` via `styled` API

```tsx
import { styled } from '@mui/material/styles';

const AnimatedBox = styled(Box)(({ theme }) => ({
  '@keyframes slideDown': {
    from: { height: 0 },
    to: { height: 'var(--radix-accordion-content-height)' },
  },
  animation: 'slideDown 0.2s ease-out',
}));
```

### Ícones
- Continuar usando `lucide-react` (já instalado).
- Ou migrar para `@mui/icons-material` se preferir consistência total com MUI.

### Formulários
- Usar `<TextField>`, `<Select>`, `<Checkbox>`, `<Radio>`, `<Switch>` do MUI.
- Integrar com `react-hook-form` mantendo validações.
- Criar wrappers para manter API de `<Input>`, `<Label>` atuais se necessário.

---

## 📝 Checklist por Componente

Para cada componente migrado, verificar:

- [ ] Visual idêntico ao original (cores, espaçamentos, raios)
- [ ] Funcionalidade preservada (cliques, estados, validações)
- [ ] Tokens usados (não há valores hardcoded)
- [ ] Responsividade funcional
- [ ] Dark mode funcional
- [ ] Acessibilidade mantida/melhorada (ARIA, contraste)
- [ ] Testes visuais em Storybook ou app real
- [ ] Props e API compatíveis (se wrapper)
- [ ] Item marcado como concluído no guia principal

---

## 🚀 Ordem de Migração Recomendada

1. **Componentes UI base** (`src/components/ui/`): Button, Card, Badge, Dialog, Input, etc.
2. **Layout principal**: AppNav, Sidebars, Headers
3. **Módulos de domínio**: Auth → Dashboard → Transactions → Budgets → Goals → Reports → etc.
4. **Páginas estáticas**: Blog, Docs
5. **Remoção final**: Tailwind config, classes residuais, dependências

---

## 🔍 Debugging e Problemas Comuns

### Erro: "Cannot find module '@mui/material'"
- **Solução**: Verificar se dependências foram instaladas (`npm install @mui/material @emotion/react @emotion/styled`)

### Estilos não aplicados / Flash of Unstyled Content (FOUC)
- **Solução**: Verificar se `EmotionCacheProvider` está configurado corretamente no `layout.tsx`

### Dark mode não sincroniza
- **Solução**: Verificar se `MuiThemeProvider` observa mudanças na classe `light` do `<html>`

### Cores não correspondem
- **Solução**: Revisar `tokens.ts` e garantir que conversão HSL → RGB está correta

### Performance degradada
- **Solução**: Evitar `sx` prop com funções inline complexas. Usar `styled` para componentes repetidos.

---

## 📚 Referências Úteis

- [MUI Documentation](https://mui.com/material-ui/getting-started/)
- [MUI Customization](https://mui.com/material-ui/customization/theming/)
- [Emotion Documentation](https://emotion.sh/docs/introduction)
- [Next.js App Router with MUI](https://github.com/mui/material-ui/tree/master/examples/material-ui-nextjs-ts)
- [Tailwind to MUI Migration Guide](https://mui.com/material-ui/migration/migration-from-tailwind/)

---

**Última atualização**: 06/11/2025  
**Status**: Em migração ativa  
**Próxima revisão**: Ao completar 50% dos componentes base
