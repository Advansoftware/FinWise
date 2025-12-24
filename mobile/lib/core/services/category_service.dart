import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';

class CategoryService {
  final ApiService _apiService;

  CategoryService(this._apiService);

  /// Busca todas as categorias (padrão + personalizadas)
  Future<Map<String, List<String>>> getCategories() async {
    final result = await _apiService.get<Map<String, dynamic>>(
      ApiConstants.categories,
      (data) => data['categories'] != null 
          ? Map<String, List<dynamic>>.from(data['categories']).map(
              (key, value) => MapEntry(key, List<String>.from(value)),
            ) 
          : {},
    );

    if (result.isSuccess && result.data != null) {
      return result.data!;
    }
    throw Exception(result.error ?? 'Falha ao carregar categorias');
  }

  /// Adiciona uma categoria ou subcategoria
  Future<void> addCategory(String category, [String? subcategory]) async {
    final result = await _apiService.post(
      ApiConstants.categories,
      {
        'category': category,
        if (subcategory != null) 'subcategory': subcategory,
      },
      (data) => data,
    );

    if (!result.isSuccess) {
      throw Exception(result.error ?? 'Falha ao adicionar categoria');
    }
  }

  /// Remove uma categoria ou subcategoria
  Future<void> deleteCategory(String category, [String? subcategory]) async {
    final queryParams = {
      'category': category,
      if (subcategory != null) 'subcategory': subcategory,
    };
    
    final uri = Uri(queryParameters: queryParams);
    final endpoint = '${ApiConstants.categories}?${uri.query}';

    final result = await _apiService.delete(endpoint);

    if (!result.isSuccess) {
      throw Exception(result.error ?? 'Falha ao remover categoria');
    }
  }
}
