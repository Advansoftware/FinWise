/// Constantes da API do Gastometria
class ApiConstants {
  ApiConstants._();

  /// URLs base da API
  static const String devBaseUrl = 'http://10.0.2.2:9002/api/v1';
  static const String prodBaseUrl = 'https://gastometria.com.br/api/v1';

  /// Use esta para alternar entre dev e prod
  /// Em produção, mude para prodBaseUrl
  static const String baseUrl = prodBaseUrl;

  /// Endpoints de autenticação
  static const String login = '/login';
  static const String refresh = '/refresh';
  static const String me = '/me';

  /// Endpoints de dados
  static const String transactions = '/transactions';
  static const String wallets = '/wallets';
  static const String budgets = '/budgets';
  static const String goals = '/goals';
  static const String installments = '/installments';
  static const String categories = '/categories';
  static const String credits = '/credits';
  static const String reports = '/reports';
  static const String settings = '/settings';

  /// Timeout padrão para requisições (em segundos)
  static const int connectionTimeout = 30;
  static const int receiveTimeout = 30;
}
