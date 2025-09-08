
'use client';

import { Button } from "@/components/ui/button";
import { PlusCircle, ScanLine } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ItemFilter } from "@/components/dashboard/item-filter";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { AITipCard } from "@/components/dashboard/ai-tip-card";
import { AddTransactionSheet } from "@/components/dashboard/add-transaction-sheet";
import { ScanQRCodeDialog } from "@/components/dashboard/scan-qr-code-dialog";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { GoalHighlightCard } from "@/components/goals/goal-highlight-card";
import { FutureBalanceCard } from "@/components/dashboard/future-balance-card";
import { usePlan } from "@/hooks/use-plan";
import { ProUpgradeButton } from "@/components/pro-upgrade-button";
import { InstallmentsSummaryCard } from "@/components/dashboard/installments-summary-card";

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
        setSelectedSubcategory
    } = useTransactions();
    const { isPro, isPlus } = usePlan();

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            {/* Header - Mobile First */}
            <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Painel</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Aqui está uma visão geral das suas finanças.
                    </p>
                </div>
                
                {/* Action Buttons - Mobile Stack, Desktop Side by Side */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                    <ProUpgradeButton requiredPlan="Pro">
                       <ScanQRCodeDialog>
                           <Button 
                               variant="outline" 
                               disabled={!isPro}
                               className="w-full sm:w-auto order-1 sm:order-1"
                           >
                                <ScanLine className="mr-2 h-4 w-4"/>
                                Escanear Nota
                            </Button>
                        </ScanQRCodeDialog>
                    </ProUpgradeButton>
                    
                    <AddTransactionSheet>
                        <Button className="w-full sm:w-auto order-2 sm:order-2">
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Adicionar Transação
                        </Button>
                    </AddTransactionSheet>
                </div>
            </div>

            {/* Filters - Mobile Stack, Desktop Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
               <DateRangePicker 
                    className="w-full sm:w-auto min-w-[200px]" 
                    initialDate={dateRange} 
                    onUpdate={setDateRange}
                />
                <ItemFilter 
                    className="w-full sm:flex-1 sm:max-w-[200px]"
                    placeholder="Todas as Categorias"
                    items={['all', ...categories]} 
                    selectedItem={selectedCategory} 
                    onItemSelected={handleCategoryChange}
                />
                <ItemFilter 
                    className="w-full sm:flex-1 sm:max-w-[200px]"
                    placeholder="Todas as Subcategorias"
                    items={['all', ...availableSubcategories]} 
                    selectedItem={selectedSubcategory} 
                    onItemSelected={setSelectedSubcategory}
                    disabled={selectedCategory === 'all'}
                />
            </div>

            {isLoading ? <DashboardSkeleton /> : (
                <>
                    {/* Main Grid - 12 column system for precise control */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                        {/* First Row */}
                        {/* Wallet Card - 6 columns */}
                        <div className="lg:col-span-6">
                           <WalletCard transactions={filteredTransactions} />
                        </div>
                        {/* Goals Card - 3 columns */}
                        <div className="lg:col-span-3">
                           <GoalHighlightCard />
                        </div>
                        {/* Installments Card - 3 columns */}
                        <div className="lg:col-span-3">
                           <InstallmentsSummaryCard />
                        </div>

                        {/* Second Row - Future Balance Card for Pro/Plus users */}
                        {isPlus && (
                            <div className="lg:col-span-6 lg:col-start-7">
                                <FutureBalanceCard />
                            </div>
                        )}
                    </div>

                    {/* Stats Cards - 4 equal columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <StatsCards transactions={filteredTransactions} />
                    </div>

                    {/* Chart and Recent Transactions - 8:4 ratio for better balance */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                       <div className="lg:col-span-8 order-2 lg:order-1">
                         <SpendingChart data={chartData} />
                       </div>
                       <div className="lg:col-span-4 order-1 lg:order-2">
                         <RecentTransactions transactions={filteredTransactions} />
                       </div>
                    </div>

                    {/* AI Tip Card - Full Width */}
                    {isPro && <AITipCard transactions={filteredTransactions} />}
                </>
            )}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <>
             {/* Main Grid Skeleton - 12 column layout */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                {/* First Row */}
                <Skeleton className="lg:col-span-6 h-40 sm:h-48" />
                <Skeleton className="lg:col-span-3 h-40 sm:h-48"/>
                <Skeleton className="lg:col-span-3 h-40 sm:h-48" />
                
                {/* Second Row - Future Balance Skeleton */}
                <Skeleton className="lg:col-span-6 lg:col-start-7 h-32 sm:h-36" />
             </div>

             {/* Stats Cards Skeleton - 4 equal columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Skeleton className="h-32 sm:h-36" />
                <Skeleton className="h-32 sm:h-36" />
                <Skeleton className="h-32 sm:h-36" />
                <Skeleton className="h-32 sm:h-36" />
            </div>

            {/* Chart and Recent Transactions Skeleton - 8:4 ratio */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                <Skeleton className="h-[350px] sm:h-[400px] lg:h-[450px] lg:col-span-8 order-2 lg:order-1" />
                <Skeleton className="h-[350px] sm:h-[400px] lg:h-[450px] lg:col-span-4 order-1 lg:order-2" />
            </div>

            {/* AI Tip Skeleton */}
            <Skeleton className="h-24 sm:h-28" />
        </>
    );
}
