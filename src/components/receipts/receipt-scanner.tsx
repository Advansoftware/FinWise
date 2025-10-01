// src/components/receipts/receipt-scanner.tsx
"use client";

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions } from "@/hooks/use-transactions";
import { usePlan } from "@/hooks/use-plan";
import { useAISettings } from "@/hooks/use-ai-settings";
import { extractReceiptInfoAction } from "@/services/ai-actions";
import { getVisionCapableModels, DEFAULT_AI_CREDENTIAL } from "@/lib/ai-settings";
import { Transaction, TransactionCategory } from "@/lib/types";
import { MobileCamera } from "@/components/camera/mobile-camera";
import { FileUpload } from "@/components/camera/file-upload";
import { Loader2, RotateCcw, Sparkles, BrainCircuit, Info } from "lucide-react";

interface ReceiptScannerProps {
  onComplete?: () => void;
}

export function ReceiptScanner({ onComplete }: ReceiptScannerProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { wallets } = useWallets();
  const { addTransaction } = useTransactions();
  const { isPlus } = usePlan();
  const { displayedCredentials, activeCredentialId } = useAISettings();

  // Estados
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isProcessing, startProcessing] = useTransition();
  const [isSaving, startSaving] = useTransition();
  
  // IA settings
  const visionCapableCredentials = getVisionCapableModels(displayedCredentials);
  const [selectedAI, setSelectedAI] = useState(activeCredentialId || DEFAULT_AI_CREDENTIAL.id);
  const canSelectProvider = isPlus;
  const selectedCredential = visionCapableCredentials.find(c => c.id === selectedAI);
  const isOllamaSelected = selectedCredential?.provider === 'ollama';

  const resetState = () => {
    setReceiptImage(null);
    setExtractedData(null);
  };

  const processImage = async (imageData: string) => {
    if (!user) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro de Autenticação', 
        description: 'Você precisa estar logado.' 
      });
      return;
    }

    setReceiptImage(imageData);
    setExtractedData(null);

    startProcessing(async () => {
      try {
        toast({
          title: "Foto Capturada!",
          description: "Processando a nota fiscal...",
        });

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
      }
    });
  };

  const handleSaveTransactions = () => {
    if (!extractedData || !extractedData.items || extractedData.items.length === 0) return;
    
    if (wallets.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhuma Carteira',
        description: 'Crie uma carteira antes de salvar transações.',
      });
      return;
    }
    
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
        
        onComplete?.();

      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Erro ao Salvar',
          description: 'Não foi possível salvar as transações.',
        });
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <Skeleton className="h-10 col-span-2" />
            <Skeleton className="h-10" />
          </div>
        ))}
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

  const renderExtractedData = () => {
    if (!extractedData) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Itens Extraídos</h3>
          <Badge 
            variant={extractedData.isValid ? 'default' : 'destructive'} 
            className={extractedData.isValid ? "bg-green-500/20 text-green-300 border-green-500/30" : ""}
          >
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

        <div className="flex gap-2 pt-4">
          <Button variant="ghost" onClick={resetState} disabled={isProcessing || isSaving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Nova Foto
          </Button>
          {extractedData.isValid && (
            <Button onClick={handleSaveTransactions} disabled={isSaving || isProcessing} className="flex-1">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar {extractedData.items?.length || 0} Itens
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* AI Provider Selection */}
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
        </div>
      )}

      {/* Camera/Upload Interface */}
      {!receiptImage ? (
        <>
          {isMobile ? (
            <MobileCamera 
              onCapture={processImage}
              onPermissionDenied={() => {
                toast({
                  variant: 'destructive',
                  title: 'Câmera Bloqueada',
                  description: 'Use a opção "Enviar da Galeria" para continuar.',
                });
              }}
            />
          ) : (
            <FileUpload onFileSelect={processImage} />
          )}
          
          {isMobile && (
            <>
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border"/>
                <span className="text-xs text-muted-foreground">OU</span>
                <div className="h-px flex-1 bg-border"/>
              </div>
              
              <FileUpload 
                onFileSelect={processImage} 
                variant="button"
              />
            </>
          )}
        </>
      ) : (
        /* Preview and Results */
        <div className="space-y-4">
          <div className="relative">
            <img 
              src={receiptImage} 
              alt="Pré-visualização da nota" 
              className="rounded-lg max-h-60 w-full object-cover" 
            />
          </div>
          
          {isProcessing ? renderProcessingSkeleton() : renderExtractedData()}
        </div>
      )}
    </div>
  );
}