// src/app/(app)/categories/page.tsx
'use client';
import { useState } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TransactionCategory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Edit, Trash2, Sparkles, Wand2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CategoriesPage() {
    const { isLoading, categories, subcategories, filteredTransactions } = useTransactions();
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestion, setSuggestion] = useState<{category: string; subcategory: string} | null>(null);

    if (isLoading) {
        return <CategoriesSkeleton />
    }

    const getCategoryTotal = (category: TransactionCategory) => {
        return filteredTransactions
            .filter(t => t.category === category)
            .reduce((sum, t) => sum + t.amount, 0);
    };
    
    const handleAISuggestion = async (item: string) => {
        if(!item) return;
        setIsSuggesting(true);
        // Mock AI response
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockCategories = ["Supermercado", "Restaurante", "Contas"];
        const mockSubcategories = ["Mercearia", "Café", "Internet"];
        setSuggestion({
            category: mockCategories[Math.floor(Math.random() * mockCategories.length)]!,
            subcategory: mockSubcategories[Math.floor(Math.random() * mockSubcategories.length)]!
        })
        setIsSuggesting(false);
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
                    <p className="text-muted-foreground">Gerencie suas categorias e veja os gastos de cada uma.</p>
                </div>
                 <div className="flex gap-2 items-center">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Wand2 className="mr-2 h-4 w-4"/>Sugerir Categoria</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Sugestão com IA</DialogTitle>
                                <DialogDescription>Digite o nome de um item e a IA irá sugerir uma categoria e subcategoria para ele.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                               <Input 
                                 id="item-name" 
                                 placeholder="ex: Conta de luz" 
                                 onBlur={(e) => handleAISuggestion(e.target.value)}
                                />
                               {isSuggesting && <p className="text-sm text-muted-foreground animate-pulse">Analisando...</p>}
                               {suggestion && (
                                   <div className="p-4 bg-muted rounded-md space-y-2">
                                       <p className="font-semibold">Sugestão:</p>
                                       <p>Categoria: <Badge>{suggestion.category}</Badge></p>
                                       <p>Subcategoria: <Badge variant="secondary">{suggestion.subcategory}</Badge></p>
                                   </div>
                               )}
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Nova Categoria</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => (
                    <Card key={category}>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <CategoryIcon category={category} className="h-6 w-6 text-primary" />
                                    <CardTitle>{category}</CardTitle>
                                </div>
                                <CardDescription>Gasto no período: <span className="font-bold text-red-400">R$ {getCategoryTotal(category).toFixed(2)}</span></CardDescription>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-500"><Trash2 className="mr-2 h-4 w-4"/>Excluir</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            <h4 className="font-semibold mb-2 text-sm">Subcategorias:</h4>
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
                           <p className="text-sm">Adicione uma categoria para começar a organizar.</p>
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
