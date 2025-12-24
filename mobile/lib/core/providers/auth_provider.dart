import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/biometric_service.dart';

/// Estados de autenticação
enum AuthState { initial, loading, authenticated, unauthenticated, error }

/// Provider de autenticação
class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final BiometricService _biometricService = BiometricService();

  AuthState _state = AuthState.initial;
  UserModel? _user;
  String? _errorMessage;
  bool _biometricAvailable = false;
  bool _biometricEnabled = false;

  AuthState get state => _state;
  UserModel? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _state == AuthState.authenticated;
  bool get isLoading => _state == AuthState.loading;
  bool get biometricAvailable => _biometricAvailable;
  bool get biometricEnabled => _biometricEnabled;

  /// Inicializa o provider verificando tokens salvos
  Future<void> initialize() async {
    _state = AuthState.loading;
    notifyListeners();

    // Verifica disponibilidade de biometria
    _biometricAvailable = await _biometricService.isBiometricAvailable();
    _biometricEnabled = await _biometricService.isBiometricEnabled();

    final hasToken = await _api.initialize();

    if (hasToken) {
      // Verifica se o token ainda é válido
      final result = await _api.getMe();
      if (result.isSuccess && result.data != null) {
        _user = result.data;
        _state = AuthState.authenticated;
      } else {
        _state = AuthState.unauthenticated;
      }
    } else {
      _state = AuthState.unauthenticated;
    }

    notifyListeners();
  }

  /// Realiza login
  Future<bool> login(String email, String password) async {
    _state = AuthState.loading;
    _errorMessage = null;
    notifyListeners();

    final result = await _api.login(email, password);

    if (result.isSuccess && result.data != null) {
      _user = result.data;
      _state = AuthState.authenticated;
      
      // Marca que o usuário já fez login (para habilitar biometria)
      await _biometricService.setHasLoggedIn();
      
      notifyListeners();
      return true;
    }

    _errorMessage = result.error ?? 'Erro ao fazer login';
    _state = AuthState.error;
    notifyListeners();
    return false;
  }

  /// Realiza login usando biometria
  Future<bool> loginWithBiometric() async {
    if (!_biometricAvailable || !_biometricEnabled) {
      return false;
    }

    _state = AuthState.loading;
    _errorMessage = null;
    notifyListeners();

    final authenticated = await _biometricService.authenticate();

    if (authenticated) {
      // Biometria confirmada, verifica se há token válido
      final hasToken = await _api.initialize();
      
      if (hasToken) {
        final result = await _api.getMe();
        if (result.isSuccess && result.data != null) {
          _user = result.data;
          _state = AuthState.authenticated;
          notifyListeners();
          return true;
        }
      }
      
      // Token expirou, precisa fazer login normal
      _errorMessage = 'Sessão expirada. Faça login novamente.';
      _state = AuthState.error;
      notifyListeners();
      return false;
    }

    _state = AuthState.unauthenticated;
    notifyListeners();
    return false;
  }

  /// Habilita ou desabilita biometria
  Future<void> setBiometricEnabled(bool enabled) async {
    await _biometricService.setBiometricEnabled(enabled);
    _biometricEnabled = enabled;
    notifyListeners();
  }

  /// Verifica se pode mostrar opção de biometria
  Future<bool> canShowBiometricOption() async {
    final hasLoggedIn = await _biometricService.hasLoggedInBefore();
    return _biometricAvailable && hasLoggedIn;
  }

  /// Retorna descrição do tipo de biometria
  Future<String> getBiometricDescription() async {
    return await _biometricService.getBiometricTypeDescription();
  }

  /// Realiza logout
  Future<void> logout() async {
    await _api.logout();
    // Não limpa dados de biometria para permitir login rápido
    _user = null;
    _state = AuthState.unauthenticated;
    notifyListeners();
  }

  /// Realiza logout completo (limpa biometria também)
  Future<void> logoutComplete() async {
    await _api.logout();
    await _biometricService.clearBiometricData();
    _biometricEnabled = false;
    _user = null;
    _state = AuthState.unauthenticated;
    notifyListeners();
  }

  /// Atualiza dados do usuário
  Future<void> refreshUser() async {
    final result = await _api.getMe();
    if (result.isSuccess && result.data != null) {
      _user = result.data;
      notifyListeners();
    }
  }

  /// Limpa mensagem de erro
  void clearError() {
    _errorMessage = null;
    if (_state == AuthState.error) {
      _state = AuthState.unauthenticated;
    }
    notifyListeners();
  }
}
