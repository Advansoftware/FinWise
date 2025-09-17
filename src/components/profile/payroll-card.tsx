"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, X, Receipt, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { PayrollData, PayrollDiscount, STANDARD_DISCOUNT_TYPES, STANDARD_ALLOWANCE_TYPES } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

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
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Dados do Holerite</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {payrollData.grossSalary > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={clearPayrollData}
                className="h-8 text-xs"
              >
                🗑️ Limpar
              </Button>
            )}
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (isEditing) {
                  savePayrollData();
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={isPending}
              className="h-8"
            >
              {isPending ? (
                "Salvando..."
              ) : isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              ) : (
                "Editar"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Salary Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="grossSalary" className="text-sm font-medium">Salário Bruto</Label>
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
                className="h-9"
              />
            ) : (
              <div className="h-9 flex items-center px-3 bg-green-50 text-green-700 font-medium rounded-md border">
                {formatCurrency(payrollData.grossSalary)}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-blue-600" />
              Total de Ajudas de Custo
            </Label>
            <div className="h-9 flex items-center px-3 bg-blue-50 text-blue-700 font-medium rounded-md border">
              {formatCurrency(totalAllowances)}
            </div>
          </div>

          {/* Net Salary - Highlighted */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-primary" />
              Salário Líquido
            </Label>
            <div className="h-9 flex items-center px-3 bg-primary/10 text-primary font-bold rounded-md border border-primary/20">
              {formatCurrency(payrollData.netSalary)}
            </div>
          </div>
        </div>

        {/* Discounts and Allowances Section */}
        <div className="space-y-4">
          {/* Descontos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-red-600 dark:text-red-400">
                💳 Descontos {payrollData.discounts.filter(d => d.type === 'discount').length > 0 && `(${payrollData.discounts.filter(d => d.type === 'discount').length})`}
              </Label>
              {isEditing && (
                <Button
                  variant="outline"
                  size="sm"
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
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar Desconto
                </Button>
              )}
            </div>

            {payrollData.discounts.filter(d => d.type === 'discount').length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {payrollData.discounts.filter(d => d.type === 'discount').map((discount) => (
                  <div key={discount.id} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-500/10 rounded-md border border-red-100 dark:border-red-800">
                    {isEditing ? (
                      <>
                        <Select
                          value={discount.name}
                          onValueChange={(value) => updateDiscount(discount.id, "name", value)}
                        >
                          <SelectTrigger className="flex-1 h-8 text-xs">
                            <SelectValue placeholder="Selecione o desconto" />
                          </SelectTrigger>
                          <SelectContent>
                            {STANDARD_DISCOUNT_TYPES.map((discountType) => (
                              <SelectItem key={discountType} value={discountType} className="text-xs">
                                {discountType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          value={discount.amount}
                          onChange={(e) => updateDiscount(discount.id, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="w-24 h-8 text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeDiscount(discount.id)}
                          className="h-8 w-8"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-xs font-medium text-red-600 dark:text-red-400">{discount.name}</span>
                        <Badge variant="destructive" className="text-xs">
                          -{formatCurrency(discount.amount)}
                        </Badge>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-2">
                Nenhum desconto cadastrado
              </div>
            )}

            {payrollData.discounts.filter(d => d.type === 'discount').length > 0 && (
              <div className="text-right">
                <span className="text-xs text-red-600 font-medium">
                  Total descontos: {formatCurrency(totalDiscounts)}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Ajudas de Custo / Adicionais */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-green-600 dark:text-green-400">
                💰 Adicionais {payrollData.discounts.filter(d => d.type === 'allowance').length > 0 && `(${payrollData.discounts.filter(d => d.type === 'allowance').length})`}
              </Label>
              {isEditing && (
                <Button
                  variant="outline"
                  size="sm"
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
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar Adicional
                </Button>
              )}
            </div>

            {payrollData.discounts.filter(d => d.type === 'allowance').length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {payrollData.discounts.filter(d => d.type === 'allowance').map((allowance) => (
                  <div key={allowance.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-500/10 rounded-md border border-green-100 dark:border-green-800">
                    {isEditing ? (
                      <>
                        <Select
                          value={allowance.name}
                          onValueChange={(value) => updateDiscount(allowance.id, "name", value)}
                        >
                          <SelectTrigger className="flex-1 h-8 text-xs">
                            <SelectValue placeholder="Selecione o adicional" />
                          </SelectTrigger>
                          <SelectContent>
                            {STANDARD_ALLOWANCE_TYPES.map((allowanceType) => (
                              <SelectItem key={allowanceType} value={allowanceType} className="text-xs">
                                {allowanceType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          value={allowance.amount}
                          onChange={(e) => updateDiscount(allowance.id, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="w-24 h-8 text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeDiscount(allowance.id)}
                          className="h-8 w-8"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-xs font-medium text-green-600 dark:text-green-400">{allowance.name}</span>
                        <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400">
                          +{formatCurrency(allowance.amount)}
                        </Badge>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-2">
                Nenhum adicional cadastrado
              </div>
            )}

            {payrollData.discounts.filter(d => d.type === 'allowance').length > 0 && (
              <div className="text-right">
                <span className="text-xs text-green-600 font-medium">
                  Total adicionais: {formatCurrency(totalAllowances)}
                </span>
              </div>
            )}
          </div>
        </div>

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