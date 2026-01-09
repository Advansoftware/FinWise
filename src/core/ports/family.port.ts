// src/core/ports/family.port.ts

/**
 * Family Port - Interface para o serviço de Modo Família
 * 
 * Define as operações disponíveis para gerenciar famílias/workspaces
 * compartilhados entre usuários do plano Infinity.
 */

import {
  Family,
  FamilyMember,
  FamilyInvite,
  CreateFamilyInput,
  InviteMemberInput,
  AcceptInviteInput,
  UpdateSharingInput,
  FamilyAccessCheck,
  FamilyDashboardData,
  FamilyActivityItem,
  ResourceSharingConfig,
  ShareableResource,
  PermissionLevel,
  FamilyMemberRole,
} from '@/lib/family-types';

export interface IFamilyService {
  // ==========================================
  // Gerenciamento de Família
  // ==========================================

  /**
   * Cria uma nova família (apenas usuários Infinity)
   */
  createFamily(userId: string, data: CreateFamilyInput): Promise<Family>;

  /**
   * Obtém uma família pelo ID
   */
  getFamily(familyId: string): Promise<Family | null>;

  /**
   * Obtém a família do usuário (se existir)
   */
  getUserFamily(userId: string): Promise<Family | null>;

  /**
   * Atualiza informações da família
   */
  updateFamily(familyId: string, userId: string, data: Partial<Family>): Promise<Family>;

  /**
   * Remove/desativa uma família (apenas owner)
   */
  deleteFamily(familyId: string, userId: string): Promise<boolean>;

  // ==========================================
  // Convites e Membros
  // ==========================================

  /**
   * Convida um usuário para a família
   */
  inviteMember(userId: string, data: InviteMemberInput): Promise<FamilyInvite>;

  /**
   * Lista convites pendentes de uma família
   */
  getPendingInvites(familyId: string): Promise<FamilyInvite[]>;

  /**
   * Lista convites pendentes para um email
   */
  getUserPendingInvites(email: string): Promise<FamilyInvite[]>;

  /**
   * Aceita um convite
   */
  acceptInvite(userId: string, data: AcceptInviteInput): Promise<Family>;

  /**
   * Recusa um convite
   */
  declineInvite(userId: string, inviteId: string): Promise<boolean>;

  /**
   * Cancela um convite (owner/admin)
   */
  cancelInvite(userId: string, inviteId: string): Promise<boolean>;

  /**
   * Remove um membro da família
   */
  removeMember(familyId: string, userId: string, memberId: string): Promise<boolean>;

  /**
   * Membro sai da família voluntariamente
   */
  leaveFamily(familyId: string, userId: string): Promise<boolean>;

  /**
   * Atualiza role de um membro
   */
  updateMemberRole(
    familyId: string,
    userId: string,
    memberId: string,
    role: FamilyMemberRole
  ): Promise<FamilyMember>;

  // ==========================================
  // Compartilhamento e Privacidade
  // ==========================================

  /**
   * Atualiza configurações de compartilhamento de um membro
   */
  updateSharing(userId: string, data: UpdateSharingInput): Promise<FamilyMember>;

  /**
   * Obtém configurações de compartilhamento de um membro
   */
  getMemberSharing(familyId: string, memberId: string): Promise<ResourceSharingConfig[]>;

  /**
   * Verifica se usuário tem acesso a um recurso específico
   */
  checkResourceAccess(
    userId: string,
    resourceType: ShareableResource,
    resourceId: string,
    requiredPermission: PermissionLevel
  ): Promise<FamilyAccessCheck>;

  /**
   * Lista recursos compartilhados de um tipo específico
   */
  getSharedResources(
    familyId: string,
    userId: string,
    resourceType: ShareableResource
  ): Promise<string[]>; // IDs dos recursos

  // ==========================================
  // Dashboard e Dados Agregados
  // ==========================================

  /**
   * Obtém dados agregados do dashboard familiar
   */
  getFamilyDashboard(familyId: string, userId: string): Promise<FamilyDashboardData>;

  /**
   * Lista atividades recentes da família
   */
  getFamilyActivity(
    familyId: string,
    userId: string,
    limit?: number
  ): Promise<FamilyActivityItem[]>;

  /**
   * Registra uma atividade na família
   */
  logActivity(
    familyId: string,
    activity: Omit<FamilyActivityItem, 'id' | 'createdAt'>
  ): Promise<FamilyActivityItem>;

  // ==========================================
  // Validações
  // ==========================================

  /**
   * Verifica se usuário pode criar uma família
   */
  canCreateFamily(userId: string): Promise<{ canCreate: boolean; reason?: string }>;

  /**
   * Verifica se usuário é membro de alguma família
   */
  isFamilyMember(userId: string): Promise<boolean>;

  /**
   * Verifica se usuário é owner de uma família
   */
  isFamilyOwner(userId: string, familyId?: string): Promise<boolean>;
}

// Erros específicos do módulo Family
export class FamilyError extends Error {
  constructor(
    message: string,
    public code: FamilyErrorCode,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'FamilyError';
  }
}

export type FamilyErrorCode =
  | 'PLAN_NOT_ALLOWED'      // Plano não permite criar família
  | 'ALREADY_HAS_FAMILY'    // Já possui uma família
  | 'FAMILY_NOT_FOUND'      // Família não encontrada
  | 'NOT_FAMILY_MEMBER'     // Não é membro da família
  | 'NOT_AUTHORIZED'        // Sem permissão para ação
  | 'MEMBER_LIMIT_REACHED'  // Limite de membros atingido
  | 'INVITE_NOT_FOUND'      // Convite não encontrado
  | 'INVITE_EXPIRED'        // Convite expirado
  | 'ALREADY_MEMBER'        // Já é membro
  | 'CANNOT_REMOVE_OWNER'   // Não pode remover owner
  | 'INVALID_EMAIL'         // Email inválido
  | 'SELF_INVITE'           // Não pode convidar a si mesmo
  | 'RESOURCE_NOT_SHARED';  // Recurso não compartilhado
