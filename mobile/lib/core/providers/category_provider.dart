import 'package:flutter/foundation.dart';
import '../services/category_service.dart';

class CategoryProvider extends ChangeNotifier {
  final CategoryService _categoryService;

  CategoryProvider(this._categoryService);

  Map<String, List<String>> _categories = {};
  bool _isLoading = false;
  String? _error;

  Map<String, List<String>> get categories => _categories;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadCategories() async {
    // Carrega do cache primeiro (instantâneo)
    try {
      final cached = await _categoryService.getCachedCategories();
      if (cached.isNotEmpty) {
        _categories = cached;
        _isLoading = false; // Tem dados, não mostra loading
        notifyListeners();
      } else {
        _isLoading = true; // Se não tem cache, mostra loading
        notifyListeners();
      }
    } catch (_) {
      // Ignora erro de cache
      _isLoading = true;
      notifyListeners();
    }

    _error = null;

    try {
      // Busca atualizada da API
      final fresh = await _categoryService.getCategories();
      _categories = fresh;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addCategory(String category, [String? subcategory]) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _categoryService.addCategory(category, subcategory);
      await loadCategories(); // Recarrega para garantir sync
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> deleteCategory(String category, [String? subcategory]) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _categoryService.deleteCategory(category, subcategory);
      await loadCategories(); // Recarrega para garantir sync
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }
}
