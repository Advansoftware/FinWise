/// Status da meta
enum GoalStatus { active, completed, cancelled }

/// Modelo de meta financeira
class GoalModel {
  final String id;
  final String name;
  final String? description;
  final double targetAmount;
  final double currentAmount;
  final String? icon;
  final String? color;
  final DateTime? targetDate;
  final GoalStatus status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  GoalModel({
    required this.id,
    required this.name,
    this.description,
    required this.targetAmount,
    required this.currentAmount,
    this.icon,
    this.color,
    this.targetDate,
    this.status = GoalStatus.active,
    this.createdAt,
    this.updatedAt,
  });

  factory GoalModel.fromJson(Map<String, dynamic> json) {
    return GoalModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      targetAmount: (json['targetAmount'] ?? json['target'] ?? 0).toDouble(),
      currentAmount: (json['currentAmount'] ?? json['current'] ?? 0).toDouble(),
      icon: json['icon'],
      color: json['color'],
      targetDate: json['targetDate'] != null
          ? DateTime.tryParse(json['targetDate'])
          : null,
      status: _parseStatus(json['status']),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'])
          : null,
    );
  }

  static GoalStatus _parseStatus(String? status) {
    switch (status?.toLowerCase()) {
      case 'completed':
        return GoalStatus.completed;
      case 'cancelled':
        return GoalStatus.cancelled;
      default:
        return GoalStatus.active;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'targetAmount': targetAmount,
      'currentAmount': currentAmount,
      'icon': icon,
      'color': color,
      'targetDate': targetDate?.toIso8601String(),
      'status': status.name,
    };
  }

  double get progress => targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  double get remaining => targetAmount - currentAmount;
  bool get isCompleted => currentAmount >= targetAmount || status == GoalStatus.completed;
  bool get isActive => status == GoalStatus.active;

  GoalModel copyWith({
    String? id,
    String? name,
    String? description,
    double? targetAmount,
    double? currentAmount,
    String? icon,
    String? color,
    DateTime? targetDate,
    GoalStatus? status,
  }) {
    return GoalModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      targetAmount: targetAmount ?? this.targetAmount,
      currentAmount: currentAmount ?? this.currentAmount,
      icon: icon ?? this.icon,
      color: color ?? this.color,
      targetDate: targetDate ?? this.targetDate,
      status: status ?? this.status,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
