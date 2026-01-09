// lib/core/services/family_service.dart

import 'package:flutter/foundation.dart';
import '../models/family_model.dart';
import 'api_service.dart';

/// Serviço para gerenciamento de família
class FamilyService {
  final ApiService _apiService;

  FamilyService(this._apiService);

  /// Obtém a família do usuário atual
  Future<FamilyModel?> getMyFamily() async {
    try {
      final result = await _apiService.get<Map<String, dynamic>>(
        '/../family',
        (data) => data,
      );

      if (result.isSuccess && result.data != null) {
        return FamilyModel.fromJson(result.data!);
      }
      return null;
    } catch (e) {
      debugPrint('Erro ao buscar família: $e');
      return null;
    }
  }

  /// Cria uma nova família
  Future<FamilyModel?> createFamily({
    required String name,
    String? description,
  }) async {
    try {
      final result = await _apiService.post<Map<String, dynamic>>(
        '/../family',
        {
          'name': name,
          if (description != null) 'description': description,
        },
        (data) => data,
      );

      if (result.isSuccess && result.data != null) {
        return FamilyModel.fromJson(result.data!);
      }
      return null;
    } catch (e) {
      debugPrint('Erro ao criar família: $e');
      return null;
    }
  }

  /// Atualiza a família
  Future<bool> updateFamily({
    required String familyId,
    String? name,
    String? description,
  }) async {
    try {
      final result = await _apiService.patch<Map<String, dynamic>>(
        '/../family',
        {
          if (name != null) 'name': name,
          if (description != null) 'description': description,
        },
        (data) => data,
      );

      return result.isSuccess;
    } catch (e) {
      debugPrint('Erro ao atualizar família: $e');
      return false;
    }
  }

  /// Sai da família
  Future<bool> leaveFamily() async {
    try {
      final result = await _apiService.delete('/../family/members');
      return result.isSuccess;
    } catch (e) {
      debugPrint('Erro ao sair da família: $e');
      return false;
    }
  }

  /// Envia convite para membro
  Future<FamilyInvite?> inviteMember({
    required String email,
    FamilyMemberRole role = FamilyMemberRole.member,
    String? message,
  }) async {
    try {
      final result = await _apiService.post<Map<String, dynamic>>(
        '/../family/invites',
        {
          'email': email,
          'role': role.name,
          if (message != null) 'message': message,
        },
        (data) => data,
      );

      if (result.isSuccess && result.data != null) {
        return FamilyInvite.fromJson(result.data!);
      }
      return null;
    } catch (e) {
      debugPrint('Erro ao enviar convite: $e');
      return null;
    }
  }

  /// Lista convites pendentes
  Future<List<FamilyInvite>> getPendingInvites() async {
    try {
      final result = await _apiService.getList<FamilyInvite>(
        '/../family/invites',
        (json) => FamilyInvite.fromJson(json),
      );

      if (result.isSuccess && result.data != null) {
        return result.data!;
      }
      return [];
    } catch (e) {
      debugPrint('Erro ao buscar convites: $e');
      return [];
    }
  }

  /// Aceita convite via token
  Future<bool> acceptInvite(String token) async {
    try {
      final result = await _apiService.post<Map<String, dynamic>>(
        '/../family/invites/token/$token',
        {'action': 'accept'},
        (data) => data,
      );
      return result.isSuccess;
    } catch (e) {
      debugPrint('Erro ao aceitar convite: $e');
      return false;
    }
  }

  /// Recusa convite
  Future<bool> declineInvite(String inviteId) async {
    try {
      final result = await _apiService.post<Map<String, dynamic>>(
        '/../family/invites/$inviteId',
        {'action': 'decline'},
        (data) => data,
      );
      return result.isSuccess;
    } catch (e) {
      debugPrint('Erro ao recusar convite: $e');
      return false;
    }
  }

  /// Remove membro da família
  Future<bool> removeMember(String memberId) async {
    try {
      final result = await _apiService.delete(
        '/../family/members?memberId=$memberId',
      );
      return result.isSuccess;
    } catch (e) {
      debugPrint('Erro ao remover membro: $e');
      return false;
    }
  }

  /// Atualiza configurações de compartilhamento do membro
  Future<bool> updateMySharing(MemberPrivacySettings settings) async {
    try {
      final result = await _apiService.patch<Map<String, dynamic>>(
        '/../family/members',
        {'privacySettings': settings.toJson()},
        (data) => data,
      );
      return result.isSuccess;
    } catch (e) {
      debugPrint('Erro ao atualizar compartilhamento: $e');
      return false;
    }
  }
}
