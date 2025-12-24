import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/validators.dart';
import '../../core/widgets/gastometria_logo.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _canUseBiometric = false;
  String _biometricDescription = 'Biometria';

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  Future<void> _checkBiometric() async {
    final authProvider = context.read<AuthProvider>();
    final canShow = await authProvider.canShowBiometricOption();
    final description = await authProvider.getBiometricDescription();
    
    if (mounted) {
      setState(() {
        _canUseBiometric = canShow && authProvider.biometricEnabled;
        _biometricDescription = description;
      });

      // Se biometria está disponível e habilitada, tenta login automático
      if (_canUseBiometric) {
        _handleBiometricLogin();
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.login(
      _emailController.text.trim(),
      _passwordController.text,
    );

    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.errorMessage ?? 'Erro ao fazer login'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _handleBiometricLogin() async {
    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.loginWithBiometric();

    if (!success && mounted && authProvider.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.errorMessage!),
          backgroundColor: AppColors.warning,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 60),

                // Logo
                const Center(
                  child: GastometriaLogo(
                    size: 100,
                    showText: true,
                  ),
                ),
                const SizedBox(height: 8),

                Text(
                  'Faça login para continuar',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: context.mutedForegroundColor,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),

                // Email
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  validator: Validators.email,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    hintText: 'seu@email.com',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                ),
                const SizedBox(height: 16),

                // Senha
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  validator: Validators.password,
                  onFieldSubmitted: (_) => _handleLogin(),
                  decoration: InputDecoration(
                    labelText: 'Senha',
                    hintText: '••••••••',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () {
                        setState(() => _obscurePassword = !_obscurePassword);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Botão de login
                ElevatedButton(
                  onPressed: authProvider.isLoading ? null : _handleLogin,
                  child: authProvider.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Entrar',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),

                // Botão de biometria (se disponível e habilitado)
                if (_canUseBiometric) ...[
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: authProvider.isLoading ? null : _handleBiometricLogin,
                    icon: Icon(
                      _biometricDescription.contains('Face') 
                          ? Icons.face 
                          : Icons.fingerprint,
                      size: 24,
                    ),
                    label: Text(
                      'Entrar com $_biometricDescription',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 52),
                      side: BorderSide(color: context.primaryColor),
                    ),
                  ),
                ],

                const SizedBox(height: 24),

                // Aviso sobre plano Infinity
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.info.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.info.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.info_outline,
                        color: AppColors.info,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'A API Mobile está disponível exclusivamente para usuários do plano Infinity.',
                          style: TextStyle(
                            color: AppColors.info.withValues(alpha: 0.9),
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
