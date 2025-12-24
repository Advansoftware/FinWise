import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../screens/chat/chat_screen.dart';

/// FAB global para abrir o chat com IA
class AIChatFab extends StatefulWidget {
  const AIChatFab({super.key});

  @override
  State<AIChatFab> createState() => _AIChatFabState();
}

class _AIChatFabState extends State<AIChatFab>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    _glowAnimation = Tween<double>(begin: 0.3, end: 0.6).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primary.withAlpha(
                    (_glowAnimation.value * 255).toInt(),
                  ),
                  blurRadius: 20,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: FloatingActionButton(
              onPressed: () => ChatScreen.show(context),
              backgroundColor: AppTheme.primary,
              elevation: 8,
              child: const Icon(
                Icons.auto_awesome,
                color: Colors.white,
                size: 28,
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Widget simples de FAB sem animação para uso em qualquer tela
class AIChatFabSimple extends StatelessWidget {
  const AIChatFabSimple({super.key});

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: () => ChatScreen.show(context),
      backgroundColor: AppTheme.primary,
      elevation: 8,
      heroTag: 'ai_chat_fab',
      child: const Icon(
        Icons.auto_awesome,
        color: Colors.white,
        size: 28,
      ),
    );
  }
}
