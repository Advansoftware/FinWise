"use client";

import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Alert,
  Button,
} from "@mui/material";
import { Construction, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { getFeatureFlags } from "@/lib/feature-flags";

const { openFinance: isOpenFinanceEnabled } = getFeatureFlags();

export default function PaymentsPage() {
  const router = useRouter();

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Box>
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
        >
          Pagamentos
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
        >
          {isOpenFinanceEnabled
            ? "Integração com bancos para pagamentos diretos."
            : "Gerencie seus pagamentos e parcelamentos."}
        </Typography>
      </Box>

      {/* Aviso de recurso em desenvolvimento */}
      <Card>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "warning.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Construction size={40} color="inherit" />
            </Box>

            <Typography variant="h5" fontWeight="bold">
              Recurso em Desenvolvimento
            </Typography>

            <Typography variant="body1" color="text.secondary" maxWidth="sm">
              {isOpenFinanceEnabled
                ? "A funcionalidade de pagamentos diretos pelo aplicativo será implementada futuramente. Estamos trabalhando para integrar com Open Finance e permitir pagamentos seguros diretamente para suas contas e boletos."
                : "A funcionalidade de pagamentos diretos pelo aplicativo será implementada futuramente. Enquanto isso, você pode registrar e acompanhar seus pagamentos na seção de Parcelamentos."}
            </Typography>

            <Alert severity="info" sx={{ maxWidth: "sm" }}>
              <Typography variant="body2">
                {isOpenFinanceEnabled ? (
                  <>
                    <strong>Em breve:</strong> Com a integração do Open Finance,
                    você poderá realizar pagamentos de forma segura diretamente
                    pelo Gastometria. Enquanto isso, registre seus pagamentos
                    manualmente na seção de Transações ou Parcelamentos.
                  </>
                ) : (
                  <>
                    <strong>Dica:</strong> Use a seção de Parcelamentos para
                    acompanhar seus pagamentos recorrentes e manter controle das
                    suas despesas.
                  </>
                )}
              </Typography>
            </Alert>

            <Button
              variant="contained"
              startIcon={<ArrowLeft size={18} />}
              onClick={() => router.push("/dashboard")}
            >
              Voltar ao Painel
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
