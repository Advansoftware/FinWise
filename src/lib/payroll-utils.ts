import {PayrollData, PayrollDiscount} from '@/lib/types';

// Utilitários para extrair informações dos dados do holerite

export function getINSSFromPayroll(payrollData: PayrollData): number {
  const inssDiscount = payrollData.discounts.find(discount =>
    discount.name.toLowerCase().includes('inss') ||
    discount.name.toLowerCase().includes('previdência') ||
    discount.name.toLowerCase().includes('previdencia')
  );
  return inssDiscount?.amount || 0;
}

export function getIRFromPayroll(payrollData: PayrollData): number {
  const irDiscount = payrollData.discounts.find(discount =>
    discount.name.toLowerCase().includes('ir') ||
    discount.name.toLowerCase().includes('imposto') ||
    discount.name.toLowerCase().includes('renda')
  );
  return irDiscount?.amount || 0;
}

export function getHealthInsuranceFromPayroll(payrollData: PayrollData): number {
  const healthDiscounts = payrollData.discounts.filter(discount =>
    discount.name.toLowerCase().includes('plano') ||
    discount.name.toLowerCase().includes('saúde') ||
    discount.name.toLowerCase().includes('saude') ||
    discount.name.toLowerCase().includes('médico') ||
    discount.name.toLowerCase().includes('medico')
  );
  return healthDiscounts.reduce((sum, discount) => sum + discount.amount, 0);
}

export function getUnionFeeFromPayroll(payrollData: PayrollData): number {
  const unionDiscount = payrollData.discounts.find(discount =>
    discount.name.toLowerCase().includes('sindicato') ||
    discount.name.toLowerCase().includes('sindical') ||
    discount.name.toLowerCase().includes('confederativo')
  );
  return unionDiscount?.amount || 0;
}

export function getDentalInsuranceFromPayroll(payrollData: PayrollData): number {
  const dentalDiscounts = payrollData.discounts.filter(discount =>
    discount.name.toLowerCase().includes('dental') ||
    discount.name.toLowerCase().includes('odonto')
  );
  return dentalDiscounts.reduce((sum, discount) => sum + discount.amount, 0);
}

export function getLifeInsuranceFromPayroll(payrollData: PayrollData): number {
  const lifeDiscounts = payrollData.discounts.filter(discount =>
    discount.name.toLowerCase().includes('vida') ||
    discount.name.toLowerCase().includes('seguro')
  );
  return lifeDiscounts.reduce((sum, discount) => sum + discount.amount, 0);
}

export function getTransportVoucherFromPayroll(payrollData: PayrollData): number {
  const transportDiscount = payrollData.discounts.find(discount =>
    discount.name.toLowerCase().includes('vale') ||
    discount.name.toLowerCase().includes('transporte') ||
    discount.name.toLowerCase().includes('vt')
  );
  return transportDiscount?.amount || 0;
}

export function getMealVoucherFromPayroll(payrollData: PayrollData): number {
  const mealDiscount = payrollData.discounts.find(discount =>
    discount.name.toLowerCase().includes('alimentação') ||
    discount.name.toLowerCase().includes('alimentacao') ||
    discount.name.toLowerCase().includes('refeição') ||
    discount.name.toLowerCase().includes('refeicao') ||
    discount.name.toLowerCase().includes('va') ||
    discount.name.toLowerCase().includes('vr')
  );
  return mealDiscount?.amount || 0;
}

// Função para calcular INSS baseado no salário bruto (para validação)
export function calculateINSSFromSalary(grossSalary: number): number {
  const inssTable = [
    { min: 0, max: 1412.00, rate: 0.075 },
    { min: 1412.01, max: 2666.68, rate: 0.09 },
    { min: 2666.69, max: 4000.03, rate: 0.12 },
    { min: 4000.04, max: 7786.02, rate: 0.14 }
  ];

  let contribution = 0;
  for (const bracket of inssTable) {
    if (grossSalary > bracket.min) {
      const taxableAmount = Math.min(grossSalary, bracket.max) - bracket.min + 0.01;
      contribution += taxableAmount * bracket.rate;
    }
  }

  // Limite máximo do INSS
  const maxContribution = 7786.02 * 0.14;
  return Math.min(contribution, maxContribution);
}

// Função para calcular IR baseado no salário e deduções (para validação)
export function calculateIRFromSalary(grossSalary: number, inssDiscount: number, dependents: number = 0): number {
  const irTable = [
    { min: 0, max: 2259.20, rate: 0, deduction: 0 },
    { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44 },
    { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44 },
    { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77 },
    { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.00 }
  ];

  // Base de cálculo = salário bruto - INSS - dependentes
  const dependentDeduction = dependents * 189.59;
  const taxableIncome = grossSalary - inssDiscount - dependentDeduction;

  // Encontrar faixa e calcular IR
  for (const range of irTable) {
    if (taxableIncome >= range.min && taxableIncome <= range.max) {
      return Math.max(0, (taxableIncome * range.rate) - range.deduction);
    }
  }

  return 0;
}

