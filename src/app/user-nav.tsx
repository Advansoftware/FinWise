
// src/app/user-nav.tsx
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, Gem, UserCircle, LogOut, Trophy, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useGamification } from '@/hooks/use-gamification';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BillingPortalButton } from '@/components/billing/billing-portal-button';
import { usePlan } from '@/hooks/use-plan';

export function UserNav() {
  const { user, logout, loading } = useAuth();
  const { gamificationData, isLoading: isGamificationLoading } = useGamification();
  const { plan } = usePlan();

  if (loading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const levelProgress = gamificationData 
    ? (gamificationData.points / (gamificationData.level.pointsRequired + gamificationData.level.pointsToNext)) * 100
    : 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.displayName || 'Usuário'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'Bem-vindo!'}
            </p>
          </div>
        </DropdownMenuLabel>
        
        {/* Gamification Section */}
        {isGamificationLoading ? (
            <div className="px-2 py-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full mt-2" />
            </div>
        ) : gamificationData && (
            <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-medium">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            Nível {gamificationData.level.level}
                        </div>
                        <span className="text-muted-foreground">{gamificationData.points} pts</span>
                    </div>
                    <Progress value={levelProgress} className="h-1" />
                </div>
            </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </Link>
          </DropdownMenuItem>
           <DropdownMenuItem asChild>
             <Link href="/billing">
                <Gem className="mr-2 h-4 w-4" />
                <span>Assinatura</span>
             </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
            </Link>
          </DropdownMenuItem>
          {plan && plan !== 'Básico' && (
            <BillingPortalButton variant="ghost" size="sm" className="w-full justify-start h-8 px-2">
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>Portal de Faturamento</span>
            </BillingPortalButton>
          )}
        </DropdownMenuGroup>
         <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
