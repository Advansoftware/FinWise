import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/biometric_service.dart';

/// Estados de autenticação
enum AuthState { 
  initial, 
  loading, 
  authenticated, 
  unauthenticated, 
  error,
  awaitingBiometric, // Aguardando validação biométrica
  biometricFailed,   // Biometria falhou, precisa login manual
}

/// Provider de autenticação
class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final BiometricService _biometricService = BiometricService();

  AuthState _state = AuthState.initial;
  UserModel? _user;
  String? _errorMessage;
  bool _biometricAvailable = false;
  bool _biometricEnabled = false;
  bool _hasValidToken = false;
  int _biometricAttempts = 0;
  static const int _maxBiometricAttempts = 3;

  AuthState get state => _state;
  UserModel? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _state == AuthState.authenticated;
  bool get isLoading => _state == AuthState.loading;
  bool get biometricAvailable => _biometricAvailable;
  bool get biometricEnabled => _biometricEnabled;
  bool get needsBiometricValidation => 
      _hasValidToken && _biometricEnabled && _state == AuthState.awaitingBiometric;

  /// Inicializa o provider verificando tokens salvos
  Future<void> initialize() async {
    _state = AuthState.loading;
    notifyListeners();

    // Verifica disponibilidade de biometria
    _biometricAvailable = await _biometricService.isBiometricAvailable();
    _biometricEnabled = await _biometricService.isBiometricEnabled();

    final hasToken = await _api.initialize();
    _hasValidToken = hasToken;

    if (hasToken) {
      // Tem token salvo - verifica se biometria está habilitada
      if (_biometricEnabled && _biometricAvailable) {
        // Aguarda validação biométrica na splash screen
        _state = AuthState.awaitingBiometric;
        _biometricAttempts = 0;
      } else {
        // Sem biometria, valida token diretamente
        await _validateTokenAndAuthenticate();
      }
    } else {
      _state = AuthState.unauthenticated;
    }

    notifyListeners();
  }

  /// Valida token e autentica
  Future<bool> _validateTokenAndAuthenticate() async {
    final result = await _api.getMe();
    if (result.isSuccess && result.data != null) {
      _user = result.data;
      _state = AuthState.authenticated;
      notifyListeners();
      return true;
    } else {
      _state = AuthState.unauthenticated;
      _hasValidToken = false;
      notifyListeners();
      return false;
    }
  }

  /// Tenta autenticação biométrica (chamado pela splash screen)
  Future<bool> authenticateWithBiometric() async {
    if (!_hasValidToken || !_biometricEnabled) {
      _state = AuthState.unauthenticated;
      notifyListeners();
      return false;
    }

    _biometricAttempts++;
    
    final authenticated = await _biometricService.authenticate();

    if (authenticated) {
      // Biometria confirmada, valida token
      return await _validateTokenAndAuthenticate();
    }

    // Biometria falhou
    if (_biometricAttempts >= _maxBiometricAttempts) {
      // Excedeu tentativas - vai para login manual
      _state = AuthState.biometricFailed;
      _errorMessage = 'Biometria falhou. Faça login com email e senha.';
      notifyListeners();
      return false;
    }

    // Ainda pode tentar novamente
    _state = AuthState.awaitingBiometric;
    notifyListeners();
    return false;
  }

  /// Retorna tentativas restantes de biometria
  int get biometricAttemptsRemaining => _maxBiometricAttempts - _biometricAttempts;

  /// Pula biometria e vai para login manual
  void skipBiometric() {
    _state = AuthState.biometricFailed;
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
      _hasValidToken = true;
      _biometricAttempts = 0;
      
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
    _hasValidToken = false;
    _state = AuthState.unauthenticated;
    notifyListeners();
  }

  /// Realiza logout completo (limpa biometria também)
  Future<void> logoutComplete() async {
    await _api.logout();
    await _biometricService.clearBiometricData();
    _biometricEnabled = false;
    _hasValidToken = false;
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
