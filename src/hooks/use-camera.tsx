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
    width = 1920,
    height = 1080,
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
        console.log("[useCamera] videoRef not ready yet, will retry");
        return false;
      }

      if (video.srcObject === stream) {
        console.log("[useCamera] Stream already assigned");
        return true;
      }

      console.log("[useCamera] Assigning stream to video element");
      video.srcObject = stream;

      const handleVideoReady = () => {
        console.log(
          "[useCamera] handleVideoReady called, readyState:",
          video.readyState
        );
        if (isReady) return; // Avoid duplicate calls

        video
          .play()
          .then(() => {
            console.log("[useCamera] Video playing successfully");
            setIsReady(true);
          })
          .catch((err) => {
            console.error("[useCamera] Error playing video:", err);
            // Try muted playback as fallback
            video.muted = true;
            video
              .play()
              .then(() => {
                console.log("[useCamera] Video playing muted");
                setIsReady(true);
              })
              .catch(console.error);
          });
      };

      // Clear old handlers
      video.onloadedmetadata = null;
      video.onloadeddata = null;
      video.oncanplay = null;

      // Set up multiple event listeners for compatibility
      video.onloadedmetadata = () => {
        console.log("[useCamera] onloadedmetadata fired");
        handleVideoReady();
      };
      video.onloadeddata = () => {
        console.log("[useCamera] onloadeddata fired");
        handleVideoReady();
      };
      video.oncanplay = () => {
        console.log("[useCamera] oncanplay fired");
        handleVideoReady();
      };

      // Check if video already has data
      if (video.readyState >= 2) {
        console.log(
          "[useCamera] Video already has data, readyState:",
          video.readyState
        );
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
            width: { ideal: width, min: 640 },
            height: { ideal: height, min: 480 },
          },
        };

        console.log("[useCamera] Requesting camera access...");
        const newStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        console.log("[useCamera] Camera access granted, stream obtained");

        setStream(newStream);
        setHasPermission(true);

        // The useEffect will handle setting up the video element
        // This ensures it works even if videoRef isn't ready yet

        // Check for flash/torch capability
        const videoTrack = newStream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities?.() || {};
        setHasFlash((capabilities as any).torch === true);
      } catch (error) {
        console.error("[useCamera] Error accessing camera:", error);
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
