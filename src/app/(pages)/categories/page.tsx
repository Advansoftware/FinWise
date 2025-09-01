
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, BrainCircuit } from 'lucide-react';
import { Category, TransactionCategory } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

const initialCategories: Category[] = [
    { name: 'Supermercado', subcategories: ['Mercearia', 'Hortifruti', 'Carnes', 'Bebidas'] },
    { name: 'Transporte', subcategories: ['Combustível', 'Transporte Público', 'App de Transporte'] },
    { name: 'Entretenimento', subcategories: ['Streaming', 'Cinema', 'Shows'] },
    { name: 'Contas', subcategories: ['Aluguel', 'Energia', 'Água', 'Internet'] },
    { name: 'Restaurante', subcategories: ['Almoço', 'Jantar', 'Delivery'] },
    { name: 'Saúde', subcategories: ['Farmácia', 'Consulta', 'Plano de Saúde'] },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(null);

  const handleAddSubcategory = () => {
    if (newSubcategory.trim() && selectedCategory) {
      setCategories(categories.map(c => 
        c.name === selectedCategory 
          ? { ...c, subcategories: [...c.subcategories, newSubcategory.trim()] }
          : c
      ));
      setNewSubcategory('');
    }
  };
  
  const handleRemoveSubcategory = (categoryName: TransactionCategory, subToRemove: string) => {
     setCategories(categories.map(c => 
        c.name === categoryName 
          ? { ...c, subcategories: c.subcategories.filter(s => s !== subToRemove) }
          : c
      ));
  };


  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background/50">
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Categorias</h1>
            <p className="text-muted-foreground">Gerencie suas categorias e subcategorias para organizar suas finanças.</p>
        </div>
        <Button variant="outline">
            <BrainCircuit className="mr-2"/>
            Sugerir Organização com IA
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.name} className="flex flex-col">
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex flex-wrap gap-2">
                {category.subcategories.map((sub) => (
                  <Badge key={sub} variant="secondary" className="group relative pr-6">
                    {sub}
                     <button onClick={() => handleRemoveSubcategory(category.name, sub)} className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-3 w-3 text-red-400"/>
                    </button>
                  </Badge>
                ))}
                {category.subcategories.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma subcategoria.</p>
                )}
              </div>
            </CardContent>
            <div className="p-6 pt-0">
               <Dialog>
                    <DialogTrigger asChild>
                         <Button variant="ghost" size="sm" className="w-full" onClick={() => setSelectedCategory(category.name)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Subcategoria
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Adicionar a {selectedCategory}</DialogTitle>
                        <DialogDescription>
                            Digite o nome da nova subcategoria.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                Nome
                                </Label>
                                <Input
                                id="name"
                                value={newSubcategory}
                                onChange={(e) => setNewSubcategory(e.target.value)}
                                className="col-span-3"
                                placeholder="Ex: Bebidas"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddSubcategory}>Salvar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
