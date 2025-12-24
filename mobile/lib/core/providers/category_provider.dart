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
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _categories = await _categoryService.getCategories();
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
