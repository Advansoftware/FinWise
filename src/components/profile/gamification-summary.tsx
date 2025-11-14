// src/components/profile/gamification-summary.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award, Target, Flame, Star } from "lucide-react";
import { useGamification } from "@/hooks/use-gamification";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "../ui/button";

export function GamificationSummary() {
  const { gamificationData, isLoading } = useGamification();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Progresso Gamificado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!gamificationData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Trophy className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">Comece a usar o app para ganhar pontos e subir de nível!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-green-950/20 border-purple-200 dark:border-purple-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
          <Trophy className="h-5 w-5" />
          Seu Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nível e Pontos */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-200">
              Nível {gamificationData.level.level}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-400">
              {gamificationData.level.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-900 dark:text-purple-200">
              {gamificationData.points}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">pontos</div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-purple-700 dark:text-purple-400">
            <span>Próximo nível</span>
            <span>{gamificationData.level.pointsToNext} pontos</span>
          </div>
          <Progress
            value={(gamificationData.points / (gamificationData.level.pointsRequired + gamificationData.level.pointsToNext)) * 100}
            sx={{
              height: '0.5rem',
              bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(55, 48, 163, 0.15)' : 'rgba(243, 232, 255, 0.8)'
            }}
            indicatorSx={{
              background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)'
            }}
          />
        </div>

        {/* Streak */}
        {gamificationData.streak > 0 && (
          <div className="flex items-center gap-2 p-2 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800/50 rounded-lg">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              {gamificationData.streak} meses de pagamentos em dia
            </span>
          </div>
        )}

        {/* Badges Recentes */}
        {gamificationData.badges.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs font-medium text-purple-700 dark:text-purple-400">
              <Award className="h-3 w-3" />
              Badges Recentes
            </div>
            <div className="flex gap-1">
              {gamificationData.badges.slice(0, 4).map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white"
                  title={badge.name}
                >
                  <span className="text-xs">{badge.icon}</span>
                </motion.div>
              ))}
              {gamificationData.badges.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    +{gamificationData.badges.length - 4}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <Button asChild variant="outline" className="w-full mt-4">
            <Link href="/installments?tab=gamification">
                Ver todos os detalhes
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
