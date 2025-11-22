'use client';

import { Card, CardContent, CardHeader } from "@mui/material";
import { Button } from "@mui/material";
import { Calculator, Calendar, TrendingUp, UserCheck, AlertTriangle } from "lucide-react";
import { usePayroll } from "@/hooks/use-payroll";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { VacationCalculator } from "@/components/tools/vacation-calculator";
import { ThirteenthSalaryCalculator } from "@/components/tools/thirteenth-salary-calculator";
import { SalaryProjectionCalculator } from "@/components/tools/salary-projection-calculator";
import { FGTSCalculator } from "@/components/tools/fgts-calculator";
import { INSSCalculator } from "@/components/tools/inss-calculator";
import { SeveranceCalculator } from "@/components/tools/severance-calculator";
import { IncomeTaxCalculator } from "@/components/tools/income-tax-calculator";
import { ConsignedLoanCalculator } from "@/components/tools/consigned-loan-calculator";
import { PostVacationCalculator } from "@/components/tools/post-vacation-calculator";

export default function ToolsPage() {
  const { payrollData, loading, hasValidPayrollData } = usePayroll();

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ferramentas Financeiras</h1>
          <p className="text-muted-foreground">Calculadoras e ferramentas para planejamento financeiro.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!hasValidPayrollData()) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ferramentas Financeiras</h1>
          <p className="text-muted-foreground">Calculadoras e ferramentas para planejamento financeiro.</p>
        </div>
        
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <Typography variant="h6" className="text-amber-800">Dados do Holerite Necessários</Typography>
            <Typography variant="body2" color="text.secondary" className="text-amber-700">
              Para utilizar as ferramentas de cálculo, você precisa configurar seus dados de holerite primeiro.
            </Typography>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-amber-700 mb-6">
              As calculadoras dependem das informações do seu salário bruto, descontos e ajuda de custo 
              para fazer cálculos precisos de férias, 13º salário e projeções.
            </p>
            <Link href="/profile">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                <UserCheck className="h-4 w-4 mr-2" />
                Configurar Holerite no Perfil
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Preview das ferramentas (desabilitadas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <Typography variant="h6" className="text-lg">Calculadora de Férias</Typography>
              </div>
              <Typography variant="body2" color="text.secondary">
                Calcule o valor das suas férias considerando salário base e adicionais.
              </Typography>
            </CardHeader>
            <CardContent>
              <Button disabled variant="outlined" className="w-full">
                Requer dados do holerite
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <Typography variant="h6" className="text-lg">Calculadora do 13º Salário</Typography>
              </div>
              <Typography variant="body2" color="text.secondary">
                Estime o valor do seu 13º salário baseado no salário atual.
              </Typography>
            </CardHeader>
            <CardContent>
              <Button disabled variant="outlined" className="w-full">
                Requer dados do holerite
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <Typography variant="h6" className="text-lg">Projeção Salarial</Typography>
              </div>
              <Typography variant="body2" color="text.secondary">
                Projete ganhos futuros e planeje aumentos salariais.
              </Typography>
            </CardHeader>
            <CardContent>
              <Button disabled variant="outlined" className="w-full">
                Requer dados do holerite
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <Typography variant="h6" className="text-lg">Calculadora de FGTS</Typography>
              </div>
              <Typography variant="body2" color="text.secondary">
                Calcule depósitos mensais e saldo projetado do FGTS.
              </Typography>
            </CardHeader>
            <CardContent>
              <Button disabled variant="outlined" className="w-full">
                Requer dados do holerite
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <Typography variant="h6" className="text-lg">Calculadora de INSS</Typography>
              </div>
              <Typography variant="body2" color="text.secondary">
                Contribuição previdenciária e estimativa de aposentadoria.
              </Typography>
            </CardHeader>
            <CardContent>
              <Button disabled variant="outlined" className="w-full">
                Requer dados do holerite
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <Typography variant="h6" className="text-lg">Calculadora de Rescisão</Typography>
              </div>
              <Typography variant="body2" color="text.secondary">
                Valores da rescisão trabalhista conforme a CLT.
              </Typography>
            </CardHeader>
            <CardContent>
              <Button disabled variant="outlined" className="w-full">
                Requer dados do holerite
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <Typography variant="h6" className="text-lg">Calculadora de IR</Typography>
              </div>
              <Typography variant="body2" color="text.secondary">
                Imposto de renda mensal, anual e estimativa de restituição.
              </Typography>
            </CardHeader>
            <CardContent>
              <Button disabled variant="outlined" className="w-full">
                Requer dados do holerite
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <Typography variant="h6" className="text-lg">Empréstimo Consignado</Typography>
              </div>
              <Typography variant="body2" color="text.secondary">
                Simule empréstimos com desconto na folha de pagamento.
              </Typography>
            </CardHeader>
            <CardContent>
              <Button disabled variant="outlined" className="w-full">
                Requer dados do holerite
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ferramentas Financeiras</h1>
        <p className="text-muted-foreground">
          Gaveta completa de calculadoras baseadas nos seus dados de holerite para planejamento financeiro.
        </p>
      </div>

      {/* Seção: Benefícios Trabalhistas */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">💰 Benefícios Trabalhistas</h2>
          <p className="text-sm text-muted-foreground">Cálculos de férias, 13º salário e projeções salariais</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VacationCalculator payrollData={payrollData!} />
          <ThirteenthSalaryCalculator payrollData={payrollData!} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PostVacationCalculator payrollData={payrollData!} />
          <SalaryProjectionCalculator payrollData={payrollData!} />
        </div>
      </div>

      {/* Seção: Contribuições e Impostos */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">🏛️ Contribuições e Impostos</h2>
          <p className="text-sm text-muted-foreground">FGTS, INSS e Imposto de Renda</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FGTSCalculator payrollData={payrollData!} />
          <INSSCalculator payrollData={payrollData!} />
        </div>
        <div className="grid grid-cols-1 gap-6">
          <IncomeTaxCalculator payrollData={payrollData!} />
        </div>
      </div>

      {/* Seção: Planejamento e Crédito */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">📊 Planejamento e Crédito</h2>
          <p className="text-sm text-muted-foreground">Rescisão trabalhista e empréstimo consignado</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SeveranceCalculator payrollData={payrollData!} />
          <ConsignedLoanCalculator payrollData={payrollData!} />
        </div>
      </div>
    </div>
  );
}