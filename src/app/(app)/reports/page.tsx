// src/app/(app)/reports/page.tsx
'use client';
import {useState, useMemo} from 'react';
import {useReports} from '@/hooks/use-reports';
import {useTransactions} from '@/hooks/use-transactions';
import {Card, CardContent, CardHeader, Typography} from '@mui/material';
import {getYear} from 'date-fns';
import {Loader2, BarChart2, TrendingUp, TrendingDown, DollarSign, Sparkles, Calendar, Clock, RefreshCw} from 'lucide-react';
import {Skeleton} from '@/components/mui-wrappers/skeleton';
import {ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip} from 'recharts';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/mui-wrappers/tabs';
import {Button} from '@mui/material';
import {ProUpgradeCard} from '@/components/pro-upgrade-card';
import {usePlan} from '@/hooks/use-plan';
import {Report} from '@/core/ports/reports.port';

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
            <div className="flex flex-col gap-4 p-4">
                 <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Relatórios</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Analise seus fechamentos mensais e anuais</p>
                </div>
                <Skeleton className="h-8 w-32"/>
                <Skeleton className="h-48 w-full"/>
            </div>
        )
    }

    if (!isPro) {
        return <ProUpgradeCard featureName="Relatórios Inteligentes" />
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Relatórios</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                    Relatórios mensais e anuais gerados automaticamente pela IA
                </p>
            </div>
            
            <Tabs defaultValue={String(getYear(new Date()))} className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full md:w-auto bg-card">
                    {availableYears.slice(0, 4).map(year => (
                        <TabsTrigger key={year} value={String(year)} className="text-xs md:text-sm data-[state=active]:bg-primary/20">
                            {year}
                        </TabsTrigger>
                    ))}
                </TabsList>
                 
                 {availableYears.map(year => (
                    <TabsContent key={year} value={String(year)} className="mt-4">
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
        <Tabs defaultValue="monthly" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-card">
                <TabsTrigger value="monthly" className="text-xs md:text-sm data-[state=active]:bg-primary/20">
                    Visão Mensal
                </TabsTrigger>
                <TabsTrigger value="annual" disabled className="text-xs md:text-sm opacity-50">
                    Visão Anual (Pendente)
                </TabsTrigger>
            </TabsList>
            
            <TabsContent value="monthly" className="mt-4">
                <MonthlyReportsGrid year={year} />
            </TabsContent>
            
            <TabsContent value="annual" className="mt-4">
                 <Card>
                    <CardContent className="p-6 md:p-8 text-center text-muted-foreground flex flex-col items-center">
                        <Calendar className="h-8 w-8 md:h-12 md:w-12 mb-3 md:mb-4 text-primary/50" />
                        <h3 className="text-base md:text-lg font-semibold text-foreground">
                            Relatório Anual de {year} Pendente
                        </h3>
                        <p className="text-sm max-w-md mx-auto mt-2">
                           O relatório anual será gerado automaticamente quando houver pelo menos 6 relatórios mensais.
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
            {availableMonths.map(month => (
                <MonthlyReportCard key={month} year={year} month={month} />
            ))}
        </div>
    )
}

function MonthlyReportCard({ year, month }: { year: number, month: number }) {
    const { getMonthlyReport, generateMonthlyReport } = useReports();
    const [isGenerating, setIsGenerating] = useState(false);
    const report = getMonthlyReport(year, month);
    const monthName = new Date(0, month - 1).toLocaleString('pt-BR', { month: 'short' });
    const monthNameFull = new Date(0, month - 1).toLocaleString('pt-BR', { month: 'long' });

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        try {
            await generateMonthlyReport(year, month, true);
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    if (report) {
         return (
            <Card className="flex flex-col justify-between h-full">
                <CardHeader className="pb-2 p-3 md:p-4">
                    <Typography variant="h6" className="text-sm md:text-base capitalize truncate">
                        {monthName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className={`text-xs md:text-sm font-medium ${
                        report.data.balance >= 0 ? "text-emerald-600" : "text-destructive"
                    }`}>
                        {report.data.balance.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        })}
                    </Typography>
                </CardHeader>
                <CardContent className="text-xs p-3 md:p-4 pt-0">
                    <div className="space-y-1">
                        <p className="flex items-center gap-1 text-emerald-600">
                            <TrendingUp className="h-3 w-3 flex-shrink-0"/>
                            <span className="truncate">
                                {report.data.totalIncome.toLocaleString('pt-BR', { 
                                    style: 'currency', 
                                    currency: 'BRL',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}
                            </span>
                        </p>
                        <p className="flex items-center gap-1 text-red-600">
                            <TrendingDown className="h-3 w-3 flex-shrink-0"/>
                            <span className="truncate">
                                {report.data.totalExpense.toLocaleString('pt-BR', { 
                                    style: 'currency', 
                                    currency: 'BRL',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}
                            </span>
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col justify-center items-center text-center h-full min-h-[120px] md:min-h-[140px] bg-muted/30 border-dashed">
            <div className="p-3 md:p-4 space-y-2">
                <h3 className="font-medium text-sm md:text-base capitalize">
                    {monthName}
                </h3>
                <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <Clock className="h-3 w-3"/>
                    <span>Pendente</span>
                </div>
                <Button 
                    variant="text" 
                    size="small" 
                    className="h-7 text-xs"
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <RefreshCw className="h-3 w-3" />
                    )}
                    <span className="ml-1 hidden md:inline">Gerar</span>
                </Button>
            </div>
        </Card>
    )
}

function AnnualReportDisplay({ report }: { report: Report }) {
    const chartData = report.data.topCategories
        .slice(0, 5)
        .map(cat => ({
            name: cat.category,
            value: cat.amount
        }));
    
    return (
         <div className="grid gap-4 md:gap-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
               <StatCard 
                   icon={TrendingUp} 
                   title="Total Receitas" 
                   value={report.data.totalIncome} 
                   color="text-emerald-600"
               />
               <StatCard 
                   icon={TrendingDown} 
                   title="Total Despesas" 
                   value={report.data.totalExpense} 
                   color="text-red-600"
               />
               <StatCard 
                   icon={DollarSign} 
                   title="Balanço Final" 
                   value={report.data.balance} 
                   color={report.data.balance >= 0 ? "text-emerald-600" : "text-destructive"}
               />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Pie Chart */}
                <Card>
                    <CardHeader className="pb-3 p-4 md:p-6">
                        <Typography variant="h6" className="flex items-center gap-2 text-base md:text-lg">
                            <BarChart2 className="text-primary h-4 w-4 md:h-5 md:w-5"/> 
                            Top 5 Categorias
                        </Typography>
                        <Typography variant="body2" color="text.secondary" className="text-xs md:text-sm">
                            Maiores gastos do ano
                        </Typography>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0">
                        <div className="h-48 md:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={chartData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        outerRadius="60%"
                                        fill="#8884d8"
                                    >
                                         {chartData.map((entry, index) => (
                                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                         ))}
                                    </Pie>
                                    <Legend 
                                        iconSize={6} 
                                        wrapperStyle={{fontSize: "11px"}}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card>
                    <CardHeader className="pb-3 p-4 md:p-6">
                        <Typography variant="h6" className="flex items-center gap-2 text-base md:text-lg">
                            <BarChart2 className="text-primary h-4 w-4 md:h-5 md:w-5"/> 
                            Breakdown por Categoria
                        </Typography>
                        <Typography variant="body2" color="text.secondary" className="text-xs md:text-sm">
                            Distribuição de gastos
                        </Typography>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0">
                        <div className="h-48 md:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{fontSize: 10}}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis tick={{fontSize: 10}}/>
                                    <Tooltip 
                                        formatter={(value: number) => [
                                            value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                                            'Valor'
                                        ]}
                                    />
                                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Summary */}
             <Card>
                <CardHeader className="p-4 md:p-6">
                    <Typography variant="h6" className="flex items-center gap-2 text-base md:text-lg">
                        <Sparkles className="text-primary h-4 w-4 md:h-5 md:w-5"/> 
                        Resumo Anual da IA
                    </Typography>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                    <p className="text-sm md:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {report.data.summary}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

function StatCard({ icon: Icon, title, value, color }: {
    icon: any, 
    title: string, 
    value: number, 
    color: string
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
                <Typography variant="h6" className="text-xs md:text-sm font-medium">
                    {title}
                </Typography>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
                <div className={`text-lg md:text-2xl font-bold ${color}`}>
                    {value.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

function ReportsSkeleton() {
    return (
        <div className="grid gap-4 md:gap-6">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <Skeleton className="h-20 md:h-28"/>
                <Skeleton className="h-20 md:h-28"/>
                <Skeleton className="h-20 md:h-28"/>
            </div>
            
            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <Skeleton className="h-48 md:h-64"/>
                <Skeleton className="h-48 md:h-64"/>
            </div>
            
            {/* Summary Skeleton */}
            <Skeleton className="h-24 md:h-32"/>
        </div>
    )
}
