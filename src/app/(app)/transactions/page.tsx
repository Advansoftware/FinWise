'use client';

import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/use-transactions";
import { columns } from "@/components/transactions/columns";
import { DataTable } from "@/components/transactions/data-table";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { ItemFilter } from "@/components/dashboard/item-filter";
import { useIsMobile } from "@/hooks/use-mobile";
import { TransactionCardList } from "@/components/transactions/transaction-card-list";
import { AddTransactionSheet } from "@/components/dashboard/add-transaction-sheet";
import { Button } from "@/components/ui/button";
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
        refreshOnPageVisit
    } = useTransactions();
    
    const isMobile = useIsMobile();

    // Refresh data when page loads to ensure it's up to date
    useEffect(() => {
        refreshOnPageVisit();
    }, [refreshOnPageVisit]);

    return (
        <div className="flex flex-col gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8">
            {/* Header - Mobile First */}
            <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Transações</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Visualize e gerencie suas transações com filtros e paginação.
                    </p>
                </div>
                
                {/* Add Transaction Button - Mobile Full Width */}
                <AddTransactionSheet>
                    <Button className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Adicionar Transação
                    </Button>
                </AddTransactionSheet>
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

            {/* Content */}
            {isLoading ? (
                 <div className="space-y-3 sm:space-y-4">
                    <Skeleton className="h-10 sm:h-12 w-full" />
                    <Skeleton className="h-48 sm:h-64 w-full" />
                    <Skeleton className="h-48 sm:h-64 w-full lg:hidden" />
                </div>
            ) : isMobile ? (
                <TransactionCardList transactions={filteredTransactions} />
            ) : (
                <DataTable columns={columns} data={filteredTransactions} />
            )}

        </div>
    )
}
