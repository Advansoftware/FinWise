// src/components/profile/gamification-summary.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award, Target, Flame, Star } from "lucide-react";
import { useGamification } from "@/hooks/use-gamification";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function GamificationSummary() {
  const { gamificationData, profileInsights, isLoading } = useGamification();

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
          <p className="text-sm">Crie parcelamentos para ver seu progresso!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Trophy className="h-5 w-5" />
          Progresso Gamificado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nível e Pontos */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-purple-900">
              Nível {gamificationData.level.level}
            </div>
            <div className="text-sm text-purple-700">
              {gamificationData.level.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-900">
              {gamificationData.points}
            </div>
            <div className="text-xs text-purple-600">pontos</div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-purple-700">
            <span>Próximo nível</span>
            <span>{gamificationData.level.pointsToNext} pontos</span>
          </div>
          <Progress 
            value={(gamificationData.points / (gamificationData.level.pointsRequired + gamificationData.level.pointsToNext)) * 100} 
            className="h-2 bg-purple-200"
          />
        </div>

        {/* Streak */}
        {gamificationData.streak > 0 && (
          <div className="flex items-center gap-2 p-2 bg-orange-100 border border-orange-200 rounded-lg">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">
              {gamificationData.streak} meses consecutivos
            </span>
          </div>
        )}

        {/* Badges Recentes */}
        {gamificationData.badges.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs font-medium text-purple-700">
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
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-600">
                    +{gamificationData.badges.length - 4}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Score de Saúde Financeira */}
        {gamificationData.financialHealthScore > 0 && (
          <div className="p-3 bg-white/70 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-purple-700">Saúde Financeira</span>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  gamificationData.financialHealthScore >= 80 ? 'border-green-500 text-green-700' :
                  gamificationData.financialHealthScore >= 60 ? 'border-blue-500 text-blue-700' :
                  gamificationData.financialHealthScore >= 40 ? 'border-yellow-500 text-yellow-700' :
                  'border-red-500 text-red-700'
                }`}
              >
                {gamificationData.financialHealthScore}%
              </Badge>
            </div>
            <Progress 
              value={gamificationData.financialHealthScore} 
              className="h-2"
            />
          </div>
        )}

        {/* Insights Motivacionais */}
        {gamificationData.motivationalInsights.length > 0 && (
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Star className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-700 leading-relaxed">
                {gamificationData.motivationalInsights[0]}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
