// lib/core/models/family_model.dart

/// Tipos de recursos compartilháveis
enum ShareableResource {
  wallets,
  transactions,
  budgets,
  goals,
  installments,
  reports,
  categories,
}

/// Níveis de permissão
enum PermissionLevel {
  none,
  view,
  edit,
  full,
}

/// Status do membro na família
enum FamilyMemberStatus {
  pending,
  active,
  suspended,
  removed,
}

/// Role do membro na família
enum FamilyMemberRole {
  owner,
  admin,
  member,
}

/// Configuração de compartilhamento por recurso
class ResourceSharingConfig {
  final ShareableResource resource;
  final PermissionLevel permission;
  final List<String>? specificIds;

  ResourceSharingConfig({
    required this.resource,
    required this.permission,
    this.specificIds,
  });

  factory ResourceSharingConfig.fromJson(Map<String, dynamic> json) {
    return ResourceSharingConfig(
      resource: ShareableResource.values.firstWhere(
        (e) => e.name == json['resource'],
        orElse: () => ShareableResource.transactions,
      ),
      permission: PermissionLevel.values.firstWhere(
        (e) => e.name == json['permission'],
        orElse: () => PermissionLevel.none,
      ),
      specificIds: json['specificIds'] != null
          ? List<String>.from(json['specificIds'])
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'resource': resource.name,
    'permission': permission.name,
    if (specificIds != null) 'specificIds': specificIds,
  };
}

/// Configurações de privacidade do membro
class MemberPrivacySettings {
  final List<ResourceSharingConfig> sharing;
  final bool notifyOnFamilyActivity;
  final bool notifyOnSharedTransactions;
  final bool showTotalBalance;
  final bool showIndividualItems;

  MemberPrivacySettings({
    required this.sharing,
    this.notifyOnFamilyActivity = true,
    this.notifyOnSharedTransactions = true,
    this.showTotalBalance = true,
    this.showIndividualItems = true,
  });

