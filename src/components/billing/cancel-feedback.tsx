
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { HeartCrack, Frown } from 'lucide-react';

export const CancelFeedback = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => {
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
                 <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
                    className="text-center p-8 bg-card rounded-xl shadow-2xl border border-destructive/50 max-w-sm mx-auto"
                 >
                    <motion.div
                        initial={{ rotate: -15 }}
                        animate={{ rotate: [15, -15] }}
                        transition={{
                            repeat: Infinity,
                            repeatType: "mirror",
                            duration: 2,
                            ease: 'easeInOut'
                        }}
                    >
                        <Frown className="h-24 w-24 text-destructive/80 mx-auto" />
                    </motion.div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight">Que pena!</h2>
                    <p className="mt-2 text-muted-foreground">Ocorreu algum problema? Seu feedback é importante para nós. Se precisar de ajuda, não hesite em contatar o suporte.</p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
