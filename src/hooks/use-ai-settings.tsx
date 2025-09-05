// src/hooks/use-ai-settings.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { AICredential } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getDatabaseAdapter } from "@/services/database/database-service";
import { v4 as uuidv4 } from 'uuid';
import { usePlan } from "./use-plan";

const GASTOMETRIA_AI_CREDENTIAL_ID = 'gastometria-ai-default';

const gastometriaAICredential = {
    id: GASTOMETRIA_AI_CREDENTIAL_ID,
    name: 'Gastometria AI',
    provider: 'gastometria',
    isReadOnly: true,
} as const;


export function useAISettings() {
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const { plan, isPro, isPlus, isInfinity } = usePlan();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [settings, setSettings] = useState<{credentials: AICredential[], activeCredentialId: string | null} | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCredential, setEditingCredential] = useState<AICredential | null>(null);
    const dbAdapter = useMemo(() => getDatabaseAdapter(), []);


    // Function to load settings
    useEffect(() => {
        if (authLoading || !user) {
            setIsLoading(false);
            setSettings(null);
            return;
        }

        setIsLoading(true);
        const unsubscribe = dbAdapter.listenToCollection<{id: string, credentials: AICredential[], activeCredentialId: string | null}>(
          `settings`,
          (settingsData) => {
             const aiSettings = settingsData.find(s => s.id === `ai_${user.uid}`);
             if (aiSettings) {
                setSettings(aiSettings);
             } else {
                 setSettings({ credentials: [], activeCredentialId: GASTOMETRIA_AI_CREDENTIAL_ID });
             }
             setIsLoading(false);
          }
        );
       
        return () => unsubscribe();
    }, [user, authLoading, dbAdapter]);

    const credentials = useMemo(() => settings?.credentials || [], [settings]);
    const activeCredentialId = useMemo(() => settings?.activeCredentialId || GASTOMETRIA_AI_CREDENTIAL_ID, [settings]);

    // Memoize displayed credentials to include the default Gastometria AI and filter based on plan
    const displayedCredentials = useMemo(() => {
        let userCredentials = credentials;
        
        if (isPlus && !isInfinity) { // Plus plan
            userCredentials = credentials.filter(c => c.provider === 'ollama');
        } else if (isPro && !isPlus) { // Pro plan
            userCredentials = [];
        }
        // Infinity plan sees all credentials

        return [gastometriaAICredential, ...userCredentials];
    }, [credentials, isPro, isPlus, isInfinity]);

     // Effect to reset active credential if it's no longer allowed by the current plan
    useEffect(() => {
        if (!user || authLoading) return;
        const activeCredExistsInDisplayed = displayedCredentials.some(c => c.id === activeCredentialId);
        if (!activeCredExistsInDisplayed && activeCredentialId !== GASTOMETRIA_AI_CREDENTIAL_ID) {
            handleActivate(GASTOMETRIA_AI_CREDENTIAL_ID);
        }
    }, [displayedCredentials, activeCredentialId, user, authLoading]);


    // Function to save all settings
    const saveSettings = async (newSettings: {credentials: AICredential[], activeCredentialId: string | null}) => {
        if (!user) {
            toast({ variant: "destructive", title: "Usuário não autenticado." });
            return;
        }
        setIsSaving(true);
        try {
            await dbAdapter.setDoc(`settings/ai_${user.uid}`, newSettings);
            toast({ title: "Configurações de IA salvas!" });
            setSettings(newSettings);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao salvar configurações." });
            throw error; // Re-throw error to be caught by caller
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCredential = async (credentialData: Omit<AICredential, 'id'> & { id?: string }) => {
        const isEditing = !!credentialData.id;
        
        const finalCredential: Partial<AICredential> & { id?: string, name: string, provider: 'ollama' | 'googleai' | 'openai' | 'gastometria' } = {
            id: credentialData.id,
            name: credentialData.name,
            provider: credentialData.provider,
        };

        // Filter properties based on the provider
        if (credentialData.provider === 'ollama') {
            finalCredential.ollamaModel = credentialData.ollamaModel;
            finalCredential.ollamaServerAddress = credentialData.ollamaServerAddress;
        } else if (credentialData.provider === 'googleai') {
            finalCredential.googleAIApiKey = credentialData.googleAIApiKey;
        } else if (credentialData.provider === 'openai') {
            finalCredential.openAIApiKey = credentialData.openAIApiKey;
            finalCredential.openAIModel = credentialData.openAIModel;
        }

        let newCredentials;

        if (isEditing) {
            newCredentials = credentials.map(c => 
                c.id === finalCredential.id ? (finalCredential as AICredential) : c
            );
        } else {
            const newCredential = { ...finalCredential, id: uuidv4() } as AICredential;
            newCredentials = [...credentials, newCredential];
        }

        const newActiveId = activeCredentialId || (newCredentials.length === 1 ? newCredentials[0].id : GASTOMETRIA_AI_CREDENTIAL_ID);
        
        try {
            await saveSettings({ credentials: newCredentials, activeCredentialId: newActiveId });
            setIsDialogOpen(false);
            setEditingCredential(null);
        } catch (error) {
            console.error("Failed to save credential", error);
        }
    };

    const handleDelete = async (id: string) => {
        const newCredentials = credentials.filter(c => c.id !== id);
        let newActiveId = activeCredentialId;
        if (activeCredentialId === id) {
            newActiveId = GASTOMETRIA_AI_CREDENTIAL_ID; // Fallback to default
        }
        
        try {
            await saveSettings({ credentials: newCredentials, activeCredentialId: newActiveId });
        } catch (error) {
            console.error("Failed to delete credential", error);
        }
    };

    const handleActivate = async (id: string) => {
        try {
            await saveSettings({ credentials, activeCredentialId: id });
        } catch (error) {
            console.error("Failed to activate credential", error);
        }
    };

    const handleOpenDialog = (credential: AICredential | null) => {
        setEditingCredential(credential);
        setIsDialogOpen(true);
    };

    return {
        isLoading: isLoading || authLoading,
        isSaving,
        credentials, // User-defined credentials
        displayedCredentials, // All credentials including Gastometria AI
        activeCredentialId,
        handleSaveCredential,
        handleDelete,
        handleActivate,
        isDialogOpen,
        setIsDialogOpen,
        editingCredential,
        handleOpenDialog,
    };
}
