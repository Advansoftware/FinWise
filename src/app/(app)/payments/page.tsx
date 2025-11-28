"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Tabs,
  Tab,
  Card,
  CardContent,
} from "@mui/material";
import { Smartphone, Users, History } from "lucide-react";
import { ContactManager } from "@/components/bank-payment/contact-manager";
import { DeviceManager } from "@/components/bank-payment/device-manager";
import { PaymentHistory } from "@/components/bank-payment/payment-history";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`payments-tabpanel-${index}`}
      aria-labelledby={`payments-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </Box>
  );
}

export default function PaymentsPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
          Gerencie seus contatos favoritos, dispositivos e histórico de
          pagamentos.
        </Typography>
      </Box>

      {/* Tabs */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="payments tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: "divider", px: { xs: 1, sm: 2 } }}
        >
          <Tab
            icon={<Users size={18} />}
            iconPosition="start"
            label="Contatos"
            id="payments-tab-0"
            aria-controls="payments-tabpanel-0"
            sx={{ minWidth: "auto", px: { xs: 1.5, sm: 2 } }}
          />
          <Tab
            icon={<Smartphone size={18} />}
            iconPosition="start"
            label="Dispositivos"
            id="payments-tab-1"
            aria-controls="payments-tabpanel-1"
            sx={{ minWidth: "auto", px: { xs: 1.5, sm: 2 } }}
          />
          <Tab
            icon={<History size={18} />}
            iconPosition="start"
            label="Histórico"
            id="payments-tab-2"
            aria-controls="payments-tabpanel-2"
            sx={{ minWidth: "auto", px: { xs: 1.5, sm: 2 } }}
          />
        </Tabs>

        <CardContent>
          <TabPanel value={tabValue} index={0}>
            <ContactManager />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <DeviceManager />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <PaymentHistory />
          </TabPanel>
        </CardContent>
      </Card>
    </Stack>
  );
}
