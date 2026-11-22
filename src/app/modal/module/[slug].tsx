import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UsosStaffMember } from '@/api/types';
import { AmbientBackdrop } from '@/components/AmbientBackdrop';
import { Avatar } from '@/components/Avatar';
import { GlassSurface } from '@/components/GlassSurface';
import { ScrambleText } from '@/components/KineticText';
import { SectionHeader } from '@/components/SectionHeader';
import { UniversityIcon } from '@/components/UniversityIcon';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT } from '@/theme/theme';

const MODULE_TITLES: Record<string, { title: string; category: string }> = {
  mcard: {
    title: 'Elektroniczna Legitymacja',
    category: 'DOKUMENT STUDENCKI · ELS',
  },
  exams: {
    title: 'Egzaminy i Sesja',
    category: 'SESJA EGZAMINACYJNA',
  },
  payments: {
    title: 'Płatności i Konto IBAN',
    category: 'FINANSE I RATY',
  },
  registrations: {
    title: 'Rejestracje na Przedmioty',
    category: 'REJESTRACJA ŻETONOWA',
  },
  surveys: {
    title: 'Ankiety Oceny Zajęć',
    category: 'OCENA DYDAKTYKI',
  },
  staff: {
    title: 'Wykładowcy i Kadra',
    category: 'KATALOG AKADEMICKI',
  },
  buildings: {
    title: 'Budynki i Kampus',
    category: 'MAPA KAMPUSU',
  },
  thesis: {
    title: 'Dyplom (APD) i Sprawy',
    category: 'SPRAWY STUDENCKIE',
  },
};

