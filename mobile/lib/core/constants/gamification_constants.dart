import 'package:flutter/material.dart';

// Constantes de Gamificação portadas do Web

class GamificationConstants {
  static const Map<int, LevelInfo> levelNames = {
    1: LevelInfo('Iniciante', 'Aprendiz Financeiro', '🌱'),
    2: LevelInfo('Organizador', 'Controlador de Gastos', '📊'),
    3: LevelInfo('Disciplinado', 'Guardião do Orçamento', '🎯'),
    4: LevelInfo('Estrategista', 'Mestre do Planejamento', '🧠'),
    5: LevelInfo('Expert', 'Sábio das Finanças', '⚡'),
    6: LevelInfo('Veterano', 'Guru Financeiro', '🏆'),
    7: LevelInfo('Elite', 'Lenda Econômica', '💎'),
    8: LevelInfo('Mestre', 'Senhor das Finanças', '👑'),
    9: LevelInfo('Grão-Mestre', 'Imperador Financeiro', '🌟'),
    10: LevelInfo('Lenda', 'Transcendente', '✨'),
  };

  static const List<int> levelThresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];

  static const Map<String, int> xpRewards = {
    // Transações
    'Nova Transação': 5,
    'Categorizar': 2,
    '1ª do Dia': 10,
    // Parcelamentos
    'Pagar Parcela': 10,
    'Pagamento em Dia': 5,
    'Completar Carnê': 50,
    // Orçamentos
    'Criar Orçamento': 15,
    'Dentro da Meta': 20,
    'Mês Perfeito': 100,
    // Metas
    'Criar Meta': 10,
    'Contribuir': 5,
    'Concluir Meta': 100,
    // Uso
    'Login Diário': 5,
    'Streak Semanal': 25,
    'Usar IA': 3,
  };

  static const List<BadgeInfo> allBadges = [
    // Iniciante
    BadgeInfo('first-steps', 'Primeiros Passos', 'Criou sua primeira transação', '👣', 'common', 'onboarding'),
    BadgeInfo('wallet-creator', 'Organizador', 'Criou sua primeira carteira', '💼', 'common', 'onboarding'),
    BadgeInfo('goal-setter', 'Sonhador', 'Definiu sua primeira meta', '🎯', 'common', 'onboarding'),
    
    // Consistência
    BadgeInfo('week-streak', 'Semana Perfeita', '7 dias usando o app', '📅', 'common', 'consistency'),
    BadgeInfo('month-streak', 'Mês Dedicado', '30 dias usando o app', '🗓️', 'rare', 'consistency'),
    BadgeInfo('year-streak', 'Lenda Viva', '365 dias usando o app', '🎊', 'legendary', 'consistency'),

    // Pagamentos
    BadgeInfo('first-payment', 'Pagador', 'Pagou sua primeira parcela', '💳', 'common', 'payments'),
    BadgeInfo('punctual-10', 'Pontual', '10 pagamentos em dia', '⏰', 'rare', 'payments'),
    BadgeInfo('zero-delay', 'Impecável', 'Nunca atrasou (mín. 20)', '✨', 'mythic', 'payments'),

    // Economia
    BadgeInfo('saver-month', 'Econômico', 'Gastou menos que mês anterior', '📉', 'common', 'savings'),
    BadgeInfo('saver-20percent', 'Poupador 20%', 'Economizou 20% da renda', '💵', 'epic', 'savings'),
    
    // Especiais
    BadgeInfo('early-bird', 'Madrugador', 'Usou antes das 6h', '🌅', 'common', 'special'),
    BadgeInfo('night-owl', 'Coruja', 'Usou após meia-noite', '🦉', 'common', 'special'),
    BadgeInfo('ai-friend', 'Amigo da IA', 'Usou IA 50 vezes', '🤖', 'rare', 'special'),
  ];

  static const List<QuestInfo> dailyQuests = [
    QuestInfo('add-transaction', 'Registrar Hoje', 'Adicione uma transação hoje', '📝', 15),
    QuestInfo('check-budgets', 'Revisar Orçamentos', 'Visualize seus orçamentos', '📊', 10),
    QuestInfo('check-goals', 'Acompanhar Metas', 'Visualize suas metas', '🎯', 10),
    QuestInfo('use-ai', 'Consultar IA', 'Faça uma pergunta ao assistente', '🤖', 10),
    QuestInfo('categorize', 'Organizar', 'Categorize uma transação', '🏷️', 10),
    QuestInfo('view-report', 'Analisar', 'Visualize um relatório', '📈', 10),
  ];

  static const List<QuestInfo> weeklyChallenges = [
    QuestInfo('budget-week', 'Semana no Orçamento', 'Fique dentro do orçamento por 7 dias', '📋', 50),
    QuestInfo('save-week', 'Semana Econômica', 'Gaste 10% menos que a semana passada', '💰', 75),
    QuestInfo('no-unnecessary', 'Essencial', 'Evite gastos supérfluos por 5 dias', '🎯', 60),
    QuestInfo('register-all', 'Registrador', 'Registre todas as transações da semana', '📝', 40),
  ];

  static const List<QuestInfo> monthlyChallenges = [
    QuestInfo('perfect-month', 'Mês Perfeito', 'Complete todos as missões diárias', '🏆', 200),
    QuestInfo('budget-master', 'Mestre do Orçamento', 'Fique dentro do orçamento o mês todo', '👑', 150),
    QuestInfo('save-goal', 'Meta Alcançada', 'Complete uma meta de economia', '🎯', 150),
    QuestInfo('debt-reduction', 'Redutor de Dívidas', 'Pague todas as parcelas em dia', '💳', 100),
  ];

  static const Map<String, RarityColor> rarityColors = {
    'common': RarityColor(Color(0xFF6B7280), Color(0x1A9CA3AF), Color(0xFF9CA3AF)),
    'rare': RarityColor(Color(0xFF3B82F6), Color(0x1A3B82F6), Color(0xFF3B82F6)),
    'epic': RarityColor(Color(0xFF8B5CF6), Color(0x1A8B5CF6), Color(0xFF8B5CF6)),
    'legendary': RarityColor(Color(0xFFF59E0B), Color(0x1AF59E0B), Color(0xFFF59E0B)),
    'mythic': RarityColor(Color(0xFFEC4899), Color(0x1AEC4899), Color(0xFFEC4899)),
  };

  static String getRarityLabel(String rarity) {
    switch (rarity) {
      case 'common': return 'Comum';
      case 'rare': return 'Raro';
      case 'epic': return 'Épico';
      case 'legendary': return 'Lendário';
      case 'mythic': return 'Mítico';
      default: return rarity;
    }
  }
}

class LevelInfo {
  final String name;
  final String title;
  final String icon;
  const LevelInfo(this.name, this.title, this.icon);
}

class BadgeInfo {
  final String id;
  final String name;
  final String description;
  final String icon;
  final String rarity;
  final String category;
  const BadgeInfo(this.id, this.name, this.description, this.icon, this.rarity, this.category);
}

class RarityColor {
  final Color text;
  final Color bg;
  final Color border;
  const RarityColor(this.text, this.bg, this.border);
}

class QuestInfo {
  final String id;
  final String name;
  final String description;
  final String icon;
  final int xp;
  const QuestInfo(this.id, this.name, this.description, this.icon, this.xp);
}
