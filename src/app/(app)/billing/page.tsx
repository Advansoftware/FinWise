// src/app/(app)/billing/page.tsx
"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Chip,
  Stack,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { CheckCircle2, Gem, BrainCircuit, Rocket } from "lucide-react";
import { usePlan } from "@/hooks/use-plan";
import { usePayment } from "@/hooks/use-payment";
import { UserPlan } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { UpgradeCelebration } from "@/components/billing/upgrade-celebration";
import { CancelFeedback } from "@/components/billing/cancel-feedback";
import { BillingPortalButton } from "@/components/billing/billing-portal-button";

const plans = [
  {
    name: "Básico",
    price: "Grátis",
    description:
      "Controle financeiro manual completo para quem está começando.",
    features: [
      "Dashboard interativo",
      "Transações ilimitadas",
      "Múltiplas carteiras e contas",
      "Orçamentos manuais por categoria",
      "Metas de economia",
      "Gerenciamento de categorias",
      "**Ferramentas financeiras** (Férias, 13º, Projeções)",
      "Acesso à Gastometria AI (limitado)",
    ],
    cta: "Plano Atual",
    planId: "Básico" as UserPlan,
  },
  {
    name: "Pro",
    price: "R$ 19,90/mês",
    description: "Eficiência e insights para otimizar seu tempo e dinheiro.",
    features: [
      "Tudo do plano Básico, e mais:",
      "**100 Créditos de IA** por mês",
      "**Gestão de Parcelamentos** com gamificação",
      "Assistente de Chat com IA",
      "Relatórios inteligentes (Mensal/Anual)",
      "Escanear notas fiscais (OCR)",
      "Importação de extratos (CSV, OFX)",
    ],
    cta: "Fazer Upgrade",
    planId: "Pro" as UserPlan,
  },
  {
    name: "Plus",
    price: "R$ 39,90/mês",
    description: "Automação e flexibilidade com IA para usuários avançados.",
    features: [
      "Tudo do plano Pro, e mais:",
      "**300 Créditos de IA** por mês",
      "**Uso de IA Local (Ollama) ilimitado**",
      "Orçamentos inteligentes e automáticos",
      "Previsão de gastos e saldos futuros",
      "Projeção de alcance de metas",
    ],
    cta: "Fazer Upgrade",
    planId: "Plus" as UserPlan,
  },
  {
    name: "Infinity",
    price: "R$ 59,90/mês",
    description: "Controle total e ilimitado para entusiastas de IA.",
    features: [
      "Tudo do plano Plus, e mais:",
      "**500 Créditos de IA** por mês",
      "**Uso de qualquer provedor de IA** (OpenAI, Google)",
      "Credenciais de IA ilimitadas",
      "Acesso a todos os novos recursos beta",
      "Suporte prioritário",
    ],
    cta: "Fazer Upgrade",
    planId: "Infinity" as UserPlan,
  },
];

