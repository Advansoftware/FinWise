// src/lib/family-types.ts

/**
 * Modo Família - Tipos e Interfaces
 * 
 * Sistema de compartilhamento para plano Infinity
 * Permite que famílias (ex: casais) compartilhem recursos financeiros
 * mantendo a privacidade individual quando desejado.
 */

// Recursos que podem ser compartilhados
export type ShareableResource =
  | 'wallets'           // Carteiras
  | 'transactions'      // Transações
  | 'budgets'           // Orçamentos
  | 'goals'             // Metas
  | 'installments'      // Parcelamentos
  | 'reports'           // Relatórios
  | 'categories';       // Categorias personalizadas

// Níveis de permissão para recursos compartilhados
export type PermissionLevel =
  | 'none'      // Sem acesso
  | 'view'      // Apenas visualizar
  | 'edit'      // Visualizar e editar
  | 'full';     // Controle total (incluir/excluir)

// Status do membro na família
export type FamilyMemberStatus =
  | 'pending'   // Convite enviado, aguardando aceitação
  | 'active'    // Membro ativo
  | 'suspended' // Suspenso temporariamente
  | 'removed';  // Removido

// Role do membro na família
export type FamilyMemberRole =
  | 'owner'     // Criador da família (plano Infinity)
  | 'admin'     // Administrador (pode gerenciar membros)
  | 'member';   // Membro comum

// Configuração de compartilhamento para cada recurso
export interface ResourceSharingConfig {
  resource: ShareableResource;
  permission: PermissionLevel;
  specificIds?: string[]; // IDs específicos (ex: apenas certas carteiras)
}

// Configurações de privacidade do membro
export interface MemberPrivacySettings {
  // O que este membro compartilha com a família
  sharing: ResourceSharingConfig[];

  // Notificações
  notifyOnFamilyActivity: boolean;
  notifyOnSharedTransactions: boolean;

  // Visibilidade
  showTotalBalance: boolean;    // Mostrar saldo total
  showIndividualItems: boolean; // Mostrar itens individuais
}

// Membro da família
export interface FamilyMember {
  id: string;           // ID único do membro na família
  userId: string;       // ID do usuário no sistema
  email: string;
  displayName: string;
  role: FamilyMemberRole;
  status: FamilyMemberStatus;

  // Configurações de privacidade deste membro
  privacySettings: MemberPrivacySettings;

  // Datas
  invitedAt: string;
  joinedAt?: string;
  removedAt?: string;

  // Quem convidou
  invitedBy: string;
}

// Convite para família
export interface FamilyInvite {
  id: string;
  familyId: string;
  email: string;
  invitedBy: string;
  invitedByName: string;
  role: FamilyMemberRole;
  message?: string;         // Mensagem personalizada
  expiresAt: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

// Família (Workspace compartilhado)
export interface Family {
  id: string;

  // Informações básicas
  name: string;             // Nome da família (ex: "Família Silva")
  description?: string;
  icon?: string;            // Emoji ou URL do ícone

  // Proprietário (quem tem o plano Infinity)
  ownerId: string;
  ownerEmail: string;

  // Membros
  members: FamilyMember[];
  maxMembers: number;       // Limite de membros (baseado no plano)

  // Configurações padrão para novos membros
  defaultSharingConfig: ResourceSharingConfig[];

  // Configurações gerais
  settings: FamilySettings;

  // Datas
  createdAt: string;
  updatedAt: string;
}

// Configurações gerais da família
export interface FamilySettings {
  // Permissões gerais
  allowMembersToInvite: boolean;        // Membros podem convidar outros?
  requireOwnerApproval: boolean;        // Requer aprovação do owner para novos membros?

  // Notificações
  notifyOwnerOnActivity: boolean;
  notifyMembersOnNewMember: boolean;

  // Compartilhamento
  defaultPermissionLevel: PermissionLevel;

  // Limites
  maxSharedWallets: number;
  maxSharedGoals: number;
}

// DTO para criar família
export interface CreateFamilyInput {
  name: string;
  description?: string;
  icon?: string;
  settings?: Partial<FamilySettings>;
}

// DTO para convidar membro
export interface InviteMemberInput {
  familyId: string;
  email: string;
  role?: FamilyMemberRole;
  message?: string;
  defaultSharing?: ResourceSharingConfig[];
}

// DTO para aceitar convite
export interface AcceptInviteInput {
  inviteId: string;
  privacySettings?: Partial<MemberPrivacySettings>;
}

// DTO para atualizar configurações de compartilhamento
export interface UpdateSharingInput {
  familyId: string;
  memberId: string;
  sharing: ResourceSharingConfig[];
}

// Resposta de verificação de acesso
export interface FamilyAccessCheck {
  hasAccess: boolean;
  permission: PermissionLevel;
  isOwner: boolean;
  familyId?: string;
  memberId?: string;
}

// Dados agregados da família (para dashboard)
export interface FamilyDashboardData {
  familyId: string;
  familyName: string;

  // Totais agregados (apenas recursos compartilhados)
  sharedBalance: number;
  sharedIncome: number;
  sharedExpenses: number;

  // Membros ativos
  activeMembers: {
    id: string;
    displayName: string;
    contributedBalance?: number;  // Se configurado para mostrar
  }[];

  // Metas compartilhadas
  sharedGoals: {
    goalId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    contributors: string[];
  }[];

  // Últimas atividades compartilhadas
  recentActivity: FamilyActivityItem[];
}

// Item de atividade da família
export interface FamilyActivityItem {
  id: string;
  type: 'transaction' | 'goal_deposit' | 'budget_update' | 'member_joined' | 'settings_changed';
  memberId: string;
  memberName: string;
  description: string;
  resourceType?: ShareableResource;
  resourceId?: string;
  amount?: number;
  createdAt: string;
}

// Configurações padrão para novo membro
export const DEFAULT_MEMBER_PRIVACY: MemberPrivacySettings = {
  sharing: [
    { resource: 'wallets', permission: 'view' },
    { resource: 'transactions', permission: 'view' },
    { resource: 'budgets', permission: 'view' },
    { resource: 'goals', permission: 'edit' },
    { resource: 'installments', permission: 'view' },
    { resource: 'reports', permission: 'view' },
    { resource: 'categories', permission: 'view' },
  ],
  notifyOnFamilyActivity: true,
  notifyOnSharedTransactions: true,
  showTotalBalance: true,
  showIndividualItems: false,
};

// Configurações padrão da família
export const DEFAULT_FAMILY_SETTINGS: FamilySettings = {
  allowMembersToInvite: false,
  requireOwnerApproval: true,
  notifyOwnerOnActivity: true,
  notifyMembersOnNewMember: true,
  defaultPermissionLevel: 'view',
  maxSharedWallets: 10,
  maxSharedGoals: 5,
};

// Limites baseados no plano
export const FAMILY_LIMITS = {
  Infinity: {
    maxFamilies: 1,      // 1 família por conta Infinity
    maxMembers: 5,       // Até 5 membros (incluindo owner)
    maxSharedWallets: 10,
    maxSharedGoals: 10,
    maxSharedBudgets: 10,
  },
} as const;
