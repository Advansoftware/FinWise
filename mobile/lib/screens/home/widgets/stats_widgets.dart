import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/format_utils.dart';

/// Card de estatísticas com mini gráfico sparkline
class StatsCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color? iconColor;
  final Color? valueColor;
  final List<double>? sparklineData;
  final bool isPositive;

  const StatsCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    this.iconColor,
    this.valueColor,
    this.sparklineData,
    this.isPositive = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Colors.white.withOpacity(0.7),
                ),
              ),
              Icon(
                icon,
                size: 16,
                color: iconColor ?? Colors.white.withOpacity(0.5),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: valueColor ?? Colors.white,
            ),
          ),
          if (sparklineData != null && sparklineData!.isNotEmpty) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 30,
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: false),
                  titlesData: const FlTitlesData(show: false),
                  borderData: FlBorderData(show: false),
                  lineTouchData: const LineTouchData(enabled: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: sparklineData!.asMap().entries.map((e) {
                        return FlSpot(e.key.toDouble(), e.value);
                      }).toList(),
                      isCurved: true,
                      color: isPositive ? AppTheme.success : AppTheme.error,
                      barWidth: 2,
                      isStrokeCapRound: true,
                      dotData: const FlDotData(show: false),
                      belowBarData: BarAreaData(
                        show: true,
                        color: (isPositive ? AppTheme.success : AppTheme.error)
                            .withOpacity(0.1),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Gráfico de gastos por categoria
class SpendingByCategoryChart extends StatelessWidget {
  final Map<String, double> categoryData;

  const SpendingByCategoryChart({super.key, required this.categoryData});

  @override
  Widget build(BuildContext context) {
    if (categoryData.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
        ),
        child: Center(
          child: Column(
            children: [
              Icon(
                Icons.pie_chart_outline,
                size: 48,
                color: Colors.white.withOpacity(0.3),
              ),
              const SizedBox(height: 12),
              Text(
                'Sem dados de gastos',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.5),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final colors = [
      AppTheme.primary,
      const Color(0xFF3B82F6), // blue
      const Color(0xFF10B981), // green
      const Color(0xFFF59E0B), // amber
      const Color(0xFFEF4444), // red
      const Color(0xFF8B5CF6), // violet
      const Color(0xFF06B6D4), // cyan
      const Color(0xFFEC4899), // pink
    ];

    final sortedEntries = categoryData.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final topCategories = sortedEntries.take(6).toList();
    final total = topCategories.fold<double>(0, (sum, e) => sum + e.value);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Gastos por Categoria',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 160,
            child: Row(
              children: [
                Expanded(
                  child: PieChart(
                    PieChartData(
                      sectionsSpace: 2,
                      centerSpaceRadius: 30,
                      sections: topCategories.asMap().entries.map((e) {
                        final percentage = (e.value.value / total) * 100;
                        return PieChartSectionData(
                          color: colors[e.key % colors.length],
                          value: e.value.value,
                          title: '${percentage.toStringAsFixed(0)}%',
                          radius: 40,
                          titleStyle: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: topCategories.asMap().entries.map((e) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: colors[e.key % colors.length],
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          SizedBox(
                            width: 80,
                            child: Text(
                              e.value.key,
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.white.withOpacity(0.7),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Gráfico de visão geral dos gastos (Line Chart por Categoria)
class OverviewSpendingChart extends StatelessWidget {
  final List<TransactionModel> transactions;

  const OverviewSpendingChart({super.key, required this.transactions});

  @override
  Widget build(BuildContext context) {
    // 1. Agrupar gastos por categoria
    final Map<String, double> categoryTotals = {};
    for (var t in transactions) {
      if (t.type == TransactionType.expense) {
        final cat = t.category ?? 'Outros';
        categoryTotals[cat] = (categoryTotals[cat] ?? 0) + t.amount;
      }
    }

    if (categoryTotals.isEmpty) {
      return const SizedBox.shrink();
    }

    // 2. Ordenar ou filtrar (ex: Top 7 categorias para caber no gráfico)
    // O gráfico da web parece mostrar várias categorias. Vamos pegar top 7 ou 8.
    final sortedEntries = categoryTotals.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value)); // Ordena por valor decrescente? 
      // A imagem do usuário não parece 100% ordenada (tem altos e baixos), 
      // mas geralmente line charts de categoria funcionam melhor se ordenados ou fixos.
      // Vou ordenar por valor para ficar mais bonito (curva suave descendo ou subindo).
      // Mas a imagem mostra uma "montanha" (sobe e desce). 
      // Vamos manter a ordem de valor decrescente, mas talvez misturar?
      // Melhor simplificar: Top Categories by Value.
    
    final entries = sortedEntries.take(7).toList();

    // Mapear para Spots (X = índice, Y = valor)
    final spots = entries.asMap().entries.map((e) {
      return FlSpot(e.key.toDouble(), e.value.value);
    }).toList();

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Visão Geral dos Gastos',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Sua atividade de gastos para o período selecionado.',
            style: TextStyle(
              fontSize: 12,
              color: Colors.white.withOpacity(0.5),
            ),
          ),
          const SizedBox(height: 32),
          SizedBox(
            height: 220,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 1000,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: AppTheme.border.withOpacity(0.5),
                      strokeWidth: 1,
                      dashArray: [5, 5],
                    );
                  },
                ),
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipColor: (_) => AppTheme.surface,

                    tooltipPadding: const EdgeInsets.all(12),
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((spot) {
                        final index = spot.x.toInt();
                        if (index < 0 || index >= entries.length) return null;
                        final entry = entries[index];
                        return LineTooltipItem(
                          '${entry.key}\n',
                          const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                          children: [
                            TextSpan(
                              text: 'Total: ${FormatUtils.formatCurrency(entry.value)}',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.7),
                                fontSize: 12,
                                fontWeight: FontWeight.normal,
                              ),
                            ),
                          ],
                        );
                      }).toList();
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 50,
                      interval: 1000, // Ajustar intervalo conforme necessário
                      getTitlesWidget: (value, meta) {
                        if (value == meta.min) return const SizedBox.shrink(); // Hide 0 maybe? Image shows R$0
                        return Text(
                          FormatUtils.formatCurrency(value).replaceAll(' ', ''),
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.white.withOpacity(0.5),
                          ),
                          textAlign: TextAlign.right,
                        );
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      interval: 1,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index < 0 || index >= entries.length) return const SizedBox.shrink();
                        final name = entries[index].key;
                        
                        // Rotacionar texto se for muito longo ou apenas mostrar Initials?
                        // A imagem mostra nomes inclinados: "Alimentação", "Transferência"...
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Transform.rotate(
                            angle: -0.5, // Rotação leve
                            child: Text(
                              name.length > 10 ? '${name.substring(0, 8)}...' : name,
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.white.withOpacity(0.5),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    curveSmoothness: 0.35,
                    color: const Color(0xFF6366F1), // Cor próxima da imagem (Indigo)
                    barWidth: 2,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      checkToShowDot: (spot, barData) {
                        // Mostrar dot apenas no ponto selecionado? Não, fl_chart mostra todos por padrão.
                        // Imagem mostra apenas 1 dot (hover).
                        // Vamos mostrar dots pequenos sempre ou ocultar?
                        // Imagem mostra 1 dot branco grande com borda preta no hover.
                        // Por padrão ocultamos, o touch mostra o indicador.
                        return false; 
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: false, // Imagem não tem área preenchida, apenas linha.
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
