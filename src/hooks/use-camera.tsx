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
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const {
    facingMode: initialFacing = "environment",
    // Alta resolução para captura de documentos
    width = 3840, // 4K
    height = 2160,
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

  const capture = useCallback(
    (quality: number = 1.0): string | null => {
      if (!videoRef.current || !isReady) return null;

      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement("canvas");

      // Usa a resolução real do vídeo para máxima qualidade
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d", {
        alpha: false, // Sem transparência = melhor performance
        desynchronized: true, // Melhor performance em alguns navegadores
      });
      if (!context) return null;

      // Configurações para melhor qualidade de renderização
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      // Desenha o frame atual
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Aplica leve aumento de contraste para melhorar legibilidade de texto
      // Isso ajuda com notas fiscais desbotadas ou com baixo contraste
      try {
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const data = imageData.data;
        const contrast = 1.1; // Leve aumento de contraste (10%)
        const factor =
          (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128)); // R
          data[i + 1] = Math.min(
            255,
            Math.max(0, factor * (data[i + 1] - 128) + 128)
          ); // G
          data[i + 2] = Math.min(
            255,
            Math.max(0, factor * (data[i + 2] - 128) + 128)
          ); // B
        }
        context.putImageData(imageData, 0, 0);
      } catch {
        // Se falhar o processamento de contraste, continua com a imagem original
      }

      // Retorna em PNG para melhor qualidade (sem compressão com perda)
      // ou JPEG com qualidade máxima para tamanho menor
      return canvas.toDataURL("image/jpeg", quality);
    },
    [isReady]
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
  };
}
