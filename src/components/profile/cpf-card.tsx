// src/components/profile/cpf-card.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  Box,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useAuth } from "@/hooks/use-auth";

export function CPFCard() {
  const { user, updateUser } = useAuth();
  const [cpf, setCpf] = useState("");
  const [showCpf, setShowCpf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [maskedCpf, setMaskedCpf] = useState<string | null>(null);

  // Check if CPF is already saved
  useEffect(() => {
    const checkCpf = async () => {
      if (!user?.uid) return;

      try {
        const response = await fetch(`/api/users/cpf?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          if (data.hasCpf) {
            setMaskedCpf(data.maskedCpf);
          }
        }
      } catch (err) {
        console.error("Error checking CPF:", err);
      }
    };

    checkCpf();
  }, [user?.uid]);

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
        6
      )}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
      6,
      9
    )}-${numbers.slice(9, 11)}`;
  };

  const isValidCpf = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, "");
    if (numbers.length !== 11) return false;
    if (/^(\d)\1+$/.test(numbers)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers[10])) return false;

    return true;
  };

  const handleSave = async () => {
    const numbers = cpf.replace(/\D/g, "");

    if (!isValidCpf(numbers)) {
      setError("CPF inválido");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/users/cpf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid,
          cpf: numbers,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar CPF");
      }

      const data = await response.json();
      setMaskedCpf(data.maskedCpf);
      setCpf("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/cpf?userId=${user?.uid}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Falha ao remover CPF");
      }

      setMaskedCpf(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <LockIcon fontSize="small" color="primary" />
            <Typography variant="h6">CPF para Open Finance</Typography>
          </Stack>
        }
        subheader={
          <Typography variant="body2" color="text.secondary">
            Necessário para pagamentos via Open Finance (criptografado)
          </Typography>
        }
      />
      <CardContent>
        <Stack spacing={2}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success">CPF atualizado com sucesso!</Alert>
          )}

          {maskedCpf ? (
            // CPF já cadastrado
            <Box>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box flex={1}>
                  <Typography variant="body2" color="text.secondary">
                    CPF cadastrado:
                  </Typography>
                  <Typography variant="h6" fontFamily="monospace">
                    {maskedCpf}
                  </Typography>
                </Box>
                <Chip
                  icon={<CheckIcon />}
                  label="Criptografado"
                  color="success"
                  size="small"
                />
              </Stack>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleRemove}
                disabled={saving}
                sx={{ mt: 2 }}
              >
                {saving ? <CircularProgress size={16} /> : "Remover CPF"}
              </Button>
            </Box>
          ) : (
            // Formulário para cadastrar CPF
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <TextField
                fullWidth
                label="CPF"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                inputProps={{ maxLength: 14 }}
                type={showCpf ? "text" : "password"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCpf(!showCpf)}
                        edge="end"
                        size="small"
                      >
                        {showCpf ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || cpf.replace(/\D/g, "").length !== 11}
              >
                {saving ? <CircularProgress size={20} /> : "Salvar"}
              </Button>
            </Stack>
          )}

          <Alert severity="info" icon={<LockIcon fontSize="small" />}>
            <Typography variant="caption">
              Seu CPF é armazenado de forma criptografada e é usado apenas para
              autorizar pagamentos via Open Finance. Nunca compartilhamos seus
              dados.
            </Typography>
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  );
}
