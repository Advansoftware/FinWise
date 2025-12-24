/// Modelo de orçamento
class BudgetModel {
  final String id;
  final String name;
  final String? category;
  final double limit;
  final double spent;
  final String? color;
  final String? icon;
  final int month;
  final int year;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  BudgetModel({
    required this.id,
    required this.name,
    this.category,
    required this.limit,
    required this.spent,
    this.color,
    this.icon,
    required this.month,
    required this.year,
    this.createdAt,
    this.updatedAt,
  });

  factory BudgetModel.fromJson(Map<String, dynamic> json) {
    return BudgetModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      category: json['category'],
      limit: (json['limit'] ?? json['amount'] ?? 0).toDouble(),
      spent: (json['spent'] ?? 0).toDouble(),
      color: json['color'],
      icon: json['icon'],
      month: json['month'] ?? DateTime.now().month,
      year: json['year'] ?? DateTime.now().year,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'category': category,
      'limit': limit,
      'month': month,
      'year': year,
      'color': color,
      'icon': icon,
    };
  }

  double get remaining => limit - spent;
  double get percentUsed => limit > 0 ? (spent / limit) * 100 : 0;
  bool get isOverBudget => spent > limit;
  bool get isNearLimit => percentUsed >= 80 && !isOverBudget;

  BudgetModel copyWith({
    String? id,
    String? name,
    String? category,
    double? limit,
    double? spent,
    String? color,
    String? icon,
    int? month,
    int? year,
  }) {
    return BudgetModel(
      id: id ?? this.id,
      name: name ?? this.name,
      category: category ?? this.category,
      limit: limit ?? this.limit,
      spent: spent ?? this.spent,
      color: color ?? this.color,
      icon: icon ?? this.icon,
      month: month ?? this.month,
      year: year ?? this.year,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
