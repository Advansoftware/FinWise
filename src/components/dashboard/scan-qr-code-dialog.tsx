// src/components/dashboard/scan-qr-code-dialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  DialogActions,
  Drawer,
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
} from "@mui/material";
import {
  Upload,
  Camera,
  Paperclip,
  Sparkles,
  BrainCircuit,
  Info,
  RotateCcw,
  FlashlightIcon as Flashlight,
  SwitchCamera,
} from "lucide-react";
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useTransition,
  cloneElement,
  isValidElement,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { extractReceiptInfoAction } from "@/services/ai-actions";
import { useTransactions } from "@/hooks/use-transactions";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { usePlan } from "@/hooks/use-plan";
import { useAISettings } from "@/hooks/use-ai-settings";
import {
  getVisionCapableModels,
  DEFAULT_AI_CREDENTIAL,
} from "@/lib/ai-settings";

export function ScanQRCodeDialog({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isProcessing, startProcessing] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const { addTransaction } = useTransactions();
  const { user } = useAuth();
  const { wallets } = useWallets();
  const { isPlus } = usePlan();
  const { displayedCredentials, activeCredentialId } = useAISettings();
  const theme = useTheme();

  // Filtrar apenas modelos com suporte a visão/imagem
  const visionCapableCredentials = getVisionCapableModels(displayedCredentials);

  const [selectedAI, setSelectedAI] = useState(
    activeCredentialId || DEFAULT_AI_CREDENTIAL.id
  );

  const canSelectProvider = isPlus;
  const selectedCredential = visionCapableCredentials.find(
    (c) => c.id === selectedAI
  );
  const isOllamaSelected = selectedCredential?.provider === "ollama";

  const stopCamera = useCallback(() => {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      setCurrentStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [currentStream]);

  const startCamera = useCallback(
    async (facing: "user" | "environment" = facingMode) => {
      try {
        stopCamera();

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: facing,
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setCurrentStream(stream);
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(console.error);
            }
          };
        }

        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();
        setHasFlash((capabilities as any).torch === true);
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
          variant: "error",
          title: "Erro de Câmera",
          description:
            "Não foi possível acessar a câmera. Verifique as permissões.",
        });
      }
    },
    [facingMode, stopCamera, toast]
  );

  const toggleFlash = useCallback(async () => {
    if (currentStream && hasFlash) {
      const videoTrack = currentStream.getVideoTracks()[0];
      try {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any],
        });
        setFlashEnabled(!flashEnabled);
      } catch (error) {
        console.error("Error toggling flash:", error);
      }
    }
  }, [currentStream, hasFlash, flashEnabled]);

  const switchCamera = useCallback(async () => {
    const newFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacing);
    await startCamera(newFacing);
  }, [facingMode, startCamera]);

  const resetState = useCallback(() => {
    stopCamera();
    setReceiptImage(null);
    setExtractedData(null);
    setHasCameraPermission(null);
    setFlashEnabled(false);
    setFacingMode("environment");
    setSelectedAI(activeCredentialId || DEFAULT_AI_CREDENTIAL.id);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [stopCamera, activeCredentialId]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetState();
    }
  };

  useEffect(() => {
    if (isMobile && isDialogOpen && !receiptImage) {
      startCamera();
    }
    return () => {
      if (!isDialogOpen) {
        stopCamera();
      }
    };
  }, [isMobile, isDialogOpen, receiptImage, startCamera, stopCamera]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        processImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setReceiptImage(dataUrl);
        stopCamera();
        processImage(dataUrl);

        toast({
          title: "Foto Capturada!",
          description: "Processando a nota fiscal...",
        });
      }
    }
  };

  const processImage = async (imageData: string) => {
    if (!user) {
      toast({
        variant: "error",
        title: "Erro de Autenticação",
        description: "Você precisa estar logado.",
      });
      return;
    }
    setExtractedData(null);
    startProcessing(async () => {
      try {
        const result = await extractReceiptInfoAction(
          { photoDataUri: imageData },
          user.uid,
          selectedAI
        );
        setExtractedData(result);
        if (!result.isValid) {
          toast({
            variant: "error",
            title: "Nota Inválida",
            description:
              "A imagem não parece ser uma nota fiscal válida. Tente outra imagem.",
          });
        }
      } catch (error: any) {
        console.error(error);
        toast({
          variant: "error",
          title: "Erro ao Processar",
          description:
            error.message ||
            "Não foi possível extrair as informações da imagem. Verifique suas configurações de IA.",
        });
        if (!error.message?.includes("limite")) {
          resetState();
        }
      }
    });
  };

  const renderProcessingSkeleton = () => (
    <Stack spacing={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Skeleton variant="rounded" width={128} height={24} />
        <Skeleton variant="rounded" width={80} height={24} />
      </Stack>
      <Stack spacing={3}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
          }}
        >
          <Skeleton
            variant="rounded"
            height={40}
            sx={{ gridColumn: "span 2" }}
          />
          <Skeleton variant="rounded" height={40} />
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
          }}
        >
          <Skeleton
            variant="rounded"
            height={40}
            sx={{ gridColumn: "span 2" }}
          />
          <Skeleton variant="rounded" height={40} />
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
          }}
        >
          <Skeleton
            variant="rounded"
            height={40}
            sx={{ gridColumn: "span 2" }}
          />
          <Skeleton variant="rounded" height={40} />
        </Box>
      </Stack>
      <Box
        sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4 }}
      >
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={40} />
      </Box>
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            color: "text.secondary",
          }}
        >
          <CircularProgress size={16} />
          <Typography variant="body2">Analisando nota fiscal...</Typography>
        </Box>
      </Box>
    </Stack>
  );

  const handleSaveTransactions = () => {
    if (
      !extractedData ||
      !extractedData.items ||
      extractedData.items.length === 0
    )
      return;

    startSaving(async () => {
      try {
        const transactionPromises = extractedData.items.map((item: any) => {
          const newTransaction: Omit<Transaction, "id"> = {
            userId: user?.uid || "",
            item: item.item,
            amount: parseFloat(item.amount),
            date: extractedData.date
              ? new Date(extractedData.date).toISOString()
              : new Date().toISOString(),
            category: "Supermercado" as TransactionCategory,
            type: "expense",
            walletId: wallets[0]?.id || "",
            quantity: 1,
            establishment: "",
            subcategory: "",
          };
          return addTransaction(newTransaction);
        });

        await Promise.all(transactionPromises);

        toast({
          title: "Sucesso!",
          description: `${extractedData.items.length} transações foram salvas.`,
        });
        handleDialogOpenChange(false);
      } catch (error) {
        console.error(error);
        toast({
          variant: "error",
          title: "Erro ao Salvar",
          description:
            "Não foi possível salvar as transações. Verifique se você tem uma carteira criada.",
        });
      }
    });
  };

  const renderExtractedData = () => {
    if (!extractedData) return null;
    return (
      <Stack spacing={4}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6" fontWeight="semibold">
            Itens Extraídos
          </Typography>
          <Chip
            variant="filled"
            color={extractedData.isValid ? "success" : "error"}
            label={extractedData.isValid ? "Nota Válida" : "Nota Inválida"}
            sx={{
              bgcolor: extractedData.isValid
                ? alpha(theme.palette.success.main, 0.2)
                : undefined,
              color: extractedData.isValid ? "success.main" : undefined,
            }}
          />
        </Stack>

        {extractedData.items?.length > 0 ? (
          <Stack spacing={3}>
            {extractedData.items?.map((item: any, index: number) => (
              <Box
                key={index}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 2,
                  alignItems: "center",
                  p: 3,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <TextField
                  sx={{ gridColumn: "span 2" }}
                  defaultValue={item.item}
                  placeholder="Item"
                  InputProps={{ readOnly: !extractedData.isValid }}
                  size="small"
                />
                <TextField
                  type="number"
                  defaultValue={item.amount}
                  placeholder="Valor"
                  InputProps={{ readOnly: !extractedData.isValid }}
                  size="small"
                />
              </Box>
            ))}
          </Stack>
        ) : (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography>Nenhum item foi encontrado na nota.</Typography>
            <Typography variant="caption">
              Tente uma imagem com melhor qualidade.
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 4,
            p: 3,
            borderRadius: 1,
            bgcolor: "action.hover",
            border: 1,
            borderColor: "divider",
          }}
        >
          <Stack spacing={1}>
            <InputLabel sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
              Total
            </InputLabel>
            <TextField
              type="number"
              defaultValue={extractedData.totalAmount || 0}
              placeholder="Total"
              InputProps={{ readOnly: !extractedData.isValid }}
              size="small"
            />
          </Stack>
          <Stack spacing={1}>
            <InputLabel sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
              Data
            </InputLabel>
            <TextField
              type="date"
              defaultValue={extractedData.date}
              placeholder="Data"
              InputProps={{ readOnly: !extractedData.isValid }}
              size="small"
            />
          </Stack>
        </Box>

        {!extractedData.isValid && (
          <Alert variant="filled" severity="error" sx={{ mb: 4 }}>
            <AlertTitle>Nota Não Reconhecida</AlertTitle>
            <Typography variant="body2">
              A IA não conseguiu identificar esta como uma nota fiscal válida.
              Certifique-se de que a imagem esteja nítida e bem iluminada.
            </Typography>
          </Alert>
        )}
      </Stack>
    );
  };

  const renderContent = () => (
    <>
      <Stack spacing={4}>
        {!receiptImage && (
          <Stack spacing={2}>
            <InputLabel htmlFor="ai-provider">Provedor de IA</InputLabel>
            <Select
              value={selectedAI}
              onChange={(e) => setSelectedAI(e.target.value)}
              disabled={!canSelectProvider}
              fullWidth
              size="small"
            >
              {visionCapableCredentials.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {c.name}
                    {c.id === DEFAULT_AI_CREDENTIAL.id && (
                      <Box
                        component="span"
                        sx={{
                          ml: 1,
                          fontSize: "0.75rem",
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: "info.main",
                          px: 0.5,
                          borderRadius: 0.5,
                        }}
                      >
                        Padrão
                      </Box>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>

            {!canSelectProvider && (
              <Alert
                variant="outlined"
                severity="info"
                sx={{ mb: 4 }}
                icon={<Sparkles style={{ width: 16, height: 16 }} />}
              >
                <AlertTitle>Gastometria IA</AlertTitle>
                <Typography variant="body2">
                  Usando modelo padrão otimizado para análise de recibos. Faça
                  upgrade para Plus ou Infinity para escolher outros modelos.
                </Typography>
              </Alert>
            )}

            {isOllamaSelected && (
              <Alert
                variant="outlined"
                severity="warning"
                sx={{ mb: 4 }}
                icon={<Info style={{ width: 16, height: 16 }} />}
              >
                <AlertTitle>Aviso: Modelo Local com Visão</AlertTitle>
                <Typography variant="body2">
                  Modelos locais (Ollama) com visão podem ter menor precisão e
                  segurança na leitura de recibos. Recomendamos usar o
                  Gastometria IA para melhores resultados.
                </Typography>
              </Alert>
            )}

            {visionCapableCredentials.length === 1 && canSelectProvider && (
              <Alert
                variant="filled"
                severity="success"
                sx={{ mb: 4 }}
                icon={<BrainCircuit style={{ width: 16, height: 16 }} />}
              >
                <AlertTitle>Modelo com Suporte a Visão</AlertTitle>
                <Typography variant="body2">
                  Apenas modelos com capacidade de processamento de imagem estão
                  disponíveis.
                </Typography>
              </Alert>
            )}
          </Stack>
        )}

        {!receiptImage ? (
          <>
            {isMobile ? (
              <Stack
                spacing={4}
                alignItems="center"
                justifyContent="center"
                width="100%"
              >
                <Box sx={{ position: "relative", width: "100%" }}>
                  <Box
                    component="video"
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    sx={{
                      width: "100%",
                      height: "60vh",
                      objectFit: "cover",
                      borderRadius: 2,
                      bgcolor: "black",
                    }}
                  />
                  {/* Camera overlay */}
                  <Box sx={{ position: "absolute", inset: 0 }}>
                    {/* Guide overlay */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: "1rem",
                        border: "2px dashed rgba(255,255,255,0.6)",
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: "-0.75rem",
                          left: "50%",
                          transform: "translateX(-50%)",
                          bgcolor: "rgba(0,0,0,0.6)",
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          color: "white",
                          fontSize: "0.75rem",
                        }}
                      >
                        Posicione a nota fiscal aqui
                      </Box>
                    </Box>

                    {/* Camera controls */}
                    <Stack
                      spacing={2}
                      sx={{ position: "absolute", top: "1rem", right: "1rem" }}
                    >
                      {hasFlash && (
                        <Button
                          size="small"
                          sx={{
                            minWidth: 32,
                            width: 32,
                            height: 32,
                            p: 0,
                            bgcolor: flashEnabled
                              ? alpha(theme.palette.warning.main, 0.8)
                              : "rgba(0,0,0,0.6)",
                            "&:hover": {
                              bgcolor: flashEnabled
                                ? theme.palette.warning.main
                                : "rgba(0,0,0,0.8)",
                            },
                          }}
                          variant="contained"
                          onClick={toggleFlash}
                        >
                          <Flashlight
                            style={{ width: 16, height: 16, color: "white" }}
                          />
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          minWidth: 32,
                          width: 32,
                          height: 32,
                          p: 0,
                          bgcolor: "rgba(0,0,0,0.6)",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                        }}
                        onClick={switchCamera}
                      >
                        <SwitchCamera
                          style={{ width: 16, height: 16, color: "white" }}
                        />
                      </Button>
                    </Stack>
                  </Box>
                </Box>

                {hasCameraPermission === false && (
                  <Alert variant="filled" severity="warning" sx={{ mb: 4 }}>
                    <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                    <Typography variant="body2">
                      Permita o acesso à câmera para usar este recurso ou use a
                      opção "Enviar da Galeria".
                    </Typography>
                  </Alert>
                )}

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  width="100%"
                >
                  <Box sx={{ height: "1px", flex: 1, bgcolor: "divider" }} />
                  <Typography variant="caption" color="text.secondary">
                    OU
                  </Typography>
                  <Box sx={{ height: "1px", flex: 1, bgcolor: "divider" }} />
                </Stack>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip
                    style={{ marginRight: 8, width: 16, height: 16 }}
                  />{" "}
                  Escolher da Galeria
                </Button>
                {/* Input que abre galeria/câmera no mobile */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </Stack>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <Box
                  component="label"
                  htmlFor="dropzone-file"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: 256,
                    border: `2px dashed ${alpha(
                      theme.palette.primary.main,
                      0.3
                    )}`,
                    borderRadius: 2,
                    cursor: "pointer",
                    bgcolor: "action.hover",
                    transition: "background-color 0.2s",
                    "&:hover": {
                      bgcolor: "action.selected",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      pt: 5,
                      pb: 6,
                    }}
                  >
                    <Upload
                      style={{
                        width: 32,
                        height: 32,
                        marginBottom: 8,
                        color: theme.palette.primary.main,
                      }}
                    />
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <Box
                        component="span"
                        fontWeight="semibold"
                        color="primary.main"
                      >
                        Clique para enviar
                      </Box>{" "}
                      ou arraste e solte
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PDF, PNG, ou JPG
                    </Typography>
                  </Box>
                  <Box
                    component="input"
                    ref={fileInputRef}
                    id="dropzone-file"
                    type="file"
                    accept="image/*,application/pdf"
                    sx={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </Box>
              </Box>
            )}
          </>
        ) : (
          <Stack spacing={4}>
            <Box sx={{ position: "relative" }}>
              <Box
                component="img"
                src={receiptImage}
                alt="Pré-visualização da nota"
                sx={{
                  borderRadius: 2,
                  maxHeight: 240,
                  width: "100%",
                  objectFit: "cover",
                }}
              />
              <Button
                variant="contained"
                size="small"
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  minWidth: 32,
                  width: 32,
                  height: 32,
                  p: 0,
                  bgcolor: "rgba(0,0,0,0.6)",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                }}
                onClick={resetState}
                disabled={isProcessing || isSaving}
              >
                <RotateCcw style={{ width: 16, height: 16, color: "white" }} />
              </Button>
            </Box>
            {isProcessing ? renderProcessingSkeleton() : renderExtractedData()}
          </Stack>
        )}
      </Stack>
      <Box component="canvas" ref={canvasRef} sx={{ display: "none" }} />
    </>
  );

  const trigger = isValidElement(children) ? (
    cloneElement(children as any, {
      onClick: () => handleDialogOpenChange(true),
    })
  ) : (
    <Box onClick={() => handleDialogOpenChange(true)}>{children}</Box>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer
          anchor="bottom"
          open={isDialogOpen}
          onClose={() => handleDialogOpenChange(false)}
          PaperProps={{
            sx: {
              height: "95vh",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            },
          }}
        >
          <Box
            sx={{
              p: 3,
              textAlign: "left",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="h6">Escanear Nota Fiscal</Typography>
            <Typography variant="body2" color="text.secondary">
              Aponte a câmera para a nota fiscal ou envie uma imagem da galeria.
            </Typography>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>{renderContent()}</Box>

          <Box
            sx={{
              p: 3,
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            {receiptImage ? (
              <>
                <Button
                  variant="text"
                  onClick={resetState}
                  disabled={isProcessing || isSaving}
                >
                  Nova Foto
                </Button>
                {extractedData?.isValid && (
                  <Button
                    onClick={handleSaveTransactions}
                    disabled={isSaving || isProcessing}
                    sx={{ flex: 1 }}
                    variant="contained"
                  >
                    {isSaving && <CircularProgress size={16} sx={{ mr: 1 }} />}
                    Salvar {extractedData.items?.length || 0} Itens
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={handleCapture}
                disabled={
                  hasCameraPermission === false || isProcessing || isSaving
                }
                sx={{ width: "100%", height: 48, fontSize: "1.125rem" }}
                size="large"
                variant="contained"
              >
                <Camera style={{ marginRight: 8, width: 20, height: 20 }} />{" "}
                Capturar Nota
              </Button>
            )}
          </Box>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {trigger}
      <Dialog
        open={isDialogOpen}
        onClose={() => handleDialogOpenChange(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Escanear Nota Fiscal</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Faça upload da imagem (PDF, PNG, JPG) da nota fiscal para adicionar
            as transações.
          </DialogContentText>
          {renderContent()}
        </DialogContent>

        <DialogActions
          sx={{ gap: 2, justifyContent: "space-between", px: 3, pb: 3 }}
        >
          <Box>
            {receiptImage && (
              <Button
                variant="text"
                onClick={resetState}
                disabled={isProcessing || isSaving}
              >
                Enviar Outra
              </Button>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            {extractedData?.isValid && (
              <Button
                onClick={handleSaveTransactions}
                disabled={isSaving || isProcessing}
                variant="contained"
              >
                {isSaving && <CircularProgress size={16} sx={{ mr: 1 }} />}
                Salvar Transações
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}
