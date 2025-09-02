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
            return;
        }
        setIsSaving(true);
        try {
            const { db } = getFirebase();
            const settingsRef = doc(db, "users", user.uid, "settings", "ai");
            await setDoc(settingsRef, {
                credentials: newCredentials,
                activeCredentialId: newActiveId,
            }, { merge: true });

            setCredentials(newCredentials);
            setActiveCredentialId(newActiveId);

            toast({ title: "Configurações de IA salvas!" });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao salvar configurações." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCredential = async (credentialData: Omit<AICredential, 'id'>) => {
        const isEditing = editingCredential !== null;
        let newCredentials = [...credentials];
        let newActiveId = activeCredentialId;

        if (isEditing) {
            newCredentials = credentials.map(c => 
                c.id === editingCredential.id ? { ...credentialData, id: c.id } : c
            );
        } else {
            const newCredential = { ...credentialData, id: uuidv4() };
            newCredentials.push(newCredential);
            // If it's the first credential being added, make it active.
            if (credentials.length === 0) {
                newActiveId = newCredential.id;
            }
        }
        await saveSettings(newCredentials, newActiveId);
        setIsDialogOpen(false);
        setEditingCredential(null);
    };

    const handleDelete = async (id: string) => {
        const newCredentials = credentials.filter(c => c.id !== id);
        let newActiveId = activeCredentialId;
        if (activeCredentialId === id) {
            // If the deleted credential was active, set the first one as active, or null if none are left.
            newActiveId = newCredentials.length > 0 ? newCredentials[0].id : null;
        }
        await saveSettings(newCredentials, newActiveId);
    };

    const handleActivate = async (id: string) => {
        await saveSettings(credentials, id);
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
