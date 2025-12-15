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
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  alpha,
} from "@mui/material";
import { Save, Plus, X, Receipt, DollarSign, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  PayrollData,
  PayrollDiscount,
  STANDARD_DISCOUNT_TYPES,
  STANDARD_ALLOWANCE_TYPES,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function PayrollCard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  const [payrollData, setPayrollData] = useState<PayrollData>({
    id: "",
    userId: "",
    grossSalary: 0,
    allowances: 0,
    discounts: [],
    netSalary: 0,
    updatedAt: new Date().toISOString(),
  });
  const [originalData, setOriginalData] = useState<PayrollData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
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
          setOriginalData(null);
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

  const handleStartEdit = () => {
    setOriginalData(JSON.parse(JSON.stringify(payrollData)));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (originalData) {
      setPayrollData(originalData);
    }
    setOriginalData(null);
    setIsEditing(false);
  };

  const handleClearData = async () => {
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
    setIsClearDialogOpen(false);

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

  const addDiscount = (type: "discount" | "allowance") => {
    const newItem: PayrollDiscount = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
      type,
    };
    setPayrollData((prev) => ({
      ...prev,
      discounts: [...prev.discounts, newItem],
    }));
  };

  const totalDiscounts = payrollData.discounts
    .filter((d) => d.type === "discount")
    .reduce((sum, discount) => sum + discount.amount, 0);
  const totalAllowances = payrollData.discounts
    .filter((d) => d.type === "allowance")
    .reduce((sum, allowance) => sum + allowance.amount, 0);

  return (
    <>
      <Card sx={{ height: "100%" }}>
        <CardHeader
          sx={{ pb: 2 }}
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Receipt style={{ width: 20, height: 20 }} />
              <Typography variant="h6" sx={{ fontSize: "1.125rem" }}>
                Dados do Holerite
              </Typography>
            </Stack>
          }
          action={
            <Stack direction="row" alignItems="center" spacing={1}>
              {isEditing ? (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCancelEdit}
                    disabled={isPending}
                    sx={{ height: 32 }}
                  >
                    Cancelar
                  </Button>
                  {payrollData.grossSalary > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => setIsClearDialogOpen(true)}
                      disabled={isPending}
                      startIcon={<Trash2 size={14} />}
                      sx={{ height: 32 }}
                    >
                      {!isMobile && "Limpar"}
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    size="small"
                    onClick={savePayrollData}
                    disabled={isPending}
                    startIcon={<Save size={14} />}
                    sx={{ height: 32 }}
                  >
                    {isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleStartEdit}
                  startIcon={<Pencil size={14} />}
                  sx={{ height: 32 }}
                >
                  Editar
                </Button>
              )}
            </Stack>
          }
        />
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
                  type="text"
                  value={payrollData.grossSalary || ""}
                  onChange={(e) =>
                    setPayrollData((prev) => ({
                      ...prev,
                      grossSalary: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0,00"
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">R$</InputAdornment>
                    ),
                  }}
                  inputProps={{ inputMode: "decimal" }}
                />
              ) : (
                <Box
                  sx={{
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    px: 1.5,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    fontWeight: 500,
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
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
                <DollarSign style={{ width: 16, height: 16, color: theme.palette.info.main }} />
                <span>Total de Ajudas de Custo</span>
              </Typography>
              <Box
                sx={{
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  px: 1.5,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: theme.palette.info.main,
                  fontWeight: 500,
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
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
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  px: 1.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 700,
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
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
                  sx={{ fontSize: "0.875rem", fontWeight: 500, color: theme.palette.error.main }}
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
                    onClick={() => addDiscount("discount")}
                    startIcon={<Plus size={12} />}
                    sx={{ height: 28, fontSize: "0.75rem" }}
                  >
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
                          bgcolor: alpha(theme.palette.error.main, 0.08),
                          borderRadius: 1,
                          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
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
                              type="text"
                              value={discount.amount || ""}
                              onChange={(e) =>
                                updateDiscount(
                                  discount.id,
                                  "amount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0,00"
                              size="small"
                              inputProps={{ inputMode: "decimal" }}
                              sx={{ width: 96, fontSize: "0.75rem" }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => removeDiscount(discount.id)}
                              sx={{ color: theme.palette.error.main }}
                            >
                              <X size={14} />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <Typography
                              sx={{
                                flex: 1,
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                color: theme.palette.error.main,
                              }}
                            >
                              {discount.name}
                            </Typography>
                            <Chip
                              variant="filled"
                              color="error"
                              label={`-${formatCurrency(discount.amount)}`}
                              size="small"
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
                      color: theme.palette.error.main,
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
                  sx={{ fontSize: "0.875rem", fontWeight: 500, color: theme.palette.success.main }}
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
                    onClick={() => addDiscount("allowance")}
                    startIcon={<Plus size={12} />}
                    sx={{ height: 28, fontSize: "0.75rem" }}
                  >
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
                          bgcolor: alpha(theme.palette.success.main, 0.08),
                          borderRadius: 1,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
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
                              type="text"
                              value={allowance.amount || ""}
                              onChange={(e) =>
                                updateDiscount(
                                  allowance.id,
                                  "amount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="Valor"
                              size="small"
                              inputProps={{ inputMode: "decimal" }}
                              sx={{ width: 96, fontSize: "0.75rem" }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => removeDiscount(allowance.id)}
                              sx={{ color: theme.palette.error.main }}
                            >
                              <X size={14} />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <Typography
                              sx={{
                                flex: 1,
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                color: theme.palette.success.main,
                              }}
                            >
                              {allowance.name}
                            </Typography>
                            <Chip
                              variant="filled"
                              color="success"
                              label={`+${formatCurrency(allowance.amount)}`}
                              size="small"
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
                      color: theme.palette.success.main,
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
                bgcolor: alpha(theme.palette.background.default, 0.5),
                p: 2,
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

      {/* Confirm Clear Dialog */}
      <ConfirmDialog
        open={isClearDialogOpen}
        onClose={() => setIsClearDialogOpen(false)}
        onConfirm={handleClearData}
        title="Limpar Dados do Holerite"
        description="Tem certeza que deseja limpar todos os dados do holerite? Esta ação não pode ser desfeita."
        confirmText="Limpar Tudo"
        confirmColor="error"
      />
    </>
  );
}
