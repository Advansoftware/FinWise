// src/components/goals/goal-celebration.tsx
'use client';

import {motion, AnimatePresence} from 'framer-motion';
import {useEffect, useState} from 'react';
import {Trophy, Sparkles} from 'lucide-react';
import {Goal} from '@/lib/types';
import {Box, Typography, Button} from '@mui/material';

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
            pointerEvents: 'none',
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
    const [isVisible, setIsVisible] = useState(true);

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
        const timer = setTimeout(() => {
            setIsVisible(false);
            onComplete();
        }, 4000); // Animation duration
        return () => clearTimeout(timer);
    }, [onComplete]);

    const handleClose = () => {
        setIsVisible(false);
        onComplete();
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <Box
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                sx={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    cursor: 'pointer',
                }}
            >
                <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    {confetti.map(c => <ConfettiPiece key={c.id} {...c} />)}
                </Box>
                 <Box
                    component={motion.div}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        textAlign: 'center',
                        p: 4,
                        bgcolor: 'background.paper',
                        borderRadius: '0.75rem',
                        boxShadow: 24,
                        border: theme => `1px solid ${theme.palette.primary.main}80`,
                        maxWidth: '24rem',
                        mx: 'auto',
                        cursor: 'default',
                    }}
                 >
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Sparkles style={{ position: 'absolute', top: '-1rem', left: '-1rem', width: '2rem', height: '2rem', color: '#facc15', animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                         <Sparkles style={{ position: 'absolute', bottom: '-1rem', right: '-1rem', width: '2rem', height: '2rem', color: '#ec4899', animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '0.2s' }}/>
                        <Trophy style={{ width: '6rem', height: '6rem', color: '#facc15' }} fill="currentColor" />
                    </Box>
                    <Typography variant="h4" sx={{ mt: 3, fontWeight: 'bold', letterSpacing: '-0.025em' }}>Meta Concluída!</Typography>
                    <Typography sx={{ mt: 1, color: theme => (theme.palette as any).custom?.mutedForeground }}>
                        Parabéns por alcançar sua meta de <Box component="strong" sx={{ color: theme => `${theme.palette.primary.main}e6` }}>"{goal.name}"</Box>!
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={handleClose}
                        sx={{ mt: 3 }}
                    >
                        Continuar 🎉
                    </Button>
                </Box>
            </Box>
        </AnimatePresence>
    );
};
