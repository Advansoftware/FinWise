"use client";

import { useState } from "react";
import { Button, Tooltip, Chip, Box, Stack, Typography } from "@mui/material";
import { Sparkles, Zap } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { usePlan } from "@/hooks/use-plan";
import { useAISettings } from "@/hooks/use-ai-settings";
import { CreditStatementDialog } from "./ai-credit-statement-dialog";
import { AnimatePresence, motion } from "framer-motion";

export function AICreditIndicator() {
  const { credits, isLoading: isLoadingCredits } = useCredits();
  const { plan, isLoading: isLoadingPlan, isPlus, isInfinity } = usePlan();
  const { displayedCredentials, activeCredentialId } = useAISettings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isLoading = isLoadingCredits || isLoadingPlan;
  const activeCredential = displayedCredentials.find(
    (c) => c.id === activeCredentialId
  );

  const isUsingGastometriaAI =
    activeCredential?.id === "gastometria-ai-default" ||
    activeCredential?.provider === "gastometria" ||
    !activeCredential;

  const getAlternativeMessage = () => {
    if (plan === "Básico") {
      return "Upgrade para Plus (Ollama local) ou Infinity (qualquer IA) para uso ilimitado";
    }
    if (isPlus) {
      return "Configure Ollama local nas credenciais para uso ilimitado e gratuito";
    }
    if (isInfinity) {
      return "Configure suas próprias credenciais de IA para uso ilimitado e gratuito";
    }
    return "";
  };

  if (plan === "Básico" && !isLoading) {
    return null;
  }

  return (
    <>
      <CreditStatementDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
      <AnimatePresence>
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          sx={{ display: "flex", alignItems: "center", gap: 2 }}
        >
          <Tooltip
            title={
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Créditos de IA
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Você tem {credits} créditos restantes.
                  {isInfinity
                    ? " (Plano Infinity)"
                    : isPlus
                    ? " (Plano Plus)"
                    : " (Plano Gratuito)"}
                </Typography>
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Plano {plan} - {credits} créditos disponíveis
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block" }}
                  >
                    Clique para ver extrato detalhado de uso
                  </Typography>
                  {isUsingGastometriaAI && (
                    <Typography
                      variant="caption"
                      sx={{ color: "#ca8a04", display: "block", mt: 0.5 }}
                    >
                      💡 {getAlternativeMessage()}
                    </Typography>
                  )}
                </Box>
              </Box>
            }
          >
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsDialogOpen(true)}
              color={credits < 5 ? "error" : "primary"}
              sx={{
                borderRadius: "9999px",
                textTransform: "none",
                borderColor: credits < 5 ? "error.main" : "primary.main",
                color: credits < 5 ? "error.main" : "primary.main",
              }}
            >
              <Sparkles style={{ width: 16, height: 16, marginRight: 8 }} />
              {credits} créditos
            </Button>
          </Tooltip>

          {!isLoading && (
            <Tooltip
              title={
                <Box sx={{ p: 1 }}>
                  {isUsingGastometriaAI ? (
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">
                        Usando Gastometria IA
                      </Typography>
                      <Typography variant="caption" display="block">
                        Ações consomem créditos do seu plano
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ color: "#ca8a04" }}
                      >
                        {getAlternativeMessage()}
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">
                        Usando suas credenciais
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ color: "#059669" }}
                      >
                        Uso ilimitado e gratuito! 🎉
                      </Typography>
                    </Stack>
                  )}
                </Box>
              }
            >
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <Chip
                  variant="outlined"
                  label={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {isUsingGastometriaAI ? (
                        <>
                          <Sparkles
                            style={{ width: 12, height: 12, marginRight: 4 }}
                          />
                          Gastometria IA
                        </>
                      ) : (
                        <>
                          <Zap
                            style={{ width: 12, height: 12, marginRight: 4 }}
                          />
                          IA Própria
                        </>
                      )}
                    </Box>
                  }
                  sx={
                    isUsingGastometriaAI
                      ? {
                          bgcolor: "rgba(59, 130, 246, 0.1)",
                          color: "#2563eb",
                          borderColor: "rgba(59, 130, 246, 0.2)",
                        }
                      : {
                          bgcolor: "rgba(16, 185, 129, 0.1)",
                          color: "#059669",
                          borderColor: "rgba(16, 185, 129, 0.2)",
                        }
                  }
                />
              </Box>
            </Tooltip>
          )}
        </Box>
      </AnimatePresence>
    </>
  );
}
