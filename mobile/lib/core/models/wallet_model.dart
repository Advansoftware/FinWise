/// Tipos de carteira
enum WalletType { checking, savings, cash, creditCard, investment, other }

/// Modelo de carteira
class WalletModel {
  final String id;
  final String name;
  final WalletType type;
  final double balance;
  final String? icon;
  final String? color;
  final bool isArchived;
  final bool includeInTotal;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  WalletModel({
    required this.id,
    required this.name,
    required this.type,
    required this.balance,
    this.icon,
    this.color,
    this.isArchived = false,
    this.includeInTotal = true,
    this.createdAt,
    this.updatedAt,
  });

  factory WalletModel.fromJson(Map<String, dynamic> json) {
    return WalletModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      type: _parseType(json['type']),
      balance: (json['balance'] ?? 0).toDouble(),
      icon: json['icon'],
      color: json['color'],
      isArchived: json['isArchived'] ?? false,
      includeInTotal: json['includeInTotal'] ?? true,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'])
          : null,
    );
  }

  static WalletType _parseType(String? type) {
    switch (type?.toLowerCase()) {
      case 'checking':
      case 'conta corrente':
        return WalletType.checking;
      case 'savings':
      case 'poupança':
        return WalletType.savings;
      case 'cash':
      case 'dinheiro':
        return WalletType.cash;
      case 'creditcard':
      case 'credit_card':
      case 'cartão de crédito':
      case 'cartao de credito':
        return WalletType.creditCard;
      case 'investment':
      case 'investimento':
        return WalletType.investment;
      default:
        return WalletType.other;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'type': type.name,
      'balance': balance,
      'icon': icon,
      'color': color,
      'isArchived': isArchived,
      'includeInTotal': includeInTotal,
    };
  }

  WalletModel copyWith({
    String? id,
    String? name,
    WalletType? type,
    double? balance,
    String? icon,
    String? color,
    bool? isArchived,
    bool? includeInTotal,
  }) {
    return WalletModel(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      balance: balance ?? this.balance,
      icon: icon ?? this.icon,
      color: color ?? this.color,
      isArchived: isArchived ?? this.isArchived,
      includeInTotal: includeInTotal ?? this.includeInTotal,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
