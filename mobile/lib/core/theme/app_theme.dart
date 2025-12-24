import 'package:flutter/material.dart';

/// Cores do tema Gastometria - baseado nos tokens do projeto web
/// Extraídas de src/theme/tokens.ts
class AppColors {
  AppColors._();

  // ==================== DARK MODE (Padrão) ====================
  // Cores principais - Dark
  static const Color primaryDark = Color(0xFF9619F4); // hsl(262, 84%, 60%)
  static const Color primaryLightDark = Color(0xFFAB47FF);
  static const Color primaryDarkDark = Color(0xFF7C0FD9);

  // Backgrounds - Dark
  static const Color backgroundDark = Color(0xFF030712); // hsl(224, 71%, 4%)
  static const Color cardDark = Color(0xFF0A1120); // hsl(224, 71%, 6%)
  static const Color surfaceDark = Color(0xFF0A1120);

  // Foregrounds - Dark
  static const Color foregroundDark = Color(0xFFF8FAFC); // hsl(210, 40%, 98%)
  static const Color mutedForegroundDark = Color(0xFF94A3B8); // hsl(215, 20%, 65%)

  // Secundárias - Dark
  static const Color secondaryDark = Color(0xFF1E293B); // hsl(217, 33%, 17%)
  static const Color secondaryForegroundDark = Color(0xFFF8FAFC);
  static const Color mutedDark = Color(0xFF1E293B);
  static const Color accentDark = Color(0xFF1E293B);

  // Bordas - Dark
  static const Color borderDark = Color(0xFF334155); // hsl(217, 33%, 25%)
  static const Color inputDark = Color(0xFF334155);

  // ==================== LIGHT MODE ====================
  // Cores principais - Light
  static const Color primaryLight = Color(0xFF8B5CF6); // hsl(260, 90%, 60%)
  static const Color primaryLightLight = Color(0xFFA78BFA);
  static const Color primaryDarkLight = Color(0xFF7C3AED);

  // Backgrounds - Light
  static const Color backgroundLight = Color(0xFFF1F5F9); // hsl(206, 33%, 96%)
  static const Color cardLight = Color(0xFFFFFFFF); // hsl(0, 0%, 100%)
  static const Color surfaceLight = Color(0xFFFFFFFF);

  // Foregrounds - Light
  static const Color foregroundLight = Color(0xFF1E293B); // hsl(210, 20%, 15%)
  static const Color mutedForegroundLight = Color(0xFF64748B); // hsl(210, 20%, 45%)

  // Secundárias - Light
  static const Color secondaryLight = Color(0xFFE2E8F0); // hsl(206, 33%, 92%)
  static const Color secondaryForegroundLight = Color(0xFF475569);
  static const Color mutedLight = Color(0xFFE2E8F0);
  static const Color accentLight = Color(0xFF8B5CF6);

  // Bordas - Light
  static const Color borderLight = Color(0xFFCBD5E1); // hsl(200, 20%, 85%)
  static const Color inputLight = Color(0xFFCBD5E1);

  // ==================== CORES DE STATUS (Iguais para ambos) ====================
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFF87171);
  static const Color errorDark = Color(0xFFDC2626);

  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFF34D399);
  static const Color successDark = Color(0xFF059669);

  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFBBF24);
  static const Color warningDark = Color(0xFFD97706);

  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFF60A5FA);
  static const Color infoDark = Color(0xFF2563EB);

  // ==================== CORES DE TRANSAÇÃO ====================
  static const Color income = Color(0xFF10B981); // success
  static const Color expense = Color(0xFFEF4444); // error
  static const Color transfer = Color(0xFF8B5CF6); // primary

  // ==================== CORES DE GRÁFICOS ====================
  static const Color chart1 = Color(0xFF8B5CF6); // primary
  static const Color chart2 = Color(0xFF06B6D4); // cyan
  static const Color chart3 = Color(0xFFF43F5E); // rose
  static const Color chart4 = Color(0xFFFACC15); // yellow
  static const Color chart5 = Color(0xFFF97316); // orange
}

/// Tema do aplicativo - baseado no MUI theme do projeto web
class AppTheme {
  AppTheme._();

  // Cores de atalho para fácil acesso
  static const Color primary = AppColors.primaryDark;
  static const Color secondary = AppColors.secondaryDark;
  static const Color background = AppColors.backgroundDark;
  static const Color card = AppColors.cardDark;
  static const Color border = AppColors.borderDark;
  static const Color success = AppColors.success;
  static const Color error = AppColors.error;
  static const Color warning = AppColors.warning;

  // Border Radius (do tokens.ts)
  static const double radiusSm = 8.0;   // 0.5rem
  static const double radiusMd = 12.0;  // 0.75rem
  static const double radiusLg = 16.0;  // 1rem
  static const double radiusXl = 20.0;  // 1.25rem
  static const double radius2Xl = 24.0; // 1.5rem

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: 'Inter',
      colorScheme: const ColorScheme.light(
        primary: AppColors.primaryLight,
        onPrimary: Colors.white,
        primaryContainer: AppColors.primaryLightLight,
        secondary: AppColors.secondaryLight,
        onSecondary: AppColors.secondaryForegroundLight,
        surface: AppColors.surfaceLight,
        onSurface: AppColors.foregroundLight,
        error: AppColors.error,
        onError: Colors.white,
        outline: AppColors.borderLight,
      ),
      scaffoldBackgroundColor: AppColors.backgroundLight,
      
