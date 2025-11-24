# Status da Migração Tailwind → MUI

**Data de Início:** Novembro 2025  
**Progresso Geral:** 48% (11/23 tarefas)

## ✅ Concluído

### 1. Infraestrutura (5 tarefas)
- ✅ **tokens.ts** - Todos os tokens de design extraídos do Tailwind
  - Cores (dark/light mode)
  - Tipografia
  - Espaçamentos
  - Raios de borda
  - Sombras
  - Breakpoints

- ✅ **mui-theme.ts** - Tema MUI configurado
  - Paleta customizada (palette.custom)
  - Tipografia mapeada
  - Componentes base estilizados
  - Suporte a dark/light mode

- ✅ **MUI Dependencies** - Instaladas via npm
  - @mui/material
  - @emotion/react  
  - @emotion/styled
  - @emotion/cache

- ✅ **EmotionCacheProvider** - SSR configurado
  - Compatível com Next.js 13+ App Router
  - Cache gerenciado corretamente

- ✅ **MuiThemeProvider** - Integrado no layout
  - Dark mode automático (observa classe HTML)
  - Wrapping correto da aplicação

### 2. Componentes UI Base (6 tarefas)
Todos os componentes em `src/components/ui/` foram migrados mantendo API e funcionalidade:

#### ✅ Button (`button.tsx`)
- 6 variantes: default, destructive, outline, secondary, ghost, link
- 4 tamanhos: default, sm, lg, icon
- Suporte a `asChild` (Radix Slot)
- **Padrão:** StyledButton com helpers getVariantStyles/getSizeStyles

#### ✅ Card (`card.tsx`)
- Card principal
- CardHeader, CardTitle, CardDescription
- CardContent, CardFooter
- **Nota:** Adicionado SxProps<Theme> para CardHeader

#### ✅ Badge (`badge.tsx`)
- Baseado em MUI Chip
- 4 variantes: default, secondary, destructive, outline
- **Padrão:** useTheme hook para evitar erros de spread

#### ✅ Dialog (`dialog.tsx`)
- Dialog, DialogTrigger, DialogContent
- DialogHeader, DialogFooter
- DialogTitle, DialogDescription
- **Nota:** Propriedade `open` obrigatória (não opcional)

#### ✅ Input (`input.tsx`)
- Baseado em MUI TextField
- Variante outlined
- Estilos customizados mantidos
- **Padrão:** StyledTextField

#### ✅ Table (`table.tsx`)
- Table, TableHeader, TableBody, TableFooter
- TableRow, TableHead, TableCell, TableCaption
- **Nota:** Propriedade `align` tipada corretamente (sem 'char')
- **Padrão:** useTheme hook + TableContainer

## 🔄 Em Progresso

### 3. Componentes de Layout (1 tarefa)
- ⏳ **app-nav.tsx** - Navegação principal
- ⏳ **Headers, Sidebars** - Estrutura de página

## 📋 Pendente

### 4. Módulos de Domínio (10 tarefas)
Arquivos identificados por módulo:

#### Auth (1 arquivo)
- `auth-guard.tsx`

#### Dashboard (11 arquivos)
- `add-transaction-sheet.tsx`
- `ai-tip-card.tsx`
- `date-range-picker.tsx`
- `future-balance-card.tsx`
- `installments-summary-card.tsx`
- `item-filter.tsx`
- `recent-transactions.tsx`
- `scan-qr-code-dialog.tsx`
- `spending-chart.tsx`
- `stats-cards.tsx` ⚠️ **Alto uso de classes Tailwind**
- `wallet-card.tsx`

#### Transactions (5 arquivos)
- `analyze-transactions-dialog.tsx`
- `columns.tsx`
- `data-table.tsx`
- `edit-transaction-sheet.tsx`
- `transaction-card-list.tsx`

#### Budgets
- ⏳ Arquivos a mapear

#### Goals  
- ⏳ Arquivos a mapear

#### Reports
- ⏳ Arquivos a mapear

#### Wallets
- ⏳ Arquivos a mapear

#### Credits
- ⏳ Arquivos a mapear

#### Settings & Billing
- ⏳ Arquivos a mapear

### 5. Remoção do Tailwind (1 tarefa)
- ❌ Remover `tailwind.config.ts`
- ❌ Remover `postcss.config.mjs`
- ❌ Desinstalar dependências Tailwind
- ❌ Remover classes remanescentes

### 6. Auditoria Final (1 tarefa)
- ❌ Teste visual dark/light mode
- ❌ Verificação de responsividade
- ❌ Consistência visual
- ❌ Performance

## 📊 Métricas

| Categoria | Concluído | Total | % |
|-----------|-----------|-------|---|
| Infraestrutura | 5 | 5 | 100% |
| UI Base | 6 | 6 | 100% |
| Layout | 0 | 1 | 0% |
| Módulos | 0 | 10 | 0% |
| Cleanup | 0 | 1 | 0% |
| Auditoria | 0 | 1 | 0% |
| **TOTAL** | **11** | **23** | **48%** |

## 🎯 Padrões Estabelecidos

### Padrão de Migração de Componentes

1. **Componentes Simples (Badge, Input)**
   ```tsx
   import { useTheme } from '@mui/material';
   
   const Component = ({ sx, ...props }) => {
     const theme = useTheme();
     return <MuiComponent sx={{ ...styles, ...(typeof sx === 'function' ? sx(theme) : sx) }} />;
   };
   ```

2. **Componentes com Styled (Button, Card)**
   ```tsx
   import { styled } from '@mui/material/styles';
   
   const StyledComponent = styled(MuiComponent)(({ theme }) => ({ ...styles }));
   ```

3. **Interfaces com SxProps**
   ```tsx
   import { type SxProps, type Theme } from '@mui/material';
   
   interface Props {
     sx?: SxProps<Theme>;
   }
   ```

4. **Evitar Spread de Arrays**
   - ❌ `sx={(theme) => ({ ...getStyles(), ...sx })}`  
   - ✅ `sx={{ ...getStyles(theme), ...(typeof sx === 'function' ? sx(theme) as object : sx) }}`

5. **Tipos de Align**
   - HTML permite: `'left' | 'right' | 'center' | 'justify' | 'char'`
   - MUI permite: `'left' | 'right' | 'center' | 'justify' | 'inherit'`
   - Solução: Omit e redeclarar com tipo MUI

## 📝 Próximos Passos

1. Mapear todos os arquivos restantes dos módulos
2. Definir prioridade de migração (por impacto/visibilidade)
3. Migrar módulos sequencialmente
4. Executar cleanup do Tailwind
5. Auditoria visual completa

## ⚠️ Pontos de Atenção

- Classes Tailwind ainda presentes em todos os módulos de domínio
- Muitos componentes com alto uso de className
- Necessário testar cada módulo após migração
- Dark mode precisa ser validado em todos os componentes migrados

## 🔗 Documentação

- [Guia de Migração](./theme-migration-guide.md)
- [Instruções de Componentes](./component-migration-instructions.md)
