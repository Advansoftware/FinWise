"use client";

import { usePlan } from "@/hooks/use-plan";
import { Tooltip, Box, alpha, useTheme, ButtonBase } from "@mui/material";
import { Gem } from "lucide-react";
import Link from "next/link";

interface ProUpgradeButtonProps {
  children: React.ReactNode;
  requiredPlan: "Pro" | "Plus";
  tooltipContent?: string;
}

export function ProUpgradeButton({
  children,
  requiredPlan,
  tooltipContent,
}: ProUpgradeButtonProps) {
  const { plan, isLoading } = usePlan();
  const theme = useTheme();

  const planHierarchy: Record<string, number> = {
    Básico: 0,
    Pro: 1,
    Plus: 2,
    Infinity: 3,
  };

  const hasAccess =
    !isLoading && planHierarchy[plan] >= planHierarchy[requiredPlan];

  if (hasAccess) {
    return <>{children}</>;
  }

  const defaultTooltip = `Este é um recurso do plano ${requiredPlan}. Clique para fazer upgrade.`;

  return (
    <Tooltip title={tooltipContent || defaultTooltip} arrow>
      <Box sx={{ position: "relative", width: "100%" }}>
        {children}
        <ButtonBase
          component={Link}
          href="/billing"
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: alpha(theme.palette.background.default, 0.7),
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 1,
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: alpha(theme.palette.background.default, 0.8),
              "& .gem-icon": {
                opacity: 1,
                transform: "scale(1.15)",
              },
            },
          }}
        >
          <Gem
            className="gem-icon"
            size={20}
            style={{
              color: theme.palette.primary.main,
              opacity: 0.8,
              transition: "all 0.2s ease",
            }}
          />
        </ButtonBase>
      </Box>
    </Tooltip>
  );
}
