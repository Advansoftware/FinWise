import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/providers/category_provider.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CategoryProvider>().loadCategories();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Categorias'),
        backgroundColor: AppTheme.card,
        foregroundColor: AppTheme.textPrimary,
        elevation: 0,
      ),
      body: Consumer<CategoryProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.categories.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            );
          }

          if (provider.categories.isEmpty) {
            return _buildEmptyState();
          }

          final categories = provider.categories.entries.toList()
            ..sort((a, b) => a.key.compareTo(b.key));

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: categories.length,
            itemBuilder: (context, index) {
              final category = categories[index];
              return _buildCategoryTile(context, category.key, category.value);
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddDialog(context),
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.category_outlined, size: 64, color: AppTheme.textSecondary),
          SizedBox(height: 16),
          Text(
            'Nenhuma categoria encontrada',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryTile(BuildContext context, String category, List<String> subcategories) {
    return Card(
      color: AppTheme.card,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        title: Text(
          category,
          style: const TextStyle(
            color: AppTheme.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        trailing: IconButton(
          icon: const Icon(Icons.add, size: 20, color: AppTheme.primary),
          onPressed: () => _showAddDialog(context, parentCategory: category),
        ),
        children: [
          if (subcategories.isEmpty)
             const Padding(
               padding: EdgeInsets.all(16.0),
               child: Text(
                 "Sem subcategorias",
                 style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
               ),
             )
          else
            ...subcategories.map((sub) => ListTile(
              title: Text(
                sub,
                style: const TextStyle(color: AppTheme.textSecondary),
              ),
              trailing: IconButton(
                icon: const Icon(Icons.delete_outline, size: 18),
                color: AppTheme.error,
                onPressed: () => _confirmDelete(context, category, sub),
              ),
            )),
            
          ListTile(
             title: const Text(
               "Excluir Categoria Inteira",
               style: TextStyle(color: AppTheme.error),
             ),
             leading: const Icon(Icons.delete_forever, color: AppTheme.error),
             onTap: () => _confirmDelete(context, category, null),
          ),
        ],
      ),
    );
  }

  void _showAddDialog(BuildContext context, {String? parentCategory}) {
    final categoryController = TextEditingController(text: parentCategory);
    final subController = TextEditingController();
    
    // Se já tem parente, foca no sub. Se não, foca no pai.
    // Mas se tem parente, talvez travar o input do pai?
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: Text(
          parentCategory == null ? 'Nova Categoria' : 'Nova Subcategoria',
          style: const TextStyle(color: AppTheme.textPrimary),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (parentCategory == null)
              TextField(
                controller: categoryController,
                style: const TextStyle(color: AppTheme.textPrimary),
                decoration: const InputDecoration(
                  labelText: 'Nome da Categoria',
                  labelStyle: TextStyle(color: AppTheme.textSecondary),
                ),
              )
            else
               Text(
                 "Adicionando em: $parentCategory",
                 style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold),
               ),
            const SizedBox(height: 16),
            TextField(
              controller: subController,
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Subcategoria (Opcional)',
                labelStyle: TextStyle(color: AppTheme.textSecondary),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              final cat = parentCategory ?? categoryController.text.trim();
              final sub = subController.text.trim();
              
              if (cat.isNotEmpty) {
                 context.read<CategoryProvider>().addCategory(
                   cat, 
                   sub.isEmpty ? null : sub
                 );
                 Navigator.pop(context);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Salvar'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, String category, String? subcategory) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text('Confirmar Exclusão', style: TextStyle(color: AppTheme.textPrimary)),
        content: Text(
          subcategory == null 
             ? 'Deseja excluir a categoria "$category" e todas as suas subcategorias?'
             : 'Deseja excluir a subcategoria "$subcategory"?',
          style: const TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () {
              context.read<CategoryProvider>().deleteCategory(category, subcategory);
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }
}
