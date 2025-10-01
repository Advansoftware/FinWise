// src/components/camera/mobile-camera.tsx
"use client";

import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, SwitchCamera, FlashlightIcon as Flashlight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type CameraFacing = 'user' | 'environment';

interface MobileCameraProps {
  onCapture: (imageData: string) => void;
  onPermissionDenied?: () => void;
  className?: string;
}

export function MobileCamera({ onCapture, onPermissionDenied, className }: MobileCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<CameraFacing>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        track.stop();
      });
      setCurrentStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [currentStream]);

  const startCamera = useCallback(async (facing: CameraFacing = facingMode) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Parar câmera anterior
      stopCamera();

      // Verificar se câmera está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não disponível neste dispositivo');
      }

      // Constraints otimizadas para mobile
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920, min: 640, max: 1920 },
          height: { ideal: 1080, min: 480, max: 1080 },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      };

      console.log('Requesting camera with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!stream) {
        throw new Error('Não foi possível obter stream da câmera');
      }

      console.log('Camera stream obtained successfully');
      setCurrentStream(stream);
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Aguardar o metadata carregar
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('Video playing successfully');
              setIsLoading(false);
            }).catch((playError) => {
              console.error('Error playing video:', playError);
              setError('Erro ao inicializar câmera');
              setIsLoading(false);
            });
          }
        };

        // Timeout caso não carregue
        setTimeout(() => {
          if (isLoading) {
            setIsLoading(false);
          }
        }, 3000);
      }

      // Verificar se tem flash
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities();
        setHasFlash(!!(capabilities as any).torch);
      }

    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setIsLoading(false);
      setHasCameraPermission(false);
      
      if (error.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Verifique as configurações do seu navegador.');
        onPermissionDenied?.();
      } else if (error.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada neste dispositivo.');
      } else if (error.name === 'NotReadableError') {
        setError('Câmera está sendo usada por outro aplicativo.');
      } else {
        setError(error.message || 'Erro desconhecido ao acessar câmera');
      }
    }
  }, [facingMode, stopCamera, isLoading, onPermissionDenied]);

  const switchCamera = useCallback(async () => {
    const newFacing: CameraFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    await startCamera(newFacing);
  }, [facingMode, startCamera]);

  const toggleFlash = useCallback(async () => {
    if (currentStream && hasFlash) {
      const videoTrack = currentStream.getVideoTracks()[0];
      try {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      } catch (error) {
        console.error('Error toggling flash:', error);
      }
    }
  }, [currentStream, hasFlash, flashEnabled]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Definir dimensões do canvas baseadas no vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) return;

    // Desenhar frame atual do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Converter para data URL com qualidade otimizada
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    onCapture(imageData);
  }, [onCapture]);

  const retryCamera = useCallback(() => {
    startCamera();
  }, [startCamera]);

  // Inicializar câmera quando componente monta
  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <div className={cn("relative w-full h-[60vh] bg-black rounded-lg flex items-center justify-center", className)}>
        <div className="text-center text-white">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Iniciando câmera...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || hasCameraPermission === false) {
    return (
      <div className={cn("relative w-full h-[60vh] rounded-lg", className)}>
        <Alert variant="destructive" className="h-full flex flex-col justify-center">
          <AlertTitle>Erro na Câmera</AlertTitle>
          <AlertDescription className="mb-4">
            {error || 'Não foi possível acessar a câmera.'}
          </AlertDescription>
          <Button onClick={retryCamera} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <video 
          ref={videoRef} 
          className="w-full h-[60vh] object-cover rounded-lg bg-black" 
          autoPlay 
          muted 
          playsInline
          webkit-playsinline="true"
        />
        
        {/* Guide overlay */}
        <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-lg pointer-events-none">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black/60 px-2 py-1 rounded text-white text-xs whitespace-nowrap">
            Posicione a nota fiscal aqui
          </div>
        </div>
        
        {/* Camera controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {hasFlash && (
            <Button
              size="icon"
              variant="secondary"
              className={cn(
                "bg-black/60 hover:bg-black/80 border-0",
                flashEnabled && "bg-yellow-500/80 hover:bg-yellow-500"
              )}
              onClick={toggleFlash}
            >
              <Flashlight className="h-4 w-4 text-white" />
            </Button>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="bg-black/60 hover:bg-black/80 border-0"
            onClick={switchCamera}
          >
            <SwitchCamera className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
      
      {/* Capture button */}
      <div className="flex justify-center mt-6">
        <Button 
          onClick={capturePhoto}
          size="lg"
          className="h-16 w-16 rounded-full p-0 bg-white text-black hover:bg-gray-100"
        >
          <Camera className="h-8 w-8" />
        </Button>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}