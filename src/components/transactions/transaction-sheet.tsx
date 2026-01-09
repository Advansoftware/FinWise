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
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Autocomplete,
  InputAdornment,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Grid,
  Tooltip,
} from "@mui/material";
import {
  Transaction,
  TransactionCategory,
  FamilyVisibility,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Save, Users, User } from "lucide-react";
import { SingleDatePicker } from "../single-date-picker";
import { useTransactions } from "@/hooks/use-transactions";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { useFamily } from "@/hooks/use-family";
import { safeLowerCase } from "@/lib/string-utils";

interface TransactionSheetProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: Transaction;
  mode?: "create" | "edit";
}

export function TransactionSheet({
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  initialData,
  mode = "create",
}: TransactionSheetProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(open);
    }
    onOpenChange?.(open);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { toast } = useToast();
  const {
    addTransaction,
    updateTransaction,
    categories,
    subcategories,
    allTransactions,
  } = useTransactions();
  const { wallets } = useWallets();
  const { user } = useAuth();
  const { isInFamily } = useFamily();

  const [formState, setFormState] = useState({
    item: "",
    establishment: "",
    quantity: "1",
    amount: "",
    date: new Date(),
    category: "" as TransactionCategory | "",
    subcategory: "",
    type: "expense" as "income" | "expense" | "transfer",
    walletId: "",
    toWalletId: "",
    familyVisibility: "shared" as FamilyVisibility,
  });

  const [itemInputValue, setItemInputValue] = useState("");

  useEffect(() => {
    if (isOpen && initialData) {
      setFormState({
        item: initialData.item,
        establishment: initialData.establishment || "",
        quantity: String(initialData.quantity || 1),
        amount: String(initialData.amount),
        date: new Date(initialData.date),
        category: initialData.category,
        subcategory: initialData.subcategory || "",
        type: initialData.type || "expense",
        walletId: initialData.walletId,
        toWalletId: initialData.toWalletId || "",
        familyVisibility: initialData.familyVisibility || "shared",
      });
      setItemInputValue(initialData.item);
    } else if (isOpen && !initialData) {
      resetForm();
    }
  }, [isOpen, initialData]);

  const uniqueTransactions = useMemo(() => {
    const seen = new Set<string>();
    return allTransactions.filter((t) => {
      const itemLower = safeLowerCase(t.item);
      const duplicate = seen.has(itemLower);
      seen.add(itemLower);
      return !duplicate;
    });
  }, [allTransactions]);

  const resetForm = () => {
    setFormState({
      item: "",
      establishment: "",
      quantity: "1",
      amount: "",
      date: new Date(),
      category: "",
      subcategory: "",
      type: "expense",
      walletId: "",
      toWalletId: "",
      familyVisibility: "shared",
    });
    setItemInputValue("");
  };

  const handleInputChange = (field: keyof typeof formState, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));

    if (field === "category") {
      setFormState((prev) => ({ ...prev, subcategory: "" }));
    }

    if (field === "type") {
      if (value === "transfer") {
        setFormState((prev) => ({
          ...prev,
          category: "Transferência",
          item: "Transferência entre contas",
        }));
        setItemInputValue("Transferência entre contas");
      } else if (formState.category === "Transferência") {
        setFormState((prev) => ({ ...prev, category: "", item: "" }));
        setItemInputValue("");
      }
    }
  };

  const handleItemSelect = (
    event: any,
    newValue: Transaction | string | null
  ) => {
    if (typeof newValue === "string") {
      setItemInputValue(newValue);
      handleInputChange("item", newValue);
    } else if (newValue && typeof newValue === "object") {
      setFormState((prev) => ({
        ...prev,
        item: newValue.item,
        establishment: newValue.establishment || "",
        amount: String(newValue.amount),
        category: newValue.category,
        subcategory: newValue.subcategory || "",
      }));
      setItemInputValue(newValue.item);
    } else {
      setItemInputValue("");
      handleInputChange("item", "");
    }
  };

  const availableSubcategories = useMemo(() => {
    if (!formState.category) return [];
    return (subcategories as any)[formState.category] || [];
  }, [formState.category, subcategories]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const finalItem = itemInputValue || formState.item;
    const { amount, date, category, walletId, toWalletId, type } = formState;

    if (!finalItem || !amount || !date) {
      toast({
        variant: "error",
        title: "Campos obrigatórios",
        description: "Por favor, preencha Item, Valor e Data.",
      });
      return;
    }

    if (type === "transfer") {
      if (!walletId || !toWalletId) {
        toast({
          variant: "error",
          title: "Campos obrigatórios",
          description:
            "Para transferências, as carteiras de origem e destino são obrigatórias.",
        });
        return;
      }
      if (walletId === toWalletId) {
        toast({
          variant: "error",
          title: "Seleção Inválida",
          description:
            "A carteira de origem não pode ser a mesma que a de destino.",
        });
        return;
      }
    } else {
      if (!walletId || !category) {
        toast({
          variant: "error",
          title: "Campos obrigatórios",
          description: "Por favor, preencha Categoria e Carteira.",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const transactionData = {
        userId: user?.uid || "",
        ...formState,
        item: finalItem,
        amount: parseFloat(formState.amount),
        date: formState.date.toISOString(),
        quantity: parseInt(formState.quantity),
        walletId,
        toWalletId:
          formState.type === "transfer" ? formState.toWalletId : undefined,
        category:
          formState.type === "transfer"
            ? "Transferência"
            : ((formState.category || "Outros") as TransactionCategory),
        familyVisibility: isInFamily ? formState.familyVisibility : undefined,
      };

      if (mode === "create") {
        await addTransaction(transactionData);
        toast({
          title: "Sucesso!",
          description: "Sua transação foi adicionada.",
        });
        resetForm();
      } else if (mode === "edit" && initialData) {
        await updateTransaction(initialData.id, transactionData, initialData);
        toast({
          title: "Sucesso!",
          description: "Sua transação foi atualizada.",
        });
      }

      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: "error",
        title: "Erro",
        description: `Não foi possível ${
          mode === "create" ? "adicionar" : "atualizar"
        } a transação. Tente novamente.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeDescriptions = {
    expense: "Registra uma saída de dinheiro.",
    income: "Registra uma entrada de dinheiro.",
    transfer: "Move dinheiro entre carteiras.",
  };

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }
      setIsOpen(open);
      if (!open && mode === "create") resetForm();
    };

  return (
    <>
      {children && (
        <Box
          onClick={toggleDrawer(true)}
          sx={{
            display: { xs: "block", sm: "inline-block" },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          {children}
        </Box>
      )}
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={isOpen}
        onClose={toggleDrawer(false)}
        sx={{
          zIndex: 1300,
        }}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : 450,
            maxWidth: "100%",
            height: isMobile ? "100%" : "100%",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 3,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {mode === "create" ? "Adicionar Transação" : "Editar Transação"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {mode === "create"
                  ? "Insira os detalhes da sua movimentação."
                  : "Modifique os detalhes da sua movimentação."}
              </Typography>
            </Box>
            <IconButton onClick={() => setIsOpen(false)} size="small">
              <X size={20} />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", p: 3 }}>
            <Grid container spacing={3} columns={{ xs: 4, sm: 4, md: 4 }}>
              {/* Tipo de Transação */}
              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="medium"
                  gutterBottom
                >
                  Tipo
                </Typography>
                <ToggleButtonGroup
                  value={formState.type}
                  exclusive
                  onChange={(e, value) =>
                    value && handleInputChange("type", value)
                  }
                  fullWidth
                  size="small"
                  sx={{
                    "& .MuiToggleButton-root": {
                      border: "1px solid",
                      borderColor: "divider",
                    },
                    '& .MuiToggleButton-root[value="expense"]': {
                      "&.Mui-selected": {
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                        borderColor: "#ef4444",
                        color: "#ef4444",
                        "&:hover": {
                          backgroundColor: "rgba(239, 68, 68, 0.25)",
                        },
                      },
                    },
                    '& .MuiToggleButton-root[value="income"]': {
                      "&.Mui-selected": {
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        borderColor: "#10b981",
                        color: "#10b981",
                        "&:hover": {
                          backgroundColor: "rgba(16, 185, 129, 0.25)",
                        },
                      },
                    },
                    '& .MuiToggleButton-root[value="transfer"]': {
                      "&.Mui-selected": {
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        borderColor: "#3b82f6",
                        color: "#3b82f6",
                        "&:hover": {
                          backgroundColor: "rgba(59, 130, 246, 0.25)",
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="expense">Despesa</ToggleButton>
                  <ToggleButton value="income">Receita</ToggleButton>
                  <ToggleButton value="transfer">Transferência</ToggleButton>
                </ToggleButtonGroup>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  {typeDescriptions[formState.type]}
                </Typography>
              </Grid>

              {/* Valor */}
              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <TextField
                  label="Valor"
                  placeholder="0.00"
                  type="text"
                  value={formState.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">R$</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Data */}
              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="medium"
                  gutterBottom
                >
                  Data
                </Typography>
                <SingleDatePicker
                  date={formState.date}
                  setDate={(d) => handleInputChange("date", d)}
                />
              </Grid>

              {formState.type === "transfer" ? (
                <>
                  {/* De (Origem) */}
                  <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>De (Origem)</InputLabel>
                      <Select
                        value={formState.walletId}
                        label="De (Origem)"
                        onChange={(e) =>
                          handleInputChange("walletId", e.target.value)
                        }
                        MenuProps={{ sx: { zIndex: 1400 } }}
                      >
                        {wallets.map((wallet) => (
                          <MenuItem key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Para (Destino) */}
                  <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Para (Destino)</InputLabel>
                      <Select
                        value={formState.toWalletId}
                        label="Para (Destino)"
                        onChange={(e) =>
                          handleInputChange("toWalletId", e.target.value)
                        }
                        MenuProps={{ sx: { zIndex: 1400 } }}
                      >
                        {wallets
                          .filter((w) => w.id !== formState.walletId)
                          .map((wallet) => (
                            <MenuItem key={wallet.id} value={wallet.id}>
                              {wallet.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              ) : (
                <>
                  {/* Item com Autocomplete */}
                  <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                    <Autocomplete
                      freeSolo
                      options={uniqueTransactions}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option.item
                      }
                      value={itemInputValue}
                      onChange={handleItemSelect}
                      onInputChange={(event, newInputValue) => {
                        setItemInputValue(newInputValue);
                        handleInputChange("item", newInputValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Item"
                          placeholder="Ex: Café, Aluguel..."
                          fullWidth
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <li key={key} {...otherProps}>
                            <Box>
                              <Typography variant="body1">
                                {typeof option === "string"
                                  ? option
                                  : option.item}
                              </Typography>
                              {typeof option !== "string" && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {option.category} •{" "}
                                  {option.establishment ||
                                    "Sem estabelecimento"}
                                </Typography>
                              )}
                            </Box>
                          </li>
                        );
                      }}
                    />
                  </Grid>

                  {/* Estabelecimento */}
                  <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                    <TextField
                      label="Estabelecimento"
                      placeholder="Ex: Padaria do Zé"
                      value={formState.establishment}
                      onChange={(e) =>
                        handleInputChange("establishment", e.target.value)
                      }
                      fullWidth
                    />
                  </Grid>

                  {/* Quantidade */}
                  <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                    <TextField
                      label="Quantidade"
                      type="text"
                      value={formState.quantity}
                      onChange={(e) =>
                        handleInputChange("quantity", e.target.value)
                      }
                      fullWidth
                    />
                  </Grid>

                  {/* Carteira */}
                  <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Carteira</InputLabel>
                      <Select
                        value={formState.walletId}
                        label="Carteira"
                        onChange={(e) =>
                          handleInputChange("walletId", e.target.value)
                        }
                        MenuProps={{ sx: { zIndex: 1400 } }}
                      >
                        {wallets.map((wallet) => (
                          <MenuItem key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Categoria */}
                  <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Categoria</InputLabel>
                      <Select
                        value={formState.category}
                        label="Categoria"
                        onChange={(e) =>
                          handleInputChange("category", e.target.value)
                        }
                        MenuProps={{ sx: { zIndex: 1400 } }}
                      >
                        {categories
                          .filter((c) => c !== "Transferência")
                          .map((cat) => (
                            <MenuItem key={cat} value={cat}>
                              {cat}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Subcategoria */}
                  <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                    <FormControl
                      fullWidth
                      disabled={
                        !formState.category ||
                        availableSubcategories.length === 0
                      }
                    >
                      <InputLabel>Subcategoria</InputLabel>
                      <Select
                        value={formState.subcategory}
                        label="Subcategoria"
                        onChange={(e) =>
                          handleInputChange("subcategory", e.target.value)
                        }
                        MenuProps={{ sx: { zIndex: 1400 } }}
                      >
                        <MenuItem value="">
                          <em>Nenhuma</em>
                        </MenuItem>
                        {availableSubcategories.map((sub: string) => (
                          <MenuItem key={sub} value={sub}>
                            {sub}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Visibilidade Familiar */}
                  {isInFamily && (
                    <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight="medium"
                        gutterBottom
                      >
                        Visibilidade
                      </Typography>
                      <ToggleButtonGroup
                        value={formState.familyVisibility}
                        exclusive
                        onChange={(e, value) =>
                          value && handleInputChange("familyVisibility", value)
                        }
                        fullWidth
                        size="small"
                        sx={{
                          "& .MuiToggleButton-root": {
                            border: "1px solid",
                            borderColor: "divider",
                          },
                          '& .MuiToggleButton-root[value="private"]': {
                            "&.Mui-selected": {
                              backgroundColor: "rgba(156, 163, 175, 0.15)",
                              borderColor: "#9ca3af",
                              color: "#6b7280",
                              "&:hover": {
                                backgroundColor: "rgba(156, 163, 175, 0.25)",
                              },
                            },
                          },
                          '& .MuiToggleButton-root[value="shared"]': {
                            "&.Mui-selected": {
                              backgroundColor: "rgba(59, 130, 246, 0.15)",
                              borderColor: "#3b82f6",
                              color: "#3b82f6",
                              "&:hover": {
                                backgroundColor: "rgba(59, 130, 246, 0.25)",
                              },
                            },
                          },
                        }}
                      >
                        <Tooltip title="Apenas você verá esta transação">
                          <ToggleButton value="private">
                            <User size={16} style={{ marginRight: 6 }} />
                            Pessoal
                          </ToggleButton>
                        </Tooltip>
                        <Tooltip title="Todos os membros da família verão esta transação">
                          <ToggleButton value="shared">
                            <Users size={16} style={{ marginRight: 6 }} />
                            Família
                          </ToggleButton>
                        </Tooltip>
                      </ToggleButtonGroup>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: "block" }}
                      >
                        {formState.familyVisibility === "private"
                          ? "Esta transação ficará visível apenas para você."
                          : "Esta transação será compartilhada com a família."}
                      </Typography>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </Box>

          {/* Footer */}
          <Box
            sx={{ p: 3, borderTop: 1, borderColor: "divider", flexShrink: 0 }}
          >
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSubmit}
              disabled={isSubmitting || wallets.length === 0}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : mode === "create" ? (
                  <Plus />
                ) : (
                  <Save />
                )
              }
            >
              {wallets.length === 0
                ? "Crie uma carteira primeiro"
                : mode === "create"
                ? "Salvar Transação"
                : "Salvar Alterações"}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
