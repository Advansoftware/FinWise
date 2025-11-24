// src/app/(app)/settings/page.tsx
"use client";

import { useAISettings } from "@/hooks/use-ai-settings";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Skeleton,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  MoreVertical,
  Trash2,
  Edit,
  PlusCircle,
  CheckCircle,
  Radio,
  Lock,
} from "lucide-react";
import { AISettingsDialog } from "@/components/settings/ai-settings-dialog";
import { usePlan } from "@/hooks/use-plan";
import { AICredential } from "@/lib/types";
import { ProUpgradeCard } from "@/components/pro-upgrade-card";
import { useState, MouseEvent } from "react";

export default function SettingsPage() {
  const {
    isLoading,
    displayedCredentials,
    activeCredentialId,
    handleActivate,
    handleDelete,
    handleOpenDialog,
    isDialogOpen,
    setIsDialogOpen,
    editingCredential,
  } = useAISettings();
  const {
    plan,
    isLoading: isPlanLoading,
    isPro,
    isPlus,
    isInfinity,
  } = usePlan();
  const theme = useTheme();

  if (isLoading || isPlanLoading) {
    return <SettingsSkeleton />;
  }

  // Block page for Basic plan users
  if (plan === "Básico") {
    return <ProUpgradeCard featureName="Configurações de IA" />;
  }

  const canAddOllama =
    isPlus &&
    displayedCredentials.filter((c) => c.provider === "ollama").length === 0;
  const canAddMore = isInfinity;

  return (
    <Stack spacing={3}>
      <AISettingsDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        initialData={editingCredential}
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Configurações de IA
          </Typography>
          <Typography color="text.secondary">
            Gerencie suas credenciais de IA. A credencial ativa será usada para
            todos os recursos.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => handleOpenDialog(null)}
          disabled={!canAddOllama && !canAddMore}
          startIcon={<PlusCircle size={16} />}
        >
          Nova Credencial
        </Button>
      </Stack>

      <Card>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Credenciais Disponíveis
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Apenas a IA da credencial ativa consome seus créditos Gastometria.
          </Typography>
        </Box>
        <CardContent sx={{ pt: 0 }}>
          <Stack spacing={2}>
            {displayedCredentials.map((cred) => (
              <CredentialItem
                key={cred.id}
                cred={cred}
                isActive={cred.id === activeCredentialId}
                onActivate={handleActivate}
                onEdit={handleOpenDialog}
                onDelete={handleDelete}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

interface CredentialItemProps {
  cred: AICredential;
  isActive: boolean;
  onActivate: (id: string) => void;
  onEdit: (cred: AICredential) => void;
  onDelete: (id: string) => Promise<void>;
}

function CredentialItem({
  cred,
  isActive,
  onActivate,
  onEdit,
  onDelete,
}: CredentialItemProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    onEdit(cred);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    await onDelete(cred.id);
    setDeleteDialogOpen(false);
  };

  const getProviderLabel = () => {
    switch (cred.provider) {
      case "gastometria":
        return "Gastometria";
      case "ollama":
        return "Ollama";
      case "googleai":
        return "Google AI";
      case "openai":
        return "OpenAI";
      default:
        return cred.provider;
    }
  };

  const getProviderDescription = () => {
    switch (cred.provider) {
      case "gastometria":
        return "IA otimizada e integrada ao Gastometria (usa créditos).";
      case "ollama":
        return `Modelo: ${cred.ollamaModel} @ ${cred.ollamaServerAddress}`;
      case "googleai":
        return "Google AI (Gemini)";
      case "openai":
        return `Modelo: ${cred.openAIModel}`;
      default:
        return "";
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 2,
          borderRadius: 2,
          border: 1,
          borderColor: isActive ? "primary.main" : "divider",
          bgcolor: isActive
            ? alpha(theme.palette.primary.main, 0.05)
            : "transparent",
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {isActive ? (
              <CheckCircle
                size={20}
                style={{ color: theme.palette.primary.main }}
              />
            ) : (
              <Radio
                size={20}
                style={{ color: theme.palette.text.secondary }}
              />
            )}
            <Typography fontWeight={600}>{cred.name}</Typography>
            <Chip
              label={getProviderLabel()}
              size="small"
              color={cred.provider === "gastometria" ? "primary" : "default"}
            />
            {cred.isReadOnly && (
              <Lock size={12} style={{ color: theme.palette.text.secondary }} />
            )}
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ pl: 4.5, mt: 0.5 }}
          >
            {getProviderDescription()}
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1}>
          {!isActive && (
            <Button
              variant="text"
              size="small"
              onClick={() => onActivate(cred.id)}
            >
              Ativar
            </Button>
          )}
          {!cred.isReadOnly && (
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertical size={16} />
            </IconButton>
          )}
        </Stack>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <Edit size={16} style={{ marginRight: 8 }} /> Editar
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          <Trash2 size={16} style={{ marginRight: 8 }} /> Excluir
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Você tem certeza?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente a
            credencial "{cred.name}".
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <Stack spacing={3}>
      <Box>
        <Skeleton variant="text" width={250} height={40} />
        <Skeleton variant="text" width={400} height={24} />
      </Box>
      <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
    </Stack>
  );
}
