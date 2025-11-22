"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@mui/material";
import { Button } from "@mui/material";
import { TextField } from "@mui/material";
import { InputLabel } from "@mui/material";
import { Select, SelectContent, MenuItem, SelectTrigger, SelectValue } from "@mui/material";
import { Save, Plus, X, Receipt, DollarSign } from "lucide-react";
import { Divider } from "@mui/material";
import { useAuth } from "@/hooks/use-auth";
import { PayrollData, PayrollDiscount, STANDARD_DISCOUNT_TYPES, STANDARD_ALLOWANCE_TYPES } from "@/lib/types";
import { Chip } from "@mui/material";
import { formatCurrency } from "@/lib/utils";
import {Box, Stack, Typography} from '@mui/material';

export function PayrollCard() {
  const [payrollData, setPayrollData] = useState<PayrollData>({
    id: "",
    userId: "",
    grossSalary: 0,
    allowances: 0,
    discounts: [],
    netSalary: 0,
    updatedAt: new Date().toISOString(),
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();

  // Calculate net salary whenever gross salary, allowances, or discounts change
  const calculateNetSalary = (gross: number, discounts: PayrollDiscount[]) => {
    const totalDiscounts = discounts.filter(d => d.type === 'discount').reduce((sum, discount) => sum + discount.amount, 0);
    const totalAllowances = discounts.filter(d => d.type === 'allowance').reduce((sum, allowance) => sum + allowance.amount, 0);
    return gross + totalAllowances - totalDiscounts;
  };

  // Update net salary whenever dependent values change
  useEffect(() => {
    const newNetSalary = calculateNetSalary(payrollData.grossSalary, payrollData.discounts);
    const totalAllowances = payrollData.discounts.filter(d => d.type === 'allowance').reduce((sum, allowance) => sum + allowance.amount, 0);
    
    if (newNetSalary !== payrollData.netSalary || totalAllowances !== payrollData.allowances) {
      setPayrollData(prev => ({
        ...prev,
        allowances: totalAllowances,
        netSalary: newNetSalary
      }));
    }
  }, [payrollData.grossSalary, payrollData.discounts]);

  // Load payroll data when component mounts
  useEffect(() => {
    if (user) {
      fetchPayrollData();
    }
  }, [user]);

  const fetchPayrollData = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/payroll/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setPayrollData(data);
      } else if (response.status === 404) {
        // No payroll data exists, keep default empty state
        setPayrollData(prev => ({
          ...prev,
          userId: user.uid,
          id: user.uid, // Use user ID as the payroll ID
        }));
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error);
    }
  };

  const savePayrollData = async () => {
    if (!user) return;

    // Ensure all data is complete before saving
    const dataToSave: PayrollData = {
      ...payrollData,
      userId: user.uid,
      id: user.uid,
      // Ensure we're saving the calculated net salary
      netSalary: calculateNetSalary(payrollData.grossSalary, payrollData.discounts),
      updatedAt: new Date().toISOString(),
      // Ensure discounts are properly formatted
      discounts: payrollData.discounts.map(discount => ({
        id: discount.id || Date.now().toString(),
        name: discount.name || '',
        amount: typeof discount.amount === 'number' ? discount.amount : 0,
        type: discount.type || 'discount'
      }))
    };

    startTransition(async () => {
      try {
        const response = await fetch(`/api/payroll/${user.uid}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSave),
        });

        if (response.ok) {
          const savedData = await response.json();
          setPayrollData(savedData);
          setIsEditing(false);
          console.log("✅ Dados do holerite salvos com sucesso:", savedData);
        } else {
          const errorData = await response.json();
          console.error("❌ Erro ao salvar dados do holerite:", errorData);
          throw new Error(errorData.error || "Failed to save payroll data");
        }
      } catch (error) {
        console.error("Error saving payroll data:", error);
        // You could add toast notification here
      }
    });
  };

  const clearPayrollData = () => {
    if (confirm("Tem certeza que deseja limpar todos os dados do holerite? Esta ação não pode ser desfeita.")) {
      const emptyPayrollData: PayrollData = {
        id: user?.uid || "",
        userId: user?.uid || "",
        grossSalary: 0,
        allowances: 0,
        discounts: [],
        netSalary: 0,
        updatedAt: new Date().toISOString(),
      };
      setPayrollData(emptyPayrollData);
      setIsEditing(false);
      
      // Salvar os dados vazios no servidor
      if (user) {
        startTransition(async () => {
          try {
            await fetch(`/api/payroll/${user.uid}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(emptyPayrollData),
            });
            console.log("✅ Dados do holerite limpos com sucesso!");
          } catch (error) {
            console.error("Error clearing payroll data:", error);
          }
        });
      }
    }
  };

  const removeDiscount = (discountId: string) => {
    setPayrollData(prev => ({
      ...prev,
      discounts: prev.discounts.filter(d => d.id !== discountId),
    }));
  };

  const updateDiscount = (discountId: string, field: keyof PayrollDiscount, value: string | number) => {
    setPayrollData(prev => ({
      ...prev,
      discounts: prev.discounts.map(d =>
        d.id === discountId ? { ...d, [field]: value } : d
      ),
    }));
  };

  const netSalary = calculateNetSalary(payrollData.grossSalary, payrollData.discounts);
  const totalDiscounts = payrollData.discounts.filter(d => d.type === 'discount').reduce((sum, discount) => sum + discount.amount, 0);
  const totalAllowances = payrollData.discounts.filter(d => d.type === 'allowance').reduce((sum, allowance) => sum + allowance.amount, 0);

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Receipt style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
            <Typography variant="h6">
              <Typography component="span" sx={{ fontSize: '1.125rem' }}>Dados do Holerite</Typography>
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            {payrollData.grossSalary > 0 && (
              <Button
                variant="contained" color="error"
                size="small"
                onClick={clearPayrollData}
                sx={{ height: 32, fontSize: '0.75rem' }}
              >
                🗑️ Limpar
              </Button>
            )}
            <Button
              variant={isEditing ? "default" : "outline"}
              size="small"
              onClick={() => {
                if (isEditing) {
                  savePayrollData();
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={isPending}
              sx={{ height: 32 }}
            >
              {isPending ? (
                "Salvando..."
              ) : isEditing ? (
                <>
                  <Save style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  Salvar
                </>
              ) : (
                "Editar"
              )}
            </Button>
          </Stack>
        </Stack>
      </CardHeader>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Salary Information Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          <Stack spacing={1}>
            <Label htmlFor="grossSalary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Salário Bruto</Label>
            {isEditing ? (
              <Input
                id="grossSalary"
                type="number"
                step="0.01"
                value={payrollData.grossSalary}
                onChange={(e) => setPayrollData(prev => ({
                  ...prev,
                  grossSalary: parseFloat(e.target.value) || 0
                }))}
                placeholder="0,00"
                sx={{ height: 36 }}
              />
            ) : (
              <Box sx={{ height: 36, display: 'flex', alignItems: 'center', px: 1.5, bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', fontWeight: 500, borderRadius: '0.375rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                {formatCurrency(payrollData.grossSalary)}
              </Box>
            )}
          </Stack>
          
          <Stack spacing={1}>
            <Label sx={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DollarSign style={{ width: '1rem', height: '1rem', color: '#2563eb' }} />
              <span>Total de Ajudas de Custo</span>
            </Label>
            <Box sx={{ height: 36, display: 'flex', alignItems: 'center', px: 1.5, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontWeight: 500, borderRadius: '0.375rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              {formatCurrency(totalAllowances)}
            </Box>
          </Stack>

          {/* Net Salary - Highlighted */}
          <Stack spacing={1}>
            <Label sx={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DollarSign style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />
              <span>Salário Líquido</span>
            </Label>
            <Box sx={{ height: 36, display: 'flex', alignItems: 'center', px: 1.5, bgcolor: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', fontWeight: 700, borderRadius: '0.375rem', border: '1px solid rgba(var(--primary-rgb), 0.2)' }}>
              {formatCurrency(payrollData.netSalary)}
            </Box>
          </Stack>
        </Box>

        {/* Discounts and Allowances Section */}
        <Stack spacing={2}>
          {/* Descontos */}
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Label sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#dc2626' }}>
                💳 Descontos {payrollData.discounts.filter(d => d.type === 'discount').length > 0 && `(${payrollData.discounts.filter(d => d.type === 'discount').length})`}
              </Label>
              {isEditing && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const newDiscount: PayrollDiscount = {
                      id: Date.now().toString(),
                      name: "",
                      amount: 0,
                      type: 'discount'
                    };
                    setPayrollData(prev => ({
                      ...prev,
                      discounts: [...prev.discounts, newDiscount]
                    }));
                  }}
                  sx={{ height: 28, fontSize: '0.75rem' }}
                >
                  <Plus style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
                  Adicionar Desconto
                </Button>
              )}
            </Stack>

            {payrollData.discounts.filter(d => d.type === 'discount').length > 0 ? (
              <Stack spacing={1} sx={{ maxHeight: 160, overflowY: 'auto' }}>
                {payrollData.discounts.filter(d => d.type === 'discount').map((discount) => (
                  <Stack 
                    key={discount.id} 
                    direction="row" 
                    alignItems="center" 
                    spacing={1} 
                    sx={{ p: 1, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.375rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                  >
                    {isEditing ? (
                      <>
                        <Select
                          value={discount.name}
                          onValueChange={(value) => updateDiscount(discount.id, "name", value)}
                        >
                          <SelectTrigger sx={{ flex: 1, height: 32, fontSize: '0.75rem' }}>
                            <SelectValue placeholder="Selecione o desconto" />
                          </SelectTrigger>
                          <SelectContent>
                            {STANDARD_DISCOUNT_TYPES.map((discountType) => (
                              <MenuItem key={discountType} value={discountType} sx={{ fontSize: '0.75rem' }}>
                                {discountType}
                              </MenuItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          value={discount.amount}
                          onChange={(e) => updateDiscount(discount.id, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          sx={{ width: 96, height: 32, fontSize: '0.75rem' }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ minWidth: '2rem', width: '2rem', height: '2rem', p: 0 }}
                          onClick={() => removeDiscount(discount.id)}
                          sx={{ height: 32, width: 32 }}
                        >
                          <X style={{ width: '0.75rem', height: '0.75rem' }} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Typography sx={{ flex: 1, fontSize: '0.75rem', fontWeight: 500, color: '#dc2626' }}>
                          {discount.name}
                        </Typography>
                        <Chip variant="contained" color="error" sx={{ fontSize: '0.75rem' }}>
                          -{formatCurrency(discount.amount)}
                        </Chip>
                      </>
                    )}
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography sx={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textAlign: 'center', py: 1 }}>
                Nenhum desconto cadastrado
              </Typography>
            )}

            {payrollData.discounts.filter(d => d.type === 'discount').length > 0 && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography component="span" sx={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 500 }}>
                  Total descontos: {formatCurrency(totalDiscounts)}
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider />

          {/* Ajudas de Custo / Adicionais */}
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Label sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#16a34a' }}>
                💰 Adicionais {payrollData.discounts.filter(d => d.type === 'allowance').length > 0 && `(${payrollData.discounts.filter(d => d.type === 'allowance').length})`}
              </Label>
              {isEditing && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const newAllowance: PayrollDiscount = {
                      id: Date.now().toString(),
                      name: "",
                      amount: 0,
                      type: 'allowance'
                    };
                    setPayrollData(prev => ({
                      ...prev,
                      discounts: [...prev.discounts, newAllowance]
                    }));
                  }}
                  sx={{ height: 28, fontSize: '0.75rem' }}
                >
                  <Plus style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
                  Adicionar Adicional
                </Button>
              )}
            </Stack>

            {payrollData.discounts.filter(d => d.type === 'allowance').length > 0 ? (
              <Stack spacing={1} sx={{ maxHeight: 160, overflowY: 'auto' }}>
                {payrollData.discounts.filter(d => d.type === 'allowance').map((allowance) => (
                  <Stack 
                    key={allowance.id} 
                    direction="row" 
                    alignItems="center" 
                    spacing={1} 
                    sx={{ p: 1, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.375rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}
                  >
                    {isEditing ? (
                      <>
                        <Select
                          value={allowance.name}
                          onValueChange={(value) => updateDiscount(allowance.id, "name", value)}
                        >
                          <SelectTrigger sx={{ flex: 1, height: 32, fontSize: '0.75rem' }}>
                            <SelectValue placeholder="Selecione o adicional" />
                          </SelectTrigger>
                          <SelectContent>
                            {STANDARD_ALLOWANCE_TYPES.map((allowanceType) => (
                              <MenuItem key={allowanceType} value={allowanceType} sx={{ fontSize: '0.75rem' }}>
                                {allowanceType}
                              </MenuItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <TextField
                          type="number"
                          value={allowance.amount}
                          onChange={(e) => updateDiscount(allowance.id, 'amount', Number(e.target.value) || 0)}
                          placeholder="Valor"
                          size="small"
                          fullWidth
                          sx={{ width: 96, height: 32, fontSize: '0.75rem' }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ minWidth: '2rem', width: '2rem', height: '2rem', p: 0 }}
                          onClick={() => removeDiscount(allowance.id)}
                          sx={{ height: 32, width: 32 }}
                        >
                          <X style={{ width: '0.75rem', height: '0.75rem' }} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Typography sx={{ flex: 1, fontSize: '0.75rem', fontWeight: 500, color: '#16a34a' }}>
                          {allowance.name}
                        </Typography>
                        <Chip variant="contained" color="secondary" sx={{ fontSize: '0.75rem', bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#16a34a' }}>
                          +{formatCurrency(allowance.amount)}
                        </Chip>
                      </>
                    )}
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography sx={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textAlign: 'center', py: 1 }}>
                Nenhum adicional cadastrado
              </Typography>
            )}

            {payrollData.discounts.filter(d => d.type === 'allowance').length > 0 && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography component="span" sx={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 500 }}>
                  Total adicionais: {formatCurrency(totalAllowances)}
                </Typography>
              </Box>
            )}
          </Stack>
        </Stack>

        {/* Summary - Compact */}
        {!isEditing && payrollData.grossSalary > 0 && (
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
            <div className="text-center">
              <strong>Cálculo:</strong> {formatCurrency(payrollData.grossSalary)} + {formatCurrency(payrollData.allowances)} - {formatCurrency(totalDiscounts)} = <span className="text-primary font-semibold">{formatCurrency(payrollData.netSalary)}</span>
            </div>
          </div>
        )}

        {payrollData.updatedAt && !isEditing && (
          <div className="text-xs text-muted-foreground text-center">
            Atualizado em: {new Date(payrollData.updatedAt).toLocaleDateString('pt-BR')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}