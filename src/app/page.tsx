import { Header } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { AITipCard } from "@/components/dashboard/ai-tip-card";
import { mockTransactions } from "@/lib/data";

export default function DashboardPage() {
  const categoryTotals = mockTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryTotals).map(([name, total]) => ({
    name,
    total,
  }));
  
  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Header />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCards />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-12 md:col-span-4">
          <SpendingChart data={chartData} />
        </div>
        <div className="col-span-12 md:col-span-3">
          <RecentTransactions />
        </div>
        <div className="col-span-12">
            <AITipCard />
        </div>
      </div>
    </main>
  );
}
