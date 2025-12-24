/// Validadores de formulário
class Validators {
  Validators._();

  /// Valida email
  static String? email(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email é obrigatório';
    }

    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Email inválido';
    }

    return null;
  }

  /// Valida senha
  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Senha é obrigatória';
    }

    if (value.length < 6) {
      return 'Senha deve ter pelo menos 6 caracteres';
    }

    return null;
  }

  /// Valida campo obrigatório
  static String? required(String? value, [String? fieldName]) {
    if (value == null || value.isEmpty) {
      return '${fieldName ?? 'Campo'} é obrigatório';
    }
    return null;
  }

  /// Valida valor monetário
  static String? money(String? value) {
    if (value == null || value.isEmpty) {
      return 'Valor é obrigatório';
    }

    final cleanValue = value.replaceAll(RegExp(r'[^\d,.]'), '');
    final parsed = double.tryParse(cleanValue.replaceAll(',', '.'));

    if (parsed == null || parsed <= 0) {
      return 'Valor inválido';
    }

    return null;
  }

  /// Valida valor mínimo
  static String? Function(String?) minValue(double min) {
    return (String? value) {
      if (value == null || value.isEmpty) return null;

      final cleanValue = value.replaceAll(RegExp(r'[^\d,.]'), '');
      final parsed = double.tryParse(cleanValue.replaceAll(',', '.'));

      if (parsed == null || parsed < min) {
        return 'Valor mínimo: $min';
      }

      return null;
    };
  }
}
