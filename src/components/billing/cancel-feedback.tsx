
'use client';

import {motion, AnimatePresence} from 'framer-motion';
import {useEffect} from 'react';
import {HeartCrack, Frown} from 'lucide-react';
import {Box, Typography} from '@mui/material';

export const CancelFeedback = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 4000); // Animation duration
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            <Box
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                sx={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)'
                }}
            >
                 <Box
                    component={motion.div}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
                    sx={{
                        textAlign: 'center',
                        p: 4,
                        bgcolor: 'background.paper',
                        borderRadius: '0.75rem',
                        boxShadow: 24,
                        border: theme => `1px solid ${theme.palette.error.main}80`,
                        maxWidth: '24rem',
                        mx: 'auto'
                    }}
                 >
                    <Box
                        component={motion.div}
                        initial={{ rotate: -15 }}
                        animate={{ rotate: [15, -15] }}
                        transition={{
                            repeat: Infinity,
                            repeatType: "mirror",
                            duration: 2,
                            ease: 'easeInOut'
                        }}
                    >
                        <Frown style={{ width: '6rem', height: '6rem', margin: '0 auto', color: 'rgba(244, 63, 94, 0.8)' }} />
                    </Box>
                    <Typography variant="h4" sx={{ mt: 3, fontWeight: 'bold', letterSpacing: '-0.025em' }}>Que pena!</Typography>
                    <Typography sx={{ mt: 1, color: theme => (theme.palette as any).custom?.mutedForeground }}>
                        Ocorreu algum problema? Seu feedback é importante para nós. Se precisar de ajuda, não hesite em contatar o suporte.
                    </Typography>
                </Box>
            </Box>
        </AnimatePresence>
    );
};
