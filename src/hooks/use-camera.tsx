// src/hooks/use-camera.tsx
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseCameraOptions {
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  stream: MediaStream | null;
  isReady: boolean;
  hasPermission: boolean | null;
  hasFlash: boolean;
  flashEnabled: boolean;
  facingMode: "user" | "environment";
  start: (facing?: "user" | "environment") => Promise<void>;
  stop: () => void;
  capture: (quality?: number) => string | null;
  toggleFlash: () => Promise<void>;
  switchCamera: () => Promise<void>;
  /** Detecta QR codes em uma imagem base64 e retorna a URL ou null */
  detectQRCode: (imageData: string) => Promise<string | null>;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const {
    facingMode: initialFacing = "environment",
    // Full HD é suficiente para OCR e mantém arquivo menor
    width = 1920,
    height = 1440, // 4:3 aspect ratio para documentos
  } = options;
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    initialFacing
  );

  // Setup video element when stream is available
  // This useEffect ensures video is configured even if videoRef wasn't ready during start()
  useEffect(() => {
    if (!stream) return;

    const setupVideo = () => {
      const video = videoRef.current;
      if (!video) {
        return false;
      }

      if (video.srcObject === stream) {
        return true;
      }

      video.srcObject = stream;

      const handleVideoReady = () => {
        if (isReady) return;

        video
          .play()
          .then(() => {
            setIsReady(true);
          })
          .catch(() => {
            video.muted = true;
            video
              .play()
              .then(() => {
                setIsReady(true);
              })
              .catch(() => {});
          });
      };

      // Clear old handlers
      video.onloadedmetadata = null;
      video.onloadeddata = null;
      video.oncanplay = null;

      // Set up multiple event listeners for compatibility
      video.onloadedmetadata = handleVideoReady;
      video.onloadeddata = handleVideoReady;
      video.oncanplay = handleVideoReady;

      // Check if video already has data
      if (video.readyState >= 2) {
        handleVideoReady();
      }

      return true;
    };

    // Try immediately
    if (!setupVideo()) {
      // If videoRef not ready, retry with a small delay
      const retryTimeout = setTimeout(setupVideo, 100);
      return () => clearTimeout(retryTimeout);
    }
  }, [stream, isReady]);

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, [stream]);

  const start = useCallback(
    async (facing: "user" | "environment" = facingMode) => {
      try {
        // Stop existing stream first
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setIsReady(false);
        setFacingMode(facing);

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: facing,
            // Resolução máxima disponível
            width: { ideal: width, min: 1280 },
            height: { ideal: height, min: 720 },
            // Otimizações para captura de documentos
            aspectRatio: { ideal: 4 / 3 }, // Melhor para documentos
            frameRate: { ideal: 30, max: 60 },
            // Configurações avançadas para qualidade
            ...({
              focusMode: { ideal: "continuous" }, // Foco automático contínuo
              exposureMode: { ideal: "continuous" }, // Exposição automática
              whiteBalanceMode: { ideal: "continuous" }, // Balanço de branco automático
              zoom: { ideal: 1 }, // Sem zoom para evitar distorção
              resizeMode: "none", // Sem redimensionamento pelo navegador
            } as any),
          },
        };

        const newStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );

        setStream(newStream);
        setHasPermission(true);

        // The useEffect will handle setting up the video element
        // This ensures it works even if videoRef isn't ready yet

        // Check for flash/torch capability
        const videoTrack = newStream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities?.() || {};
        setHasFlash((capabilities as any).torch === true);
      } catch (error) {
        setHasPermission(false);
        toast({
          variant: "error",
          title: "Erro de Câmera",
          description:
            "Não foi possível acessar a câmera. Verifique as permissões.",
        });
      }
    },
    [facingMode, stream, width, height, toast]
  );

  // Funções auxiliares para processamento de imagem otimizado para OCR
  const enhanceImageForOCR = useCallback(
    (
      context: CanvasRenderingContext2D,
      width: number,
      height: number
    ): void => {
      const imageData = context.getImageData(0, 0, width, height);
      const data = imageData.data;

      // 1. Converter para escala de cinza com pesos otimizados para texto
      // Usa pesos ITU-R BT.601 que preservam melhor o contraste de texto
      const grayscale = new Uint8ClampedArray(width * height);
      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        grayscale[j] =
          data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      }

      // 2. Calcular histograma para ajuste automático de níveis
      const histogram = new Array(256).fill(0);
      for (let i = 0; i < grayscale.length; i++) {
        histogram[Math.floor(grayscale[i])]++;
      }

      // 3. Encontrar limites para stretching de contraste (ignora 1% extremos)
      const totalPixels = width * height;
      const clipLimit = totalPixels * 0.01;
      let minLevel = 0,
        maxLevel = 255;
      let cumSum = 0;

      for (let i = 0; i < 256; i++) {
        cumSum += histogram[i];
        if (cumSum > clipLimit) {
          minLevel = i;
          break;
        }
      }
      cumSum = 0;
      for (let i = 255; i >= 0; i--) {
        cumSum += histogram[i];
        if (cumSum > clipLimit) {
          maxLevel = i;
          break;
        }
      }

      // 4. Aplicar stretching de contraste e aumento de nitidez
      const range = maxLevel - minLevel || 1;
      const contrast = 1.15; // 15% de aumento de contraste
      const brightness = 5; // Leve aumento de brilho

      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        // Normaliza o valor de cinza
        let value = grayscale[j];

        // Stretching de contraste (auto-levels)
        value = ((value - minLevel) * 255) / range;

        // Aplica contraste adicional
        value = (value - 128) * contrast + 128 + brightness;

        // Aplica curva S suave para melhorar separação texto/fundo
        // Isso escurece os escuros e clareia os claros
        value = value / 255;
        value = value * value * (3 - 2 * value); // Smoothstep
        value = value * 255;

        // Clamp e aplica de volta (mantém cor original levemente para contexto)
        value = Math.min(255, Math.max(0, value));

        // Mistura 85% processado + 15% original para manter alguma informação de cor
        data[i] = value * 0.85 + data[i] * 0.15;
        data[i + 1] = value * 0.85 + data[i + 1] * 0.15;
        data[i + 2] = value * 0.85 + data[i + 2] * 0.15;
      }

      // 5. Aplica sharpening (unsharp mask simplificado)
      // Cria cópia para o kernel de sharpening
      const sharpened = new Uint8ClampedArray(data);
      const sharpenAmount = 0.3; // Intensidade do sharpening

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;

          for (let c = 0; c < 3; c++) {
            // Kernel de sharpening 3x3
            const center = data[idx + c] * 5;
            const neighbors =
              data[idx - width * 4 + c] + // top
              data[idx + width * 4 + c] + // bottom
              data[idx - 4 + c] + // left
              data[idx + 4 + c]; // right

            const sharpValue = center - neighbors;
            sharpened[idx + c] = Math.min(
              255,
              Math.max(0, data[idx + c] + sharpValue * sharpenAmount)
            );
          }
        }
      }

      // Copia resultado de volta
      for (let i = 0; i < data.length; i++) {
        data[i] = sharpened[i];
      }

      context.putImageData(imageData, 0, 0);
    },
    []
  );

  const capture = useCallback(
    (quality: number = 1.0): string | null => {
      if (!videoRef.current || !isReady) return null;

      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement("canvas");

      // Usa a resolução real do vídeo para máxima qualidade
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d", {
        alpha: false,
        willReadFrequently: true, // Otimiza para leitura frequente de pixels
      });
      if (!context) return null;

      // Desabilita smoothing para manter nitidez do texto
      context.imageSmoothingEnabled = false;

      // Desenha o frame atual
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Aplica processamento otimizado para OCR de texto
      try {
        enhanceImageForOCR(context, canvas.width, canvas.height);
      } catch {
        // Se falhar, continua com a imagem original
      }

      // JPEG com qualidade 92% - bom equilíbrio entre qualidade e tamanho
      // Para OCR, a qualidade ainda é excelente e o arquivo fica ~10x menor que PNG
      return canvas.toDataURL("image/jpeg", quality);
    },
    [isReady, enhanceImageForOCR]
  );

  const toggleFlash = useCallback(async () => {
    if (!stream || !hasFlash) return;

    const videoTrack = stream.getVideoTracks()[0];
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: !flashEnabled } as any],
      });
      setFlashEnabled((prev) => !prev);
    } catch (error) {
      console.error("Error toggling flash:", error);
    }
  }, [stream, hasFlash, flashEnabled]);

  const switchCamera = useCallback(async () => {
    const newFacing = facingMode === "environment" ? "user" : "environment";
    await start(newFacing);
  }, [facingMode, start]);

  /**
   * Detecta QR codes em uma imagem base64 usando BarcodeDetector API
   * @param imageData - Imagem em base64 (data:image/...)
   * @returns URL do QR code detectado ou null
   */
  const detectQRCode = useCallback(async (imageData: string): Promise<string | null> => {
    try {
      // Verificar se BarcodeDetector API está disponível
      if (!("BarcodeDetector" in window)) {
        console.log("BarcodeDetector API não disponível neste navegador");
        return null;
      }

      // Criar detector de QR codes
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ["qr_code"],
      });

      // Criar imagem a partir do base64
      const img = new Image();
      
      const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
      
      img.src = imageData;
      await loadPromise;

      // Detectar QR codes na imagem
      const barcodes = await barcodeDetector.detect(img);

      if (barcodes.length > 0) {
        const rawValue = barcodes[0].rawValue;
        console.log("QR Code detectado:", rawValue);
        return rawValue;
      }

      return null;
    } catch (error) {
      console.error("Erro ao detectar QR Code:", error);
      return null;
    }
  }, []);

  return {
    videoRef,
    canvasRef,
    stream,
    isReady,
    hasPermission,
    hasFlash,
    flashEnabled,
    facingMode,
    start,
    stop,
    capture,
    toggleFlash,
    switchCamera,
    detectQRCode,
  };
}
