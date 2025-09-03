// src/app/(app)/reports/page.tsx
'use client';
import { useState, useMemo } from 'react';
import { AnnualReport, MonthlyReport } from "@/lib/types";
import { useReports } from '@/hooks/use-reports';
import { useTransactions } from '@/hooks/use-transactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getYear } from 'date-fns';
import { Loader2, BarChart2, TrendingUp, TrendingDown, DollarSign, Sparkles, Calendar, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProUpgradeCard } from '@/components/pro-upgrade-card';
import { usePlan } from '@/hooks/use-plan';

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function ReportsPage() {
    const { allTransactions, isLoading: isTransactionsLoading } = useTransactions();
    const { isPro, isLoading: isPlanLoading } = usePlan();

    const availableYears = useMemo(() => {
        const years = new Set(allTransactions.map(t => getYear(new Date(t.date))));
        const currentYear = getYear(new Date());
        years.add(currentYear);
        return Array.from(years).sort((a, b) => b - a);
    }, [allTransactions]);

    if (isTransactionsLoading || isPlanLoading) {
        return (
            <div className="flex flex-col gap-6">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
                    <p className="text-muted-foreground">Analise seus fechamentos mensais e anuais, e obtenha insights gerados por IA.</p>
                </div>
                <Skeleton className="h-10 w-48"/>
                <Skeleton className="h-64 w-full"/>
            </div>
        )
    }

    if (!isPro) {
        return <ProUpgradeCard featureName="Relatórios Inteligentes" />
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
                <p className="text-muted-foreground">Visualize os relatórios mensais e anuais gerados automaticamente pelo sistema. Os relatórios do mês anterior são criados no dia 01 de cada mês.</p>
            </div>
            <Tabs defaultValue={String(getYear(new Date()))} className="w-full">
                <TabsList>
                    {availableYears.map(year => (
                        <TabsTrigger key={year} value={String(year)}>{year}</TabsTrigger>
                    ))}
                </TabsList>
                 {availableYears.map(year => (
                    <TabsContent key={year} value={String(year)}>
                        <YearlyReportView year={year} />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

function YearlyReportView({ year }: { year: number }) {
    const { getAnnualReport, isLoading: isReportsLoading } = useReports();
    
    const annualReport = useMemo(() => getAnnualReport(year), [year, getAnnualReport]);
    
    if (isReportsLoading) return <ReportsSkeleton />;

    if (annualReport) {
         return <AnnualReportDisplay report={annualReport} />;
    }

    return (
        <Tabs defaultValue="monthly" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly">Visão Mensal</TabsTrigger>
                <TabsTrigger value="annual" disabled>
                    Visão Anual (Pendente)
                </TabsTrigger>
            </TabsList>
            <TabsContent value="monthly">
                <MonthlyReportsGrid year={year} />
            </TabsContent>
            <TabsContent value="annual">
                 <Card className="col-span-full mt-4">
                    <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center">
                        <Calendar className="h-12 w-12 mb-4 text-primary/50" />
                        <h3 className="text-lg font-semibold text-foreground">Relatório Anual de {year} Pendente</h3>
                        <p className="text-sm max-w-md mx-auto">
                           O relatório anual será gerado automaticamente quando todos os 12 relatórios mensais estiverem disponíveis.
                        </p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}


function MonthlyReportsGrid({ year }: { year: number }) {
    const availableMonths = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
            {availableMonths.map(month => (
                <MonthlyReportCard key={month} year={year} month={month} />
            ))}
        </div>
    )
}

function MonthlyReportCard({ year, month }: { year: number, month: number }) {
    const { getMonthlyReport } = useReports();
    const report = getMonthlyReport(year, month);
    const monthName = new Date(0, month - 1).toLocaleString('pt-BR', { month: 'long' });

    if (report) {
         return (
            <Card className="flex flex-col justify-between">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base capitalize">{monthName}</CardTitle>
                    <CardDescription className={report.balance >= 0 ? "text-foreground" : "text-destructive"}>{report.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                    <p className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-emerald-400"/> {report.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <p className="flex items-center gap-1"><TrendingDown className="h-3 w-3 text-red-400"/> {report.totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col justify-center items-center text-center p-4 bg-muted/50 border-dashed h-full min-h-[118px]">
            <h3 className="font-semibold text-base capitalize">{monthName}</h3>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-2">
                <Clock className="h-3 w-3"/>
                <span>Pendente</span>
            </div>
        </Card>
    )
}

function AnnualReportDisplay({ report }: { report: AnnualReport }) {
    const chartData = report ? 
        Object.entries(report.topSpendingCategories)
            .map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value)
            .slice(0, 5) // Display top 5
        : [];
    
    return (
         <div className="grid gap-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                   <StatCard icon={TrendingUp} title="Total Receitas" value={report.totalIncome} color="text-emerald-400"/>
                   <StatCard icon={TrendingDown} title="Total Despesas" value={report.totalExpense} color="text-red-400"/>
                   <StatCard icon={DollarSign} title="Balanço Final" value={report.finalBalance} color={report.finalBalance >= 0 ? "text-foreground" : "text-destructive"}/>
                </div>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart2 className="text-primary"/> Top 5 Categorias</CardTitle>
                        <CardDescription>Maiores gastos do ano</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center -mt-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                                     {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Legend iconSize={8} wrapperStyle={{fontSize: "12px"}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Resumo Anual da IA</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{report.summary}</p>
                </CardContent>
            </Card>
        </div>
    )
}


function StatCard({ icon: Icon, title, value, color }: {icon: any, title: string, value: number, color: string}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${color}`}>
                    {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
            </CardContent>
        </Card>
    )
}

function ReportsSkeleton() {
    return (
        <div className="grid gap-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-28"/>
                    <Skeleton className="h-28"/>
                    <Skeleton className="h-28"/>
                </div>
                <Skeleton className="h-48 lg:h-auto"/>
            </div>
            <Skeleton className="h-36"/>
        </div>
    )
}
