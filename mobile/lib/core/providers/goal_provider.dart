import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/services.dart';

/// Provider para gerenciamento de metas financeiras
class GoalProvider extends ChangeNotifier {
  final GoalService _goalService = GoalService();

  List<GoalModel> _goals = [];
  bool _isLoading = false;
  String? _error;

  List<GoalModel> get goals => _goals;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Metas ativas (não concluídas)
  List<GoalModel> get activeGoals =>
      _goals.where((g) => g.currentAmount < g.targetAmount).toList();

  // Metas concluídas
  List<GoalModel> get completedGoals =>
      _goals.where((g) => g.currentAmount >= g.targetAmount).toList();

  // Resumo das metas
  GoalsSummary get summary {
    double totalTarget = 0;
    double totalCurrent = 0;
    int completedCount = 0;
    int inProgressCount = 0;

    for (final goal in _goals) {
      totalTarget += goal.targetAmount;
      totalCurrent += goal.currentAmount;

      if (goal.currentAmount >= goal.targetAmount) {
        completedCount++;
      } else {
        inProgressCount++;
      }
    }

    return GoalsSummary(
      totalTarget: totalTarget,
      totalCurrent: totalCurrent,
    );
  }

  /// Carrega as metas
  Future<void> loadGoals({bool activeOnly = false}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _goalService.getGoals(activeOnly: activeOnly);

      if (result.isSuccess && result.data != null) {
        _goals = result.data!;
      } else {
        _error = result.error ?? 'Erro ao carregar metas';
      }
    } catch (e) {
      _error = 'Erro ao carregar metas: $e';
      debugPrint(_error);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Cria uma nova meta
  Future<bool> createGoal(GoalModel goal) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await _goalService.createGoal(goal);

      if (result.isSuccess && result.data != null) {
        _goals.insert(0, result.data!);
        notifyListeners();
        return true;
      }

      _error = result.error;
      return false;
    } catch (e) {
      _error = 'Erro ao criar meta: $e';
      debugPrint(_error);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Atualiza uma meta
  Future<bool> updateGoal(String id, GoalModel goal) async {
    try {
      final result = await _goalService.updateGoal(id, goal);

      if (result.isSuccess && result.data != null) {
        final index = _goals.indexWhere((g) => g.id == id);
        if (index >= 0) {
          _goals[index] = result.data!;
          notifyListeners();
        }
        return true;
      }

      _error = result.error;
      return false;
    } catch (e) {
      _error = 'Erro ao atualizar meta: $e';
      debugPrint(_error);
      return false;
    }
  }

  /// Adiciona valor a uma meta
  Future<bool> addToGoal(String id, double amount) async {
    try {
      final result = await _goalService.addToGoal(id, amount);

      if (result.isSuccess && result.data != null) {
        final index = _goals.indexWhere((g) => g.id == id);
        if (index >= 0) {
          _goals[index] = result.data!;
          notifyListeners();
        }
        return true;
      }

      _error = result.error;
      return false;
    } catch (e) {
      _error = 'Erro ao adicionar valor: $e';
      debugPrint(_error);
      return false;
    }
  }

  /// Deleta uma meta
  Future<bool> deleteGoal(String id) async {
    try {
      final result = await _goalService.deleteGoal(id);

      if (result.isSuccess) {
        _goals.removeWhere((g) => g.id == id);
        notifyListeners();
        return true;
      }

      _error = result.error;
      return false;
    } catch (e) {
      _error = 'Erro ao deletar meta: $e';
      debugPrint(_error);
      return false;
    }
  }

  /// Limpa erros
  void clearError() {
    _error = null;
    notifyListeners();
  }
}


