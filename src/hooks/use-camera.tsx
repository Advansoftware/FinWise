// src/hooks/use-camera.tsx
"use client";

import { useRef, useState, useCallback } from "react";
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
    width = 1920,
    height = 1080,
  } = options;
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    initialFacing
  );

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
            width: { ideal: width, min: 640 },
            height: { ideal: height, min: 480 },
          },
        };

        const newStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        setStream(newStream);
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              ?.play()
              .then(() => setIsReady(true))
              .catch(console.error);
          };
        }

        // Check for flash/torch capability
        const videoTrack = newStream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();
        setHasFlash((capabilities as any).torch === true);
      } catch (error) {
        console.error("Error accessing camera:", error);
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
    (quality: number = 0.9): string | null => {
      if (!videoRef.current || !isReady) return null;

      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) return null;

      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
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