export function getConsignedLoanFromPayroll(payrollData: PayrollData): number {
  const consignedDiscounts = payrollData.discounts.filter(discount =>
    discount.name.toLowerCase().includes('consignado') ||
    discount.name.toLowerCase().includes('empréstimo') ||
    discount.name.toLowerCase().includes('emprestimo')
  );
  return consignedDiscounts.reduce((sum, discount) => sum + discount.amount, 0);
}

// Função para calcular o impacto do empréstimo consignado nas férias
export function calculateConsignedImpactOnVacation(grossSalary: number, consignedAmount: number): {
  maxAllowedOnVacation: number;
  applicableAmount: number;
  isWithinLimit: boolean;
  explanation: string;
} {
  // Nas férias, o empréstimo consignado pode descontar até 35% do valor bruto das férias
  const vacationSalary = grossSalary + (grossSalary / 3); // Salário + 1/3 constitucional
  const maxAllowedOnVacation = vacationSalary * 0.35;
  const applicableAmount = Math.min(consignedAmount, maxAllowedOnVacation);

  return {
    maxAllowedOnVacation,
    applicableAmount,
    isWithinLimit: consignedAmount <= maxAllowedOnVacation,
    explanation: consignedAmount > maxAllowedOnVacation
      ? `Valor excede o limite de 35% das férias. Aplicando apenas ${applicableAmount.toFixed(2)}`
      : "Valor dentro do limite permitido para férias"
  };
}

// Função para calcular o impacto do empréstimo consignado no 13º salário
export function calculateConsignedImpactOnThirteenth(grossSalary: number, consignedAmount: number): {
  maxAllowedOnThirteenth: number;
  applicableAmount: number;
  isWithinLimit: boolean;
  explanation: string;
} {
  // No 13º salário, o empréstimo consignado pode descontar até 35% do valor bruto
  const maxAllowedOnThirteenth = grossSalary * 0.35;
  const applicableAmount = Math.min(consignedAmount, maxAllowedOnThirteenth);

  return {
    maxAllowedOnThirteenth,
    applicableAmount,
    isWithinLimit: consignedAmount <= maxAllowedOnThirteenth,
    explanation: consignedAmount > maxAllowedOnThirteenth
      ? `Valor excede o limite de 35% do 13º salário. Aplicando apenas ${applicableAmount.toFixed(2)}`
      : "Valor dentro do limite permitido para 13º salário"
  };
}

// Função para verificar se o empréstimo consignado está dentro dos limites legais
export function validateConsignedLoanLimits(payrollData: PayrollData, employeeType: 'CLT' | 'Servidor Público' | 'Aposentado INSS'): {
  isValid: boolean;
  maxAllowedMargin: number;
  currentCommitment: number;
  marginRate: number;
  warnings: string[];
} {
  const consignedAmount = getConsignedLoanFromPayroll(payrollData);
  const warnings: string[] = [];

  // Margens permitidas por tipo de funcionário
  const marginRates = {
    'CLT': 0.30, // 30% para CLT
    'Servidor Público': 0.35, // 35% para servidor público
    'Aposentado INSS': 0.45 // 45% para aposentados do INSS
  };

  const marginRate = marginRates[employeeType];
  const maxAllowedMargin = payrollData.netSalary * marginRate;
  const currentCommitment = (consignedAmount / payrollData.netSalary) * 100;

  if (consignedAmount > maxAllowedMargin) {
    warnings.push(`Empréstimo consignado excede a margem permitida de ${(marginRate * 100).toFixed(0)}% para ${employeeType}`);
  }

  return {
    isValid: consignedAmount <= maxAllowedMargin,
    maxAllowedMargin,
    currentCommitment,
    marginRate,
    warnings
  };
}
export function validatePayrollData(payrollData: PayrollData): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const calculatedINSS = calculateINSSFromSalary(payrollData.grossSalary);
  const registeredINSS = getINSSFromPayroll(payrollData);

  const calculatedIR = calculateIRFromSalary(payrollData.grossSalary, registeredINSS);
  const registeredIR = getIRFromPayroll(payrollData);

  // Verificar INSS
  if (Math.abs(calculatedINSS - registeredINSS) > 10) {
    warnings.push(`INSS registrado (${registeredINSS.toFixed(2)}) difere do calculado (${calculatedINSS.toFixed(2)})`);
    suggestions.push('Verifique se o desconto de INSS está correto no seu holerite');
  }

  // Verificar IR
  if (Math.abs(calculatedIR - registeredIR) > 10) {
    warnings.push(`IR registrado (${registeredIR.toFixed(2)}) difere do calculado (${calculatedIR.toFixed(2)})`);
    suggestions.push('Verifique se o desconto de IR está correto ou se há dependentes não considerados');
  }

  // Verificar salário líquido
  const totalDiscounts = payrollData.discounts.reduce((sum, discount) => sum + discount.amount, 0);
  const calculatedNetSalary = payrollData.grossSalary + payrollData.allowances - totalDiscounts;

  if (Math.abs(calculatedNetSalary - payrollData.netSalary) > 5) {
    warnings.push(`Salário líquido pode estar incorreto. Calculado: ${calculatedNetSalary.toFixed(2)}, Registrado: ${payrollData.netSalary.toFixed(2)}`);
    suggestions.push('Confira se todos os descontos foram incluídos corretamente');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  };
}