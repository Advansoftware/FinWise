"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Stack,
  Switch,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { X } from "lucide-react";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { SingleDatePicker } from "../single-date-picker";
import { useTransactions } from "@/hooks/use-transactions";
import { useWallets } from "@/hooks/use-wallets";

interface EditTransactionSheetProps {
  transaction: Transaction;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function EditTransactionSheet({
  transaction,
  isOpen,
  setIsOpen,
}: EditTransactionSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<Partial<Transaction>>({});
  const [updateAll, setUpdateAll] = useState(false);

  const { toast } = useToast();
  const { updateTransaction, categories, subcategories } = useTransactions();
  const { wallets } = useWallets();

  useEffect(() => {
    if (transaction) {
      setFormState({
        ...transaction,
        date: transaction.date || new Date().toISOString(),
      });
    }
  }, [transaction]);

  const handleInputChange = (field: keyof Transaction, value: any) => {
    if (field === "category") {
      setFormState((prev) => ({
        ...prev,
        [field]: value,
        subcategory: undefined,
      }));
    } else if (field === "subcategory" && value === "none") {
      setFormState((prev) => ({ ...prev, [field]: undefined }));
    } else {
      setFormState((prev) => ({ ...prev, [field]: value }));
    }
  };

  const availableSubcategories = useMemo(() => {
    const category = formState.category as TransactionCategory | undefined;
    if (!category) return [];
    return subcategories[category] || [];
  }, [formState.category, subcategories]);

  const handleSubmit = async () => {
    const { item, amount, date, category, walletId } = formState;
    if (!item || !amount || !date || !category || !walletId) {
      toast({
        variant: "error",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: Partial<Transaction> = {
        ...formState,
        date: new Date(formState.date || new Date()).toISOString(),
        amount: Number(formState.amount),
        quantity: Number(formState.quantity),
      };
      delete updates.id;

      await updateTransaction(transaction.id, updates, transaction);

      toast({
        title: "Sucesso!",
        description: "Sua transação foi atualizada.",
      });

      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: "error",
        title: "Erro",
        description: "Não foi possível atualizar a transação. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transaction) return null;

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={() => setIsOpen(false)}
      PaperProps={{
        sx: { width: { xs: "100%", sm: 540 }, p: 0 },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Editar Transação
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Modifique os detalhes da sua movimentação.
            </Typography>
          </Box>
          <IconButton onClick={() => setIsOpen(false)} size="small">
            <X size={20} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          <Stack spacing={4}>
            {/* Type Selection */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography variant="body2" fontWeight="medium" align="right">
                Tipo
              </Typography>
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
              >
                <Button
                  variant={
                    formState.type === "expense" ? "contained" : "outlined"
                  }
                  color="error"
                  onClick={() => handleInputChange("type", "expense")}
                  fullWidth
                >
                  Despesa
                </Button>
                <Button
                  variant={
                    formState.type === "income" ? "contained" : "outlined"
                  }
                  color="success"
                  onClick={() => handleInputChange("type", "income")}
                  fullWidth
                >
                  Receita
                </Button>
              </Box>
            </Box>

            {/* Item */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                component="label"
                htmlFor="item"
                variant="body2"
                fontWeight="medium"
                align="right"
              >
                Item
              </Typography>
              <TextField
                id="item"
                fullWidth
                size="small"
                value={formState.item || ""}
                onChange={(e) => handleInputChange("item", e.target.value)}
              />
            </Box>

            {/* Establishment */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                component="label"
                htmlFor="establishment"
                variant="body2"
                fontWeight="medium"
                align="right"
              >
                Local
              </Typography>
              <TextField
                id="establishment"
                fullWidth
                size="small"
                value={formState.establishment || ""}
                onChange={(e) =>
                  handleInputChange("establishment", e.target.value)
                }
              />
            </Box>

            {/* Quantity */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                component="label"
                htmlFor="quantity"
                variant="body2"
                fontWeight="medium"
                align="right"
              >
                Qtd.
              </Typography>
              <TextField
                id="quantity"
                type="number"
                fullWidth
                size="small"
                value={formState.quantity || 1}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
              />
            </Box>

            {/* Amount */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                component="label"
                htmlFor="amount"
                variant="body2"
                fontWeight="medium"
                align="right"
              >
                Valor
              </Typography>
              <TextField
                id="amount"
                type="number"
                fullWidth
                size="small"
                value={formState.amount || ""}
                onChange={(e) => handleInputChange("amount", e.target.value)}
              />
            </Box>

            {/* Date */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                component="label"
                htmlFor="date"
                variant="body2"
                fontWeight="medium"
                align="right"
              >
                Data
              </Typography>
              <Box>
                <SingleDatePicker
                  date={new Date(formState.date || new Date())}
                  setDate={(d) =>
                    handleInputChange(
                      "date",
                      d?.toISOString() || new Date().toISOString()
                    )
                  }
                />
              </Box>
            </Box>

            {/* Wallet */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                component="label"
                htmlFor="wallet"
                variant="body2"
                fontWeight="medium"
                align="right"
              >
                Carteira
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={formState.walletId || ""}
                  onChange={(e) =>
                    handleInputChange("walletId", e.target.value)
                  }
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Selecione uma carteira
                  </MenuItem>
                  {wallets.map((wallet) => (
                    <MenuItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Category */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                component="label"
                htmlFor="category"
                variant="body2"
                fontWeight="medium"
                align="right"
              >
                Categoria
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={formState.category || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "category",
                      e.target.value as TransactionCategory
                    )
                  }
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Selecione uma categoria
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem
                      key={cat}
                      value={cat}
                      sx={{ textTransform: "capitalize" }}
                    >
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Subcategory */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                component="label"
                htmlFor="subcategory"
                variant="body2"
                fontWeight="medium"
                align="right"
              >
                Subcategoria
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={formState.subcategory || "none"}
                  onChange={(e) =>
                    handleInputChange("subcategory", e.target.value)
                  }
                  disabled={
                    !formState.category || availableSubcategories.length === 0
                  }
                >
                  <MenuItem value="none">Nenhuma</MenuItem>
                  {availableSubcategories.map((sub) => (
                    <MenuItem key={sub} value={sub}>
                      {sub}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Update All */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                component="label"
                htmlFor="update-all"
                variant="body2"
                fontWeight="medium"
                align="right"
              >
                Aplicar a todos
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Switch
                  id="update-all"
                  checked={updateAll}
                  onChange={(e) => setUpdateAll(e.target.checked)}
                />
                <Typography variant="caption" color="text.secondary">
                  Atualizar para todos os itens "{transaction.item}"
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 3,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          <Button variant="outlined" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <CircularProgress size={16} sx={{ mr: 1 }} />}
            Salvar Alterações
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
