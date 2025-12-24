import '../constants/api_constants.dart';
import '../models/models.dart';
import 'api_service.dart';

/// Serviço de carteiras
class WalletService {
  final ApiService _api = ApiService();

  /// Busca lista de carteiras
  Future<ApiResult<List<WalletModel>>> getWallets({
    bool includeArchived = false,
  }) async {
    final queryParams = <String, String>{
      if (includeArchived) 'includeArchived': 'true',
    };

    return _api.getList<WalletModel>(
      ApiConstants.wallets,
      WalletModel.fromJson,
      queryParams: queryParams.isNotEmpty ? queryParams : null,
      // API retorna array diretamente, sem wrapper
    );
  }

  /// Busca uma carteira por ID
  Future<ApiResult<WalletModel>> getWallet(String id) async {
    return _api.get<WalletModel>(
      '${ApiConstants.wallets}/$id',
      (data) => WalletModel.fromJson(data['wallet'] ?? data),
    );
  }

  /// Cria uma nova carteira
  Future<ApiResult<WalletModel>> createWallet(WalletModel wallet) async {
    return _api.post<WalletModel>(
      ApiConstants.wallets,
      wallet.toJson(),
      (data) => WalletModel.fromJson(data['wallet'] ?? data),
    );
  }

  /// Atualiza uma carteira
  Future<ApiResult<WalletModel>> updateWallet(
    String id,
    WalletModel wallet,
  ) async {
    return _api.put<WalletModel>(
      '${ApiConstants.wallets}/$id',
      wallet.toJson(),
      (data) => WalletModel.fromJson(data['wallet'] ?? data),
    );
  }

  /// Deleta uma carteira
  Future<ApiResult<bool>> deleteWallet(String id) async {
    return _api.delete('${ApiConstants.wallets}/$id');
  }

  /// Calcula o saldo total de todas as carteiras
  double calculateTotalBalance(List<WalletModel> wallets) {
    return wallets
        .where((w) => w.includeInTotal && !w.isArchived)
        .fold(0.0, (sum, w) => sum + w.balance);
  }
}
