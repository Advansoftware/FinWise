import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/api_constants.dart';
import '../constants/app_constants.dart';
import '../models/models.dart';
import 'security_service.dart';

/// Resultado genérico de uma requisição à API
class ApiResult<T> {
  final T? data;
  final String? error;
  final int statusCode;

  ApiResult({this.data, this.error, required this.statusCode});

  bool get isSuccess => statusCode >= 200 && statusCode < 300;
  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
}

/// Serviço de API base do FinWise
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final SecurityService _securityService = SecurityService();
  
  String? _accessToken;
  String? _refreshToken;
  UserModel? _currentUser;

  String get baseUrl => ApiConstants.baseUrl;
  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _accessToken != null;
  String? get accessToken => _accessToken;

  /// Headers padrão para requisições autenticadas
  /// Inclui headers de segurança do app oficial
  Map<String, String> get _authHeaders {
    final headers = {
      'Content-Type': 'application/json',
      if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
    };
    
    // Adiciona headers de segurança do app oficial
    final securityHeaders = _securityService.getSecurityHeaders(_currentUser?.id);
    headers.addAll(securityHeaders);
    
    return headers;
  }

  /// Inicializa o serviço carregando tokens salvos
  Future<bool> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _accessToken = prefs.getString(AppConstants.accessTokenKey);
      _refreshToken = prefs.getString(AppConstants.refreshTokenKey);

      if (_accessToken != null) {
        // Tenta carregar dados do usuário
        final userJson = prefs.getString(AppConstants.userDataKey);
        if (userJson != null) {
          _currentUser = UserModel.fromJson(jsonDecode(userJson));
        }
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Erro ao inicializar ApiService: $e');
      return false;
    }
  }

  /// Salva os tokens no armazenamento local
  Future<void> _saveTokens(AuthTokensModel tokens) async {
    _accessToken = tokens.accessToken;
    _refreshToken = tokens.refreshToken;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.accessTokenKey, tokens.accessToken);
    await prefs.setString(AppConstants.refreshTokenKey, tokens.refreshToken);
  }

  /// Salva os dados do usuário
  Future<void> _saveUser(UserModel user) async {
    _currentUser = user;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.userDataKey, jsonEncode(user.toJson()));
  }

  /// Limpa todos os dados de autenticação
  Future<void> clearAuth() async {
    _accessToken = null;
    _refreshToken = null;
    _currentUser = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.accessTokenKey);
    await prefs.remove(AppConstants.refreshTokenKey);
    await prefs.remove(AppConstants.userDataKey);
  }

  /// Realiza login com email e senha
  Future<ApiResult<UserModel>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl${ApiConstants.login}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final user = UserModel.fromJson(data['user']);
        
        // A API retorna tokens no root, não em um objeto 'tokens'
        final tokens = AuthTokensModel(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'],
          expiresIn: data['expiresIn'] ?? 900,
        );

        await _saveTokens(tokens);
        await _saveUser(user);

        return ApiResult(data: user, statusCode: response.statusCode);
      }

      final error = _parseError(response);
      return ApiResult(error: error, statusCode: response.statusCode);
    } catch (e) {
      debugPrint('Erro no login: $e');
      return ApiResult(error: 'Erro de conexão: $e', statusCode: 0);
    }
  }

  /// Atualiza o access token usando o refresh token
  Future<bool> refreshAccessToken() async {
    if (_refreshToken == null) return false;

    try {
      final response = await http.post(
        Uri.parse('$baseUrl${ApiConstants.refresh}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': _refreshToken}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _accessToken = data['accessToken'];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.accessTokenKey, _accessToken!);
        return true;
      }

      // Se o refresh falhou, limpa autenticação
      await clearAuth();
      return false;
    } catch (e) {
      debugPrint('Erro ao atualizar token: $e');
      return false;
    }
  }

  /// Busca dados do usuário autenticado
  Future<ApiResult<UserModel>> getMe() async {
    return _authenticatedRequest<UserModel>(
      () => http.get(
        Uri.parse('$baseUrl${ApiConstants.me}'),
        headers: _authHeaders,
      ),
      (data) => UserModel.fromJson(data['user']),
    );
  }

  /// Realiza logout
  Future<void> logout() async {
    await clearAuth();
  }

  /// Executa uma requisição autenticada com retry automático
  Future<ApiResult<T>> _authenticatedRequest<T>(
    Future<http.Response> Function() request,
    T Function(Map<String, dynamic>) parser,
  ) async {
    try {
      var response = await request();

      // Se não autorizado, tenta refresh e retry
      if (response.statusCode == 401) {
        final refreshed = await refreshAccessToken();
        if (refreshed) {
          response = await request();
        }
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body);
        return ApiResult(data: parser(data), statusCode: response.statusCode);
      }

      return ApiResult(
        error: _parseError(response),
        statusCode: response.statusCode,
      );
    } catch (e) {
      debugPrint('Erro na requisição: $e');
      return ApiResult(error: 'Erro de conexão: $e', statusCode: 0);
    }
  }

  /// Faz parse do erro da resposta
  String _parseError(http.Response response) {
    try {
      final data = jsonDecode(response.body);
      return data['error'] ?? data['message'] ?? 'Erro desconhecido';
    } catch (e) {
      return 'Erro ${response.statusCode}';
    }
  }

  /// GET genérico
  Future<ApiResult<T>> get<T>(
    String endpoint,
    T Function(Map<String, dynamic>) parser, {
    Map<String, String>? queryParams,
  }) async {
    final uri = Uri.parse('$baseUrl$endpoint').replace(queryParameters: queryParams);
    return _authenticatedRequest<T>(
      () => http.get(uri, headers: _authHeaders),
      parser,
    );
  }

  /// GET que retorna lista
  Future<ApiResult<List<T>>> getList<T>(
    String endpoint,
    T Function(Map<String, dynamic>) parser, {
    Map<String, String>? queryParams,
    String? listKey,
  }) async {
    final uri = Uri.parse('$baseUrl$endpoint').replace(queryParameters: queryParams);

    try {
      var response = await http.get(uri, headers: _authHeaders);

      if (response.statusCode == 401) {
        final refreshed = await refreshAccessToken();
        if (refreshed) {
          response = await http.get(uri, headers: _authHeaders);
        }
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body);
        final List<dynamic> list = listKey != null ? data[listKey] : data;
        final items = list.map((item) => parser(item as Map<String, dynamic>)).toList();
        return ApiResult(data: items, statusCode: response.statusCode);
      }

      return ApiResult(
        error: _parseError(response),
        statusCode: response.statusCode,
      );
    } catch (e) {
      debugPrint('Erro na requisição: $e');
      return ApiResult(error: 'Erro de conexão: $e', statusCode: 0);
    }
  }

  /// POST genérico
  Future<ApiResult<T>> post<T>(
    String endpoint,
    Map<String, dynamic> body,
    T Function(Map<String, dynamic>) parser,
  ) async {
    return _authenticatedRequest<T>(
      () => http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: _authHeaders,
        body: jsonEncode(body),
      ),
      parser,
    );
  }

  /// PUT genérico
  Future<ApiResult<T>> put<T>(
    String endpoint,
    Map<String, dynamic> body,
    T Function(Map<String, dynamic>) parser,
  ) async {
    return _authenticatedRequest<T>(
      () => http.put(
        Uri.parse('$baseUrl$endpoint'),
        headers: _authHeaders,
        body: jsonEncode(body),
      ),
      parser,
    );
  }

  /// PATCH genérico
  Future<ApiResult<T>> patch<T>(
    String endpoint,
    Map<String, dynamic> body,
    T Function(Map<String, dynamic>) parser,
  ) async {
    return _authenticatedRequest<T>(
      () => http.patch(
        Uri.parse('$baseUrl$endpoint'),
        headers: _authHeaders,
        body: jsonEncode(body),
      ),
      parser,
    );
  }

  /// DELETE genérico
  Future<ApiResult<bool>> delete(String endpoint) async {
    try {
      var response = await http.delete(
        Uri.parse('$baseUrl$endpoint'),
        headers: _authHeaders,
      );

      if (response.statusCode == 401) {
        final refreshed = await refreshAccessToken();
        if (refreshed) {
          response = await http.delete(
            Uri.parse('$baseUrl$endpoint'),
            headers: _authHeaders,
          );
        }
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResult(data: true, statusCode: response.statusCode);
      }

      return ApiResult(
        error: _parseError(response),
        statusCode: response.statusCode,
      );
    } catch (e) {
      debugPrint('Erro na requisição: $e');
      return ApiResult(error: 'Erro de conexão: $e', statusCode: 0);
    }
  }
}
