'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Gem } from 'lucide-react';
import { useCredits } from '@/hooks/use-credits';
import { usePlan } from '@/hooks/use-plan';
import { Skeleton } from '../ui/skeleton';
import { AICreditStatementDialog } from './ai-credit-statement-dialog';
import { AnimatePresence, motion } from 'framer-motion';

export function AICreditIndicator() {
  const { credits, isLoading: isLoadingCredits, logs } = useCredits();
  const { plan, isLoading: isLoadingPlan } = usePlan();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isLoading = isLoadingCredits || isLoadingPlan;

  if (plan === 'Básico') {
    return null; // Don't show indicator for basic plan users
  }
  
  return (
    <>
      <AICreditStatementDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} logs={logs} />
       <AnimatePresence>
         <motion.div
            className="fixed top-16 right-4 z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
         >
            <Button
                variant="outline"
                className="rounded-full shadow-lg backdrop-blur-sm bg-background/70 hover:bg-background h-11"
                onClick={() => setIsDialogOpen(true)}
            >
                {isLoading ? (
                    <Skeleton className="h-5 w-20" />
                ) : (
                    <>
                        <Sparkles className="h-5 w-5 mr-2 text-primary" />
                        <span className="font-bold text-base">{credits}</span>
                        <span className="text-muted-foreground text-sm ml-1.5">créditos</span>
                    </>
                )}
            </Button>
         </motion.div>
      </AnimatePresence>
    </>
  );
}
