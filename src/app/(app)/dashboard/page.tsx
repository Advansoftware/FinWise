
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
        <div className="flex flex-col gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8">
            {/* Header - Mobile First */}
            <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Painel</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Aqui está uma visão geral das suas finanças.
                    </p>
                </div>
                
                {/* Action Buttons - Mobile Stack, Desktop Row */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <AddTransactionSheet>
                        <Button className="w-full sm:w-auto order-1">
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Adicionar Transação
                        </Button>
                    </AddTransactionSheet>
                    
                    <ProUpgradeButton requiredPlan="Pro">
                       <ScanQRCodeDialog>
                           <Button 
                               variant="outline" 
                               disabled={!isPro}
                               className="w-full sm:w-auto order-2"
                           >
                                <ScanLine className="mr-2 h-4 w-4"/>
                                Escanear Nota
                            </Button>
                        </ScanQRCodeDialog>
                    </ProUpgradeButton>
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
                    {/* Main Wallet Card and Goals - Mobile Stack, Desktop Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="lg:col-span-2">
                           <WalletCard transactions={filteredTransactions} />
                        </div>
                        <div className="space-y-4 sm:space-y-6">
                           <GoalHighlightCard />
                           {isPlus && <FutureBalanceCard />}
                        </div>
                    </div>

                    {/* Stats Cards - Always Stacked on Mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <StatsCards transactions={filteredTransactions} />
                    </div>

                    {/* Chart and Recent Transactions - Mobile Stack, Desktop Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                       <div className="lg:col-span-2 order-2 lg:order-1">
                         <SpendingChart data={chartData} />
                       </div>
                       <div className="order-1 lg:order-2">
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
             {/* Main Section Skeleton */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <Skeleton className="lg:col-span-2 h-32 sm:h-36" />
                <div className="space-y-4 sm:space-y-6">
                  <Skeleton className="h-36 sm:h-44"/>
                  <Skeleton className="h-28 sm:h-36" />
                </div>
             </div>

             {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Skeleton className="h-32 sm:h-36" />
                <Skeleton className="h-32 sm:h-36" />
                <Skeleton className="h-32 sm:h-36" />
            </div>

            {/* Chart and Recent Transactions Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <Skeleton className="h-[300px] sm:h-[400px] lg:h-[450px] lg:col-span-2 order-2 lg:order-1" />
                <Skeleton className="h-[300px] sm:h-[400px] lg:h-[450px] order-1 lg:order-2" />
            </div>

            {/* AI Tip Skeleton */}
            <Skeleton className="h-24 sm:h-28" />
        </>
    );
}
