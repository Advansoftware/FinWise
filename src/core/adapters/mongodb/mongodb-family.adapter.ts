// src/core/adapters/mongodb/mongodb-family.adapter.ts

/**
 * MongoDB Family Adapter
 * 
 * Implementação do serviço de Modo Família usando MongoDB.
 * Gerencia famílias, membros, convites e compartilhamento de recursos.
 */

import { Collection, Db, ObjectId } from 'mongodb';
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
  DEFAULT_MEMBER_PRIVACY,
  DEFAULT_FAMILY_SETTINGS,
  FAMILY_LIMITS,
} from '@/lib/family-types';
import { IFamilyService, FamilyError, FamilyErrorCode } from '@/core/ports/family.port';

// Tipos internos do MongoDB
interface FamilyDocument extends Omit<Family, 'id'> {
  _id?: ObjectId;
}

interface FamilyInviteDocument extends Omit<FamilyInvite, 'id'> {
  _id?: ObjectId;
}

interface FamilyActivityDocument extends Omit<FamilyActivityItem, 'id'> {
  _id?: ObjectId;
  familyId: string;
}

export class MongoDBFamilyService implements IFamilyService {
  private familyCollection: Collection<FamilyDocument>;
  private inviteCollection: Collection<FamilyInviteDocument>;
  private activityCollection: Collection<FamilyActivityDocument>;
  private usersCollection: Collection<any>;

  constructor(private db: Db) {
    this.familyCollection = db.collection<FamilyDocument>('families');
    this.inviteCollection = db.collection<FamilyInviteDocument>('family_invites');
    this.activityCollection = db.collection<FamilyActivityDocument>('family_activities');
    this.usersCollection = db.collection('users');
  }

  // ==========================================
  // Helpers
  // ==========================================

  private docToFamily(doc: FamilyDocument): Family {
    const { _id, ...rest } = doc;
    return { id: _id!.toString(), ...rest };
  }

  private docToInvite(doc: FamilyInviteDocument): FamilyInvite {
    const { _id, ...rest } = doc;
    return { id: _id!.toString(), ...rest };
  }

  private docToActivity(doc: FamilyActivityDocument): FamilyActivityItem {
    const { _id, familyId, ...rest } = doc;
    return { id: _id!.toString(), ...rest };
  }

  private async getUserById(userId: string) {
    return this.usersCollection.findOne({ _id: new ObjectId(userId) });
  }

  private async getUserByEmail(email: string) {
    return this.usersCollection.findOne({ email: email.toLowerCase() });
  }

  private checkPermission(required: PermissionLevel, actual: PermissionLevel): boolean {
    const levels: Record<PermissionLevel, number> = {
      'none': 0,
      'view': 1,
      'edit': 2,
      'full': 3,
    };
    return levels[actual] >= levels[required];
  }

