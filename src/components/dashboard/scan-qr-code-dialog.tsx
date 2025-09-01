"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload } from "lucide-react";
import { useRef, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export function ScanQRCodeDialog({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

    useEffect(() => {
        if (isMobile) {
            const getCameraPermission = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    setHasCameraPermission(true);

                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (error) {
                    console.error('Error accessing camera:', error);
                    setHasCameraPermission(false);
                    toast({
                        variant: 'destructive',
                        title: 'Acesso à Câmera Negado',
                        description: 'Por favor, habilite as permissões de câmera nas configurações do seu navegador para usar este aplicativo.',
                    });
                }
            };

            getCameraPermission();
            
            return () => {
                if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                }
            }
        }
    }, [isMobile, toast]);


  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Escanear QR Code da Fatura</DialogTitle>
          <DialogDescription>
            {isMobile 
                ? "Aponte a câmera para o QR code da sua fatura."
                : "Faça o upload da imagem do QR code da sua fatura para adicionar a transação automaticamente."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            {isMobile ? (
                <div className="flex flex-col items-center justify-center w-full">
                    <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                    {hasCameraPermission === false && (
                         <div className="mt-4 w-full">
                            <Alert variant="destructive">
                                <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                                <AlertDescription>
                                    Por favor, permita o acesso à câmera para usar este recurso.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, ou GIF</p>
                        </div>
                        <input id="dropzone-file" type="file" className="hidden" />
                    </label>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button type="submit">{isMobile ? 'Escanear' : 'Enviar e Escanear'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
