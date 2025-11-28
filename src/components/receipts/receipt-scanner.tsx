// src/components/receipts/receipt-scanner.tsx
"use client";

import {useState, useTransition} from 'react';
import { Button } from "@mui/material";
import { Alert, AlertTitle, Typography } from "@mui/material";
import { Chip } from "@mui/material";
import { TextField } from "@mui/material";
import { InputLabel } from "@mui/material";
import { Select, MenuItem } from "@mui/material";
import { Skeleton } from "@mui/material";
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
import {Box, Stack} from '@mui/material';

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
        variant: "error", 
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
            variant: "error",
            title: 'Nota Inválida',
            description: 'A imagem não parece ser uma nota fiscal válida. Tente outra imagem.',
          });
        }
      } catch (error: any) {
        console.error(error);
        toast({
          variant: "error",
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
        variant: "error",
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
          variant: "error",
          title: 'Erro ao Salvar',
          description: 'Não foi possível salvar as transações.',
        });
      }
    });
  };

  const renderProcessingSkeleton = () => (
    <Stack spacing={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Skeleton sx={{ height: '1.5rem', width: '8rem' }} />
        <Skeleton sx={{ height: '1.5rem', width: '5rem' }} />
      </Stack>
      <Stack spacing={3}>
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
            <Skeleton sx={{ height: '2.5rem' }} />
            <Skeleton sx={{ height: '2.5rem' }} />
          </Box>
        ))}
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        <Skeleton sx={{ height: '2.5rem' }} />
        <Skeleton sx={{ height: '2.5rem' }} />
      </Box>
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Stack direction="row" spacing={2} sx={{ display: 'inline-flex', alignItems: 'center', color: 'text.secondary' }}>
          <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
          <Typography variant="body2">Analisando nota fiscal...</Typography>
        </Stack>
      </Box>
    </Stack>
  );

  const renderExtractedData = () => {
    if (!extractedData) return null;
    
    return (
      <Stack spacing={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Itens Extraídos</Typography>
          <Chip 
            label={extractedData.isValid ? 'Nota Válida' : 'Nota Inválida'}
            variant="filled"
            color={extractedData.isValid ? 'success' : 'error'}
          />
        </Stack>
        
        {extractedData.items?.length > 0 ? (
          <Stack spacing={3}>
            {extractedData.items?.map((item: any, index: number) => (
              <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2, alignItems: 'center', p: 3, borderRadius: 2, bgcolor: theme => `${(theme.palette as any).custom?.muted}80`, border: 1, borderColor: 'divider' }}>
                <TextField 
                  defaultValue={item.item} 
                  placeholder="Item"
                  InputProps={{ readOnly: !extractedData.isValid }}
                  size="small"
                  fullWidth
                />
                <TextField 
                  type="number" 
                  defaultValue={item.amount} 
                  placeholder="Valor"
                  InputProps={{ readOnly: !extractedData.isValid }}
                  inputProps={{ step: "0.01" }}
                  size="small"
                  fullWidth
                />
              </Box>
            ))}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Typography>Nenhum item foi encontrado na nota.</Typography>
            <Typography variant="body2">Tente uma imagem com melhor qualidade.</Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, p: 3, borderRadius: 2, bgcolor: theme => `${(theme.palette as any).custom?.muted}4D`, border: 1, borderColor: 'divider' }}>
          <Stack spacing={1}>
            <Typography component="label" htmlFor="total" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Total</Typography>
            <TextField 
              type="number" 
              defaultValue={extractedData.totalAmount || 0} 
              placeholder="Total" 
              InputProps={{ readOnly: !extractedData.isValid }}
              inputProps={{ step: "0.01" }}
              size="small"
              fullWidth
            />
          </Stack>
          <Stack spacing={1}>
            <Typography component="label" htmlFor="date" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Data</Typography>
            <TextField 
              type="date" 
              defaultValue={extractedData.date} 
              placeholder="Data" 
              InputProps={{ readOnly: !extractedData.isValid }}
              size="small"
              fullWidth
            />
          </Stack>
        </Box>
        
        {!extractedData.isValid && (
          <Alert variant="filled" severity="error">
            <AlertTitle>Nota Não Reconhecida</AlertTitle>
            <Typography variant="body2">
              Não foi possível processar a imagem. Tente novamente com uma imagem mais clara.
            </Typography>
          </Alert>
        )}

        <Stack direction="row" spacing={2} sx={{ pt: 4 }}>
          <Button variant="text" onClick={resetState} disabled={isProcessing || isSaving}>
            <RotateCcw style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
            Nova Foto
          </Button>
          {extractedData.isValid && (
            <Button onClick={handleSaveTransactions} disabled={isSaving || isProcessing} sx={{ flex: 1 }}>
              {isSaving && <Loader2 style={{ marginRight: '0.5rem', width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />}
              Salvar {extractedData.items?.length || 0} Itens
            </Button>
          )}
        </Stack>
      </Stack>
    );
  };

  return (
    <Stack spacing={6}>
      {/* AI Provider Selection */}
      {!receiptImage && (
        <Stack spacing={2}>
          <Typography component="label" htmlFor="ai-provider" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Provedor de IA</Typography>
          <Select 
            id="ai-provider"
            value={selectedAI} 
            onChange={(e) => setSelectedAI(e.target.value)}
            disabled={!canSelectProvider}
            size="small"
            fullWidth
          >
            {visionCapableCredentials.map(c => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
                {c.id === DEFAULT_AI_CREDENTIAL.id && (
                  <Box component="span" sx={{ ml: 2, fontSize: '0.75rem', bgcolor: '#dbeafe', color: '#1e40af', px: 1, borderRadius: 1 }}>Padrão</Box>
                )}
              </MenuItem>
            ))}
          </Select>
          
          {!canSelectProvider && (
            <Alert variant="standard" icon={<Sparkles style={{ width: '1rem', height: '1rem', color: '#60a5fa' }} />} sx={{ borderColor: 'rgba(59, 130, 246, 0.5)', color: '#bfdbfe' }}>
              <AlertTitle>Gastometria IA</AlertTitle>
              <Typography variant="body2">
                Usando modelo padrão otimizado para análise de recibos. Faça upgrade para Plus ou Infinity para escolher outros modelos.
              </Typography>
            </Alert>
          )}
          
          {isOllamaSelected && (
            <Alert variant="standard" icon={<Info style={{ width: '1rem', height: '1rem', color: '#fbbf24' }} />} sx={{ borderColor: 'rgba(245, 158, 11, 0.5)', color: '#fcd34d' }}>
              <AlertTitle>Aviso: Modelo Local com Visão</AlertTitle>
              <Typography variant="body2">
                Modelos locais (Ollama) com visão podem ter menor precisão e segurança na leitura de recibos. 
                Recomendamos usar o Gastometria IA para melhores resultados.
              </Typography>
            </Alert>
          )}
        </Stack>
      )}

      {/* Camera/Upload Interface */}
      {!receiptImage ? (
        <>
          {isMobile ? (
            <MobileCamera 
              onCapture={processImage}
              onPermissionDenied={() => {
                toast({
                  variant: "error",
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
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ height: '1px', flex: 1, bgcolor: 'divider' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>OU</Typography>
                <Box sx={{ height: '1px', flex: 1, bgcolor: 'divider' }} />
              </Stack>
              
              <FileUpload 
                onFileSelect={processImage} 
                variant="button"
              />
            </>
          )}
        </>
      ) : (
        /* Preview and Results */
        <Stack spacing={4}>
          <Box sx={{ position: 'relative' }}>
            <Box 
              component="img" 
              src={receiptImage} 
              alt="Pré-visualização da nota" 
              sx={{ borderRadius: 2, maxHeight: '15rem', width: '100%', objectFit: 'cover' }}
            />
          </Box>
          
          {isProcessing ? renderProcessingSkeleton() : renderExtractedData()}
        </Stack>
      )}
    </Stack>
  );
}