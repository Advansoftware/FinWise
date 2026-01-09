import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/services.dart';
import '../services/sync_service.dart';

/// Provider de carteiras
class WalletProvider extends ChangeNotifier {
  final WalletService _apiService = WalletService(); // Mantém para calculo de saldo se necessário, ou move lógica
  SyncService? _syncService;

  List<WalletModel> _wallets = [];
  bool _isLoading = false;
  String? _error;

  List<WalletModel> get wallets => _wallets;
  List<WalletModel> get activeWallets => 
      _wallets.where((w) => !w.isArchived).toList();
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Saldo total das carteiras ativas
  double get totalBalance {
    return _wallets
        .where((w) => w.includeInTotal && !w.isArchived)
        .fold(0.0, (sum, w) => sum + w.balance);
  }

  void setSyncService(SyncService service) {
    _syncService = service;
    _syncService?.onWalletsUpdated = _onRemoteWalletsUpdated;
    // Carrega dados iniciais do cache
    loadWallets();
  }

  void _onRemoteWalletsUpdated(List<WalletModel> wallets) {
    _wallets = wallets;
    notifyListeners();
  }

  /// Carrega carteiras
  Future<void> loadWallets({bool includeArchived = false}) async {
    if (_syncService == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final wallets = await _syncService!.getWallets(forceRefresh: true);
      _wallets = wallets;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Adiciona uma carteira
  Future<bool> addWallet(WalletModel wallet) async {
    if (_syncService == null) {
      _error = "SyncService não inicializado";
      notifyListeners();
      return false;
    }

    _isLoading = true;
    notifyListeners();

    try {
      final newWallet = await _syncService!.addWallet(wallet);
      // Atualiza lista localmente de imediato (optimistic UI já tratado no SyncService via cache, mas reforçamos)
      _wallets = await _syncService!.getWallets();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Atualiza uma carteira
  Future<bool> updateWallet(String id, WalletModel wallet) async {
    if (_syncService == null) return false;

    try {
      await _syncService!.updateWallet(wallet);
      // Recarrega do cache para garantir consistência
      _wallets = await _syncService!.getWallets();
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Remove uma carteira
  Future<bool> deleteWallet(String id) async {
    if (_syncService == null) return false;

    try {
      await _syncService!.deleteWallet(id);
      _wallets = _wallets.where((w) => w.id != id).toList();
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
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
