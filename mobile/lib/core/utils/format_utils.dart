import 'package:intl/intl.dart';

/// Utilitários de formatação
class FormatUtils {
  FormatUtils._();

  /// Formata valor como moeda brasileira
  static String currency(double value) {
    final format = NumberFormat.currency(
      locale: 'pt_BR',
      symbol: 'R\$ ',
      decimalDigits: 2,
    );
    return format.format(value);
  }

  /// Formata valor como moeda compacta (ex: R$ 1K)
  static String currencyCompact(double value) {
    if (value.abs() >= 1000000) {
      return 'R\$ ${(value / 1000000).toStringAsFixed(1)}M';
    } else if (value.abs() >= 1000) {
      return 'R\$ ${(value / 1000).toStringAsFixed(1)}K';
    }
    return currency(value);
  }

  /// Formata percentual
  static String percent(double value) {
    return '${value.toStringAsFixed(1)}%';
  }

  /// Formata data completa
  static String date(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  /// Formata data e hora
  static String dateTime(DateTime date) {
    return '${FormatUtils.date(date)} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  /// Formata mês e ano
  static String monthYear(DateTime date) {
    final months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return '${months[date.month - 1]} ${date.year}';
  }

  /// Formata data curta (ex: 25 Dez)
  static String shortDate(DateTime date) {
    final months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return '${date.day} ${months[date.month - 1]}';
  }

  /// Alias para shortDate - compatibilidade
  static String formatDateShort(DateTime date) => shortDate(date);

  /// Formata data completa (ex: segunda-feira, 25 de dezembro de 2025)
  static String formatDateFull(DateTime date) {
    final weekdays = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    final months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return '${weekdays[date.weekday % 7]}, ${date.day} de ${months[date.month - 1]}';
  }

  /// Alias para currency - compatibilidade
  static String formatCurrency(double value) => currency(value);

  /// Formata data relativa (hoje, ontem, etc)
  static String relativeDate(DateTime dateValue) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(dateValue.year, dateValue.month, dateValue.day);

    final difference = today.difference(dateOnly).inDays;

    if (difference == 0) return 'Hoje';
    if (difference == 1) return 'Ontem';
    if (difference == -1) return 'Amanhã';
    if (difference > 0 && difference < 7) return 'Há $difference dias';
    if (difference < 0 && difference > -7) return 'Em ${-difference} dias';

    return FormatUtils.date(dateValue);
  }
}
