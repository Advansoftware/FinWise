
// src/app/(app)/categories/page.tsx
'use client';
import { useState, useTransition } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TransactionCategory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Edit, Trash2, Wand2, X, Check, Loader2, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { suggestCategoryForItemAction } from "@/services/ai-actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";


export default function CategoriesPage() {
    const { 
        isLoading, 
        categories, 
        subcategories, 
        filteredTransactions,
        addCategory,
        deleteCategory,
        addSubcategory,
        deleteSubcategory
    } = useTransactions();

    const [isSuggesting, startSuggesting] = useTransition();
    const [suggestion, setSuggestion] = useState<{category: string; subcategory?: string} | null>(null);
    const [itemName, setItemName] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newSubcategoryName, setNewSubcategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    if (isLoading) {
        return <CategoriesSkeleton />
    }

    const getCategoryTotal = (category: TransactionCategory) => {
        return filteredTransactions
            .filter(t => t.category === category)
            .reduce((sum, t) => sum + t.amount, 0);
    };
    
    const handleAISuggestion = () => {
        if(!itemName || !user) return;
        setSuggestion(null);
        startSuggesting(async () => {
             try {
                // Ensure categories are passed as string[]
                const categoryStrings: string[] = categories.map(c => c as string);
                const result = await suggestCategoryForItemAction({ itemName, existingCategories: categoryStrings }, user.uid);
                setSuggestion(result);
            } catch (error) {
                console.error("Error fetching AI suggestion:", error);
                toast({
                    variant: "destructive",
                    title: "Erro na Sugestão",
                    description: "Não foi possível obter a sugestão da IA. Verifique suas configurações.",
                });
            }
        });
    }

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        await addCategory(newCategoryName.trim() as TransactionCategory);
        setNewCategoryName("");
    }

    const handleAddSubcategory = async (category: TransactionCategory) => {
        if (!newSubcategoryName.trim()) return;
        await addSubcategory(category, newSubcategoryName.trim());
        setNewSubcategoryName("");
        setEditingCategory(null);
    }
    
    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-3 sm:gap-4">
                 <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Categorias</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">Gerencie suas categorias e veja os gastos de cada uma.</p>
                </div>
                 <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <Link href="/categories/default" className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <Settings className="mr-2 h-4 w-4"/>
                            Ver Padrão
                        </Button>
                    </Link>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" disabled={!user} className="w-full sm:w-auto">
                                <Wand2 className="mr-2 h-4 w-4"/>Sugerir por IA
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-md">
                            <DialogHeader>
                                <DialogTitle>Sugestão de Categoria com IA</DialogTitle>
                                <DialogDescription>Digite o nome de um item e a IA irá sugerir uma categoria e subcategoria para ele.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                               <div className="flex flex-col sm:flex-row gap-2">
                                 <Input 
                                   id="item-name" 
                                   placeholder="ex: Conta de luz" 
                                   value={itemName}
                                   onChange={(e) => setItemName(e.target.value)}
                                   onKeyDown={(e) => e.key === 'Enter' && handleAISuggestion()}
                                   className="flex-1"
                                  />
                                  <Button onClick={handleAISuggestion} disabled={isSuggesting || !itemName} className="w-full sm:w-auto">
                                      {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin"/> : "Sugerir"}
                                   </Button>
                               </div>
                               {isSuggesting && <p className="text-sm text-muted-foreground animate-pulse text-center">Analisando...</p>}
                               {suggestion && (
                                   <div className="p-4 bg-muted rounded-md space-y-2">
                                       <p className="font-semibold">Sugestão da IA:</p>
                                       {suggestion.category && <p>Categoria: <Badge>{suggestion.category}</Badge></p>}
                                       {suggestion.subcategory && <p>Subcategoria: <Badge variant="secondary">{suggestion.subcategory}</Badge></p>}
                                   </div>
                               )}
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button disabled={!user} className="w-full sm:w-auto">
                                <PlusCircle className="mr-2 h-4 w-4" /> Nova Categoria
                            </Button>
                        </DialogTrigger>
                         <DialogContent className="w-[95vw] max-w-md">
                            <DialogHeader>
                                <DialogTitle>Criar Nova Categoria</DialogTitle>
                                <DialogDescription>Insira o nome da nova categoria.</DialogDescription>
                            </DialogHeader>
                             <div className="py-4">
                                <Label htmlFor="new-category-name" className="sr-only">Nome da Categoria</Label>
                                <Input 
                                    id="new-category-name"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="Ex: Educação"
                                />
                             </div>
                             <DialogFooter>
                                 <DialogClose asChild>
                                    <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="w-full">Criar Categoria</Button>
                                 </DialogClose>
                             </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {categories.map(category => (
                    <Card key={category}>
                        <CardHeader className="flex flex-row items-start justify-between pb-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <CategoryIcon category={category} className="h-5 w-5 text-primary shrink-0" />
                                    <CardTitle className="text-base truncate">{category}</CardTitle>
                                </div>
                                <CardDescription className="text-xs">
                                    Gasto: <span className="font-bold text-red-400">R$ {getCategoryTotal(category).toFixed(2)}</span>
                                </CardDescription>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                        <MoreVertical className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                                        <PlusCircle className="mr-2 h-4 w-4"/>Adicionar Subcategoria
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-400 focus:bg-destructive/10">
                                                <Trash2 className="mr-2 h-4 w-4"/>Excluir Categoria
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="w-[95vw] max-w-md">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a categoria "{category}" e todas as suas subcategorias. As transações nesta categoria não serão excluídas.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                                <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteCategory(category)} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <h4 className="font-semibold mb-2 text-xs">Subcategorias:</h4>
                            <div className="flex flex-wrap gap-1">
                                {subcategories[category] && subcategories[category]!.length > 0 ? (
                                    subcategories[category]!.map(sub => (
                                        <Badge key={sub} variant="secondary" className="group pr-1 text-xs">
                                            {sub}
                                            <button onClick={() => deleteSubcategory(category, sub)} className="ml-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <X className="h-3 w-3"/>
                                            </button>
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground">Nenhuma subcategoria registrada.</p>
                                )}
                                {editingCategory === category && (
                                     <div className="flex items-center gap-1 w-full mt-2">
                                        <Input 
                                            autoFocus
                                            value={newSubcategoryName}
                                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory(category)}
                                            placeholder="Nova subcategoria"
                                            className="h-7 text-xs flex-1"
                                        />
                                        <Button size="icon" className="h-7 w-7" onClick={() => handleAddSubcategory(category)} disabled={!newSubcategoryName.trim()}><Check className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCategory(null)}><X className="h-4 w-4"/></Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {categories.length === 0 && !isLoading && (
                    <Card className="sm:col-span-2 lg:col-span-3">
                        <CardContent className="p-6 sm:p-8 text-center text-muted-foreground">
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

    