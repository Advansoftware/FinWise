"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Plus, X, Receipt, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { PayrollData, PayrollDiscount } from "@/lib/types";
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
  const calculateNetSalary = (gross: number, allowances: number, discounts: PayrollDiscount[]) => {
    const totalDiscounts = discounts.reduce((sum, discount) => sum + discount.amount, 0);
    return gross + allowances - totalDiscounts;
  };

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

    const dataToSave = {
      ...payrollData,
      userId: user.uid,
      id: user.uid,
      netSalary: calculateNetSalary(payrollData.grossSalary, payrollData.allowances, payrollData.discounts),
      updatedAt: new Date().toISOString(),
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
        } else {
          throw new Error("Failed to save payroll data");
        }
      } catch (error) {
        console.error("Error saving payroll data:", error);
      }
    });
  };

  const addDiscount = () => {
    const newDiscount: PayrollDiscount = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
    };
    setPayrollData(prev => ({
      ...prev,
      discounts: [...prev.discounts, newDiscount],
    }));
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

  const netSalary = calculateNetSalary(payrollData.grossSalary, payrollData.allowances, payrollData.discounts);
  const totalDiscounts = payrollData.discounts.reduce((sum, discount) => sum + discount.amount, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Holerite</CardTitle>
          </div>
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
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            ) : (
              "Editar"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Salary Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grossSalary">Salário Bruto</Label>
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
                />
              ) : (
                <div className="text-sm font-medium text-green-600">
                  {formatCurrency(payrollData.grossSalary)}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="allowances">Ajuda de Custo</Label>
              {isEditing ? (
                <Input
                  id="allowances"
                  type="number"
                  step="0.01"
                  value={payrollData.allowances}
                  onChange={(e) => setPayrollData(prev => ({
                    ...prev,
                    allowances: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="0,00"
                />
              ) : (
                <div className="text-sm font-medium text-blue-600">
                  {formatCurrency(payrollData.allowances)}
                </div>
              )}
            </div>
          </div>

          {/* Discounts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Descontos</Label>
              {isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addDiscount}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              )}
            </div>

            {payrollData.discounts.length > 0 ? (
              <div className="space-y-2">
                {payrollData.discounts.map((discount) => (
                  <div key={discount.id} className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Input
                          value={discount.name}
                          onChange={(e) => updateDiscount(discount.id, "name", e.target.value)}
                          placeholder="Nome do desconto"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={discount.amount}
                          onChange={(e) => updateDiscount(discount.id, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="w-32"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeDiscount(discount.id)}
                          className="h-9 w-9"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm">{discount.name || "Desconto"}</span>
                        <Badge variant="outline" className="text-red-600">
                          -{formatCurrency(discount.amount)}
                        </Badge>
                      </>
                    )}
                  </div>
                ))}
                {!isEditing && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Total de Descontos:</span>
                    <Badge variant="secondary" className="text-red-600">
                      -{formatCurrency(totalDiscounts)}
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              !isEditing && (
                <div className="text-sm text-muted-foreground">
                  Nenhum desconto registrado
                </div>
              )
            )}
          </div>

          <Separator />

          {/* Net Salary */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-semibold">Salário Líquido:</span>
            </div>
            <div className="text-lg font-bold text-primary">
              {formatCurrency(netSalary)}
            </div>
          </div>

          {payrollData.updatedAt && !isEditing && (
            <div className="text-xs text-muted-foreground text-center">
              Última atualização: {new Date(payrollData.updatedAt).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}