function BillingPageContent() {
  const { plan: currentUserPlan, isLoading: isPlanLoading } = usePlan();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { isProcessing, createCheckoutSession, openCustomerPortal } =
    usePayment();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showCancelFeedback, setShowCancelFeedback] = useState(false);
  const [hasProcessedSuccess, setHasProcessedSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const cleanUpUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("success");
    params.delete("canceled");
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    window.history.replaceState(
      { ...window.history.state, as: newUrl, url: newUrl },
      "",
      newUrl
    );
  };

  useEffect(() => {
    const successParam = searchParams.get("success");
    const canceledParam = searchParams.get("canceled");
    
    // Evitar processamento duplicado
    if (hasProcessedSuccess) return;
    
    if (successParam) {
      console.log("[Billing] Payment success detected!");
      setHasProcessedSuccess(true);
      setShowCelebration(true);
      
      // Limpar URL imediatamente para evitar loops
      cleanUpUrl();
      
      // Atualizar sessão após o pagamento
      const refreshSession = async () => {
        console.log("[Billing] Starting session refresh...");
        
        // Aguardar um pouco para garantir que o webhook processou
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Tentar atualizar a sessão algumas vezes
        for (let i = 0; i < 5; i++) {
          console.log(`[Billing] Refresh attempt ${i + 1}/5`);
          const updatedUser = await refreshUser();
          
          if (updatedUser && updatedUser.plan !== 'Básico') {
            console.log(`[Billing] Session updated successfully! Plan: ${updatedUser.plan}`);
            toast({
              title: "Plano atualizado!",
              description: `Seu plano foi atualizado para ${updatedUser.plan}`,
            });
            return;
          }
          
          // Aguardar antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log("[Billing] Session refresh attempts completed");
        toast({
          title: "Pagamento confirmado!",
          description: "Faça logout e login novamente para ver seu novo plano.",
          variant: "default",
        });
      };
      
      refreshSession();
    }
    
    if (canceledParam && !hasProcessedSuccess) {
      setShowCancelFeedback(true);
      cleanUpUrl();
    }
  }, [searchParams, hasProcessedSuccess]); // Removido refreshUser das dependências para evitar loops

  const handleUpgrade = async (newPlan: Exclude<UserPlan, "Básico">) => {
    if (!user || !user.email) return;
    try {
      await createCheckoutSession(newPlan);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    try {
      await openCustomerPortal();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const isPaidPlan = currentUserPlan !== "Básico";
  const planHierarchy = { Básico: 0, Pro: 1, Plus: 2, Infinity: 3 };

  return (
    <Stack spacing={6}>
      {showCelebration && (
        <UpgradeCelebration
          onComplete={async () => {
            setShowCelebration(false);
            cleanUpUrl();
            await refreshUser();
          }}
        />
      )}
      {showCancelFeedback && (
        <CancelFeedback
          onComplete={() => {
            setShowCancelFeedback(false);
            cleanUpUrl();
          }}
        />
      )}

      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={4}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Assinatura e Créditos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie seu plano e seu uso de créditos de IA.
          </Typography>
        </Box>
        {isPaidPlan && (
          <BillingPortalButton size="medium">
            <Box component={Gem} sx={{ mr: 1, height: 16, width: 16 }} />
            Gerenciar Assinatura
          </BillingPortalButton>
        )}
      </Stack>

      <Grid container spacing={3}>
        {plans.map((plan) => {
          const isCurrent = plan.planId === currentUserPlan;
          const isDowngrade =
            planHierarchy[plan.planId] < planHierarchy[currentUserPlan];
          const isUpgrade =
            planHierarchy[plan.planId] > planHierarchy[currentUserPlan];

          let buttonAction;
          let buttonText;
          let buttonDisabled = isProcessing || isPlanLoading;

          if (isCurrent) {
            buttonAction = () => {};
            buttonText = isPaidPlan ? "Seu Plano Atual" : "Seu Plano Atual";
            buttonDisabled = true;
          } else if (isDowngrade) {
            buttonAction = () => {};
            buttonText = "Contate o Suporte";
            buttonDisabled = true;
          } else {
            buttonAction = () =>
              handleUpgrade(plan.planId as Exclude<UserPlan, "Básico">);
            buttonText = "Fazer Upgrade";
          }

          return (
            <Grid size={{ xs: 12, md: 6, lg: 3 }} key={plan.name}>
              <Card
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  border: isCurrent ? 2 : 1,
                  borderColor: isCurrent ? "primary.main" : "divider",
                  boxShadow: isCurrent ? 4 : 1,
                }}
              >
                <CardHeader
                  title={
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h6">{plan.name}</Typography>
                      {isCurrent && (
                        <Chip
                          label="Plano Atual"
                          color="secondary"
                          size="small"
                        />
                      )}
                      {plan.name === "Pro" && !isCurrent && (
                        <Chip label="Popular" color="primary" size="small" />
                      )}
                    </Stack>
                  }
                  subheader={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {plan.description}
                    </Typography>
                  }
                />
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {plan.price}
                  </Typography>
                  <List dense>
                    {plan.features.map((feature) => (
                      <ListItem key={feature} disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Box
                            component={CheckCircle2}
                            sx={{
                              height: 20,
                              width: 20,
                              color: "success.main",
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <span
                              dangerouslySetInnerHTML={{
                                __html: feature.replace(
                                  /\*\*(.*?)\*\*/g,
                                  "<strong>$1</strong>"
                                ),
                              }}
                            />
                          }
                          primaryTypographyProps={{
                            variant: "body2",
                            color: "text.secondary",
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    disabled={buttonDisabled}
                    onClick={buttonAction}
                    variant={isCurrent ? "outlined" : "contained"}
                    size="large"
                  >
                    {isProcessing && (
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                    )}
                    {buttonText}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card>
        <CardHeader
          title={
            <Typography variant="h6">
              Como funcionam os Créditos de IA?
            </Typography>
          }
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Créditos são consumidos{" "}
            <strong>apenas ao usar a Gastometria AI</strong>, nossa IA
            integrada. Se você configurar seu próprio provedor (Ollama no plano
            Plus, ou qualquer outro no plano Infinity), o uso é ilimitado e{" "}
            <strong>não consome seus créditos</strong>.
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary={
                  <span>
                    <strong>Ações Simples (1-2 créditos):</strong> Gerar dicas,
                    responder no chat, sugerir um orçamento.
                  </span>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={
                  <span>
                    <strong>Ações Complexas (5 créditos):</strong> Gerar um
                    relatório mensal, analisar um grupo de transações.
                  </span>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={
                  <span>
                    <strong>Ações de Imagem (10 créditos):</strong> Escanear uma
                    nota fiscal (OCR).
                  </span>
                }
              />
            </ListItem>
          </List>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Seus créditos são renovados mensalmente de acordo com seu plano. Em
            breve, você poderá comprar pacotes de créditos adicionais se
            precisar.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
