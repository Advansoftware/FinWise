import '../constants/api_constants.dart';
import '../models/models.dart';
import 'api_service.dart';

/// Serviço de orçamentos
class BudgetService {
  final ApiService _api = ApiService();

  /// Busca lista de orçamentos
  Future<ApiResult<List<BudgetModel>>> getBudgets({
    int? month,
    int? year,
  }) async {
    final now = DateTime.now();
    final queryParams = <String, String>{
      'month': (month ?? now.month).toString(),
      'year': (year ?? now.year).toString(),
    };

    return _api.getList<BudgetModel>(
      ApiConstants.budgets,
      BudgetModel.fromJson,
      queryParams: queryParams,
      listKey: 'budgets',
    );
  }

  /// Busca um orçamento por ID
  Future<ApiResult<BudgetModel>> getBudget(String id) async {
    return _api.get<BudgetModel>(
      '${ApiConstants.budgets}/$id',
      (data) => BudgetModel.fromJson(data['budget'] ?? data),
    );
  }

  /// Cria um novo orçamento
  Future<ApiResult<BudgetModel>> createBudget(BudgetModel budget) async {
    return _api.post<BudgetModel>(
      ApiConstants.budgets,
      budget.toJson(),
      (data) => BudgetModel.fromJson(data['budget'] ?? data),
    );
  }

  /// Atualiza um orçamento
  Future<ApiResult<BudgetModel>> updateBudget(
    String id,
    BudgetModel budget,
  ) async {
    return _api.put<BudgetModel>(
      '${ApiConstants.budgets}/$id',
      budget.toJson(),
      (data) => BudgetModel.fromJson(data['budget'] ?? data),
    );
  }

  /// Deleta um orçamento
  Future<ApiResult<bool>> deleteBudget(String id) async {
    return _api.delete('${ApiConstants.budgets}/$id');
  }
}
