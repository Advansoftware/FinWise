import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/services.dart';

/// Provider de transações
class TransactionProvider extends ChangeNotifier {
  final TransactionService _service = TransactionService();

  List<TransactionModel> _transactions = [];
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;

  List<TransactionModel> get transactions => _transactions;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasMore => _hasMore;

  /// Carrega transações (primeira página)
  Future<void> loadTransactions({
    int? month,
    int? year,
    String? walletId,
    bool refresh = false,
  }) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    final result = await _service.getTransactions(
      month: month,
      year: year,
      walletId: walletId,
      page: _currentPage,
    );

    if (result.isSuccess && result.data != null) {
      if (refresh || _currentPage == 1) {
        _transactions = result.data!;
      } else {
        _transactions = [..._transactions, ...result.data!];
      }
      _hasMore = result.data!.length >= 50;
    } else {
      _error = result.error;
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Carrega mais transações (próxima página)
  Future<void> loadMore({int? month, int? year, String? walletId}) async {
    if (!_hasMore || _isLoading) return;

    _currentPage++;
    await loadTransactions(
      month: month,
      year: year,
      walletId: walletId,
    );
  }

  /// Adiciona uma transação
  Future<bool> addTransaction(TransactionModel transaction) async {
    _isLoading = true;
    notifyListeners();

    final result = await _service.createTransaction(transaction);

    if (result.isSuccess && result.data != null) {
      _transactions = [result.data!, ..._transactions];
      _isLoading = false;
      notifyListeners();
      return true;
    }

    _error = result.error;
    _isLoading = false;
    notifyListeners();
    return false;
  }

  /// Atualiza uma transação
  Future<bool> updateTransaction(String id, TransactionModel transaction) async {
    final result = await _service.updateTransaction(id, transaction);

    if (result.isSuccess && result.data != null) {
      final index = _transactions.indexWhere((t) => t.id == id);
      if (index >= 0) {
        _transactions[index] = result.data!;
        notifyListeners();
      }
      return true;
    }

    _error = result.error;
    notifyListeners();
    return false;
  }

  /// Remove uma transação
  Future<bool> deleteTransaction(String id) async {
    final result = await _service.deleteTransaction(id);

    if (result.isSuccess) {
      _transactions = _transactions.where((t) => t.id != id).toList();
      notifyListeners();
      return true;
    }

    _error = result.error;
    notifyListeners();
    return false;
  }

  /// Calcula totais
  double get totalIncome => _transactions
      .where((t) => t.isIncome)
      .fold(0.0, (sum, t) => sum + t.amount);

  double get totalExpense => _transactions
      .where((t) => t.isExpense)
      .fold(0.0, (sum, t) => sum + t.amount);

  double get balance => totalIncome - totalExpense;

  /// Limpa erro
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
