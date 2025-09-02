// src/app/(app)/transactions/page.tsx
'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/use-transactions";
import { columns } from "@/components/transactions/columns";
import { DataTable } from "@/components/transactions/data-table";

export default function TransactionsPage() {
    const { filteredTransactions, isLoading } = useTransactions();

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div>
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="border rounded-lg p-4">
                    <div className="flex items-center py-4">
                        <Skeleton className="h-10 w-full max-w-sm" />
                    </div>
                    <Skeleton className="h-[450px] w-full" />
                     <div className="flex items-center justify-end space-x-2 py-4">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
                <p className="text-muted-foreground">Visualize e gerencie suas transações com filtros e paginação.</p>
            </div>
            
            <DataTable columns={columns} data={filteredTransactions} />

        </div>
    )
}
