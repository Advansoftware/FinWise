"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { AITipCard } from "@/components/dashboard/ai-tip-card";
import { mockTransactions } from "@/lib/data";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { ItemFilter } from "@/components/dashboard/item-filter";
import { TransactionCategory } from "@/lib/types";

// Extrai as categorias e subcategorias dos dados para os filtros
const getFilterOptions = () => {
    const categories = new Set<TransactionCategory>();
    const subcategories: Partial<Record<TransactionCategory, Set<string>>> = {};

    mockTransactions.forEach(t => {
        categories.add(t.category);
        if (t.subcategory) {
            if (!subcategories[t.category]) {
                subcategories[t.category] = new Set();
            }
            subcategories[t.category]!.add(t.subcategory);
        }
    });

    const subcategoriesAsArray: Partial<Record<TransactionCategory, string[]>> = {};
    for (const cat in subcategories) {
        subcategoriesAsArray[cat as TransactionCategory] = Array.from(subcategories[cat as TransactionCategory]!);
    }

    return {
        categories: Array.from(categories),
        subcategories: subcategoriesAsArray
    };
};

const filterOptions = getFilterOptions();


export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');

  // Reseta a subcategoria quando a categoria muda
  const handleCategoryChange = (category: string) => {
      setSelectedCategory(category);
      setSelectedSubcategory('all');
  };
  
  // Filtra as transações com base em todos os filtros ativos
  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter((t) => {
        const dateCondition = dateRange?.from && dateRange?.to 
            ? new Date(t.date) >= dateRange.from && new Date(t.date) <= dateRange.to 
            : true;
        
        const categoryCondition = selectedCategory === 'all' || t.category === selectedCategory;
        
        const subcategoryCondition = selectedCategory === 'all' 
            || selectedSubcategory === 'all' 
            || t.subcategory === selectedSubcategory;

        return dateCondition && categoryCondition && subcategoryCondition;
    });
  }, [dateRange, selectedCategory, selectedSubcategory]);

  // Prepara os dados para o gráfico principal
  const chartData = useMemo(() => {
      // Se nenhuma categoria específica for selecionada, agrupar por categoria
      if (selectedCategory === 'all') {
          const categoryTotals = filteredTransactions.reduce((acc, t) => {
              acc[t.category] = (acc[t.category] || 0) + t.amount;
              return acc;
          }, {} as Record<string, number>);
          return Object.entries(categoryTotals).map(([name, total]) => ({ name, total }));
      }
      // Se uma categoria for selecionada, agrupar por subcategoria (se houver)
      else {
          const subcategoryTotals = filteredTransactions
            .filter(t => t.category === selectedCategory)
            .reduce((acc, t) => {
                const key = t.subcategory || 'Outros'; // Agrupa itens sem subcategoria
                acc[key] = (acc[key] || 0) + t.amount;
                return acc;
          }, {} as Record<string, number>);
          return Object.entries(subcategoryTotals).map(([name, total]) => ({ name, total }));
      }
  }, [filteredTransactions, selectedCategory]);

  const availableSubcategories = filterOptions.subcategories[selectedCategory as TransactionCategory] || [];


  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background/50">
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
            <DateRangePicker onUpdate={setDateRange} initialDate={dateRange} />
        </div>
        <ItemFilter 
          items={['all', ...filterOptions.categories]} 
          selectedItem={selectedCategory}
          onItemSelected={handleCategoryChange}
          placeholder="Todas as Categorias"
          className="capitalize"
        />
        <ItemFilter 
          items={['all', ...availableSubcategories]} 
          selectedItem={selectedSubcategory}
          onItemSelected={setSelectedSubcategory}
          placeholder="Todas as Subcategorias"
          disabled={selectedCategory === 'all' || availableSubcategories.length === 0}
          className="capitalize"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCards transactions={filteredTransactions} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-12 lg:col-span-4">
          <SpendingChart data={chartData} />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <RecentTransactions transactions={filteredTransactions} />
        </div>
        <div className="col-span-12">
            <AITipCard transactions={filteredTransactions} />
        </div>
      </div>
    </main>
  );
}
