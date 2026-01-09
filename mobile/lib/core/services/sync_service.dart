import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'local_storage_service.dart';
import 'api_service.dart';
import '../constants/api_constants.dart';
import '../models/models.dart';

/// Serviço de sincronização inteligente em background
class SyncService {
  final ApiService _apiService;
  final LocalStorageService _localStorage;

  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  Timer? _syncTimer;
  bool _isSyncing = false;
  bool _isOnline = true;

  // Callbacks para notificar providers
  void Function(List<TransactionModel>)? onTransactionsUpdated;
  void Function(List<WalletModel>)? onWalletsUpdated;
  void Function(Map<String, List<String>>)? onCategoriesUpdated;

  SyncService({
    required ApiService apiService,
    required LocalStorageService localStorage,
  })  : _apiService = apiService,
        _localStorage = localStorage;

  /// Inicializa o serviço de sincronização
  Future<void> init() async {
    await _localStorage.init();

    // Monitora conectividade
    _connectivitySubscription = Connectivity()
        .onConnectivityChanged
        .listen(_handleConnectivityChange);

    // Verifica conectividade inicial
    final result = await Connectivity().checkConnectivity();
    _isOnline = !result.contains(ConnectivityResult.none);

    // Inicia timer de sincronização periódica (a cada 30 segundos)
    _syncTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _periodicSync(),
    );

