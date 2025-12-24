import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Serviço de autenticação biométrica
class BiometricService {
  static final BiometricService _instance = BiometricService._internal();
  factory BiometricService() => _instance;
  BiometricService._internal();

  final LocalAuthentication _localAuth = LocalAuthentication();
  
  static const String _biometricEnabledKey = 'biometric_enabled';
  static const String _hasLoggedInBeforeKey = 'has_logged_in_before';

  /// Verifica se o dispositivo suporta biometria
  Future<bool> isDeviceSupported() async {
    try {
      return await _localAuth.isDeviceSupported();
    } on PlatformException catch (e) {
      debugPrint('Erro ao verificar suporte biométrico: $e');
      return false;
    }
  }

  /// Verifica se há biometria cadastrada no dispositivo
  Future<bool> canCheckBiometrics() async {
    try {
      return await _localAuth.canCheckBiometrics;
    } on PlatformException catch (e) {
      debugPrint('Erro ao verificar biometria disponível: $e');
      return false;
    }
  }

  /// Retorna os tipos de biometria disponíveis
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _localAuth.getAvailableBiometrics();
    } on PlatformException catch (e) {
      debugPrint('Erro ao obter biometrias disponíveis: $e');
      return [];
    }
  }

  /// Verifica se a biometria está disponível e habilitada
  Future<bool> isBiometricAvailable() async {
    final isSupported = await isDeviceSupported();
    final canCheck = await canCheckBiometrics();
    return isSupported && canCheck;
  }

  /// Verifica se o usuário habilitou login por biometria
  Future<bool> isBiometricEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_biometricEnabledKey) ?? false;
  }

  /// Habilita ou desabilita login por biometria
  Future<void> setBiometricEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_biometricEnabledKey, enabled);
  }

  /// Verifica se o usuário já fez login antes (necessário para biometria)
  Future<bool> hasLoggedInBefore() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_hasLoggedInBeforeKey) ?? false;
  }

  /// Marca que o usuário já fez login
  Future<void> setHasLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_hasLoggedInBeforeKey, true);
  }

  /// Limpa dados de biometria (logout)
  Future<void> clearBiometricData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_biometricEnabledKey);
    // Não remove hasLoggedInBefore para permitir reativar biometria
  }

  /// Autentica o usuário usando biometria
  Future<bool> authenticate({
    String reason = 'Autentique-se para acessar o Gastometria',
  }) async {
    try {
      final isAvailable = await isBiometricAvailable();
      if (!isAvailable) {
        debugPrint('Biometria não disponível');
        return false;
      }

      return await _localAuth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
          useErrorDialogs: true,
        ),
      );
    } on PlatformException catch (e) {
      debugPrint('Erro na autenticação biométrica: $e');
      return false;
    }
  }

  /// Retorna uma descrição amigável do tipo de biometria disponível
  Future<String> getBiometricTypeDescription() async {
    final biometrics = await getAvailableBiometrics();
    
    if (biometrics.contains(BiometricType.face)) {
      return 'Face ID';
    } else if (biometrics.contains(BiometricType.fingerprint)) {
      return 'Impressão digital';
    } else if (biometrics.contains(BiometricType.iris)) {
      return 'Íris';
    } else if (biometrics.contains(BiometricType.strong)) {
      return 'Biometria';
    } else if (biometrics.contains(BiometricType.weak)) {
      return 'Biometria';
    }
    
    return 'Biometria';
  }

  /// Retorna o ícone apropriado para o tipo de biometria
  Future<String> getBiometricIcon() async {
    final biometrics = await getAvailableBiometrics();
    
    if (biometrics.contains(BiometricType.face)) {
      return 'face';
    }
    return 'fingerprint';
  }
}
