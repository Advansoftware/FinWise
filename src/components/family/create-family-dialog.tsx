// src/components/family/create-family-dialog.tsx

/**
 * CreateFamilyDialog - Dialog para criar uma nova família
 *
 * Apenas disponível para usuários Infinity que não tem família.
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
  alpha,
  useTheme,
  Grid,
} from "@mui/material";
import { X, Users, Heart, Home, Briefcase, Star } from "lucide-react";
import { useFamily } from "@/hooks/use-family";
import { usePlan } from "@/hooks/use-plan";
import { CreateFamilyInput } from "@/lib/family-types";

interface CreateFamilyDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const FAMILY_ICONS = [
  "👨‍👩‍👧‍👦",
  "👨‍👩‍👧",
  "👨‍👩‍👦",
  "👨‍👨‍👧‍👦",
  "👩‍👩‍👧‍👦",
  "💑",
  "👨‍👧",
  "👩‍👦",
  "🏠",
  "❤️",
  "🌟",
  "💫",
  "🌈",
  "🎯",
  "💰",
];

export function CreateFamilyDialog({
  open,
  onClose,
  onSuccess,
}: CreateFamilyDialogProps) {
  const theme = useTheme();
  const { isInfinity } = usePlan();
  const { createFamily, isInFamily } = useFamily();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("👨‍👩‍👧‍👦");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Nome da família é obrigatório");
      return;
    }

    if (name.trim().length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const data: CreateFamilyInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      icon: selectedIcon,
    };

    const family = await createFamily(data);

    setIsSubmitting(false);

    if (family) {
      setName("");
      setDescription("");
      setSelectedIcon("👨‍👩‍👧‍👦");
      onSuccess?.();
      onClose();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName("");
      setDescription("");
      setError(null);
      onClose();
    }
  };

  if (!isInfinity) {
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
              <Users size={24} />
              Modo Família
            </Box>
            <IconButton onClick={handleClose} size="small">
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Recurso exclusivo do plano Infinity
            </Typography>
            <Typography variant="body2">
              O Modo Família permite compartilhar sua conta com familiares,
              controlando exatamente o que cada pessoa pode ver e editar.
            </Typography>
          </Alert>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Com o Modo Família você pode:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1 }}>
              <li>Convidar até 5 membros</li>
              <li>Compartilhar carteiras específicas</li>
              <li>Acompanhar metas em conjunto</li>
              <li>Manter privacidade individual</li>
              <li>Ver relatórios consolidados</li>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Fechar</Button>
          <Button variant="contained" href="/app/billing">
            Assinar Infinity
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (isInFamily) {
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
              <Users size={24} />
              Modo Família
            </Box>
            <IconButton onClick={handleClose} size="small">
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            Você já faz parte de uma família. Cada conta pode participar de
            apenas uma família por vez.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    );
  }

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
            <Users size={24} />
            Criar Família
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

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Crie uma família para compartilhar suas finanças com pessoas de
          confiança. Você poderá escolher exatamente o que compartilhar.
        </Typography>

        {/* Seletor de ícone */}
        <Typography variant="subtitle2" gutterBottom>
          Ícone
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mb: 3,
            p: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 2,
          }}
        >
          {FAMILY_ICONS.map((icon) => (
            <Box
              key={icon}
              onClick={() => setSelectedIcon(icon)}
              sx={{
                width: 48,
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                borderRadius: 2,
                cursor: "pointer",
                transition: "all 0.2s",
                border:
                  selectedIcon === icon
                    ? `2px solid ${theme.palette.primary.main}`
                    : "2px solid transparent",
                bgcolor:
                  selectedIcon === icon
                    ? alpha(theme.palette.primary.main, 0.1)
                    : "transparent",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              {icon}
            </Box>
          ))}
        </Box>

        <TextField
          fullWidth
          label="Nome da Família"
          placeholder="Ex: Família Silva"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
          inputProps={{ maxLength: 50 }}
          helperText={`${name.length}/50 caracteres`}
        />

        <TextField
          fullWidth
          label="Descrição (opcional)"
          placeholder="Ex: Controle financeiro do casal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={2}
          inputProps={{ maxLength: 200 }}
        />

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Após criar a família, você poderá convidar até 4 membros adicionais
            e configurar o que cada um pode acessar.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || !name.trim()}
        >
          {isSubmitting ? "Criando..." : "Criar Família"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
