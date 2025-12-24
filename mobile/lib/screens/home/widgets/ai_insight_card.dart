import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class AIInsightCard extends StatelessWidget {
  final String? tip;
  final VoidCallback? onRefresh;

  const AIInsightCard({
    super.key,
    this.tip,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1B2E), // Dark purple background from image
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6366F1).withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF6366F1).withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.auto_awesome, color: Color(0xFF6366F1), size: 16),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Dica Financeira com IA',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF6366F1),
                    ),
                  ),
                ],
              ),
              InkWell(
                onTap: onRefresh,
                borderRadius: BorderRadius.circular(20),
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Icon(Icons.refresh, color: Colors.white.withOpacity(0.3), size: 16),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Cache mensal renovado automaticamente. Atualizar custa 1 crédito.',
            style: TextStyle(
              fontSize: 10,
              color: Colors.white.withOpacity(0.3),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            tip ?? 'Percebi que a maior parte dos seus gastos foi em transfers para jogos e loterias. Que tal dedicar um dia da semana para analisar suas despesas e ver o que pode ser cortado? Pode ser uma boa maneira de economizar e investir em algo mais produtivo!',
            style: TextStyle(
              fontSize: 13,
              height: 1.5,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerRight,
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFFA855F7)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.auto_awesome, color: Colors.white, size: 16),
            ),
          ),
        ],
      ),
    );
  }
}
