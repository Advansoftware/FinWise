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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel</h1>
                    <p className="text-muted-foreground">Aqui está uma visão geral das suas finanças.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <ScanQRCodeDialog>
                       <Button variant="outline">
                            <ScanLine className="mr-2 h-4 w-4"/>
                            Escanear Nota
                        </Button>
                    </ScanQRCodeDialog>
                    <AddTransactionSheet>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Adicionar Transação
                        </Button>
                    </AddTransactionSheet>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
               <DateRangePicker 
                    className="w-full md:w-auto" 
                    initialDate={dateRange} 
                    onUpdate={setDateRange}
                />
                <ItemFilter 
                    className="w-full md:w-64"
                    placeholder="Todas as Categorias"
                    items={['all', ...categories]} 
                    selectedItem={selectedCategory} 
                    onItemSelected={handleCategoryChange}
                />
                <ItemFilter 
                    className="w-full md:w-64"
                    placeholder="Todas as Subcategorias"
                    items={['all', ...availableSubcategories]} 
                    selectedItem={selectedSubcategory} 
                    onItemSelected={setSelectedSubcategory}
                    disabled={selectedCategory === 'all'}
                />
            </div>

            {isLoading ? <DashboardSkeleton /> : (
                 <div className="grid gap-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <StatsCards transactions={filteredTransactions} />
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                       <div className="lg:col-span-2">
                         <SpendingChart data={chartData} />
                       </div>
                       <RecentTransactions transactions={filteredTransactions} />
                    </div>
                     <AITipCard transactions={filteredTransactions} />
                </div>
            )}
        </div>
    );
}


function DashboardSkeleton() {
    return (
        <div className="grid gap-6">
            <div className="grid md:grid-cols-3 gap-6">
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-[450px] lg:col-span-2" />
                <Skeleton className="h-[450px]" />
            </div>
            <Skeleton className="h-28" />
        </div>
    );
}
