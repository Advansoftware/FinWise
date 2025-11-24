// src/components/chat/chat-assistant.tsx
"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
  Button,
  Typography,
  TextField,
  Box,
  Paper,
  Chip,
  IconButton,
  Dialog,
  Slide,
  AppBar,
  Toolbar,
  CircularProgress,
  Fab,
  Zoom,
  alpha,
  useTheme,
  useMediaQuery,
  InputAdornment,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import {
  SmartToy as BotIcon,
  Send as SendIcon,
  AutoAwesome as SparklesIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { forwardRef } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useReports } from "@/hooks/use-reports";
import { getChatbotResponse } from "@/services/ai-actions";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/ai/ai-types";
import { useAuth } from "@/hooks/use-auth";
import { getYear, startOfMonth } from "date-fns";
import { usePlan } from "@/hooks/use-plan";
import { ProUpgradeCard } from "../pro-upgrade-card";
import { useReasoningChat } from "@/hooks/use-reasoning-chat";
import { useAISettings } from "@/hooks/use-ai-settings";

const suggestionPrompts = [
  "Quanto gastei com Supermercado este mês?",
  "Como posso economizar no próximo mês?",
  "Quais foram minhas 5 maiores despesas?",
  "Liste minhas transações de Restaurante.",
];

// Transition for fullscreen dialog
const SlideTransition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const { allTransactions } = useTransactions();
  const { monthlyReports, annualReports } = useReports();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const { isPro } = usePlan();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { displayedCredentials, activeCredentialId } = useAISettings();
  const {
    reasoning,
    isReasoningModel,
    streamReasoningResponse,
    clearReasoning,
  } = useReasoningChat();

  // Determinar se deve usar raciocínio
  const activeCredential = displayedCredentials.find(
    (c) => c.id === activeCredentialId
  );
  const shouldUseReasoning =
    activeCredential?.provider === "ollama" &&
    isReasoningModel(activeCredential?.ollamaModel);

  useEffect(() => {
    // Scroll to bottom when new messages are added or reasoning updates
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, reasoning]);

  const handleSubmit = (prompt: string = input) => {
    if (!prompt.trim() || !isPro) return;

    const newUserMessage: Message = { role: "user", content: prompt };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    clearReasoning();

    startTransition(async () => {
      try {
        const currentYear = getYear(new Date());
        const startOfCurrentMonth = startOfMonth(new Date());

        const currentMonthTransactions = allTransactions.filter(
          (t) => new Date(t.date) >= startOfCurrentMonth
        );
        const currentYearMonthlyReports = monthlyReports.filter((r) =>
          r.period.startsWith(currentYear.toString())
        );
        const pastAnnualReports = annualReports.filter(
          (r) => parseInt(r.period) < currentYear
        );

        let response: string;

        if (shouldUseReasoning) {
          response = await streamReasoningResponse(
            messages,
            prompt,
            user!.uid,
            currentMonthTransactions,
            currentYearMonthlyReports,
            pastAnnualReports
          );
        } else {
          response = await getChatbotResponse(
            {
              history: messages,
              prompt: prompt,
              transactions: currentMonthTransactions,
              monthlyReports: currentYearMonthlyReports,
              annualReports: pastAnnualReports,
            },
            user!.uid
          );
        }

        const newModelMessage: Message = { role: "model", content: response };
        setMessages((prev) => [...prev, newModelMessage]);
      } catch (e: any) {
        console.error(e);
        const errorMessage =
          e instanceof Error
            ? e.message
            : "Ocorreu um erro ao processar sua pergunta.";

        if (
          errorMessage.includes("créditos") ||
          errorMessage.includes("Você precisa de")
        ) {
          toast({
            title: "Créditos Insuficientes",
            description: errorMessage,
            variant: "error",
          });
        } else {
          toast({
            title: "Erro no Chat",
            description: errorMessage,
            variant: "error",
          });
        }

        setMessages((prev) => prev.filter((msg) => msg !== newUserMessage));
        clearReasoning();
      }
    });
  };

  const handleSuggestionClick = (prompt: string) => {
    handleSubmit(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Chat content component
  const ChatContent = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            p: 4,
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (!isPro) {
      return (
        <Box
          sx={{
            p: 3,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <ProUpgradeCard featureName="Assistente de Chat com IA" />
        </Box>
      );
    }

    if (messages.length === 0) {
      return (
        <Box sx={{ textAlign: "center", p: 3 }}>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Faça uma pergunta sobre suas finanças ou escolha uma sugestão.
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              justifyContent: "center",
            }}
          >
            {suggestionPrompts.map((prompt) => (
              <Chip
                key={prompt}
                label={prompt}
                onClick={() => handleSuggestionClick(prompt)}
                clickable
                variant="outlined"
                color="primary"
                sx={{
                  height: "auto",
                  py: 1,
                  "& .MuiChip-label": {
                    whiteSpace: "normal",
                    textAlign: "left",
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              gap: 1.5,
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "model" && (
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <BotIcon sx={{ fontSize: 18, color: "primary.main" }} />
              </Box>
            )}
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1.5,
                maxWidth: "85%",
                borderRadius: 3,
                bgcolor: msg.role === "user" ? "primary.main" : "action.hover",
                color:
                  msg.role === "user" ? "primary.contrastText" : "text.primary",
              }}
            >
              <Typography
                variant="body2"
                sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
              >
                {msg.content}
              </Typography>
            </Paper>
          </Box>
        ))}

        {/* Reasoning indicator */}
        {reasoning.isReasoning && reasoning.reasoningText && (
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-start" }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BotIcon sx={{ fontSize: 18, color: "info.main" }} />
            </Box>
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1.5,
                maxWidth: "85%",
                borderRadius: 3,
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                border: 1,
                borderColor: (theme) => alpha(theme.palette.info.main, 0.2),
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: "info.main",
                    borderRadius: "50%",
                    animation: "pulse 1.5s infinite",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1 },
                      "50%": { opacity: 0.4 },
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: "info.main", fontWeight: 600 }}
                >
                  Pensando...
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  color: "info.dark",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                }}
              >
                {reasoning.reasoningText}
                <Box
                  component="span"
                  sx={{
                    animation: "blink 1s infinite",
                    "@keyframes blink": {
                      "0%, 100%": { opacity: 1 },
                      "50%": { opacity: 0 },
                    },
                  }}
                >
                  |
                </Box>
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Loading indicator */}
        {isPending && !reasoning.isReasoning && (
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-start" }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BotIcon sx={{ fontSize: 18, color: "primary.main" }} />
            </Box>
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 3,
                bgcolor: "action.hover",
                display: "flex",
                alignItems: "center",
              }}
            >
              <CircularProgress size={20} color="primary" />
            </Paper>
          </Box>
        )}
      </Box>
    );
  };

  // Input component
  const ChatInput = () => (
    <Box
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
        backdropFilter: "blur(8px)",
      }}
    >
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
        <TextField
          placeholder={
            isPro
              ? "Pergunte sobre seus gastos..."
              : "Faça upgrade para usar o chat"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending || !isPro}
          fullWidth
          size="small"
          multiline
          maxRows={3}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              bgcolor: "background.default",
            },
          }}
        />
        <IconButton
          onClick={() => handleSubmit()}
          disabled={!input.trim() || isPending || !isPro}
          color="primary"
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            width: 40,
            height: 40,
            "&:hover": {
              bgcolor: "primary.dark",
            },
            "&.Mui-disabled": {
              bgcolor: "action.disabledBackground",
              color: "action.disabled",
            },
          }}
        >
          <SendIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>
    </Box>
  );

  // Mobile fullscreen dialog
  if (isMobile) {
    return (
      <>
        <Dialog
          fullScreen
          open={isOpen}
          onClose={() => setIsOpen(false)}
          TransitionComponent={SlideTransition}
          PaperProps={{
            sx: {
              bgcolor: "background.default",
            },
          }}
        >
          {/* Mobile Header */}
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
              backdropFilter: "blur(20px)",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Toolbar>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 2,
                }}
              >
                <BotIcon sx={{ color: "primary.main" }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color="text.primary"
                >
                  Assistente Gastometria
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pergunte sobre suas finanças
                </Typography>
              </Box>
              <IconButton
                edge="end"
                onClick={() => setIsOpen(false)}
                sx={{ color: "text.primary" }}
              >
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>

          {/* Chat Content */}
          <Box
            ref={scrollAreaRef}
            sx={{
              flex: 1,
              overflow: "auto",
              height: "calc(100vh - 128px)",
            }}
          >
            <ChatContent />
          </Box>

          {/* Mobile Input */}
          <ChatInput />
        </Dialog>

        {/* FAB Button */}
        <Zoom in={!isOpen}>
          <Fab
            color="primary"
            onClick={() => setIsOpen(true)}
            sx={{
              width: 56,
              height: 56,
              boxShadow: (theme) =>
                `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
          >
            <SparklesIcon />
          </Fab>
        </Zoom>
      </>
    );
  }

  // Desktop floating card
  return (
    <Box sx={{ position: "relative" }}>
      {/* Desktop Chat Card */}
      <Zoom in={isOpen}>
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            bottom: 80,
            right: 0,
            width: 400,
            height: 500,
            display: "flex",
            flexDirection: "column",
            borderRadius: 4,
            overflow: "hidden",
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
            backdropFilter: "blur(20px)",
            border: 1,
            borderColor: "divider",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              borderBottom: 1,
              borderColor: "divider",
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.1
                )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BotIcon sx={{ color: "primary.main" }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  Assistente Gastometria
                </Typography>
                {messages.length > 0 && (
                  <Chip
                    label={`${messages.length} mensagens`}
                    size="small"
                    sx={{ height: 20, fontSize: "0.7rem", mt: 0.5 }}
                  />
                )}
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setIsOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Content */}
          <Box
            ref={scrollAreaRef}
            sx={{
              flex: 1,
              overflow: "auto",
            }}
          >
            <ChatContent />
          </Box>

          {/* Input */}
          <ChatInput />
        </Paper>
      </Zoom>

      {/* FAB Button */}
      <Fab
        color="primary"
        onClick={() => setIsOpen((prev) => !prev)}
        sx={{
          width: 64,
          height: 64,
          boxShadow: (theme) =>
            `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "scale(1.05)",
          },
        }}
      >
        {isOpen ? <CloseIcon /> : <SparklesIcon />}
      </Fab>
    </Box>
  );
}
