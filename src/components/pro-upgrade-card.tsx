// src/components/pro-upgrade-card.tsx
'use client';

import { Card, CardContent } from "@mui/material";
import { Button } from "@mui/material";
import { Gem } from "lucide-react";
import Link from "next/link";
import {Box, Stack, Typography} from '@mui/material';

interface ProUpgradeCardProps {
    featureName: string;
}

export function ProUpgradeCard({ featureName }: ProUpgradeCardProps) {
    return (
        <Card sx={{ gridColumn: '1 / -1' }}>
            <CardContent sx={{ p: 8, textAlign: 'center', color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Gem style={{ width: '3rem', height: '3rem', marginBottom: '1rem', color: 'rgba(var(--primary-rgb), 0.5)' }} />
                <Typography variant="h6" component="h3" sx={{ fontSize: '1.125rem', fontWeight: 600, color: 'text.primary' }}>
                    Recurso Exclusivo para Assinantes
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', maxWidth: '28rem', mx: 'auto', mt: 2 }}>
                   A funcionalidade de **{featureName}** está disponível apenas em nossos planos de assinatura. Faça o upgrade para desbloquear este e outros recursos inteligentes.
                </Typography>
                <Button sx={{ mt: 6 }} asChild>
                    <Link href="/billing">Ver Planos</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
