// src/components/dashboard/scan-qr-code-dialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  AlertTitle,
  Chip,
  Typography,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stack,
  Skeleton,
  CircularProgress,
  useTheme,
  alpha,
  IconButton,
  Fade,
  Paper,
  FormControl,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Divider,
} from "@mui/material";
import {
  Upload,
  Camera,
  Sparkles,
  RotateCcw,
  Flashlight,
  SwitchCamera,
  X,
  Check,
  ImageIcon,
  Trash2,
} from "lucide-react";
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  cloneElement,
  isValidElement,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCamera } from "@/hooks/use-camera";
import {
  useReceiptScanner,
  ExtractedReceiptData,
  ReceiptForm,
  ReceiptItemForm,
} from "@/hooks/use-receipt-scanner";
import { DEFAULT_AI_CREDENTIAL } from "@/lib/ai-settings";
import { TransactionCategory } from "@/lib/types";

// ============ SUB-COMPONENTS ============

interface ScanFrameProps {
  isVisible: boolean;
}

function ScanFrame({ isVisible }: ScanFrameProps) {
  const theme = useTheme();

  return (
    <Fade in={isVisible}>
      <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Box
          sx={{
            position: "absolute",
            top: "12%",
            left: "6%",
            right: "6%",
            bottom: "30%",
            border: `2px solid ${alpha(theme.palette.primary.main, 0.9)}`,
            borderRadius: 2,
            boxShadow: `0 0 0 9999px ${alpha("#000", 0.4)}`,
          }}
        >
          {/* Corner indicators */}
          {[
            { top: -3, left: -3, bTop: 3, bLeft: 3, radiusTL: 6 },
            { top: -3, right: -3, bTop: 3, bRight: 3, radiusTR: 6 },
            { bottom: -3, left: -3, bBottom: 3, bLeft: 3, radiusBL: 6 },
            { bottom: -3, right: -3, bBottom: 3, bRight: 3, radiusBR: 6 },
          ].map((corner, i) => (
            <Box
              key={i}
              sx={{
                position: "absolute",
                width: 24,
                height: 24,
                borderColor: theme.palette.primary.main,
                borderStyle: "solid",
                borderWidth: 0,
                borderTopWidth: corner.bTop || 0,
                borderBottomWidth: corner.bBottom || 0,
                borderLeftWidth: corner.bLeft || 0,
                borderRightWidth: corner.bRight || 0,
                borderTopLeftRadius: corner.radiusTL || 0,
                borderTopRightRadius: corner.radiusTR || 0,
                borderBottomLeftRadius: corner.radiusBL || 0,
                borderBottomRightRadius: corner.radiusBR || 0,
                top: corner.top,
                bottom: corner.bottom,
                left: corner.left,
                right: corner.right,
              }}
            />
          ))}

          {/* Instruction label */}
          <Box
            sx={{
              position: "absolute",
              top: -32,
              left: "50%",
              transform: "translateX(-50%)",
              bgcolor: theme.palette.primary.main,
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              whiteSpace: "nowrap",
            }}
          >
            <Typography variant="caption" color="white" fontWeight={500}>
              Posicione a nota aqui
            </Typography>
          </Box>

          {/* Animated scan line */}
          <Box
            sx={{
              position: "absolute",
              left: 8,
              right: 8,
              height: 2,
              bgcolor: theme.palette.primary.main,
              boxShadow: `0 0 8px 2px ${alpha(
                theme.palette.primary.main,
                0.5
              )}`,
              animation: "scanLine 2.5s ease-in-out infinite",
              "@keyframes scanLine": {
                "0%, 100%": { top: "5%" },
                "50%": { top: "95%" },
              },
            }}
          />
        </Box>
      </Box>
    </Fade>
  );
}

