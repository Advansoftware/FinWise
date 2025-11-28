"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Select,
  MenuItem,
  Divider,
  Chip,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import { Save, Plus, X, Receipt, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  PayrollData,
  PayrollDiscount,
  STANDARD_DISCOUNT_TYPES,
  STANDARD_ALLOWANCE_TYPES,
} from "@/lib/types";
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

  const calculateNetSalary = (gross: number, discounts: PayrollDiscount[]) => {
    const totalDiscounts = discounts
      .filter((d) => d.type === "discount")
      .reduce((sum, discount) => sum + discount.amount, 0);
    const totalAllowances = discounts
      .filter((d) => d.type === "allowance")
      .reduce((sum, allowance) => sum + allowance.amount, 0);
    return gross + totalAllowances - totalDiscounts;
  };

  useEffect(() => {
    const newNetSalary = calculateNetSalary(
      payrollData.grossSalary,
      payrollData.discounts
    );
    const totalAllowances = payrollData.discounts
      .filter((d) => d.type === "allowance")
      .reduce((sum, allowance) => sum + allowance.amount, 0);

    if (
      newNetSalary !== payrollData.netSalary ||
      totalAllowances !== payrollData.allowances
    ) {
      setPayrollData((prev) => ({
        ...prev,
        allowances: totalAllowances,
        netSalary: newNetSalary,
      }));
    }
  }, [payrollData.grossSalary, payrollData.discounts]);

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
        setPayrollData((prev) => ({
          ...prev,
          userId: user.uid,
          id: user.uid,
        }));
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error);
    }
  };

  const savePayrollData = async () => {
    if (!user) return;

    const dataToSave: PayrollData = {
      ...payrollData,
      userId: user.uid,
      id: user.uid,
      netSalary: calculateNetSalary(
        payrollData.grossSalary,
        payrollData.discounts
      ),
      updatedAt: new Date().toISOString(),
      discounts: payrollData.discounts.map((discount) => ({
        id: discount.id || Date.now().toString(),
        name: discount.name || "",
        amount: typeof discount.amount === "number" ? discount.amount : 0,
        type: discount.type || "discount",
      })),
    };

    startTransition(async () => {
      try {
        const response = await fetch(`/api/payroll/${user.uid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSave),
        });

        if (response.ok) {
          const savedData = await response.json();
          setPayrollData(savedData);
          setIsEditing(false);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save payroll data");
        }
      } catch (error) {
        console.error("Error saving payroll data:", error);
      }
    });
  };

  const clearPayrollData = () => {
    if (
      confirm(
        "Tem certeza que deseja limpar todos os dados do holerite? Esta ação não pode ser desfeita."
      )
    ) {
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

      if (user) {
        startTransition(async () => {
          try {
            await fetch(`/api/payroll/${user.uid}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(emptyPayrollData),
            });
          } catch (error) {
            console.error("Error clearing payroll data:", error);
          }
        });
      }
    }
  };

  const removeDiscount = (discountId: string) => {
    setPayrollData((prev) => ({
      ...prev,
      discounts: prev.discounts.filter((d) => d.id !== discountId),
    }));
  };

  const updateDiscount = (
    discountId: string,
    field: keyof PayrollDiscount,
    value: string | number
  ) => {
    setPayrollData((prev) => ({
      ...prev,
      discounts: prev.discounts.map((d) =>
        d.id === discountId ? { ...d, [field]: value } : d
      ),
    }));
  };

  const totalDiscounts = payrollData.discounts
    .filter((d) => d.type === "discount")
    .reduce((sum, discount) => sum + discount.amount, 0);
  const totalAllowances = payrollData.discounts
    .filter((d) => d.type === "allowance")
    .reduce((sum, allowance) => sum + allowance.amount, 0);

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader sx={{ pb: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Receipt style={{ width: 20, height: 20 }} />
            <Typography variant="h6" sx={{ fontSize: "1.125rem" }}>
              Dados do Holerite
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            {payrollData.grossSalary > 0 && (
              <Button
                variant="contained"
                color="error"
                size="small"
                onClick={clearPayrollData}
                sx={{ height: 32, fontSize: "0.75rem" }}
              >
                🗑️ Limpar
              </Button>
            )}
            <Button
              variant={isEditing ? "contained" : "outlined"}
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
                  <Save style={{ width: 16, height: 16, marginRight: 8 }} />
                  Salvar
                </>
              ) : (
                "Editar"
              )}
            </Button>
          </Stack>
        </Stack>
      </CardHeader>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Salary Information Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          <Stack spacing={1}>
            <Typography
              component="label"
              htmlFor="grossSalary"
              sx={{ fontSize: "0.875rem", fontWeight: 500 }}
            >
              Salário Bruto
            </Typography>
            {isEditing ? (
              <TextField
                id="grossSalary"
                type="number"
                value={payrollData.grossSalary}
                onChange={(e) =>
                  setPayrollData((prev) => ({
                    ...prev,
                    grossSalary: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0,00"
                size="small"
                fullWidth
                inputProps={{ step: "0.01" }}
              />
            ) : (
              <Box
                sx={{
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  px: 1.5,
                  bgcolor: "rgba(34, 197, 94, 0.1)",
                  color: "#16a34a",
                  fontWeight: 500,
                  borderRadius: 1,
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                }}
              >
                {formatCurrency(payrollData.grossSalary)}
              </Box>
            )}
          </Stack>

          <Stack spacing={1}>
            <Typography
              component="label"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <DollarSign style={{ width: 16, height: 16, color: "#2563eb" }} />
              <span>Total de Ajudas de Custo</span>
            </Typography>
            <Box
              sx={{
                height: 36,
                display: "flex",
                alignItems: "center",
                px: 1.5,
                bgcolor: "rgba(59, 130, 246, 0.1)",
                color: "#2563eb",
                fontWeight: 500,
                borderRadius: 1,
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              {formatCurrency(totalAllowances)}
            </Box>
          </Stack>

          <Stack spacing={1}>
            <Typography
              component="label"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <DollarSign style={{ width: 16, height: 16 }} />
              <span>Salário Líquido</span>
            </Typography>
            <Box
              sx={{
                height: 36,
                display: "flex",
                alignItems: "center",
                px: 1.5,
                bgcolor: (theme) => `${theme.palette.primary.main}1a`,
                color: "primary.main",
                fontWeight: 700,
                borderRadius: 1,
                border: (theme) => `1px solid ${theme.palette.primary.main}33`,
              }}
            >
              {formatCurrency(payrollData.netSalary)}
            </Box>
          </Stack>
        </Box>

        {/* Discounts and Allowances Section */}
        <Stack spacing={2}>
          {/* Descontos */}
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography
                component="label"
                sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#dc2626" }}
              >
                💳 Descontos{" "}
                {payrollData.discounts.filter((d) => d.type === "discount")
                  .length > 0 &&
                  `(${
                    payrollData.discounts.filter((d) => d.type === "discount")
                      .length
                  })`}
              </Typography>
              {isEditing && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const newDiscount: PayrollDiscount = {
                      id: Date.now().toString(),
                      name: "",
                      amount: 0,
                      type: "discount",
                    };
                    setPayrollData((prev) => ({
                      ...prev,
                      discounts: [...prev.discounts, newDiscount],
                    }));
                  }}
                  sx={{ height: 28, fontSize: "0.75rem" }}
                >
                  <Plus style={{ width: 12, height: 12, marginRight: 4 }} />
                  Adicionar Desconto
                </Button>
              )}
            </Stack>

            {payrollData.discounts.filter((d) => d.type === "discount").length >
            0 ? (
              <Stack spacing={1} sx={{ maxHeight: 160, overflowY: "auto" }}>
                {payrollData.discounts
                  .filter((d) => d.type === "discount")
                  .map((discount) => (
                    <Stack
                      key={discount.id}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{
                        p: 1,
                        bgcolor: "rgba(239, 68, 68, 0.1)",
                        borderRadius: 1,
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                      }}
                    >
                      {isEditing ? (
                        <>
                          <Select
                            value={discount.name}
                            onChange={(e) =>
                              updateDiscount(
                                discount.id,
                                "name",
                                e.target.value
                              )
                            }
                            size="small"
                            fullWidth
                            sx={{ flex: 1, fontSize: "0.75rem" }}
                          >
                            {STANDARD_DISCOUNT_TYPES.map((discountType) => (
                              <MenuItem
                                key={discountType}
                                value={discountType}
                                sx={{ fontSize: "0.75rem" }}
                              >
                                {discountType}
                              </MenuItem>
                            ))}
                          </Select>
                          <TextField
                            type="number"
                            value={discount.amount}
                            onChange={(e) =>
                              updateDiscount(
                                discount.id,
                                "amount",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0,00"
                            size="small"
                            inputProps={{ step: "0.01" }}
                            sx={{ width: 96, fontSize: "0.75rem" }}
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => removeDiscount(discount.id)}
                            sx={{ height: 32, width: 32, minWidth: 32, p: 0 }}
                          >
                            <X style={{ width: 12, height: 12 }} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Typography
                            sx={{
                              flex: 1,
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              color: "#dc2626",
                            }}
                          >
                            {discount.name}
                          </Typography>
                          <Chip
                            variant="filled"
                            color="error"
                            label={`-${formatCurrency(discount.amount)}`}
                            sx={{ fontSize: "0.75rem" }}
                          />
                        </>
                      )}
                    </Stack>
                  ))}
              </Stack>
            ) : (
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: "text.secondary",
                  textAlign: "center",
                  py: 1,
                }}
              >
                Nenhum desconto cadastrado
              </Typography>
            )}

            {payrollData.discounts.filter((d) => d.type === "discount").length >
              0 && (
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  component="span"
                  sx={{
                    fontSize: "0.75rem",
                    color: "#dc2626",
                    fontWeight: 500,
                  }}
                >
                  Total descontos: {formatCurrency(totalDiscounts)}
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider />

          {/* Ajudas de Custo / Adicionais */}
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography
                component="label"
                sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#16a34a" }}
              >
                💰 Adicionais{" "}
                {payrollData.discounts.filter((d) => d.type === "allowance")
                  .length > 0 &&
                  `(${
                    payrollData.discounts.filter((d) => d.type === "allowance")
                      .length
                  })`}
              </Typography>
              {isEditing && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const newAllowance: PayrollDiscount = {
                      id: Date.now().toString(),
                      name: "",
                      amount: 0,
                      type: "allowance",
                    };
                    setPayrollData((prev) => ({
                      ...prev,
                      discounts: [...prev.discounts, newAllowance],
                    }));
                  }}
                  sx={{ height: 28, fontSize: "0.75rem" }}
                >
                  <Plus style={{ width: 12, height: 12, marginRight: 4 }} />
                  Adicionar Adicional
                </Button>
              )}
            </Stack>

            {payrollData.discounts.filter((d) => d.type === "allowance")
              .length > 0 ? (
              <Stack spacing={1} sx={{ maxHeight: 160, overflowY: "auto" }}>
                {payrollData.discounts
                  .filter((d) => d.type === "allowance")
                  .map((allowance) => (
                    <Stack
                      key={allowance.id}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{
                        p: 1,
                        bgcolor: "rgba(34, 197, 94, 0.1)",
                        borderRadius: 1,
                        border: "1px solid rgba(34, 197, 94, 0.2)",
                      }}
                    >
                      {isEditing ? (
                        <>
                          <Select
                            value={allowance.name}
                            onChange={(e) =>
                              updateDiscount(
                                allowance.id,
                                "name",
                                e.target.value
                              )
                            }
                            size="small"
                            fullWidth
                            sx={{ flex: 1, fontSize: "0.75rem" }}
                          >
                            {STANDARD_ALLOWANCE_TYPES.map((allowanceType) => (
                              <MenuItem
                                key={allowanceType}
                                value={allowanceType}
                                sx={{ fontSize: "0.75rem" }}
                              >
                                {allowanceType}
                              </MenuItem>
                            ))}
                          </Select>
                          <TextField
                            type="number"
                            value={allowance.amount}
                            onChange={(e) =>
                              updateDiscount(
                                allowance.id,
                                "amount",
                                Number(e.target.value) || 0
                              )
                            }
                            placeholder="Valor"
                            size="small"
                            fullWidth
                            sx={{ width: 96, height: 32, fontSize: "0.75rem" }}
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => removeDiscount(allowance.id)}
                            sx={{ height: 32, width: 32, minWidth: 32, p: 0 }}
                          >
                            <X style={{ width: 12, height: 12 }} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Typography
                            sx={{
                              flex: 1,
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              color: "#16a34a",
                            }}
                          >
                            {allowance.name}
                          </Typography>
                          <Chip
                            variant="filled"
                            color="success"
                            label={`+${formatCurrency(allowance.amount)}`}
                            sx={{ fontSize: "0.75rem" }}
                          />
                        </>
                      )}
                    </Stack>
                  ))}
              </Stack>
            ) : (
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: "text.secondary",
                  textAlign: "center",
                  py: 1,
                }}
              >
                Nenhum adicional cadastrado
              </Typography>
            )}

            {payrollData.discounts.filter((d) => d.type === "allowance")
              .length > 0 && (
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  component="span"
                  sx={{
                    fontSize: "0.75rem",
                    color: "#16a34a",
                    fontWeight: 500,
                  }}
                >
                  Total adicionais: {formatCurrency(totalAllowances)}
                </Typography>
              </Box>
            )}
          </Stack>
        </Stack>

        {/* Summary */}
        {!isEditing && payrollData.grossSalary > 0 && (
          <Box
            sx={{
              fontSize: "0.75rem",
              color: "text.secondary",
              bgcolor: "action.hover",
              p: 3,
              borderRadius: 1,
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <strong>Cálculo:</strong>{" "}
              {formatCurrency(payrollData.grossSalary)} +{" "}
              {formatCurrency(payrollData.allowances)} -{" "}
              {formatCurrency(totalDiscounts)} ={" "}
              <Box
                component="span"
                sx={{ color: "primary.main", fontWeight: 600 }}
              >
                {formatCurrency(payrollData.netSalary)}
              </Box>
            </Box>
          </Box>
        )}

        {payrollData.updatedAt && !isEditing && (
          <Typography
            sx={{
              fontSize: "0.75rem",
              color: "text.secondary",
              textAlign: "center",
            }}
          >
            Atualizado em:{" "}
            {new Date(payrollData.updatedAt).toLocaleDateString("pt-BR")}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
