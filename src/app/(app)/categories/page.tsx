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
import { PlusCircle, MoreVertical, Edit, Trash2, Wand2, X, Check, Loader2 } from "lucide-react";
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
import { suggestCategoryForItem } from "@/ai/flows/suggest-category";
import { useToast } from "@/hooks/use-toast";


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

    if (isLoading) {
        return <CategoriesSkeleton />
    }

    const getCategoryTotal = (category: TransactionCategory) => {
        return filteredTransactions
            .filter(t => t.category === category)
            .reduce((sum, t) => sum + t.amount, 0);
    };
    
    const handleAISuggestion = () => {
        if(!itemName) return;
        setSuggestion(null);
        startSuggesting(async () => {
             try {
                const result = await suggestCategoryForItem({ itemName, existingCategories: categories });
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
                    <p className="text-muted-foreground">Gerencie suas categorias e veja os gastos de cada uma.</p>
                </div>
                 <div className="flex gap-2 items-center">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Wand2 className="mr-2 h-4 w-4"/>Sugerir por IA</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Sugestão de Categoria com IA</DialogTitle>
                                <DialogDescription>Digite o nome de um item e a IA irá sugerir uma categoria e subcategoria para ele.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                               <div className="flex gap-2">
                                 <Input 
                                   id="item-name" 
                                   placeholder="ex: Conta de luz" 
                                   value={itemName}
                                   onChange={(e) => setItemName(e.target.value)}
                                   onKeyDown={(e) => e.key === 'Enter' && handleAISuggestion()}
                                  />
                                  <Button onClick={handleAISuggestion} disabled={isSuggesting || !itemName}>
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
                            <Button><PlusCircle className="mr-2 h-4 w-4" /> Nova Categoria</Button>
                        </DialogTrigger>
                         <DialogContent>
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
                                    <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>Criar Categoria</Button>
                                 </DialogClose>
                             </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a categoria "{category}" e todas as suas subcategorias. As transações nesta categoria não serão excluídas.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteCategory(category)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            <h4 className="font-semibold mb-2 text-sm">Subcategorias:</h4>
                            <div className="flex flex-wrap gap-2">
                                {subcategories[category] && subcategories[category]!.length > 0 ? (
                                    subcategories[category]!.map(sub => (
                                        <Badge key={sub} variant="secondary" className="group pr-1">
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
                                     <div className="flex items-center gap-1 w-full">
                                        <Input 
                                            autoFocus
                                            value={newSubcategoryName}
                                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory(category)}
                                            placeholder="Nova subcategoria"
                                            className="h-7 text-xs"
                                        />
                                        <Button size="icon" className="h-7 w-7" onClick={() => handleAddSubcategory(category)} disabled={!newSubcategoryName.trim()}><Check className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCategory(null)}><X className="h-4 w-4"/></Button>
                                    </div>
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
