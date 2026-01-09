// src/components/family/pending-invites-card.tsx

/**
 * PendingInvitesCard - Mostra convites pendentes para o usuário
 */

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  Chip,
  Collapse,
  alpha,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  Mail,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
} from "lucide-react";
import { useFamily } from "@/hooks/use-family";
import { FamilyInvite } from "@/lib/family-types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PendingInvitesCard() {
  const theme = useTheme();
  const { pendingInvites, acceptInvite, declineInvite, isLoading } =
    useFamily();
  const [expanded, setExpanded] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (isLoading) {
    return null;
  }

  if (pendingInvites.length === 0) {
    return null;
  }

  const handleAccept = async (inviteId: string) => {
    setProcessingId(inviteId);
    await acceptInvite(inviteId);
    setProcessingId(null);
  };

  const handleDecline = async (inviteId: string) => {
    setProcessingId(inviteId);
    await declineInvite(inviteId);
    setProcessingId(null);
  };

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.success.main,
          0.05
        )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
        mb: 2,
      }}
    >
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
              bgcolor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.main,
            }}
          >
            <Mail size={20} />
          </Box>
        }
        action={
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </IconButton>
        }
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle1">Convites Pendentes</Typography>
            <Chip label={pendingInvites.length} size="small" color="success" />
          </Box>
        }
        subheader="Você foi convidado para participar de uma família"
      />

      <Collapse in={expanded}>
        <CardContent sx={{ pt: 0 }}>
          {pendingInvites.map((invite) => (
            <InviteItem
              key={invite.id}
              invite={invite}
              isProcessing={processingId === invite.id}
              onAccept={() => handleAccept(invite.id)}
              onDecline={() => handleDecline(invite.id)}
            />
          ))}
        </CardContent>
      </Collapse>
    </Card>
  );
}

interface InviteItemProps {
  invite: FamilyInvite;
  isProcessing: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

function InviteItem({
  invite,
  isProcessing,
  onAccept,
  onDecline,
}: InviteItemProps) {
  const theme = useTheme();

  const expiresIn = formatDistanceToNow(new Date(invite.expiresAt), {
    locale: ptBR,
    addSuffix: true,
  });

  return (
    <Box
      sx={{
        p: 2,
        mb: 1,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          <Users size={24} />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">
            {invite.invitedByName} te convidou
          </Typography>

          {invite.message && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                fontStyle: "italic",
                "&::before": { content: '"\\201C"' },
                "&::after": { content: '"\\201D"' },
              }}
            >
              {invite.message}
            </Typography>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Chip
              icon={<Clock size={12} />}
              label={`Expira ${expiresIn}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={invite.role === "admin" ? "Administrador" : "Membro"}
              size="small"
              color={invite.role === "admin" ? "info" : "default"}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          {isProcessing ? (
            <CircularProgress size={24} />
          ) : (
            <>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<Check size={16} />}
                onClick={onAccept}
              >
                Aceitar
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<X size={16} />}
                onClick={onDecline}
              >
                Recusar
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
