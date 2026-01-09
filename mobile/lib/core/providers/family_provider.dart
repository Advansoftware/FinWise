// lib/core/providers/family_provider.dart

import 'package:flutter/foundation.dart';
import '../models/family_model.dart';
import '../services/family_service.dart';
import '../services/api_service.dart';

/// Provider para gerenciamento de família
class FamilyProvider extends ChangeNotifier {
  final FamilyService _familyService;

  FamilyModel? _family;
  List<FamilyInvite> _pendingInvites = [];
  List<FamilyInvite> _myInvites = []; // Convites recebidos pelo usuário
  bool _isLoading = false;
  String? _error;

  FamilyProvider() : _familyService = FamilyService(ApiService());

  FamilyModel? get family => _family;
  List<FamilyInvite> get pendingInvites => _pendingInvites;
  List<FamilyInvite> get myInvites => _myInvites;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Se o usuário está em uma família
  bool get isInFamily => _family != null;

  /// Membro atual na família
  FamilyMember? currentMember(String userId) => _family?.getMember(userId);

  /// Se o usuário atual é o dono
  bool isOwner(String userId) => _family?.ownerId == userId;

  /// Carrega família do usuário
  Future<void> loadFamily() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _family = await _familyService.getMyFamily();
      if (_family != null) {
        _pendingInvites = await _familyService.getPendingInvites();
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Erro ao carregar família: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Cria uma nova família
  Future<bool> createFamily({
    required String name,
    String? description,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _family = await _familyService.createFamily(
        name: name,
        description: description,
      );
      return _family != null;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Atualiza família
  Future<bool> updateFamily({
    String? name,
    String? description,
  }) async {
    if (_family == null) return false;

    _isLoading = true;
    notifyListeners();

    try {
      final success = await _familyService.updateFamily(
        familyId: _family!.id,
        name: name,
        description: description,
      );
      
      if (success) {
        await loadFamily();
      }
      return success;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Sai da família
  Future<bool> leaveFamily() async {
    _isLoading = true;
    notifyListeners();

    try {
      final success = await _familyService.leaveFamily();
      if (success) {
        _family = null;
        _pendingInvites = [];
      }
      return success;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Convida membro
  Future<bool> inviteMember({
    required String email,
    FamilyMemberRole role = FamilyMemberRole.member,
    String? message,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final invite = await _familyService.inviteMember(
        email: email,
        role: role,
        message: message,
      );
      
      if (invite != null) {
        _pendingInvites.add(invite);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Aceita convite
  Future<bool> acceptInvite(String token) async {
    _isLoading = true;
    notifyListeners();

    try {
      final success = await _familyService.acceptInvite(token);
      if (success) {
        await loadFamily();
      }
      return success;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Recusa convite
  Future<bool> declineInvite(String inviteId) async {
    try {
      final success = await _familyService.declineInvite(inviteId);
      if (success) {
        _myInvites.removeWhere((i) => i.id == inviteId);
        notifyListeners();
      }
      return success;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  /// Remove membro
  Future<bool> removeMember(String memberId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final success = await _familyService.removeMember(memberId);
      if (success) {
        await loadFamily();
      }
      return success;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Atualiza configurações de compartilhamento
  Future<bool> updateMySharing(MemberPrivacySettings settings) async {
    try {
      final success = await _familyService.updateMySharing(settings);
      if (success) {
        await loadFamily();
      }
      return success;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
