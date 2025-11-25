// src/components/camera/qrcode-scanner.tsx
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Typography,
} from "@mui/material";
import { Box, Stack } from "@mui/material";
import { SwitchCamera, RefreshCw, QrCode, CheckCircle } from "lucide-react";
import { isNFCeUrl } from "@/lib/nfce-utils";

type CameraFacing = "user" | "environment";

interface QRCodeScannerProps {
  onQRCodeDetected: (url: string) => void;
  onSwitchToPhoto?: () => void;
}

export function QRCodeScanner({
  onQRCodeDetected,
  onSwitchToPhoto,
}: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<CameraFacing>("environment");
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [scanningStatus, setScanningStatus] = useState<string>(
    "Posicione o QR Code da nota fiscal"
  );
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      setCurrentStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [currentStream]);

  const scanQRCode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || detectedUrl) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Usar BarcodeDetector API se disponível (Chrome, Edge)
      if ("BarcodeDetector" in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });

        const barcodes = await barcodeDetector.detect(canvas);

        if (barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          console.log("QR Code detectado:", rawValue);

          // Verificar se é uma URL de NFCe
          if (isNFCeUrl(rawValue)) {
            setDetectedUrl(rawValue);
            setScanningStatus("QR Code de NFCe detectado!");
            stopCamera();

            // Pequeno delay para mostrar feedback visual
            setTimeout(() => {
              onQRCodeDetected(rawValue);
            }, 500);
          } else if (rawValue.startsWith("http")) {
            setScanningStatus("QR Code detectado, mas não é uma NFCe válida");
          }
        }
      } else {
        // Fallback: usar jsQR library se necessário
        setScanningStatus(
          "Seu navegador não suporta leitura de QR Code nativa"
        );
      }
    } catch (err) {
      console.error("Erro ao escanear QR Code:", err);
    }
  }, [detectedUrl, onQRCodeDetected, stopCamera]);

  const startCamera = useCallback(
    async (facing: CameraFacing = facingMode) => {
      setIsLoading(true);
      setError(null);

      try {
        stopCamera();

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Câmera não disponível neste dispositivo");
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setCurrentStream(stream);
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                setIsLoading(false);
                setIsScanning(true);

                // Iniciar escaneamento contínuo
                scanIntervalRef.current = setInterval(scanQRCode, 200);
              });
            }
          };

          setTimeout(() => {
            if (isLoading) setIsLoading(false);
          }, 3000);
        }
      } catch (error: any) {
        console.error("Error accessing camera:", error);
        setIsLoading(false);
        setHasCameraPermission(false);

        if (error.name === "NotAllowedError") {
          setError("Permissão de câmera negada.");
        } else if (error.name === "NotFoundError") {
          setError("Nenhuma câmera encontrada.");
        } else {
          setError(error.message || "Erro ao acessar câmera");
        }
      }
    },
    [facingMode, stopCamera, isLoading, scanQRCode]
  );

  const switchCamera = useCallback(async () => {
    const newFacing: CameraFacing =
      facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacing);
    await startCamera(newFacing);
  }, [facingMode, startCamera]);

  const retryCamera = useCallback(() => {
    setDetectedUrl(null);
    setScanningStatus("Posicione o QR Code da nota fiscal");
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "50vh",
          bgcolor: "black",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress color="inherit" sx={{ color: "white" }} />
          <Typography color="white">Iniciando câmera...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error || hasCameraPermission === false) {
    return (
      <Box sx={{ position: "relative", width: "100%", borderRadius: 2 }}>
        <Alert
          variant="filled"
          severity="error"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <AlertTitle>Erro na Câmera</AlertTitle>
          <Typography sx={{ mb: 2 }}>
            {error || "Não foi possível acessar a câmera."}
          </Typography>
          <Button
            onClick={retryCamera}
            variant="outlined"
            size="small"
            color="inherit"
          >
            <RefreshCw
              style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }}
            />
            Tentar Novamente
          </Button>
        </Alert>
      </Box>
    );
  }

  if (detectedUrl) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: "center",
          bgcolor: "success.main",
          borderRadius: 2,
          color: "white",
        }}
      >
        <CheckCircle
          style={{ width: "3rem", height: "3rem", marginBottom: "1rem" }}
        />
        <Typography variant="h6" sx={{ mb: 1 }}>
          QR Code Detectado!
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Processando nota fiscal...
        </Typography>
        <CircularProgress size={24} sx={{ mt: 2, color: "white" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <Box sx={{ position: "relative" }}>
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "50vh",
            objectFit: "cover",
            borderRadius: "0.5rem",
            backgroundColor: "black",
          }}
          autoPlay
          muted
          playsInline
        />

        {/* QR Code guide overlay */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "200px",
            height: "200px",
            border: "3px solid rgba(255, 255, 255, 0.8)",
            borderRadius: 2,
            pointerEvents: "none",
          }}
        >
          {/* Corner markers */}
          <Box
            sx={{
              position: "absolute",
              top: -3,
              left: -3,
              width: 20,
              height: 20,
              borderTop: "4px solid #4CAF50",
              borderLeft: "4px solid #4CAF50",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 20,
              height: 20,
              borderTop: "4px solid #4CAF50",
              borderRight: "4px solid #4CAF50",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -3,
              left: -3,
              width: 20,
              height: 20,
              borderBottom: "4px solid #4CAF50",
              borderLeft: "4px solid #4CAF50",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -3,
              right: -3,
              width: 20,
              height: 20,
              borderBottom: "4px solid #4CAF50",
              borderRight: "4px solid #4CAF50",
            }}
          />
        </Box>

        {/* Scanning indicator */}
        {isScanning && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "180px",
              height: "2px",
              bgcolor: "#4CAF50",
              animation: "scan 2s ease-in-out infinite",
              "@keyframes scan": {
                "0%, 100%": { transform: "translate(-50%, -90px)" },
                "50%": { transform: "translate(-50%, 90px)" },
              },
            }}
          />
        )}

        {/* Status text */}
        <Box
          sx={{
            position: "absolute",
            bottom: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            bgcolor: "rgba(0, 0, 0, 0.7)",
            px: 2,
            py: 1,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <QrCode style={{ width: "1rem", height: "1rem", color: "white" }} />
          <Typography
            variant="body2"
            sx={{ color: "white", whiteSpace: "nowrap" }}
          >
            {scanningStatus}
          </Typography>
        </Box>

        {/* Switch camera button */}
        <Box sx={{ position: "absolute", top: "1rem", right: "1rem" }}>
          <Button
            size="small"
            variant="contained"
            sx={{
              minWidth: "2.5rem",
              width: "2.5rem",
              height: "2.5rem",
              p: 0,
              bgcolor: "rgba(0, 0, 0, 0.6)",
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.8)" },
            }}
            onClick={switchCamera}
          >
            <SwitchCamera
              style={{ width: "1rem", height: "1rem", color: "white" }}
            />
          </Button>
        </Box>
      </Box>

      {/* Option to switch to photo mode */}
      {onSwitchToPhoto && (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button variant="text" onClick={onSwitchToPhoto} size="small">
            Não é QR Code? Tirar foto da nota
          </Button>
        </Box>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Box>
  );
}
