// src/app/(app)/dashboard/page.tsx
"use client";

import { Button, Stack, Box, Typography, Skeleton, Grid } from "@mui/material";
import { PlusCircle, ScanLine } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ItemFilter } from "@/components/dashboard/item-filter";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { AITipCard } from "@/components/dashboard/ai-tip-card";
import { AddTransactionSheet } from "@/components/dashboard/add-transaction-sheet";
import { ScanQRCodeDialog } from "@/components/dashboard/scan-qr-code-dialog";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { GoalHighlightCard } from "@/components/goals/goal-highlight-card";
import { FutureBalanceCard } from "@/components/dashboard/future-balance-card";
import { usePlan } from "@/hooks/use-plan";

export default function DashboardPage() {
  const {
    isLoading,
    filteredTransactions,
    chartData,
    dateRange,
    setDateRange,
    categories,
    handleCategoryChange,
    selectedCategory,
    availableSubcategories,
    selectedSubcategory,
    setSelectedSubcategory,
  } = useTransactions();
  const { isPro, isPlus } = usePlan();

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      {/* Header - Mobile First */}
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.5rem", sm: "1.875rem" },
              fontWeight: "bold",
              letterSpacing: "-0.025em",
            }}
          >
            Painel
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
          >
            Aqui está uma visão geral das suas finanças.
          </Typography>
        </Box>

        {/* Action Buttons - Mobile Stack, Desktop Side by Side */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <AddTransactionSheet>
            <Button
              variant="contained"
              fullWidth
              startIcon={<PlusCircle size={18} />}
              sx={{ flex: { sm: "none" }, minWidth: { sm: "auto" } }}
            >
              Nova Transação
            </Button>
          </AddTransactionSheet>
          {isPro && (
            <ScanQRCodeDialog>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ScanLine size={18} />}
                sx={{ flex: { sm: "none" }, minWidth: { sm: "auto" } }}
              >
                Escanear QRCode
              </Button>
            </ScanQRCodeDialog>
          )}
        </Stack>
      </Stack>

      {/* Filters - Responsive */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ flexWrap: { sm: "wrap" } }}
      >
        <Box sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 200 } }}>
          <DateRangePicker initialDate={dateRange} onUpdate={setDateRange} />
        </Box>
        <Box
          sx={{
            width: { xs: "100%", sm: "auto" },
            flex: { sm: 1 },
            maxWidth: { sm: 200 },
          }}
        >
          <ItemFilter
            placeholder="Todas as Categorias"
            items={["all", ...categories]}
            selectedItem={selectedCategory}
            onItemSelected={handleCategoryChange}
          />
        </Box>
        <Box
          sx={{
            width: { xs: "100%", sm: "auto" },
            flex: { sm: 1 },
            maxWidth: { sm: 200 },
          }}
        >
          <ItemFilter
            placeholder="Todas as Subcategorias"
            items={["all", ...availableSubcategories]}
            selectedItem={selectedSubcategory}
            onItemSelected={setSelectedSubcategory}
            disabled={selectedCategory === "all"}
          />
        </Box>
      </Stack>

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Main Grid - 12 column system for precise control */}
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", lg: "repeat(12, 1fr)" }}
            gap={{ xs: 2, sm: 3 }}
          >
            {/* Stats Cards - Full width on mobile, 8 cols on desktop */}
            <Box sx={{ gridColumn: { xs: "1", lg: "span 8" } }}>
              <StatsCards transactions={filteredTransactions} />
            </Box>

            {/* Wallet Summary - Full width on mobile, 4 cols on desktop */}
            <Box sx={{ gridColumn: { xs: "1", lg: "span 4" } }}>
              <WalletCard transactions={filteredTransactions} />
            </Box>

            {/* Spending Chart - Full width on mobile, 8 cols on desktop */}
            <Box sx={{ gridColumn: { xs: "1", lg: "span 8" } }}>
              <SpendingChart data={chartData} />
            </Box>

            {/* AI Tip - Full width on mobile, 4 cols on desktop */}
            {isPro && (
              <Box sx={{ gridColumn: { xs: "1", lg: "span 4" } }}>
                <AITipCard transactions={filteredTransactions} />
              </Box>
            )}

            {/* Recent Transactions - Full width on mobile, 8 cols on desktop */}
            <Box sx={{ gridColumn: { xs: "1", lg: "span 8" } }}>
              <RecentTransactions transactions={filteredTransactions} />
            </Box>

            {/* Side cards - Full width on mobile, 4 cols on desktop */}
            <Stack
              sx={{ gridColumn: { xs: "1", lg: "span 4" } }}
              spacing={{ xs: 2, sm: 3 }}
            >
              {/* Goal Highlight Card */}
              <GoalHighlightCard />

              {/* Future Balance Card */}
              {isPlus && <FutureBalanceCard />}
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );
}

function DashboardSkeleton() {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: "1fr", lg: "repeat(12, 1fr)" }}
      gap={{ xs: 2, sm: 3 }}
    >
      <Box sx={{ gridColumn: { xs: "1", lg: "span 8" } }}>
        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
      </Box>
      <Box sx={{ gridColumn: { xs: "1", lg: "span 4" } }}>
        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
      </Box>
      <Box sx={{ gridColumn: { xs: "1", lg: "span 8" } }}>
        <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
      </Box>
      <Box sx={{ gridColumn: { xs: "1", lg: "span 4" } }}>
        <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
      </Box>
    </Box>
  );
}
