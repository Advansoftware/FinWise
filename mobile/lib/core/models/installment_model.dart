/// Modelo de Parcelamento
class InstallmentModel {
  final String id;
  final String name;
  final String? description;
  final double totalAmount;
  final int totalInstallments;
  final double installmentAmount;
  final String category;
  final String? subcategory;
  final String? establishment;
  final DateTime startDate;
  final String sourceWalletId;
  final bool isActive;
  final bool isRecurring;
  final String? recurringType; // 'monthly' | 'yearly'
  final DateTime? endDate;
  final int paidInstallments;
  final int remainingInstallments;
  final double totalPaid;
  final double remainingAmount;
  final DateTime? nextDueDate;
  final bool isCompleted;
  final List<InstallmentPayment> payments;

  InstallmentModel({
    required this.id,
    required this.name,
    this.description,
    required this.totalAmount,
    required this.totalInstallments,
    required this.installmentAmount,
    required this.category,
    this.subcategory,
    this.establishment,
    required this.startDate,
    required this.sourceWalletId,
    this.isActive = true,
    this.isRecurring = false,
    this.recurringType,
    this.endDate,
    this.paidInstallments = 0,
    this.remainingInstallments = 0,
    this.totalPaid = 0,
    this.remainingAmount = 0,
    this.nextDueDate,
    this.isCompleted = false,
    this.payments = const [],
  });

  factory InstallmentModel.fromJson(Map<String, dynamic> json) {
    return InstallmentModel(
      id: json['id'] as String? ?? json['_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
      totalInstallments: json['totalInstallments'] as int? ?? 0,
      installmentAmount: (json['installmentAmount'] as num?)?.toDouble() ?? 0,
      category: json['category'] as String? ?? 'Outros',
      subcategory: json['subcategory'] as String?,
      establishment: json['establishment'] as String?,
      startDate: json['startDate'] != null
          ? DateTime.parse(json['startDate'] as String)
          : DateTime.now(),
      sourceWalletId: json['sourceWalletId'] as String? ?? '',
      isActive: json['isActive'] as bool? ?? true,
      isRecurring: json['isRecurring'] as bool? ?? false,
      recurringType: json['recurringType'] as String?,
      endDate: json['endDate'] != null
          ? DateTime.parse(json['endDate'] as String)
          : null,
      paidInstallments: json['paidInstallments'] as int? ?? 0,
      remainingInstallments: json['remainingInstallments'] as int? ?? 0,
      totalPaid: (json['totalPaid'] as num?)?.toDouble() ?? 0,
      remainingAmount: (json['remainingAmount'] as num?)?.toDouble() ?? 0,
      nextDueDate: json['nextDueDate'] != null
          ? DateTime.parse(json['nextDueDate'] as String)
          : null,
      isCompleted: json['isCompleted'] as bool? ?? false,
      payments: (json['payments'] as List<dynamic>?)
              ?.map((p) => InstallmentPayment.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'totalAmount': totalAmount,
      'totalInstallments': totalInstallments,
      'installmentAmount': installmentAmount,
      'category': category,
      'subcategory': subcategory,
      'establishment': establishment,
      'startDate': startDate.toIso8601String(),
      'sourceWalletId': sourceWalletId,
      'isActive': isActive,
      'isRecurring': isRecurring,
      'recurringType': recurringType,
      'endDate': endDate?.toIso8601String(),
      'paidInstallments': paidInstallments,
      'remainingInstallments': remainingInstallments,
      'totalPaid': totalPaid,
      'remainingAmount': remainingAmount,
      'nextDueDate': nextDueDate?.toIso8601String(),
      'isCompleted': isCompleted,
      'payments': payments.map((p) => p.toJson()).toList(),
    };
  }

  double get progress => totalInstallments > 0
      ? paidInstallments / totalInstallments
      : 0;
}

/// Modelo de Pagamento de Parcela
class InstallmentPayment {
  final String id;
  final int installmentNumber;
  final DateTime dueDate;
  final double scheduledAmount;
  final double? paidAmount;
  final DateTime? paidDate;
  final String status; // 'pending' | 'paid' | 'overdue'
  final String? transactionId;

  InstallmentPayment({
    required this.id,
    required this.installmentNumber,
    required this.dueDate,
    required this.scheduledAmount,
    this.paidAmount,
    this.paidDate,
    required this.status,
    this.transactionId,
  });

  factory InstallmentPayment.fromJson(Map<String, dynamic> json) {
    return InstallmentPayment(
      id: json['id'] as String? ?? json['_id'] as String? ?? '',
      installmentNumber: json['installmentNumber'] as int? ?? 0,
      dueDate: json['dueDate'] != null
          ? DateTime.parse(json['dueDate'] as String)
          : DateTime.now(),
      scheduledAmount: (json['scheduledAmount'] as num?)?.toDouble() ?? 0,
      paidAmount: (json['paidAmount'] as num?)?.toDouble(),
      paidDate: json['paidDate'] != null
          ? DateTime.parse(json['paidDate'] as String)
          : null,
      status: json['status'] as String? ?? 'pending',
      transactionId: json['transactionId'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'installmentNumber': installmentNumber,
      'dueDate': dueDate.toIso8601String(),
      'scheduledAmount': scheduledAmount,
      'paidAmount': paidAmount,
      'paidDate': paidDate?.toIso8601String(),
      'status': status,
      'transactionId': transactionId,
    };
  }

  bool get isPaid => status == 'paid';
  bool get isOverdue => status == 'overdue';
  bool get isPending => status == 'pending';
}

/// Resumo de Parcelamentos
class InstallmentSummary {
  final int activeCount;
  final double monthlyTotal;
  final int overdueCount;
  final int completedCount;

  InstallmentSummary({
    required this.activeCount,
    required this.monthlyTotal,
    required this.overdueCount,
    required this.completedCount,
  });

  factory InstallmentSummary.fromJson(Map<String, dynamic> json) {
    return InstallmentSummary(
      activeCount: json['activeCount'] as int? ?? 0,
      monthlyTotal: (json['monthlyTotal'] as num?)?.toDouble() ?? 0,
      overdueCount: json['overdueCount'] as int? ?? 0,
      completedCount: json['completedCount'] as int? ?? 0,
    );
  }
}
