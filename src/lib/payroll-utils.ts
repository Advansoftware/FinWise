import { PayrollData, PayrollDiscount } from '@/lib/types';

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
  const healthDiscount = payrollData.discounts.find(discount => 
    discount.name.toLowerCase().includes('plano') || 
    discount.name.toLowerCase().includes('saúde') ||
    discount.name.toLowerCase().includes('saude') ||
    discount.name.toLowerCase().includes('médico') ||
    discount.name.toLowerCase().includes('medico')
  );
  return healthDiscount?.amount || 0;
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
  const dentalDiscount = payrollData.discounts.find(discount => 
    discount.name.toLowerCase().includes('dental') || 
    discount.name.toLowerCase().includes('odonto')
  );
  return dentalDiscount?.amount || 0;
}

export function getLifeInsuranceFromPayroll(payrollData: PayrollData): number {
  const lifeDiscount = payrollData.discounts.find(discount => 
    discount.name.toLowerCase().includes('vida') || 
    discount.name.toLowerCase().includes('seguro')
  );
  return lifeDiscount?.amount || 0;
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

// Função para verificar consistência dos dados do holerite
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