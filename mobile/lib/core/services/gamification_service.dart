// lib/core/services/gamification_service.dart
// Serviço de Gamificação

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/gamification_model.dart';
import 'api_service.dart';

class GamificationService {
  final ApiService _apiService = ApiService();
  static const String _baseUrl = 'https://gastometria.com.br/api/v1';

  Future<GamificationResponse?> getGamificationData() async {
    try {
      if (!_apiService.isAuthenticated) {
        debugPrint('GamificationService: Usuário não autenticado');
        return null;
      }

      final response = await http.get(
        Uri.parse('$_baseUrl/gamification'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ${_apiService.accessToken}',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return GamificationResponse.fromJson(data);
      } else if (response.statusCode == 401) {
        debugPrint('GamificationService: Token expirado');
        return null;
      } else {
        debugPrint('GamificationService: Erro ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('Erro ao buscar gamificação: $e');
      return null;
    }
  }

  // Retorna dados padrão para quando a API não está disponível
  static GamificationResponse getDefaultData() {
    return GamificationResponse(
      gamification: GamificationModel(
        points: 0,
        level: LevelModel(
          level: 1,
          name: 'Iniciante',
          title: 'Novato Financeiro',
          icon: '🌱',
          description: 'Começando a jornada financeira',
          pointsRequired: 0,
          pointsToNext: 100,
          benefits: ['Acesso ao sistema de gamificação'],
        ),
        badges: [],
        achievements: [],
        quests: [
          QuestModel(
            id: 'daily_transaction',
            name: 'Registrar Transação',
            description: 'Adicione uma nova transação hoje',
            icon: '💳',
            xp: 10,
            type: 'daily',
            status: 'available',
            progress: 0,
            target: 1,
            expiresAt: DateTime.now().add(const Duration(days: 1)).toIso8601String(),
          ),
          QuestModel(
            id: 'daily_check_balance',
            name: 'Verificar Saldo',
            description: 'Visualize o saldo das suas carteiras',
            icon: '💰',
            xp: 5,
            type: 'daily',
            status: 'available',
            progress: 0,
            target: 1,
            expiresAt: DateTime.now().add(const Duration(days: 1)).toIso8601String(),
          ),
          QuestModel(
            id: 'daily_categorize',
            name: 'Categorizar Transação',
            description: 'Categorize uma transação não classificada',
            icon: '🏷️',
            xp: 15,
            type: 'daily',
            status: 'available',
            progress: 0,
            target: 1,
            expiresAt: DateTime.now().add(const Duration(days: 1)).toIso8601String(),
          ),
        ],
        streak: 0,
        completionRate: 0,
        financialHealthScore: 0,
        motivationalInsights: ['💪 Continue assim, cada transação conta!'],
        streaks: {
          'login': StreakModel(
            current: 0,
            longest: 0,
            lastActivityDate: DateTime.now().toIso8601String(),
            type: 'daily_login',
          ),
          'payments': StreakModel(
            current: 0,
            longest: 0,
            lastActivityDate: DateTime.now().toIso8601String(),
            type: 'payment_on_time',
          ),
          'budget': StreakModel(
            current: 0,
            longest: 0,
            lastActivityDate: DateTime.now().toIso8601String(),
            type: 'budget_respected',
          ),
        },
        stats: GamificationStatsModel(
          totalXp: 0,
          totalBadges: 0,
          totalAchievements: 0,
          totalQuestsCompleted: 0,
          joinedAt: DateTime.now().toIso8601String(),
          lastActivityAt: DateTime.now().toIso8601String(),
        ),
      ),
      profileInsights: ProfileInsightsModel(
        disciplineLevel: 'Iniciante',
        paymentConsistency: 'Irregular',
        financialMaturity: 0,
        strengths: ['Determinação para melhorar suas finanças'],
        improvements: ['Comece registrando suas transações'],
        motivationalTip: 'Dê o primeiro passo registrando sua primeira transação!',
      ),
    );
  }
}
