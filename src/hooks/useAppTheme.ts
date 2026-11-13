import { useColorScheme } from 'react-native';
import { useUsosStore } from '@/store/useUsosStore';
import { AppTheme, resolveTheme } from '@/theme/theme';

export function useAppTheme(): AppTheme {
  const systemScheme = useColorScheme();
  const themeMode = useUsosStore((s) => s.themeMode);
  return resolveTheme(themeMode, systemScheme);
}
