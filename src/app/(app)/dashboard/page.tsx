// src/app/(app)/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { Button, Box, Typography, Skeleton, Grid } from "@mui/material";
import { PlusCircle, ScanLine } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { useGoals } from "@/hooks/use-goals";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ItemFilter } from "@/components/dashboard/item-filter";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { AITipCard } from "@/components/dashboard/ai-tip-card";
import { AddTransactionSheet } from "@/components/dashboard/add-transaction-sheet";
import { ReceiptScannerDialog } from "@/components/receipts/receipt-scanner-dialog";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { GoalHighlightCard } from "@/components/goals/goal-highlight-card";
import { FutureBalanceCard } from "@/components/dashboard/future-balance-card";
import {
  GamificationGuide,
  DailyQuestsCard,
  GamificationProgressWidget,
} from "@/components/gamification";
import { ProUpgradeButton } from "@/components/pro-upgrade-button";

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
    loadTransactions,
  } = useTransactions();

  const { loadGoals } = useGoals();

  useEffect(() => {
    loadTransactions();
    loadGoals();
  }, [loadTransactions, loadGoals]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid
        container
        spacing={{ xs: 2, sm: 3 }}
        columns={{ xs: 4, sm: 8, md: 12 }}
      >
        {/* Header - Mobile First */}
        <Grid size={{ xs: 4, sm: 8, md: 12 }}>
          <Grid
            container
            spacing={{ xs: 2, sm: 3 }}
            columns={{ xs: 4, sm: 8, md: 12 }}
          >
            <Grid size={{ xs: 4, sm: 5, md: 6 }}>
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
            </Grid>

            {/* Action Buttons - Desktop */}
            <Grid
              size={{ xs: 4, sm: 3, md: 6 }}
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 1.5,
                  justifyContent: "flex-end",
                }}
              >
                <GamificationGuide />
                <ProUpgradeButton
                  requiredPlan="Pro"
                  tooltipContent="Escanear notas fiscais com IA é um recurso Pro. Clique para fazer upgrade."
                >
                  <ReceiptScannerDialog>
                    <Button
                      variant="outlined"
                      startIcon={<ScanLine size={18} />}
                    >
                      Escanear Nota
                    </Button>
                  </ReceiptScannerDialog>
                </ProUpgradeButton>
                <AddTransactionSheet>
                  <Button
                    variant="contained"
                    startIcon={<PlusCircle size={18} />}
                  >
                    Nova Transação
                  </Button>
                </AddTransactionSheet>
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* Mobile Action Buttons - Full Width */}
        <Grid
          size={{ xs: 4, sm: 8, md: 12 }}
          sx={{ display: { xs: "block", sm: "none" } }}
        >
          <Grid
            container
            spacing={{ xs: 1.5, sm: 2 }}
            columns={{ xs: 4, sm: 8, md: 12 }}
          >
            <Grid size={{ xs: 4 }}>
              <AddTransactionSheet>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PlusCircle size={18} />}
                >
                  Nova Transação
                </Button>
              </AddTransactionSheet>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <ProUpgradeButton
                requiredPlan="Pro"
                tooltipContent="Escanear notas fiscais com IA é um recurso Pro. Clique para fazer upgrade."
              >
                <ReceiptScannerDialog>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ScanLine size={18} />}
                  >
                    Escanear Nota
                  </Button>
                </ReceiptScannerDialog>
              </ProUpgradeButton>
            </Grid>
          </Grid>
        </Grid>

        {/* Filters */}
        <Grid size={{ xs: 4, sm: 8, md: 12 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
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

        {isLoading ? (
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <DashboardSkeleton />
          </Grid>
        ) : (
          <>
            {/* Stats Cards - Sempre full width, 4 cards em linha no desktop */}
            <Grid size={{ xs: 4, sm: 8, md: 12 }}>
              <StatsCards transactions={filteredTransactions} />
            </Grid>

            {/* Main Content Grid */}
            {/* Coluna Principal - 8 colunas no desktop */}
            <Grid size={{ xs: 4, sm: 8, md: 8 }}>
              <Grid
                container
                spacing={{ xs: 2, sm: 3 }}
                columns={{ xs: 4, sm: 8, md: 12 }}
              >
                {/* Spending Chart */}
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <SpendingChart data={chartData} />
                </Grid>

                {/* Recent Transactions */}
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <RecentTransactions transactions={filteredTransactions} />
                </Grid>
              </Grid>
            </Grid>

            {/* Coluna Lateral - 4 colunas no desktop */}
            <Grid size={{ xs: 4, sm: 8, md: 4 }}>
              <Grid
                container
                spacing={{ xs: 2, sm: 3 }}
                columns={{ xs: 4, sm: 8, md: 12 }}
              >
                {/* Gamification Progress */}
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <GamificationProgressWidget variant="expanded" showBadges />
                </Grid>

                {/* Wallet Summary */}
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <WalletCard transactions={filteredTransactions} />
                </Grid>

                {/* Daily Quests */}
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <DailyQuestsCard pageContext="dashboard" compact />
                </Grid>

                {/* AI Tip */}
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <ProUpgradeButton
                    requiredPlan="Pro"
                    tooltipContent="Dicas de IA personalizadas são um recurso Pro. Clique para fazer upgrade."
                  >
                    <AITipCard transactions={filteredTransactions} />
                  </ProUpgradeButton>
                </Grid>

                {/* Goal Highlight Card */}
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <GoalHighlightCard />
                </Grid>

                {/* Future Balance Card */}
                <Grid size={{ xs: 4, sm: 8, md: 12 }}>
                  <ProUpgradeButton
                    requiredPlan="Plus"
                    tooltipContent="Projeção de saldo futuro é um recurso Plus. Clique para fazer upgrade."
                  >
                    <FutureBalanceCard />
                  </ProUpgradeButton>
                </Grid>
              </Grid>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}

function DashboardSkeleton() {
  return (
    <Grid
      container
      spacing={{ xs: 2, sm: 3 }}
      columns={{ xs: 4, sm: 8, md: 12 }}
    >
      {/* Coluna Principal */}
      <Grid size={{ xs: 4, sm: 8, md: 8 }}>
        <Grid
          container
          spacing={{ xs: 2, sm: 3 }}
          columns={{ xs: 4, sm: 8, md: 12 }}
        >
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Skeleton
              variant="rectangular"
              height={180}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Skeleton
              variant="rectangular"
              height={350}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Coluna Lateral */}
      <Grid size={{ xs: 4, sm: 8, md: 4 }}>
        <Grid
          container
          spacing={{ xs: 2, sm: 3 }}
          columns={{ xs: 4, sm: 8, md: 12 }}
        >
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Skeleton
              variant="rectangular"
              height={180}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Skeleton
              variant="rectangular"
              height={350}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
