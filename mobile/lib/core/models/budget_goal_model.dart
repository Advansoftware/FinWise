/// Modelo de Orçamento
class BudgetModel {
  final String id;
  final String? name;
  final String category;
  final String? subcategory;
  final double amount;
  final String period; // 'monthly', 'weekly', 'yearly'
  final double spent; // currentSpending
  final double remaining;
  final double percentUsed;

  BudgetModel({
    required this.id,
    this.name,
    required this.category,
    this.subcategory,
    required this.amount,
    this.period = 'monthly',
    this.spent = 0,
    double? remaining,
    double? percentUsed,
  })  : remaining = remaining ?? (amount - spent),
        percentUsed = percentUsed ?? (amount > 0 ? (spent / amount) * 100 : 0);

  factory BudgetModel.fromJson(Map<String, dynamic> json) {
    final amount = (json['amount'] as num?)?.toDouble() ?? 0;
    final spent = (json['currentSpending'] as num?)?.toDouble() ?? 
                  (json['spent'] as num?)?.toDouble() ?? 0;
    
    return BudgetModel(
      id: json['id'] as String? ?? json['_id'] as String? ?? '',
      name: json['name'] as String?,
      category: json['category'] as String? ?? 'Outros',
      subcategory: json['subcategory'] as String?,
      amount: amount,
      period: json['period'] as String? ?? 'monthly',
      spent: spent,
      remaining: (json['remainingAmount'] as num?)?.toDouble() ?? 
                 (json['remaining'] as num?)?.toDouble() ?? 
                 (amount - spent),
      percentUsed: (json['percentUsed'] as num?)?.toDouble() ?? 
          (amount > 0 ? (spent / amount) * 100 : 0),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id.isNotEmpty) 'id': id,
      if (name != null) 'name': name,
      'category': category,
      if (subcategory != null) 'subcategory': subcategory,
      'amount': amount,
      'period': period,
    };
  }

  double get progress => amount > 0 ? spent / amount : 0;
  bool get isOverBudget => spent > amount;
  
  // Alias para compatibilidade
  double get currentSpending => spent;
  double get remainingAmount => remaining;
}

/// Modelo de Meta
class GoalModel {
  final String id;
  final String name;
  final String? description;
  final double targetAmount;
  final double currentAmount;
  final double? monthlyDeposit;
  final DateTime? targetDate;
  final String? icon;
  final String? color;

  GoalModel({
    required this.id,
    required this.name,
    this.description,
    required this.targetAmount,
    this.currentAmount = 0,
    this.monthlyDeposit,
    this.targetDate,
    this.icon,
    this.color,
  });

  factory GoalModel.fromJson(Map<String, dynamic> json) {
    return GoalModel(
      id: json['id'] as String? ?? json['_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      targetAmount: (json['targetAmount'] as num?)?.toDouble() ?? 0,
      currentAmount: (json['currentAmount'] as num?)?.toDouble() ?? 0,
      monthlyDeposit: (json['monthlyDeposit'] as num?)?.toDouble(),
      targetDate: json['targetDate'] != null
          ? DateTime.parse(json['targetDate'] as String)
          : null,
      icon: json['icon'] as String?,
      color: json['color'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'targetAmount': targetAmount,
      'currentAmount': currentAmount,
      'monthlyDeposit': monthlyDeposit,
      'targetDate': targetDate?.toIso8601String(),
      'icon': icon,
      'color': color,
    };
  }

  double get progress => targetAmount > 0 ? currentAmount / targetAmount : 0;
  double get remainingAmount => targetAmount - currentAmount;
  bool get isCompleted => currentAmount >= targetAmount;
}

/// Modelo de Categoria
class CategoryModel {
  final String name;
  final List<String> subcategories;
  final String type; // 'expense' | 'income'

  CategoryModel({
    required this.name,
    this.subcategories = const [],
    this.type = 'expense',
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      name: json['name'] as String? ?? '',
      subcategories: (json['subcategories'] as List<dynamic>?)
              ?.map((s) => s.toString())
              .toList() ??
          [],
      type: json['type'] as String? ?? 'expense',
    );
  }
}
