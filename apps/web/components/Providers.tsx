'use client';

import { ReactNode } from 'react';
import { UISettingsProvider } from './ui-settings-context';

export function Providers({ children }: { children: ReactNode }) {
  return <UISettingsProvider>{children}</UISettingsProvider>;
}
