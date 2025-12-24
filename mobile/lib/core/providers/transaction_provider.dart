import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/services.dart';

/// Provider de transações com suporte offline-first
class TransactionProvider extends ChangeNotifier {
  final TransactionService _service = TransactionService();
  late final LocalStorageService _localStorage;
  SyncService? _syncService;

  List<TransactionModel> _transactions = [];
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;
  bool _isOfflineMode = false;

  List<TransactionModel> get transactions => _transactions;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasMore => _hasMore;
  bool get hasMore => _hasMore;
  bool get isOfflineMode => _isOfflineMode;

  // Filtros ativos
  int? _filterMonth;
  int? _filterYear;
  String? _filterWalletId;
  String? _filterCategory;
  TransactionType? _filterType;

  // Getters para filtros
  int? get filterMonth => _filterMonth;
  int? get filterYear => _filterYear;
  String? get filterWalletId => _filterWalletId;
  String? get filterCategory => _filterCategory;
  TransactionType? get filterType => _filterType;

  TransactionProvider() {
    _localStorage = LocalStorageService();
    _initOfflineSupport();
  }

  /// Configura o SyncService para sincronização em background
  void setSyncService(SyncService syncService) {
    _syncService = syncService;
    _syncService!.onTransactionsUpdated = _onRemoteTransactionsUpdated;
  }

  Future<void> _initOfflineSupport() async {
    await _localStorage.init();
    // Carrega transações do cache local primeiro
    final cached = await _localStorage.getCachedTransactions();
    if (cached.isNotEmpty) {
      _transactions = cached;
      notifyListeners();
    }
  }

  void _onRemoteTransactionsUpdated(List<TransactionModel> transactions) {
    // Atualiza lista quando sincronização traz novos dados
    _transactions = transactions;
    _isOfflineMode = false;
    notifyListeners();
  }

  /// Aplica filtros e recarrega transações
  void setFilters({
    int? month,
    int? year,
    String? walletId,
    String? category,
    TransactionType? type,
  }) {
    if (month != null) _filterMonth = month;
    if (year != null) _filterYear = year;
    // WalletId pode ser null para limpar filtro
    _filterWalletId = walletId; 
    _filterCategory = category;
    _filterType = type;
    loadTransactions(refresh: true);
  }

  /// Limpa filtros (exceto mês/ano)
  void clearFilters() {
    _filterWalletId = null;
    _filterCategory = null;
    _filterType = null;
    loadTransactions(refresh: true);
  }

  /// Carrega transações (primeira página) - offline-first
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
    
    // Atualiza estado se parâmetros forem passados explicitamente (compatibilidade)
    if (month != null) _filterMonth = month;
    if (year != null) _filterYear = year;
    if (walletId != null) _filterWalletId = walletId;

    _isLoading = true;
    _error = null;
    notifyListeners();

    // Tenta carregar do servidor
    final result = await _service.getTransactions(
      month: _filterMonth,
      year: _filterYear,
      walletId: _filterWalletId,
      category: _filterCategory,
      type: _filterType,
      page: _currentPage,
    );

    if (result.isSuccess && result.data != null) {
      if (refresh || _currentPage == 1) {
        _transactions = result.data!;
      } else {
        _transactions = [..._transactions, ...result.data!];
      }
      _hasMore = result.data!.length >= 50;
      _isOfflineMode = false;

      // Salva no cache local
      await _localStorage.cacheTransactions(_transactions);
    } else {
      // Fallback para cache local
      _error = result.error;
      if (_transactions.isEmpty) {
        final cached = await _localStorage.getCachedTransactions();
        if (cached.isNotEmpty) {
          _transactions = cached;
          _isOfflineMode = true;
          _error = null; // Limpa erro pois temos dados do cache
        }
      } else {
        _isOfflineMode = true;
      }
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

  /// Adiciona uma transação (offline-first)
  Future<bool> addTransaction(TransactionModel transaction) async {
    // Adiciona localmente primeiro (otimistic update)
    final tempId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
    final tempTransaction = TransactionModel(
      id: tempId,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      walletId: transaction.walletId,
      date: transaction.date,
    );
    
    _transactions = [tempTransaction, ..._transactions];
    notifyListeners();

    // Salva no cache local
    await _localStorage.addTransactionToCache(tempTransaction);

    // Tenta enviar para o servidor
    final result = await _service.createTransaction(transaction);

    if (result.isSuccess && result.data != null) {
      // Substitui a transação temporária pela real
      final index = _transactions.indexWhere((t) => t.id == tempId);
      if (index >= 0) {
        _transactions[index] = result.data!;
      }
      
      // Atualiza cache com ID real
      await _localStorage.removeTransactionFromCache(tempId);
      await _localStorage.addTransactionToCache(result.data!);
      
      notifyListeners();
      return true;
    }

    // Falhou - mantém localmente e adiciona operação pendente
    _isOfflineMode = true;
    await _localStorage.addPendingOperation(PendingOperation(
      id: 'op_${DateTime.now().millisecondsSinceEpoch}',
      type: OperationType.create,
      entityType: 'transaction',
      data: tempTransaction.toJson(),
      createdAt: DateTime.now(),
    ));
    
    notifyListeners();
    return true; // Retorna true pois salvou localmente
  }

  /// Atualiza uma transação (offline-first)
  Future<bool> updateTransaction(String id, TransactionModel transaction) async {
    // Atualiza localmente primeiro
    final index = _transactions.indexWhere((t) => t.id == id);
    final oldTransaction = index >= 0 ? _transactions[index] : null;
    
    if (index >= 0) {
      _transactions[index] = transaction;
      notifyListeners();
    }

    // Salva no cache local
    await _localStorage.updateTransactionInCache(transaction);

    // Tenta enviar para o servidor
    final result = await _service.updateTransaction(id, transaction);

    if (result.isSuccess && result.data != null) {
      if (index >= 0) {
        _transactions[index] = result.data!;
        notifyListeners();
      }
      return true;
    }

    // Falhou - adiciona operação pendente
    _isOfflineMode = true;
    await _localStorage.addPendingOperation(PendingOperation(
      id: 'op_${DateTime.now().millisecondsSinceEpoch}',
      type: OperationType.update,
      entityType: 'transaction',
      data: transaction.toJson(),
      createdAt: DateTime.now(),
    ));
    
    return true; // Retorna true pois salvou localmente
  }

  /// Remove uma transação (offline-first)
  Future<bool> deleteTransaction(String id) async {
    // Remove localmente primeiro
    final removedTransaction = _transactions.firstWhere(
      (t) => t.id == id,
      orElse: () => TransactionModel(
        id: '', description: '', amount: 0, 
        type: TransactionType.expense, date: DateTime.now(),
      ),
    );
    
    _transactions = _transactions.where((t) => t.id != id).toList();
    notifyListeners();

    // Remove do cache local
    await _localStorage.removeTransactionFromCache(id);

    // Se for ID temporário, apenas remove
    if (id.startsWith('temp_')) {
      return true;
    }

    // Tenta enviar para o servidor
    final result = await _service.deleteTransaction(id);

    if (result.isSuccess) {
      return true;
    }

    // Falhou - adiciona operação pendente
    _isOfflineMode = true;
    await _localStorage.addPendingOperation(PendingOperation(
      id: 'op_${DateTime.now().millisecondsSinceEpoch}',
      type: OperationType.delete,
      entityType: 'transaction',
      data: {'id': id},
      createdAt: DateTime.now(),
    ));
    
    return true; // Retorna true pois removeu localmente
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
