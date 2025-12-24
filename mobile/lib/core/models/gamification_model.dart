// lib/core/models/gamification_model.dart
// Modelo de Gamificação

class BadgeModel {
  final String id;
  final String name;
  final String description;
  final String icon;
  final String rarity;
  final String? earnedAt;
  final bool isNew;

  BadgeModel({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.rarity,
    this.earnedAt,
    this.isNew = false,
  });

  factory BadgeModel.fromJson(Map<String, dynamic> json) {
    return BadgeModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      icon: json['icon'] ?? '🏅',
      rarity: json['rarity'] ?? 'common',
      earnedAt: json['earnedAt'],
      isNew: json['isNew'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'icon': icon,
      'rarity': rarity,
      'earnedAt': earnedAt,
      'isNew': isNew,
    };
  }
}

class LevelModel {
  final int level;
  final String name;
  final String title;
  final String icon;
  final String? description;
  final int pointsRequired;
  final int pointsToNext;
  final List<String> benefits;

  LevelModel({
    required this.level,
    required this.name,
    required this.title,
    required this.icon,
    this.description,
    required this.pointsRequired,
    required this.pointsToNext,
    required this.benefits,
  });

  factory LevelModel.fromJson(Map<String, dynamic> json) {
    return LevelModel(
      level: json['level'] ?? 1,
      name: json['name'] ?? 'Iniciante',
      title: json['title'] ?? 'Novato Financeiro',
      icon: json['icon'] ?? '🌱',
      description: json['description'],
      pointsRequired: json['pointsRequired'] ?? 0,
      pointsToNext: json['pointsToNext'] ?? 100,
      benefits: List<String>.from(json['benefits'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'level': level,
      'name': name,
      'title': title,
      'icon': icon,
      'description': description,
      'pointsRequired': pointsRequired,
      'pointsToNext': pointsToNext,
      'benefits': benefits,
    };
  }
}

class QuestModel {
  final String id;
  final String name;
  final String description;
  final String icon;
  final int xp;
  final String type; // daily, weekly, monthly
  final String status; // available, in_progress, completed, expired
  final int progress;
  final int target;
  final String expiresAt;

  QuestModel({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.xp,
    required this.type,
    required this.status,
    required this.progress,
    required this.target,
    required this.expiresAt,
  });

  factory QuestModel.fromJson(Map<String, dynamic> json) {
    return QuestModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      icon: json['icon'] ?? '📋',
      xp: json['xp'] ?? 0,
      type: json['type'] ?? 'daily',
      status: json['status'] ?? 'available',
      progress: json['progress'] ?? 0,
      target: json['target'] ?? 1,
      expiresAt: json['expiresAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'icon': icon,
      'xp': xp,
      'type': type,
      'status': status,
      'progress': progress,
      'target': target,
      'expiresAt': expiresAt,
    };
  }

  double get progressPercentage {
    if (target == 0) return 0;
    return (progress / target).clamp(0.0, 1.0);
  }

  bool get isCompleted => status == 'completed';
}

class StreakModel {
  final int current;
  final int longest;
  final String lastActivityDate;
  final String type;

  StreakModel({
    required this.current,
    required this.longest,
    required this.lastActivityDate,
    required this.type,
  });

  factory StreakModel.fromJson(Map<String, dynamic> json) {
    return StreakModel(
      current: json['current'] ?? 0,
      longest: json['longest'] ?? 0,
      lastActivityDate: json['lastActivityDate'] ?? '',
      type: json['type'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'current': current,
      'longest': longest,
      'lastActivityDate': lastActivityDate,
      'type': type,
    };
  }
}

class GamificationStatsModel {
  final int totalXp;
  final int totalBadges;
  final int totalAchievements;
  final int totalQuestsCompleted;
  final String joinedAt;
  final String lastActivityAt;

  GamificationStatsModel({
    required this.totalXp,
    required this.totalBadges,
    required this.totalAchievements,
    required this.totalQuestsCompleted,
    required this.joinedAt,
    required this.lastActivityAt,
  });

  factory GamificationStatsModel.fromJson(Map<String, dynamic> json) {
    return GamificationStatsModel(
      totalXp: json['totalXp'] ?? 0,
      totalBadges: json['totalBadges'] ?? 0,
      totalAchievements: json['totalAchievements'] ?? 0,
      totalQuestsCompleted: json['totalQuestsCompleted'] ?? 0,
      joinedAt: json['joinedAt'] ?? '',
      lastActivityAt: json['lastActivityAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalXp': totalXp,
      'totalBadges': totalBadges,
      'totalAchievements': totalAchievements,
      'totalQuestsCompleted': totalQuestsCompleted,
      'joinedAt': joinedAt,
      'lastActivityAt': lastActivityAt,
    };
  }
}

class ProfileInsightsModel {
  final String disciplineLevel;
  final String paymentConsistency;
  final int financialMaturity;
  final List<String> strengths;
  final List<String> improvements;
  final String motivationalTip;

  ProfileInsightsModel({
    required this.disciplineLevel,
    required this.paymentConsistency,
    required this.financialMaturity,
    required this.strengths,
    required this.improvements,
    required this.motivationalTip,
  });

  factory ProfileInsightsModel.fromJson(Map<String, dynamic> json) {
    return ProfileInsightsModel(
      disciplineLevel: json['disciplineLevel'] ?? 'Iniciante',
      paymentConsistency: json['paymentConsistency'] ?? 'Irregular',
      financialMaturity: json['financialMaturity'] ?? 0,
      strengths: List<String>.from(json['strengths'] ?? []),
      improvements: List<String>.from(json['improvements'] ?? []),
      motivationalTip: json['motivationalTip'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'disciplineLevel': disciplineLevel,
      'paymentConsistency': paymentConsistency,
      'financialMaturity': financialMaturity,
      'strengths': strengths,
      'improvements': improvements,
      'motivationalTip': motivationalTip,
    };
  }
}

class GamificationModel {
  final int points;
  final LevelModel level;
  final List<BadgeModel> badges;
  final List<dynamic> achievements;
  final List<QuestModel> quests;
  final int streak;
  final double completionRate;
  final int financialHealthScore;
  final List<String> motivationalInsights;
  final Map<String, StreakModel> streaks;
  final GamificationStatsModel stats;

  GamificationModel({
    required this.points,
    required this.level,
    required this.badges,
    required this.achievements,
    required this.quests,
    required this.streak,
    required this.completionRate,
    required this.financialHealthScore,
    required this.motivationalInsights,
    required this.streaks,
    required this.stats,
  });

  factory GamificationModel.fromJson(Map<String, dynamic> json) {
    final streaksJson = json['streaks'] as Map<String, dynamic>? ?? {};
    
    return GamificationModel(
      points: json['points'] ?? 0,
      level: LevelModel.fromJson(json['level'] ?? {}),
      badges: (json['badges'] as List<dynamic>?)
              ?.map((b) => BadgeModel.fromJson(b))
              .toList() ??
          [],
      achievements: json['achievements'] ?? [],
      quests: (json['quests'] as List<dynamic>?)
              ?.map((q) => QuestModel.fromJson(q))
              .toList() ??
          [],
      streak: json['streak'] ?? 0,
      completionRate: (json['completionRate'] ?? 0).toDouble(),
      financialHealthScore: json['financialHealthScore'] ?? 0,
      motivationalInsights:
          List<String>.from(json['motivationalInsights'] ?? []),
      streaks: {
        'login': StreakModel.fromJson(streaksJson['login'] ?? {}),
        'payments': StreakModel.fromJson(streaksJson['payments'] ?? {}),
        'budget': StreakModel.fromJson(streaksJson['budget'] ?? {}),
      },
      stats: GamificationStatsModel.fromJson(json['stats'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'points': points,
      'level': level.toJson(),
      'badges': badges.map((b) => b.toJson()).toList(),
      'achievements': achievements,
      'quests': quests.map((q) => q.toJson()).toList(),
      'streak': streak,
      'completionRate': completionRate,
      'financialHealthScore': financialHealthScore,
      'motivationalInsights': motivationalInsights,
      'streaks': streaks.map((k, v) => MapEntry(k, v.toJson())),
      'stats': stats.toJson(),
    };
  }

  // Helpers
  int get currentXp => points;
  int get xpToNextLevel => level.pointsToNext;
  double get levelProgress {
    if (xpToNextLevel == 0) return 1.0;
    final currentLevelXp = points - level.pointsRequired;
    final xpNeeded = level.pointsToNext - level.pointsRequired;
    if (xpNeeded <= 0) return 1.0;
    return (currentLevelXp / xpNeeded).clamp(0.0, 1.0);
  }

  List<QuestModel> get dailyQuests =>
      quests.where((q) => q.type == 'daily').toList();
  
  List<QuestModel> get weeklyQuests =>
      quests.where((q) => q.type == 'weekly').toList();
  
  List<QuestModel> get activeQuests =>
      quests.where((q) => q.status != 'completed' && q.status != 'expired').toList();
}

class GamificationResponse {
  final GamificationModel gamification;
  final ProfileInsightsModel profileInsights;

  GamificationResponse({
    required this.gamification,
    required this.profileInsights,
  });

  factory GamificationResponse.fromJson(Map<String, dynamic> json) {
    return GamificationResponse(
      gamification: GamificationModel.fromJson(json['gamification'] ?? {}),
      profileInsights: ProfileInsightsModel.fromJson(json['profileInsights'] ?? {}),
    );
  }
}
