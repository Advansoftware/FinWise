// lib/screens/family/family_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/models/family_model.dart';
import '../../core/providers/family_provider.dart';
import '../../core/providers/auth_provider.dart';
import 'widgets/widgets.dart';

/// Tela principal de gerenciamento de família
class FamilyScreen extends StatefulWidget {
  const FamilyScreen({super.key});

  @override
  State<FamilyScreen> createState() => _FamilyScreenState();
}

class _FamilyScreenState extends State<FamilyScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FamilyProvider>().loadFamily();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Modo Família'),
        backgroundColor: AppTheme.background,
        elevation: 0,
      ),
      body: Consumer2<FamilyProvider, AuthProvider>(
        builder: (context, familyProvider, authProvider, _) {
          if (familyProvider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            );
          }

          if (!familyProvider.isInFamily) {
            return _NoFamilyView(
              onCreateFamily: () => _showCreateFamilyDialog(context),
            );
          }

          final family = familyProvider.family!;
          final userId = authProvider.user?.id ?? '';
          final isOwner = familyProvider.isOwner(userId);

          return RefreshIndicator(
            onRefresh: () => familyProvider.loadFamily(),
            color: AppTheme.primary,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Card da família
                FamilyInfoCard(
                  family: family,
                  isOwner: isOwner,
                  onEdit: isOwner ? () => _showEditFamilyDialog(context, family) : null,
                ),
                const SizedBox(height: 24),

                // Membros
                _SectionHeader(
                  title: 'Membros',
                  trailing: isOwner
                      ? IconButton(
                          icon: const Icon(Icons.person_add, color: AppTheme.primary),
                          onPressed: () => _showInviteDialog(context),
                        )
                      : null,
                ),
                const SizedBox(height: 12),
                ...family.activeMembers.map((member) => MemberCard(
                  member: member,
                  isCurrentUser: member.userdId == userId,
                  canRemove: isOwner && member.userdId != userId,
                  onRemove: () => _confirmRemoveMember(context, member),
                )),

                // Convites pendentes
                if (familyProvider.pendingInvites.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  _SectionHeader(title: 'Convites Pendentes'),
                  const SizedBox(height: 12),
                  ...familyProvider.pendingInvites.map((invite) => InviteCard(
                    invite: invite,
                    canCancel: isOwner,
                    onCancel: () => _cancelInvite(invite),
                  )),
                ],

                // Configurações de compartilhamento
                const SizedBox(height: 24),
                _SectionHeader(title: 'Meu Compartilhamento'),
                const SizedBox(height: 12),
                SharingSettingsCard(
                  member: family.getMember(userId),
                  onUpdate: (settings) => familyProvider.updateMySharing(settings),
                ),

                // Sair da família
                const SizedBox(height: 32),
                if (!isOwner)
                  OutlinedButton.icon(
                    onPressed: () => _confirmLeaveFamily(context),
                    icon: const Icon(Icons.exit_to_app, color: AppTheme.error),
                    label: const Text('Sair da Família'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.error,
                      side: const BorderSide(color: AppTheme.error),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showCreateFamilyDialog(BuildContext context) {
    final nameController = TextEditingController();
    final descController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text(
          'Criar Família',
          style: TextStyle(color: AppTheme.textPrimary),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: 'Nome da Família',
                hintText: 'Ex: Família Silva',
              ),
              style: const TextStyle(color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: descController,
              decoration: const InputDecoration(
                labelText: 'Descrição (opcional)',
                hintText: 'Ex: Finanças do casal',
              ),
              style: const TextStyle(color: AppTheme.textPrimary),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.isEmpty) return;
              
              Navigator.pop(context);
              final success = await context.read<FamilyProvider>().createFamily(
                name: nameController.text,
                description: descController.text.isEmpty ? null : descController.text,
              );
              
              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Família criada com sucesso!')),
                );
              }
            },
            child: const Text('Criar'),
          ),
        ],
      ),
    );
  }

  void _showEditFamilyDialog(BuildContext context, FamilyModel family) {
    final nameController = TextEditingController(text: family.name);
    final descController = TextEditingController(text: family.description ?? '');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text(
          'Editar Família',
          style: TextStyle(color: AppTheme.textPrimary),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Nome da Família'),
              style: const TextStyle(color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: descController,
              decoration: const InputDecoration(labelText: 'Descrição'),
              style: const TextStyle(color: AppTheme.textPrimary),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await context.read<FamilyProvider>().updateFamily(
                name: nameController.text,
                description: descController.text,
              );
            },
            child: const Text('Salvar'),
          ),
        ],
      ),
    );
  }

  void _showInviteDialog(BuildContext context) {
    final emailController = TextEditingController();
    final messageController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text(
          'Convidar Membro',
          style: TextStyle(color: AppTheme.textPrimary),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: emailController,
              decoration: const InputDecoration(
                labelText: 'E-mail',
                hintText: 'email@exemplo.com',
              ),
              keyboardType: TextInputType.emailAddress,
              style: const TextStyle(color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: messageController,
              decoration: const InputDecoration(
                labelText: 'Mensagem (opcional)',
                hintText: 'Olá! Junte-se à nossa família financeira.',
              ),
              style: const TextStyle(color: AppTheme.textPrimary),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (emailController.text.isEmpty) return;
              
              Navigator.pop(context);
              final success = await context.read<FamilyProvider>().inviteMember(
                email: emailController.text,
                message: messageController.text.isEmpty ? null : messageController.text,
              );
              
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success ? 'Convite enviado!' : 'Erro ao enviar convite',
                    ),
                  ),
                );
              }
            },
            child: const Text('Enviar'),
          ),
        ],
      ),
    );
  }

  void _confirmRemoveMember(BuildContext context, FamilyMember member) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text(
          'Remover Membro',
          style: TextStyle(color: AppTheme.textPrimary),
        ),
        content: Text(
          'Tem certeza que deseja remover ${member.displayName} da família?',
          style: const TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await context.read<FamilyProvider>().removeMember(member.id);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            child: const Text('Remover'),
          ),
        ],
      ),
    );
  }

  void _confirmLeaveFamily(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text(
          'Sair da Família',
          style: TextStyle(color: AppTheme.textPrimary),
        ),
        content: const Text(
          'Tem certeza que deseja sair da família? Você perderá acesso aos dados compartilhados.',
          style: TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await context.read<FamilyProvider>().leaveFamily();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            child: const Text('Sair'),
          ),
        ],
      ),
    );
  }

  void _cancelInvite(FamilyInvite invite) {
    // TODO: Implementar cancelamento de convite
  }
}

/// View quando não está em família
class _NoFamilyView extends StatelessWidget {
  final VoidCallback onCreateFamily;

  const _NoFamilyView({required this.onCreateFamily});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.people_outline,
                size: 64,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Modo Família',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Compartilhe suas finanças com sua família. '
              'Crie uma família ou aceite um convite para começar.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: onCreateFamily,
              icon: const Icon(Icons.add),
              label: const Text('Criar Família'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Disponível apenas no plano Infinity',
              style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Header de seção
class _SectionHeader extends StatelessWidget {
  final String title;
  final Widget? trailing;

  const _SectionHeader({required this.title, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        const Spacer(),
        if (trailing != null) trailing!,
      ],
    );
  }
}
