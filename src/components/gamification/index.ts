// src/components/gamification/index.ts
// Exports centralizados dos componentes de gamificação

export { XpNotificationContainer } from './xp-notification';
export { LevelUpCelebration } from './level-up-celebration';
export { BadgeUnlockCelebration } from './badge-unlock-celebration';
export { GamificationGlobalUI } from './gamification-global-ui';
export { GamificationGuide } from './gamification-guide';
export { DailyQuestsCard } from './daily-quests-card';
export { GamificationProgressWidget } from './gamification-progress-widget';

// Re-export do GamificationSummary para manter compatibilidade
export { GamificationSummary } from '../profile/gamification-summary';
