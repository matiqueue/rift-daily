import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { GlassCard } from '@/components/GlassCard';
import { UniversityIcon } from '@/components/UniversityIcon';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT, ThemeMode } from '@/theme/theme';

const CITY_FILTERS = ['Polecane', 'Kraków', 'Warszawa', 'Poznań', 'Wrocław', 'Wszystkie'] as const;
type CityFilter = (typeof CITY_FILTERS)[number];

export default function LoginScreen() {
  const theme = useAppTheme();
  const installations = useUsosStore((s) => s.installations);
  const selectedInstallation = useUsosStore((s) => s.selectedInstallation);
  const setSelectedInstallation = useUsosStore((s) => s.setSelectedInstallation);
  const accessToken = useUsosStore((s) => s.accessToken);
  const user = useUsosStore((s) => s.user);
  const loginWithOAuth = useUsosStore((s) => s.loginWithOAuth);
  const isSyncing = useUsosStore((s) => s.isSyncing);
  const setThemeMode = useUsosStore((s) => s.setThemeMode);

  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<CityFilter>('Polecane');

  const hasSavedOAuth = Boolean(accessToken);

  const filteredInstallations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q) {
      return installations.filter(
        (i) =>
          i.namePl.toLowerCase().includes(q) ||
          i.shortName.toLowerCase().includes(q) ||
          i.city.toLowerCase().includes(q) ||
          i.baseUrl.toLowerCase().includes(q)
      );
    }
    if (cityFilter === 'Polecane') {
      return installations.slice(0, 10);
    }
    if (cityFilter === 'Wszystkie') {
      return installations;
    }
    return installations.filter((i) => i.city === cityFilter);
  }, [installations, search, cityFilter]);

  const handleOAuthLogin = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    const res = await loginWithOAuth();
    if (res.ok) {
      router.replace('/(tabs)');
    } else if (res.error) {
      Alert.alert('Logowanie USOSweb', res.error, [
        {
          text: 'Logowanie kodem PIN / Klucze API',
          onPress: () => router.push('/modal/api-config'),
        },
        { text: 'Zamknij', style: 'cancel' },
      ]);
    }
  };

  const toggleLightDark = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => {});
    }
    const next: ThemeMode = theme.isDark ? 'light' : 'dark';
    setThemeMode(next);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.headerBlock}>
              <View style={styles.headerTopRow}>
                <Text style={[styles.appName, { color: theme.textSecondary }]}>
                  RIFT DAILY // E-DZIENNIK USOS
                </Text>
                <Pressable
                  onPress={toggleLightDark}
                  style={[
                    styles.themeToggleBtn,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  ]}>
                  <Ionicons
                    name={theme.isDark ? 'sunny-outline' : 'moon-outline'}
                    size={16}
                    color={theme.text}
                  />
                  <Text style={[styles.themeToggleText, { color: theme.text }]}>
                    {theme.isDark ? 'JASNY' : 'CIEMNY'}
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Wybierz swoją uczelnię</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Zaloguj się bezpośrednio swoim kontem studenckim USOSweb (OAuth 1.0a).
              </Text>
            </View>

            {/* Real USOS Account Hero Card */}
            <GlassCard elevated padding={18} style={styles.realAccountHero}>
              <View style={styles.heroBadgeRow}>
                <View style={[styles.liveTag, { backgroundColor: theme.successSoft }]}>
                  <View style={[styles.liveDot, { backgroundColor: theme.success }]} />
                  <Text style={[styles.liveTagText, { color: theme.success }]}>
                    OFICJALNE POŁĄCZENIE USOS API
                  </Text>
                </View>
              </View>

              <View style={styles.activeUniRow}>
                <UniversityIcon installation={selectedInstallation} size={56} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.uniCityLabel, { color: theme.textSecondary }]}>
                    {selectedInstallation.city.toUpperCase()} // {selectedInstallation.shortName}
                  </Text>
                  <Text style={[styles.activeUniName, { color: theme.text }]} numberOfLines={2}>
                    {selectedInstallation.namePl}
                  </Text>
                </View>
              </View>

              {hasSavedOAuth && (
                <Pressable
                  onPress={() => router.replace('/(tabs)')}
                  style={[
                    styles.savedAccountBox,
                    {
                      backgroundColor: theme.bgSecondary,
                      borderColor: theme.cardBorder,
                    },
                  ]}>
                  <Avatar
                    name={`${user.first_name} ${user.last_name}`}
                    uri={user.photo_url}
                    size={42}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.savedAccountLabel, { color: theme.success }]}>
                      AKTYWNA SESJA STUDENTA
                    </Text>
                    <Text style={[styles.savedAccountName, { color: theme.text }]}>
                      Otwórz dziennik: {user.first_name} {user.last_name}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={26} color={theme.text} />
                </Pressable>
              )}

              <Pressable
                onPress={handleOAuthLogin}
                disabled={isSyncing}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: pressed || isSyncing ? 0.88 : 1,
                  },
                ]}>
                {isSyncing ? (
                  <ActivityIndicator color={theme.primaryContrast} />
                ) : (
                  <>
                    <Ionicons
                      name="shield-checkmark"
                      size={19}
                      color={theme.primaryContrast}
                    />
                    <Text style={[styles.primaryBtnText, { color: theme.primaryContrast }]}>
                      {hasSavedOAuth
                        ? `Zaloguj ponownie w USOS (${selectedInstallation.shortName})`
                        : `Zaloguj przez USOSweb (${selectedInstallation.shortName})`}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => router.push('/modal/api-config')}
                style={styles.pinLinkBtn}>
                <Ionicons name="key-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.pinLinkText, { color: theme.textSecondary }]}>
                  Autoryzacja kodem PIN lub diagnostyka serwera USOS
                </Text>
              </Pressable>
            </GlassCard>

            {/* University Picker Section */}
            <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
              KATALOG UCZELNI ({installations.length})
            </Text>

            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                },
              ]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Wyszukaj uczelnię (np. UKEN, UJ, UW, PW...)"
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.text }]}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                </Pressable>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cityPillsRow}>
              {CITY_FILTERS.map((cf) => {
                const active = !search && cityFilter === cf;
                return (
                  <Pressable
                    key={cf}
                    onPress={() => {
                      setSearch('');
                      setCityFilter(cf);
                    }}
                    style={[
                      styles.cityPill,
                      {
                        backgroundColor: active ? theme.primary : theme.card,
                        borderColor: active ? theme.primary : theme.cardBorder,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.cityPillText,
                        {
                          color: active ? theme.primaryContrast : theme.textSecondary,
                        },
                      ]}>
                      {cf}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.uniList}>
              {filteredInstallations.map((inst, index) => {
                const isSelected = inst.id === selectedInstallation.id;
                const isTopUken = inst.id === 'uken';
                return (
                  <Pressable
                    key={inst.id}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        Haptics.selectionAsync().catch(() => {});
                      }
                      setSelectedInstallation(inst);
                    }}
                    style={[
                      styles.uniItem,
                      {
                        backgroundColor: isSelected ? theme.cardElevated : theme.card,
                        borderColor: isSelected ? theme.primary : theme.cardBorder,
                      },
                    ]}>
                    <UniversityIcon installation={inst} size={44} />

                    <View style={{ flex: 1 }}>
                      <View style={styles.uniTitleRow}>
                        <Text style={[styles.uniShort, { color: theme.text }]}>
                          {inst.shortName}
                        </Text>
                        {isTopUken && index === 0 && (
                          <View
                            style={[
                              styles.topBadge,
                              {
                                backgroundColor: theme.primary,
                              },
                            ]}>
                            <Text style={[styles.topBadgeText, { color: theme.primaryContrast }]}>
                              TOP 1 // KRAKÓW
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[styles.uniFullName, { color: theme.textSecondary }]}
                        numberOfLines={1}>
                        {inst.namePl}
                      </Text>
                    </View>

                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isSelected ? theme.text : theme.textMuted}
                    />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 44,
  },
  headerBlock: {
    marginBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  appName: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 11,
    borderWidth: 1,
  },
  themeToggleText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  realAccountHero: {
    gap: 14,
    marginBottom: 20,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveTagText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  activeUniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  uniCityLabel: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeUniName: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 2,
  },
  savedAccountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
  },
  savedAccountLabel: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  savedAccountName: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 16,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  pinLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  pinLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeading: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  cityPillsRow: {
    gap: 8,
    paddingBottom: 12,
  },
  cityPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 13,
    borderWidth: 1,
  },
  cityPillText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '800',
  },
  uniList: {
    gap: 8,
  },
  uniItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  uniTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uniShort: {
    fontFamily: MONO_FONT,
    fontSize: 14,
    fontWeight: '800',
  },
  topBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  topBadgeText: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    fontWeight: '800',
  },
  uniFullName: {
    fontSize: 13,
    marginTop: 2,
  },
});
