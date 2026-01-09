// lib/screens/reports/widgets/monthly_bar_chart.dart

import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/models/report_model.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format_utils.dart';

/// Gráfico de barras para comparação mensal
class MonthlyBarChart extends StatefulWidget {
  final List<MonthlyData> data;
  final double? height;

  const MonthlyBarChart({
    super.key,
    required this.data,
    this.height,
  });

  @override
  State<MonthlyBarChart> createState() => _MonthlyBarChartState();
}

class _MonthlyBarChartState extends State<MonthlyBarChart> {
  int touchedIndex = -1;

  @override
  Widget build(BuildContext context) {
    if (widget.data.isEmpty) {
      return _buildEmptyState();
    }

    final height = widget.height ?? 250.0;
    final maxValue = widget.data.fold<double>(
      0,
      (max, item) => [item.income, item.expense, max].reduce((a, b) => a > b ? a : b),
    );

    return SizedBox(
      height: height,
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: maxValue * 1.2,
          barTouchData: BarTouchData(
            enabled: true,
            touchTooltipData: BarTouchTooltipData(
              getTooltipColor: (group) => AppTheme.card,
              tooltipPadding: const EdgeInsets.all(8),
              tooltipMargin: 8,
              getTooltipItem: (group, groupIndex, rod, rodIndex) {
                final item = widget.data[group.x.toInt()];
                final label = rodIndex == 0 ? 'Receita' : 'Despesa';
                final value = rodIndex == 0 ? item.income : item.expense;
                return BarTooltipItem(
                  '$label\n${FormatUtils.currency(value)}',
                  TextStyle(
                    color: AppTheme.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                );
              },
            ),
            touchCallback: (FlTouchEvent event, barTouchResponse) {
              setState(() {
                if (!event.isInterestedForInteractions ||
                    barTouchResponse == null ||
                    barTouchResponse.spot == null) {
                  touchedIndex = -1;
                  return;
                }
                touchedIndex = barTouchResponse.spot!.touchedBarGroupIndex;
              });
            },
          ),
          titlesData: FlTitlesData(
            show: true,
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) {
                  final index = value.toInt();
                  if (index >= 0 && index < widget.data.length) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        widget.data[index].monthName,
                        style: TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 10,
                          fontWeight: index == touchedIndex ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    );
                  }
                  return const Text('');
                },
                reservedSize: 30,
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 60,
                getTitlesWidget: (value, meta) {
                  if (value == 0) return const Text('');
                  return Text(
                    FormatUtils.currencyCompact(value),
                    style: TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 10,
                    ),
                  );
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: maxValue / 4,
            getDrawingHorizontalLine: (value) {
              return FlLine(
                color: AppTheme.border.withOpacity(0.3),
                strokeWidth: 1,
              );
            },
          ),
          barGroups: _buildBarGroups(maxValue),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      height: 200,
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.bar_chart_outlined,
            size: 48,
            color: AppTheme.textSecondary,
          ),
          const SizedBox(height: 8),
          Text(
            'Sem dados para exibir',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  List<BarChartGroupData> _buildBarGroups(double maxY) {
    return List.generate(widget.data.length, (i) {
      final item = widget.data[i];
      final isTouched = i == touchedIndex;

      return BarChartGroupData(
        x: i,
        barRods: [
          BarChartRodData(
            toY: item.income,
            color: isTouched ? AppTheme.success : AppTheme.success.withOpacity(0.7),
            width: 8,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(4),
              topRight: Radius.circular(4),
            ),
          ),
          BarChartRodData(
            toY: item.expense,
            color: isTouched ? AppTheme.error : AppTheme.error.withOpacity(0.7),
            width: 8,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(4),
              topRight: Radius.circular(4),
            ),
          ),
        ],
      );
    });
  }
}