  factory MemberPrivacySettings.fromJson(Map<String, dynamic> json) {
    return MemberPrivacySettings(
      sharing: (json['sharing'] as List? ?? [])
          .map((e) => ResourceSharingConfig.fromJson(e))
          .toList(),
      notifyOnFamilyActivity: json['notifyOnFamilyActivity'] ?? true,
      notifyOnSharedTransactions: json['notifyOnSharedTransactions'] ?? true,
      showTotalBalance: json['showTotalBalance'] ?? true,
      showIndividualItems: json['showIndividualItems'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'sharing': sharing.map((e) => e.toJson()).toList(),
    'notifyOnFamilyActivity': notifyOnFamilyActivity,
    'notifyOnSharedTransactions': notifyOnSharedTransactions,
    'showTotalBalance': showTotalBalance,
    'showIndividualItems': showIndividualItems,
  };

  /// Cria configurações padrão com tudo compartilhado
  static MemberPrivacySettings defaultSharing() {
    return MemberPrivacySettings(
      sharing: ShareableResource.values.map((r) {
        return ResourceSharingConfig(
          resource: r,
          permission: PermissionLevel.view,
        );
      }).toList(),
    );
  }
}

/// Membro da família
class FamilyMember {
  final String id;
  final String userdId;
  final String? email;
  final String displayName;
  final String? avatarUrl;
  final FamilyMemberRole role;
  final FamilyMemberStatus status;
  final MemberPrivacySettings privacySettings;
  final String invitedAt;
  final String? joinedAt;
  final String? removedAt;
  final String invitedBy;

  FamilyMember({
    required this.id,
    required this.userdId,
    this.email,
    required this.displayName,
    this.avatarUrl,
    required this.role,
    required this.status,
    required this.privacySettings,
    required this.invitedAt,
    this.joinedAt,
    this.removedAt,
    required this.invitedBy,
  });

  factory FamilyMember.fromJson(Map<String, dynamic> json) {
    return FamilyMember(
      id: json['id'] ?? '',
      userdId: json['userId'] ?? '',
      email: json['email'],
      displayName: json['displayName'] ?? json['name'] ?? '',
      avatarUrl: json['avatarUrl'] ?? json['avatar'],
      role: FamilyMemberRole.values.firstWhere(
        (e) => e.name == json['role'],
        orElse: () => FamilyMemberRole.member,
      ),
      status: FamilyMemberStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => FamilyMemberStatus.pending,
      ),
      privacySettings: json['privacySettings'] != null
          ? MemberPrivacySettings.fromJson(json['privacySettings'])
          : MemberPrivacySettings.defaultSharing(),
      invitedAt: json['invitedAt'] ?? '',
      joinedAt: json['joinedAt'],
      removedAt: json['removedAt'],
      invitedBy: json['invitedBy'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userdId,
    if (email != null) 'email': email,
    'displayName': displayName,
    if (avatarUrl != null) 'avatarUrl': avatarUrl,
    'role': role.name,
    'status': status.name,
    'privacySettings': privacySettings.toJson(),
    'invitedAt': invitedAt,
    if (joinedAt != null) 'joinedAt': joinedAt,
    if (removedAt != null) 'removedAt': removedAt,
    'invitedBy': invitedBy,
  };

  bool get isOwner => role == FamilyMemberRole.owner;
  bool get isAdmin => role == FamilyMemberRole.admin || isOwner;
  bool get isActive => status == FamilyMemberStatus.active;
}

/// Convite para família
class FamilyInvite {
  final String id;
  final String familyId;
  final String? familyName;
  final String email;
  final String invitedBy;
  final String invitedByName;
  final FamilyMemberRole role;
  final String? message;
  final String token;
  final String expiresAt;
  final String createdAt;
  final String status;

  FamilyInvite({
    required this.id,
    required this.familyId,
    this.familyName,
    required this.email,
    required this.invitedBy,
    required this.invitedByName,
    required this.role,
    this.message,
    required this.token,
    required this.expiresAt,
    required this.createdAt,
    required this.status,
  });

  factory FamilyInvite.fromJson(Map<String, dynamic> json) {
    return FamilyInvite(
      id: json['id'] ?? '',
      familyId: json['familyId'] ?? '',
      familyName: json['familyName'],
      email: json['email'] ?? '',
      invitedBy: json['invitedBy'] ?? '',
      invitedByName: json['invitedByName'] ?? '',
      role: FamilyMemberRole.values.firstWhere(
        (e) => e.name == json['role'],
        orElse: () => FamilyMemberRole.member,
      ),
      message: json['message'],
      token: json['token'] ?? '',
      expiresAt: json['expiresAt'] ?? '',
      createdAt: json['createdAt'] ?? '',
      status: json['status'] ?? 'pending',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'familyId': familyId,
    if (familyName != null) 'familyName': familyName,
    'email': email,
    'invitedBy': invitedBy,
    'invitedByName': invitedByName,
    'role': role.name,
    if (message != null) 'message': message,
    'token': token,
    'expiresAt': expiresAt,
    'createdAt': createdAt,
    'status': status,
  };

  bool get isPending => status == 'pending';
  bool get isExpired {
    try {
      return DateTime.parse(expiresAt).isBefore(DateTime.now());
    } catch (_) {
      return false;
    }
  }
}

/// Família (Workspace compartilhado)
class FamilyModel {
  final String id;
  final String name;
  final String? description;
  final String ownerId;
  final List<FamilyMember> members;
  final String createdAt;
  final String? updatedAt;
  final bool isActive;

  FamilyModel({
    required this.id,
    required this.name,
    this.description,
    required this.ownerId,
    required this.members,
    required this.createdAt,
    this.updatedAt,
    this.isActive = true,
  });

  factory FamilyModel.fromJson(Map<String, dynamic> json) {
    return FamilyModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      ownerId: json['ownerId'] ?? '',
      members: (json['members'] as List? ?? [])
          .map((e) => FamilyMember.fromJson(e))
          .toList(),
      createdAt: json['createdAt'] ?? '',
      updatedAt: json['updatedAt'],
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    if (description != null) 'description': description,
    'ownerId': ownerId,
    'members': members.map((e) => e.toJson()).toList(),
    'createdAt': createdAt,
    if (updatedAt != null) 'updatedAt': updatedAt,
    'isActive': isActive,
  };

  /// Membros ativos
  List<FamilyMember> get activeMembers =>
      members.where((m) => m.isActive).toList();

  /// Membros pendentes
  List<FamilyMember> get pendingMembers =>
      members.where((m) => m.status == FamilyMemberStatus.pending).toList();

  /// Verifica se um usuário é membro
  bool isMember(String userId) =>
      members.any((m) => m.userdId == userId && m.isActive);

  /// Obtém membro pelo userId
  FamilyMember? getMember(String userId) {
    try {
      return members.firstWhere((m) => m.userdId == userId);
    } catch (_) {
      return null;
    }
  }
}
