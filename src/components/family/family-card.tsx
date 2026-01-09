// src/components/family/family-card.tsx

/**
 * FamilyCard - Cartão de exibição da família
 *
 * Mostra informações básicas da família e membros
 * com ações rápidas para gerenciamento.
 */

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Avatar,
  AvatarGroup,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Users,
  Settings,
  UserPlus,
  LogOut,
  Trash2,
  Edit,
  MoreVertical,
  Crown,
  Shield,
  User,
} from "lucide-react";
import { useFamily } from "@/hooks/use-family";
import { FamilyMember, FamilyMemberRole } from "@/lib/family-types";

interface FamilyCardProps {
  onManage?: () => void;
  onInvite?: () => void;
}

export function FamilyCard({ onManage, onInvite }: FamilyCardProps) {
  const theme = useTheme();
  const {
    family,
    isOwner,
    isAdmin,
    canInvite,
    currentMember,
    leaveFamily,
    deleteFamily,
  } = useFamily();

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  if (!family) return null;

  const activeMembers = family.members.filter((m) => m.status === "active");

  const getRoleIcon = (role: FamilyMemberRole) => {
    switch (role) {
      case "owner":
        return <Crown size={14} />;
      case "admin":
        return <Shield size={14} />;
      default:
        return <User size={14} />;
    }
  };

  const getRoleLabel = (role: FamilyMemberRole) => {
    switch (role) {
      case "owner":
        return "Dono";
      case "admin":
        return "Admin";
      default:
        return "Membro";
    }
  };

  const getRoleColor = (role: FamilyMemberRole) => {
    switch (role) {
      case "owner":
        return theme.palette.warning.main;
      case "admin":
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const handleLeaveFamily = async () => {
    await leaveFamily();
    setShowLeaveDialog(false);
  };

  const handleDeleteFamily = async () => {
    if (deleteConfirmText === family.name) {
      await deleteFamily();
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.05
          )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <CardHeader
          avatar={
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                background: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              {family.icon || "👨‍👩‍👧‍👦"}
            </Box>
          }
          action={
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreVertical size={20} />
            </IconButton>
          }
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6">{family.name}</Typography>
              <Chip
                icon={getRoleIcon(currentMember?.role || "member")}
                label={getRoleLabel(currentMember?.role || "member")}
                size="small"
                sx={{
                  bgcolor: alpha(
                    getRoleColor(currentMember?.role || "member"),
                    0.1
                  ),
                  color: getRoleColor(currentMember?.role || "member"),
                  "& .MuiChip-icon": {
                    color: "inherit",
                  },
                }}
              />
            </Box>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              {activeMembers.length} de {family.maxMembers} membros
            </Typography>
          }
        />

        <CardContent>
          {/* Lista de membros */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Membros
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {activeMembers.map((member) => (
                <Tooltip
                  key={member.id}
                  title={`${member.displayName} (${getRoleLabel(member.role)})`}
                >
                  <Chip
                    avatar={
                      <Avatar
                        sx={{ width: 24, height: 24, fontSize: "0.75rem" }}
                      >
                        {member.displayName.charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    label={member.displayName.split(" ")[0]}
                    size="small"
                    variant={
                      member.userId === currentMember?.userId
                        ? "filled"
                        : "outlined"
                    }
                    color={
                      member.userId === currentMember?.userId
                        ? "primary"
                        : "default"
                    }
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>

          {/* Ações rápidas */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {canInvite && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<UserPlus size={16} />}
                onClick={onInvite}
              >
                Convidar
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Settings size={16} />}
                onClick={onManage}
              >
                Gerenciar
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Menu de opções */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {isAdmin && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onManage?.();
            }}
          >
            <ListItemIcon>
              <Settings size={18} />
            </ListItemIcon>
            <ListItemText>Configurações</ListItemText>
          </MenuItem>
        )}
        {canInvite && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onInvite?.();
            }}
          >
            <ListItemIcon>
              <UserPlus size={18} />
            </ListItemIcon>
            <ListItemText>Convidar Membro</ListItemText>
          </MenuItem>
        )}

        <Divider />

        {!isOwner && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              setShowLeaveDialog(true);
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <LogOut size={18} color={theme.palette.error.main} />
            </ListItemIcon>
            <ListItemText>Sair da Família</ListItemText>
          </MenuItem>
        )}

        {isOwner && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              setShowDeleteDialog(true);
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <Trash2 size={18} color={theme.palette.error.main} />
            </ListItemIcon>
            <ListItemText>Excluir Família</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Dialog de sair */}
      <Dialog open={showLeaveDialog} onClose={() => setShowLeaveDialog(false)}>
        <DialogTitle>Sair da Família?</DialogTitle>
        <DialogContent>
          <Typography>
            Você tem certeza que deseja sair de "{family.name}"? Você perderá
            acesso aos recursos compartilhados.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLeaveDialog(false)}>Cancelar</Button>
          <Button onClick={handleLeaveFamily} color="error" variant="contained">
            Sair
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de excluir */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Excluir Família?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Esta ação é <strong>irreversível</strong>. Todos os membros perderão
            acesso e os dados de compartilhamento serão removidos.
          </Typography>
          <Typography gutterBottom>
            Para confirmar, digite o nome da família:{" "}
            <strong>{family.name}</strong>
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            placeholder={family.name}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleDeleteFamily}
            color="error"
            variant="contained"
            disabled={deleteConfirmText !== family.name}
          >
            Excluir Família
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
