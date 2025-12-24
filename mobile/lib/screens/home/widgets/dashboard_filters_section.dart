import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class DateFilterButton extends StatelessWidget {
  final String label;
  final DateTime? date;
  final VoidCallback onTap;

  const DateFilterButton({
    super.key,
    required this.label,
    required this.date,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: AppTheme.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            const Icon(Icons.calendar_today, size: 16, color: Colors.white54),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(fontSize: 10, color: Colors.white54),
                ),
                Text(
                  date != null
                      ? '${date!.day.toString().padLeft(2, '0')}/${date!.month.toString().padLeft(2, '0')}'
                      : '--/--',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class DashboardFiltersSection extends StatelessWidget {
  final DateTime? startDate;
  final DateTime? endDate;
  final String? selectedCategory;
  final List<String> categories;
  final void Function(DateTime?) onStartDateChanged;
  final void Function(DateTime?) onEndDateChanged;
  final void Function(String?) onCategoryChanged;
  final VoidCallback onClear;

  const DashboardFiltersSection({
    super.key,
    required this.startDate,
    required this.endDate,
    required this.selectedCategory,
    required this.categories,
    required this.onStartDateChanged,
    required this.onEndDateChanged,
    required this.onCategoryChanged,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        border: Border(bottom: BorderSide(color: AppTheme.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Filtros',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              TextButton.icon(
                onPressed: onClear,
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Limpar'),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.primary,
                  padding: EdgeInsets.zero,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Filtros de data
          Row(
            children: [
              Expanded(
                child: DateFilterButton(
                  label: 'De',
                  date: startDate,
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: startDate ?? DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2030),
                      builder: (context, child) {
                        return Theme(
                          data: Theme.of(context).copyWith(
                            colorScheme: const ColorScheme.dark(
                              primary: AppTheme.primary,
                              surface: AppTheme.card,
                            ),
                          ),
                          child: child!,
                        );
                      },
                    );
                    if (date != null) onStartDateChanged(date);
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DateFilterButton(
                  label: 'Até',
                  date: endDate,
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: endDate ?? DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2030),
                      builder: (context, child) {
                        return Theme(
                          data: Theme.of(context).copyWith(
                            colorScheme: const ColorScheme.dark(
                              primary: AppTheme.primary,
                              surface: AppTheme.card,
                            ),
                          ),
                          child: child!,
                        );
                      },
                    );
                    if (date != null) onEndDateChanged(date);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Filtro de categoria
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: AppTheme.background,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.border),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: selectedCategory,
                hint: const Text(
                  'Todas as categorias',
                  style: TextStyle(color: Colors.white54, fontSize: 13),
                ),
                isExpanded: true,
                dropdownColor: AppTheme.card,
                icon: const Icon(Icons.arrow_drop_down, color: Colors.white54),
                items: categories.map((cat) {
                  return DropdownMenuItem(
                    value: cat == 'Todas' ? null : cat,
                    child: Text(
                      cat,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                  );
                }).toList(),
                onChanged: onCategoryChanged,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
