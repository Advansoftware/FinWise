'use client';

import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  useTheme,
  alpha,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Trophy, 
  Star, 
  Flame, 
  Target, 
  Award,
  Zap,
  Shield,
  Crown,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GamificationGuideProps {
  currentPoints?: number;
  currentLevel?: {
    level: number;
    name: string;
    pointsRequired: number;
    pointsToNext: number;
  };
  badges?: Array<{
    id: string;
    name: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  }>;
}

export function GamificationGuide({ 
  currentPoints = 0, 
  currentLevel,
  badges = []
}: GamificationGuideProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'levels' | 'badges' | 'achievements'>('overview');
  const theme = useTheme();

  const levels = [
    { 
      level: 1, 
      name: 'Iniciante', 
      pointsRequired: 0, 
      color: 'bg-gray-500',
      icon: Shield,
      benefits: ['Controle básico de parcelamentos', 'Alertas de vencimento']
    },
    { 
      level: 2, 
      name: 'Organizador', 
      pointsRequired: 100, 
      color: 'bg-blue-500',
      icon: Target,
      benefits: ['Relatórios mensais', 'Notificações avançadas', 'Análise de tendências']
    },
    { 
      level: 3, 
      name: 'Disciplinado', 
      pointsRequired: 300, 
      color: 'bg-green-500',
      icon: CheckCircle2,
      benefits: ['Projeções automáticas', 'Insights personalizados', 'Dashboard avançado']
    },
    { 
      level: 4, 
      name: 'Expert', 
      pointsRequired: 600, 
      color: 'bg-purple-500',
      icon: Zap,
      benefits: ['Otimização automática', 'Consultoria IA', 'Recomendações inteligentes']
    },
    { 
      level: 5, 
      name: 'Mestre', 
      pointsRequired: 1000, 
      color: 'bg-yellow-500',
      icon: Crown,
      benefits: ['Recursos premium', 'Suporte prioritário', 'Acesso antecipado a novidades']
    }
  ];

  const badgeTypes = [
    {
      id: 'first-payment',
      name: 'Primeiro Passo',
      description: 'Realizou seu primeiro pagamento',
      icon: '🎯',
      rarity: 'common' as const,
      requirement: 'Pague sua primeira parcela'
    },
    {
      id: 'punctual-payer',
      name: 'Pagador Pontual',
      description: 'Pagou 10 parcelas em dia',
      icon: '⏰',
      rarity: 'rare' as const,
      requirement: '10 pagamentos dentro do prazo'
    },
    {
      id: 'recovery-master',
      name: 'Mestre da Recuperação',
      description: 'Se recuperou de atrasos',
      icon: '💪',
      rarity: 'rare' as const,
      requirement: 'Quite 3 parcelas que estavam em atraso'
    },
    {
      id: 'finisher',
      name: 'Finalizador',
      description: 'Completou 3 parcelamentos',
      icon: '🏆',
      rarity: 'epic' as const,
      requirement: 'Complete 3 parcelamentos integralmente'
    },
    {
      id: 'zero-delay',
      name: 'Zero Atraso',
      description: 'Nunca atrasou um pagamento',
      icon: '🌟',
      rarity: 'legendary' as const,
      requirement: 'Mantenha histórico perfeito (5+ pagamentos)'
    }
  ];

  const pointsSystem = [
    { action: 'Pagar parcela', points: '+10', color: 'text-green-600' },
    { action: 'Pagar em dia (bônus)', points: '+5', color: 'text-blue-600' },
    { action: 'Completar parcelamento', points: '+50', color: 'text-purple-600' },
    { action: 'Pagar com atraso', points: '-2 por dia', color: 'text-red-600' },
    { action: 'Manter atraso', points: '-1 por dia', color: 'text-red-600' }
  ];

  const achievements = [
    {
      name: 'Organização Total',
      description: 'Pague todas as suas parcelas ativas',
      icon: '📊',
      points: 100,
      progress: 'Baseado nas parcelas quitadas vs total'
    },
    {
      name: 'Mestre da Pontualidade',
      description: 'Pague 50 parcelas em dia',
      icon: '⚡',
      points: 200,
      progress: 'Contador de pagamentos pontuais'
    },
    {
      name: 'Caçador de Atrasos',
      description: 'Quite todas as parcelas em atraso',
      icon: '🎯',
      points: 150,
      progress: 'Zero parcelas em atraso'
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return { bgcolor: 'grey.100', color: 'grey.700', borderColor: 'grey.300' };
      case 'rare': return { bgcolor: 'info.lighter', color: 'info.main', borderColor: 'info.light' };
      case 'epic': return { bgcolor: 'secondary.lighter', color: 'secondary.main', borderColor: 'secondary.light' };
      case 'legendary': return { bgcolor: 'warning.lighter', color: 'warning.main', borderColor: 'warning.light' };
      default: return { bgcolor: 'grey.100', color: 'grey.700', borderColor: 'grey.300' };
    }
  };

  return (
    <>
      <Button 
        variant="outlined" 
        size="small" 
        onClick={() => setOpen(true)}
        startIcon={<HelpCircle style={{ width: '1rem', height: '1rem' }} />}
        sx={{ minWidth: 0, whiteSpace: 'nowrap' }}
      >
        Como Funciona?
      </Button>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh', maxHeight: '800px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Trophy style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.warning.main }} />
              <span>Sistema de Gamificação</span>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 'normal' }}>
              Transforme o pagamento de parcelas em uma experiência divertida!
            </Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} size="small">
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: 'background.paper' }}>
            <Tabs 
              value={activeTab} 
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab value="overview" label="Visão Geral" icon={<Star size={16} />} iconPosition="start" />
              <Tab value="levels" label="Níveis" icon={<TrendingUp size={16} />} iconPosition="start" />
              <Tab value="badges" label="Badges" icon={<Award size={16} />} iconPosition="start" />
              <Tab value="achievements" label="Conquistas" icon={<Trophy size={16} />} iconPosition="start" />
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Stack spacing={3}>
                    {/* Status Atual */}
                    <Card>
                      <CardHeader title="Seu Status Atual" titleTypographyProps={{ variant: 'h6' }} />
                      <CardContent>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="h4" fontWeight="bold" color="primary.main">{currentPoints} pontos</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {currentLevel ? `Nível ${currentLevel.level} - ${currentLevel.name}` : 'Nível 1 - Iniciante'}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                              {badges.slice(0, 3).map((badge) => (
                                <Box 
                                  key={badge.id} 
                                  sx={{ 
                                    width: 32, 
                                    height: 32, 
                                    borderRadius: '50%', 
                                    background: `linear-gradient(135deg, ${theme.palette.warning.light}, ${theme.palette.warning.dark})`,
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {badge.icon}
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                          
                          {currentLevel && (
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption">Próximo nível</Typography>
                                <Typography variant="caption">{currentLevel.pointsToNext} pontos restantes</Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={(currentPoints / (currentLevel.pointsRequired + currentLevel.pointsToNext)) * 100} 
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Como Ganhar Pontos */}
                    <Card>
                      <CardHeader title="Como Ganhar (ou Perder) Pontos" titleTypographyProps={{ variant: 'h6' }} />
                      <CardContent>
                        <Stack spacing={1.5}>
                          {pointsSystem.map((item, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 1, border: 1, borderColor: 'divider' }}>
                              <Typography variant="body2" fontWeight="medium">{item.action}</Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ color: item.color.includes('red') ? 'error.main' : item.color.includes('green') ? 'success.main' : item.color.includes('blue') ? 'info.main' : 'secondary.main' }}>
                                {item.points}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Motivação */}
                    <Card sx={{ 
                      background: `linear-gradient(to right, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                      borderColor: alpha(theme.palette.info.main, 0.2)
                    }}>
                      <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Flame style={{ width: '2rem', height: '2rem', color: theme.palette.warning.main, marginBottom: '0.75rem' }} />
                        <Typography variant="h6" gutterBottom>Por que funciona?</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                          A gamificação transforma uma tarefa chata (pagar contas) em algo divertido e recompensador. 
                          Cada pagamento em dia é uma vitória que você pode comemorar!
                        </Typography>
                      </CardContent>
                    </Card>
                  </Stack>
                </motion.div>
              )}

              {activeTab === 'levels' && (
                <motion.div
                  key="levels"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Stack spacing={2}>
                    {levels.map((level) => {
                      const Icon = level.icon;
                      const isCurrentLevel = currentLevel?.level === level.level;
                      const isUnlocked = currentPoints >= level.pointsRequired;
                      
                      return (
                        <Card key={level.level} sx={{ border: isCurrentLevel ? 2 : 1, borderColor: isCurrentLevel ? 'primary.main' : 'divider' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Box sx={{ 
                                width: 48, 
                                height: 48, 
                                borderRadius: '50%', 
                                bgcolor: level.color.replace('bg-', '').replace('-500', '.main'), // This is a rough mapping, might need adjustment or explicit colors
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                opacity: !isUnlocked ? 0.5 : 1,
                                color: 'white'
                              }}>
                                <Icon size={24} />
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle1" fontWeight="bold">Nível {level.level} - {level.name}</Typography>
                                  {isCurrentLevel && <Chip label="Atual" color="primary" size="small" />}
                                  {!isUnlocked && <Chip label="Bloqueado" variant="outlined" size="small" />}
                                </Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {level.pointsRequired} pontos necessários
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" fontWeight="medium" display="block" gutterBottom>Benefícios:</Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {level.benefits.map((benefit, i) => (
                                      <Chip key={i} label={benefit} size="small" sx={{ bgcolor: 'action.hover' }} />
                                    ))}
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                </motion.div>
              )}

              {activeTab === 'badges' && (
                <motion.div
                  key="badges"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    {badgeTypes.map((badge) => {
                      const isEarned = badges.some(b => b.id === badge.id);
                      const rarityColors = getRarityColor(badge.rarity);
                      
                      return (
                        <Card key={badge.id} sx={{ border: isEarned ? 2 : 1, borderColor: isEarned ? 'warning.main' : 'divider' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Box sx={{ 
                                width: 48, 
                                height: 48, 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                bgcolor: isEarned ? alpha(theme.palette.warning.main, 0.1) : 'action.disabledBackground',
                                border: isEarned ? 1 : 0,
                                borderColor: 'warning.main',
                                opacity: isEarned ? 1 : 0.5
                              }}>
                                {badge.icon}
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle2" fontWeight="bold">{badge.name}</Typography>
                                  {isEarned && <CheckCircle2 size={16} color={theme.palette.success.main} />}
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.2 }}>{badge.description}</Typography>
                                <Chip 
                                  label={badge.rarity} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: rarityColors.bgcolor, 
                                    color: rarityColors.color, 
                                    border: 1, 
                                    borderColor: rarityColors.borderColor,
                                    height: 20,
                                    fontSize: '0.625rem',
                                    textTransform: 'uppercase'
                                  }} 
                                />
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                  <strong>Como obter:</strong> {badge.requirement}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                </motion.div>
              )}

              {activeTab === 'achievements' && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Stack spacing={2}>
                    {achievements.map((achievement, index) => (
                      <Card key={index}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Box sx={{ fontSize: '2rem' }}>{achievement.icon}</Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold">{achievement.name}</Typography>
                              <Typography variant="body2" color="text.secondary">{achievement.description}</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                <Chip label={`${achievement.points} pontos`} size="small" variant="outlined" />
                                <Typography variant="caption" color="text.secondary">
                                  {achievement.progress}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
