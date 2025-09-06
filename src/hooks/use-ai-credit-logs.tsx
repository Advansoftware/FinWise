"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { AICreditLog } from "@/ai/ai-types";

export function useAICreditLogs() {
    const [logs, setLogs] = useState<AICreditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        let isMounted = true;

        async function fetchLogs() {
            if (!user?.uid) {
                setLogs([]);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch(`/api/ai-credit-logs?userId=${user.uid}`);
                
                if (!response.ok) {
                    throw new Error('Erro ao buscar logs de créditos');
                }

                const data = await response.json();
                
                if (isMounted) {
                    setLogs(data.logs || []);
                }
            } catch (err) {
                console.error('Error fetching AI credit logs:', err);
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Erro desconhecido');
                    setLogs([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchLogs();

        return () => {
            isMounted = false;
        };
    }, [user?.uid]);

    return {
        logs,
        isLoading,
        error,
        refetch: () => {
            if (user?.uid) {
                setIsLoading(true);
                // Re-trigger the effect by updating a state value
                setError(null);
            }
        }
    };
}
