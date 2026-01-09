// src/components/transactions/smart-rule-action.tsx
// Componente para criar regra inteligente a partir de uma transação

"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  Checkbox,
  FormControlLabel,
  Chip,
  CircularProgress,
  alpha,
} from "@mui/material";
import { Wand2, Sparkles, Check } from "lucide-react";
import { Transaction } from "@/lib/types";
import { useSmartTransactions } from "@/hooks/use-smart-transactions";
import { useWallets } from "@/hooks/use-wallets";

interface SmartRuleActionProps {
  transaction: Transaction;
  onRuleCreated?: () => void;
}

export function SmartRuleAction({
  transaction,
  onRuleCreated,
}: SmartRuleActionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [applyToExisting, setApplyToExisting] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{
    rule: any;
    appliedCount: number;
  } | null>(null);

  const { createRuleFromTransaction } = useSmartTransactions();
  const { wallets } = useWallets();

  const merchantName = transaction.establishment || transaction.item;
  const walletName = wallets.find((w) => w.id === transaction.walletId)?.name;

  const handleCreateRule = async () => {
    setIsCreating(true);
    try {
      const res = await createRuleFromTransaction(transaction, applyToExisting);
      if (res) {
        setResult(res);
        onRuleCreated?.();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setResult(null);
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<Wand2 size={16} />}
        onClick={() => setIsDialogOpen(true)}
        sx={{
          borderStyle: "dashed",
          color: "primary.main",
          borderColor: "primary.main",
          "&:hover": {
            borderStyle: "solid",
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        Aplicar a similares
      </Button>

      <Dialog
        open={isDialogOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        {!result ? (
          <>
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Sparkles size={24} color="#f59e0b" />
                <Typography variant="h6" fontWeight="bold">
                  Criar Regra Inteligente
                </Typography>
              </Stack>
            </DialogTitle>

            <DialogContent>
              <Stack spacing={3}>
                <Typography color="text.secondary">
                  Ao criar uma regra para{" "}
                  <strong>&quot;{merchantName}&quot;</strong>, todas as
                  transações futuras deste estabelecimento serão automaticamente
                  categorizadas.
                </Typography>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    border: 1,
                    borderColor: "primary.main",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Configuração da Regra
                  </Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Estabelecimento
                      </Typography>
                      <Chip label={merchantName} size="small" />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Categoria
                      </Typography>
                      <Chip
                        label={transaction.category}
                        size="small"
                        color="primary"
                      />
                    </Stack>
                    {transaction.subcategory && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Subcategoria
                        </Typography>
                        <Chip label={transaction.subcategory} size="small" />
                      </Stack>
                    )}
                    {walletName && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Carteira Padrão
                        </Typography>
                        <Chip label={walletName} size="small" />
                      </Stack>
                    )}
                  </Stack>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={applyToExisting}
                      onChange={(e) => setApplyToExisting(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Stack>
                      <Typography variant="body2">
                        Aplicar a transações existentes
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Atualiza automaticamente todas as transações anteriores
                        deste estabelecimento
                      </Typography>
                    </Stack>
                  }
                />
              </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button onClick={handleClose} disabled={isCreating}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateRule}
                disabled={isCreating}
                startIcon={
                  isCreating ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Wand2 size={16} />
                  )
                }
              >
                {isCreating ? "Criando..." : "Criar Regra"}
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                    color: "white",
                    display: "flex",
                  }}
                >
                  <Check size={20} />
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  Regra Criada!
                </Typography>
              </Stack>
            </DialogTitle>

            <DialogContent>
              <Stack spacing={2} alignItems="center" sx={{ py: 2 }}>
                <Typography textAlign="center">
                  A regra para <strong>&quot;{merchantName}&quot;</strong> foi
                  criada com sucesso.
                </Typography>

                {result.appliedCount > 0 && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: (theme) =>
                        alpha(theme.palette.success.main, 0.1),
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      color="success.main"
                    >
                      {result.appliedCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      transações atualizadas automaticamente
                    </Typography>
                  </Box>
                )}

                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  A partir de agora, todas as transações de &quot;{merchantName}
                  &quot; serão categorizadas automaticamente como{" "}
                  <strong>{transaction.category}</strong>.
                </Typography>
              </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button variant="contained" onClick={handleClose} fullWidth>
                Entendi!
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
