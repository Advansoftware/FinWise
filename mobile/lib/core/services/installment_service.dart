import '../constants/api_constants.dart';
import '../models/models.dart';
import 'api_service.dart';

/// Service para gerenciar parcelamentos
class InstallmentService {
  final ApiService _api = ApiService();

  /// Busca todos os parcelamentos com resumo
  Future<ApiResult<List<InstallmentModel>>> getInstallments() async {
    return _api.getList<InstallmentModel>(
      ApiConstants.installments,
      InstallmentModel.fromJson,
      queryParams: {'summary': 'true'},
      listKey: 'installments',
    );
  }

  /// Busca um parcelamento por ID
  Future<ApiResult<InstallmentModel>> getInstallment(String id) async {
    return _api.get<InstallmentModel>(
      '${ApiConstants.installments}/$id',
      (data) => InstallmentModel.fromJson(data['installment'] ?? data),
    );
  }

  /// Cria um novo parcelamento
  Future<ApiResult<InstallmentModel>> createInstallment(
    InstallmentModel installment,
  ) async {
    return _api.post<InstallmentModel>(
      ApiConstants.installments,
      installment.toJson(),
      (data) => InstallmentModel.fromJson(data['installment'] ?? data),
    );
  }

  /// Atualiza um parcelamento
  Future<ApiResult<InstallmentModel>> updateInstallment(
    String id,
    InstallmentModel installment,
  ) async {
    return _api.put<InstallmentModel>(
      '${ApiConstants.installments}/$id',
      installment.toJson(),
      (data) => InstallmentModel.fromJson(data['installment'] ?? data),
    );
  }

  /// Exclui um parcelamento
  Future<ApiResult<bool>> deleteInstallment(String id) async {
    return _api.delete('${ApiConstants.installments}/$id');
  }

  /// Marca uma parcela como paga
  Future<ApiResult<InstallmentModel>> markAsPaid(
    String installmentId,
    String paymentId, {
    double? amount,
  }) async {
    final body = amount != null ? {'amount': amount} : <String, dynamic>{};
    return _api.post<InstallmentModel>(
      '${ApiConstants.installments}/$installmentId/payments/$paymentId/pay',
      body,
      (data) => InstallmentModel.fromJson(data['installment'] ?? data),
    );
  }
}

/// Service para gerenciar categorias
class CategoryService {
  final ApiService _api = ApiService();

  /// Busca todas as categorias
  Future<ApiResult<List<CategoryModel>>> getCategories() async {
    try {
      final result = await _api.getList<CategoryModel>(
        ApiConstants.categories,
        CategoryModel.fromJson,
        listKey: 'categories',
      );

      if (result.isSuccess && result.data != null && result.data!.isNotEmpty) {
        return result;
      }

      // Retorna categorias padrão se a API falhar
      return ApiResult(
        data: _defaultCategories,
        statusCode: 200,
      );
    } catch (e) {
      return ApiResult(
        data: _defaultCategories,
        statusCode: 200,
      );
    }
  }

  static final List<CategoryModel> _defaultCategories = [
    CategoryModel(
        name: 'Supermercado',
        subcategories: ['Alimentos', 'Bebidas', 'Higiene'],
        type: 'expense'),
    CategoryModel(
        name: 'Transporte',
        subcategories: ['Combustível', 'Uber', 'Ônibus', 'Manutenção'],
        type: 'expense'),
    CategoryModel(
        name: 'Alimentação',
        subcategories: ['Restaurante', 'Delivery', 'Lanche'],
        type: 'expense'),
    CategoryModel(
        name: 'Entretenimento',
        subcategories: ['Cinema', 'Streaming', 'Jogos'],
        type: 'expense'),
    CategoryModel(
        name: 'Saúde',
        subcategories: ['Farmácia', 'Consultas', 'Exames'],
        type: 'expense'),
    CategoryModel(
        name: 'Educação',
        subcategories: ['Cursos', 'Livros', 'Material'],
        type: 'expense'),
    CategoryModel(
        name: 'Moradia',
        subcategories: ['Aluguel', 'Condomínio', 'IPTU'],
        type: 'expense'),
    CategoryModel(
        name: 'Contas',
        subcategories: ['Luz', 'Água', 'Internet', 'Telefone'],
        type: 'expense'),
    CategoryModel(
        name: 'Lazer',
        subcategories: ['Viagem', 'Hobby', 'Esportes'],
        type: 'expense'),
    CategoryModel(
        name: 'Vestuário',
        subcategories: ['Roupas', 'Calçados', 'Acessórios'],
        type: 'expense'),
    CategoryModel(name: 'Outros', subcategories: [], type: 'expense'),
    CategoryModel(
        name: 'Salário',
        subcategories: ['Salário', 'Bônus', '13º'],
        type: 'income'),
    CategoryModel(
        name: 'Investimentos',
        subcategories: ['Dividendos', 'Rendimentos'],
        type: 'income'),
    CategoryModel(
        name: 'Vendas',
        subcategories: ['Produtos', 'Serviços'],
        type: 'income'),
    CategoryModel(name: 'Transferência', subcategories: [], type: 'expense'),
  ];
}
