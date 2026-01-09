// lib/core/models/report_model.dart

/// Modelo para dados de categoria nos relatórios
class CategoryData {
  final String category;
  final double amount;
  final double percentage;
  final int count;

  CategoryData({
    required this.category,
    required this.amount,
    required this.percentage,
    required this.count,
  });

  factory CategoryData.fromJson(Map<String, dynamic> json) {
    return CategoryData(
      category: json['category'] ?? json['name'] ?? '',
      amount: (json['amount'] ?? json['value'] ?? 0).toDouble(),
      percentage: (json['percentage'] ?? 0).toDouble(),
      count: json['count'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'category': category,
    'amount': amount,
    'percentage': percentage,
    'count': count,
  };
}

/// Dados mensais para relatório anual
class MonthlyData {
  final int month;
  final String monthName;
  final double income;
  final double expense;
  final double balance;
  final int transactionCount;

  MonthlyData({
    required this.month,
    required this.monthName,
    required this.income,
    required this.expense,
    required this.balance,
    required this.transactionCount,
  });

  factory MonthlyData.fromJson(Map<String, dynamic> json) {
    return MonthlyData(
      month: json['month'] ?? 1,
      monthName: json['monthName'] ?? '',
      income: (json['income'] ?? 0).toDouble(),
      expense: (json['expense'] ?? 0).toDouble(),
      balance: (json['balance'] ?? 0).toDouble(),
      transactionCount: json['transactionCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'month': month,
    'monthName': monthName,
    'income': income,
    'expense': expense,
    'balance': balance,
    'transactionCount': transactionCount,
  };
}

/// Resumo financeiro
class FinancialSummary {
  final double totalIncome;
  final double totalExpense;
  final double balance;
  final double averageDaily;
  final double savingsRate;
  final int transactionCount;
  final String? topCategory;
  final double? topCategoryAmount;

  FinancialSummary({
    required this.totalIncome,
    required this.totalExpense,
    required this.balance,
    required this.averageDaily,
    required this.savingsRate,
    required this.transactionCount,
    this.topCategory,
    this.topCategoryAmount,
  });

  factory FinancialSummary.fromJson(Map<String, dynamic> json) {
    return FinancialSummary(
      totalIncome: (json['totalIncome'] ?? 0).toDouble(),
      totalExpense: (json['totalExpense'] ?? 0).toDouble(),
      balance: (json['balance'] ?? 0).toDouble(),
      averageDaily: (json['averageDaily'] ?? 0).toDouble(),
      savingsRate: (json['savingsRate'] ?? 0).toDouble(),
      transactionCount: json['transactionCount'] ?? 0,
      topCategory: json['topCategory'],
      topCategoryAmount: json['topCategoryAmount']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    'totalIncome': totalIncome,
    'totalExpense': totalExpense,
    'balance': balance,
    'averageDaily': averageDaily,
    'savingsRate': savingsRate,
    'transactionCount': transactionCount,
    'topCategory': topCategory,
    'topCategoryAmount': topCategoryAmount,
  };
}

/// Modelo principal de relatório
class ReportModel {
  final String id;
  final String userId;
  final String type; // 'monthly' ou 'annual'
  final String period; // '2024-01' ou '2024'
  final FinancialSummary summary;
  final List<CategoryData> categoryBreakdown;
  final List<MonthlyData>? monthlyData; // Apenas para relatórios anuais
  final String? aiInsight;
  final String generatedAt;

  ReportModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.period,
    required this.summary,
    required this.categoryBreakdown,
    this.monthlyData,
    this.aiInsight,
    required this.generatedAt,
  });

  factory ReportModel.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>? ?? json;
    
    return ReportModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      type: json['type'] ?? 'monthly',
      period: json['period'] ?? '',
      summary: FinancialSummary.fromJson(data['summary'] ?? {}),
      categoryBreakdown: (data['categoryBreakdown'] as List? ?? [])
          .map((e) => CategoryData.fromJson(e))
          .toList(),
      monthlyData: data['monthlyData'] != null
          ? (data['monthlyData'] as List)
              .map((e) => MonthlyData.fromJson(e))
              .toList()
          : null,
      aiInsight: data['aiInsight'],
      generatedAt: json['generatedAt'] ?? DateTime.now().toIso8601String(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    'type': type,
    'period': period,
    'data': {
      'summary': summary.toJson(),
      'categoryBreakdown': categoryBreakdown.map((e) => e.toJson()).toList(),
      if (monthlyData != null)
        'monthlyData': monthlyData!.map((e) => e.toJson()).toList(),
      if (aiInsight != null) 'aiInsight': aiInsight,
    },
    'generatedAt': generatedAt,
  };

  /// Cria um relatório a partir de transações locais
  static ReportModel generateFromTransactions({
    required String userId,
    required String type,
    required String period,
    required List<Map<String, dynamic>> transactions,
  }) {
    double totalIncome = 0;
    double totalExpense = 0;
    final categoryMap = <String, CategoryData>{};
    
    for (final t in transactions) {
      final amount = (t['amount'] ?? 0).toDouble();
      final category = t['category'] ?? 'Outros';
      final txType = t['type'] ?? 'expense';
      
      if (txType == 'income') {
        totalIncome += amount;
      } else if (txType == 'expense') {
        totalExpense += amount;
        
        // Agrupa por categoria
        if (categoryMap.containsKey(category)) {
          final existing = categoryMap[category]!;
          categoryMap[category] = CategoryData(
            category: category,
            amount: existing.amount + amount,
            percentage: 0, // Calculado depois
            count: existing.count + 1,
          );
        } else {
          categoryMap[category] = CategoryData(
            category: category,
            amount: amount,
            percentage: 0,
            count: 1,
          );
        }
      }
    }
    
    // Calcula percentuais
    final categoryBreakdown = categoryMap.values.map((c) {
      return CategoryData(
        category: c.category,
        amount: c.amount,
        percentage: totalExpense > 0 ? (c.amount / totalExpense) * 100 : 0,
        count: c.count,
      );
    }).toList()
      ..sort((a, b) => b.amount.compareTo(a.amount));
    
    final balance = totalIncome - totalExpense;
    final double savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0.0;
    
    // Top category
    String? topCategory;
    double? topCategoryAmount;
    if (categoryBreakdown.isNotEmpty) {
      topCategory = categoryBreakdown.first.category;
      topCategoryAmount = categoryBreakdown.first.amount;
    }
    
    // Calcula média diária (aproximado: 30 dias por mês)
    final days = type == 'annual' ? 365 : 30;
    final averageDaily = totalExpense / days;
    
    return ReportModel(
      id: 'local_${DateTime.now().millisecondsSinceEpoch}',
      userId: userId,
      type: type,
      period: period,
      summary: FinancialSummary(
        totalIncome: totalIncome,
        totalExpense: totalExpense,
        balance: balance,
        averageDaily: averageDaily,
        savingsRate: savingsRate,
        transactionCount: transactions.length,
        topCategory: topCategory,
        topCategoryAmount: topCategoryAmount,
      ),
      categoryBreakdown: categoryBreakdown,
      generatedAt: DateTime.now().toIso8601String(),
    );
  }
}
