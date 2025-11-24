"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Smartphone as SmartphoneIcon,
  Computer as ComputerIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
} from "@mui/icons-material";
import { useBankPayment } from "@/hooks/use-bank-payment";
import { UserDevice } from "@/core/ports/bank-payment.port";

type DeviceType = "mobile" | "desktop" | "tablet";

interface DeviceFormData {
  name: string;
  type: DeviceType;
  enablePush: boolean;
}

const initialFormData: DeviceFormData = {
  name: "",
  type: "mobile",
  enablePush: true,
};

export function DeviceManager() {
  const {
    devices,
    registerDevice,
    updateDevice,
    removeDevice,
    setPrimaryDevice,
    loading,
    refreshDevices,
  } = useBankPayment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<UserDevice | null>(null);
  const [formData, setFormData] = useState<DeviceFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedDevice, setSelectedDevice] = useState<UserDevice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  // Verificar se é o dispositivo atual
  const isCurrentDevice = (device: UserDevice) => {
    if (typeof navigator === "undefined") return false;
    // Verificação simplificada por userAgent
    return device.userAgent === navigator.userAgent;
  };

  // Abrir diálogo para novo dispositivo
  const handleAddClick = async () => {
    setEditingDevice(null);
    setFormData({
      ...initialFormData,
      name: getDefaultDeviceName(),
      type: getCurrentDeviceType(),
    });
    setError(null);
    setDialogOpen(true);
  };

  // Obter nome padrão do dispositivo
  const getDefaultDeviceName = () => {
    if (typeof navigator === "undefined") return "Meu Dispositivo";
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/iPad/i.test(ua)) return "iPad";
    if (/Android/i.test(ua)) return "Android";
    if (/Mac/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua)) return "Windows PC";
    return "Meu Dispositivo";
  };

  // Obter tipo do dispositivo atual
  const getCurrentDeviceType = (): DeviceType => {
    if (typeof navigator === "undefined") return "desktop";
    const ua = navigator.userAgent;
    if (/iPad/i.test(ua)) return "tablet";
    if (/iPhone|Android/i.test(ua)) return "mobile";
    return "desktop";
  };

  // Abrir diálogo para editar dispositivo
  const handleEditClick = (device: UserDevice) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      type: device.type,
      enablePush: Boolean(device.pushEndpoint),
    });
    setError(null);
    setDialogOpen(true);
    setMenuAnchor(null);
  };

  // Fechar diálogo
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDevice(null);
    setFormData(initialFormData);
    setError(null);
  };

  // Solicitar permissão de notificação
  const requestPushPermission = async (): Promise<boolean> => {
    if (typeof Notification === "undefined") return false;

    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;

    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    return permission === "granted";
  };

  // Salvar dispositivo
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Se quer push e é dispositivo atual, solicitar permissão
      if (formData.enablePush && !editingDevice) {
        const hasPermission = await requestPushPermission();
        if (!hasPermission) {
          setError(
            "Permissão de notificação negada. Habilite nas configurações do navegador."
          );
          setSaving(false);
          return;
        }
      }

      if (editingDevice) {
        await updateDevice(editingDevice.id, {
          name: formData.name,
          type: formData.type,
        });
      } else {
        await registerDevice(formData.name, formData.type, formData.enablePush);
      }
      handleCloseDialog();
      refreshDevices();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar dispositivo");
    } finally {
      setSaving(false);
    }
  };

  // Abrir menu
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    device: UserDevice
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedDevice(device);
  };

  // Fechar menu
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDevice(null);
  };

  // Definir como primário
  const handleSetPrimary = async () => {
    if (!selectedDevice) return;

    setSaving(true);
    try {
      await setPrimaryDevice(selectedDevice.id);
      refreshDevices();
    } catch (err: any) {
      setError(err.message || "Erro ao definir dispositivo primário");
    } finally {
      setSaving(false);
      setMenuAnchor(null);
    }
  };

  // Abrir diálogo de exclusão
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
  };

  // Confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!selectedDevice) return;

    setSaving(true);
    try {
      await removeDevice(selectedDevice.id);
      refreshDevices();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir dispositivo");
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
      setSelectedDevice(null);
    }
  };

  // Obter ícone do dispositivo
  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case "mobile":
        return <SmartphoneIcon />;
      case "tablet":
        return <SmartphoneIcon sx={{ transform: "rotate(90deg)" }} />;
      default:
        return <ComputerIcon />;
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Meus Dispositivos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          size="small"
        >
          Cadastrar Este Dispositivo
        </Button>
      </Stack>

      {/* Aviso de permissão */}
      {pushPermission === "denied" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Notificações estão bloqueadas. Habilite nas configurações do navegador
          para receber alertas de pagamento.
        </Alert>
      )}

      {/* Lista de dispositivos */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : devices.length === 0 ? (
        <Card>
          <CardContent>
            <Stack alignItems="center" spacing={2} py={4}>
              <SmartphoneIcon sx={{ fontSize: 48, color: "grey.400" }} />
              <Typography color="text.secondary">
                Nenhum dispositivo cadastrado
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Cadastre este dispositivo para receber notificações de pagamento
                do computador.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddClick}
              >
                Cadastrar Dispositivo
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1}>
          {devices.map((device) => (
            <Card key={device.id} variant="outlined">
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: device.isPrimary ? "primary.main" : "grey.200",
                      color: device.isPrimary ? "white" : "grey.600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getDeviceIcon(device.type)}
                  </Box>

                  <Box flex={1}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Typography variant="body1" fontWeight="medium">
                        {device.name}
                      </Typography>
                      {device.isPrimary && (
                        <Chip
                          icon={<StarIcon />}
                          label="Principal"
                          size="small"
                          color="primary"
                          sx={{ height: 20 }}
                        />
                      )}
                      {isCurrentDevice(device) && (
                        <Chip
                          label="Este dispositivo"
                          size="small"
                          variant="outlined"
                          sx={{ height: 20 }}
                        />
                      )}
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={1} mt={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        {device.type === "mobile"
                          ? "Celular"
                          : device.type === "tablet"
                          ? "Tablet"
                          : "Computador"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        •
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Último acesso: {formatDate(device.lastActiveAt)}
                      </Typography>
                      {device.pushEndpoint ? (
                        <NotificationsIcon
                          sx={{ fontSize: 14, color: "success.main", ml: 0.5 }}
                        />
                      ) : (
                        <NotificationsOffIcon
                          sx={{ fontSize: 14, color: "grey.400", ml: 0.5 }}
                        />
                      )}
                    </Stack>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, device)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Menu de ações */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedDevice && !selectedDevice.isPrimary && (
          <MenuItem onClick={handleSetPrimary}>
            <ListItemIcon>
              <StarIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Definir como principal</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => selectedDevice && handleEditClick(selectedDevice)}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Remover</ListItemText>
        </MenuItem>
      </Menu>

      {/* Diálogo de criação/edição */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editingDevice ? "Editar Dispositivo" : "Cadastrar Dispositivo"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Nome do Dispositivo"
              fullWidth
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.type}
                label="Tipo"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as DeviceType,
                  })
                }
              >
                <MenuItem value="mobile">
                  <Stack direction="row" alignItems="center" gap={1}>
                    <SmartphoneIcon fontSize="small" />
                    Celular
                  </Stack>
                </MenuItem>
                <MenuItem value="tablet">
                  <Stack direction="row" alignItems="center" gap={1}>
                    <SmartphoneIcon
                      fontSize="small"
                      sx={{ transform: "rotate(90deg)" }}
                    />
                    Tablet
                  </Stack>
                </MenuItem>
                <MenuItem value="desktop">
                  <Stack direction="row" alignItems="center" gap={1}>
                    <ComputerIcon fontSize="small" />
                    Computador
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>

            {!editingDevice && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enablePush}
                    onChange={(e) =>
                      setFormData({ ...formData, enablePush: e.target.checked })
                    }
                  />
                }
                label="Receber notificações de pagamento"
              />
            )}

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Remover Dispositivo</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover o dispositivo "{selectedDevice?.name}
            "?
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Você não receberá mais notificações de pagamento neste dispositivo.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {saving ? "Removendo..." : "Remover"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
