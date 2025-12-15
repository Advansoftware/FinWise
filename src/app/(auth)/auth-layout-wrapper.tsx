"use client";

import { Box, Typography, Stack, alpha, useMediaQuery, useTheme } from "@mui/material";
import { TrendingUp, Savings, PieChart } from "@mui/icons-material";
import { Logo } from "@/components/logo";
import Image from "next/image";

interface AuthLayoutWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayoutWrapper({ children, title, subtitle }: AuthLayoutWrapperProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "background.default",
      }}
    >
      {/* Left Side - Hero Image (Hidden on mobile) */}
      {!isMobile && (
        <Box
          sx={{
            flex: 1,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.95)} 0%, ${alpha("#1a1a2e", 0.98)} 100%)`,
            overflow: "hidden",
          }}
        >
          {/* Background Image */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.5,
              zIndex: 0,
            }}
          >
            <Image
              src="/images/login-hero.png"
              alt="Financial illustration"
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </Box>

          {/* Gradient Overlay */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.4)} 0%, ${alpha("#1a1a2e", 0.8)} 100%)`,
              zIndex: 1,
            }}
          />

          {/* Content */}
          <Box sx={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 500 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                mx: "auto",
                mb: 4,
                p: 2,
                borderRadius: 4,
                bgcolor: alpha("#fff", 0.1),
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Logo />
            </Box>

            <Typography
              variant="h3"
              fontWeight={800}
              sx={{
                color: "white",
                mb: 2,
                textShadow: "0 2px 20px rgba(0,0,0,0.3)",
              }}
            >
              Gastometria
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: alpha("#fff", 0.85),
                mb: 6,
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              Controle suas finanças com inteligência artificial e tome decisões mais inteligentes
            </Typography>

            {/* Features */}
            <Stack spacing={3}>
              {[
                { icon: <TrendingUp />, text: "Análises inteligentes com IA" },
                { icon: <Savings />, text: "Metas de economia personalizadas" },
                { icon: <PieChart />, text: "Relatórios visuais detalhados" },
              ].map((feature, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: alpha("#fff", 0.08),
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${alpha("#fff", 0.1)}`,
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.3),
                      color: "white",
                      display: "flex",
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography color="white" fontWeight={500}>
                    {feature.text}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      )}

      {/* Right Side - Form */}
      <Box
        sx={{
          flex: isMobile ? 1 : "0 0 480px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 3, sm: 6 },
          bgcolor: "background.paper",
          overflowY: "auto",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          {/* Mobile Logo */}
          {isMobile && (
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Logo />
              </Box>
              <Typography variant="h5" fontWeight={700} color="primary">
                Gastometria
              </Typography>
            </Box>
          )}

          {/* Header */}
          {(title || subtitle) && (
            <Box sx={{ mb: 4 }}>
              {title && (
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{
                    mb: 1,
                    background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body1" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          )}

          {children}
        </Box>
      </Box>
    </Box>
  );
}
