// src/components/goals/goal-celebration.tsx
'use client';

import { useEffect, useState } from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { Goal } from '@/lib/types';
import { Box, Typography, Button, Dialog, DialogContent, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export const GoalCompletionCelebration = ({ goal, onComplete }: { goal: Goal, onComplete: () => void }) => {
    const [open, setOpen] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        if (open) {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.8 },
                    colors: ['#a855f7', '#ec4899', '#facc15', '#4ade80']
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.8 },
                    colors: ['#a855f7', '#ec4899', '#facc15', '#4ade80']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [open]);

    const handleClose = () => {
        setOpen(false);
        setTimeout(onComplete, 300); // Wait for animation
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    overflow: 'visible',
                    background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                        : 'linear-gradient(135deg, #fff 0%, #f3f4f6 100%)',
                    border: `1px solid ${theme.palette.primary.main}40`,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }
            }}
        >
            <DialogContent sx={{ p: 4, textAlign: 'center', position: 'relative', overflow: 'visible' }}>
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                        <Box
                            sx={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                bgcolor: 'rgba(250, 204, 21, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto'
                            }}
                        >
                            <Trophy size={64} color="#facc15" />
                        </Box>
                    </motion.div>
                    
                    <Box component={motion.div} 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                        sx={{ position: 'absolute', top: -10, right: -10 }}
                    >
                        <Sparkles size={24} color="#ec4899" />
                    </Box>
                    <Box component={motion.div} 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                        sx={{ position: 'absolute', bottom: -10, left: -10 }}
                    >
                        <Sparkles size={24} color="#a855f7" />
                    </Box>
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Meta Concluída!
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Parabéns! Você alcançou sua meta <Box component="span" fontWeight="bold" color="text.primary">"{goal.name}"</Box>.
                </Typography>

                <Button
                    variant="contained"
                    size="large"
                    onClick={handleClose}
                    fullWidth
                    sx={{
                        borderRadius: 3,
                        py: 1.5,
                        fontWeight: 'bold',
                        background: 'linear-gradient(to right, #a855f7, #ec4899)',
                        boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.3)',
                        '&:hover': {
                            background: 'linear-gradient(to right, #9333ea, #db2777)',
                        }
                    }}
                >
                    Continuar 🎉
                </Button>
            </DialogContent>
        </Dialog>
    );
};
