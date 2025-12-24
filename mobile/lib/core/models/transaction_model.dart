/// Tipos de transação
enum TransactionType { income, expense, transfer }

/// Modelo de transação
class TransactionModel {
  final String id;
  final String description;
  final double amount;
  final TransactionType type;
  final String? category;
  final String? categoryIcon;
  final String? walletId;
  final String? walletName;
  final DateTime date;
  final bool isPaid;
  final String? notes;
  final List<String>? tags;
  final String? installmentId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  TransactionModel({
    required this.id,
    required this.description,
    required this.amount,
    required this.type,
    this.category,
    this.categoryIcon,
    this.walletId,
    this.walletName,
    required this.date,
    this.isPaid = true,
    this.notes,
    this.tags,
    this.installmentId,
    this.createdAt,
    this.updatedAt,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['_id'] ?? json['id'] ?? '',
      description: json['item'] ?? json['description'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      type: _parseType(json['type']),
      category: json['category'],
      categoryIcon: json['categoryIcon'],
      walletId: json['walletId'],
      walletName: json['walletName'],
      date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
      isPaid: json['isPaid'] ?? true,
      notes: json['notes'],
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
      installmentId: json['installmentId'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'])
          : null,
    );
  }

  static TransactionType _parseType(String? type) {
    switch (type?.toLowerCase()) {
      case 'income':
        return TransactionType.income;
      case 'transfer':
        return TransactionType.transfer;
      case 'expense':
      default:
        return TransactionType.expense;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'description': description,
      'amount': amount,
      'type': type.name,
      'category': category,
      'walletId': walletId,
      'date': date.toIso8601String(),
      'isPaid': isPaid,
      'notes': notes,
      'tags': tags,
    };
  }

  bool get isExpense => type == TransactionType.expense;
  bool get isIncome => type == TransactionType.income;
  bool get isTransfer => type == TransactionType.transfer;

  TransactionModel copyWith({
    String? id,
    String? description,
    double? amount,
    TransactionType? type,
    String? category,
    String? categoryIcon,
    String? walletId,
    String? walletName,
    DateTime? date,
    bool? isPaid,
    String? notes,
    List<String>? tags,
    String? installmentId,
  }) {
    return TransactionModel(
      id: id ?? this.id,
      description: description ?? this.description,
      amount: amount ?? this.amount,
      type: type ?? this.type,
      category: category ?? this.category,
      categoryIcon: categoryIcon ?? this.categoryIcon,
      walletId: walletId ?? this.walletId,
      walletName: walletName ?? this.walletName,
      date: date ?? this.date,
      isPaid: isPaid ?? this.isPaid,
      notes: notes ?? this.notes,
      tags: tags ?? this.tags,
      installmentId: installmentId ?? this.installmentId,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