      // AppBar
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.surfaceLight,
        foregroundColor: AppColors.foregroundLight,
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
      ),

      // Card
      cardTheme: CardThemeData(
        color: AppColors.cardLight,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          side: const BorderSide(color: AppColors.borderLight),
        ),
        surfaceTintColor: Colors.transparent,
      ),

      // Input
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: AppColors.primaryLight, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: const TextStyle(color: AppColors.mutedForegroundLight),
        labelStyle: const TextStyle(color: AppColors.mutedForegroundLight),
      ),

      // Elevated Button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryLight,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          elevation: 1,
          shadowColor: AppColors.primaryLight.withValues(alpha: 0.3),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),

      // Outlined Button
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.foregroundLight,
          minimumSize: const Size(double.infinity, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          side: const BorderSide(color: AppColors.borderLight),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),

      // Text Button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryLight,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),

      // Icon Button
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          foregroundColor: AppColors.foregroundLight,
        ),
      ),

      // Bottom Navigation Bar
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surfaceLight,
        selectedItemColor: AppColors.primaryLight,
        unselectedItemColor: AppColors.mutedForegroundLight,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        unselectedLabelStyle: TextStyle(fontSize: 12),
      ),

      // FAB
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.primaryLight,
        foregroundColor: Colors.white,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
        ),
      ),

      // Switch
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return Colors.white;
          }
          return AppColors.mutedForegroundLight;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.primaryLight;
          }
          return AppColors.mutedLight;
        }),
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: AppColors.borderLight,
        thickness: 1,
      ),

      // Chip
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.secondaryLight,
        labelStyle: const TextStyle(color: AppColors.foregroundLight),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusSm),
        ),
      ),

      // Snackbar
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.foregroundLight,
        contentTextStyle: const TextStyle(color: Colors.white),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
        behavior: SnackBarBehavior.floating,
      ),

      // Dialog
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.surfaceLight,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
        ),
      ),

      // ListTile
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        iconColor: AppColors.mutedForegroundLight,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      fontFamily: 'Inter',
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primaryDark,
        onPrimary: Colors.white,
        primaryContainer: AppColors.primaryDarkDark,
        secondary: AppColors.secondaryDark,
        onSecondary: AppColors.secondaryForegroundDark,
        surface: AppColors.surfaceDark,
        onSurface: AppColors.foregroundDark,
        error: AppColors.error,
        onError: Colors.white,
        outline: AppColors.borderDark,
      ),
      scaffoldBackgroundColor: AppColors.backgroundDark,
      
      // AppBar
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.surfaceDark,
        foregroundColor: AppColors.foregroundDark,
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
      ),

      // Card
      cardTheme: CardThemeData(
        color: AppColors.cardDark,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          side: const BorderSide(color: AppColors.borderDark),
        ),
        surfaceTintColor: Colors.transparent,
      ),

      // Input
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceDark,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: AppColors.borderDark),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: AppColors.borderDark),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: AppColors.primaryDark, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: const TextStyle(color: AppColors.mutedForegroundDark),
        labelStyle: const TextStyle(color: AppColors.mutedForegroundDark),
      ),

      // Elevated Button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryDark,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          elevation: 1,
          shadowColor: AppColors.primaryDark.withValues(alpha: 0.3),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),

      // Outlined Button
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.foregroundDark,
          minimumSize: const Size(double.infinity, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          side: const BorderSide(color: AppColors.borderDark),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),

      // Text Button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryDark,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),

      // Icon Button
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          foregroundColor: AppColors.foregroundDark,
        ),
      ),

      // Bottom Navigation Bar
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surfaceDark,
        selectedItemColor: AppColors.primaryDark,
        unselectedItemColor: AppColors.mutedForegroundDark,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        unselectedLabelStyle: TextStyle(fontSize: 12),
      ),

      // FAB
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.primaryDark,
        foregroundColor: Colors.white,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
        ),
      ),

      // Switch
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return Colors.white;
          }
          return AppColors.mutedForegroundDark;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.primaryDark;
          }
          return AppColors.mutedDark;
        }),
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: AppColors.borderDark,
        thickness: 1,
      ),

      // Chip
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.secondaryDark,
        labelStyle: const TextStyle(color: AppColors.foregroundDark),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusSm),
        ),
      ),

      // Snackbar
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.cardDark,
        contentTextStyle: const TextStyle(color: AppColors.foregroundDark),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
        behavior: SnackBarBehavior.floating,
      ),

      // Dialog
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.cardDark,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
        ),
      ),

      // ListTile
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        iconColor: AppColors.mutedForegroundDark,
      ),
    );
  }
}

/// Extensão para acessar cores customizadas facilmente
extension AppColorsExtension on BuildContext {
  /// Retorna as cores baseadas no tema atual
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;
  
  Color get primaryColor => isDarkMode ? AppColors.primaryDark : AppColors.primaryLight;
  Color get backgroundColor => isDarkMode ? AppColors.backgroundDark : AppColors.backgroundLight;
  Color get cardColor => isDarkMode ? AppColors.cardDark : AppColors.cardLight;
  Color get foregroundColor => isDarkMode ? AppColors.foregroundDark : AppColors.foregroundLight;
  Color get mutedForegroundColor => isDarkMode ? AppColors.mutedForegroundDark : AppColors.mutedForegroundLight;
  Color get borderColor => isDarkMode ? AppColors.borderDark : AppColors.borderLight;
  Color get secondaryColor => isDarkMode ? AppColors.secondaryDark : AppColors.secondaryLight;
}
