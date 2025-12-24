import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/services.dart';

/// Provider de parcelamentos
class InstallmentProvider extends ChangeNotifier {
  final InstallmentService _service = InstallmentService();

  List<InstallmentModel> _installments = [];
  InstallmentSummary? _summary;
  bool _isLoading = false;
  String? _error;

  List<InstallmentModel> get installments => _installments;
  List<InstallmentModel> get activeInstallments => 
      _installments.where((i) => i.isActive && !i.isCompleted).toList();
  List<InstallmentModel> get completedInstallments => 
      _installments.where((i) => i.isCompleted).toList();
  InstallmentSummary? get summary => _summary;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Carrega parcelamentos
  Future<void> loadInstallments() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final result = await _service.getInstallments();

    if (result.isSuccess && result.data != null) {
      _installments = result.data!;
      _updateSummary();
    } else {
      _error = result.error;
    }

    _isLoading = false;
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
      notifyListeners();
      return true;
    }

    _error = result.error;
    notifyListeners();
    return false;
  }

  /// Marca parcela como paga
  Future<bool> markAsPaid(String installmentId, int installmentNumber, {double? amount}) async {
    final result = await _service.markAsPaid(installmentId, installmentNumber, amount: amount);

    if (result.isSuccess && result.data != null) {
      final index = _installments.indexWhere((i) => i.id == installmentId);
      if (index >= 0) {
        _installments[index] = result.data!;
        _updateSummary();
        notifyListeners();
      }
      return true;
    }

    _error = result.error;
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

/// Provider de categorias
class CategoryProvider extends ChangeNotifier {
  final CategoryService _service = CategoryService();

  List<CategoryModel> _categories = [];
  bool _isLoading = false;

  List<CategoryModel> get categories => _categories;
  List<CategoryModel> get expenseCategories => 
      _categories.where((c) => c.type == 'expense').toList();
  List<CategoryModel> get incomeCategories => 
      _categories.where((c) => c.type == 'income').toList();
  bool get isLoading => _isLoading;

  /// Carrega categorias
  Future<void> loadCategories() async {
    if (_categories.isNotEmpty) return; // Já carregado
    
    _isLoading = true;
    notifyListeners();

    final result = await _service.getCategories();

    if (result.isSuccess && result.data != null) {
      _categories = result.data!;
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Retorna subcategorias de uma categoria
  List<String> getSubcategories(String categoryName) {
    final category = _categories.firstWhere(
      (c) => c.name == categoryName,
      orElse: () => CategoryModel(name: categoryName),
    );
    return category.subcategories;
  }
}