export default function ModuleScreenModal() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useAppTheme();

  const user = useUsosStore((s) => s.user);
  const selectedInstallation = useUsosStore((s) => s.selectedInstallation);
  const studentCard = useUsosStore((s) => s.studentCard);
  const bankAccount = useUsosStore((s) => s.bankAccount);
  const exams = useUsosStore((s) => s.exams);
  const toggleExamRegistration = useUsosStore((s) => s.toggleExamRegistration);
  const payments = useUsosStore((s) => s.payments);
  const registrations = useUsosStore((s) => s.registrations);
  const toggleCourseRegistration = useUsosStore((s) => s.toggleCourseRegistration);
  const surveys = useUsosStore((s) => s.surveys);
  const submitSurvey = useUsosStore((s) => s.submitSurvey);
  const staff = useUsosStore((s) => s.staff);
  const searchStaffLive = useUsosStore((s) => s.searchStaffLive);
  const buildings = useUsosStore((s) => s.buildings);
  const thesis = useUsosStore((s) => s.thesis);
  const dorm = useUsosStore((s) => s.dorm);
  const slips = useUsosStore((s) => s.slips);

  const [staffQuery, setStaffQuery] = useState('');
  const [remoteStaffHit, setRemoteStaffHit] = useState<{
    query: string;
    items: UsosStaffMember[];
  } | null>(null);
  const [searchingQuery, setSearchingQuery] = useState<string | null>(null);

  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
  const [surveyRating, setSurveyRating] = useState<number>(5);
  const [surveyComment, setSurveyComment] = useState<string>('');

  const sortPhotoFirst = (list: UsosStaffMember[]) =>
    [...list].sort((a, b) => {
      const aHas = Boolean(a.photo_url && a.photo_url.startsWith('http'));
      const bHas = Boolean(b.photo_url && b.photo_url.startsWith('http'));
      if (aHas !== bHas) return Number(bHas) - Number(aHas);
      return a.name.localeCompare(b.name, 'pl');
    });

  const normalizedQuery = staffQuery.trim().toLowerCase();

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setSearchingQuery(normalizedQuery);
      searchStaffLive(staffQuery)
        .then((res) => {
          if (!cancelled) {
            setRemoteStaffHit({ query: normalizedQuery, items: sortPhotoFirst(res) });
          }
        })
        .finally(() => {
          if (!cancelled) {
            setSearchingQuery((curr) => (curr === normalizedQuery ? null : curr));
          }
        });
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedQuery, staffQuery, searchStaffLive]);

  const isSearchingStaff = normalizedQuery.length >= 2 && searchingQuery === normalizedQuery;

  const staffResults = useMemo(() => {
    if (!normalizedQuery) return sortPhotoFirst(staff);
    if (remoteStaffHit && remoteStaffHit.query === normalizedQuery) {
      return remoteStaffHit.items;
    }
    return sortPhotoFirst(
      staff.filter(
        (s) =>
          s.name.toLowerCase().includes(normalizedQuery) ||
          s.titles.toLowerCase().includes(normalizedQuery) ||
          s.faculty.toLowerCase().includes(normalizedQuery) ||
          s.building.toLowerCase().includes(normalizedQuery) ||
          (s.email || '').toLowerCase().includes(normalizedQuery) ||
          (s.courses_taught || []).some((c) => c.toLowerCase().includes(normalizedQuery))
      )
    );
  }, [normalizedQuery, remoteStaffHit, staff]);

  const meta = MODULE_TITLES[slug || 'mcard'] || MODULE_TITLES.mcard;

  const hapticTap = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <AmbientBackdrop variant="more" />

      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {/* Modal Header */}
        <View style={[styles.header, { borderBottomColor: theme.separator }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <ScrambleText
              text={meta.category}
              durationMs={260}
              style={[styles.categoryMono, { color: theme.accent }]}
            />
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {meta.title}
            </Text>
          </View>
          <GlassSurface
            radius={16}
            interactive
            accessibilityLabel="Zamknij"
            onPress={() => router.back()}
            contentStyle={styles.closeBtn}>
            <Ionicons name="close" size={18} color={theme.text} />
          </GlassSurface>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* 1. mCARD / ELS — Authentic Liquid Glass Pass (the ONE card that should be a pass!) */}
          {slug === 'mcard' && (
            <>
              <GlassSurface
                radius={22}
                tintColor={
                  theme.isDark ? 'rgba(28, 28, 34, 0.56)' : 'rgba(255, 255, 255, 0.72)'
                }
                style={styles.elsOuter}>
                <LinearGradient
                  pointerEvents="none"
                  colors={
                    theme.isDark
                      ? ['rgba(255, 255, 255, 0.14)', 'rgba(255, 255, 255, 0.03)', 'rgba(9, 9, 11, 0)']
                      : ['rgba(9, 9, 11, 0.06)', 'rgba(9, 9, 11, 0.02)', 'rgba(255, 255, 255, 0)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.elsInner}>
                  <View style={styles.elsTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <UniversityIcon installation={selectedInstallation} size={36} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.elsOverline, { color: theme.accent }]}>
                          LEGITYMACJA STUDENCKA · ELS
                        </Text>
                        <Text style={[styles.elsUniName, { color: theme.text }]} numberOfLines={2}>
                          {selectedInstallation.namePl}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: theme.successSoft }]}>
                      <Ionicons name="shield-checkmark" size={12} color={theme.success} />
                      <Text style={[styles.statusBadgeText, { color: theme.success }]}>
                        {studentCard?.expiration_date
                          ? `WAŻNA ${studentCard.expiration_date}`
                          : 'AKTYWNA'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.elsBodyRow}>
                    <Avatar
                      name={`${user.first_name} ${user.last_name}`}
                      uri={user.photo_url}
                      size={70}
                      borderColor={theme.accent}
                      variant="student"
                    />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={[styles.elsStudentName, { color: theme.text }]}>
                        {user.first_name} {user.last_name}
                      </Text>
                      <Text style={[styles.monoSub, { color: theme.accent }]}>
                        Nr albumu #{user.student_number}
                      </Text>
                      <Text
                        style={[styles.bodyMuted, { color: theme.textSecondary }]}
                        numberOfLines={2}>
                        {user.programmes[0]?.name.pl || selectedInstallation.namePl}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.elsFooter, { borderTopColor: theme.separator }]}>
                    <Text style={[styles.monoSub, { color: theme.textSecondary }]}>
                      {studentCard?.barcode_number
                        ? `ELS #${studentCard.barcode_number}`
                        : `USOS ID #${user.id || user.student_number}`}
                    </Text>
                    <Ionicons name="wifi" size={16} color={theme.textSecondary} />
                  </View>
                </View>
              </GlassSurface>

              {/* Open QR Verification Section (Zero box!) */}
              <View style={styles.qrOpenSection}>
                <Ionicons name="qr-code" size={132} color={theme.text} />
                <Text style={[styles.rowTitle, { color: theme.text, textAlign: 'center' }]}>
                  Kod identyfikacyjny ({user.student_number})
                </Text>
                <Text style={[styles.bodyMuted, { color: theme.textSecondary, textAlign: 'center' }]}>
                  {studentCard?.barcode_number
                    ? `Kod kreskowy karty: ${studentCard.barcode_number}`
                    : 'Dane zsynchronizowane bezpośrednio z uczelnią.'}
                </Text>
              </View>
            </>
          )}

          {/* 2. EXAMS — Flat Hairline Rows */}
          {slug === 'exams' &&
            (exams.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Ionicons name="calendar-clear-outline" size={30} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  Brak aktywnych zapisów na egzaminy
                </Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  W systemie USOS nie ma obecnie otwartych rejestracji na terminy egzaminacyjne.
                </Text>
              </View>
            ) : (
              exams.map((ex, idx) => (
                <View
                  key={ex.id}
                  style={[
                    styles.itemBlock,
                    idx < exams.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.separator,
                    },
                  ]}>
                  <View style={styles.rowBetween}>
                    <Text
                      style={[
                        styles.monoTag,
                        { color: ex.is_registered ? theme.success : theme.warning },
                      ]}>
                      {ex.is_registered ? '● ZAPISANY' : '○ OTWARTE ZAPISY'}
                    </Text>
                    <Text style={[styles.monoSub, { color: theme.accent }]}>
                      T{ex.term_number} · {ex.date} · {ex.time}
                    </Text>
                  </View>

                  <Text style={[styles.itemTitle, { color: theme.text }]}>{ex.course_name}</Text>
                  <Text style={[styles.bodyMuted, { color: theme.textSecondary }]}>
                    {ex.type} · Sala {ex.room} ({ex.building}) · {ex.examiner}
                  </Text>

                  <Pressable
                    onPress={() => {
                      hapticTap();
                      toggleExamRegistration(ex.id);
                    }}
                    style={({ pressed }) => [
                      styles.inlineActionBtn,
                      {
                        backgroundColor: ex.is_registered ? theme.dangerSoft : theme.accent,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.inlineActionText,
                        { color: ex.is_registered ? theme.danger : theme.primaryContrast },
                      ]}>
                      {ex.is_registered ? 'Wypisz się z terminu' : 'Zapisz się na termin'}
                    </Text>
                  </Pressable>
                </View>
              ))
            ))}

          {/* 3. PAYMENTS — Slim IBAN Strip + Flat Hairline Rows */}
          {slug === 'payments' && (
            <>
              {bankAccount && (
                <View style={[styles.ibanSection, { borderBottomColor: theme.separator }]}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.monoTag, { color: theme.accent }]}>
                      INDYWIDUALNY RACHUNEK WPŁAT (IBAN)
                    </Text>
                    <Text style={[styles.monoSub, { color: theme.textMuted }]}>
                      {bankAccount.currency || 'PLN'}
                    </Text>
                  </View>

                  <Text style={[styles.ibanBig, { color: theme.text }]} selectable>
                    {bankAccount.account_number}
                  </Text>
                  <Text style={[styles.bodyMuted, { color: theme.textSecondary }]}>
                    Odbiorca: {bankAccount.account_owner}
                  </Text>

                  <View style={styles.actionRow}>
                    <GlassSurface
                      radius={10}
                      interactive
                      onPress={async () => {
                        await Clipboard.setStringAsync(bankAccount.account_number);
                        Alert.alert('Skopiowano numer konta', bankAccount.account_number);
                      }}
                      style={{ flex: 1 }}
                      contentStyle={styles.glassBtnInner}>
                      <Ionicons name="copy-outline" size={14} color={theme.text} />
                      <Text style={[styles.inlineActionText, { color: theme.text }]}>
                        Kopiuj IBAN
                      </Text>
                    </GlassSurface>

                    <Pressable
                      onPress={async () => {
                        hapticTap();
                        const usosWebBase = selectedInstallation.baseUrl.replace(
                          'usosapps.',
                          'usosweb.'
                        );
                        await WebBrowser.openBrowserAsync(
                          `${usosWebBase}kontroler.php?_action=home/platnosci/index`
                        );
                      }}
                      style={({ pressed }) => [
                        styles.primaryCompactBtn,
                        { flex: 1, backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
                      ]}>
                      <Ionicons name="card-outline" size={14} color={theme.primaryContrast} />
                      <Text style={[styles.inlineActionText, { color: theme.primaryContrast }]}>
                        USOSweb
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {payments.length === 0 ? (
                <View style={styles.emptyBlock}>
                  <Ionicons name="checkmark-done-circle-outline" size={30} color={theme.success} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    Saldo 0,00 PLN
                  </Text>
                  <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                    Brak zaległych opłat ani rat na Twoim koncie USOS.
                  </Text>
                </View>
              ) : (
                <>
                  <SectionHeader title={`Rozliczenia i raty (${payments.length})`} />
                  {payments.map((p, idx) => {
                    const isScholarship = p.status === 'incoming_scholarship';
                    const isPaid = p.status === 'paid';
                    const targetIban = p.account_iban || bankAccount?.account_number || '';

                    return (
                      <View
                        key={p.id}
                        style={[
                          styles.itemBlock,
                          idx < payments.length - 1 && {
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: theme.separator,
                          },
                        ]}>
                        <View style={styles.rowBetween}>
                          <Text
                            style={[
                              styles.monoTag,
                              {
                                color: isScholarship || isPaid ? theme.success : theme.warning,
                              },
                            ]}>
                            {isScholarship
                              ? '● STYPENDIUM'
                              : isPaid
                              ? '✓ OPŁACONO'
                              : '● DO ZAPŁATY'}
                          </Text>
                          <Text
                            style={[
                              styles.amountMono,
                              {
                                color: isScholarship
                                  ? theme.success
                                  : isPaid
                                  ? theme.text
                                  : theme.warning,
                              },
                            ]}>
                            {isScholarship ? '+' : ''}
                            {p.amount.toFixed(2)} {p.currency}
                          </Text>
                        </View>

                        <Text style={[styles.itemTitle, { color: theme.text }]}>{p.title}</Text>
                        <Text style={[styles.bodyMuted, { color: theme.textSecondary }]}>
                          Termin: {p.due_date}
                          {p.total_amount && p.total_amount > 0
                            ? ` · Rata: ${p.total_amount.toFixed(2)} ${p.currency}`
                            : ''}
                        </Text>

                        {targetIban ? (
                          <Pressable
                            onPress={async () => {
                              hapticTap();
                              await Clipboard.setStringAsync(targetIban);
                              Alert.alert('Skopiowano!', targetIban);
                            }}
                            style={styles.inlineCopyRow}>
                            <Ionicons name="copy-outline" size={12} color={theme.accent} />
                            <Text
                              style={[styles.monoSub, { color: theme.accent, flex: 1 }]}
                              numberOfLines={1}>
                              {targetIban}
                            </Text>
                          </Pressable>
                        ) : null}

                        {!isPaid && !isScholarship && (
                          <View style={styles.actionRow}>
                            <GlassSurface
                              radius={10}
                              interactive
                              onPress={async () => {
                                const transferText = `Odbiorca: ${
                                  bankAccount?.account_owner || selectedInstallation.namePl
                                }\nRachunek IBAN: ${targetIban}\nKwota: ${p.amount.toFixed(2)} ${
                                  p.currency
                                }\nTytuł przelewu: ${p.title} (Album #${user.student_number})`;
                                await Clipboard.setStringAsync(targetIban || transferText);
                                await Share.share({
                                  title: `Przelew USOS: ${p.title}`,
                                  message: transferText,
                                }).catch(() => {});
                              }}
                              style={{ flex: 1 }}
                              contentStyle={styles.glassBtnInner}>
                              <Ionicons name="share-outline" size={14} color={theme.text} />
                              <Text style={[styles.inlineActionText, { color: theme.text }]}>
                                Dane do banku
                              </Text>
                            </GlassSurface>

                            <Pressable
                              onPress={async () => {
                                hapticTap();
                                const usosWebBase = selectedInstallation.baseUrl.replace(
                                  'usosapps.',
                                  'usosweb.'
                                );
                                await WebBrowser.openBrowserAsync(
                                  `${usosWebBase}kontroler.php?_action=home/platnosci/index`
                                );
                              }}
                              style={({ pressed }) => [
                                styles.primaryCompactBtn,
                                {
                                  flex: 1.15,
                                  backgroundColor: theme.accent,
                                  opacity: pressed ? 0.8 : 1,
                                },
                              ]}>
                              <Ionicons
                                name="flash-outline"
                                size={14}
                                color={theme.primaryContrast}
                              />
                              <Text
                                style={[
                                  styles.inlineActionText,
                                  { color: theme.primaryContrast },
                                ]}>
                                Opłać teraz
                              </Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </>
              )}
            </>
          )}

          {/* 4. REGISTRATIONS — Flat Hairline Sections */}
          {slug === 'registrations' &&
            (registrations.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Ionicons name="checkbox-outline" size={30} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  Brak aktywnych tur rejestracji
                </Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  Twoje aktualne przedmioty i przypisane grupy są widoczne w zakładkach Plan i
                  Dziennik.
                </Text>
              </View>
            ) : (
              registrations.map((round) => (
                <View key={round.id} style={styles.sectionSpacer}>
                  <SectionHeader
                    title={`${round.name} · ${round.mode}`}
                    rightText={`${round.start_date} – ${round.end_date}`}
                    accentColor={theme.success}
                  />
                  {round.courses.map((c, idx) => (
                    <View
                      key={c.course_id}
                      style={[
                        styles.rowBetweenItem,
                        idx < round.courses.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: theme.separator,
                        },
                      ]}>
                      <Text style={[styles.rowTitle, { color: theme.text, flex: 1 }]}>
                        {c.course_name}
                      </Text>
                      <Pressable
                        onPress={() => {
                          hapticTap();
                          toggleCourseRegistration(round.id, c.course_id);
                        }}
                        style={[
                          styles.miniPillBtn,
                          {
                            backgroundColor: c.is_registered ? theme.dangerSoft : theme.accentSoft,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.monoTag,
                            { color: c.is_registered ? theme.danger : theme.accent },
                          ]}>
                          {c.is_registered ? 'WYPISZ' : 'ZAPISZ'}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ))
            ))}

          {/* 5. SURVEYS — Flat Hairline Rows */}
          {slug === 'surveys' &&
            (surveys.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Ionicons name="chatbox-ellipses-outline" size={30} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  Brak ankiet do wypełnienia
                </Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  Wszystkie dostępne ankiety oceny zajęć zostały już rozliczone.
                </Text>
              </View>
            ) : (
              surveys.map((srv, idx) => {
                const isEditing = activeSurveyId === srv.id;
                return (
                  <View
                    key={srv.id}
                    style={[
                      styles.itemBlock,
                      idx < surveys.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.separator,
                      },
                    ]}>
                    <View style={styles.rowBetween}>
                      <Text
                        style={[
                          styles.monoTag,
                          { color: srv.filled_out ? theme.success : theme.warning },
                        ]}>
                        {srv.filled_out ? '✓ WYPEŁNIONA' : '● DO WYPEŁNIENIA'}
                      </Text>
                      <Text style={[styles.monoSub, { color: theme.textMuted }]}>
                        Do {srv.deadline}
                      </Text>
                    </View>

                    <Text style={[styles.itemTitle, { color: theme.text }]}>{srv.course_name}</Text>

                    <View style={styles.inlineAvatarRow}>
                      <Avatar name={srv.lecturer_name} uri={srv.lecturer_photo} size={26} />
                      <Text style={[styles.bodyMuted, { color: theme.textSecondary }]}>
                        {srv.lecturer_name}
                      </Text>
                    </View>

                    {!srv.filled_out && !isEditing && (
                      <Pressable
                        onPress={() => setActiveSurveyId(srv.id)}
                        style={[styles.inlineActionBtn, { backgroundColor: theme.accentSoft }]}>
                        <Ionicons name="create-outline" size={15} color={theme.accent} />
                        <Text style={[styles.inlineActionText, { color: theme.accent }]}>
                          Oceń zajęcia
                        </Text>
                      </Pressable>
                    )}

                    {isEditing && (
                      <View style={{ gap: 10, marginTop: 4 }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Pressable
                              key={star}
                              onPress={() => setSurveyRating(star)}
                              style={[
                                styles.starBtn,
                                {
                                  backgroundColor:
                                    surveyRating >= star ? theme.warningSoft : theme.bgSecondary,
                                  borderColor:
                                    surveyRating >= star ? theme.warning : theme.separator,
                                },
                              ]}>
                              <Text style={{ fontSize: 13, fontWeight: '800', color: theme.warning }}>
                                {star}★
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                        <TextInput
                          value={surveyComment}
                          onChangeText={setSurveyComment}
                          placeholder="Anonimowy komentarz..."
                          placeholderTextColor={theme.textMuted}
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
                          onPress={() => {
                            hapticTap();
                            submitSurvey(srv.id, surveyRating, surveyComment);
                            setActiveSurveyId(null);
                            setSurveyComment('');
                          }}
                          style={[styles.inlineActionBtn, { backgroundColor: theme.accent }]}>
                          <Text style={[styles.inlineActionText, { color: theme.primaryContrast }]}>
                            Zapisz ocenę
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })
            ))}

          {/* 6. STAFF DIRECTORY — Frosted Search + Flat Hairline Rows */}
          {slug === 'staff' && (
            <>
              <GlassSurface radius={12} contentStyle={styles.searchBarInner}>
                <Ionicons name="search" size={16} color={theme.accent} />
                <TextInput
                  value={staffQuery}
                  onChangeText={setStaffQuery}
                  placeholder={`Szukaj wykładowcy w ${selectedInstallation.shortName}...`}
                  placeholderTextColor={theme.textMuted}
                  style={{ flex: 1, color: theme.text, fontSize: 14 }}
                />
                {isSearchingStaff && <ActivityIndicator size="small" color={theme.accent} />}
                {staffQuery.length > 0 && (
                  <Pressable onPress={() => setStaffQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                  </Pressable>
                )}
              </GlassSurface>

              {staffResults.length === 0 ? (
                <View style={styles.emptyBlock}>
                  <Ionicons name="people-outline" size={30} color={theme.textMuted} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    {isSearchingStaff ? 'Wyszukiwanie w katalogu...' : 'Wyszukaj pracownika'}
                  </Text>
                  <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                    Wpisz co najmniej 2 znaki nazwiska, aby przeszukać katalog{' '}
                    {selectedInstallation.shortName}.
                  </Text>
                </View>
              ) : (
                staffResults.map((member, idx) => (
                  <View
                    key={member.id}
                    style={[
                      styles.itemBlock,
                      idx < staffResults.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.separator,
                      },
                    ]}>
                    <View style={styles.staffTopRow}>
                      <Avatar
                        name={member.name}
                        uri={member.photo_url}
                        size={46}
                        borderColor={theme.cardBorder}
                      />
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <View style={styles.staffBadgeLine}>
                          <Text
                            style={[styles.monoTag, { color: theme.accent }]}
                            numberOfLines={1}>
                            {member.titles.toUpperCase()}
                          </Text>
                          {member.is_my_lecturer && (
                            <Text style={[styles.monoTag, { color: theme.success }]}>
                              · TWÓJ PROWADZĄCY
                            </Text>
                          )}
                        </View>
                        <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                          {member.name}
                        </Text>
                        <Text
                          style={[styles.bodyMuted, { color: theme.textSecondary }]}
                          numberOfLines={1}>
                          {member.faculty}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.bodyMuted, { color: theme.textSecondary }]}>
                      Pokój {member.room} · {member.building}
                      {member.office_hours ? ` · Konsultacje: ${member.office_hours}` : ''}
                    </Text>

                    {member.courses_taught && member.courses_taught.length > 0 && (
                      <Text
                        style={[styles.monoSub, { color: theme.textMuted }]}
                        numberOfLines={2}>
                        {member.courses_taught.join(' · ')}
                      </Text>
                    )}

                    {member.email && member.email.includes('@') ? (
                      <View style={styles.rowBetween}>
                        <Pressable
                          onPress={() => {
                            hapticTap();
                            Linking.openURL(`mailto:${member.email}`).catch(() => {});
                          }}
                          style={styles.inlineCopyRow}>
                          <Ionicons name="mail-outline" size={13} color={theme.accent} />
                          <Text
                            style={[styles.monoSub, { color: theme.accent }]}
                            numberOfLines={1}>
                            {member.email}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={async () => {
                            hapticTap();
                            await Clipboard.setStringAsync(member.email);
                            Alert.alert('Skopiowano', member.email);
                          }}
                          style={[styles.miniPillBtn, { backgroundColor: theme.accentSoft }]}>
                          <Ionicons name="copy-outline" size={11} color={theme.accent} />
                          <Text style={[styles.monoTag, { color: theme.accent }]}>KOPIUJ</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => {
                          hapticTap();
                          const webBase = selectedInstallation.baseUrl
                            .replace(/apps\.?/i, '')
                            .replace(/\/+$/, '');
                          WebBrowser.openBrowserAsync(
                            `${webBase}/kontroler.php?_action=katalog2/osoby/pokazOsobe&os_id=${member.id}`
                          ).catch(() => {});
                        }}
                        style={styles.inlineCopyRow}>
                        <Ionicons name="open-outline" size={13} color={theme.accent} />
                        <Text style={[styles.monoSub, { color: theme.accent }]}>
                          Otwórz profil w USOSweb →
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ))
              )}
            </>
          )}

          {/* 7. BUILDINGS — Flat Hairline Rows */}
          {slug === 'buildings' &&
            (buildings.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Ionicons name="map-outline" size={30} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  Brak pobranych budynków kampusu
                </Text>
              </View>
            ) : (
              buildings.map((b, idx) => (
                <View
                  key={b.id}
                  style={[
                    styles.itemBlock,
                    idx < buildings.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.separator,
                    },
                  ]}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.monoTag, { color: theme.accent }]}>
                      BUDYNEK {b.code}
                    </Text>
                    <Text style={[styles.monoSub, { color: theme.textMuted }]}>
                      {b.latitude.toFixed(4)}°N, {b.longitude.toFixed(4)}°E
                    </Text>
                  </View>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>{b.name}</Text>
                  <Text style={[styles.bodyMuted, { color: theme.textSecondary }]}>
                    {b.address}
                  </Text>
                </View>
              ))
            ))}

          {/* 8. THESIS, DORM & SLIPS — Flat Hairline Sections */}
          {slug === 'thesis' && (
            <>
              {thesis ? (
                <View style={[styles.itemBlock, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.separator }]}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.monoTag, { color: theme.accent }]}>
                      PRACA {thesis.type.toUpperCase()}
                    </Text>
                    <Text style={[styles.monoTag, { color: theme.success }]}>
                      {thesis.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>{thesis.title_pl}</Text>
                  <View style={styles.inlineAvatarRow}>
                    <Avatar name={thesis.supervisor} uri={thesis.supervisor_photo} size={28} />
                    <Text style={[styles.bodyMuted, { color: theme.textSecondary }]}>
                      Promotor: {thesis.supervisor}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyBlock}>
                  <Ionicons name="ribbon-outline" size={30} color={theme.textMuted} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    Brak pracy dyplomowej w APD
                  </Text>
                  <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                    W systemie USOS / APD nie przypisano jeszcze tematu pracy do Twojego konta.
                  </Text>
                </View>
              )}

              {dorm && (
                <View style={[styles.itemBlock, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.separator }]}>
                  <Text style={[styles.monoTag, { color: theme.accent }]}>AKADEMIK</Text>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>{dorm.dorm_name}</Text>
                  <Text style={[styles.bodyMuted, { color: theme.textSecondary }]}>
                    Pokój {dorm.room_number} · {dorm.room_type}
                  </Text>
                </View>
              )}

              {slips.map((sl) => (
                <View key={sl.id} style={styles.sectionSpacer}>
                  <SectionHeader title={sl.title} />
                  {sl.items.map((it, i) => (
                    <View
                      key={i}
                      style={[
                        styles.rowBetweenItem,
                        i < sl.items.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: theme.separator,
                        },
                      ]}>
                      <Text style={[styles.bodyMuted, { color: theme.textSecondary }]}>
                        {it.department}
                      </Text>
                      <Text style={[styles.monoTag, { color: theme.success }]}>
                        ✓ {it.status}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}
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
  categoryMono: {
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
    paddingTop: 14,
    paddingBottom: 44,
  },
  elsOuter: {
    marginBottom: 12,
  },
  elsInner: {
    padding: 18,
    gap: 16,
  },
  elsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  elsOverline: {
    fontFamily: MONO_FONT,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  elsUniName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontFamily: MONO_FONT,
    fontSize: 9.5,
    fontWeight: '800',
  },
  elsBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  elsStudentName: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  elsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  qrOpenSection: {
    alignItems: 'center',
    paddingVertical: 26,
    gap: 8,
  },
  itemBlock: {
    paddingVertical: 14,
    gap: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  rowBetweenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 10,
  },
  monoTag: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  monoSub: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '600',
  },
  amountMono: {
    fontFamily: MONO_FONT,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  itemTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.25,
    lineHeight: 20,
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  bodyMuted: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  ibanSection: {
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  ibanBig: {
    fontFamily: MONO_FONT,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  glassBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 10,
  },
  primaryCompactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  inlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
    marginTop: 4,
  },
  inlineActionText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  inlineCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  miniPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inlineAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  staffTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  staffBadgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 6,
  },
  starBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
  },
  sectionSpacer: {
    marginTop: 4,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
