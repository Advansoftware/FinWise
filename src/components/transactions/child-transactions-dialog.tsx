"use client";

import { useState, useEffect, useCallback } from "react";
import { Transaction, TransactionCategory } from "@/lib/types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Stack,
  IconButton,
  Divider,
  Button,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  useTheme,
  alpha,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
} from "@mui/material";
import {
  X,
  ShoppingBag,
  Plus,
  Trash2,
  Pen,
  Check,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTransactions } from "@/hooks/use-transactions";
import { useToast } from "@/hooks/use-toast";

interface ChildTransactionsDialogProps {
  open: boolean;
  onClose: () => void;
  parentTransaction: Transaction;
  onParentUpdated?: () => void;
}

interface ChildFormData {
  item: string;
  amount: number;
  quantity: number;
  category: TransactionCategory;
  subcategory: string;
}

const defaultChildForm: ChildFormData = {
  item: "",
  amount: 0,
  quantity: 1,
  category: "Outros" as TransactionCategory,
  subcategory: "",
};

export function ChildTransactionsDialog({
  open,
  onClose,
  parentTransaction,
  onParentUpdated,
}: ChildTransactionsDialogProps) {
  const [children, setChildren] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [childForm, setChildForm] = useState<ChildFormData>(defaultChildForm);

  const {
    getChildTransactions,
    addChildTransaction,
    updateChildTransaction,
    deleteChildTransaction,
    categories,
    subcategories,
  } = useTransactions();
  const { toast } = useToast();
  const theme = useTheme();

  // Carrega filhos ao abrir
  useEffect(() => {
    if (open) {
      loadChildren();
    }
  }, [open, parentTransaction.id]);

  const loadChildren = async () => {
    setIsLoading(true);
    try {
      const childTransactions = await getChildTransactions(
        parentTransaction.id
      );
      setChildren(childTransactions);
    } catch (error) {
      console.error("Erro ao carregar transações filhas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowAddForm(false);
    setEditingChildId(null);
    setChildForm(defaultChildForm);
    onClose();
  };

  const totalAmount =
    children.length > 0
      ? children.reduce(
          (sum, child) => sum + child.amount * (child.quantity || 1),
          0
        )
      : parentTransaction.amount;

  const currentSubcategories = subcategories[childForm.category] || [];

  // Adicionar nova filha
  const handleAddChild = async () => {
    if (!childForm.item.trim() || childForm.amount <= 0) {
      toast({
        variant: "error",
        title: "Preencha o nome e valor do item",
      });
      return;
    }

    setIsSaving(true);
    try {
      await addChildTransaction(parentTransaction.id, {
        item: childForm.item,
        amount: childForm.amount,
        quantity: childForm.quantity,
        category: childForm.category,
        subcategory: childForm.subcategory,
        date: parentTransaction.date,
        type: parentTransaction.type,
        walletId: parentTransaction.walletId,
        establishment: parentTransaction.establishment,
      });

      toast({ title: "Item adicionado!" });
      setChildForm(defaultChildForm);
      setShowAddForm(false);
      await loadChildren();
      onParentUpdated?.();
    } catch (error) {
      toast({ variant: "error", title: "Erro ao adicionar item" });
    } finally {
      setIsSaving(false);
    }
  };

  // Editar filha existente
  const handleStartEdit = (child: Transaction) => {
    setEditingChildId(child.id);
    setChildForm({
      item: child.item,
      amount: child.amount,
      quantity: child.quantity || 1,
      category: child.category,
      subcategory: child.subcategory || "",
    });
    setShowAddForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editingChildId || !childForm.item.trim() || childForm.amount <= 0) {
      toast({
        variant: "error",
        title: "Preencha o nome e valor do item",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateChildTransaction(parentTransaction.id, editingChildId, {
        item: childForm.item,
        amount: childForm.amount,
        quantity: childForm.quantity,
        category: childForm.category,
        subcategory: childForm.subcategory,
      });

      toast({ title: "Item atualizado!" });
      setEditingChildId(null);
      setChildForm(defaultChildForm);
      await loadChildren();
      onParentUpdated?.();
    } catch (error) {
      toast({ variant: "error", title: "Erro ao atualizar item" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingChildId(null);
    setChildForm(defaultChildForm);
  };

  // Deletar filha
  const handleDeleteChild = async (childId: string) => {
    setIsSaving(true);
    try {
      await deleteChildTransaction(parentTransaction.id, childId);
      toast({ title: "Item removido!" });
      await loadChildren();
      onParentUpdated?.();
    } catch (error) {
      toast({ variant: "error", title: "Erro ao remover item" });
    } finally {
      setIsSaving(false);
    }
  };

  // Formulário de item (usado para adicionar e editar)
  const renderItemForm = (isEditing: boolean = false) => (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        bgcolor: alpha(
          isEditing ? theme.palette.warning.main : theme.palette.primary.main,
          0.03
        ),
      }}
    >
      <Stack spacing={2}>
        <TextField
          label="Nome do Item"
          size="small"
          fullWidth
          value={childForm.item}
          onChange={(e) =>
            setChildForm((f) => ({ ...f, item: e.target.value }))
          }
          disabled={isSaving}
          autoFocus
          placeholder="Ex: Arroz, Feijão, etc."
        />

        <Stack direction="row" spacing={2}>
          <TextField
            label="Valor"
            size="small"
            type="number"
            value={childForm.amount || ""}
            onChange={(e) =>
              setChildForm((f) => ({
                ...f,
                amount: parseFloat(e.target.value) || 0,
              }))
            }
            disabled={isSaving}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">R$</InputAdornment>
              ),
            }}
            sx={{ flex: 2 }}
          />
          <TextField
            label="Qtd"
            size="small"
            type="number"
            value={childForm.quantity}
            onChange={(e) =>
              setChildForm((f) => ({
                ...f,
                quantity: parseInt(e.target.value) || 1,
              }))
            }
            disabled={isSaving}
            inputProps={{ min: 1 }}
            sx={{ flex: 1 }}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Categoria</InputLabel>
            <Select
              value={childForm.category}
              label="Categoria"
              onChange={(e) =>
                setChildForm((f) => ({
                  ...f,
                  category: e.target.value as TransactionCategory,
                  subcategory: "",
                }))
              }
              disabled={isSaving}
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Subcategoria</InputLabel>
            <Select
              value={childForm.subcategory}
              label="Subcategoria"
              onChange={(e) =>
                setChildForm((f) => ({ ...f, subcategory: e.target.value }))
              }
              disabled={isSaving || currentSubcategories.length === 0}
            >
              <MenuItem value="">Nenhuma</MenuItem>
              {currentSubcategories.map((sub) => (
                <MenuItem key={sub} value={sub}>
                  {sub}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            variant="outlined"
            size="small"
            onClick={isEditing ? handleCancelEdit : () => setShowAddForm(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={isEditing ? handleSaveEdit : handleAddChild}
            disabled={isSaving}
            startIcon={
              isSaving ? <CircularProgress size={14} /> : <Check size={14} />
            }
          >
            {isEditing ? "Salvar" : "Adicionar"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: "85vh",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              p: 1,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <ShoppingBag
              size={20}
              style={{ color: theme.palette.primary.main }}
            />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {parentTransaction.groupName ||
                parentTransaction.item ||
                parentTransaction.establishment ||
                "Transação"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {format(
                new Date(parentTransaction.date),
                "dd 'de' MMMM 'de' yyyy",
                {
                  locale: ptBR,
                }
              )}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={handleClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ p: 2 }}>
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 6,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Stack spacing={2}>
            {/* Lista de itens existentes */}
            {children.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  color: "text.secondary",
                  bgcolor: alpha(theme.palette.action.hover, 0.3),
                  borderRadius: 2,
                }}
              >
                <Package size={40} style={{ opacity: 0.3 }} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Nenhum subitem ainda.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Adicione itens para detalhar esta transação.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {children.map((child) => (
                  <Paper
                    key={child.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    {editingChildId === child.id ? (
                      renderItemForm(true)
                    ) : (
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.5}
                          sx={{ flex: 1, minWidth: 0 }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              width: 24,
                              height: 24,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "50%",
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: "primary.main",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          >
                            {child.quantity || 1}
                          </Typography>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {child.item}
                            </Typography>
                            <Stack direction="row" spacing={0.5} mt={0.25}>
                              {child.category && (
                                <Chip
                                  label={child.category}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: "0.65rem" }}
                                />
                              )}
                            </Stack>
                          </Box>
                        </Stack>

                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              color:
                                child.type === "income"
                                  ? "success.main"
                                  : "text.primary",
                            }}
                          >
                            R${" "}
                            {(child.amount * (child.quantity || 1)).toFixed(2)}
                          </Typography>

                          <IconButton
                            size="small"
                            onClick={() => handleStartEdit(child)}
                            disabled={isSaving}
                          >
                            <Pen size={14} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteChild(child.id)}
                            disabled={isSaving}
                            sx={{ color: "error.main" }}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </Stack>
                      </Stack>
                    )}
                  </Paper>
                ))}
              </Stack>
            )}

            {/* Formulário de adicionar */}
            <Collapse in={showAddForm}>{renderItemForm(false)}</Collapse>

            {/* Botão de adicionar */}
            {!showAddForm && !editingChildId && (
              <Button
                variant="outlined"
                startIcon={<Plus size={16} />}
                onClick={() => {
                  setChildForm({
                    ...defaultChildForm,
                    category:
                      parentTransaction.category ||
                      ("Outros" as TransactionCategory),
                  });
                  setShowAddForm(true);
                }}
                disabled={isSaving}
                fullWidth
              >
                Adicionar Item
              </Button>
            )}
          </Stack>
        )}
      </DialogContent>

      <Divider />

      {/* Footer com total */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.05),
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              {children.length} {children.length === 1 ? "item" : "itens"}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2" color="text.secondary">
              Total
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color:
                  parentTransaction.type === "income"
                    ? "success.main"
                    : "error.main",
              }}
            >
              {parentTransaction.type === "income" ? "+" : "-"}R${" "}
              {totalAmount.toFixed(2)}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Dialog>
  );
}
