import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/services.dart';

/// Provider de carteiras
class WalletProvider extends ChangeNotifier {
  final WalletService _service = WalletService();

  List<WalletModel> _wallets = [];
  bool _isLoading = false;
  String? _error;

  List<WalletModel> get wallets => _wallets;
  List<WalletModel> get activeWallets => 
      _wallets.where((w) => !w.isArchived).toList();
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Saldo total das carteiras ativas
  double get totalBalance => _service.calculateTotalBalance(_wallets);

  /// Carrega carteiras
  Future<void> loadWallets({bool includeArchived = false}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final result = await _service.getWallets(includeArchived: includeArchived);

    if (result.isSuccess && result.data != null) {
      _wallets = result.data!;
    } else {
      _error = result.error;
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Adiciona uma carteira
  Future<bool> addWallet(WalletModel wallet) async {
    _isLoading = true;
    notifyListeners();

    final result = await _service.createWallet(wallet);

    if (result.isSuccess && result.data != null) {
      _wallets = [..._wallets, result.data!];
      _isLoading = false;
      notifyListeners();
      return true;
    }

    _error = result.error;
    _isLoading = false;
    notifyListeners();
    return false;
  }

  /// Atualiza uma carteira
  Future<bool> updateWallet(String id, WalletModel wallet) async {
    final result = await _service.updateWallet(id, wallet);

    if (result.isSuccess && result.data != null) {
      final index = _wallets.indexWhere((w) => w.id == id);
      if (index >= 0) {
        _wallets[index] = result.data!;
        notifyListeners();
      }
      return true;
    }

    _error = result.error;
    notifyListeners();
    return false;
  }

  /// Remove uma carteira
  Future<bool> deleteWallet(String id) async {
    final result = await _service.deleteWallet(id);

    if (result.isSuccess) {
      _wallets = _wallets.where((w) => w.id != id).toList();
      notifyListeners();
      return true;
    }

    _error = result.error;
    notifyListeners();
    return false;
  }

  /// Busca carteira por ID
  WalletModel? getWalletById(String id) {
    try {
      return _wallets.firstWhere((w) => w.id == id);
    } catch (_) {
      return null;
    }
  }

  /// Limpa erro
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
