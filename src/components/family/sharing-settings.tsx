// src/components/family/sharing-settings.tsx

/**
 * SharingSettings - Configurações de compartilhamento do usuário
 *
 * Permite ao usuário controlar exatamente o que compartilha com a família.
 */

"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Slider,
  Chip,
  Button,
  Alert,
  Divider,
  alpha,
  useTheme,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Wallet,
  Receipt,
  Target,
  PiggyBank,
  BarChart3,
  Tags,
  Calendar,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Info,
  Save,
  RotateCcw,
} from "lucide-react";
import { useFamily } from "@/hooks/use-family";
import {
  ResourceSharingConfig,
  ShareableResource,
  PermissionLevel,
  DEFAULT_MEMBER_PRIVACY,
} from "@/lib/family-types";

interface ResourceConfig {
  resource: ShareableResource;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const RESOURCES: ResourceConfig[] = [
  {
    resource: "wallets",
    icon: <Wallet size={20} />,
    label: "Carteiras",
    description: "Compartilhe suas carteiras e saldos",
  },
  {
    resource: "transactions",
    icon: <Receipt size={20} />,
    label: "Transações",
    description: "Compartilhe suas transações",
  },
  {
    resource: "budgets",
    icon: <PiggyBank size={20} />,
    label: "Orçamentos",
    description: "Compartilhe seus orçamentos mensais",
  },
  {
    resource: "goals",
    icon: <Target size={20} />,
    label: "Metas",
    description: "Compartilhe suas metas financeiras",
  },
  {
    resource: "installments",
    icon: <Calendar size={20} />,
    label: "Parcelamentos",
    description: "Compartilhe seus parcelamentos",
  },
  {
    resource: "reports",
    icon: <BarChart3 size={20} />,
    label: "Relatórios",
    description: "Compartilhe seus relatórios",
  },
  {
    resource: "categories",
    icon: <Tags size={20} />,
    label: "Categorias",
    description: "Compartilhe categorias personalizadas",
  },
];

const PERMISSION_LEVELS: {
  value: PermissionLevel;
  label: string;
  color: string;
}[] = [
  { value: "none", label: "Nenhum", color: "error" },
  { value: "view", label: "Visualizar", color: "info" },
  { value: "edit", label: "Editar", color: "warning" },
  { value: "full", label: "Controle Total", color: "success" },
];

export function SharingSettings() {
  const theme = useTheme();
  const { currentMember, updateMySharing, isLoading } = useFamily();

  const [sharing, setSharing] = useState<ResourceSharingConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar configurações atuais
  useEffect(() => {
    if (currentMember?.privacySettings.sharing) {
      setSharing(currentMember.privacySettings.sharing);
    } else {
      setSharing(DEFAULT_MEMBER_PRIVACY.sharing);
    }
  }, [currentMember]);

  const getResourceConfig = (
    resource: ShareableResource
  ): ResourceSharingConfig => {
    return (
      sharing.find((s) => s.resource === resource) || {
        resource,
        permission: "none",
      }
    );
  };

  const updatePermission = (
    resource: ShareableResource,
    permission: PermissionLevel
  ) => {
    setSharing((prev) => {
      const existing = prev.find((s) => s.resource === resource);
      if (existing) {
        return prev.map((s) =>
          s.resource === resource ? { ...s, permission } : s
        );
      }
      return [...prev, { resource, permission }];
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateMySharing(sharing);
    setIsSaving(false);
    setHasChanges(false);
  };

  const handleReset = () => {
    setSharing(DEFAULT_MEMBER_PRIVACY.sharing);
    setHasChanges(true);
  };

  const getPermissionIndex = (permission: PermissionLevel): number => {
    return PERMISSION_LEVELS.findIndex((p) => p.value === permission);
  };

  if (!currentMember) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        avatar={
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
            }}
          >
            <Lock size={20} />
          </Box>
        }
        title="Configurações de Compartilhamento"
        subheader="Controle o que você compartilha com sua família"
        action={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Restaurar padrões">
              <IconButton onClick={handleReset} size="small">
                <RotateCcw size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />

      <CardContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Escolha o nível de acesso para cada tipo de recurso. Suas
            configurações afetam apenas o que os outros membros podem ver sobre
            você.
          </Typography>
        </Alert>

        {/* Legenda de níveis */}
        <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
          {PERMISSION_LEVELS.map((level) => (
            <Chip
              key={level.value}
              icon={
                level.value === "none" ? (
                  <EyeOff size={14} />
                ) : (
                  <Eye size={14} />
                )
              }
              label={level.label}
              size="small"
              color={level.color as any}
              variant="outlined"
            />
          ))}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Lista de recursos */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {RESOURCES.map((resourceConfig) => {
            const config = getResourceConfig(resourceConfig.resource);
            const permissionIndex = getPermissionIndex(config.permission);
            const permissionInfo = PERMISSION_LEVELS[permissionIndex];

            return (
              <Box
                key={resourceConfig.resource}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    }}
                  >
                    {resourceConfig.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">
                      {resourceConfig.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {resourceConfig.description}
                    </Typography>
                  </Box>
                  <Chip
                    label={permissionInfo.label}
                    size="small"
                    color={permissionInfo.color as any}
                  />
                </Box>

                <Slider
                  value={permissionIndex}
                  min={0}
                  max={PERMISSION_LEVELS.length - 1}
                  step={1}
                  marks={PERMISSION_LEVELS.map((p, i) => ({
                    value: i,
                    label: p.label,
                  }))}
                  onChange={(_, value) => {
                    updatePermission(
                      resourceConfig.resource,
                      PERMISSION_LEVELS[value as number].value
                    );
                  }}
                  sx={{
                    "& .MuiSlider-markLabel": {
                      fontSize: "0.7rem",
                    },
                  }}
                />
              </Box>
            );
          })}
        </Box>

        {hasChanges && (
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={<Save size={18} />}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
