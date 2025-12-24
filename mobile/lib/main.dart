import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'core/providers/providers.dart';
import 'core/services/services.dart';
import 'core/theme/app_theme.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/splash/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Status bar transparente
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  
  // Inicializa dados de locale para formatação de datas
  await initializeDateFormatting('pt_BR', null);

  // Inicializa serviços de armazenamento local
  final localStorage = LocalStorageService();
  await localStorage.init();
  
  runApp(GastometriaApp(localStorage: localStorage));
}

class GastometriaApp extends StatefulWidget {
  final LocalStorageService localStorage;

  const GastometriaApp({super.key, required this.localStorage});

  @override
  State<GastometriaApp> createState() => _GastometriaAppState();
}

class _GastometriaAppState extends State<GastometriaApp> {
  late SyncService _syncService;

  @override
  void initState() {
    super.initState();
    _initSyncService();
  }

  void _initSyncService() {
    _syncService = SyncService(
      apiService: ApiService(),
      localStorage: widget.localStorage,
    );
    _syncService.init();
  }

  @override
  void dispose() {
    _syncService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) {
          final provider = TransactionProvider();
          provider.setSyncService(_syncService);
          return provider;
        }),
        ChangeNotifierProvider(create: (_) => WalletProvider()),
        ChangeNotifierProvider(create: (_) => GamificationProvider()),
        ChangeNotifierProvider(create: (_) => InstallmentProvider()),
        ChangeNotifierProvider(create: (_) => CategoryProvider()),
        ChangeNotifierProvider(create: (_) => BudgetProvider()),
        ChangeNotifierProvider(create: (_) => GoalProvider()),
        Provider<SyncService>.value(value: _syncService),
        Provider<LocalStorageService>.value(value: widget.localStorage),
      ],
      child: MaterialApp(
        title: 'Gastometria',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.dark, // Dark mode por padrão, igual ao projeto web
        home: const AuthWrapper(),
      ),
    );
  }
}

/// Wrapper que decide qual tela mostrar baseado no estado de autenticação
class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  @override
  void initState() {
    super.initState();
    // Inicializa o provider de autenticação
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().initialize();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    // Tela de loading inicial com splash animada
    if (authProvider.state == AuthState.initial ||
        authProvider.state == AuthState.loading) {
      return const SplashScreen();
    }

    // Se autenticado, mostra a home
    if (authProvider.isAuthenticated) {
      return const HomeScreen();
    }

    // Se não autenticado, mostra login
    return const LoginScreen();
  }
}
