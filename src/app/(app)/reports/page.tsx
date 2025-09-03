
// src/app/(app)/reports/page.tsx
'use client';
import { useState, useMemo, useTransition } from 'react';
import { useReports } from '@/hooks/use-reports';
import { useTransactions } from '@/hooks/use-transactions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getYear, getMonth, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2, FileText, BarChart2, TrendingUp, TrendingDown, DollarSign, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function ReportsPage() {
    const [selectedDate, setSelectedDate] = useState({
        month: getMonth(new Date()) + 1,
        year: getYear(new Date()),
    });
    const { getReport, generateReport, isLoading: isReportsLoading } = useReports();
    const { allTransactions, isLoading: isTransactionsLoading } = useTransactions();
    const [isGenerating, startGenerating] = useTransition();

    const report = useMemo(() => {
        return getReport(selectedDate.year, selectedDate.month);
    }, [selectedDate, getReport]);

    const transactionsForMonth = useMemo(() => {
        const startDate = startOfMonth(new Date(selectedDate.year, selectedDate.month - 1));
        const endDate = endOfMonth(startDate);
        return allTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= startDate && tDate <= endDate;
        });
    }, [allTransactions, selectedDate]);

    const handleGenerateReport = () => {
        if (transactionsForMonth.length === 0) return;
        startGenerating(async () => {
            await generateReport(selectedDate.year, selectedDate.month, transactionsForMonth);
        });
    }

    const availableYears = useMemo(() => {
        const years = new Set(allTransactions.map(t => getYear(new Date(t.date))));
        const currentYear = getYear(new Date());
        years.add(currentYear);
        return Array.from(years).sort((a, b) => b - a);
    }, [allTransactions]);
    
    const availableMonths = Array.from({ length: 12 }, (_, i) => i + 1);

    const chartData = report ? 
        Object.entries(report.categoryBreakdown)
            .map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value)
        : [];
    
    const isLoading = isReportsLoading || isTransactionsLoading;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Relatórios Mensais</h1>
                    <p className="text-muted-foreground">Analise seus fechamentos mensais e obtenha insights gerados por IA.</p>
                </div>
                <div className="flex gap-2">
                    <Select
                        value={String(selectedDate.month)}
                        onValueChange={(val) => setSelectedDate(d => ({ ...d, month: Number(val) }))}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableMonths.map(m => <SelectItem key={m} value={String(m)}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select
                        value={String(selectedDate.year)}
                        onValueChange={(val) => setSelectedDate(d => ({ ...d, year: Number(val) }))}
                     >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                             {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? <ReportsSkeleton /> : report ? (
                <div className="grid gap-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                           <StatCard icon={TrendingUp} title="Receitas" value={report.totalIncome} color="text-emerald-400"/>
                           <StatCard icon={TrendingDown} title="Despesas" value={report.totalExpense} color="text-red-400"/>
                           <StatCard icon={DollarSign} title="Balanço" value={report.balance} color={report.balance >= 0 ? "text-foreground" : "text-destructive"}/>
                        </div>
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><BarChart2 className="text-primary"/> Breakdown</CardTitle>
                                <CardDescription>Gastos por categoria</CardDescription>
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
                            <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Resumo da IA</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">{report.summary}</p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card className="col-span-full">
                    <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center">
                        <FileText className="h-12 w-12 mb-4 text-primary/50" />
                        <h3 className="text-lg font-semibold text-foreground">Nenhum relatório encontrado para este período.</h3>
                        <p className="text-sm max-w-md mx-auto">
                            {transactionsForMonth.length > 0 
                                ? `Encontramos ${transactionsForMonth.length} transações neste mês. Gere um relatório para analisá-las.`
                                : `Não há transações neste período para gerar um relatório.`}
                        </p>
                        <Button className="mt-4" onClick={handleGenerateReport} disabled={isGenerating || transactionsForMonth.length === 0}>
                            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Gerar Relatório
                        </Button>
                    </CardContent>
                </Card>
            )}

        </div>
    );
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
        <div className="grid gap-6">
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
