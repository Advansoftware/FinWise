// src/hooks/use-ai-settings.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { AICredential } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getFirebase } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { usePlan } from "./use-plan";

const FINWISE_AI_CREDENTIAL_ID = 'finwise-ai-default';

const finwiseAICredential = {
    id: FINWISE_AI_CREDENTIAL_ID,
    name: 'FinWise AI',
    provider: 'finwise',
    isReadOnly: true,
} as const;


export function useAISettings() {
    const { toast } = useToast();
    const { user } = useAuth();
    const { plan, isPro, isPlus, isInfinity } = usePlan();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [credentials, setCredentials] = useState<AICredential[]>([]);
    const [activeCredentialId, setActiveCredentialId] = useState<string | null>(FINWISE_AI_CREDENTIAL_ID);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCredential, setEditingCredential] = useState<AICredential | null>(null);

    // Function to load settings from Firestore
    const loadSettings = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const { db } = getFirebase();
        const settingsRef = doc(db, "users", user.uid, "settings", "ai");

        try {
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists()) {
                const settings = docSnap.data();
                setCredentials(settings.credentials || []);
                setActiveCredentialId(settings.activeCredentialId || FINWISE_AI_CREDENTIAL_ID);
            } else {
                 // Set default active credential if none exists
                 setActiveCredentialId(FINWISE_AI_CREDENTIAL_ID);
            }
        } catch (error) {
            console.error("Failed to load AI settings:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Carregar Configurações",
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Memoize displayed credentials to include the default FinWise AI and filter based on plan
    const displayedCredentials = useMemo(() => {
        let userCredentials = credentials;
        
        if (isPlus && !isInfinity) { // Plus plan
            userCredentials = credentials.filter(c => c.provider === 'ollama');
        } else if (isPro && !isPlus) { // Pro plan
            userCredentials = [];
        }
        // Infinity plan sees all credentials

        return [finwiseAICredential, ...userCredentials];
    }, [credentials, isPro, isPlus, isInfinity]);

     // Effect to reset active credential if it's no longer allowed by the current plan
    useEffect(() => {
        const activeCredExistsInDisplayed = displayedCredentials.some(c => c.id === activeCredentialId);
        if (!activeCredExistsInDisplayed && activeCredentialId !== FINWISE_AI_CREDENTIAL_ID) {
            handleActivate(FINWISE_AI_CREDENTIAL_ID);
        }
    }, [displayedCredentials, activeCredentialId]);


    // Function to save all settings to Firestore
    const saveSettings = async (newCredentials: AICredential[], newActiveId: string | null) => {
        if (!user) {
            toast({ variant: "destructive", title: "Usuário não autenticado." });
            return null;
        }
        setIsSaving(true);
        try {
            const { db } = getFirebase();
            const settingsRef = doc(db, "users", user.uid, "settings", "ai");
            await setDoc(settingsRef, {
                credentials: newCredentials, // Store only user-defined credentials
                activeCredentialId: newActiveId,
            }, { merge: true });

            toast({ title: "Configurações de IA salvas!" });
            return { savedCredentials: newCredentials, savedActiveId: newActiveId };

        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao salvar configurações." });
            throw error; // Re-throw error to be caught by caller
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCredential = async (credentialData: Omit<AICredential, 'id'> & { id?: string }) => {
        const isEditing = !!credentialData.id;
        
        const finalCredential: Partial<AICredential> & { id?: string, name: string, provider: 'ollama' | 'googleai' | 'openai' | 'finwise' } = {
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

        const newActiveId = activeCredentialId || (newCredentials.length === 1 ? newCredentials[0].id : FINWISE_AI_CREDENTIAL_ID);
        
        try {
            const result = await saveSettings(newCredentials, newActiveId);
            if (result) {
                setCredentials(result.savedCredentials);
                setActiveCredentialId(result.savedActiveId);
                setIsDialogOpen(false);
                setEditingCredential(null);
            }
        } catch (error) {
            console.error("Failed to save credential", error);
        }
    };

    const handleDelete = async (id: string) => {
        const newCredentials = credentials.filter(c => c.id !== id);
        let newActiveId = activeCredentialId;
        if (activeCredentialId === id) {
            newActiveId = FINWISE_AI_CREDENTIAL_ID; // Fallback to default
        }
        
        try {
            const result = await saveSettings(newCredentials, newActiveId);
            if (result) {
                setCredentials(result.savedCredentials);
                setActiveCredentialId(result.savedActiveId);
            }
        } catch (error) {
            console.error("Failed to delete credential", error);
        }
    };

    const handleActivate = async (id: string) => {
        try {
            const result = await saveSettings(credentials, id);
            if (result) {
                setActiveCredentialId(result.savedActiveId);
            }
        } catch (error) {
            console.error("Failed to activate credential", error);
        }
    };

    const handleOpenDialog = (credential: AICredential | null) => {
        setEditingCredential(credential);
        setIsDialogOpen(true);
    };

    return {
        isLoading,
        isSaving,
        credentials, // User-defined credentials
        displayedCredentials, // All credentials including FinWise AI
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
