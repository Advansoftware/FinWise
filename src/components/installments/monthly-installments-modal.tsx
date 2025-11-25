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
  Grid,
  useMediaQuery,
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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
      fullScreen={isMobile}
    >
      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
        {/* Header fixo */}
        <Box
          sx={{
            p: { xs: 2, md: 3 },
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              variant={isMobile ? "subtitle1" : "h6"}
              fontWeight="bold"
            >
              {commitmentType === "fixed"
                ? "Compromissos Fixos"
                : commitmentType === "variable"
                ? "Compromissos Variáveis"
                : "Parcelamentos"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {monthName}
            </Typography>
          </Box>
          <IconButton onClick={() => onOpenChange(false)} size="small">
            <X style={{ width: "1.25rem", height: "1.25rem" }} />
          </IconButton>
        </Box>

        {/* Summary Cards fixo */}
        <Box
          sx={{
            p: { xs: 1.5, md: 3 },
            pb: { xs: 1, md: 2 },
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Grid container spacing={{ xs: 1, md: 2 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={{ p: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <DollarSign
                    style={{
                      width: "0.875rem",
                      height: "0.875rem",
                      color: theme.palette.primary.main,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.65rem" }}
                    >
                      Total
                    </Typography>
                    <Typography variant="body2" fontWeight="semibold">
                      {formatCurrency(totalAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={{ p: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <CheckCircle
                    style={{
                      width: "0.875rem",
                      height: "0.875rem",
                      color: theme.palette.success.main,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.65rem" }}
                    >
                      Pagos
                    </Typography>
                    <Typography variant="body2" fontWeight="semibold">
                      {paidCount}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={{ p: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Clock
                    style={{
                      width: "0.875rem",
                      height: "0.875rem",
                      color: theme.palette.warning.main,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.65rem" }}
                    >
                      Pendentes
                    </Typography>
                    <Typography variant="body2" fontWeight="semibold">
                      {pendingCount}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={{ p: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <AlertCircle
                    style={{
                      width: "0.875rem",
                      height: "0.875rem",
                      color: theme.palette.error.main,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.65rem" }}
                    >
                      Atraso
                    </Typography>
                    <Typography variant="body2" fontWeight="semibold">
                      {overdueCount}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Área de scroll para a lista */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: { xs: 1.5, md: 3 },
            pt: { xs: 1.5, md: 2 },
          }}
        >
          <Box>
            {isLoading ? (
              <Stack spacing={1.5}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={80}
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
                  py: { xs: 4, md: 6 },
                }}
              >
                <Calendar
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    color: theme.palette.text.secondary,
                    marginBottom: "0.75rem",
                  }}
                />
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  sx={{ mb: 0.5 }}
                >
                  Nenhum parcelamento encontrado
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  Não há parcelamentos registrados para este mês.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5} sx={{ pb: 2 }}>
                {installments.map((installment) => (
                  <Card
                    key={`${installment.id}-${installment.installmentNumber}`}
                    sx={{ p: 1.5 }}
                  >
                    <Stack spacing={1}>
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
                            variant="body2"
                            fontWeight="semibold"
                            noWrap
                          >
                            {installment.name}
                          </Typography>
                          {installment.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "block",
                                mt: 0.25,
                                fontSize: "0.65rem",
                              }}
                              noWrap
                            >
                              {installment.description}
                            </Typography>
                          )}
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
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
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
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
                                width: "0.875rem",
                                height: "0.875rem",
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
                                width: "0.875rem",
                                height: "0.875rem",
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
                      <Box
                        sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Tag
                            style={{
                              width: "0.65rem",
                              height: "0.65rem",
                              color: theme.palette.text.secondary,
                            }}
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: "0.65rem" }}
                          >
                            {installment.category}
                            {installment.subcategory &&
                              ` · ${installment.subcategory}`}
                          </Typography>
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
                                width: "0.65rem",
                                height: "0.65rem",
                                color: theme.palette.text.secondary,
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.65rem" }}
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
                              p: 0.75,
                              borderRadius: 1,
                              color: "success.dark",
                              fontSize: "0.65rem",
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
                                  ({formatCurrency(installment.paidAmount)})
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
