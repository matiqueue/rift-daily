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

import { UsosApiClient } from '@/api/usosClient';
import { GlassCard } from '@/components/GlassCard';
import { UniversityIcon } from '@/components/UniversityIcon';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';

export default function ApiConfigModal() {
  const theme = useAppTheme();
  const selectedInstallation = useUsosStore((s) => s.selectedInstallation);
  const storedKey = useUsosStore((s) => s.consumerKey);
  const storedSecret = useUsosStore((s) => s.consumerSecret);
  const pendingRequestToken = useUsosStore((s) => s.pendingRequestToken);
  const saveOAuthConsumerCredentials = useUsosStore((s) => s.saveOAuthConsumerCredentials);
  const startPinOAuth = useUsosStore((s) => s.startPinOAuth);
  const completePinOAuth = useUsosStore((s) => s.completePinOAuth);

  const [consumerKey, setConsumerKey] = useState(storedKey);
  const [consumerSecret, setConsumerSecret] = useState(storedSecret);
  const [pinCode, setPinCode] = useState('');
  const [testingServer, setTestingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTestingServer(true);
    setServerStatus(null);
    try {
      const client = new UsosApiClient(selectedInstallation.baseUrl, {
        consumerKey: consumerKey || 'test',
        consumerSecret: consumerSecret || 'test',
      });
      const info = await client.checkInstallationInfo();
      setServerStatus(
        `Połączono: ${info.institution_name?.pl || selectedInstallation.namePl} (USOS API v${
          info.version
        })`
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
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.separator }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Autoryzacja i połączenie USOS
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: theme.cardElevated }]}>
          <Ionicons name="close" size={20} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Server Status Card */}
        <GlassCard style={styles.card}>
          <View style={styles.uniRow}>
            <UniversityIcon installation={selectedInstallation} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.uniName, { color: theme.text }]}>
                {selectedInstallation.shortName} • {selectedInstallation.city}
              </Text>
              <Text style={[styles.urlText, { color: theme.textSecondary }]}>
                {selectedInstallation.baseUrl}
              </Text>
            </View>
            <Pressable
              onPress={handleTestConnection}
              disabled={testingServer}
              style={[styles.testBtn, { backgroundColor: theme.primarySoft }]}>
              {testingServer ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 12 }}>
                  Testuj serwer
                </Text>
              )}
            </Pressable>
          </View>

          {serverStatus && (
            <View style={[styles.statusBanner, { backgroundColor: theme.successSoft }]}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={[styles.statusText, { color: theme.success }]}>{serverStatus}</Text>
            </View>
          )}
        </GlassCard>

        {/* Alternative Login with PIN Code (OOB) */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Logowanie kodem PIN (Alternatywne)
          </Text>
          <Text style={[styles.descText, { color: theme.textSecondary }]}>
            Jeśli wolisz zalogować się w przeglądarce i przepisać 8-znakowy kod PIN z ekranu
            USOSweb:
          </Text>

          <Pressable
            onPress={async () => {
              await saveOAuthConsumerCredentials(consumerKey, consumerSecret);
              const res = await startPinOAuth();
              if (!res.ok && res.error) Alert.alert('Błąd', res.error);
            }}
            style={[styles.pinStartBtn, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="open-outline" size={17} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>
              1. Otwórz stronę logowania USOS i pobierz PIN
            </Text>
          </Pressable>

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
                  backgroundColor: theme.bgSecondary,
                  color: theme.text,
                  borderColor: theme.cardBorder,
                },
              ]}
            />
            <Pressable
              onPress={handleCompletePin}
              disabled={!pinCode.trim() && !pendingRequestToken}
              style={[
                styles.pinConfirmBtn,
                {
                  backgroundColor: pinCode.trim() ? theme.primary : theme.cardElevated,
                },
              ]}>
              <Text
                style={{
                  color: pinCode.trim() ? theme.primaryContrast : theme.textMuted,
                  fontWeight: '800',
                  fontSize: 13,
                }}>
                Zatwierdź PIN
              </Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* Advanced OAuth Keys */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Klucze OAuth 1.0a ({selectedInstallation.shortName})
          </Text>
          <Text style={[styles.descText, { color: theme.textSecondary }]}>
            Dla uczelni {selectedInstallation.shortName} klucz deweloperski jest już wbudowany i
            skonfigurowany automatycznie. Możesz też podać własny klucz:
          </Text>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>CONSUMER KEY</Text>
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
                backgroundColor: theme.bgSecondary,
                color: theme.text,
                borderColor: theme.cardBorder,
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>CONSUMER SECRET</Text>
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
                backgroundColor: theme.bgSecondary,
                color: theme.text,
                borderColor: theme.cardBorder,
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
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
            <Text style={[styles.saveBtnText, { color: theme.primaryContrast }]}>
              Zapisz ustawienia
            </Text>
          </Pressable>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 18,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    gap: 10,
  },
  uniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uniName: {
    fontSize: 15,
    fontWeight: '800',
  },
  urlText: {
    fontSize: 12,
    marginTop: 2,
  },
  testBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  descText: {
    fontSize: 13,
    lineHeight: 18,
  },
  pinStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  pinInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pinConfirmBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    height: 44,
    fontSize: 14,
  },
  saveBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
