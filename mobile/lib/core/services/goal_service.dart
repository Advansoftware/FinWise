import '../constants/api_constants.dart';
import '../models/models.dart';
import 'api_service.dart';

/// Serviço de metas
class GoalService {
  final ApiService _api = ApiService();

  /// Busca lista de metas
  Future<ApiResult<List<GoalModel>>> getGoals({
    bool activeOnly = true,
  }) async {
    final queryParams = <String, String>{
      if (activeOnly) 'status': 'active',
    };

    return _api.getList<GoalModel>(
      ApiConstants.goals,
      GoalModel.fromJson,
      queryParams: queryParams.isNotEmpty ? queryParams : null,
      listKey: 'goals',
    );
  }

  /// Busca uma meta por ID
  Future<ApiResult<GoalModel>> getGoal(String id) async {
    return _api.get<GoalModel>(
      '${ApiConstants.goals}/$id',
      (data) => GoalModel.fromJson(data['goal'] ?? data),
    );
  }

  /// Cria uma nova meta
  Future<ApiResult<GoalModel>> createGoal(GoalModel goal) async {
    return _api.post<GoalModel>(
      ApiConstants.goals,
      goal.toJson(),
      (data) => GoalModel.fromJson(data['goal'] ?? data),
    );
  }

  /// Atualiza uma meta
  Future<ApiResult<GoalModel>> updateGoal(String id, GoalModel goal) async {
    return _api.put<GoalModel>(
      '${ApiConstants.goals}/$id',
      goal.toJson(),
      (data) => GoalModel.fromJson(data['goal'] ?? data),
    );
  }

  /// Adiciona valor a uma meta
  Future<ApiResult<GoalModel>> addToGoal(String id, double amount) async {
    return _api.post<GoalModel>(
      '${ApiConstants.goals}/$id/add',
      {'amount': amount},
      (data) => GoalModel.fromJson(data['goal'] ?? data),
    );
  }

  /// Deleta uma meta
  Future<ApiResult<bool>> deleteGoal(String id) async {
    return _api.delete('${ApiConstants.goals}/$id');
  }
}
