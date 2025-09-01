"use client";

import { useState } from "react";
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

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [selectedItem, setSelectedItem] = useState<string>('all');

  const filteredTransactions = mockTransactions.filter((t) => {
    if (!dateRange?.from || !dateRange?.to) return true;
    const transactionDate = new Date(t.date);
    return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
  });

  const categoryTotals = filteredTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryTotals).map(([name, total]) => ({
    name,
    total,
  }));
  
  const allItems = ['all', ...new Set(mockTransactions.map(t => t.category))];

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background/50">
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DateRangePicker onUpdate={setDateRange} initialDate={dateRange} />
        <div className="md:col-span-2">
            <ItemFilter 
              items={allItems} 
              selectedItem={selectedItem}
              onItemSelected={setSelectedItem}
            />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCards transactions={filteredTransactions} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-12 lg:col-span-4">
          <SpendingChart data={chartData} />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <RecentTransactions transactions={filteredTransactions.filter(t => selectedItem === 'all' || t.category === selectedItem)} />
        </div>
        <div className="col-span-12">
            <AITipCard transactions={filteredTransactions} />
        </div>
      </div>
    </main>
  );
}
