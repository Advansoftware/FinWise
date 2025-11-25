// src/app/(app)/categories/page.tsx
"use client";

import { useState, useTransition, MouseEvent } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Stack,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  useTheme,
  CircularProgress,
  keyframes,
  Grid,
} from "@mui/material";
import { TransactionCategory } from "@/lib/types";
import { CategoryIcon } from "@/components/icons";
import {
  PlusCircle,
  MoreVertical,
  Trash2,
  Wand2,
  X,
  Check,
  Settings,
} from "lucide-react";
import { suggestCategoryForItemAction } from "@/services/ai-actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export default function CategoriesPage() {
  const {
    isLoading,
    categories,
    subcategories,
    filteredTransactions,
    addCategory,
    deleteCategory,
    addSubcategory,
    deleteSubcategory,
  } = useTransactions();

  const [isSuggesting, startSuggesting] = useTransition();
  const [suggestion, setSuggestion] = useState<{
    category: string;
    subcategory?: string;
  } | null>(null);
  const [itemName, setItemName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  // Dialog states
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const theme = useTheme();

  if (isLoading) {
    return <CategoriesSkeleton />;
  }

  const getCategoryTotal = (category: TransactionCategory) => {
    return filteredTransactions
      .filter((t) => t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleAISuggestion = () => {
    if (!itemName || !user) return;
    setSuggestion(null);
    startSuggesting(async () => {
      try {
        const categoryStrings: string[] = categories.map((c) => c as string);
        const result = await suggestCategoryForItemAction(
          { itemName, existingCategories: categoryStrings },
          user.uid
        );
        setSuggestion(result);
      } catch (error) {
        console.error("Error fetching AI suggestion:", error);
        toast({
          variant: "error",
          title: "Erro na Sugestão",
          description:
            "Não foi possível obter a sugestão da IA. Verifique suas configurações.",
        });
      }
    });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    await addCategory(newCategoryName.trim() as TransactionCategory);
    setNewCategoryName("");
    setCreateDialogOpen(false);
  };

  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Categorias
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie suas categorias e veja os gastos de cada uma.
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Button
            variant="outlined"
            size="small"
            component={Link}
            href="/categories/default"
            startIcon={<Settings size={16} />}
          >
            Ver Padrão
          </Button>

          <Button
            variant="outlined"
            disabled={!user}
            onClick={() => setSuggestDialogOpen(true)}
            startIcon={<Wand2 size={16} />}
          >
            Sugerir por IA
          </Button>

          <Button
            variant="contained"
            disabled={!user}
            onClick={() => setCreateDialogOpen(true)}
            startIcon={<PlusCircle size={16} />}
          >
            Nova Categoria
          </Button>
        </Stack>
      </Stack>

      {/* AI Suggestion Dialog */}
      <Dialog
        open={suggestDialogOpen}
        onClose={() => setSuggestDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Sugestão de Categoria com IA</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Digite o nome de um item e a IA irá sugerir uma categoria e
            subcategoria para ele.
          </DialogContentText>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                placeholder="ex: Conta de luz"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAISuggestion()}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleAISuggestion}
                disabled={isSuggesting || !itemName}
                sx={{ minWidth: 90 }}
              >
                {isSuggesting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  "Sugerir"
                )}
              </Button>
            </Stack>

            {isSuggesting && (
              <Typography
                variant="caption"
                color="text.secondary"
                align="center"
                sx={{ animation: `${pulse} 2s ease-in-out infinite` }}
              >
                Analisando...
              </Typography>
            )}

            {suggestion && (
              <Box p={2} bgcolor="action.hover" borderRadius={1}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Sugestão da IA:
                </Typography>
                <Stack spacing={1}>
                  {suggestion.category && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2">Categoria:</Typography>
                      <Chip label={suggestion.category} size="small" />
                    </Stack>
                  )}
                  {suggestion.subcategory && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2">Subcategoria:</Typography>
                      <Chip
                        label={suggestion.subcategory}
                        size="small"
                        color="secondary"
                      />
                    </Stack>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuggestDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Criar Nova Categoria</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Insira o nome da nova categoria.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Ex: Educação"
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setCreateDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddCategory}
            disabled={!newCategoryName.trim()}
            variant="contained"
          >
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid key={category} size={{ xs: 12, sm: 6, lg: 4 }}>
            <CategoryCard
              category={category}
              subcategories={subcategories[category] || []}
              total={getCategoryTotal(category)}
              onAddSubcategory={addSubcategory}
              onDeleteCategory={deleteCategory}
              onDeleteSubcategory={deleteSubcategory}
            />
          </Grid>
        ))}
        {categories.length === 0 && !isLoading && (
          <Grid size={12}>
            <Card sx={{ textAlign: "center", py: 4 }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhuma categoria encontrada.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Adicione uma categoria para começar a organizar.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Stack>
  );
}

interface CategoryCardProps {
  category: TransactionCategory;
  subcategories: string[];
  total: number;
  onAddSubcategory: (
    category: TransactionCategory,
    name: string
  ) => Promise<void>;
  onDeleteCategory: (category: TransactionCategory) => Promise<void>;
  onDeleteSubcategory: (
    category: TransactionCategory,
    subcategory: string
  ) => Promise<void>;
}

function CategoryCard({
  category,
  subcategories,
  total,
  onAddSubcategory,
  onDeleteCategory,
  onDeleteSubcategory,
}: CategoryCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const theme = useTheme();

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddSubcategoryClick = () => {
    setIsEditing(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    await onDeleteCategory(category);
    setDeleteDialogOpen(false);
  };

  const handleSubmitSubcategory = async () => {
    if (!newSubcategoryName.trim()) return;
    await onAddSubcategory(category, newSubcategoryName.trim());
    setNewSubcategoryName("");
    setIsEditing(false);
  };

  return (
    <>
      <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <CardHeader
          action={
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertical size={18} />
            </IconButton>
          }
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ color: "primary.main", display: "flex" }}>
                <CategoryIcon category={category} />
              </Box>
              <Typography variant="h6" noWrap title={category}>
                {category}
              </Typography>
            </Box>
          }
          subheader={
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Gasto:{" "}
              <Box component="span" fontWeight="bold" color="error.main">
                R$ {total.toFixed(2)}
              </Box>
            </Typography>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0, flexGrow: 1 }}>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            gutterBottom
            sx={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            Subcategorias:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {subcategories.length > 0 ? (
              subcategories.map((sub) => (
                <Chip
                  key={sub}
                  label={sub}
                  onDelete={() => onDeleteSubcategory(category, sub)}
                  color="secondary"
                  size="small"
                  variant="outlined"
                />
              ))
            ) : (
              <Typography variant="caption" color="text.secondary">
                Nenhuma subcategoria registrada.
              </Typography>
            )}

            {isEditing && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                width="100%"
                mt={1}
              >
                <TextField
                  autoFocus
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSubmitSubcategory()
                  }
                  placeholder="Nova subcategoria"
                  size="small"
                  fullWidth
                  InputProps={{
                    style: { fontSize: "0.875rem" },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleSubmitSubcategory}
                  disabled={!newSubcategoryName.trim()}
                  color="primary"
                >
                  <Check size={16} />
                </IconButton>
                <IconButton size="small" onClick={() => setIsEditing(false)}>
                  <X size={16} />
                </IconButton>
              </Stack>
            )}
          </Box>
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleAddSubcategoryClick}>
          <PlusCircle size={16} style={{ marginRight: 8 }} /> Adicionar
          Subcategoria
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          <Trash2 size={16} style={{ marginRight: 8 }} /> Excluir Categoria
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Você tem certeza?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente a
            categoria "{category}" e todas as suas subcategorias. As transações
            nesta categoria não serão excluídas.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function CategoriesSkeleton() {
  return (
    <Stack spacing={4}>
      <Box>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="text" width={300} height={24} />
      </Box>
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Skeleton
              variant="rectangular"
              height={200}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
