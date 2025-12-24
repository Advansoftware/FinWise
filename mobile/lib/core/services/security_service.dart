// lib/core/services/security_service.dart
// Serviço de Segurança - Proteção do App Oficial Gastometria

import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:crypto/crypto.dart';

/// Serviço de segurança para proteção do app oficial
/// Implementa verificações de integridade e comunicação segura com a API
class SecurityService {
  static final SecurityService _instance = SecurityService._internal();
  factory SecurityService() => _instance;
  SecurityService._internal();

  // Token de sessão do app (renovado a cada inicialização)
  String? _appSessionToken;
  
  // Timestamp da última verificação
  DateTime? _lastIntegrityCheck;
  
  // Resultado da última verificação de integridade
  bool _isIntegrityValid = false;

  /// Identificador único do app oficial
  /// Este valor é verificado no servidor junto com outras medidas
  static const String _appIdentifier = 'gastometria-mobile-official';
  
  /// Versão do protocolo de segurança
  static const int _securityProtocolVersion = 1;

  /// Inicializa o serviço de segurança
  Future<void> initialize() async {
    await _performIntegrityCheck();
  }

  /// Verifica se o app está rodando em ambiente seguro
  Future<bool> _performIntegrityCheck() async {
    try {
      // Verificações básicas de segurança
      final checks = <bool>[
        !kDebugMode || kProfileMode, // Não é debug (exceto perfil)
        !await _isRunningOnEmulator(), // Não é emulador (opcional)
        !await _isRooted(), // Dispositivo não é rooteado
        await _verifyAppSignature(), // Assinatura do app é válida
      ];

      // Em debug mode, permite rodar (para desenvolvimento)
      if (kDebugMode) {
        _isIntegrityValid = true;
        _lastIntegrityCheck = DateTime.now();
        return true;
      }

      _isIntegrityValid = checks.every((check) => check);
      _lastIntegrityCheck = DateTime.now();
      
      return _isIntegrityValid;
    } catch (e) {
      debugPrint('SecurityService: Erro na verificação de integridade: $e');
      // Em caso de erro, permite continuar (fail-open para não quebrar o app)
      _isIntegrityValid = true;
      return true;
    }
  }

  /// Verifica se está rodando em emulador
  Future<bool> _isRunningOnEmulator() async {
    try {
      if (Platform.isAndroid) {
        // Verificações de emulador Android
        // Isso é apenas uma verificação básica
        return false; // Implementar verificação real se necessário
      } else if (Platform.isIOS) {
        // Verificações de simulador iOS
        return false;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Verifica se o dispositivo é rooteado/jailbroken
  Future<bool> _isRooted() async {
    try {
      if (Platform.isAndroid) {
        // Verificações básicas de root no Android
        final rootIndicators = [
          '/system/app/Superuser.apk',
          '/sbin/su',
          '/system/bin/su',
          '/system/xbin/su',
          '/data/local/xbin/su',
          '/data/local/bin/su',
          '/system/sd/xbin/su',
          '/system/bin/failsafe/su',
          '/data/local/su',
        ];

        for (final path in rootIndicators) {
          if (await File(path).exists()) {
            return true;
          }
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Verifica a assinatura do app
  Future<bool> _verifyAppSignature() async {
    try {
      // A verificação real da assinatura seria feita via platform channel
      // com código nativo que verifica o certificado do app
      // Por agora, retorna true
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Gera o token de autenticação do app oficial
  /// Este token identifica que a requisição vem do app oficial
  String generateAppAuthToken(String userId) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final nonce = _generateNonce();
    
    // Payload do token
    final payload = {
      'app': _appIdentifier,
      'ver': _securityProtocolVersion,
      'uid': userId,
      'ts': timestamp,
      'nonce': nonce,
      'platform': Platform.operatingSystem,
    };

    // Gera uma assinatura HMAC do payload
    final payloadJson = jsonEncode(payload);
    final signature = _signPayload(payloadJson);

    // Retorna o token codificado
    final token = base64Encode(utf8.encode('$payloadJson|$signature'));
    return token;
  }

  /// Gera um nonce aleatório
  String _generateNonce() {
    final random = DateTime.now().microsecondsSinceEpoch;
    return sha256.convert(utf8.encode('$random')).toString().substring(0, 16);
  }

  /// Assina o payload com HMAC
  String _signPayload(String payload) {
    // Em produção, usar uma chave segura armazenada de forma segura
    // Esta é uma implementação simplificada
    final key = utf8.encode('gastometria-app-secret-key-v1');
    final bytes = utf8.encode(payload);
    final hmacSha256 = Hmac(sha256, key);
    final digest = hmacSha256.convert(bytes);
    return digest.toString();
  }

  /// Headers de segurança para requisições da API
  Map<String, String> getSecurityHeaders(String? userId) {
    final headers = <String, String>{
      'X-App-Platform': Platform.operatingSystem,
      'X-App-Version': '1.0.0', // Versão do app
      'X-Security-Protocol': _securityProtocolVersion.toString(),
    };

    if (userId != null) {
      headers['X-App-Token'] = generateAppAuthToken(userId);
    }

    return headers;
  }

  /// Verifica se a verificação de integridade ainda é válida
  bool get isIntegrityValid {
    if (_lastIntegrityCheck == null) return false;
    
    // Revalidar a cada 5 minutos
    final fiveMinutesAgo = DateTime.now().subtract(const Duration(minutes: 5));
    if (_lastIntegrityCheck!.isBefore(fiveMinutesAgo)) {
      _performIntegrityCheck();
    }
    
    return _isIntegrityValid;
  }

  /// Verifica se o app está em modo de desenvolvimento
  bool get isDevelopmentMode => kDebugMode;
}

/// Mixin para proteção de telas sensíveis
mixin SecureScreenMixin {
  /// Previne screenshots (apenas no código - implementação real precisa de código nativo)
  void enableSecureScreen() {
    // Implementação via platform channel seria necessária
    // FLAG_SECURE no Android, etc.
  }

  /// Permite screenshots novamente
  void disableSecureScreen() {
    // Implementação via platform channel
  }
}
