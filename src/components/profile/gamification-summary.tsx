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
import { Box, Stack, Typography } from '@mui/material';

export function GamificationSummary() {
  const { gamificationData, isLoading } = useGamification();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Trophy style={{ width: '1.25rem', height: '1.25rem' }} />
              Progresso Gamificado
            </Stack>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Stack spacing={4}>
            <Skeleton sx={{ height: '1rem', width: '100%' }} />
            <Skeleton sx={{ height: '1rem', width: '75%' }} />
            <Skeleton sx={{ height: '1rem', width: '50%' }} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!gamificationData) {
    return (
      <Card>
        <CardContent sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
          <Trophy style={{ margin: '0 auto', width: '2rem', height: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>Comece a usar o app para ganhar pontos e subir de nível!</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      background: theme => theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, rgba(88, 28, 135, 0.2) 0%, rgba(30, 58, 138, 0.2) 50%, rgba(6, 78, 59, 0.2) 100%)'
        : 'linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #f0fdf4 100%)',
      borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(147, 51, 234, 0.5)' : '#e9d5ff'
    }}>
      <CardHeader>
        <CardTitle>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ color: theme => theme.palette.mode === 'dark' ? '#d8b4fe' : '#6b21a8' }}>
            <Trophy style={{ width: '1.25rem', height: '1.25rem' }} />
            Seu Progresso
          </Stack>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Stack spacing={4}>
        {/* Nível e Pontos */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 700, color: theme => theme.palette.mode === 'dark' ? '#e9d5ff' : '#581c87' }}>
              Nível {gamificationData.level.level}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', color: theme => theme.palette.mode === 'dark' ? '#c084fc' : '#7e22ce' }}>
              {gamificationData.level.name}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 700, color: theme => theme.palette.mode === 'dark' ? '#e9d5ff' : '#581c87' }}>
              {gamificationData.points}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', color: theme => theme.palette.mode === 'dark' ? '#c084fc' : '#9333ea' }}>pontos</Typography>
          </Box>
        </Stack>

        {/* Barra de Progresso */}
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '0.75rem', color: theme => theme.palette.mode === 'dark' ? '#c084fc' : '#7e22ce' }}>
            <Typography component="span" variant="body2" sx={{ fontSize: '0.75rem' }}>Próximo nível</Typography>
            <Typography component="span" variant="body2" sx={{ fontSize: '0.75rem' }}>{gamificationData.level.pointsToNext} pontos</Typography>
          </Stack>
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
        </Stack>

        {/* Streak */}
        {gamificationData.streak > 0 && (
          <Stack direction="row" alignItems="center" spacing={2} sx={{ 
            p: 2, 
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(124, 45, 18, 0.5)' : '#ffedd5',
            border: 1,
            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(154, 52, 18, 0.5)' : '#fed7aa',
            borderRadius: 2
          }}>
            <Flame style={{ width: '1rem', height: '1rem', color: '#f97316' }} />
            <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500, color: theme => theme.palette.mode === 'dark' ? '#fdba74' : '#c2410c' }}>
              {gamificationData.streak} meses de pagamentos em dia
            </Typography>
          </Stack>
        )}

        {/* Badges Recentes */}
        {gamificationData.badges.length > 0 && (
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ fontSize: '0.75rem', fontWeight: 500, color: theme => theme.palette.mode === 'dark' ? '#c084fc' : '#7e22ce' }}>
              <Award style={{ width: '0.75rem', height: '0.75rem' }} />
              Badges Recentes
            </Stack>
            <Stack direction="row" spacing={1}>
              {gamificationData.badges.slice(0, 4).map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #facc15 0%, #ca8a04 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff'
                  }}
                  title={badge.name}
                >
                  <span style={{ fontSize: '0.75rem' }}>{badge.icon}</span>
                </motion.div>
              ))}
              {gamificationData.badges.length > 4 && (
                <Box sx={{ 
                  width: '2rem', 
                  height: '2rem', 
                  borderRadius: '50%', 
                  bgcolor: theme => theme.palette.mode === 'dark' ? '#374151' : '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography component="span" sx={{ fontSize: '0.75rem', color: theme => theme.palette.mode === 'dark' ? '#d1d5db' : '#4b5563' }}>
                    +{gamificationData.badges.length - 4}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Stack>
        )}
        
        <Button asChild variant="outline" sx={{ width: '100%', mt: 4 }}>
            <Link href="/installments?tab=gamification">
                Ver todos os detalhes
            </Link>
        </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
