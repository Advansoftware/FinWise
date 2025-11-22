// src/components/camera/mobile-camera.tsx
"use client";

import {useRef, useState, useCallback, useEffect} from 'react';
import { Button } from "@mui/material";
import { Alert, AlertDescription, AlertTitle } from "@mui/material";
import { Camera, SwitchCamera, FlashlightIcon as Flashlight, RefreshCw } from "lucide-react";
import {Box, type SxProps, type Theme} from '@mui/material';

type CameraFacing = 'user' | 'environment';

interface MobileCameraProps {
  onCapture: (imageData: string) => void;
  onPermissionDenied?: () => void;
  sx?: SxProps<Theme>;
}

export function MobileCamera({ onCapture, onPermissionDenied, sx }: MobileCameraProps) {
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
      <Box sx={{ position: 'relative', width: '100%', height: '60vh', bgcolor: 'black', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', ...sx }}>
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <RefreshCw style={{ width: '2rem', height: '2rem', margin: '0 auto 0.5rem', animation: 'spin 1s linear infinite' }} />
          <p>Iniciando câmera...</p>
        </Box>
      </Box>
    );
  }

  // Render error state
  if (error || hasCameraPermission === false) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '60vh', borderRadius: 2, ...sx }}>
        <Alert variant="contained" color="error" sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <AlertTitle>Erro na Câmera</AlertTitle>
          <AlertDescription sx={{ mb: 4 }}>
            {error || 'Não foi possível acessar a câmera.'}
          </AlertDescription>
          <Button onClick={retryCamera} variant="outlined" size="small">
            <RefreshCw style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Tentar Novamente
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', ...sx }}>
      <Box sx={{ position: 'relative' }}>
        <video 
          ref={videoRef} 
          style={{ width: '100%', height: '60vh', objectFit: 'cover', borderRadius: '0.5rem', backgroundColor: 'black' }}
          autoPlay 
          muted 
          playsInline
          webkit-playsinline="true"
        />
        
        {/* Guide overlay */}
        <Box sx={{ position: 'absolute', inset: '1rem', border: '2px dashed rgba(255, 255, 255, 0.6)', borderRadius: 2, pointerEvents: 'none' }}>
          <Box sx={{ position: 'absolute', top: '-0.75rem', left: '50%', transform: 'translateX(-50%)', bgcolor: 'rgba(0, 0, 0, 0.6)', px: 2, py: 1, borderRadius: 1, color: 'white', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
            Posicione a nota fiscal aqui
          </Box>
        </Box>
        
        {/* Camera controls */}
        <Box sx={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {hasFlash && (
            <Button
              size="icon"
              variant="contained" color="secondary"
              sx={{
                bgcolor: flashEnabled ? 'rgba(234, 179, 8, 0.8)' : 'rgba(0, 0, 0, 0.6)',
                '&:hover': {
                  bgcolor: flashEnabled ? 'rgba(234, 179, 8, 1)' : 'rgba(0, 0, 0, 0.8)'
                },
                border: 0
              }}
              onClick={toggleFlash}
            >
              <Flashlight style={{ width: '1rem', height: '1rem', color: 'white' }} />
            </Button>
          )}
          <Button
            size="icon"
            variant="contained" color="secondary"
            sx={{
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.8)'
              },
              border: 0
            }}
            onClick={switchCamera}
          >
            <SwitchCamera style={{ width: '1rem', height: '1rem', color: 'white' }} />
          </Button>
        </Box>
      </Box>
      
      {/* Capture button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <Button 
          onClick={capturePhoto}
          size="large"
          sx={{
            height: '4rem',
            width: '4rem',
            borderRadius: '9999px',
            p: 0,
            bgcolor: 'white',
            color: 'black',
            '&:hover': {
              bgcolor: '#f3f4f6'
            }
          }}
        >
          <Camera style={{ width: '2rem', height: '2rem' }} />
        </Button>
      </Box>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  );
}