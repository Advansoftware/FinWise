
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gem } from "lucide-react";
import Link from "next/link";

interface ProUpgradeCardProps {
    featureName: string;
}

export function ProUpgradeCard({ featureName }: ProUpgradeCardProps) {
    return (
        <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Gem className="h-12 w-12 mb-4 text-primary/50" />
                <h3 className="text-lg font-semibold text-foreground">
                    Recurso Exclusivo para Assinantes
                </h3>
                <p className="text-sm max-w-md mx-auto mt-2">
                   A funcionalidade de **{featureName}** está disponível apenas nos planos Pro e Plus e consome créditos de IA. Faça o upgrade para desbloquear este e outros recursos inteligentes.
                </p>
                <Button className="mt-6" asChild>
                    <Link href="/billing">Ver Planos</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

    