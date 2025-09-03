'use client';

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
        setSelectedSubcategory
    } = useTransactions();
    
    const isMobile = useIsMobile();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
                    <p className="text-muted-foreground">Visualize e gerencie suas transações com filtros e paginação.</p>
                </div>
                 <AddTransactionSheet>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Adicionar Transação
                    </Button>
                </AddTransactionSheet>
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

            {isLoading ? (
                 <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : isMobile ? (
                <TransactionCardList transactions={filteredTransactions} />
            ) : (
                <DataTable columns={columns} data={filteredTransactions} />
            )}

        </div>
    )
}
