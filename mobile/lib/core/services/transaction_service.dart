import '../constants/api_constants.dart';
import '../models/models.dart';
import 'api_service.dart';

/// Serviço de transações
class TransactionService {
  final ApiService _api = ApiService();

  /// Busca lista de transações
  Future<ApiResult<List<TransactionModel>>> getTransactions({
    int? month,
    int? year,
    String? walletId,
    String? walletId,
    String? category,
    TransactionType? type,
    int page = 1,
    int limit = 50,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
      if (month != null) 'month': month.toString(),
      if (year != null) 'year': year.toString(),
      if (walletId != null) 'walletId': walletId,
      if (walletId != null) 'walletId': walletId,
      if (category != null) 'category': category,
      if (type != null) 'type': type.name, // Suporta income, expense, transfer
    };

    return _api.getList<TransactionModel>(
      ApiConstants.transactions,
      TransactionModel.fromJson,
      queryParams: queryParams,
      // API retorna array diretamente, sem wrapper
    );
  }

  /// Busca uma transação por ID
  Future<ApiResult<TransactionModel>> getTransaction(String id) async {
    return _api.get<TransactionModel>(
      '${ApiConstants.transactions}/$id',
      (data) => TransactionModel.fromJson(data['transaction'] ?? data),
    );
  }

  /// Cria uma nova transação
  Future<ApiResult<TransactionModel>> createTransaction(
    TransactionModel transaction,
  ) async {
    return _api.post<TransactionModel>(
      ApiConstants.transactions,
      transaction.toJson(),
      (data) => TransactionModel.fromJson(data['transaction'] ?? data),
    );
  }

  /// Atualiza uma transação
  Future<ApiResult<TransactionModel>> updateTransaction(
    String id,
    TransactionModel transaction,
  ) async {
    return _api.put<TransactionModel>(
      '${ApiConstants.transactions}/$id',
      transaction.toJson(),
      (data) => TransactionModel.fromJson(data['transaction'] ?? data),
    );
  }

  /// Deleta uma transação
  Future<ApiResult<bool>> deleteTransaction(String id) async {
    return _api.delete('${ApiConstants.transactions}/$id');
  }
}
