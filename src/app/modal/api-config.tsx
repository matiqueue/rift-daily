import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchBackendHealth, getBackendBaseUrl } from '@/api/backendConfig';
import { UsosApiClient } from '@/api/usosClient';
import { AmbientBackdrop } from '@/components/AmbientBackdrop';
import { GlassSurface } from '@/components/GlassSurface';
import { SectionHeader } from '@/components/SectionHeader';
import { UniversityIcon } from '@/components/UniversityIcon';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT } from '@/theme/theme';

export default function ApiConfigModal() {
  const theme = useAppTheme();
  const selectedInstallation = useUsosStore((s) => s.selectedInstallation);
  const storedKey = useUsosStore((s) => s.consumerKey);
  const storedSecret = useUsosStore((s) => s.consumerSecret);
  const pendingRequestSession = useUsosStore((s) => s.pendingRequestSession);
  const pendingRequestToken = useUsosStore((s) => s.pendingRequestToken);
  const saveOAuthConsumerCredentials = useUsosStore((s) => s.saveOAuthConsumerCredentials);
  const startPinOAuth = useUsosStore((s) => s.startPinOAuth);
  const completePinOAuth = useUsosStore((s) => s.completePinOAuth);

  const [consumerKey, setConsumerKey] = useState(storedKey);
  const [consumerSecret, setConsumerSecret] = useState(storedSecret);
  const [pinCode, setPinCode] = useState('');
  const [testingServer, setTestingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const backendUrl = getBackendBaseUrl();

  const handleTestConnection = async () => {
    setTestingServer(true);
    setServerStatus(null);
    try {
      const [backend, info] = await Promise.all([
        fetchBackendHealth(),
        new UsosApiClient(selectedInstallation.baseUrl, {
          consumerKey: consumerKey || 'test',
          consumerSecret: consumerSecret || 'test',
        }).checkInstallationInfo(),
      ]);
      const instCovered = backend.configuredInstallations.includes(selectedInstallation.id);
      setServerStatus(
        `Backend BFF OK (${backend.configuredInstallations.length} uczelni, ${
          instCovered ? `${selectedInstallation.shortName} chroniony` : 'auto-provisioning'
        }) · USOS API v${info.version}`
      );
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (err: any) {
      setServerStatus(`Błąd połączenia: ${err?.message || 'Serwer niedostępny'}`);
    } finally {
      setTestingServer(false);
    }
  };

  const handleCompletePin = async () => {
    const res = await completePinOAuth(pinCode);
    if (res.ok) {
      router.replace('/(tabs)');
    } else if (res.error) {
      Alert.alert('Weryfikacja PIN', res.error);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <AmbientBackdrop variant="more" />

      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.separator }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.overlineMono, { color: theme.accent }]}>
              OAUTH 1.0A · DIAGNOSTYKA
            </Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Połączenie z USOS API
            </Text>
          </View>
          <GlassSurface
            radius={16}
            interactive
            onPress={() => router.back()}
            contentStyle={styles.closeBtn}>
            <Ionicons name="close" size={18} color={theme.text} />
          </GlassSurface>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Server Status Row */}
          <View style={[styles.uniRow, { borderBottomColor: theme.separator }]}>
            <UniversityIcon installation={selectedInstallation} size={42} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.uniName, { color: theme.text }]}>
                {selectedInstallation.shortName} · {selectedInstallation.city}
              </Text>
              <Text style={[styles.urlText, { color: theme.textSecondary }]} numberOfLines={1}>
                {selectedInstallation.baseUrl}
              </Text>
            </View>
            <GlassSurface
              radius={10}
              interactive
              onPress={testingServer ? undefined : handleTestConnection}
              contentStyle={styles.testBtn}>
              {testingServer ? (
                <ActivityIndicator size="small" color={theme.accent} />
              ) : (
                <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 12 }}>
                  Testuj
                </Text>
              )}
            </GlassSurface>
          </View>

          {serverStatus && (
            <View style={[styles.statusBanner, { backgroundColor: theme.successSoft }]}>
              <Ionicons name="checkmark-circle" size={15} color={theme.success} />
              <Text style={[styles.statusText, { color: theme.success }]}>{serverStatus}</Text>
            </View>
          )}

          {/* Alternative Login with PIN Code */}
          <SectionHeader title="Logowanie kodem PIN (OOB)" />
          <Text style={[styles.descText, { color: theme.textSecondary }]}>
            Zaloguj się w przeglądarce i przepisz 8-znakowy kod PIN wyświetlony na ekranie USOSweb:
          </Text>

          <GlassSurface
            radius={11}
            interactive
            onPress={async () => {
              if (consumerKey.trim() || consumerSecret.trim()) {
                await saveOAuthConsumerCredentials(consumerKey, consumerSecret);
              }
              const res = await startPinOAuth();
              if (!res.ok && res.error) Alert.alert('Błąd', res.error);
            }}
            style={{ marginTop: 10 }}
            contentStyle={styles.pinStartBtn}>
            <Ionicons name="open-outline" size={16} color={theme.accent} />
            <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 13 }}>
              1. Otwórz logowanie USOS i pobierz PIN
            </Text>
          </GlassSurface>

          <View style={styles.pinInputRow}>
            <TextInput
              value={pinCode}
              onChangeText={setPinCode}
              placeholder="2. Wklej kod PIN z USOSweb..."
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.input,
                {
                  flex: 1,
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.separator,
                },
              ]}
            />
            <Pressable
              onPress={handleCompletePin}
              disabled={!pinCode.trim() && !pendingRequestSession && !pendingRequestToken}
              style={[
                styles.pinConfirmBtn,
                {
                  backgroundColor: pinCode.trim() ? theme.accent : theme.bgSecondary,
                },
              ]}>
              <Text
                style={{
                  color: pinCode.trim() ? theme.primaryContrast : theme.textMuted,
                  fontWeight: '700',
                  fontSize: 13,
                }}>
                Zatwierdź
              </Text>
            </Pressable>
          </View>

          {/* OAuth Keys (Optional BYOK Override) */}
          <SectionHeader title="Centralny serwer BFF (Vercel)" rightText="AES-256-GCM" />
          <Text style={[styles.descText, { color: theme.textSecondary }]}>
            Klucze OAuth 1.0a dla {selectedInstallation.shortName} są przechowywane wyłącznie po
            stronie serwera ({backendUrl}) i nigdy nie trafiają do aplikacji mobilnej. Poniższe pola
            wypełnij tylko, jeśli chcesz nadpisać je własną parą kluczy (BYOK):
          </Text>

          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>CONSUMER KEY</Text>
          <TextInput
            value={consumerKey}
            onChangeText={setConsumerKey}
            placeholder="Consumer Key"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              {
                backgroundColor: theme.card,
                color: theme.text,
                borderColor: theme.separator,
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>CONSUMER SECRET</Text>
          <TextInput
            value={consumerSecret}
            onChangeText={setConsumerSecret}
            placeholder="Consumer Secret"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              {
                backgroundColor: theme.card,
                color: theme.text,
                borderColor: theme.separator,
              },
            ]}
          />

          <Pressable
            onPress={async () => {
              await saveOAuthConsumerCredentials(consumerKey, consumerSecret);
              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              }
              router.back();
            }}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: theme.accent, opacity: pressed ? 0.82 : 1 },
            ]}>
            <Text style={[styles.saveBtnText, { color: theme.primaryContrast }]}>
              Zapisz ustawienia
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  overlineMono: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  uniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  uniName: {
    fontSize: 15,
    fontWeight: '700',
  },
  urlText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    marginTop: 2,
  },
  testBtn: {
    paddingHorizontal: 12,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  descText: {
    fontSize: 13,
    lineHeight: 18,
  },
  pinStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 42,
    paddingHorizontal: 12,
  },
  pinInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  pinConfirmBtn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginTop: 12,
    marginBottom: 5,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 11,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
  },
  saveBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
