// src/components/settings/webllm-progress-indicator.tsx
'use client';

import { useMemo } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Stack,
  alpha,
  Chip,
  keyframes,
} from '@mui/material';
import {
  CloudDownload,
  Memory,
  Speed,
  CheckCircle,
  Layers,
} from '@mui/icons-material';
import type { InitProgressReport } from '@mlc-ai/web-llm';

// Animação de pulso
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

// Animação de brilho
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

interface WebLLMProgressIndicatorProps {
  progress: InitProgressReport | null;
  isLoading: boolean;
  isReady: boolean;
  modelId: string | null;
  variant?: 'compact' | 'full';
}

interface ParsedProgress {
  stage: 'downloading' | 'loading' | 'initializing' | 'compiling' | 'ready' | 'unknown';
  percentage: number;
  currentMB?: number;
  totalMB?: number;
  message: string;
}

function parseProgressText(text: string): ParsedProgress {
  // Padrões comuns do WebLLM:
  // "Fetching param cache[0/12]: 0MB fetched. 0% completed, 0 secs elapsed."
  // "Loading model from cache[0/12]: 0MB loaded. 0% completed."
  // "Initializing model..."
  // "Finish loading"

  const lowerText = text.toLowerCase();

  // Detecta download/fetch
  if (lowerText.includes('fetching') || lowerText.includes('downloading')) {
    const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
    const mbMatch = text.match(/(\d+(?:\.\d+)?)\s*MB\s*fetched/i);
    const totalMatch = text.match(/cache\[(\d+)\/(\d+)\]/);
    
    return {
      stage: 'downloading',
      percentage: percentMatch ? parseFloat(percentMatch[1]) : 0,
      currentMB: mbMatch ? parseFloat(mbMatch[1]) : undefined,
      message: 'Baixando modelo...',
    };
  }

  // Detecta carregamento do cache
  if (lowerText.includes('loading') && lowerText.includes('cache')) {
    const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
    const mbMatch = text.match(/(\d+(?:\.\d+)?)\s*MB\s*loaded/i);
    
    return {
      stage: 'loading',
      percentage: percentMatch ? parseFloat(percentMatch[1]) : 0,
      currentMB: mbMatch ? parseFloat(mbMatch[1]) : undefined,
      message: 'Carregando do cache...',
    };
  }

  // Detecta inicialização
  if (lowerText.includes('initializing') || lowerText.includes('init')) {
    return {
      stage: 'initializing',
      percentage: 85,
      message: 'Inicializando WebGPU...',
    };
  }

  // Detecta compilação de shaders
  if (lowerText.includes('compiling') || lowerText.includes('shader')) {
    return {
      stage: 'compiling',
      percentage: 95,
      message: 'Compilando shaders...',
    };
  }

  // Detecta finalização
  if (lowerText.includes('finish') || lowerText.includes('done') || lowerText.includes('ready')) {
    return {
      stage: 'ready',
      percentage: 100,
      message: 'Pronto!',
    };
  }

  // Fallback - tenta extrair porcentagem
  const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
  return {
    stage: 'unknown',
    percentage: percentMatch ? parseFloat(percentMatch[1]) : 0,
    message: text || 'Processando...',
  };
}

const stageIcons = {
  downloading: CloudDownload,
  loading: Memory,
  initializing: Speed,
  compiling: Layers,
  ready: CheckCircle,
  unknown: Memory,
};

const stageColors = {
  downloading: 'info',
  loading: 'info',
  initializing: 'warning',
  compiling: 'warning',
  ready: 'success',
  unknown: 'info',
} as const;

