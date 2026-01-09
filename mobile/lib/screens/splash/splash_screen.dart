import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/providers/auth_provider.dart';

/// Tela de splash com validação biométrica
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  bool _isAuthenticating = false;
  bool _showBiometricPrompt = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializeAuth();
  }

  Future<void> _initializeAuth() async {
    final authProvider = context.read<AuthProvider>();
    await authProvider.initialize();
    
    if (mounted) {
      _checkAuthState(authProvider);
    }
  }

  void _checkAuthState(AuthProvider authProvider) {
    final state = authProvider.state;
    
    if (state == AuthState.awaitingBiometric) {
      setState(() {
        _showBiometricPrompt = true;
      });
      // Auto-tenta biometria na primeira vez
      _attemptBiometricAuth();
    }
    // Outros estados são tratados pelo AuthWrapper no main.dart
  }

  Future<void> _attemptBiometricAuth() async {
    if (_isAuthenticating) return;
    
    setState(() {
      _isAuthenticating = true;
      _errorMessage = null;
    });

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.authenticateWithBiometric();
    
    if (mounted) {
      setState(() {
        _isAuthenticating = false;
        if (!success && authProvider.state == AuthState.awaitingBiometric) {
          _errorMessage = 'Autenticação falhou. Tente novamente.';
        }
      });
    }
  }

  void _skipBiometric() {
    context.read<AuthProvider>().skipBiometric();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Theme.of(context).colorScheme.primary,
              Theme.of(context).colorScheme.primaryContainer,
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Icon(
                    Icons.account_balance_wallet,
                    size: 80,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'FinWise',
                  style: TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Controle financeiro inteligente',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white.withValues(alpha: 0.8),
                  ),
                ),
                const SizedBox(height: 48),
                
                // Biometric prompt ou loading
                if (_showBiometricPrompt)
                  _BiometricPrompt(
                    isAuthenticating: _isAuthenticating,
                    errorMessage: _errorMessage,
                    attemptsRemaining: context.watch<AuthProvider>().biometricAttemptsRemaining,
                    onRetry: _attemptBiometricAuth,
                    onSkip: _skipBiometric,
                  )
                else
                  Column(
                    children: [
                      const CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Carregando...',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Widget de prompt biométrico
class _BiometricPrompt extends StatelessWidget {
  final bool isAuthenticating;
  final String? errorMessage;
  final int attemptsRemaining;
  final VoidCallback onRetry;
  final VoidCallback onSkip;

  const _BiometricPrompt({
    required this.isAuthenticating,
    this.errorMessage,
    required this.attemptsRemaining,
    required this.onRetry,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Ícone de biometria
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: isAuthenticating
              ? const SizedBox(
                  width: 48,
                  height: 48,
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    strokeWidth: 3,
                  ),
                )
              : const Icon(
                  Icons.fingerprint,
                  size: 48,
                  color: Colors.white,
                ),
        ),
        const SizedBox(height: 24),
        
        Text(
          isAuthenticating 
              ? 'Verificando...' 
              : 'Use sua biometria para entrar',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        
        if (errorMessage != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.red.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              errorMessage!,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
        
        if (attemptsRemaining > 0 && attemptsRemaining < 3) ...[
          const SizedBox(height: 8),
          Text(
            '$attemptsRemaining tentativa(s) restante(s)',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 12,
            ),
          ),
        ],
        
        const SizedBox(height: 32),
        
        // Botões
        if (!isAuthenticating) ...[
          ElevatedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.fingerprint),
            label: const Text('Tentar novamente'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Theme.of(context).colorScheme.primary,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: onSkip,
            child: Text(
              'Usar email e senha',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.9),
                fontSize: 14,
              ),
            ),
          ),
        ],
      ],
    );
  }
}
