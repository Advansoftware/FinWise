'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Clock
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
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
}

export function GamificationGuide({ 
  currentPoints = 0, 
  currentLevel,
  badges = []
}: GamificationGuideProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'levels' | 'badges' | 'achievements'>('overview');

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
      case 'common': return 'border-gray-300 bg-gray-50 text-gray-700';
      case 'rare': return 'border-blue-300 bg-blue-50 text-blue-700';
      case 'epic': return 'border-purple-300 bg-purple-50 text-purple-700';
      case 'legendary': return 'border-yellow-300 bg-yellow-50 text-yellow-700';
      default: return 'border-gray-300 bg-gray-50 text-gray-700';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs md:text-sm px-2 md:px-3 py-1 h-auto min-w-0 max-w-full overflow-hidden">
          <HelpCircle className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
          <span className="truncate">Como Funciona?</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] h-[95vh] md:max-w-4xl md:max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Sistema de Gamificação - Parcelamentos
          </DialogTitle>
          <DialogDescription>
            Transforme o pagamento de parcelas em uma experiência divertida e motivadora!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          {/* Tabs */}
          <div className="flex-shrink-0 mb-4 overflow-x-auto">
            <div className="flex gap-1 bg-muted p-1 rounded-lg min-w-max">
              {[
                { id: 'overview', label: 'Visão Geral', icon: Star },
                { id: 'levels', label: 'Níveis', icon: TrendingUp },
                { id: 'badges', label: 'Badges', icon: Award },
                { id: 'achievements', label: 'Conquistas', icon: Trophy }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                    activeTab === id 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Status Atual */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Seu Status Atual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">{currentPoints} pontos</p>
                          <p className="text-sm text-muted-foreground">
                            {currentLevel ? `Nível ${currentLevel.level} - ${currentLevel.name}` : 'Nível 1 - Iniciante'}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {badges.slice(0, 3).map((badge, index) => (
                            <div key={badge.id} className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                              <span className="text-xs">{badge.icon}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {currentLevel && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Próximo nível</span>
                            <span>{currentLevel.pointsToNext} pontos restantes</span>
                          </div>
                          <Progress 
                            value={(currentPoints / (currentLevel.pointsRequired + currentLevel.pointsToNext)) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Como Ganhar Pontos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Como Ganhar (ou Perder) Pontos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pointsSystem.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <span className="font-medium">{item.action}</span>
                            <span className={`font-bold ${item.color}`}>{item.points}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Motivação */}
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-3">
                        <Flame className="h-8 w-8 text-orange-500 mx-auto" />
                        <h3 className="font-semibold text-lg">Por que funciona?</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          A gamificação transforma uma tarefa chata (pagar contas) em algo divertido e recompensador. 
                          Cada pagamento em dia é uma vitória que você pode comemorar!
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'levels' && (
                <motion.div
                  key="levels"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {levels.map((level, index) => {
                    const Icon = level.icon;
                    const isCurrentLevel = currentLevel?.level === level.level;
                    const isUnlocked = currentPoints >= level.pointsRequired;
                    
                    return (
                      <Card key={level.level} className={`${isCurrentLevel ? 'ring-2 ring-primary' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full ${level.color} flex items-center justify-center ${!isUnlocked ? 'opacity-50' : ''}`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">Nível {level.level} - {level.name}</h3>
                                {isCurrentLevel && <Badge variant="default">Atual</Badge>}
                                {!isUnlocked && <Badge variant="outline">Bloqueado</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {level.pointsRequired} pontos necessários
                              </p>
                              <div className="mt-2">
                                <p className="text-xs font-medium mb-1">Benefícios:</p>
                                <div className="flex flex-wrap gap-1">
                                  {level.benefits.map((benefit, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {benefit}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === 'badges' && (
                <motion.div
                  key="badges"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {badgeTypes.map((badge) => {
                    const isEarned = badges.some(b => b.id === badge.id);
                    
                    return (
                      <Card key={badge.id} className={`${isEarned ? 'ring-2 ring-yellow-400' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                              isEarned ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-100 opacity-50'
                            }`}>
                              {badge.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{badge.name}</h4>
                                {isEarned && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              </div>
                              <p className="text-sm text-muted-foreground">{badge.description}</p>
                              <div className="mt-2">
                                <Badge variant="outline" className={getRarityColor(badge.rarity)}>
                                  {badge.rarity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                <strong>Como obter:</strong> {badge.requirement}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === 'achievements' && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {achievements.map((achievement, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{achievement.name}</h4>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{achievement.points} pontos</Badge>
                              <span className="text-xs text-muted-foreground">
                                {achievement.progress}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
