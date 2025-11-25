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
} from "@/hooks/use-receipt-scanner";
import { DEFAULT_AI_CREDENTIAL } from "@/lib/ai-settings";

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
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" fontWeight={600}>
          Itens Extraídos
        </Typography>
        <Chip
          size="small"
          color={data.isValid ? "success" : "error"}
          label={data.isValid ? "Válida" : "Inválida"}
        />
      </Stack>

      {data.items?.length > 0 ? (
        <Stack spacing={1.5}>
          {data.items.map((item, i) => (
            <Paper
              key={i}
              variant="outlined"
              sx={{
                p: 1.5,
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 1.5,
              }}
            >
              <TextField
                size="small"
                defaultValue={item.item}
                InputProps={{ readOnly: true }}
              />
              <TextField
                size="small"
                type="number"
                defaultValue={item.amount}
                InputProps={{
                  readOnly: true,
                  startAdornment: <Typography sx={{ mr: 0.5 }}>R$</Typography>,
                }}
              />
            </Paper>
          ))}
        </Stack>
      ) : (
        <Typography color="text.secondary" textAlign="center" py={2}>
          Nenhum item encontrado.
        </Typography>
      )}

      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary">
            Total
          </Typography>
          <TextField
            size="small"
            fullWidth
            type="number"
            defaultValue={data.totalAmount || 0}
            InputProps={{
              readOnly: true,
              startAdornment: <Typography sx={{ mr: 0.5 }}>R$</Typography>,
            }}
          />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Data
          </Typography>
          <TextField
            size="small"
            fullWidth
            type="date"
            defaultValue={data.date}
            InputProps={{ readOnly: true }}
          />
        </Box>
      </Paper>

      {!data.isValid && (
        <Alert severity="warning" variant="outlined">
          <AlertTitle>Não Reconhecida</AlertTitle>A IA não identificou como nota
          fiscal válida.
        </Alert>
      )}
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
    camera.stop();
    scanner.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [camera, scanner]);

  // Start camera when mobile dialog opens
  useEffect(() => {
    if (isMobile && isOpen && !scanner.receiptImage) {
      camera.start();
    }
    return () => {
      if (!isOpen) camera.stop();
    };
  }, [isMobile, isOpen, scanner.receiptImage, camera]);

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
                ) : scanner.extractedData ? (
                  <ExtractedDataView data={scanner.extractedData} />
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
                {scanner.extractedData?.isValid && (
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={scanner.isSaving}
                    sx={{ flex: 2 }}
                    startIcon={
                      scanner.isSaving ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Check size={16} />
                      )
                    }
                  >
                    Salvar {scanner.extractedData.items?.length || 0}
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
                      maxHeight: 180,
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
                ) : scanner.extractedData ? (
                  <ExtractedDataView data={scanner.extractedData} />
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
            {scanner.extractedData?.isValid && (
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={scanner.isSaving}
                startIcon={
                  scanner.isSaving ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Check size={16} />
                  )
                }
              >
                Salvar Transações
              </Button>
            )}
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}
