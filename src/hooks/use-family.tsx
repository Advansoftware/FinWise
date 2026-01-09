// src/hooks/use-family.tsx

/**
 * Hook useFamily - Gerenciamento do Modo Família
 *
 * Provê contexto e ações para gerenciar famílias,
 * membros, convites e compartilhamento de recursos.
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { useAuth } from "./use-auth";
import { usePlan } from "./use-plan";
import { useToast } from "./use-toast";
import {
  Family,
  FamilyMember,
  FamilyInvite,
  CreateFamilyInput,
  InviteMemberInput,
  ResourceSharingConfig,
  ShareableResource,
  PermissionLevel,
  FamilyMemberRole,
  MemberPrivacySettings,
} from "@/lib/family-types";

interface FamilyContextType {
  // Estado
  family: Family | null;
  isLoading: boolean;
  pendingInvites: FamilyInvite[];

  // Flags
  isInFamily: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  canInvite: boolean;
  canManageMembers: boolean;

  // Membro atual
  currentMember: FamilyMember | null;

  // Ações - Família
  createFamily: (data: CreateFamilyInput) => Promise<Family | null>;
  updateFamily: (data: Partial<Family>) => Promise<boolean>;
  deleteFamily: () => Promise<boolean>;
  refreshFamily: () => Promise<void>;

  // Ações - Convites
  inviteMember: (
    data: Omit<InviteMemberInput, "familyId">
  ) => Promise<FamilyInvite | null>;
  acceptInvite: (
    inviteId: string,
    privacySettings?: Partial<MemberPrivacySettings>
  ) => Promise<boolean>;
  declineInvite: (inviteId: string) => Promise<boolean>;
  cancelInvite: (inviteId: string) => Promise<boolean>;
  loadPendingInvites: () => Promise<void>;

  // Ações - Membros
  removeMember: (memberId: string) => Promise<boolean>;
  leaveFamily: () => Promise<boolean>;
  updateMemberRole: (
    memberId: string,
    role: FamilyMemberRole
  ) => Promise<boolean>;
  updateMySharing: (sharing: ResourceSharingConfig[]) => Promise<boolean>;

  // Utilitários
  getMemberById: (memberId: string) => FamilyMember | undefined;
  getMemberByUserId: (userId: string) => FamilyMember | undefined;
  canAccessResource: (
    resourceType: ShareableResource,
    permission?: PermissionLevel
  ) => boolean;
}

const FamilyContext = createContext<FamilyContextType | null>(null);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isInfinity } = usePlan();
  const { toast } = useToast();

  const [family, setFamily] = useState<Family | null>(null);
  const [pendingInvites, setPendingInvites] = useState<FamilyInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar família do usuário
  const loadFamily = useCallback(async () => {
    if (!user?.uid) {
      setFamily(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/family?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setFamily(data.family);
      } else {
        setFamily(null);
      }
    } catch (error) {
      console.error("Erro ao carregar família:", error);
      setFamily(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Carregar convites pendentes para o usuário
  const loadPendingInvites = useCallback(async () => {
    if (!user?.email || !user?.uid) {
      setPendingInvites([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/family/invites?userId=${
          user.uid
        }&forUser=true&email=${encodeURIComponent(user.email)}`
      );
      if (response.ok) {
        const data = await response.json();
        setPendingInvites(data.invites || []);
      }
    } catch (error) {
      console.error("Erro ao carregar convites:", error);
    }
  }, [user?.email, user?.uid]);

  // Carregar dados iniciais
  useEffect(() => {
    if (!authLoading) {
      loadFamily();
      loadPendingInvites();
    }
  }, [authLoading, loadFamily, loadPendingInvites]);

  // Membro atual
  const currentMember = useMemo(() => {
    if (!family || !user?.uid) return null;
    return (
      family.members.find(
        (m) => m.userId === user.uid && m.status === "active"
      ) || null
    );
  }, [family, user?.uid]);

  // Flags de permissão
  const isInFamily = !!currentMember;
  const isOwner = currentMember?.role === "owner";
  const isAdmin = currentMember?.role === "admin" || isOwner;
  const canInvite =
    isOwner || isAdmin || (family?.settings.allowMembersToInvite ?? false);
  const canManageMembers = isOwner || isAdmin;

  // ==========================================
  // Ações - Família
  // ==========================================

  const createFamily = useCallback(
    async (data: CreateFamilyInput): Promise<Family | null> => {
      if (!isInfinity) {
        toast({
          title: "Plano não suportado",
          description:
            "Modo Família está disponível apenas para assinantes Infinity",
          variant: "error",
        });
        return null;
      }

      try {
        const response = await fetch(`/api/family?userId=${user?.uid}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          toast({
            title: "Erro ao criar família",
            description: result.error,
            variant: "error",
          });
          return null;
        }

        setFamily(result.family);
        toast({
          title: "Família criada!",
          description: `"${result.family.name}" foi criada com sucesso.`,
        });
        return result.family;
      } catch (error) {
        console.error("Erro ao criar família:", error);
        toast({
          title: "Erro",
          description: "Não foi possível criar a família",
          variant: "error",
        });
        return null;
      }
    },
    [isInfinity, toast, user?.uid]
  );

  const updateFamily = useCallback(
    async (data: Partial<Family>): Promise<boolean> => {
      if (!family) return false;

      try {
        const response = await fetch(`/api/family?userId=${user?.uid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ familyId: family.id, ...data }),
        });

        if (!response.ok) {
          const result = await response.json();
          toast({
            title: "Erro ao atualizar",
            description: result.error,
            variant: "error",
          });
          return false;
        }

        await loadFamily();
        toast({ title: "Família atualizada!" });
        return true;
      } catch (error) {
        console.error("Erro ao atualizar família:", error);
        return false;
      }
    },
    [family, loadFamily, toast, user?.uid]
  );

  const deleteFamily = useCallback(async (): Promise<boolean> => {
    if (!family || !isOwner) return false;

    try {
      const response = await fetch(
        `/api/family?userId=${user?.uid}&familyId=${family.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const result = await response.json();
        toast({
          title: "Erro ao excluir",
          description: result.error,
          variant: "error",
        });
        return false;
      }

      setFamily(null);
      toast({ title: "Família excluída" });
      return true;
    } catch (error) {
      console.error("Erro ao excluir família:", error);
      return false;
    }
  }, [family, isOwner, toast, user?.uid]);

  const refreshFamily = useCallback(async () => {
    await loadFamily();
  }, [loadFamily]);

  // ==========================================
  // Ações - Convites
  // ==========================================

  const inviteMember = useCallback(
    async (
      data: Omit<InviteMemberInput, "familyId">
    ): Promise<FamilyInvite | null> => {
      if (!family || !canInvite) return null;

      try {
        const response = await fetch(
          `/api/family/invites?userId=${user?.uid}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, familyId: family.id }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          toast({
            title: "Erro ao convidar",
            description: result.error,
            variant: "error",
          });
          return null;
        }

        toast({
          title: "Convite enviado!",
          description: `Convite enviado para ${data.email}`,
        });
        return result.invite;
      } catch (error) {
        console.error("Erro ao convidar:", error);
        return null;
      }
    },
    [family, canInvite, toast, user?.uid]
  );

  const acceptInvite = useCallback(
    async (
      inviteId: string,
      privacySettings?: Partial<MemberPrivacySettings>
    ): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/family/invites/${inviteId}?userId=${user?.uid}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "accept", privacySettings }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          toast({
            title: "Erro ao aceitar convite",
            description: result.error,
            variant: "error",
          });
          return false;
        }

        setFamily(result.family);
        setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
        toast({
          title: "Bem-vindo à família!",
          description: `Você agora faz parte de "${result.family.name}"`,
        });
        return true;
      } catch (error) {
        console.error("Erro ao aceitar convite:", error);
        return false;
      }
    },
    [toast, user?.uid]
  );

  const declineInvite = useCallback(
    async (inviteId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/family/invites/${inviteId}?userId=${user?.uid}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "decline" }),
          }
        );

        if (!response.ok) {
          return false;
        }

        setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
        toast({ title: "Convite recusado" });
        return true;
      } catch (error) {
        console.error("Erro ao recusar convite:", error);
        return false;
      }
    },
    [toast, user?.uid]
  );

  const cancelInvite = useCallback(
    async (inviteId: string): Promise<boolean> => {
      if (!canManageMembers) return false;

      try {
        const response = await fetch(
          `/api/family/invites/${inviteId}?userId=${user?.uid}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          return false;
        }

        toast({ title: "Convite cancelado" });
        return true;
      } catch (error) {
        console.error("Erro ao cancelar convite:", error);
        return false;
      }
    },
    [canManageMembers, toast, user?.uid]
  );

  // ==========================================
  // Ações - Membros
  // ==========================================

  const removeMember = useCallback(
    async (memberId: string): Promise<boolean> => {
      if (!family || !canManageMembers) return false;

      try {
        const response = await fetch(
          `/api/family/members?userId=${user?.uid}&familyId=${family.id}&memberId=${memberId}&action=remove`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          const result = await response.json();
          toast({
            title: "Erro ao remover membro",
            description: result.error,
            variant: "error",
          });
          return false;
        }

        await loadFamily();
        toast({ title: "Membro removido" });
        return true;
      } catch (error) {
        console.error("Erro ao remover membro:", error);
        return false;
      }
    },
    [family, canManageMembers, loadFamily, toast, user?.uid]
  );

  const leaveFamily = useCallback(async (): Promise<boolean> => {
    if (!family) return false;

    try {
      const response = await fetch(
        `/api/family/members?userId=${user?.uid}&familyId=${family.id}&action=leave`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao sair",
          description: result.error,
          variant: "error",
        });
        return false;
      }

      setFamily(null);
      toast({ title: "Você saiu da família" });
      return true;
    } catch (error) {
      console.error("Erro ao sair da família:", error);
      return false;
    }
  }, [family, toast, user?.uid]);

  const updateMemberRole = useCallback(
    async (memberId: string, role: FamilyMemberRole): Promise<boolean> => {
      if (!family || !isOwner) return false;

      try {
        const response = await fetch(
          `/api/family/members?userId=${user?.uid}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              familyId: family.id,
              memberId,
              action: "updateRole",
              role,
            }),
          }
        );

        if (!response.ok) {
          const result = await response.json();
          toast({
            title: "Erro ao atualizar função",
            description: result.error,
            variant: "error",
          });
          return false;
        }

        await loadFamily();
        toast({ title: "Função atualizada" });
        return true;
      } catch (error) {
        console.error("Erro ao atualizar função:", error);
        return false;
      }
    },
    [family, isOwner, loadFamily, toast, user?.uid]
  );

  const updateMySharing = useCallback(
    async (sharing: ResourceSharingConfig[]): Promise<boolean> => {
      if (!family || !currentMember) return false;

      try {
        const response = await fetch(
          `/api/family/members?userId=${user?.uid}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              familyId: family.id,
              memberId: currentMember.id,
              action: "updateSharing",
              sharing,
            }),
          }
        );

        if (!response.ok) {
          const result = await response.json();
          toast({
            title: "Erro ao atualizar compartilhamento",
            description: result.error,
            variant: "error",
          });
          return false;
        }

        await loadFamily();
        toast({ title: "Configurações atualizadas" });
        return true;
      } catch (error) {
        console.error("Erro ao atualizar compartilhamento:", error);
        return false;
      }
    },
    [family, currentMember, loadFamily, toast, user?.uid]
  );

  // ==========================================
  // Utilitários
  // ==========================================

  const getMemberById = useCallback(
    (memberId: string): FamilyMember | undefined => {
      return family?.members.find((m) => m.id === memberId);
    },
    [family]
  );

  const getMemberByUserId = useCallback(
    (userId: string): FamilyMember | undefined => {
      return family?.members.find(
        (m) => m.userId === userId && m.status === "active"
      );
    },
    [family]
  );

  const canAccessResource = useCallback(
    (
      resourceType: ShareableResource,
      permission: PermissionLevel = "view"
    ): boolean => {
      if (!currentMember) return false;

      const sharingConfig = currentMember.privacySettings.sharing.find(
        (s) => s.resource === resourceType
      );

      if (!sharingConfig) return false;

      const levels: Record<PermissionLevel, number> = {
        none: 0,
        view: 1,
        edit: 2,
        full: 3,
      };

      return levels[sharingConfig.permission] >= levels[permission];
    },
    [currentMember]
  );

  // ==========================================
  // Contexto
  // ==========================================

  const value: FamilyContextType = {
    // Estado
    family,
    isLoading,
    pendingInvites,

    // Flags
    isInFamily,
    isOwner,
    isAdmin,
    canInvite,
    canManageMembers,

    // Membro atual
    currentMember,

    // Ações - Família
    createFamily,
    updateFamily,
    deleteFamily,
    refreshFamily,

    // Ações - Convites
    inviteMember,
    acceptInvite,
    declineInvite,
    cancelInvite,
    loadPendingInvites,

    // Ações - Membros
    removeMember,
    leaveFamily,
    updateMemberRole,
    updateMySharing,

    // Utilitários
    getMemberById,
    getMemberByUserId,
    canAccessResource,
  };

  return (
    <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error("useFamily deve ser usado dentro de um FamilyProvider");
  }
  return context;
}

// Hook para verificar se feature está disponível para família
export function useFamilyFeature() {
  const { isInfinity } = usePlan();
  const { isInFamily, family } = useFamily();

  return {
    isFamilyFeatureAvailable: isInfinity,
    isInFamily,
    familyName: family?.name,
    memberCount:
      family?.members.filter((m) => m.status === "active").length ?? 0,
    maxMembers: family?.maxMembers ?? 5,
  };
}
