// src/components/installments/monthly-installments-modal.tsx

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Card,
  CardContent,
  Badge,
  Skeleton,
  Stack,
  useTheme,
  alpha,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Calendar,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  Tag,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";

interface InstallmentDetail {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  establishment?: string;
  amount: number;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  paidDate?: string;
  paidAmount?: number;
}

interface MonthlyInstallmentsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  month: string; // formato "YYYY-MM"
  monthName: string; // nome formatado do mês
  totalAmount: number;
  commitmentType?: "fixed" | "variable"; // tipo de compromisso para filtrar
}

export function MonthlyInstallmentsModal({
  isOpen,
  onOpenChange,
  month,
  monthName,
  totalAmount,
  commitmentType,
}: MonthlyInstallmentsModalProps) {
  const [installments, setInstallments] = useState<InstallmentDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    if (isOpen && month && user?.uid) {
      loadMonthlyInstallments();
    }
  }, [isOpen, month, user?.uid, commitmentType]);

  const loadMonthlyInstallments = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      const url =
        "/api/installments?userId=" +
        user.uid +
        "&action=monthly-details&month=" +
        month;
      const urlWithType = commitmentType
        ? url + "&type=" + commitmentType
        : url;
      const response = await fetch(urlWithType);

      if (response.ok) {
        const data = await response.json();
        setInstallments(data);
      } else {
        console.error("Failed to fetch monthly installments");
        setInstallments([]);
      }
    } catch (error) {
      console.error("Error loading monthly installments:", error);
      setInstallments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <CheckCircle
            style={{
              width: "1rem",
              height: "1rem",
              color: theme.palette.success.main,
            }}
          />
        );
      case "overdue":
        return (
          <AlertCircle
            style={{
              width: "1rem",
              height: "1rem",
              color: theme.palette.error.main,
            }}
          />
        );
      default:
        return (
          <Clock
            style={{
              width: "1rem",
              height: "1rem",
              color: theme.palette.warning.main,
            }}
          />
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Chip
            label="Pago"
            sx={{
              bgcolor: alpha(theme.palette.success.main, 0.1),
              color: "success.main",
              border: 1,
              borderColor: alpha(theme.palette.success.main, 0.3),
            }}
          />
        );
      case "overdue":
        return (
          <Chip
            label="Em atraso"
            sx={{
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: "error.main",
              border: 1,
              borderColor: alpha(theme.palette.error.main, 0.3),
            }}
          />
        );
      default:
        return <Chip variant="filled" label="Pendente" />;
    }
  };

  const formatInstallmentInfo = (
    installmentNumber: number,
    totalInstallments: number
  ) => {
    return `${installmentNumber}/${totalInstallments}`;
  };

  const paidCount = installments.filter((i) => i.status === "paid").length;
  const pendingCount = installments.filter(
    (i) => i.status === "pending"
  ).length;
  const overdueCount = installments.filter(
    (i) => i.status === "overdue"
  ).length;

  return (
    <Dialog
      open={isOpen}
      onClose={() => onOpenChange(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
        {/* Header fixo */}
        <Box
          sx={{
            p: 3,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <DialogTitle sx={{ fontSize: { xs: "1.125rem", md: "1.5rem" } }}>
            {commitmentType === "fixed"
              ? `Compromissos Fixos de ${monthName}`
              : commitmentType === "variable"
              ? `Compromissos Variáveis de ${monthName}`
              : `Parcelamentos de ${monthName}`}
          </DialogTitle>
          <IconButton onClick={() => onOpenChange(false)} size="small">
            <X style={{ width: "1.25rem", height: "1.25rem" }} />
          </IconButton>
        </Box>

        {/* Summary Cards fixo */}
        <Box
          sx={{
            p: 3,
            pb: 2,
            borderBottom: { xs: 1, md: 0 },
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            <Card sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <DollarSign
                  style={{
                    width: "1rem",
                    height: "1rem",
                    color: theme.palette.primary.main,
                  }}
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="body2" fontWeight="semibold">
                    {formatCurrency(totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </Card>

            <Card sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircle
                  style={{
                    width: "1rem",
                    height: "1rem",
                    color: theme.palette.success.main,
                  }}
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Pagos
                  </Typography>
                  <Typography variant="body2" fontWeight="semibold">
                    {paidCount}
                  </Typography>
                </Box>
              </Box>
            </Card>

            <Card sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Clock
                  style={{
                    width: "1rem",
                    height: "1rem",
                    color: theme.palette.warning.main,
                  }}
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Pendentes
                  </Typography>
                  <Typography variant="body2" fontWeight="semibold">
                    {pendingCount}
                  </Typography>
                </Box>
              </Box>
            </Card>

            <Card sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AlertCircle
                  style={{
                    width: "1rem",
                    height: "1rem",
                    color: theme.palette.error.main,
                  }}
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Atraso
                  </Typography>
                  <Typography variant="body2" fontWeight="semibold">
                    {overdueCount}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>

        {/* Área de scroll para a lista */}
        <Box sx={{ flex: 1, overflow: "auto", p: 3, pt: 1 }}>
          <Box sx={{ pr: { md: 1 } }}>
            {isLoading ? (
              <Stack spacing={2}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={96}
                    sx={{ borderRadius: 1 }}
                  />
                ))}
              </Stack>
            ) : installments.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 6,
                }}
              >
                <Calendar
                  style={{
                    width: "3rem",
                    height: "3rem",
                    color: theme.palette.text.secondary,
                    marginBottom: "1rem",
                  }}
                />
                <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>
                  Nenhum parcelamento encontrado
                </Typography>
                <Typography color="text.secondary" align="center">
                  Não há parcelamentos registrados para este mês.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2} sx={{ pb: 3 }}>
                {installments.map((installment) => (
                  <Card
                    key={`${installment.id}-${installment.installmentNumber}`}
                    sx={{ p: 2 }}
                  >
                    <Stack spacing={1.5}>
                      {/* Header */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight="semibold"
                            noWrap
                          >
                            {installment.name}
                          </Typography>
                          {installment.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              {installment.description}
                            </Typography>
                          )}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            ml: 1,
                          }}
                        >
                          {getStatusIcon(installment.status)}
                          {getStatusBadge(installment.status)}
                        </Box>
                      </Box>

                      {/* Amount and Installment Info */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <DollarSign
                              style={{
                                width: "1rem",
                                height: "1rem",
                                color: theme.palette.text.secondary,
                              }}
                            />
                            <Typography variant="body2" fontWeight="semibold">
                              {formatCurrency(installment.amount)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <CreditCard
                              style={{
                                width: "1rem",
                                height: "1rem",
                                color: theme.palette.text.secondary,
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatInstallmentInfo(
                                installment.installmentNumber,
                                installment.totalInstallments
                              )}
                            </Typography>
                          </Box>
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(installment.dueDate), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </Typography>
                      </Box>

                      {/* Category and Details */}
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Tag
                            style={{
                              width: "0.75rem",
                              height: "0.75rem",
                              color: theme.palette.text.secondary,
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {installment.category}
                          </Typography>
                          {installment.subcategory && (
                            <>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                ·
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {installment.subcategory}
                              </Typography>
                            </>
                          )}
                        </Box>

                        {installment.establishment && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Building
                              style={{
                                width: "0.75rem",
                                height: "0.75rem",
                                color: theme.palette.text.secondary,
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {installment.establishment}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Payment Info */}
                      {installment.status === "paid" &&
                        installment.paidDate && (
                          <Box
                            sx={{
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              p: 1,
                              borderRadius: 1,
                              color: "success.dark",
                              fontSize: "0.75rem",
                            }}
                          >
                            Pago em{" "}
                            {format(
                              new Date(installment.paidDate),
                              "dd/MM/yyyy",
                              { locale: ptBR }
                            )}
                            {installment.paidAmount &&
                              installment.paidAmount !== installment.amount && (
                                <Box component="span" sx={{ ml: 1 }}>
                                  (Valor:{" "}
                                  {formatCurrency(installment.paidAmount)})
                                </Box>
                              )}
                          </Box>
                        )}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
