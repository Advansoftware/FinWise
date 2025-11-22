'use client';

import { Card, CardContent, CardHeader, Typography, Grid, Stack, Box, Button, Skeleton } from "@mui/material";
import { Calculator, Calendar, TrendingUp, UserCheck, AlertTriangle } from "lucide-react";
import { usePayroll } from "@/hooks/use-payroll";
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
      <Stack spacing={6}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Ferramentas Financeiras</Typography>
          <Typography variant="body1" color="text.secondary">Calculadoras e ferramentas para planejamento financeiro.</Typography>
        </Box>
        
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
                <Card>
                <CardHeader
                    title={<Skeleton variant="text" width="75%" height={32} />}
                    subheader={<Skeleton variant="text" width="100%" height={24} />}
                />
                <CardContent>
                    <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
                </CardContent>
                </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    );
  }

  if (!hasValidPayrollData()) {
    return (
      <Stack spacing={6}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Ferramentas Financeiras</Typography>
          <Typography variant="body1" color="text.secondary">Calculadoras e ferramentas para planejamento financeiro.</Typography>
        </Box>
        
        <Card sx={{ border: 1, borderColor: 'warning.light', bgcolor: 'warning.lighter' }}>
          <CardHeader 
            sx={{ textAlign: 'center' }}
            title={
                <Stack alignItems="center" spacing={2}>
                    <Box sx={{ width: 48, height: 48, bgcolor: 'warning.light', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle className="h-6 w-6 text-warning-main" />
                    </Box>
                    <Typography variant="h6" color="warning.dark">Dados do Holerite Necessários</Typography>
                </Stack>
            }
            subheader={
                <Typography variant="body2" color="warning.dark" sx={{ mt: 1 }}>
                    Para utilizar as ferramentas de cálculo, você precisa configurar seus dados de holerite primeiro.
                </Typography>
            }
          />
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="body1" color="warning.dark" paragraph>
              As calculadoras dependem das informações do seu salário bruto, descontos e ajuda de custo 
              para fazer cálculos precisos de férias, 13º salário e projeções.
            </Typography>
            <Link href="/profile" passHref>
              <Button variant="contained" color="warning" startIcon={<UserCheck size={16} />}>
                Configurar Holerite no Perfil
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Preview das ferramentas (desabilitadas) */}
        <Grid container spacing={3} sx={{ opacity: 0.5 }}>
          <Grid item xs={12} md={6} lg={4}>
            <Card>
                <CardHeader
                    title={
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Calendar className="h-5 w-5 text-primary" />
                            <Typography variant="h6">Calculadora de Férias</Typography>
                        </Stack>
                    }
                    subheader={<Typography variant="body2" color="text.secondary">Calcule o valor das suas férias considerando salário base e adicionais.</Typography>}
                />
                <CardContent>
                <Button disabled variant="outlined" fullWidth>
                    Requer dados do holerite
                </Button>
                </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card>
                <CardHeader
                    title={
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <Typography variant="h6">Calculadora do 13º Salário</Typography>
                        </Stack>
                    }
                    subheader={<Typography variant="body2" color="text.secondary">Estime o valor do seu 13º salário baseado no salário atual.</Typography>}
                />
                <CardContent>
                <Button disabled variant="outlined" fullWidth>
                    Requer dados do holerite
                </Button>
                </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card>
                <CardHeader
                    title={
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Calculator className="h-5 w-5 text-primary" />
                            <Typography variant="h6">Projeção Salarial</Typography>
                        </Stack>
                    }
                    subheader={<Typography variant="body2" color="text.secondary">Projete ganhos futuros e planeje aumentos salariais.</Typography>}
                />
                <CardContent>
                <Button disabled variant="outlined" fullWidth>
                    Requer dados do holerite
                </Button>
                </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card>
                <CardHeader
                    title={
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Calculator className="h-5 w-5 text-primary" />
                            <Typography variant="h6">Calculadora de FGTS</Typography>
                        </Stack>
                    }
                    subheader={<Typography variant="body2" color="text.secondary">Calcule depósitos mensais e saldo projetado do FGTS.</Typography>}
                />
                <CardContent>
                <Button disabled variant="outlined" fullWidth>
                    Requer dados do holerite
                </Button>
                </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card>
                <CardHeader
                    title={
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Calculator className="h-5 w-5 text-primary" />
                            <Typography variant="h6">Calculadora de INSS</Typography>
                        </Stack>
                    }
                    subheader={<Typography variant="body2" color="text.secondary">Contribuição previdenciária e estimativa de aposentadoria.</Typography>}
                />
                <CardContent>
                <Button disabled variant="outlined" fullWidth>
                    Requer dados do holerite
                </Button>
                </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card>
                <CardHeader
                    title={
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Calculator className="h-5 w-5 text-primary" />
                            <Typography variant="h6">Calculadora de Rescisão</Typography>
                        </Stack>
                    }
                    subheader={<Typography variant="body2" color="text.secondary">Valores da rescisão trabalhista conforme a CLT.</Typography>}
                />
                <CardContent>
                <Button disabled variant="outlined" fullWidth>
                    Requer dados do holerite
                </Button>
                </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card>
                <CardHeader
                    title={
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Calculator className="h-5 w-5 text-primary" />
                            <Typography variant="h6">Calculadora de IR</Typography>
                        </Stack>
                    }
                    subheader={<Typography variant="body2" color="text.secondary">Imposto de renda mensal, anual e estimativa de restituição.</Typography>}
                />
                <CardContent>
                <Button disabled variant="outlined" fullWidth>
                    Requer dados do holerite
                </Button>
                </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card>
                <CardHeader
                    title={
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Calculator className="h-5 w-5 text-primary" />
                            <Typography variant="h6">Empréstimo Consignado</Typography>
                        </Stack>
                    }
                    subheader={<Typography variant="body2" color="text.secondary">Simule empréstimos com desconto na folha de pagamento.</Typography>}
                />
                <CardContent>
                <Button disabled variant="outlined" fullWidth>
                    Requer dados do holerite
                </Button>
                </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    );
  }

  return (
    <Stack spacing={6}>
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Ferramentas Financeiras</Typography>
        <Typography variant="body1" color="text.secondary">
          Gaveta completa de calculadoras baseadas nos seus dados de holerite para planejamento financeiro.
        </Typography>
      </Box>

      {/* Seção: Benefícios Trabalhistas */}
      <Stack spacing={4}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>💰 Benefícios Trabalhistas</Typography>
          <Typography variant="body2" color="text.secondary">Cálculos de férias, 13º salário e projeções salariais</Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
             <VacationCalculator payrollData={payrollData!} />
          </Grid>
          <Grid item xs={12} lg={6}>
             <ThirteenthSalaryCalculator payrollData={payrollData!} />
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
             <PostVacationCalculator payrollData={payrollData!} />
          </Grid>
          <Grid item xs={12} lg={6}>
             <SalaryProjectionCalculator payrollData={payrollData!} />
          </Grid>
        </Grid>
      </Stack>

      {/* Seção: Contribuições e Impostos */}
      <Stack spacing={4}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>🏛️ Contribuições e Impostos</Typography>
          <Typography variant="body2" color="text.secondary">FGTS, INSS e Imposto de Renda</Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
             <FGTSCalculator payrollData={payrollData!} />
          </Grid>
          <Grid item xs={12} lg={6}>
             <INSSCalculator payrollData={payrollData!} />
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid xs={12}>
             <IncomeTaxCalculator payrollData={payrollData!} />
          </Grid>
        </Grid>
      </Stack>

      {/* Seção: Planejamento e Crédito */}
      <Stack spacing={4}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>📊 Planejamento e Crédito</Typography>
          <Typography variant="body2" color="text.secondary">Rescisão trabalhista e empréstimo consignado</Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
             <SeveranceCalculator payrollData={payrollData!} />
          </Grid>
          <Grid item xs={12} lg={6}>
             <ConsignedLoanCalculator payrollData={payrollData!} />
          </Grid>
        </Grid>
      </Stack>
    </Stack>
  );
}