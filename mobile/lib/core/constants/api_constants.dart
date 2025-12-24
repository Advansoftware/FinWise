/// Constantes da API do Gastometria
class ApiConstants {
  ApiConstants._();

  /// URLs base da API
  /// Android Emulator: 10.0.2.2 mapeia para localhost do host
  static const String emulatorBaseUrl = 'http://10.0.2.2:9002/api/v1';
  
  /// Rede local: Use o IP da máquina para celular físico na mesma rede WiFi
  static const String localNetworkBaseUrl = 'http://192.168.3.28:9002/api/v1';
  
  /// Produção: URL real do servidor
  static const String prodBaseUrl = 'https://gastometria.com.br/api/v1';

  /// URL atual em uso
  /// - Para emulador: use emulatorBaseUrl
  /// - Para celular físico em dev: use localNetworkBaseUrl  
  /// - Para produção: use prodBaseUrl
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
