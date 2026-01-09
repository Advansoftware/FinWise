// lib/screens/family/widgets/member_card.dart

import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/family_model.dart';

/// Card de membro da família
class MemberCard extends StatelessWidget {
  final FamilyMember member;
  final bool isCurrentUser;
  final bool canRemove;
  final VoidCallback? onRemove;

  const MemberCard({
    super.key,
    required this.member,
    this.isCurrentUser = false,
    this.canRemove = false,
    this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isCurrentUser 
            ? AppTheme.primary.withValues(alpha: 0.1) 
            : AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: isCurrentUser 
            ? Border.all(color: AppTheme.primary.withValues(alpha: 0.3)) 
            : null,
      ),
      child: Row(
        children: [
          // Avatar
          CircleAvatar(
            radius: 24,
            backgroundColor: _getRoleColor(member.role).withValues(alpha: 0.2),
            backgroundImage: member.avatarUrl != null 
                ? NetworkImage(member.avatarUrl!) 
                : null,
            child: member.avatarUrl == null
                ? Text(
                    _getInitials(member.displayName),
                    style: TextStyle(
                      color: _getRoleColor(member.role),
                      fontWeight: FontWeight.bold,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 12),
          
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        member.displayName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                          color: AppTheme.textPrimary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isCurrentUser)
                      Container(
                        margin: const EdgeInsets.only(left: 8),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.primary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Você',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _RoleBadge(role: member.role),
                    const SizedBox(width: 8),
                    if (member.email != null)
                      Flexible(
                        child: Text(
                          member.email!,
                          style: TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 12,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          
          // Ações
          if (canRemove && onRemove != null)
            IconButton(
              onPressed: onRemove,
              icon: const Icon(Icons.person_remove, color: AppTheme.error),
              tooltip: 'Remover',
            ),
        ],
      ),
    );
  }

  String _getInitials(String name) {
    final parts = name.split(' ');
    if (parts.length >= 2 && parts[0].isNotEmpty && parts[1].isNotEmpty) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    if (name.length >= 2) {
      return name.substring(0, 2).toUpperCase();
    }
    return name.toUpperCase();
  }

  Color _getRoleColor(FamilyMemberRole role) {
    switch (role) {
      case FamilyMemberRole.owner:
        return Colors.amber;
      case FamilyMemberRole.admin:
        return AppTheme.primary;
      case FamilyMemberRole.member:
        return AppTheme.textSecondary;
    }
  }
}

class _RoleBadge extends StatelessWidget {
  final FamilyMemberRole role;

  const _RoleBadge({required this.role});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (role) {
      FamilyMemberRole.owner => ('Dono', Colors.amber),
      FamilyMemberRole.admin => ('Admin', AppTheme.primary),
      FamilyMemberRole.member => ('Membro', AppTheme.textSecondary),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