export function WebLLMProgressIndicator({
  progress,
  isLoading,
  isReady,
  modelId,
  variant = 'full',
}: WebLLMProgressIndicatorProps) {
  const parsed = useMemo(() => {
    if (!progress?.text) {
      return {
        stage: 'unknown' as const,
        percentage: 0,
        message: 'Iniciando...',
      };
    }
    return parseProgressText(progress.text);
  }, [progress?.text]);

  const StageIcon = stageIcons[parsed.stage];
  const stageColor = stageColors[parsed.stage];

  // Versão compacta para o chat
  if (variant === 'compact') {
    if (isReady) {
      return (
        <Chip
          icon={<CheckCircle sx={{ fontSize: 16 }} />}
          label="IA Local Ativa"
          color="success"
          size="small"
          sx={{ 
            fontWeight: 600,
            '& .MuiChip-icon': { color: 'inherit' }
          }}
        />
      );
    }

    if (!isLoading) return null;

    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
          border: 1,
          borderColor: (theme) => alpha(theme.palette.info.main, 0.2),
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: (theme) => alpha(theme.palette[stageColor].main, 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: `${pulse} 2s ease-in-out infinite`,
              }}
            >
              <StageIcon sx={{ fontSize: 18, color: `${stageColor}.main` }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600} color={`${stageColor}.main`}>
                {parsed.message}
              </Typography>
              {parsed.currentMB && (
                <Typography variant="caption" color="text.secondary">
                  {parsed.currentMB.toFixed(0)} MB transferidos
                </Typography>
              )}
            </Box>
            <Typography variant="body2" fontWeight={700} color={`${stageColor}.main`}>
              {parsed.percentage.toFixed(0)}%
            </Typography>
          </Stack>

          <Box sx={{ position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={parsed.percentage}
              color={stageColor}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: (theme) => alpha(theme.palette[stageColor].main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        </Stack>
      </Box>
    );
  }

  // Versão completa para configurações
  if (isReady && modelId) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
          border: 1,
          borderColor: (theme) => alpha(theme.palette.success.main, 0.3),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle sx={{ color: 'success.main' }} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600} color="success.main">
              Modelo Carregado e Pronto!
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {modelId.split('-').slice(0, 2).join(' ')}
            </Typography>
          </Box>
        </Stack>
      </Box>
    );
  }

  if (!isLoading) return null;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor: (theme) => alpha(theme.palette[stageColor].main, 0.05),
        border: 1,
        borderColor: (theme) => alpha(theme.palette[stageColor].main, 0.2),
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Efeito de shimmer no fundo */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: (theme) =>
            `linear-gradient(90deg, transparent 0%, ${alpha(
              theme.palette[stageColor].main,
              0.05
            )} 50%, transparent 100%)`,
          backgroundSize: '200% 100%',
          animation: `${shimmer} 2s linear infinite`,
          pointerEvents: 'none',
        }}
      />

      <Stack spacing={2} sx={{ position: 'relative' }}>
        {/* Header com ícone e status */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette[stageColor].main, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: `${pulse} 1.5s ease-in-out infinite`,
            }}
          >
            <StageIcon sx={{ fontSize: 24, color: `${stageColor}.main` }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} color={`${stageColor}.main`}>
              {parsed.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {parsed.stage === 'downloading' && 'Primeira execução - baixando modelo'}
              {parsed.stage === 'loading' && 'Carregando modelo do cache local'}
              {parsed.stage === 'initializing' && 'Preparando aceleração GPU'}
              {parsed.stage === 'compiling' && 'Otimizando para seu hardware'}
              {parsed.stage === 'unknown' && 'Processando...'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" fontWeight={700} color={`${stageColor}.main`}>
              {parsed.percentage.toFixed(0)}%
            </Typography>
            {parsed.currentMB && (
              <Typography variant="caption" color="text.secondary">
                {parsed.currentMB.toFixed(0)} MB
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Barra de progresso */}
        <Box>
          <LinearProgress
            variant="determinate"
            value={parsed.percentage}
            color={stageColor}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: (theme) => alpha(theme.palette[stageColor].main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                transition: 'transform 0.3s ease',
              },
            }}
          />
        </Box>

        {/* Etapas do processo */}
        <Stack direction="row" spacing={1} justifyContent="center">
          {(['downloading', 'loading', 'initializing', 'compiling', 'ready'] as const).map((stage, index) => {
            const isCurrentOrPast =
              ['downloading', 'loading', 'initializing', 'compiling', 'ready'].indexOf(parsed.stage) >=
              index;
            const isCurrent = parsed.stage === stage;

            return (
              <Box
                key={stage}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: (theme) =>
                    isCurrentOrPast
                      ? theme.palette[stageColor].main
                      : alpha(theme.palette.text.primary, 0.2),
                  transition: 'all 0.3s ease',
                  transform: isCurrent ? 'scale(1.3)' : 'scale(1)',
                  boxShadow: isCurrent
                    ? (theme) => `0 0 8px ${theme.palette[stageColor].main}`
                    : 'none',
                }}
              />
            );
          })}
        </Stack>

        {/* Texto original para debug/detalhes */}
        {progress?.text && (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              opacity: 0.7,
              textAlign: 'center',
            }}
          >
            {progress.text.length > 80 ? progress.text.slice(0, 80) + '...' : progress.text}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

export default WebLLMProgressIndicator;
