// src/app/(app)/transactions/page.tsx
"use client";

import {
  Skeleton,
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Grid,
} from "@mui/material";
import { useTransactions } from "@/hooks/use-transactions";
import { useInfiniteTransactions } from "@/hooks/use-infinite-transactions";
import { columns } from "@/components/transactions/columns";
import { DataTable } from "@/components/transactions/data-table";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { ItemFilter } from "@/components/dashboard/item-filter";
import { TransactionCardList } from "@/components/transactions/transaction-card-list";
import { AddTransactionSheet } from "@/components/dashboard/add-transaction-sheet";
import { GamificationGuide, DailyQuestsCard } from "@/components/gamification";
import { PlusCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { startOfMonth } from "date-fns";
import { DateRange } from "@/lib/types";

export default function TransactionsPage() {
  const { categories, subcategories, loadTransactions } = useTransactions();

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // Usar scroll infinito
  const {
    transactions,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteTransactions({
    dateRange,
    category: selectedCategory,
    subcategory: selectedSubcategory,
    pageSize: 20,
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Filtrar subcategorias disponíveis baseado na categoria selecionada
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === "all") return [];
    return subcategories[selectedCategory as keyof typeof subcategories] || [];
  }, [selectedCategory, subcategories]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory("all"); // Reset subcategory when category changes
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid
        container
        spacing={{ xs: 2, sm: 3 }}
        columns={{ xs: 4, sm: 8, md: 12 }}
      >
        {/* Header */}
        <Grid size={{ xs: 4, sm: 8, md: 12 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "flex-start" },
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                gutterBottom
                sx={{ display: { xs: "none", md: "block" } }}
              >
                Transações
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Visualize e gerencie suas transações com scroll infinito.
              </Typography>
            </Box>

            {/* Add Transaction Button */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 1,
                width: { xs: "100%", md: "auto" },
              }}
            >
              <GamificationGuide sx={{ width: { xs: "100%", md: "auto" } }} />
              <AddTransactionSheet>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PlusCircle size={18} />}
                  sx={{ width: { xs: "100%", md: "auto" } }}
                >
                  Adicionar Transação
                </Button>
              </AddTransactionSheet>
            </Box>
          </Box>
        </Grid>

        {/* Filters */}
        <Grid size={{ xs: 4, sm: 8, md: 12 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              alignItems: { xs: "stretch", sm: "flex-start" },
            }}
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
          </Box>
        </Grid>

        {/* Missões de Transações */}
        <Grid size={{ xs: 4, sm: 8, md: 12 }}>
          <DailyQuestsCard pageContext="transactions" compact />
        </Grid>

        {/* Content */}
        <Grid size={{ xs: 4, sm: 8, md: 12 }}>
          {isLoading ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
            </Box>
          ) : isMobile ? (
            <TransactionCardList
              transactions={transactions}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
            />
          ) : (
            <DataTable
              columns={columns}
              data={transactions}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