    // Sincroniza imediatamente se online
    if (_isOnline) {
      _syncAll();
    }
  }

  /// Verifica se está online
  bool get isOnline => _isOnline;

  /// Verifica se está sincronizando
  bool get isSyncing => _isSyncing;

  void _handleConnectivityChange(List<ConnectivityResult> results) {
    final wasOffline = !_isOnline;
    _isOnline = !results.contains(ConnectivityResult.none);

    if (wasOffline && _isOnline) {
      // Voltou a ficar online - sincroniza tudo
      debugPrint('[SyncService] Conexão restaurada, sincronizando...');
      _syncAll();
    }
  }

  Future<void> _periodicSync() async {
    if (_isOnline && !_isSyncing) {
      await _syncPendingOperations();
    }
  }

  /// Sincroniza todas as operações pendentes e busca dados atualizados
  Future<void> _syncAll() async {
    if (_isSyncing) return;

    _isSyncing = true;

    try {
      // Primeiro, envia operações pendentes
      await _syncPendingOperations();

      // Depois, busca dados atualizados do servidor
      await _fetchLatestData();
    } catch (e) {
      debugPrint('[SyncService] Erro na sincronização: $e');
    } finally {
      _isSyncing = false;
    }
  }

  /// Sincroniza operações pendentes com o servidor
  Future<void> _syncPendingOperations() async {
    if (!_isOnline) return;

    final operations = await _localStorage.getPendingOperations();
    if (operations.isEmpty) return;

    debugPrint('[SyncService] Sincronizando ${operations.length} operações pendentes...');

    final completedIds = <String>[];

    for (final op in operations) {
      try {
        await _executePendingOperation(op);
        completedIds.add(op.id);
      } catch (e) {
        debugPrint('[SyncService] Falha ao sincronizar operação ${op.id}: $e');
        
        // Incrementa contador de retry
        if (op.retryCount < 5) {
          final updatedOp = op.copyWith(retryCount: op.retryCount + 1);
          final allOps = await _localStorage.getPendingOperations();
          final index = allOps.indexWhere((o) => o.id == op.id);
          if (index != -1) {
            allOps[index] = updatedOp;
          }
        } else {
          // Desiste após 5 tentativas
          completedIds.add(op.id);
        }
      }
    }

    if (completedIds.isNotEmpty) {
      await _localStorage.removePendingOperations(completedIds);
    }
  }

  Future<void> _executePendingOperation(PendingOperation op) async {
    switch (op.entityType) {
      case 'transaction':
        await _syncTransactionOperation(op);
        break;
      case 'wallet':
        await _syncWalletOperation(op);
        break;
    }
  }

  Future<void> _syncTransactionOperation(PendingOperation op) async {
    switch (op.type) {
      case OperationType.create:
        await _apiService.post<Map<String, dynamic>>(
          ApiConstants.transactions,
          op.data,
          (data) => data,
        );
        break;
      case OperationType.update:
        final id = op.data['id'] as String;
        await _apiService.put<Map<String, dynamic>>(
          '${ApiConstants.transactions}/$id',
          op.data,
          (data) => data,
        );
        break;
      case OperationType.delete:
        final id = op.data['id'] as String;
        await _apiService.delete('${ApiConstants.transactions}/$id');
        break;
    }
  }

  Future<void> _syncWalletOperation(PendingOperation op) async {
    switch (op.type) {
      case OperationType.create:
        await _apiService.post<Map<String, dynamic>>(
          ApiConstants.wallets,
          op.data,
          (data) => data,
        );
        break;
      case OperationType.update:
        final id = op.data['id'] as String;
        await _apiService.put<Map<String, dynamic>>(
          '${ApiConstants.wallets}/$id',
          op.data,
          (data) => data,
        );
        break;
      case OperationType.delete:
        final id = op.data['id'] as String;
        await _apiService.delete('${ApiConstants.wallets}/$id');
        break;
    }
  }

  /// Busca dados mais recentes do servidor
  Future<void> _fetchLatestData() async {
    if (!_isOnline) return;

    try {
      // Primeiro, busca operações pendentes para não sobrescrever
      final pendingOps = await _localStorage.getPendingOperations();
      final pendingTransactionIds = pendingOps
          .where((op) => op.entityType == 'transaction')
          .map((op) => op.data['id'] as String?)
          .whereType<String>()
          .toSet();

      // Busca transações
      final transactionsResult = await _apiService.getList<TransactionModel>(
        ApiConstants.transactions,
        TransactionModel.fromJson,
        // API returns array directly, no wrapper
      );
      if (transactionsResult.isSuccess && transactionsResult.data != null) {
        final remoteTransactions = transactionsResult.data!;
        
        // Faz merge inteligente preservando alterações locais pendentes
        final mergedTransactions = await _mergeTransactions(
          remoteTransactions, 
          pendingTransactionIds,
          pendingOps,
        );

        // Compara com cache local para detectar mudanças
        final cachedTransactions = await _localStorage.getCachedTransactions();
        if (_hasChanges(mergedTransactions, cachedTransactions)) {
          await _localStorage.cacheTransactions(mergedTransactions);
          onTransactionsUpdated?.call(mergedTransactions);
        }
      }

      // Busca carteiras
      final walletsResult = await _apiService.getList<WalletModel>(
        ApiConstants.wallets,
        WalletModel.fromJson,
        // API returns array directly, no wrapper
      );
      if (walletsResult.isSuccess && walletsResult.data != null) {
        final wallets = walletsResult.data!;
        await _localStorage.cacheWallets(wallets);
        onWalletsUpdated?.call(wallets);
      }

      // Busca categorias
      final categoriesResult = await _apiService.get<Map<String, List<String>>>(
        ApiConstants.categories,
        (data) => data['categories'] != null 
            ? Map<String, List<dynamic>>.from(data['categories']).map(
                (key, value) => MapEntry(key, List<String>.from(value)),
              ) 
            : {},
      );
      if (categoriesResult.isSuccess && categoriesResult.data != null) {
        final categories = categoriesResult.data!;
        await _localStorage.cacheCategories(categories);
        onCategoriesUpdated?.call(categories);
      }

    } catch (e) {
      debugPrint('[SyncService] Erro ao buscar dados: $e');
    }
  }

  /// Faz merge inteligente de transações remotas com locais pendentes
  Future<List<TransactionModel>> _mergeTransactions(
    List<TransactionModel> remote,
    Set<String> pendingIds,
    List<PendingOperation> pendingOps,
  ) async {
    final localCache = await _localStorage.getCachedTransactions();
    final result = <TransactionModel>[];
    final processedIds = <String>{};

    // Primeiro, adiciona transações locais que foram criadas offline (temp_)
    for (final local in localCache) {
      if (local.id.startsWith('temp_')) {
        result.add(local);
        processedIds.add(local.id);
      }
    }

    // Para cada transação remota
    for (final remoteT in remote) {
      // Se tem operação pendente para essa transação, usa a versão local
      if (pendingIds.contains(remoteT.id)) {
        // Verifica se é delete pendente
        final isDeletePending = pendingOps.any(
          (op) => op.entityType == 'transaction' && 
                  op.type == OperationType.delete && 
                  op.data['id'] == remoteT.id,
        );
        
        if (isDeletePending) {
          // Não inclui - foi deletada localmente
          continue;
        }
        
        // Usa versão local (editada)
        final localT = localCache.firstWhere(
          (t) => t.id == remoteT.id,
          orElse: () => remoteT,
        );
        if (!processedIds.contains(localT.id)) {
          result.add(localT);
          processedIds.add(localT.id);
        }
      } else {
        // Sem operação pendente, usa versão do servidor
        if (!processedIds.contains(remoteT.id)) {
          result.add(remoteT);
          processedIds.add(remoteT.id);
        }
      }
    }

    // Ordena por data decrescente
    result.sort((a, b) => b.date.compareTo(a.date));

    return result;
  }

  /// Compara duas listas de transações para detectar mudanças
  bool _hasChanges(
    List<TransactionModel> remote,
    List<TransactionModel> local,
  ) {
    if (remote.length != local.length) return true;

    final remoteIds = remote.map((t) => t.id).toSet();
    final localIds = local.map((t) => t.id).toSet();

    if (!remoteIds.containsAll(localIds) || !localIds.containsAll(remoteIds)) {
      return true;
    }

    // Compara valores (usando updatedAt se disponível)
    for (final remoteT in remote) {
      final localT = local.firstWhere(
        (t) => t.id == remoteT.id,
        orElse: () => remoteT,
      );
      if (remoteT.amount != localT.amount ||
          remoteT.description != localT.description ||
          remoteT.category != localT.category) {
        return true;
      }
    }

    return false;
  }

  // ==================== MÉTODOS PÚBLICOS ====================

  /// Adiciona uma transação (offline-first)
  Future<TransactionModel> addTransaction(TransactionModel transaction) async {
    // Gera ID temporário se não tiver
    final tempId = transaction.id.isEmpty
        ? 'temp_${DateTime.now().millisecondsSinceEpoch}'
        : transaction.id;
    
    final transactionWithId = TransactionModel(
      id: tempId,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      walletId: transaction.walletId,
      date: transaction.date,
    );

    // Salva localmente primeiro
    await _localStorage.addTransactionToCache(transactionWithId);

    // Adiciona operação pendente
    await _localStorage.addPendingOperation(PendingOperation(
      id: 'op_${DateTime.now().millisecondsSinceEpoch}',
      type: OperationType.create,
      entityType: 'transaction',
      data: transactionWithId.toJson(),
      createdAt: DateTime.now(),
    ));

    // Tenta sincronizar imediatamente se online
    if (_isOnline) {
      _syncPendingOperations();
    }

    return transactionWithId;
  }

  /// Atualiza uma transação (offline-first)
  Future<void> updateTransaction(TransactionModel transaction) async {
    // Atualiza localmente primeiro
    await _localStorage.updateTransactionInCache(transaction);

    // Adiciona operação pendente
    await _localStorage.addPendingOperation(PendingOperation(
      id: 'op_${DateTime.now().millisecondsSinceEpoch}',
      type: OperationType.update,
      entityType: 'transaction',
      data: transaction.toJson(),
      createdAt: DateTime.now(),
    ));

    // Tenta sincronizar imediatamente se online
    if (_isOnline) {
      _syncPendingOperations();
    }
  }

  /// Remove uma transação (offline-first)
  Future<void> deleteTransaction(String transactionId) async {
    // Remove localmente primeiro
    await _localStorage.removeTransactionFromCache(transactionId);

    // Adiciona operação pendente (se não for ID temporário)
    if (!transactionId.startsWith('temp_')) {
      await _localStorage.addPendingOperation(PendingOperation(
        id: 'op_${DateTime.now().millisecondsSinceEpoch}',
        type: OperationType.delete,
        entityType: 'transaction',
        data: {'id': transactionId},
        createdAt: DateTime.now(),
      ));

      // Tenta sincronizar imediatamente se online
      if (_isOnline) {
        _syncPendingOperations();
      }
    }
  }

  /// Força uma sincronização completa
  Future<void> forceSync() async {
    if (_isOnline) {
      await _syncAll();
    }
  }

  /// Obtém transações (do cache ou servidor)
  Future<List<TransactionModel>> getTransactions({bool forceRefresh = false}) async {
    // Se online e forceRefresh, busca do servidor
    if (_isOnline && forceRefresh) {
      try {
        final result = await _apiService.getList<TransactionModel>(
          ApiConstants.transactions,
          TransactionModel.fromJson,
          // API returns array directly, no wrapper
        );
        if (result.isSuccess && result.data != null) {
          await _localStorage.cacheTransactions(result.data!);
          return result.data!;
        }
      } catch (e) {
        debugPrint('[SyncService] Falha ao buscar do servidor, usando cache: $e');
      }
    }

    // Retorna do cache
    return _localStorage.getCachedTransactions();
  }

  /// Verifica se há operações pendentes
  Future<bool> hasPendingOperations() async {
    return _localStorage.hasPendingOperations();
  }

  /// Libera recursos
  void dispose() {
    _connectivitySubscription?.cancel();
    _syncTimer?.cancel();
  }
}
