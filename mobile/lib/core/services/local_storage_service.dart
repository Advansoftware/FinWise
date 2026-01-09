import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

/// Serviço de armazenamento local para funcionamento offline
class LocalStorageService {
  static const String _transactionsKey = 'cached_transactions';
  static const String _pendingOperationsKey = 'pending_operations';
  static const String _lastSyncKey = 'last_sync_timestamp';
  static const String _walletsKey = 'cached_wallets';
  static const String _installmentsKey = 'cached_installments';
  static const String _budgetsKey = 'cached_budgets';
  static const String _goalsKey = 'cached_goals';
  static const String _userKey = 'cached_user';

  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  SharedPreferences get prefs {
    if (_prefs == null) {
      throw Exception('LocalStorageService not initialized. Call init() first.');
    }
    return _prefs!;
  }

  // ==================== TRANSAÇÕES ====================

  /// Salva transações no cache local
  Future<void> cacheTransactions(List<TransactionModel> transactions) async {
    await init();
    final jsonList = transactions.map((t) => t.toJson()).toList();
    await prefs.setString(_transactionsKey, jsonEncode(jsonList));
    await prefs.setInt(_lastSyncKey, DateTime.now().millisecondsSinceEpoch);
  }

  /// Recupera transações do cache local
  Future<List<TransactionModel>> getCachedTransactions() async {
    await init();
    final jsonString = prefs.getString(_transactionsKey);
    if (jsonString == null || jsonString.isEmpty) return [];

    try {
      final jsonList = jsonDecode(jsonString) as List<dynamic>;
      return jsonList
          .map((json) => TransactionModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Adiciona uma transação ao cache local
  Future<void> addTransactionToCache(TransactionModel transaction) async {
    final transactions = await getCachedTransactions();
    transactions.insert(0, transaction);
    await cacheTransactions(transactions);
  }

  /// Atualiza uma transação no cache local
  Future<void> updateTransactionInCache(TransactionModel transaction) async {
    final transactions = await getCachedTransactions();
    final index = transactions.indexWhere((t) => t.id == transaction.id);
    if (index != -1) {
      transactions[index] = transaction;
      await cacheTransactions(transactions);
    }
  }

  /// Remove uma transação do cache local
  Future<void> removeTransactionFromCache(String transactionId) async {
    final transactions = await getCachedTransactions();
    transactions.removeWhere((t) => t.id == transactionId);
    await cacheTransactions(transactions);
  }

  // ==================== OPERAÇÕES PENDENTES ====================

  /// Adiciona uma operação pendente para sincronizar depois
  Future<void> addPendingOperation(PendingOperation operation) async {
    await init();
    final operations = await getPendingOperations();
    operations.add(operation);
    await _savePendingOperations(operations);
  }

  /// Recupera operações pendentes
  Future<List<PendingOperation>> getPendingOperations() async {
    await init();
    final jsonString = prefs.getString(_pendingOperationsKey);
    if (jsonString == null || jsonString.isEmpty) return [];

    try {
      final jsonList = jsonDecode(jsonString) as List<dynamic>;
      return jsonList
          .map((json) => PendingOperation.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Remove operações pendentes
  Future<void> removePendingOperations(List<String> operationIds) async {
    final operations = await getPendingOperations();
    operations.removeWhere((op) => operationIds.contains(op.id));
    await _savePendingOperations(operations);
  }

  /// Limpa todas as operações pendentes
  Future<void> clearPendingOperations() async {
    await init();
    await prefs.remove(_pendingOperationsKey);
  }

  Future<void> _savePendingOperations(List<PendingOperation> operations) async {
    final jsonList = operations.map((op) => op.toJson()).toList();
    await prefs.setString(_pendingOperationsKey, jsonEncode(jsonList));
  }

  // ==================== CARTEIRAS ====================

  /// Salva carteiras no cache local
  Future<void> cacheWallets(List<WalletModel> wallets) async {
    await init();
    final jsonList = wallets.map((w) => w.toJson()).toList();
    await prefs.setString(_walletsKey, jsonEncode(jsonList));
  }

  /// Recupera carteiras do cache local
  Future<List<WalletModel>> getCachedWallets() async {
    await init();
    final jsonString = prefs.getString(_walletsKey);
    if (jsonString == null || jsonString.isEmpty) return [];

    try {
      final jsonList = jsonDecode(jsonString) as List<dynamic>;
      return jsonList
          .map((json) => WalletModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  // ==================== PARCELAMENTOS ====================

  /// Salva parcelamentos no cache local
  Future<void> cacheInstallments(List<InstallmentModel> installments) async {
    await init();
    final jsonList = installments.map((i) => i.toJson()).toList();
    await prefs.setString(_installmentsKey, jsonEncode(jsonList));
  }

  /// Recupera parcelamentos do cache local
  Future<List<InstallmentModel>> getCachedInstallments() async {
    await init();
    final jsonString = prefs.getString(_installmentsKey);
    if (jsonString == null || jsonString.isEmpty) return [];

    try {
      final jsonList = jsonDecode(jsonString) as List<dynamic>;
      return jsonList
          .map((json) => InstallmentModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Atualiza um parcelamento no cache local
  Future<void> updateInstallmentInCache(InstallmentModel installment) async {
    final installments = await getCachedInstallments();
    final index = installments.indexWhere((i) => i.id == installment.id);
    if (index != -1) {
      installments[index] = installment;
      await cacheInstallments(installments);
    } else {
      // Se não existe, adiciona
      installments.insert(0, installment);
      await cacheInstallments(installments);
    }
  }

  // ==================== ORÇAMENTOS ====================

  /// Salva orçamentos no cache local
  Future<void> cacheBudgets(List<BudgetModel> budgets) async {
    await init();
    final jsonList = budgets.map((b) => b.toJson()).toList();
    await prefs.setString(_budgetsKey, jsonEncode(jsonList));
  }

  /// Recupera orçamentos do cache local
  Future<List<BudgetModel>> getCachedBudgets() async {
    await init();
    final jsonString = prefs.getString(_budgetsKey);
    if (jsonString == null || jsonString.isEmpty) return [];

    try {
      final jsonList = jsonDecode(jsonString) as List<dynamic>;
      return jsonList
          .map((json) => BudgetModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  // ==================== METAS ====================

  /// Salva metas no cache local
  Future<void> cacheGoals(List<GoalModel> goals) async {
    await init();
    final jsonList = goals.map((g) => g.toJson()).toList();
    await prefs.setString(_goalsKey, jsonEncode(jsonList));
  }

  /// Recupera metas do cache local
  Future<List<GoalModel>> getCachedGoals() async {
    await init();
    final jsonString = prefs.getString(_goalsKey);
    if (jsonString == null || jsonString.isEmpty) return [];

    try {
      final jsonList = jsonDecode(jsonString) as List<dynamic>;
      return jsonList
          .map((json) => GoalModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  // ==================== USUÁRIO ====================

  /// Salva dados do usuário no cache local
  Future<void> cacheUser(Map<String, dynamic> userData) async {
    await init();
    await prefs.setString(_userKey, jsonEncode(userData));
  }

  /// Recupera dados do usuário do cache local
  Future<Map<String, dynamic>?> getCachedUser() async {
    await init();
    final jsonString = prefs.getString(_userKey);
    if (jsonString == null || jsonString.isEmpty) return null;

    try {
      return jsonDecode(jsonString) as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }

  // ==================== SINCRONIZAÇÃO ====================

  /// Retorna timestamp da última sincronização
  Future<DateTime?> getLastSyncTime() async {
    await init();
    final timestamp = prefs.getInt(_lastSyncKey);
    if (timestamp == null) return null;
    return DateTime.fromMillisecondsSinceEpoch(timestamp);
  }

  /// Verifica se há operações pendentes
  Future<bool> hasPendingOperations() async {
    final operations = await getPendingOperations();
    return operations.isNotEmpty;
  }

  /// Limpa todo o cache local
  Future<void> clearAll() async {
    await init();
    await prefs.remove(_transactionsKey);
    await prefs.remove(_pendingOperationsKey);
    await prefs.remove(_lastSyncKey);
    await prefs.remove(_walletsKey);
    await prefs.remove(_installmentsKey);
    await prefs.remove(_userKey);
  }
}

/// Tipos de operação pendente
enum OperationType { create, update, delete }

/// Modelo de operação pendente para sincronização
class PendingOperation {
  final String id;
  final OperationType type;
  final String entityType; // 'transaction', 'wallet', etc.
  final Map<String, dynamic> data;
  final DateTime createdAt;
  final int retryCount;

  PendingOperation({
    required this.id,
    required this.type,
    required this.entityType,
    required this.data,
    required this.createdAt,
    this.retryCount = 0,
  });

  factory PendingOperation.fromJson(Map<String, dynamic> json) {
    return PendingOperation(
      id: json['id'] as String,
      type: OperationType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => OperationType.create,
      ),
      entityType: json['entityType'] as String,
      data: json['data'] as Map<String, dynamic>,
      createdAt: DateTime.parse(json['createdAt'] as String),
      retryCount: json['retryCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name,
      'entityType': entityType,
      'data': data,
      'createdAt': createdAt.toIso8601String(),
      'retryCount': retryCount,
    };
  }

  PendingOperation copyWith({int? retryCount}) {
    return PendingOperation(
      id: id,
      type: type,
      entityType: entityType,
      data: data,
      createdAt: createdAt,
      retryCount: retryCount ?? this.retryCount,
    );
  }
}
