// src/app/(app)/categories/page.tsx
'use client';
import { useTransactions } from "@/hooks/use-transactions.tsx";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TransactionCategory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/icons";

export default function CategoriesPage() {
    const { isLoading, categories, subcategories, filteredTransactions } = useTransactions();

    if (isLoading) {
        return <CategoriesSkeleton />
    }

    const getCategoryTotal = (category: TransactionCategory) => {
        return filteredTransactions
            .filter(t => t.category === category)
            .reduce((sum, t) => sum + t.amount, 0);
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
                <p className="text-muted-foreground">Visualize o total gasto e as subcategorias de cada categoria de despesa.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => (
                    <Card key={category}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <CategoryIcon category={category} className="h-6 w-6 text-primary" />
                                <CardTitle>{category}</CardTitle>
                            </div>
                             <CardDescription>Total Gasto: <span className="font-bold text-red-400">R$ {getCategoryTotal(category).toFixed(2)}</span></CardDescription>
                        </CardHeader>
                        <CardContent>
                            <h4 className="font-semibold mb-2">Subcategorias:</h4>
                            <div className="flex flex-wrap gap-2">
                                {subcategories[category] && subcategories[category]!.length > 0 ? (
                                    subcategories[category]!.map(sub => (
                                        <Badge key={sub} variant="secondary">{sub}</Badge>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground">Nenhuma subcategoria registrada.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {categories.length === 0 && (
                    <Card className="md:col-span-3">
                        <CardContent className="p-8 text-center text-muted-foreground">
                           <p>Nenhuma categoria encontrada.</p>
                           <p className="text-sm">Adicione uma transação para ver suas categorias aqui.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

function CategoriesSkeleton() {
    return (
         <div className="flex flex-col gap-6">
            <div>
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
            </div>
        </div>
    )
}
