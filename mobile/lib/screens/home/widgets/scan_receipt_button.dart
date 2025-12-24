import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class ScanReceiptButton extends StatelessWidget {
  final VoidCallback onPressed;

  const ScanReceiptButton({super.key, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: AppTheme.warning.withAlpha(25),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.warning.withAlpha(77)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.qr_code_scanner, size: 20, color: AppTheme.warning),
              const SizedBox(width: 8),
              Text(
                'Escanear Nota',
                style: TextStyle(
                  color: AppTheme.warning,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
