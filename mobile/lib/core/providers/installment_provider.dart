import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/services.dart';

/// Provider de parcelamentos com suporte offline-first
class InstallmentProvider extends ChangeNotifier {
  final InstallmentService _service = InstallmentService();
  late final LocalStorageService _localStorage;

  List<InstallmentModel> _installments = [];
  InstallmentSummary? _summary;
  bool _isLoading = false;
  bool _isRefreshing = false;
  String? _error;
  bool _isOfflineMode = false;

  List<InstallmentModel> get installments => _installments;
  List<InstallmentModel> get activeInstallments => 
      _installments.where((i) => i.isActive && !i.isCompleted).toList();
  List<InstallmentModel> get completedInstallments => 
      _installments.where((i) => i.isCompleted).toList();
  InstallmentSummary? get summary => _summary;
  bool get isLoading => _isLoading;
  bool get isRefreshing => _isRefreshing;
  String? get error => _error;
  bool get isOfflineMode => _isOfflineMode;

  InstallmentProvider() {
    _localStorage = LocalStorageService();
    _initOfflineSupport();
  }

  Future<void> _initOfflineSupport() async {
    await _localStorage.init();
    // Carrega parcelamentos do cache local primeiro (instantâneo)
    final cached = await _localStorage.getCachedInstallments();
    if (cached.isNotEmpty) {
      _installments = cached;
      _updateSummary();
      notifyListeners();
    }
  }

  /// Carrega parcelamentos - offline first
  Future<void> loadInstallments({bool forceRefresh = false}) async {
    // Se não temos dados, mostra loading
    if (_installments.isEmpty) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    } else {
      // Se já temos dados do cache, mostra refresh indicator sutil
      _isRefreshing = true;
      notifyListeners();
    }

    final result = await _service.getInstallments();

    if (result.isSuccess && result.data != null) {
      _installments = result.data!;
      _updateSummary();
      _isOfflineMode = false;
      
      // Debug: log installments data
      for (final inst in _installments) {
        debugPrint('[InstallmentProvider] Loaded: ${inst.name}, payments=${inst.payments.length}, paidInstallments=${inst.paidInstallments}/${inst.totalInstallments}');
      }
      
      // Salva no cache local
      await _localStorage.cacheInstallments(_installments);
    } else {
      // Fallback para cache local se offline
      if (_installments.isEmpty) {
        final cached = await _localStorage.getCachedInstallments();
        if (cached.isNotEmpty) {
          _installments = cached;
          _updateSummary();
          _isOfflineMode = true;
          _error = null; // Limpa erro pois usamos cache
        } else {
          _error = result.error;
        }
      } else {
        _isOfflineMode = true;
      }
    }

    _isLoading = false;
    _isRefreshing = false;
    notifyListeners();
  }

  /// Cria um parcelamento
  Future<bool> createInstallment(InstallmentModel installment) async {
    _isLoading = true;
    notifyListeners();

    final result = await _service.createInstallment(installment);

    if (result.isSuccess && result.data != null) {
      _installments = [result.data!, ..._installments];
      _updateSummary();
      
      // Atualiza cache
      await _localStorage.cacheInstallments(_installments);
      
      _isLoading = false;
      notifyListeners();
      return true;
    }

    _error = result.error;
    _isLoading = false;
    notifyListeners();
    return false;
  }

  /// Atualiza um parcelamento
  Future<bool> updateInstallment(String id, InstallmentModel installment) async {
    final result = await _service.updateInstallment(id, installment);

    if (result.isSuccess && result.data != null) {
      final index = _installments.indexWhere((i) => i.id == id);
      if (index >= 0) {
        _installments[index] = result.data!;
        _updateSummary();
        
        // Atualiza cache
        await _localStorage.updateInstallmentInCache(result.data!);
        
        notifyListeners();
      }
      return true;
    }

    _error = result.error;
    notifyListeners();
    return false;
  }

  /// Remove um parcelamento
  Future<bool> deleteInstallment(String id) async {
    final result = await _service.deleteInstallment(id);

    if (result.isSuccess) {
      _installments = _installments.where((i) => i.id != id).toList();
      _updateSummary();
      
      // Atualiza cache
      await _localStorage.cacheInstallments(_installments);
      
      notifyListeners();
      return true;
    }

    _error = result.error;
    notifyListeners();
    return false;
  }

  /// Marca parcela como paga
  Future<bool> markAsPaid(String installmentId, int installmentNumber, {double? amount}) async {
    debugPrint('[InstallmentProvider] markAsPaid called: id=$installmentId, number=$installmentNumber');
    
    final result = await _service.markAsPaid(installmentId, installmentNumber, amount: amount);

    debugPrint('[InstallmentProvider] markAsPaid result: success=${result.isSuccess}, hasData=${result.data != null}, error=${result.error}');

    if (result.isSuccess && result.data != null) {
      debugPrint('[InstallmentProvider] Payment successful, updating local state...');
      final index = _installments.indexWhere((i) => i.id == installmentId);
      if (index >= 0) {
        _installments[index] = result.data!;
        _updateSummary();
        
        // Atualiza cache imediatamente
        await _localStorage.updateInstallmentInCache(result.data!);
        
        debugPrint('[InstallmentProvider] Local state updated, installment now has ${result.data!.payments.length} payments');
        notifyListeners();
      }
      return true;
    }

    _error = result.error;
    debugPrint('[InstallmentProvider] markAsPaid FAILED: ${result.error}');
    notifyListeners();
    return false;
  }

  void _updateSummary() {
    final active = _installments.where((i) => i.isActive && !i.isCompleted).toList();
    final overdue = _installments
        .expand((i) => i.payments)
        .where((p) => p.isOverdue)
        .length;
    final completed = _installments.where((i) => i.isCompleted).length;
    final monthlyTotal = active.fold<double>(0, (sum, i) => sum + i.installmentAmount);

    _summary = InstallmentSummary(
      activeCount: active.length,
      monthlyTotal: monthlyTotal,
      overdueCount: overdue,
      completedCount: completed,
    );
  }

  /// Limpa erro
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
