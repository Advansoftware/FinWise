// src/app/(app)/transactions/page.tsx
"use client";

import {
  Skeleton,
  Stack,
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useTransactions } from "@/hooks/use-transactions";
import { columns } from "@/components/transactions/columns";
import { DataTable } from "@/components/transactions/data-table";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { ItemFilter } from "@/components/dashboard/item-filter";
import { TransactionCardList } from "@/components/transactions/transaction-card-list";
import { AddTransactionSheet } from "@/components/dashboard/add-transaction-sheet";
import { GamificationGuide, DailyQuestsCard } from "@/components/gamification";
import { PlusCircle } from "lucide-react";

export default function TransactionsPage() {
  const {
    isLoading,
    filteredTransactions,
    dateRange,
    setDateRange,
    categories,
    handleCategoryChange,
    selectedCategory,
    availableSubcategories,
    selectedSubcategory,
    setSelectedSubcategory,
  } = useTransactions();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "flex-start" }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Transações
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualize e gerencie suas transações com filtros e paginação.
          </Typography>
        </Box>

        {/* Add Transaction Button */}
        <Stack direction="row" spacing={1} alignItems="center">
          <GamificationGuide />
          <AddTransactionSheet>
            <Button
              variant="contained"
              fullWidth={isMobile}
              startIcon={<PlusCircle size={18} />}
            >
              Adicionar Transação
            </Button>
          </AddTransactionSheet>
        </Stack>
      </Stack>

      {/* Filters */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "flex-start" }}
      >
        <DateRangePicker initialDate={dateRange} onUpdate={setDateRange} />
        <ItemFilter
          placeholder="Todas as Categorias"
          items={["all", ...categories]}
          selectedItem={selectedCategory}
          onItemSelected={handleCategoryChange}
        />
        <ItemFilter
          placeholder="Todas as Subcategorias"
          items={["all", ...availableSubcategories]}
          selectedItem={selectedSubcategory}
          onItemSelected={setSelectedSubcategory}
          disabled={selectedCategory === "all"}
        />
      </Stack>

      {/* Missões de Transações */}
      <DailyQuestsCard pageContext="transactions" compact />

      {/* Content */}
      {isLoading ? (
        <Stack spacing={2}>
          <Skeleton
            variant="rectangular"
            height={48}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={400}
            sx={{ borderRadius: 2 }}
          />
        </Stack>
      ) : isMobile ? (
        <TransactionCardList transactions={filteredTransactions} />
      ) : (
        <DataTable columns={columns} data={filteredTransactions} />
      )}
    </Stack>
  );
}
