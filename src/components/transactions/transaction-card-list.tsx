"use client";

import { useState, useCallback } from "react";
import { Transaction } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  CardActions,
  Chip,
  Button,
  Box,
  Stack,
  useTheme,
  alpha,
  Badge,
} from "@mui/material";
import { CategoryIcon } from "../icons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MoreVertical,
  Pen,
  Trash2,
  ArrowDown,
  Layers,
  Package,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/mui-wrappers/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/mui-wrappers/alert-dialog";
import { EditTransactionSheet } from "./edit-transaction-sheet";
import { ChildTransactionsDialog } from "./child-transactions-dialog";
import { useTransactions } from "@/hooks/use-transactions";
import { useToast } from "@/hooks/use-toast";

interface TransactionCardListProps {
  transactions: Transaction[];
}

export function TransactionCardList({
  transactions,
}: TransactionCardListProps) {
  if (transactions.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 12, px: 4, color: "text.secondary" }}>
        <Typography
          variant="body1"
          sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}
        >
          Nenhuma transação encontrada.
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, mt: 2 }}
        >
          Tente selecionar outro período ou filtro.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={{ xs: 3, sm: 4 }}>
      {transactions.map((transaction) => (
        <TransactionCard key={transaction.id} transaction={transaction} />
      ))}
    </Stack>
  );
}

function TransactionCard({ transaction }: { transaction: Transaction }) {
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isChildrenDialogOpen, setIsChildrenDialogOpen] = useState(false);
  const { deleteTransaction } = useTransactions();
  const { toast } = useToast();
  const theme = useTheme();

  const handleDelete = async () => {
    try {
      await deleteTransaction(transaction);
      toast({ title: "Transação excluída com sucesso." });
    } catch (error) {
      toast({ variant: "error", title: "Erro ao excluir transação." });
    }
  };

  // Abrir modal de subitens ao clicar no card (se tiver filhos) ou botão do menu
  const handleOpenSubitems = useCallback(() => {
    setIsChildrenDialogOpen(true);
  }, []);

  const handleCardClick = () => {
    // Só abre ao clicar no card se já tiver filhos
    if (transaction.hasChildren && (transaction.childrenCount || 0) > 0) {
      handleOpenSubitems();
    }
  };

  // Callback quando o pai é atualizado (filhos adicionados/removidos)
  const handleParentUpdated = useCallback(() => {
    // O refresh já é feito pelo hook, mas podemos usar isso para UI local se necessário
  }, []);

  const isGrouped =
    transaction.hasChildren && (transaction.childrenCount || 0) > 0;

  // Não mostra transações filhas na lista principal
  if (transaction.parentId) {
    return null;
  }

  return (
    <>
      <EditTransactionSheet
        transaction={transaction}
        isOpen={isEditSheetOpen}
        setIsOpen={setIsEditSheetOpen}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a
              transação "{transaction.item}"
              {isGrouped && ` e seus ${transaction.childrenCount} itens`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              sx={{
                bgcolor: "error.main",
                "&:hover": { bgcolor: "error.dark" },
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal sempre disponível para qualquer transação */}
      <ChildTransactionsDialog
        open={isChildrenDialogOpen}
        onClose={() => setIsChildrenDialogOpen(false)}
        parentTransaction={transaction}
        onParentUpdated={handleParentUpdated}
      />

      <Card
        sx={{
          transition: "all 0.2s",
          cursor: isGrouped ? "pointer" : "default",
          "&:hover": {
            bgcolor: "action.hover",
            ...(isGrouped && {
              transform: "translateY(-2px)",
              boxShadow: theme.shadows[4],
            }),
          },
        }}
        onClick={handleCardClick}
      >
        <CardHeader sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={{ xs: 2, sm: 3 }}
              sx={{ flex: 1, minWidth: 0 }}
            >
              <Badge
                badgeContent={isGrouped ? transaction.childrenCount : 0}
                color="primary"
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: "0.65rem",
                    height: 18,
                    minWidth: 18,
                  },
                }}
              >
                <Box
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: "50%",
                    flexShrink: 0,
                    bgcolor: isGrouped
                      ? alpha(theme.palette.primary.main, 0.2)
                      : transaction.type === "income"
                      ? alpha(theme.palette.success.main, 0.2)
                      : "action.selected",
                  }}
                >
                  {isGrouped ? (
                    <Layers
                      style={{
                        width: 16,
                        height: 16,
                        color: theme.palette.primary.main,
                      }}
                    />
                  ) : transaction.type === "income" ? (
                    <ArrowDown
                      style={{
                        width: 16,
                        height: 16,
                        color: theme.palette.success.main,
                      }}
                    />
                  ) : (
                    <CategoryIcon
                      category={transaction.category}
                      style={{ width: 16, height: 16 }}
                    />
                  )}
                </Box>
              </Badge>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {transaction.groupName || transaction.item}
                </Typography>
                {transaction.establishment && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.75rem",
                      color: "text.secondary",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {transaction.establishment}
                  </Typography>
                )}
                {isGrouped && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.7rem",
                      color: "primary.main",
                      mt: 0.5,
                    }}
                  >
                    Clique para ver {transaction.childrenCount}{" "}
                    {transaction.childrenCount === 1 ? "item" : "itens"}
                  </Typography>
                )}
              </Box>
            </Stack>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="text"
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    height: 32,
                    width: 32,
                    minWidth: 32,
                    flexShrink: 0,
                    p: 0,
                  }}
                >
                  <MoreVertical style={{ width: 16, height: 16 }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditSheetOpen(true)}>
                  <Pen style={{ marginRight: 8, width: 16, height: 16 }} />{" "}
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenSubitems}>
                  <Package style={{ marginRight: 8, width: 16, height: 16 }} />{" "}
                  Subitens {isGrouped && `(${transaction.childrenCount})`}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  sx={{ color: "error.main" }}
                >
                  <Trash2 style={{ marginRight: 8, width: 16, height: 16 }} />{" "}
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Stack>
        </CardHeader>

        <CardContent sx={{ p: { xs: 3, sm: 4 }, pt: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            spacing={2}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontSize: "0.75rem", color: "text.secondary" }}
              >
                Valor
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "1.125rem", sm: "1.25rem" },
                  fontWeight: 700,
                  color:
                    transaction.type === "income"
                      ? "success.main"
                      : "error.main",
                }}
              >
                {transaction.type === "income" ? "+" : "-"}R${" "}
                {transaction.amount.toFixed(2)}
              </Typography>
            </Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-end", sm: "center" }}
              spacing={{ xs: 1, sm: 2 }}
            >
              <Chip
                variant="outlined"
                label={transaction.category}
                sx={{ fontSize: "0.75rem" }}
              />
              {transaction.subcategory && (
                <Chip
                  variant="filled"
                  color="secondary"
                  label={transaction.subcategory}
                  sx={{ fontSize: "0.75rem" }}
                />
              )}
            </Stack>
          </Stack>
        </CardContent>

        <CardActions
          sx={{
            p: { xs: 3, sm: 4 },
            fontSize: "0.75rem",
            color: "text.secondary",
            bgcolor: "action.hover",
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: "100%" }}
          >
            <Typography
              component="span"
              variant="body2"
              sx={{ fontSize: "0.75rem" }}
            >
              {format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </Typography>
            {transaction.quantity && transaction.quantity > 1 && (
              <Typography
                component="span"
                variant="body2"
                sx={{ fontSize: "0.75rem" }}
              >
                Qtd: {transaction.quantity}
              </Typography>
            )}
          </Stack>
        </CardActions>
      </Card>
    </>
  );
}
