// src/components/dashboard/scan-qr-code-dialog.tsx
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload, Camera, Paperclip, Sparkles, BrainCircuit, Info, RotateCcw, FlashlightIcon as Flashlight, SwitchCamera } from "lucide-react";
import { useRef, useState, useEffect, useCallback, useTransition } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { extractReceiptInfoAction } from "@/services/ai-actions";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useTransactions } from "@/hooks/use-transactions";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { usePlan } from "@/hooks/use-plan";
import { useAISettings } from "@/hooks/use-ai-settings";
import { getVisionCapableModels, DEFAULT_AI_CREDENTIAL } from "@/lib/ai-settings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "@/lib/utils";


export function ScanQRCodeDialog({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [receiptImage, setReceiptImage] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [isProcessing, startProcessing] = useTransition();
    const [isSaving, startSaving] = useTransition();
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [hasFlash, setHasFlash] = useState(false);
    const [flashEnabled, setFlashEnabled] = useState(false);
    const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
    const { addTransaction } = useTransactions();
    const { user } = useAuth();
    const { wallets } = useWallets();
    const { isPlus } = usePlan();
    const { displayedCredentials, activeCredentialId } = useAISettings();
    
    // Filtrar apenas modelos com suporte a visão/imagem
    const visionCapableCredentials = [
        DEFAULT_AI_CREDENTIAL, // Sempre incluir o Gastometria IA padrão
        ...getVisionCapableModels(displayedCredentials.filter(c => c.id !== 'gastometria-ai-default'))
    ];
    
    const [selectedAI, setSelectedAI] = useState(activeCredentialId || DEFAULT_AI_CREDENTIAL.id);

    const canSelectProvider = isPlus; // Plus e Infinity podem selecionar
    const selectedCredential = visionCapableCredentials.find(c => c.id === selectedAI);
    const isOllamaSelected = selectedCredential?.provider === 'ollama';

    const stopCamera = useCallback(() => {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            setCurrentStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, [currentStream]);

    const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
        try {
            stopCamera();
            
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: facing,
                    width: { ideal: 1920, min: 640 },
                    height: { ideal: 1080, min: 480 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setCurrentStream(stream);
            setHasCameraPermission(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                
                // Aguardar o vídeo carregar antes de exibir
                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current) {
                        videoRef.current.play().catch(console.error);
                    }
                };
            }

            // Check if flash is available
            const videoTrack = stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            setHasFlash((capabilities as any).torch === true);

        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
                variant: 'destructive',
                title: 'Erro de Câmera',
                description: 'Não foi possível acessar a câmera. Verifique as permissões.',
            });
        }
    }, [facingMode, stopCamera, toast]);

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

    const switchCamera = useCallback(async () => {
        const newFacing = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newFacing);
        await startCamera(newFacing);
    }, [facingMode, startCamera]);
    
    const resetState = useCallback(() => {
        stopCamera();
        setReceiptImage(null);
        setExtractedData(null);
        setHasCameraPermission(null);
        setFlashEnabled(false);
        setFacingMode('environment');
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
           if(!isDialogOpen) {
               stopCamera();
           }
        }
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
            const canvas = canvasRef.current || document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext('2d');
            if(context) {
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setReceiptImage(dataUrl);
                stopCamera();
                processImage(dataUrl);
                
                // Feedback visual
                toast({
                    title: "Foto Capturada!",
                    description: "Processando a nota fiscal...",
                });
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
                const result = await extractReceiptInfoAction({ photoDataUri: imageData }, user.uid, selectedAI);
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
                if (!error.message?.includes('limite')) {
                    resetState();
                }
            }
        });
    };

    const renderProcessingSkeleton = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
            </div>
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-10 col-span-2" />
                    <Skeleton className="h-10" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-10 col-span-2" />
                    <Skeleton className="h-10" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-10 col-span-2" />
                    <Skeleton className="h-10" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
            </div>
            <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analisando nota fiscal...</span>
                </div>
            </div>
        </div>
    );
    
    const handleSaveTransactions = () => {
        if (!extractedData || !extractedData.items || extractedData.items.length === 0) return;
        
        startSaving(async () => {
            try {
                const transactionPromises = extractedData.items.map((item: any) => {
                     const newTransaction: Omit<Transaction, 'id'> = {
                        userId: user?.uid || '',
                        item: item.item,
                        amount: parseFloat(item.amount),
                        date: extractedData.date ? new Date(extractedData.date).toISOString() : new Date().toISOString(),
                        category: "Supermercado" as TransactionCategory,
                        type: "expense",
                        walletId: wallets[0]?.id || '',
                        quantity: 1,
                        establishment: '',
                        subcategory: ''
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
                    <h3 className="font-semibold text-lg">Itens Extraídos</h3>
                     <Badge variant={extractedData.isValid ? 'default' : 'destructive'} className={extractedData.isValid ? "bg-green-500/20 text-green-300 border-green-500/30" : ""}>
                        {extractedData.isValid ? 'Nota Válida' : 'Nota Inválida'}
                    </Badge>
                </div>
                
                {extractedData.items?.length > 0 ? (
                    <div className="space-y-3">
                        {extractedData.items?.map((item: any, index: number) => (
                            <div key={index} className="grid grid-cols-3 gap-2 items-center p-3 rounded-lg bg-muted/50 border">
                                <Input 
                                    className="col-span-2" 
                                    defaultValue={item.item} 
                                    placeholder="Item"
                                    readOnly={!extractedData.isValid}
                                />
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    defaultValue={item.amount} 
                                    placeholder="Valor"
                                    readOnly={!extractedData.isValid}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Nenhum item foi encontrado na nota.</p>
                        <p className="text-sm">Tente uma imagem com melhor qualidade.</p>
                    </div>
                )}
                
                 <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/30 border">
                     <div className="space-y-1">
                        <Label className="text-sm font-medium">Total</Label>
                        <Input 
                            type="number" 
                            step="0.01" 
                            defaultValue={extractedData.totalAmount || 0} 
                            placeholder="Total" 
                            readOnly={!extractedData.isValid}
                        />
                     </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Data</Label>
                        <Input 
                            type="date" 
                            defaultValue={extractedData.date} 
                            placeholder="Data" 
                            readOnly={!extractedData.isValid}
                        />
                     </div>
                </div>
                
                {!extractedData.isValid && (
                    <Alert variant="destructive">
                        <AlertTitle>Nota Não Reconhecida</AlertTitle>
                        <AlertDescription>
                            A IA não conseguiu identificar esta como uma nota fiscal válida. 
                            Certifique-se de que a imagem esteja nítida e bem iluminada.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        )
    };

    // Component content for both mobile and desktop
    const renderContent = () => (
        <>
            <div className="space-y-4">
                {!receiptImage && (
                    <div className="space-y-2">
                        <Label htmlFor="ai-provider">Provedor de IA</Label>
                        <Select 
                            value={selectedAI} 
                            onValueChange={setSelectedAI}
                            disabled={!canSelectProvider}
                        >
                            <SelectTrigger id="ai-provider">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {visionCapableCredentials.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                        {c.id === DEFAULT_AI_CREDENTIAL.id && (
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">Padrão</span>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        {!canSelectProvider && (
                            <Alert variant="default" className="border-blue-500/50 text-blue-200">
                                <Sparkles className="h-4 w-4 !text-blue-400" />
                                <AlertTitle>Gastometria IA</AlertTitle>
                                <AlertDescription>
                                    Usando modelo padrão otimizado para análise de recibos. Faça upgrade para Plus ou Infinity para escolher outros modelos.
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        {isOllamaSelected && (
                             <Alert variant="default" className="border-amber-500/50 text-amber-200">
                                <Info className="h-4 w-4 !text-amber-400" />
                                <AlertTitle>Aviso: Modelo Local com Visão</AlertTitle>
                                <AlertDescription>
                                    Modelos locais (Ollama) com visão podem ter menor precisão e segurança na leitura de recibos. 
                                    Recomendamos usar o Gastometria IA para melhores resultados.
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        {visionCapableCredentials.length === 1 && canSelectProvider && (
                            <Alert variant="default" className="border-green-500/50 text-green-200">
                                <BrainCircuit className="h-4 w-4 !text-green-400" />
                                <AlertTitle>Modelo com Suporte a Visão</AlertTitle>
                                <AlertDescription>
                                    Apenas modelos com capacidade de processamento de imagem estão disponíveis.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
                
                {!receiptImage ? (
                    <>
                        {isMobile ? (
                            <div className="flex flex-col items-center justify-center w-full space-y-4">
                                <div className="relative w-full">
                                    <video 
                                        ref={videoRef} 
                                        className="w-full h-[60vh] object-cover rounded-lg" 
                                        autoPlay 
                                        muted 
                                        playsInline 
                                        style={{ backgroundColor: '#000' }}
                                    />
                                    {/* Camera overlay */}
                                    <div className="absolute inset-0">
                                        {/* Guide overlay */}
                                        <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-lg">
                                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black/60 px-2 py-1 rounded text-white text-xs">
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
                                </div>
                                
                                {hasCameraPermission === false && (
                                    <Alert variant="destructive">
                                        <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                                        <AlertDescription>
                                            Permita o acesso à câmera para usar este recurso ou use a opção "Enviar da Galeria".
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
                        <div className="relative">
                            <img src={receiptImage} alt="Pré-visualização da nota" className="rounded-lg max-h-60 w-full object-cover" />
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80"
                                onClick={resetState}
                                disabled={isProcessing || isSaving}
                            >
                                <RotateCcw className="h-4 w-4 text-white" />
                            </Button>
                        </div>
                        {isProcessing ? renderProcessingSkeleton() : renderExtractedData()}
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </>
    );

    if (isMobile) {
        return (
            <Sheet open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <SheetTrigger asChild>{children}</SheetTrigger>
                <SheetContent side="bottom" className="h-[95vh] flex flex-col">
                    <SheetHeader className="text-left">
                        <SheetTitle>Escanear Nota Fiscal</SheetTitle>
                        <SheetDescription>
                            Aponte a câmera para a nota fiscal ou envie uma imagem da galeria.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto">
                        {renderContent()}
                    </div>

                    <SheetFooter className="flex-row justify-between gap-2 pt-4">
                        {receiptImage ? (
                            <>
                                <Button variant="ghost" onClick={resetState} disabled={isProcessing || isSaving}>
                                    Nova Foto
                                </Button>
                                {extractedData?.isValid && (
                                    <Button onClick={handleSaveTransactions} disabled={isSaving || isProcessing} className="flex-1">
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Salvar {extractedData.items?.length || 0} Itens
                                    </Button>
                                )}
                            </>
                        ) : (
                            <Button 
                                onClick={handleCapture} 
                                disabled={hasCameraPermission === false || isProcessing || isSaving}
                                className="w-full h-12 text-lg"
                                size="lg"
                            >
                               <Camera className="mr-2 h-5 w-5"/> Capturar Nota
                            </Button>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Escanear Nota Fiscal</DialogTitle>
                    <DialogDescription>
                        Faça upload da imagem (PDF, PNG, JPG) da nota fiscal para adicionar as transações.
                    </DialogDescription>
                </DialogHeader>

                {renderContent()}

                <DialogFooter className="gap-2 sm:gap-0 sm:justify-between w-full">
                    <div>
                         {receiptImage && (
                            <Button variant="ghost" onClick={resetState} disabled={isProcessing || isSaving}>
                                Enviar Outra
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {extractedData?.isValid && (
                             <Button onClick={handleSaveTransactions} disabled={isSaving || isProcessing}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Transações
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
