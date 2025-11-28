// src/components/mui-wrappers/switch.tsx
// MUI wrapper para Switch
'use client';

import { Switch as MuiSwitch, SwitchProps } from '@mui/material';

export function Switch(props: SwitchProps) {
  return <MuiSwitch {...props} />;
}
