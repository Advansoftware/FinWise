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
} from "@mui/material";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@mui/material";
import { Button } from "@mui/material";
import { Alert, AlertDescription, AlertTitle } from "@mui/material";
import { Loader2, Upload, Camera, Paperclip, Sparkles, BrainCircuit, Info, RotateCcw, FlashlightIcon as Flashlight, SwitchCamera } from "lucide-react";
import {useRef, useState, useEffect, useCallback, useTransition} from 'react';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { extractReceiptInfoAction } from "@/services/ai-actions";
import { Skeleton } from "../ui/skeleton";
import {Chip, Typography} from '@mui/material';
import {TextField} from '@mui/material';
import {InputLabel} from '@mui/material';
import { useTransactions } from "@/hooks/use-transactions";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { usePlan } from "@/hooks/use-plan";
import { useAISettings } from "@/hooks/use-ai-settings";
import { getVisionCapableModels, DEFAULT_AI_CREDENTIAL } from "@/lib/ai-settings";
import {Select, SelectContent, MenuItem, SelectTrigger, SelectValue} from '@mui/material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "@/lib/utils";
import {Box, Stack, Typography, useTheme, alpha} from '@mui/material';


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
    const theme = useTheme();
    
    // Filtrar apenas modelos com suporte a visão/imagem
    const visionCapableCredentials = getVisionCapableModels(displayedCredentials);
    
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
        <Stack spacing={4}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
            </Stack>
            <Stack spacing={3}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    <Skeleton className="h-10 col-span-2" style={{ gridColumn: 'span 2' }} />
                    <Skeleton className="h-10" />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    <Skeleton className="h-10 col-span-2" style={{ gridColumn: 'span 2' }} />
                    <Skeleton className="h-10" />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    <Skeleton className="h-10 col-span-2" style={{ gridColumn: 'span 2' }} />
                    <Skeleton className="h-10" />
                </Box>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
            </Box>
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
                    <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                    <Typography variant="body2">Analisando nota fiscal...</Typography>
                </Box>
            </Box>
        </Stack>
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
            <Stack spacing={4}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight="semibold">Itens Extraídos</Typography>
                     <Chip variant={extractedData.isValid ? 'default' : 'destructive'} className={extractedData.isValid ? "bg-green-500/20 text-green-300 border-green-500/30" : ""}>
                        {extractedData.isValid ? 'Nota Válida' : 'Nota Inválida'}
                    </Chip>
                </Stack>
                
                {extractedData.items?.length > 0 ? (
                    <Stack spacing={3}>
                        {extractedData.items?.map((item: any, index: number) => (
                            <Box key={index} sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, alignItems: 'center', p: 3, borderRadius: 1, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
                                <TextField 
                                    className="col-span-2" 
                                    style={{ gridColumn: 'span 2' }}
                                    defaultValue={item.item} 
                                    placeholder="Item"
                                    readOnly={!extractedData.isValid}
                                />
                                <TextField 
                                    type="number" 
                                    step="0.01" 
                                    defaultValue={item.amount} 
                                    placeholder="Valor"
                                    readOnly={!extractedData.isValid}
                                />
                            </Box>
                        ))}
                    </Stack>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                        <Typography>Nenhum item foi encontrado na nota.</Typography>
                        <Typography variant="caption">Tente uma imagem com melhor qualidade.</Typography>
                    </Box>
                )}
                
                 <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, p: 3, borderRadius: 1, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
                     <Stack spacing={1}>
                        <Label className="text-sm font-medium">Total</Label>
                        <TextField 
                            type="number" 
                            step="0.01" 
                            defaultValue={extractedData.totalAmount || 0} 
                            placeholder="Total" 
                            readOnly={!extractedData.isValid}
                        />
                     </Stack>
                      <Stack spacing={1}>
                        <Label className="text-sm font-medium">Data</Label>
                        <TextField 
                            type="date" 
                            defaultValue={extractedData.date} 
                            placeholder="Data" 
                            readOnly={!extractedData.isValid}
                        />
                     </Stack>
                </Box>
                
                {!extractedData.isValid && (
                    <Alert variant="contained" color="error">
                        <AlertTitle>Nota Não Reconhecida</AlertTitle>
                        <AlertDescription>
                            A IA não conseguiu identificar esta como uma nota fiscal válida. 
                            Certifique-se de que a imagem esteja nítida e bem iluminada.
                        </AlertDescription>
                    </Alert>
                )}
            </Stack>
        )
    };

    // Component content for both mobile and desktop
    const renderContent = () => (
        <>
            <Stack spacing={4}>
                {!receiptImage && (
                    <Stack spacing={2}>
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
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.name}
                                        {c.id === DEFAULT_AI_CREDENTIAL.id && (
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">Padrão</span>
                                        )}
                                    </MenuItem>
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
                    </Stack>
                )}
                
                {!receiptImage ? (
                    <>
                        {isMobile ? (
                            <Stack spacing={4} alignItems="center" justifyContent="center" width="100%">
                                <Box sx={{ position: 'relative', width: '100%' }}>
                                    <video 
                                        ref={videoRef} 
                                        className="w-full h-[60vh] object-cover rounded-lg" 
                                        autoPlay 
                                        muted 
                                        playsInline 
                                        style={{ backgroundColor: '#000', width: '100%', height: '60vh', objectFit: 'cover', borderRadius: '0.5rem' }}
                                    />
                                    {/* Camera overlay */}
                                    <Box sx={{ position: 'absolute', inset: 0 }}>
                                        {/* Guide overlay */}
                                        <Box sx={{ position: 'absolute', inset: '1rem', border: '2px dashed rgba(255,255,255,0.6)', borderRadius: 2 }}>
                                            <Box sx={{ position: 'absolute', top: '-0.75rem', left: '50%', transform: 'translateX(-50%)', bgcolor: 'rgba(0,0,0,0.6)', px: 1, py: 0.5, borderRadius: 1, color: 'white', fontSize: '0.75rem' }}>
                                                Posicione a nota fiscal aqui
                                            </Box>
                                        </Box>
                                        
                                        {/* Camera controls */}
                                        <Stack spacing={2} sx={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                            {hasFlash && (
                                                <Button
                                                    size="icon"
                                                    variant="contained" color="secondary"
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
                                                variant="contained" color="secondary"
                                                className="bg-black/60 hover:bg-black/80 border-0"
                                                onClick={switchCamera}
                                            >
                                                <SwitchCamera className="h-4 w-4 text-white" />
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Box>
                                
                                {hasCameraPermission === false && (
                                    <Alert variant="contained" color="error">
                                        <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                                        <AlertDescription>
                                            Permita o acesso à câmera para usar este recurso ou use a opção "Enviar da Galeria".
                                        </AlertDescription>
                                    </Alert>
                                )}
                                
                                <Stack direction="row" alignItems="center" spacing={2} width="100%">
                                    <Box sx={{ height: '1px', flex: 1, bgcolor: 'divider' }}/>
                                    <Typography variant="caption" color="text.secondary">OU</Typography>
                                    <Box sx={{ height: '1px', flex: 1, bgcolor: 'divider' }}/>
                                </Stack>
                                
                                <Button variant="outlined" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                    <Paperclip className="mr-2 h-4 w-4" /> Enviar da Galeria
                                </Button>
                                <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                            </Stack>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                <label htmlFor="dropzone-file" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '16rem', border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`, borderRadius: '0.5rem', cursor: 'pointer', backgroundColor: theme.palette.action.hover, transition: 'background-color 0.2s' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: 5, pb: 6 }}>
                                        <Upload style={{ width: '2rem', height: '2rem', marginBottom: '1rem', color: theme.palette.primary.main }} />
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <Box component="span" fontWeight="semibold" color="primary.main">Clique para enviar</Box> ou arraste e solte
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">PDF, PNG, ou JPG</Typography>
                                    </Box>
                                    <input ref={fileInputRef} id="dropzone-file" type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                                </label>
                            </Box>
                        )}
                    </>
                ) : (
                    <Stack spacing={4}>
                        <Box sx={{ position: 'relative' }}>
                            <img src={receiptImage} alt="Pré-visualização da nota" style={{ borderRadius: '0.5rem', maxHeight: '15rem', width: '100%', objectFit: 'cover' }} />
                            <Button
                                size="icon"
                                variant="contained" color="secondary"
                                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80"
                                onClick={resetState}
                                disabled={isProcessing || isSaving}
                            >
                                <RotateCcw className="h-4 w-4 text-white" />
                            </Button>
                        </Box>
                        {isProcessing ? renderProcessingSkeleton() : renderExtractedData()}
                    </Stack>
                )}
            </Stack>
            <canvas ref={canvasRef} className="hidden" />
        </>
    );

    if (isMobile) {
        return (
            <Sheet open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <SheetTrigger asChild>{children}</SheetTrigger>
                <SheetContent side="bottom" sx={{ height: '95vh', display: 'flex', flexDirection: 'column' }}>
                    <SheetHeader sx={{ textAlign: 'left' }}>
                        <SheetTitle>Escanear Nota Fiscal</SheetTitle>
                        <SheetDescription>
                            Aponte a câmera para a nota fiscal ou envie uma imagem da galeria.
                        </SheetDescription>
                    </SheetHeader>

                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        {renderContent()}
                    </Box>

                    <SheetFooter sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 2, pt: 4 }}>
                        {receiptImage ? (
                            <>
                                <Button variant="text" onClick={resetState} disabled={isProcessing || isSaving}>
                                    Nova Foto
                                </Button>
                                {extractedData?.isValid && (
                                    <Button onClick={handleSaveTransactions} disabled={isSaving || isProcessing} sx={{ flex: 1 }}>
                                        {isSaving && <Loader2 style={{ marginRight: '0.5rem', width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />}
                                        Salvar {extractedData.items?.length || 0} Itens
                                    </Button>
                                )}
                            </>
                        ) : (
                            <Button 
                                onClick={handleCapture} 
                                disabled={hasCameraPermission === false || isProcessing || isSaving}
                                sx={{ width: '100%', height: '3rem', fontSize: '1.125rem' }}
                                size="large"
                            >
                               <Camera style={{ marginRight: '0.5rem', width: '1.25rem', height: '1.25rem' }}/> Capturar Nota
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
            <DialogContent sx={{ maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <DialogHeader>
                    <DialogTitle>Escanear Nota Fiscal</DialogTitle>
                    <DialogDescription>
                        Faça upload da imagem (PDF, PNG, JPG) da nota fiscal para adicionar as transações.
                    </DialogDescription>
                </DialogHeader>

                {renderContent()}

                <DialogFooter sx={{ gap: 2, sm: { gap: 0, justifyContent: 'space-between' }, width: '100%' }}>
                    <Box>
                         {receiptImage && (
                            <Button variant="text" onClick={resetState} disabled={isProcessing || isSaving}>
                                Enviar Outra
                            </Button>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {extractedData?.isValid && (
                             <Button onClick={handleSaveTransactions} disabled={isSaving || isProcessing}>
                                {isSaving && <Loader2 style={{ marginRight: '0.5rem', width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />}
                                Salvar Transações
                            </Button>
                        )}
                    </Box>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
