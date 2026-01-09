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
  final String? selectedSubcategory;
  final Map<String, List<String>> categoriesMap;
  final void Function(DateTime?) onStartDateChanged;
  final void Function(DateTime?) onEndDateChanged;
  final void Function(String?) onCategoryChanged;
  final void Function(String?) onSubcategoryChanged;
  final VoidCallback onClear;

  const DashboardFiltersSection({
    super.key,
    required this.startDate,
    required this.endDate,
    required this.selectedCategory,
    required this.selectedSubcategory,
    required this.categoriesMap,
    required this.onStartDateChanged,
    required this.onEndDateChanged,
    required this.onCategoryChanged,
    required this.onSubcategoryChanged,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    // Lista de categories keys, sort alphabetic
    final categoriesList = ['Todas', ...categoriesMap.keys.toList()..sort()];

    // Subcategorias disponíveis para a categoria selecionada
    List<String> subcategoriesList = [];
    if (selectedCategory != null && selectedCategory != 'Todas') {
      final subs = categoriesMap[selectedCategory];
      if (subs != null && subs.isNotEmpty) {
        subcategoriesList = ['Todas', ...subs];
      }
    }

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
          Row(
            children: [
              Expanded(
                child: Container(
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
                        'Categoria',
                        style: TextStyle(color: Colors.white54, fontSize: 13),
                      ),
                      isExpanded: true,
                      dropdownColor: AppTheme.card,
                      icon: const Icon(Icons.arrow_drop_down, color: Colors.white54),
                      items: categoriesList.map((cat) {
                        return DropdownMenuItem(
                          value: cat == 'Todas' ? null : cat,
                          child: Text(
                            cat,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      }).toList(),
                      onChanged: onCategoryChanged,
                    ),
                  ),
                ),
              ),
              // Subcategoria Dropdown (se aplicável)
              if (subcategoriesList.isNotEmpty) ...[
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: AppTheme.background,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: selectedSubcategory,
                        hint: const Text(
                          'Subcategoria',
                          style: TextStyle(color: Colors.white54, fontSize: 13),
                        ),
                        isExpanded: true,
                        dropdownColor: AppTheme.card,
                        icon: const Icon(Icons.arrow_drop_down, color: Colors.white54),
                        items: subcategoriesList.map((sub) {
                           return DropdownMenuItem(
                            value: sub == 'Todas' ? null : sub,
                            child: Text(
                              sub,
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                              overflow: TextOverflow.ellipsis,
                            ),
                          );
                        }).toList(),
                        onChanged: onSubcategoryChanged,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