function LoadingSkeleton() {
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between">
        <Skeleton variant="rounded" width={100} height={24} />
        <Skeleton variant="rounded" width={60} height={24} />
      </Stack>
      {[1, 2, 3].map((i) => (
        <Box
          key={i}
          sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 2 }}
        >
          <Skeleton variant="rounded" height={40} />
          <Skeleton variant="rounded" height={40} />
        </Box>
      ))}
      <Box sx={{ textAlign: "center", py: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
        >
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Analisando com IA...
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}

interface ExtractedDataViewProps {
  data: ExtractedReceiptData;
}

function ExtractedDataView({ data }: ExtractedDataViewProps) {
  return (
    <Stack spacing={2}>
      <Alert severity="info" variant="outlined">
        <AlertTitle>Dados Extraídos</AlertTitle>A IA identificou{" "}
        {data.items?.length || 0} itens. Preencha os campos abaixo para salvar.
      </Alert>
    </Stack>
  );
}

// Formulário editável completo para revisar/completar dados da nota
interface ReceiptFormViewProps {
  form: ReceiptForm;
  wallets: Array<{ id: string; name: string }>;
  categories: TransactionCategory[];
  subcategories: Record<string, string[]>;
  onUpdateForm: (updates: Partial<ReceiptForm>) => void;
  onUpdateItem: (index: number, updates: Partial<ReceiptItemForm>) => void;
  onToggleItem: (index: number) => void;
  onSelectAll: (selected: boolean) => void;
  disabled?: boolean;
}

function ReceiptFormView({
  form,
  wallets,
  categories,
  subcategories,
  onUpdateForm,
  onUpdateItem,
  onToggleItem,
  onSelectAll,
  disabled = false,
}: ReceiptFormViewProps) {
  const theme = useTheme();
  const selectedCount = form.items.filter((i) => i.selected).length;
  const totalAmount = form.items
    .filter((i) => i.selected)
    .reduce((sum, i) => sum + i.amount * i.quantity, 0);
  const currentSubcategories = subcategories[form.category] || [];

  return (
    <Stack spacing={2}>
      {/* Cabeçalho com info */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" fontWeight={600}>
          Revisar Transações
        </Typography>
        <Chip
          size="small"
          color="primary"
          label={`${selectedCount} de ${form.items.length} selecionados`}
        />
      </Stack>

      {/* Dados gerais da nota */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={500}
          gutterBottom
          display="block"
        >
          Dados Gerais (aplicados a todos os itens)
        </Typography>

        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Estabelecimento e Data */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Estabelecimento"
              size="small"
              fullWidth
              value={form.establishment}
              onChange={(e) => onUpdateForm({ establishment: e.target.value })}
              disabled={disabled}
              placeholder="Nome da loja/mercado"
            />
            <TextField
              label="Data"
              type="date"
              size="small"
              fullWidth
              value={form.date}
              onChange={(e) => onUpdateForm({ date: e.target.value })}
              disabled={disabled}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {/* Carteira e Tipo */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Carteira *</InputLabel>
              <Select
                value={form.walletId}
                label="Carteira *"
                onChange={(e) => onUpdateForm({ walletId: e.target.value })}
                disabled={disabled}
              >
                {wallets.map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {w.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={form.type}
                label="Tipo"
                onChange={(e) =>
                  onUpdateForm({ type: e.target.value as "income" | "expense" })
                }
                disabled={disabled}
              >
                <MenuItem value="expense">Despesa</MenuItem>
                <MenuItem value="income">Receita</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Categoria e Subcategoria */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={form.category}
                label="Categoria"
                onChange={(e) =>
                  onUpdateForm({
                    category: e.target.value as TransactionCategory,
                    subcategory: "", // Reset subcategory when category changes
                  })
                }
                disabled={disabled}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Subcategoria</InputLabel>
              <Select
                value={form.subcategory}
                label="Subcategoria"
                onChange={(e) => onUpdateForm({ subcategory: e.target.value })}
                disabled={disabled || currentSubcategories.length === 0}
              >
                <MenuItem value="">Nenhuma</MenuItem>
                {currentSubcategories.map((sub) => (
                  <MenuItem key={sub} value={sub}>
                    {sub}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Paper>

      {/* Lista de Itens */}
      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Itens ({form.items.length})
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={() => onSelectAll(true)}
              disabled={disabled}
            >
              Selecionar todos
            </Button>
            <Button
              size="small"
              onClick={() => onSelectAll(false)}
              disabled={disabled}
            >
              Limpar
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={1} sx={{ maxHeight: 250, overflow: "auto" }}>
          {form.items.map((item, index) => (
            <Paper
              key={index}
              variant="outlined"
              sx={{
                p: 1.5,
                opacity: item.selected ? 1 : 0.5,
                bgcolor: item.selected
                  ? "transparent"
                  : alpha(theme.palette.action.disabled, 0.05),
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Checkbox
                    checked={item.selected}
                    onChange={() => onToggleItem(index)}
                    disabled={disabled}
                    size="small"
                  />
                  <TextField
                    size="small"
                    fullWidth
                    value={item.item}
                    onChange={(e) =>
                      onUpdateItem(index, { item: e.target.value })
                    }
                    disabled={disabled || !item.selected}
                    placeholder="Nome do item"
                  />
                </Stack>

                <Stack direction="row" spacing={1} sx={{ pl: 4 }}>
                  <TextField
                    size="small"
                    label="Valor"
                    type="number"
                    value={item.amount}
                    onChange={(e) =>
                      onUpdateItem(index, {
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={disabled || !item.selected}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                      ),
                    }}
                    sx={{ flex: 2 }}
                  />
                  <TextField
                    size="small"
                    label="Qtd"
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      onUpdateItem(index, {
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    disabled={disabled || !item.selected}
                    inputProps={{ min: 1 }}
                    sx={{ flex: 1 }}
                  />
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>

      {/* Total */}
      <Divider />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Total ({selectedCount} itens):
        </Typography>
        <Typography variant="h6" fontWeight={600} color="primary">
          R$ {totalAmount.toFixed(2)}
        </Typography>
      </Stack>
    </Stack>
  );
}

interface AIProviderSelectorProps {
  value: string;
  onChange: (value: string) => void;
  credentials: Array<{ id: string; name: string }>;
  disabled: boolean;
  variant?: "light" | "dark";
}

function AIProviderSelector({
  value,
  onChange,
  credentials,
  disabled,
  variant = "light",
}: AIProviderSelectorProps) {
  const theme = useTheme();
  const isDark = variant === "dark";

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
        <Sparkles size={12} color={theme.palette.primary.main} />
        <Typography
          variant="caption"
          color={isDark ? "grey.400" : "text.secondary"}
        >
          Modelo de IA
        </Typography>
      </Stack>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        fullWidth
        size="small"
        sx={
          isDark
            ? {
                bgcolor: "rgba(255,255,255,0.08)",
                color: "white",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.15)",
                },
                "& .MuiSelect-icon": { color: "grey.500" },
              }
            : {}
        }
      >
        {credentials.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
            {c.id === DEFAULT_AI_CREDENTIAL.id && " (Padrão)"}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

// ============ MAIN COMPONENT ============

export function ScanQRCodeDialog({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Custom hooks
  const camera = useCamera({ facingMode: "environment" });
  const scanner = useReceiptScanner();

  // Reset everything when dialog closes
  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Start camera when mobile dialog opens
  useEffect(() => {
    if (isMobile && isOpen && !scanner.receiptImage) {
      camera.start();
    }

    // Cleanup: stop camera when dialog closes
    if (!isOpen) {
      camera.stop();
      scanner.reset();
    }
  }, [isMobile, isOpen, scanner.receiptImage]);

  // Handle file selection
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageData = reader.result as string;
          scanner.processImage(imageData);
        };
        reader.readAsDataURL(file);
      }
    },
    [scanner]
  );

  // Handle camera capture
  const handleCapture = useCallback(() => {
    const imageData = camera.capture(0.9);
    if (imageData) {
      camera.stop();
      scanner.processImage(imageData);
      toast({
        title: "Foto Capturada!",
        description: "Processando a nota fiscal...",
      });
    }
  }, [camera, scanner, toast]);

  // Handle save transactions
  const handleSave = useCallback(async () => {
    const success = await scanner.saveTransactions();
    if (success) handleClose();
  }, [scanner, handleClose]);

  // Handle new photo
  const handleNewPhoto = useCallback(() => {
    scanner.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (isMobile) camera.start();
  }, [scanner, camera, isMobile]);

  // Trigger element
  const trigger = isValidElement(children) ? (
    cloneElement(children as any, { onClick: () => setIsOpen(true) })
  ) : (
    <Box onClick={() => setIsOpen(true)}>{children}</Box>
  );

  // ============ MOBILE SCANNER ============
  if (isMobile) {
    return (
      <>
        {trigger}
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            bgcolor: "black",
            display: isOpen ? "flex" : "none",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)",
              px: 2,
              pt: "calc(env(safe-area-inset-top, 8px) + 8px)",
              pb: 4,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <IconButton
                onClick={handleClose}
                sx={{ color: "white", bgcolor: "rgba(255,255,255,0.15)" }}
              >
                <X size={20} />
              </IconButton>
              <Typography variant="subtitle1" color="white" fontWeight={600}>
                Scanner de Nota
              </Typography>
              <Box sx={{ width: 40 }} />
            </Stack>
          </Box>

          {!scanner.receiptImage ? (
            <>
              {/* Camera Feed */}
              <Box sx={{ flex: 1, position: "relative", overflow: "hidden" }}>
                <Box
                  component="video"
                  ref={camera.videoRef}
                  autoPlay
                  muted
                  playsInline
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />

                {/* Loading */}
                <Fade in={!camera.isReady && camera.hasPermission !== false}>
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      bgcolor: "black",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <CircularProgress size={32} sx={{ color: "white" }} />
                    <Typography color="white" variant="body2">
                      Iniciando câmera...
                    </Typography>
                  </Box>
                </Fade>

                {/* Scan Frame */}
                <ScanFrame isVisible={camera.isReady} />

                {/* Side Controls */}
                <Stack
                  spacing={1.5}
                  sx={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  {camera.hasFlash && (
                    <IconButton
                      onClick={camera.toggleFlash}
                      size="small"
                      sx={{
                        bgcolor: camera.flashEnabled
                          ? theme.palette.warning.main
                          : "rgba(255,255,255,0.2)",
                        color: "white",
                        width: 40,
                        height: 40,
                      }}
                    >
                      <Flashlight size={18} />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={camera.switchCamera}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.2)",
                      color: "white",
                      width: 40,
                      height: 40,
                    }}
                  >
                    <SwitchCamera size={18} />
                  </IconButton>
                </Stack>

                {/* Permission Error */}
                {camera.hasPermission === false && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(0,0,0,0.95)",
                      px: 4,
                    }}
                  >
                    <Alert severity="warning" sx={{ maxWidth: 280 }}>
                      <AlertTitle>Câmera Indisponível</AlertTitle>
                      Permita o acesso ou use a galeria.
                    </Alert>
                  </Box>
                )}
              </Box>

              {/* Bottom Controls */}
              <Box
                sx={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.95) 70%, transparent 100%)",
                  px: 3,
                  pt: 3,
                  pb: "calc(env(safe-area-inset-bottom, 16px) + 16px)",
                }}
              >
                <Box sx={{ mb: 2.5, maxWidth: 400, mx: "auto" }}>
                  <AIProviderSelector
                    value={scanner.selectedAI}
                    onChange={scanner.setSelectedAI}
                    credentials={scanner.visionCapableCredentials}
                    disabled={!scanner.canSelectProvider}
                    variant="dark"
                  />
                </Box>

                {/* Capture Buttons - Centered with max-width */}
                <Stack
                  direction="row"
                  spacing={3}
                  alignItems="center"
                  justifyContent="center"
                  sx={{ maxWidth: 280, mx: "auto" }}
                >
                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.12)",
                      color: "white",
                      width: 48,
                      height: 48,
                    }}
                  >
                    <ImageIcon size={20} />
                  </IconButton>

                  <IconButton
                    onClick={handleCapture}
                    disabled={!camera.isReady || scanner.isProcessing}
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: theme.palette.primary.main,
                      color: "white",
                      border: "3px solid white",
                      "&:hover": { bgcolor: theme.palette.primary.dark },
                      "&:disabled": {
                        bgcolor: "grey.800",
                        borderColor: "grey.700",
                      },
                      transition: "transform 0.1s",
                      "&:active": { transform: "scale(0.92)" },
                    }}
                  >
                    <Camera size={24} />
                  </IconButton>

                  <Box sx={{ width: 48 }} />
                </Stack>
              </Box>
            </>
          ) : (
            /* Results View */
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                bgcolor: theme.palette.background.default,
                pt: "calc(env(safe-area-inset-top, 0px) + 56px)",
              }}
            >
              {/* Image preview */}
              <Box sx={{ position: "relative", height: 140, flexShrink: 0 }}>
                <Box
                  component="img"
                  src={scanner.receiptImage}
                  alt="Nota"
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <IconButton
                  onClick={handleNewPhoto}
                  disabled={scanner.isProcessing || scanner.isSaving}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "white",
                    width: 36,
                    height: 36,
                  }}
                >
                  <RotateCcw size={16} />
                </IconButton>
              </Box>

              {/* Results */}
              <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                {scanner.isProcessing ? (
                  <LoadingSkeleton />
                ) : scanner.form ? (
                  <ReceiptFormView
                    form={scanner.form}
                    wallets={scanner.wallets}
                    categories={scanner.categories}
                    subcategories={scanner.subcategories}
                    onUpdateForm={scanner.updateForm}
                    onUpdateItem={scanner.updateItem}
                    onToggleItem={scanner.toggleItemSelection}
                    onSelectAll={scanner.selectAllItems}
                    disabled={scanner.isSaving}
                  />
                ) : scanner.extractedData && !scanner.extractedData.isValid ? (
                  <Alert severity="warning" variant="outlined">
                    <AlertTitle>Nota Não Reconhecida</AlertTitle>A IA não
                    conseguiu identificar esta imagem como uma nota fiscal
                    válida. Tente tirar outra foto com melhor iluminação.
                  </Alert>
                ) : null}
              </Box>

              {/* Bottom actions */}
              <Paper
                elevation={8}
                sx={{
                  px: 2,
                  pt: 2,
                  pb: "calc(env(safe-area-inset-bottom, 12px) + 12px)",
                  borderRadius: 0,
                  display: "flex",
                  gap: 2,
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handleNewPhoto}
                  disabled={scanner.isProcessing || scanner.isSaving}
                  sx={{ flex: 1 }}
                >
                  Nova Foto
                </Button>
                {scanner.form && scanner.form.items.some((i) => i.selected) && (
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={scanner.isSaving || !scanner.form.walletId}
                    sx={{ flex: 2 }}
                    startIcon={
                      scanner.isSaving ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Check size={16} />
                      )
                    }
                  >
                    Salvar {scanner.form.items.filter((i) => i.selected).length}
                  </Button>
                )}
              </Paper>
            </Box>
          )}

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <canvas ref={camera.canvasRef} style={{ display: "none" }} />
        </Box>
      </>
    );
  }

  // ============ DESKTOP DIALOG ============
  return (
    <>
      {trigger}
      <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Escanear Nota Fiscal</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Faça upload da imagem para extrair transações automaticamente.
          </DialogContentText>

          <Stack spacing={3}>
            {!scanner.receiptImage && (
              <Stack spacing={2}>
                <AIProviderSelector
                  value={scanner.selectedAI}
                  onChange={scanner.setSelectedAI}
                  credentials={scanner.visionCapableCredentials}
                  disabled={!scanner.canSelectProvider}
                />
                {!scanner.canSelectProvider && (
                  <Alert severity="info" icon={<Sparkles size={16} />}>
                    <AlertTitle>Gastometria IA</AlertTitle>
                    Faça upgrade para escolher outros modelos.
                  </Alert>
                )}
              </Stack>
            )}

            {!scanner.receiptImage ? (
              <Box
                component="label"
                htmlFor="dropzone-file-desktop"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: 220,
                  border: `2px dashed ${alpha(
                    theme.palette.primary.main,
                    0.3
                  )}`,
                  borderRadius: 2,
                  cursor: "pointer",
                  bgcolor: "action.hover",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: "action.selected",
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                <Upload
                  size={32}
                  color={theme.palette.primary.main}
                  style={{ marginBottom: 12 }}
                />
                <Typography variant="body1">
                  <Box component="span" fontWeight={600} color="primary.main">
                    Clique
                  </Box>{" "}
                  ou arraste
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  PNG, JPG ou PDF
                </Typography>
                <input
                  id="dropzone-file-desktop"
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </Box>
            ) : (
              <Stack spacing={3}>
                <Box sx={{ position: "relative" }}>
                  <Box
                    component="img"
                    src={scanner.receiptImage}
                    alt="Nota"
                    sx={{
                      borderRadius: 2,
                      maxHeight: 140,
                      width: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <IconButton
                    onClick={handleNewPhoto}
                    disabled={scanner.isProcessing || scanner.isSaving}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: "rgba(0,0,0,0.6)",
                      color: "white",
                    }}
                  >
                    <RotateCcw size={16} />
                  </IconButton>
                </Box>
                {scanner.isProcessing ? (
                  <LoadingSkeleton />
                ) : scanner.form ? (
                  <ReceiptFormView
                    form={scanner.form}
                    wallets={scanner.wallets}
                    categories={scanner.categories}
                    subcategories={scanner.subcategories}
                    onUpdateForm={scanner.updateForm}
                    onUpdateItem={scanner.updateItem}
                    onToggleItem={scanner.toggleItemSelection}
                    onSelectAll={scanner.selectAllItems}
                    disabled={scanner.isSaving}
                  />
                ) : scanner.extractedData && !scanner.extractedData.isValid ? (
                  <Alert severity="warning" variant="outlined">
                    <AlertTitle>Nota Não Reconhecida</AlertTitle>A IA não
                    conseguiu identificar esta imagem como uma nota fiscal
                    válida.
                  </Alert>
                ) : null}
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, justifyContent: "space-between" }}>
          <Box>
            {scanner.receiptImage && (
              <Button
                variant="outlined"
                onClick={handleNewPhoto}
                disabled={scanner.isProcessing || scanner.isSaving}
              >
                Nova Imagem
              </Button>
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={handleClose}>
              Cancelar
            </Button>
            {scanner.form && scanner.form.items.some((i) => i.selected) && (
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={scanner.isSaving || !scanner.form.walletId}
                startIcon={
                  scanner.isSaving ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Check size={16} />
                  )
                }
              >
                Salvar {scanner.form.items.filter((i) => i.selected).length}{" "}
                Transações
              </Button>
            )}
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}
