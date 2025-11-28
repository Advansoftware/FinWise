// src/components/gamification/gamification-global-ui.tsx
// Container global para todos os componentes de UI de gamificação

"use client";

import { XpNotificationContainer } from "./xp-notification";
import { LevelUpCelebration } from "./level-up-celebration";
import { BadgeUnlockCelebration } from "./badge-unlock-celebration";

export function GamificationGlobalUI() {
  return (
    <>
      <XpNotificationContainer />
      <LevelUpCelebration />
      <BadgeUnlockCelebration />
    </>
  );
}
