'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/store';

export default function ThemeInitializer() {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  return null;
}
