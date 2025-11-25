// src/app/(app)/categories/default/page.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Typography,
  Stack,
  Box,
  useTheme,
  Grid,
} from "@mui/material";
import { CategoryIcon } from "@/components/icons";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";
import { TransactionCategory } from "@/lib/types";
import {
  ChevronDown,
  ChevronRight,
  Users,
  Package,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function DefaultCategoriesPreview() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const { user } = useAuth();
  const { toast } = useToast();
  const theme = useTheme();

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleApplyToUser = async () => {
    if (!user) {
      toast({
        variant: "error",
        title: "Erro",
        description: "Usuário não autenticado",
      });
      return;
    }

    try {
      const response = await fetch("/api/categories/apply-defaults", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (!response.ok) {
        throw new Error("Falha ao aplicar categorias padrão");
      }

      toast({
        title: "Sucesso!",
        description: "Categorias padrão aplicadas com sucesso ao seu perfil!",
      });

      setTimeout(() => {
        window.location.href = "/categories";
      }, 1000);
    } catch (error) {
      console.error("Erro ao aplicar categorias:", error);
      toast({
        variant: "error",
        title: "Erro",
        description: "Erro ao aplicar categorias padrão. Tente novamente.",
      });
    }
  };

  const getCategoryType = (category: TransactionCategory): string => {
    if (["Salário", "Investimentos", "Vendas"].includes(category)) {
      return "Receitas";
    }
    if (["Contas", "Supermercado", "Transporte", "Saúde"].includes(category)) {
      return "Essenciais";
    }
    if (
      [
        "Restaurante",
        "Entretenimento",
        "Vestuário",
        "Educação",
        "Lazer",
      ].includes(category)
    ) {
      return "Pessoais";
    }
    return "Outros";
  };

  const getCategoryTypeColor = (type: string) => {
    switch (type) {
      case "Receitas":
        return {
          bgcolor: "success.light",
          color: "success.dark",
          borderColor: "success.main",
        };
      case "Essenciais":
        return {
          bgcolor: "error.light",
          color: "error.dark",
          borderColor: "error.main",
        };
      case "Pessoais":
        return {
          bgcolor: "info.light",
          color: "info.dark",
          borderColor: "info.main",
        };
      default:
        return {
          bgcolor: "grey.100",
          color: "grey.800",
          borderColor: "grey.300",
        };
    }
  };

  const totalCategories = Object.keys(DEFAULT_CATEGORIES).length;
  const totalSubcategories = Object.values(DEFAULT_CATEGORIES).reduce(
    (sum, subcategories) => sum + subcategories.length,
    0
  );

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Settings size={32} color={theme.palette.primary.main} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Categorias Padrão do Gastometria
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Categorias e subcategorias que são criadas automaticamente para
              novos usuários
            </Typography>
          </Box>
        </Stack>

        {/* Stats */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Package size={16} />
                    <Typography variant="subtitle2" fontWeight="medium">
                      Total de Categorias
                    </Typography>
                  </Box>
                }
                sx={{ pb: 1 }}
              />
              <CardContent>
                <Typography variant="h5" fontWeight="bold">
                  {totalCategories}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Users size={16} />
                    <Typography variant="subtitle2" fontWeight="medium">
                      Total de Subcategorias
                    </Typography>
                  </Box>
                }
                sx={{ pb: 1 }}
              />
              <CardContent>
                <Typography variant="h5" fontWeight="bold">
                  {totalSubcategories}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardHeader
                title={
                  <Typography variant="subtitle2" fontWeight="medium">
                    Ações
                  </Typography>
                }
                sx={{ pb: 1 }}
              />
              <CardContent>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleApplyToUser}
                  startIcon={<Settings size={16} />}
                >
                  Aplicar ao Meu Usuário
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>

      {/* Categories List */}
      <Grid container spacing={3}>
        {Object.entries(DEFAULT_CATEGORIES).map(([category, subcategories]) => {
          const categoryKey = category as TransactionCategory;
          const isExpanded = expandedCategories.has(category);
          const categoryType = getCategoryType(categoryKey);
          const typeColor = getCategoryTypeColor(categoryType);

          return (
            <Grid key={category} size={{ xs: 12, lg: 6 }}>
              <Card
                sx={{
                  transition: "box-shadow 0.3s",
                  "&:hover": { boxShadow: 3 },
                }}
              >
                <CardHeader
                  sx={{
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                    transition: "background-color 0.2s",
                  }}
                  onClick={() => toggleCategory(category)}
                  title={
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{ color: "primary.main" }}>
                          <CategoryIcon category={categoryKey} />
                        </Box>
                        <Box>
                          <Typography variant="h6">{category}</Typography>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            mt={0.5}
                          >
                            <Chip
                              label={categoryType}
                              variant="outlined"
                              size="small"
                              sx={{
                                ...typeColor,
                                fontWeight: "medium",
                                height: 24,
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {subcategories.length} subcategorias
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>
                      {isExpanded ? (
                        <ChevronDown
                          size={20}
                          color={theme.palette.text.secondary}
                        />
                      ) : (
                        <ChevronRight
                          size={20}
                          color={theme.palette.text.secondary}
                        />
                      )}
                    </Box>
                  }
                />

                {isExpanded && (
                  <CardContent sx={{ pt: 0 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Subcategorias incluídas:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {subcategories.map((subcategory) => (
                          <Chip
                            key={subcategory}
                            label={subcategory}
                            variant="filled"
                            color="secondary"
                            size="small"
                          />
                        ))}
                      </Box>
                    </Stack>
                  </CardContent>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Footer Info */}
      <Card sx={{ borderLeft: 4, borderColor: "info.main" }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <Settings size={20} />
              <Typography variant="h6">Como funciona</Typography>
            </Box>
          }
        />
        <CardContent>
          <Stack spacing={1}>
            <Box display="flex" gap={1}>
              <Typography color="success.main" fontWeight="bold">
                ✓
              </Typography>
              <Typography variant="body2">
                Quando um novo usuário se cadastra, essas categorias são criadas
                automaticamente
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Typography color="success.main" fontWeight="bold">
                ✓
              </Typography>
              <Typography variant="body2">
                Usuários existentes sem categorias também recebem essas
                configurações padrão
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Typography color="info.main" fontWeight="bold">
                ℹ
              </Typography>
              <Typography variant="body2">
                Usuários podem adicionar, editar ou remover categorias
                livremente após a criação
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Typography color="info.main" fontWeight="bold">
                ℹ
              </Typography>
              <Typography variant="body2">
                As categorias são organizadas por tipo: Receitas, Essenciais,
                Pessoais e Outros
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
