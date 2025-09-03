
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
import { Loader2, Upload, Camera, Paperclip } from "lucide-react";
import { useRef, useState, useEffect, useCallback, useTransition } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { extractReceiptInfoAction } from "@/app/actions";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useTransactions } from "@/hooks/use-transactions";
import { Transaction } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";


export function ScanQRCodeDialog({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [receiptImage, setReceiptImage] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [isProcessing, startProcessing] = useTransition();
    const [isSaving, startSaving] = useTransition();
    const { addTransaction } = useTransactions();
    const { user } = useAuth();

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }, []);
    
    const resetState = useCallback(() => {
        stopCamera();
        setReceiptImage(null);
        setExtractedData(null);
        setHasCameraPermission(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
    }, [stopCamera]);


    const handleDialogOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            resetState();
        }
    };

    useEffect(() => {
        if (isMobile && isDialogOpen && !receiptImage) {
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
                }
            };
            getCameraPermission();
        }
        return () => {
           if(!isDialogOpen) {
               stopCamera();
           }
        }
    }, [isMobile, isDialogOpen, stopCamera, receiptImage]);

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
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext('2d');
            if(context) {
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setReceiptImage(dataUrl);
                stopCamera();
                processImage(dataUrl);
            }
        }
    };

    const processImage = async (imageData: string) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação', description: 'Você precisa estar logado.'});
            return;
        }
        setExtractedData(null);
        startProcessing(async () => {
            try {
                const result = await extractReceiptInfoAction({ photoDataUri: imageData }, user.uid);
                setExtractedData(result);
                if (!result.isValid) {
                     toast({
                        variant: 'destructive',
                        title: 'Nota Inválida',
                        description: 'A imagem não parece ser uma nota fiscal válida. Tente outra imagem.',
                    });
                }
            } catch (error: any) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Erro ao Processar',
                    description: error.message || 'Não foi possível extrair as informações da imagem. Verifique suas configurações de IA.',
                });
                 // Se o erro foi de limite de uso, não resetar para o usuário ver a msg
                if (!error.message?.includes('limite mensal')) {
                    resetState();
                }
            }
        });
    };

    const handleSaveTransactions = () => {
        if (!extractedData || !extractedData.items || extractedData.items.length === 0) return;
        
        startSaving(async () => {
            try {
                const transactionPromises = extractedData.items.map((item: any) => {
                     const newTransaction: Omit<Transaction, 'id'> = {
                        item: item.item,
                        amount: parseFloat(item.amount),
                        date: extractedData.date ? new Date(extractedData.date).toISOString() : new Date().toISOString(),
                        category: "Supermercado", // Categoria padrão
                        type: "expense",
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
                    variant: 'destructive',
                    title: 'Erro ao Salvar',
                    description: 'Não foi possível salvar as transações. Verifique se você tem uma carteira criada.',
                });
            }
        });
    }
    
    const renderExtractedData = () => {
        if (!extractedData) return null;
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Itens Extraídos</h3>
                     <Badge variant={extractedData.isValid ? 'default' : 'destructive'} className={extractedData.isValid ? "bg-green-500/20 text-green-300 border-green-500/30" : ""}>
                        {extractedData.isValid ? 'Nota Válida' : 'Nota Inválida'}
                    </Badge>
                </div>
                {extractedData.items?.map((item: any, index: number) => (
                    <div key={index} className="grid grid-cols-3 gap-2 items-center p-2 rounded-md bg-muted/50">
                        <Input className="col-span-2" defaultValue={item.item} placeholder="Item"/>
                        <Input type="number" step="0.01" defaultValue={item.amount} placeholder="Valor"/>
                    </div>
                ))}
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <Label>Total</Label>
                        <Input type="number" step="0.01" defaultValue={extractedData.totalAmount} placeholder="Total" />
                     </div>
                      <div className="space-y-1">
                        <Label>Data</Label>
                        <Input type="date" defaultValue={extractedData.date} placeholder="Data" />
                     </div>
                </div>
            </div>
        )
    };
    
    const renderProcessingSkeleton = () => (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    )

    return (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Escanear Nota Fiscal</DialogTitle>
                    <DialogDescription>
                        {isMobile
                            ? "Aponte a câmera para a nota fiscal ou envie uma imagem da galeria."
                            : "Faça upload da imagem (PDF, PNG, JPG) da nota fiscal para adicionar as transações."
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {!receiptImage ? (
                        <>
                            {isMobile ? (
                                <div className="flex flex-col items-center justify-center w-full space-y-4">
                                    <div className="relative w-full">
                                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                                        {hasCameraPermission && <div className="absolute inset-0 border-4 border-dashed border-primary/50 rounded-md m-4"></div>}
                                    </div>
                                    {hasCameraPermission === false && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                                            <AlertDescription>
                                                Permita o acesso à câmera para usar este recurso.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    <div className="w-full flex items-center gap-2">
                                        <div className="h-px flex-1 bg-border"/>
                                        <span className="text-xs text-muted-foreground">OU</span>
                                        <div className="h-px flex-1 bg-border"/>
                                    </div>
                                    <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                        <Paperclip className="mr-2 h-4 w-4" /> Enviar da Galeria
                                    </Button>
                                    <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-primary/30 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-4 text-primary" />
                                            <p className="mb-2 text-sm text-foreground"><span className="font-semibold text-primary">Clique para enviar</span> ou arraste e solte</p>
                                            <p className="text-xs text-muted-foreground">PDF, PNG, ou JPG</p>
                                        </div>
                                        <input ref={fileInputRef} id="dropzone-file" type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <img src={receiptImage} alt="Pré-visualização da nota" className="rounded-md max-h-60 w-auto mx-auto" />
                            {isProcessing ? renderProcessingSkeleton() : renderExtractedData()}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 sm:justify-between w-full">
                    <div>
                         {receiptImage && (
                            <Button variant="ghost" onClick={resetState} disabled={isProcessing || isSaving}>
                                Enviar Outra
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {isMobile && !receiptImage ? (
                            <Button onClick={handleCapture} disabled={hasCameraPermission === false || isProcessing || isSaving}>
                               <Camera className="mr-2 h-4 w-4"/> Capturar
                            </Button>
                        ) : extractedData?.isValid ? (
                             <Button onClick={handleSaveTransactions} disabled={isSaving || isProcessing}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Transações
                            </Button>
                        ) : null}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
