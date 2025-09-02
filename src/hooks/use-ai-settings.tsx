

// src/hooks/use-ai-settings.tsx
'use client';

import { useEffect, useState, useCallback } from "react";
import { AICredential } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getFirebase } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';

export function useAISettings() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [credentials, setCredentials] = useState<AICredential[]>([]);
    const [activeCredentialId, setActiveCredentialId] = useState<string | null>(null);

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
                setActiveCredentialId(settings.activeCredentialId || null);
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
                credentials: newCredentials,
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
        
        const finalCredential: Partial<AICredential> & { id?: string, name: string, provider: 'ollama' | 'googleai' | 'openai' } = {
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

        const newActiveId = activeCredentialId || (newCredentials.length === 1 ? newCredentials[0].id : null);
        
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
            newActiveId = newCredentials.length > 0 ? newCredentials[0].id : null;
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
                setCredentials(result.savedCredentials);
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
        credentials,
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