  private generateInviteId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateToken(): string {
    // Gera token seguro para links de convite
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // ==========================================
  // Gerenciamento de Família
  // ==========================================

  async createFamily(userId: string, data: CreateFamilyInput): Promise<Family> {
    // Verificar se pode criar família
    const canCreate = await this.canCreateFamily(userId);
    if (!canCreate.canCreate) {
      throw new FamilyError(canCreate.reason || 'Não é possível criar família', 'PLAN_NOT_ALLOWED', 403);
    }

    const user = await this.getUserById(userId);
    if (!user) {
      throw new FamilyError('Usuário não encontrado', 'NOT_AUTHORIZED', 404);
    }

    const now = new Date().toISOString();

    // Criar membro owner
    const ownerMember: FamilyMember = {
      id: new ObjectId().toString(),
      userId,
      email: user.email,
      displayName: user.displayName || user.email,
      role: 'owner',
      status: 'active',
      privacySettings: {
        ...DEFAULT_MEMBER_PRIVACY,
        sharing: DEFAULT_MEMBER_PRIVACY.sharing.map(s => ({
          ...s,
          permission: 'full' as PermissionLevel, // Owner tem acesso total
        })),
      },
      invitedAt: now,
      joinedAt: now,
      invitedBy: userId,
    };

    const familyDoc: Omit<FamilyDocument, '_id'> = {
      name: data.name,
      description: data.description,
      icon: data.icon || '👨‍👩‍👧‍👦',
      ownerId: userId,
      ownerEmail: user.email,
      members: [ownerMember],
      maxMembers: FAMILY_LIMITS.Infinity.maxMembers,
      defaultSharingConfig: DEFAULT_MEMBER_PRIVACY.sharing,
      settings: { ...DEFAULT_FAMILY_SETTINGS, ...data.settings },
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.familyCollection.insertOne(familyDoc as FamilyDocument);

    // Log activity
    await this.logActivity(result.insertedId.toString(), {
      type: 'member_joined',
      memberId: userId,
      memberName: user.displayName || user.email,
      description: `${user.displayName || user.email} criou a família "${data.name}"`,
    });

    return this.docToFamily({ ...familyDoc, _id: result.insertedId });
  }

  async getFamily(familyId: string): Promise<Family | null> {
    try {
      const doc = await this.familyCollection.findOne({ _id: new ObjectId(familyId) });
      return doc ? this.docToFamily(doc) : null;
    } catch {
      return null;
    }
  }

  async getUserFamily(userId: string): Promise<Family | null> {
    // Primeiro verifica se é owner
    let doc = await this.familyCollection.findOne({ ownerId: userId });

    if (!doc) {
      // Verifica se é membro
      doc = await this.familyCollection.findOne({
        'members.userId': userId,
        'members.status': 'active',
      });
    }

    return doc ? this.docToFamily(doc) : null;
  }

  async updateFamily(familyId: string, userId: string, data: Partial<Family>): Promise<Family> {
    const family = await this.getFamily(familyId);
    if (!family) {
      throw new FamilyError('Família não encontrada', 'FAMILY_NOT_FOUND', 404);
    }

    // Verificar se é owner ou admin
    const member = family.members.find(m => m.userId === userId && m.status === 'active');
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new FamilyError('Sem permissão para editar família', 'NOT_AUTHORIZED', 403);
    }

    // Campos permitidos para atualização
    const allowedFields = ['name', 'description', 'icon', 'settings'];
    const updateData: any = { updatedAt: new Date().toISOString() };

    for (const field of allowedFields) {
      if (data[field as keyof Family] !== undefined) {
        updateData[field] = data[field as keyof Family];
      }
    }

    await this.familyCollection.updateOne(
      { _id: new ObjectId(familyId) },
      { $set: updateData }
    );

    return (await this.getFamily(familyId))!;
  }

  async deleteFamily(familyId: string, userId: string): Promise<boolean> {
    const family = await this.getFamily(familyId);
    if (!family) {
      throw new FamilyError('Família não encontrada', 'FAMILY_NOT_FOUND', 404);
    }

    if (family.ownerId !== userId) {
      throw new FamilyError('Apenas o dono pode excluir a família', 'NOT_AUTHORIZED', 403);
    }

    // Deletar convites pendentes
    await this.inviteCollection.deleteMany({ familyId });

    // Deletar atividades
    await this.activityCollection.deleteMany({ familyId });

    // Deletar família
    await this.familyCollection.deleteOne({ _id: new ObjectId(familyId) });

    return true;
  }

  // ==========================================
  // Convites e Membros
  // ==========================================

  async inviteMember(userId: string, data: InviteMemberInput): Promise<FamilyInvite> {
    const family = await this.getFamily(data.familyId);
    if (!family) {
      throw new FamilyError('Família não encontrada', 'FAMILY_NOT_FOUND', 404);
    }

    // Verificar permissão para convidar
    const member = family.members.find(m => m.userId === userId && m.status === 'active');
    if (!member) {
      throw new FamilyError('Não é membro desta família', 'NOT_FAMILY_MEMBER', 403);
    }

    const canInvite = member.role === 'owner' ||
      member.role === 'admin' ||
      family.settings.allowMembersToInvite;

    if (!canInvite) {
      throw new FamilyError('Sem permissão para convidar', 'NOT_AUTHORIZED', 403);
    }

    // Verificar limite de membros
    const activeMembers = family.members.filter(m => m.status === 'active').length;
    if (activeMembers >= family.maxMembers) {
      throw new FamilyError('Limite de membros atingido', 'MEMBER_LIMIT_REACHED', 400);
    }

    // Verificar se já é membro
    const existingMember = family.members.find(
      m => m.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existingMember && existingMember.status === 'active') {
      throw new FamilyError('Este usuário já é membro', 'ALREADY_MEMBER', 400);
    }

    // Verificar auto-convite
    const inviter = await this.getUserById(userId);
    if (inviter?.email.toLowerCase() === data.email.toLowerCase()) {
      throw new FamilyError('Não é possível convidar a si mesmo', 'SELF_INVITE', 400);
    }

    // Verificar convite existente
    const existingInvite = await this.inviteCollection.findOne({
      familyId: data.familyId,
      email: data.email.toLowerCase(),
      status: 'pending',
    });

    if (existingInvite) {
      // Retornar convite existente
      return this.docToInvite(existingInvite);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias
    const token = this.generateToken();

    const inviteDoc: Omit<FamilyInviteDocument, '_id'> = {
      familyId: data.familyId,
      familyName: family.name,
      email: data.email.toLowerCase(),
      invitedBy: userId,
      invitedByName: inviter?.displayName || inviter?.email || 'Membro',
      role: data.role || 'member',
      message: data.message,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      status: 'pending',
    };

    const result = await this.inviteCollection.insertOne(inviteDoc as FamilyInviteDocument);

    // O email será enviado pela API route após criação

    return this.docToInvite({ ...inviteDoc, _id: result.insertedId });
  }

  async getPendingInvites(familyId: string): Promise<FamilyInvite[]> {
    const docs = await this.inviteCollection.find({
      familyId,
      status: 'pending',
      expiresAt: { $gt: new Date().toISOString() },
    }).toArray();

    return docs.map(d => this.docToInvite(d));
  }

  async getUserPendingInvites(email: string): Promise<FamilyInvite[]> {
    const docs = await this.inviteCollection.find({
      email: email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: new Date().toISOString() },
    }).toArray();

    // Enriquecer com nome da família
    const invites: FamilyInvite[] = [];
    for (const doc of docs) {
      const family = await this.getFamily(doc.familyId);
      invites.push({
        ...this.docToInvite(doc),
        familyName: family?.name || doc.familyName,
      });
    }

    return invites;
  }

  async getInviteByToken(token: string): Promise<FamilyInvite | null> {
    const doc = await this.inviteCollection.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date().toISOString() },
    });

    if (!doc) return null;

    const family = await this.getFamily(doc.familyId);
    return {
      ...this.docToInvite(doc),
      familyName: family?.name || doc.familyName,
    };
  }

  async acceptInvite(userId: string, data: AcceptInviteInput): Promise<Family> {
    const invite = await this.inviteCollection.findOne({ _id: new ObjectId(data.inviteId) });
    if (!invite) {
      throw new FamilyError('Convite não encontrado', 'INVITE_NOT_FOUND', 404);
    }

    if (invite.status !== 'pending') {
      throw new FamilyError('Convite já processado', 'INVITE_NOT_FOUND', 400);
    }

    if (new Date(invite.expiresAt) < new Date()) {
      throw new FamilyError('Convite expirado', 'INVITE_EXPIRED', 400);
    }

    // Verificar se email corresponde
    const user = await this.getUserById(userId);
    if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new FamilyError('Este convite não é para você', 'NOT_AUTHORIZED', 403);
    }

    const family = await this.getFamily(invite.familyId);
    if (!family) {
      throw new FamilyError('Família não encontrada', 'FAMILY_NOT_FOUND', 404);
    }

    const now = new Date().toISOString();

    // Criar membro
    const newMember: FamilyMember = {
      id: new ObjectId().toString(),
      userId,
      email: user.email,
      displayName: user.displayName || user.email,
      role: invite.role,
      status: 'active',
      privacySettings: {
        ...DEFAULT_MEMBER_PRIVACY,
        ...data.privacySettings,
      },
      invitedAt: invite.createdAt,
      joinedAt: now,
      invitedBy: invite.invitedBy,
    };

    // Adicionar membro à família
    await this.familyCollection.updateOne(
      { _id: new ObjectId(invite.familyId) },
      {
        $push: { members: newMember },
        $set: { updatedAt: now },
      }
    );

    // Atualizar status do convite
    await this.inviteCollection.updateOne(
      { _id: new ObjectId(data.inviteId) },
      { $set: { status: 'accepted' } }
    );

    // Log activity
    await this.logActivity(invite.familyId, {
      type: 'member_joined',
      memberId: userId,
      memberName: user.displayName || user.email,
      description: `${user.displayName || user.email} entrou na família`,
    });

    return (await this.getFamily(invite.familyId))!;
  }

  async declineInvite(userId: string, inviteId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new FamilyError('Usuário não encontrado', 'NOT_AUTHORIZED', 404);
    }

    const result = await this.inviteCollection.updateOne(
      {
        _id: new ObjectId(inviteId),
        email: user.email.toLowerCase(),
        status: 'pending',
      },
      { $set: { status: 'declined' } }
    );

    return result.modifiedCount > 0;
  }

  async cancelInvite(userId: string, inviteId: string): Promise<boolean> {
    const invite = await this.inviteCollection.findOne({ _id: new ObjectId(inviteId) });
    if (!invite) {
      throw new FamilyError('Convite não encontrado', 'INVITE_NOT_FOUND', 404);
    }

    const family = await this.getFamily(invite.familyId);
    if (!family) {
      throw new FamilyError('Família não encontrada', 'FAMILY_NOT_FOUND', 404);
    }

    // Verificar permissão
    const member = family.members.find(m => m.userId === userId && m.status === 'active');
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new FamilyError('Sem permissão', 'NOT_AUTHORIZED', 403);
    }

    const result = await this.inviteCollection.deleteOne({ _id: new ObjectId(inviteId) });
    return result.deletedCount > 0;
  }

  async removeMember(familyId: string, userId: string, memberId: string): Promise<boolean> {
    const family = await this.getFamily(familyId);
    if (!family) {
      throw new FamilyError('Família não encontrada', 'FAMILY_NOT_FOUND', 404);
    }

    // Verificar permissão
    const actor = family.members.find(m => m.userId === userId && m.status === 'active');
    if (!actor || (actor.role !== 'owner' && actor.role !== 'admin')) {
      throw new FamilyError('Sem permissão', 'NOT_AUTHORIZED', 403);
    }

    const targetMember = family.members.find(m => m.id === memberId);
    if (!targetMember) {
      throw new FamilyError('Membro não encontrado', 'NOT_FAMILY_MEMBER', 404);
    }

    if (targetMember.role === 'owner') {
      throw new FamilyError('Não é possível remover o dono', 'CANNOT_REMOVE_OWNER', 400);
    }

    // Admin não pode remover outro admin (apenas owner pode)
    if (targetMember.role === 'admin' && actor.role !== 'owner') {
      throw new FamilyError('Apenas o dono pode remover administradores', 'NOT_AUTHORIZED', 403);
    }

    const now = new Date().toISOString();

    await this.familyCollection.updateOne(
      { _id: new ObjectId(familyId), 'members.id': memberId },
      {
        $set: {
          'members.$.status': 'removed',
          'members.$.removedAt': now,
          updatedAt: now,
        },
      }
    );

    return true;
  }

  async leaveFamily(familyId: string, userId: string): Promise<boolean> {
    const family = await this.getFamily(familyId);
    if (!family) {
      throw new FamilyError('Família não encontrada', 'FAMILY_NOT_FOUND', 404);
    }

    const member = family.members.find(m => m.userId === userId && m.status === 'active');
    if (!member) {
      throw new FamilyError('Não é membro desta família', 'NOT_FAMILY_MEMBER', 403);
    }

    if (member.role === 'owner') {
      throw new FamilyError('O dono não pode sair. Transfira a propriedade ou delete a família.', 'CANNOT_REMOVE_OWNER', 400);
    }

    const now = new Date().toISOString();

    await this.familyCollection.updateOne(
      { _id: new ObjectId(familyId), 'members.userId': userId },
      {
        $set: {
          'members.$.status': 'removed',
          'members.$.removedAt': now,
          updatedAt: now,
        },
      }
    );

    return true;
  }

  async updateMemberRole(
    familyId: string,
    userId: string,
    memberId: string,
    role: FamilyMemberRole
  ): Promise<FamilyMember> {
    const family = await this.getFamily(familyId);
    if (!family) {
      throw new FamilyError('Família não encontrada', 'FAMILY_NOT_FOUND', 404);
    }

    // Apenas owner pode alterar roles
    if (family.ownerId !== userId) {
      throw new FamilyError('Apenas o dono pode alterar funções', 'NOT_AUTHORIZED', 403);
    }

    const targetMember = family.members.find(m => m.id === memberId);
    if (!targetMember) {
      throw new FamilyError('Membro não encontrado', 'NOT_FAMILY_MEMBER', 404);
    }

    if (targetMember.role === 'owner') {
      throw new FamilyError('Não é possível alterar função do dono', 'CANNOT_REMOVE_OWNER', 400);
    }

    if (role === 'owner') {
      throw new FamilyError('Não é possível transferir propriedade desta forma', 'NOT_AUTHORIZED', 400);
    }

    await this.familyCollection.updateOne(
      { _id: new ObjectId(familyId), 'members.id': memberId },
      {
        $set: {
          'members.$.role': role,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    const updatedFamily = await this.getFamily(familyId);
    return updatedFamily!.members.find(m => m.id === memberId)!;
  }

  // ==========================================
  // Compartilhamento e Privacidade
  // ==========================================

  async updateSharing(userId: string, data: UpdateSharingInput): Promise<FamilyMember> {
    const family = await this.getFamily(data.familyId);
    if (!family) {
      throw new FamilyError('Família não encontrada', 'FAMILY_NOT_FOUND', 404);
    }

    // Usuário só pode atualizar seu próprio compartilhamento
    const member = family.members.find(m => m.id === data.memberId);
    if (!member) {
      throw new FamilyError('Membro não encontrado', 'NOT_FAMILY_MEMBER', 404);
    }

    if (member.userId !== userId) {
      throw new FamilyError('Só é possível alterar suas próprias configurações', 'NOT_AUTHORIZED', 403);
    }

    await this.familyCollection.updateOne(
      { _id: new ObjectId(data.familyId), 'members.id': data.memberId },
      {
        $set: {
          'members.$.privacySettings.sharing': data.sharing,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    const updatedFamily = await this.getFamily(data.familyId);
    return updatedFamily!.members.find(m => m.id === data.memberId)!;
  }

  async getMemberSharing(familyId: string, memberId: string): Promise<ResourceSharingConfig[]> {
    const family = await this.getFamily(familyId);
    if (!family) {
      throw new FamilyError('Família não encontrada', 'FAMILY_NOT_FOUND', 404);
    }

    const member = family.members.find(m => m.id === memberId);
    if (!member) {
      throw new FamilyError('Membro não encontrado', 'NOT_FAMILY_MEMBER', 404);
    }

    return member.privacySettings.sharing;
  }

  async checkResourceAccess(
    userId: string,
    resourceType: ShareableResource,
    resourceId: string,
    requiredPermission: PermissionLevel
  ): Promise<FamilyAccessCheck> {
    const family = await this.getUserFamily(userId);

    if (!family) {
      return { hasAccess: false, permission: 'none', isOwner: false };
    }

    const member = family.members.find(m => m.userId === userId && m.status === 'active');
    if (!member) {
      return { hasAccess: false, permission: 'none', isOwner: false };
    }

    // Verificar compartilhamento de todos os membros para este recurso
    for (const otherMember of family.members) {
      if (otherMember.id === member.id) continue;
      if (otherMember.status !== 'active') continue;

      const sharingConfig = otherMember.privacySettings.sharing.find(
        s => s.resource === resourceType
      );

      if (!sharingConfig) continue;

      // Verificar se recurso específico está compartilhado
      const isShared = !sharingConfig.specificIds ||
        sharingConfig.specificIds.length === 0 ||
        sharingConfig.specificIds.includes(resourceId);

      if (isShared && this.checkPermission(requiredPermission, sharingConfig.permission)) {
        return {
          hasAccess: true,
          permission: sharingConfig.permission,
          isOwner: member.role === 'owner',
          familyId: family.id,
          memberId: member.id,
        };
      }
    }

    return {
      hasAccess: false,
      permission: 'none',
      isOwner: member.role === 'owner',
      familyId: family.id,
      memberId: member.id,
    };
  }

  async getSharedResources(
    familyId: string,
    userId: string,
    resourceType: ShareableResource
  ): Promise<string[]> {
    const family = await this.getFamily(familyId);
    if (!family) {
      throw new FamilyError('Família não encontrada', 'FAMILY_NOT_FOUND', 404);
    }

    const currentMember = family.members.find(m => m.userId === userId && m.status === 'active');
    if (!currentMember) {
      throw new FamilyError('Não é membro desta família', 'NOT_FAMILY_MEMBER', 403);
    }

    const sharedIds: string[] = [];

    for (const member of family.members) {
      if (member.id === currentMember.id) continue;
      if (member.status !== 'active') continue;

      const sharingConfig = member.privacySettings.sharing.find(
        s => s.resource === resourceType
      );

      if (!sharingConfig || sharingConfig.permission === 'none') continue;

      if (sharingConfig.specificIds && sharingConfig.specificIds.length > 0) {
        sharedIds.push(...sharingConfig.specificIds);
      }
      // Se specificIds vazio, significa "todos" - isso precisa ser tratado no chamador
    }

    return [...new Set(sharedIds)]; // Remove duplicatas
  }

  // ==========================================
  // Dashboard e Dados Agregados
  // ==========================================

  async getFamilyDashboard(familyId: string, userId: string): Promise<FamilyDashboardData> {
    const family = await this.getFamily(familyId);
    if (!family) {
      throw new FamilyError('Família não encontrada', 'FAMILY_NOT_FOUND', 404);
    }

    const member = family.members.find(m => m.userId === userId && m.status === 'active');
    if (!member) {
      throw new FamilyError('Não é membro desta família', 'NOT_FAMILY_MEMBER', 403);
    }

    // TODO: Agregar dados reais das carteiras, transações, etc.
    // Por enquanto retorna dados básicos

    const activeMembers = family.members
      .filter(m => m.status === 'active')
      .map(m => ({
        id: m.id,
        displayName: m.displayName,
        contributedBalance: m.privacySettings.showTotalBalance ? 0 : undefined,
      }));

    const recentActivity = await this.getFamilyActivity(familyId, userId, 10);

    return {
      familyId: family.id,
      familyName: family.name,
      sharedBalance: 0,
      sharedIncome: 0,
      sharedExpenses: 0,
      activeMembers,
      sharedGoals: [],
      recentActivity,
    };
  }

  async getFamilyActivity(
    familyId: string,
    userId: string,
    limit: number = 20
  ): Promise<FamilyActivityItem[]> {
    const family = await this.getFamily(familyId);
    if (!family) {
      throw new FamilyError('Família não encontrada', 'FAMILY_NOT_FOUND', 404);
    }

    const member = family.members.find(m => m.userId === userId && m.status === 'active');
    if (!member) {
      throw new FamilyError('Não é membro desta família', 'NOT_FAMILY_MEMBER', 403);
    }

    const docs = await this.activityCollection
      .find({ familyId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return docs.map(d => this.docToActivity(d));
  }

  async logActivity(
    familyId: string,
    activity: Omit<FamilyActivityItem, 'id' | 'createdAt'>
  ): Promise<FamilyActivityItem> {
    const doc: Omit<FamilyActivityDocument, '_id'> = {
      ...activity,
      familyId,
      createdAt: new Date().toISOString(),
    };

    const result = await this.activityCollection.insertOne(doc as FamilyActivityDocument);
    return this.docToActivity({ ...doc, _id: result.insertedId });
  }

  // ==========================================
  // Validações
  // ==========================================

  async canCreateFamily(userId: string): Promise<{ canCreate: boolean; reason?: string }> {
    // Verificar plano do usuário
    const user = await this.getUserById(userId);
    if (!user) {
      return { canCreate: false, reason: 'Usuário não encontrado' };
    }

    if (user.plan !== 'Infinity') {
      return {
        canCreate: false,
        reason: 'Modo Família está disponível apenas para assinantes do plano Infinity'
      };
    }

    // Verificar se já tem família
    const existingFamily = await this.familyCollection.findOne({ ownerId: userId });
    if (existingFamily) {
      return { canCreate: false, reason: 'Você já possui uma família' };
    }

    return { canCreate: true };
  }

  async isFamilyMember(userId: string): Promise<boolean> {
    const family = await this.getUserFamily(userId);
    return family !== null;
  }

  async isFamilyOwner(userId: string, familyId?: string): Promise<boolean> {
    if (familyId) {
      const family = await this.getFamily(familyId);
      return family?.ownerId === userId;
    }

    const family = await this.familyCollection.findOne({ ownerId: userId });
    return family !== null;
  }
}

// Factory function
export function createFamilyService(db: Db): IFamilyService {
  return new MongoDBFamilyService(db);
}
