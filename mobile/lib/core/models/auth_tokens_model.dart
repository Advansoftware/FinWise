/// Modelo para tokens de autenticação
class AuthTokensModel {
  final String accessToken;
  final String refreshToken;
  final int expiresIn;
  final DateTime expiresAt;

  AuthTokensModel({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
    DateTime? expiresAt,
  }) : expiresAt = expiresAt ?? DateTime.now().add(Duration(seconds: expiresIn));

  factory AuthTokensModel.fromJson(Map<String, dynamic> json) {
    final expiresIn = json['expiresIn'] ?? 3600;
    return AuthTokensModel(
      accessToken: json['accessToken'] ?? '',
      refreshToken: json['refreshToken'] ?? '',
      expiresIn: expiresIn,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'expiresIn': expiresIn,
      'expiresAt': expiresAt.toIso8601String(),
    };
  }

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  /// Verifica se o token expira em menos de 5 minutos
  bool get isAboutToExpire {
    return DateTime.now().add(const Duration(minutes: 5)).isAfter(expiresAt);
  }

  AuthTokensModel copyWithNewAccessToken(String newAccessToken, int newExpiresIn) {
    return AuthTokensModel(
      accessToken: newAccessToken,
      refreshToken: refreshToken,
      expiresIn: newExpiresIn,
    );
  }
}
