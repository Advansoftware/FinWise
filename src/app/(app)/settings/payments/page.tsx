"use client";

import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Alert,
  Button,
} from "@mui/material";
import {
  Smartphone,
  ContactsOutlined,
  History,
  Settings,
  ArrowBack,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import {
  ContactManager,
  DeviceManager,
  PaymentHistory,
} from "@/components/bank-payment";
import { usePlan } from "@/hooks/use-plan";
import { ProUpgradeCard } from "@/components/pro-upgrade-card";

export default function PaymentSettingsPage() {
  const [activeTab, setActiveTab] = useState("devices");
  const router = useRouter();
  const {
    plan,
    isLoading: isPlanLoading,
    isPro,
    isPlus,
    isInfinity,
  } = usePlan();

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  // Bloquear para usuários do plano básico
  if (!isPlanLoading && plan === "Básico") {
    return <ProUpgradeCard featureName="Pagamentos Bancários" />;
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          variant="text"
          size="small"
        >
          Voltar
        </Button>
      </Stack>

      <Box>
        <Typography variant="h4" fontWeight="bold">
          Pagamentos Bancários
        </Typography>
        <Typography color="text.secondary">
          Gerencie seus dispositivos, contatos de pagamento e histórico de
          transações.
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" icon={<Smartphone />}>
        <Typography variant="body2">
          <strong>Como funciona:</strong> No computador, ao clicar em "Pagar",
          uma notificação é enviada para seu celular. No celular, o app do banco
          é aberto diretamente para você completar o pagamento.
        </Typography>
      </Alert>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label="Dispositivos"
              value="devices"
              icon={<Smartphone />}
              iconPosition="start"
            />
            <Tab
              label="Contatos"
              value="contacts"
              icon={<ContactsOutlined />}
              iconPosition="start"
            />
            <Tab
              label="Histórico"
              value="history"
              icon={<History />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <CardContent>
          {activeTab === "devices" && <DeviceManager />}

          {activeTab === "contacts" && <ContactManager />}

          {activeTab === "history" && <PaymentHistory />}
        </CardContent>
      </Card>
    </Stack>
  );
}
