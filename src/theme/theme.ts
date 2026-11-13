import { Platform } from 'react-native';

export type ThemeMode = 'system' | 'dark' | 'light';

export const MONO_FONT = Platform.select({
  ios: 'Menlo',
  default: 'monospace',
});

export interface AppTheme {
  isDark: boolean;
  bg: string;
  bgSecondary: string;
  card: string;
  cardElevated: string;
  cardBorder: string;
  glassTint: 'dark' | 'light' | 'systemChromeMaterialDark' | 'systemChromeMaterialLight';
  glassIntensity: number;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryContrast: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  indigo: string;
  indigoSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  purple: string;
  purpleSoft: string;
  cyan: string;
  cyanSoft: string;
  separator: string;
  heroGradient: [string, string, string];
  cardGradient: [string, string];
}

export const darkTheme: AppTheme = {
  isDark: true,
  bg: '#09090B',
  bgSecondary: '#18181B',
  card: '#121215',
  cardElevated: '#1A1A1F',
  cardBorder: '#27272A',
  glassTint: 'systemChromeMaterialDark',
  glassIntensity: 85,
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  primary: '#FAFAFA',
  primaryContrast: '#09090B',
  primarySoft: '#222228',
  accent: '#818CF8',
  accentSoft: 'rgba(129, 140, 248, 0.16)',
  indigo: '#6366F1',
  indigoSoft: 'rgba(99, 102, 241, 0.16)',
  success: '#10B981',
  successSoft: 'rgba(16, 185, 129, 0.16)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.16)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239, 68, 68, 0.16)',
  purple: '#A78BFA',
  purpleSoft: 'rgba(167, 139, 250, 0.16)',
  cyan: '#38BDF8',
  cyanSoft: 'rgba(56, 189, 248, 0.16)',
  separator: '#1F1F23',
  heroGradient: ['#16161B', '#121215', '#0D0D10'],
  cardGradient: ['#16161B', '#111114'],
};

export const lightTheme: AppTheme = {
  isDark: false,
  bg: '#F4F4F5',
  bgSecondary: '#E4E4E7',
  card: '#FFFFFF',
  cardElevated: '#FAFAFA',
  cardBorder: '#E4E4E7',
  glassTint: 'systemChromeMaterialLight',
  glassIntensity: 88,
  text: '#09090B',
  textSecondary: '#52525B',
  textMuted: '#71717A',
  primary: '#18181B',
  primaryContrast: '#FAFAFA',
  primarySoft: '#F1F1F4',
  accent: '#4F46E5',
  accentSoft: 'rgba(79, 70, 229, 0.12)',
  indigo: '#4F46E5',
  indigoSoft: 'rgba(79, 70, 229, 0.12)',
  success: '#059669',
  successSoft: 'rgba(5, 150, 105, 0.12)',
  warning: '#D97706',
  warningSoft: 'rgba(217, 119, 6, 0.12)',
  danger: '#DC2626',
  dangerSoft: 'rgba(220, 38, 38, 0.12)',
  purple: '#7C3AED',
  purpleSoft: 'rgba(124, 58, 237, 0.12)',
  cyan: '#0284C7',
  cyanSoft: 'rgba(2, 132, 199, 0.12)',
  separator: '#E4E4E7',
  heroGradient: ['#FFFFFF', '#FAFAFA', '#F4F4F5'],
  cardGradient: ['#FFFFFF', '#FAFAFA'],
};

export function resolveTheme(
  mode: ThemeMode,
  systemScheme: 'dark' | 'light' | null | undefined
): AppTheme {
  if (mode === 'dark') return darkTheme;
  if (mode === 'light') return lightTheme;
  return systemScheme === 'light' ? lightTheme : darkTheme;
}
