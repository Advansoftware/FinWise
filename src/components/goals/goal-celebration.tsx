// src/components/goals/goal-celebration.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { Goal } from '@/lib/types';

const ConfettiPiece = ({ x, y, rotate, color } : { x: number, y: number, rotate: number, color: string }) => (
    <motion.div
        style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            backgroundColor: color,
            width: '10px',
            height: '10px',
            borderRadius: '50%',
        }}
        initial={{ opacity: 1, y: 0, rotate: 0 }}
        animate={{
            opacity: 0,
            y: 500, // fall distance
            rotate: rotate + 360,
        }}
        transition={{ duration: 2 + Math.random() * 2, ease: 'linear' }}
    />
);

export const GoalCompletionCelebration = ({ goal, onComplete }: { goal: Goal, onComplete: () => void }) => {
    const [confetti, setConfetti] = useState<any[]>([]);

    useEffect(() => {
        const generateConfetti = () => {
            const newConfetti = Array.from({ length: 150 }).map((_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: -10 - Math.random() * 20, // Start from above the screen
                rotate: Math.random() * 360,
                color: ['#a855f7', '#ec4899', '#facc15', '#4ade80'][Math.floor(Math.random() * 4)],
            }));
            setConfetti(newConfetti);
        };

        generateConfetti();
        const timer = setTimeout(onComplete, 4000); // Animation duration
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
                <div className="absolute inset-0 overflow-hidden">
                    {confetti.map(c => <ConfettiPiece key={c.id} {...c} />)}
                </div>
                 <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
                    className="text-center p-8 bg-card rounded-xl shadow-2xl border border-primary/50 max-w-sm mx-auto"
                 >
                    <div className="relative inline-block">
                        <Sparkles className="absolute -top-4 -left-4 h-8 w-8 text-yellow-400 animate-pulse" />
                         <Sparkles className="absolute -bottom-4 -right-4 h-8 w-8 text-pink-500 animate-pulse" style={{ animationDelay: '0.2s' }}/>
                        <Trophy className="h-24 w-24 text-yellow-400" fill="currentColor" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight">Meta Concluída!</h2>
                    <p className="mt-2 text-muted-foreground">Parabéns por alcançar sua meta de <strong className="text-primary/90">"{goal.name}"</strong>!</p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
