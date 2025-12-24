import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../theme/app_theme.dart';

class PlanBadge extends StatelessWidget {
  final UserModel? user;

  const PlanBadge({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    String planName;
    List<Color> colors;
    IconData? icon;

    if (user?.isInfinity == true) {
      planName = '∞ Infinity';
      colors = [const Color(0xFFF59E0B), const Color(0xFFEF4444)];
      icon = Icons.all_inclusive;
    } else if (user?.isPro == true) {
      planName = 'Pro';
      colors = [AppTheme.primary, const Color(0xFF3B82F6)];
      icon = Icons.workspace_premium;
    } else {
      planName = 'Gratuito';
      colors = [Colors.grey.shade600, Colors.grey.shade700];
      icon = null;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: colors),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: Colors.white, size: 12),
            const SizedBox(width: 4),
          ],
          Text(
            planName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
