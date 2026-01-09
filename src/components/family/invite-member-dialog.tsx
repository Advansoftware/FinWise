// src/components/family/invite-member-dialog.tsx

/**
 * InviteMemberDialog - Dialog para convidar membros
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  alpha,
  useTheme,
} from "@mui/material";
import { X, UserPlus, Mail, Shield, User, Crown } from "lucide-react";
import { useFamily } from "@/hooks/use-family";
import { FamilyMemberRole } from "@/lib/family-types";

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InviteMemberDialog({
  open,
  onClose,
  onSuccess,
}: InviteMemberDialogProps) {
  const theme = useTheme();
  const { family, inviteMember, isOwner, canInvite } = useFamily();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<FamilyMemberRole>("member");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Email é obrigatório");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Digite um email válido");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const invite = await inviteMember({
      email: email.trim().toLowerCase(),
      role: isOwner ? role : "member", // Só owner pode definir role
      message: message.trim() || undefined,
    });

    setIsSubmitting(false);

    if (invite) {
      setEmail("");
      setRole("member");
      setMessage("");
      onSuccess?.();
      onClose();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail("");
      setRole("member");
      setMessage("");
      setError(null);
      onClose();
    }
  };

  if (!family || !canInvite) {
    return null;
  }

  const activeMembers = family.members.filter(
    (m) => m.status === "active"
  ).length;
  const spotsLeft = family.maxMembers - activeMembers;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <UserPlus size={24} />
            Convidar Membro
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            disabled={isSubmitting}
          >
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {spotsLeft <= 0 ? (
          <Alert severity="warning">
            Sua família atingiu o limite de {family.maxMembers} membros. Remova
            um membro para convidar outro.
          </Alert>
        ) : (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <Chip
                label={`${spotsLeft} ${
                  spotsLeft === 1 ? "vaga" : "vagas"
                } disponível${spotsLeft === 1 ? "" : "eis"}`}
                color={spotsLeft <= 1 ? "warning" : "success"}
                size="small"
              />
            </Box>

            <TextField
              fullWidth
              label="Email do convidado"
              placeholder="exemplo@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: <Mail size={18} style={{ marginRight: 8 }} />,
              }}
            />

            {isOwner && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Função</InputLabel>
                <Select
                  value={role}
                  label="Função"
                  onChange={(e) => setRole(e.target.value as FamilyMemberRole)}
                >
                  <MenuItem value="member">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <User size={18} />
                      <Box>
                        <Typography variant="body2">Membro</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Pode ver recursos compartilhados
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="admin">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Shield size={18} />
                      <Box>
                        <Typography variant="body2">Administrador</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Pode convidar e gerenciar membros
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              label="Mensagem personalizada (opcional)"
              placeholder="Olá! Gostaria de te convidar para gerenciarmos nossas finanças juntos."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              margin="normal"
              multiline
              rows={2}
              inputProps={{ maxLength: 200 }}
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                O convidado receberá um convite para participar de "
                {family.name}". O convite expira em 7 dias.
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || !email.trim() || spotsLeft <= 0}
          startIcon={<UserPlus size={18} />}
        >
          {isSubmitting ? "Enviando..." : "Enviar Convite"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
