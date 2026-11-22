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
  /** Unified monochrome platinum/graphite accent (replaces multi-hue indigo/cyan/purple soup) */
  accent: string;
  accentSoft: string;
  indigo: string;
  indigoSoft: string;
  /** Restrained sage/emerald strictly for live active dot & positive delta */
  success: string;
  successSoft: string;
  /** Restrained muted amber strictly for unpaid alerts */
  warning: string;
  warningSoft: string;
  /** Restrained crimson strictly for destructive actions & failing grades */
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
  bgSecondary: '#16161A',
  card: '#111114',
  cardElevated: '#18181C',
  cardBorder: 'rgba(255, 255, 255, 0.11)',
  glassTint: 'systemChromeMaterialDark',
  glassIntensity: 84,
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#63636B',
  primary: '#FAFAFA',
  primaryContrast: '#09090B',
  primarySoft: 'rgba(255, 255, 255, 0.08)',
  accent: '#E4E4E7',
  accentSoft: 'rgba(255, 255, 255, 0.09)',
  indigo: '#D4D4D8',
  indigoSoft: 'rgba(255, 255, 255, 0.08)',
  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.13)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.13)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.13)',
  purple: '#D4D4D8',
  purpleSoft: 'rgba(255, 255, 255, 0.08)',
  cyan: '#D4D4D8',
  cyanSoft: 'rgba(255, 255, 255, 0.08)',
  separator: 'rgba(255, 255, 255, 0.09)',
  heroGradient: ['#16161B', '#111114', '#09090B'],
  cardGradient: ['#151519', '#101013'],
};

export const lightTheme: AppTheme = {
  isDark: false,
  bg: '#FAFAFA',
  bgSecondary: '#EFEFF1',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  cardBorder: 'rgba(9, 9, 11, 0.09)',
  glassTint: 'systemChromeMaterialLight',
  glassIntensity: 88,
  text: '#09090B',
  textSecondary: '#52525B',
  textMuted: '#8A8A93',
  primary: '#09090B',
  primaryContrast: '#FAFAFA',
  primarySoft: 'rgba(9, 9, 11, 0.06)',
  accent: '#18181B',
  accentSoft: 'rgba(9, 9, 11, 0.065)',
  indigo: '#27272A',
  indigoSoft: 'rgba(9, 9, 11, 0.06)',
  success: '#059669',
  successSoft: 'rgba(5, 150, 105, 0.10)',
  warning: '#B45309',
  warningSoft: 'rgba(180, 83, 9, 0.10)',
  danger: '#DC2626',
  dangerSoft: 'rgba(220, 38, 38, 0.10)',
  purple: '#27272A',
  purpleSoft: 'rgba(9, 9, 11, 0.06)',
  cyan: '#27272A',
  cyanSoft: 'rgba(9, 9, 11, 0.06)',
  separator: 'rgba(9, 9, 11, 0.08)',
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
