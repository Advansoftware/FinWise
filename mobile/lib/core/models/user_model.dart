/// Modelo de usuário do Gastometria
class UserModel {
  final String id;
  final String email;
  final String? displayName;
  final String? photoUrl;
  final String plan;
  final int aiCredits;
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.email,
    this.displayName,
    this.photoUrl,
    required this.plan,
    required this.aiCredits,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? json['_id'] ?? '',
      email: json['email'] ?? '',
      displayName: json['displayName'] ?? json['name'],
      photoUrl: json['photoUrl'] ?? json['image'],
      plan: json['plan'] ?? 'Free',
      aiCredits: json['aiCredits'] ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'displayName': displayName,
      'photoUrl': photoUrl,
      'plan': plan,
      'aiCredits': aiCredits,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  bool get isInfinity => plan == 'Infinity';
  bool get isPro => plan == 'Pro' || plan == 'Infinity';

  UserModel copyWith({
    String? id,
    String? email,
    String? displayName,
    String? photoUrl,
    String? plan,
    int? aiCredits,
    DateTime? createdAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      photoUrl: photoUrl ?? this.photoUrl,
      plan: plan ?? this.plan,
      aiCredits: aiCredits ?? this.aiCredits,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
