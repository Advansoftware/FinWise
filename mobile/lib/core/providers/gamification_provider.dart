// lib/core/providers/gamification_provider.dart
// Provider de Gamificação

import 'package:flutter/foundation.dart';
import '../models/gamification_model.dart';
import '../services/gamification_service.dart';

class GamificationProvider with ChangeNotifier {
  final GamificationService _service = GamificationService();
  
  GamificationModel? _gamification;
  ProfileInsightsModel? _profileInsights;
  bool _isLoading = false;
  String? _error;
  bool _hasLoaded = false;

  // Getters
  GamificationModel? get gamification => _gamification;
  ProfileInsightsModel? get profileInsights => _profileInsights;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasData => _gamification != null;

  // Atalhos para dados comuns
  int get level => _gamification?.level.level ?? 1;
  String get levelName => _gamification?.level.name ?? 'Iniciante';
  String get levelTitle => _gamification?.level.title ?? 'Novato Financeiro';
  String get levelIcon => _gamification?.level.icon ?? '🌱';
  int get points => _gamification?.points ?? 0;
  int get xpToNextLevel => _gamification?.xpToNextLevel ?? 100;
  double get levelProgress => _gamification?.levelProgress ?? 0;
  int get streak => _gamification?.streak ?? 0;
  int get financialHealthScore => _gamification?.financialHealthScore ?? 0;
  List<BadgeModel> get badges => _gamification?.badges ?? [];
  List<QuestModel> get quests => _gamification?.quests ?? [];
  List<QuestModel> get dailyQuests => _gamification?.dailyQuests ?? [];
  List<QuestModel> get activeQuests => _gamification?.activeQuests ?? [];
  List<String> get motivationalInsights => _gamification?.motivationalInsights ?? [];

  // Carrega dados de gamificação
  Future<void> loadGamification({bool forceRefresh = false}) async {
    if (_hasLoaded && !forceRefresh && !_isLoading) {
      return;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _service.getGamificationData();
      
      if (response != null) {
        _gamification = response.gamification;
        _profileInsights = response.profileInsights;
        _hasLoaded = true;
      } else {
        // Usa dados padrão quando API não está disponível
        final defaultData = GamificationService.getDefaultData();
        _gamification = defaultData.gamification;
        _profileInsights = defaultData.profileInsights;
        _hasLoaded = true;
      }
    } catch (e) {
      _error = e.toString();
      // Usa dados padrão em caso de erro
      final defaultData = GamificationService.getDefaultData();
      _gamification = defaultData.gamification;
      _profileInsights = defaultData.profileInsights;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Atualiza dados
  Future<void> refresh() async {
    await loadGamification(forceRefresh: true);
  }

  // Limpa dados (logout)
  void clear() {
    _gamification = null;
    _profileInsights = null;
    _hasLoaded = false;
    _error = null;
    notifyListeners();
  }

  // Helpers de UI
  String getRarityLabel(String rarity) {
    switch (rarity) {
      case 'common':
        return 'Comum';
      case 'rare':
        return 'Raro';
      case 'epic':
        return 'Épico';
      case 'legendary':
        return 'Lendário';
      case 'mythic':
        return 'Mítico';
      default:
        return 'Comum';
    }
  }

  // Retorna cor baseada na raridade
  int getRarityColor(String rarity) {
    switch (rarity) {
      case 'common':
        return 0xFF9E9E9E; // Cinza
      case 'rare':
        return 0xFF2196F3; // Azul
      case 'epic':
        return 0xFF9C27B0; // Roxo
      case 'legendary':
        return 0xFFFF9800; // Laranja
      case 'mythic':
        return 0xFFE91E63; // Rosa
      default:
        return 0xFF9E9E9E;
    }
  }
}
