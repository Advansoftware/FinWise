"use client";

import { Header } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { AITipCard } from "@/components/dashboard/ai-tip-card";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { ItemFilter } from "@/components/dashboard/item-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/use-transactions";

export default function DashboardPage() {
  const {
    isLoading,
    filteredTransactions,
    chartData,
    dateRange,
    setDateRange,
    categories,
    selectedCategory,
    handleCategoryChange,
    availableSubcategories,
    selectedSubcategory,
    setSelectedSubcategory,
  } = useTransactions();

  if (isLoading) {
    return (
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Header />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-10 md:col-span-2" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-12 lg:col-span-4 h-[418px]" />
          <Skeleton className="col-span-12 lg:col-span-3 h-[418px]" />
          <Skeleton className="col-span-12 h-36" />
        </div>
      </main>
    )
  }


  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
            <DateRangePicker onUpdate={setDateRange} initialDate={dateRange} />
        </div>
        <ItemFilter 
          items={['all', ...categories]} 
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
