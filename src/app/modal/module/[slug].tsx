import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
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
import { Avatar } from '@/components/Avatar';
import { GlassCard } from '@/components/GlassCard';
import { UniversityIcon } from '@/components/UniversityIcon';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT } from '@/theme/theme';

const MODULE_TITLES: Record<string, { title: string; category: string }> = {
  mcard: {
    title: 'Elektroniczna Legitymacja (ELS)',
    category: 'DOKUMENT STUDENCKI',
  },
  exams: {
    title: 'Sesja i Zapisy na Egzaminy',
    category: 'SESJA EGZAMINACYJNA',
  },
  payments: {
    title: 'Płatności i Konto Uczelniane',
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
    title: 'Twoi Wykładowcy i Katalog Kadry',
    category: 'KADRA AKADEMICKA',
  },
  buildings: {
    title: 'Budynki i Kampus Uczelni',
    category: 'MAPA KAMPUSU',
  },
  thesis: {
    title: 'Dyplom (APD), Akademik i Obiegówka',
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

  // Staff search state
  const [staffQuery, setStaffQuery] = useState('');
  const [staffResults, setStaffResults] = useState<UsosStaffMember[]>(staff);
  const [isSearchingStaff, setIsSearchingStaff] = useState(false);

  // Survey active state
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
  const [surveyRating, setSurveyRating] = useState<number>(5);
  const [surveyComment, setSurveyComment] = useState<string>('');

  useEffect(() => {
    setStaffResults(staff);
  }, [staff]);

  useEffect(() => {
    const q = staffQuery.trim().toLowerCase();
    if (!q) {
      setStaffResults(staff);
      setIsSearchingStaff(false);
      return;
    }

    // Immediate local filter so typing feels instant
    const localHits = staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.titles.toLowerCase().includes(q) ||
        s.faculty.toLowerCase().includes(q) ||
        s.building.toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.courses_taught || []).some((c) => c.toLowerCase().includes(q))
    );
    setStaffResults(localHits);

    if (q.length < 2) {
      setIsSearchingStaff(false);
      return;
    }

    let cancelled = false;
    setIsSearchingStaff(true);
    const timer = setTimeout(() => {
      searchStaffLive(staffQuery)
        .then((res) => {
          if (!cancelled) setStaffResults(res);
        })
        .finally(() => {
          if (!cancelled) setIsSearchingStaff(false);
        });
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [staffQuery, searchStaffLive, staff]);

  const meta = MODULE_TITLES[slug || 'mcard'] || MODULE_TITLES.mcard;

  const hapticTap = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
      {/* Modal Header */}
      <View style={[styles.header, { borderBottomColor: theme.separator }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.apiLabel, { color: theme.primary }]}>
            RIFT DAILY • {meta.category}
          </Text>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {meta.title}
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: theme.cardElevated }]}>
          <Ionicons name="close" size={20} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 1. mCARD / ELS with Real Photo & Real Card Data */}
        {slug === 'mcard' && (
          <>
            <GlassCard elevated padding={20} style={styles.elsCard}>
              <View style={styles.elsTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <UniversityIcon installation={selectedInstallation} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.elsCountry, { color: theme.textSecondary }]}>
                      RIFT DAILY // LEGITYMACJA STUDENCKA
                    </Text>
                    <Text style={[styles.elsUniName, { color: theme.text }]} numberOfLines={2}>
                      {selectedInstallation.namePl}
                    </Text>
                  </View>
                </View>
                <View style={[styles.elsHoloBadge, { backgroundColor: theme.successSoft }]}>
                  <Ionicons name="shield-checkmark" size={14} color={theme.success} />
                  <Text style={[styles.elsHoloText, { color: theme.success }]}>
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
                  size={74}
                  borderColor={theme.cardBorder}
                />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.elsStudentName, { color: theme.text }]}>
                    {user.first_name} {user.last_name}
                  </Text>
                  <Text style={[styles.elsMeta, { color: theme.textSecondary }]}>
                    Nr albumu: #{user.student_number}
                  </Text>
                  <Text
                    style={[styles.elsMeta, { color: theme.textSecondary }]}
                    numberOfLines={2}>
                    {user.programmes[0]?.name.pl || selectedInstallation.namePl}
                  </Text>
                  <Text style={[styles.elsMeta, { color: theme.textSecondary }]}>
                    Status: {user.student_status === 2 ? 'Aktywny student' : 'Student'}
                  </Text>
                </View>
              </View>

              <View style={[styles.elsFooter, { borderTopColor: theme.separator }]}>
                <Text style={[styles.elsChipText, { color: theme.textSecondary }]}>
                  {studentCard?.barcode_number
                    ? `KARTA ELS #${studentCard.barcode_number}`
                    : `ID STUDENTA USOS #${user.id || user.student_number}`}
                </Text>
                <Ionicons name="wifi" size={18} color={theme.textSecondary} />
              </View>
            </GlassCard>

            <GlassCard style={styles.qrCard}>
              <View style={styles.qrBox}>
                <Ionicons name="qr-code" size={136} color={theme.text} />
              </View>
              <Text style={[styles.qrTitle, { color: theme.text }]}>
                Kod identyfikacyjny studenta ({user.student_number})
              </Text>
              <Text style={[styles.qrSub, { color: theme.textSecondary }]}>
                {studentCard?.barcode_number
                  ? `Numer kodu kreskowego karty: ${studentCard.barcode_number}`
                  : 'Dane pobrane bezpośrednio z uczelni.'}
              </Text>
            </GlassCard>
          </>
        )}

        {/* 2. EXAMS */}
        {slug === 'exams' &&
          (exams.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="calendar-clear-outline" size={36} color={theme.primary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Brak aktywnych zapisów na egzaminy
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                W systemie USOS nie ma obecnie otwartych rejestracji na terminy egzaminacyjne dla
                Twojego konta.
              </Text>
            </GlassCard>
          ) : (
            exams.map((ex) => (
              <GlassCard key={ex.id} style={{ gap: 10 }}>
                <View style={styles.rowBetween}>
                  <View
                    style={[
                      styles.pillBadge,
                      {
                        backgroundColor: ex.is_registered
                          ? theme.successSoft
                          : theme.warningSoft,
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color: ex.is_registered ? theme.success : theme.warning,
                      }}>
                      {ex.is_registered ? 'ZAPISANY NA TERMIN' : 'OTWARTE ZAPISY'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primary }}>
                    Termin {ex.term_number} • {ex.date}
                  </Text>
                </View>

                <Text style={[styles.itemTitle, { color: theme.text }]}>{ex.course_name}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.accent }}>
                  {ex.type} • Godz. {ex.time}
                </Text>

                <View style={styles.metaStack}>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                    Sala: <Text style={{ color: theme.text, fontWeight: '700' }}>{ex.room}</Text> (
                    {ex.building})
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                    Egzaminator: {ex.examiner}
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    hapticTap();
                    toggleExamRegistration(ex.id);
                  }}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: ex.is_registered ? theme.dangerSoft : theme.primary,
                    },
                  ]}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '800',
                      color: ex.is_registered ? theme.danger : theme.primaryContrast,
                    }}>
                    {ex.is_registered
                      ? 'Wypisz się z terminu egzaminu'
                      : 'Zapisz się na termin egzaminu'}
                  </Text>
                </Pressable>
              </GlassCard>
            ))
          ))}

        {/* 3. PAYMENTS */}
        {slug === 'payments' && (
          <>
            {bankAccount && (
              <GlassCard elevated style={{ gap: 10 }}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.smallTag, { color: theme.accent }]}>
                    INDYWIDUALNE KONTO WPŁAT STUDENTA (IBAN)
                  </Text>
                  <View style={[styles.pillBadge, { backgroundColor: theme.accentSoft }]}>
                    <Text
                      style={{
                        fontFamily: MONO_FONT,
                        fontSize: 9,
                        fontWeight: '800',
                        color: theme.accent,
                      }}>
                      {bankAccount.currency || 'PLN'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.ibanText, { color: theme.text }]} selectable>
                  {bankAccount.account_number}
                </Text>

                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                  Odbiorca: <Text style={{ color: theme.text, fontWeight: '700' }}>{bankAccount.account_owner}</Text>
                </Text>

                <View style={styles.paymentActionsRow}>
                  <Pressable
                    onPress={async () => {
                      hapticTap();
                      await Clipboard.setStringAsync(bankAccount.account_number);
                      Alert.alert(
                        'Skopiowano numer konta!',
                        `Numer IBAN (${bankAccount.account_number}) został skopiowany do schowka.`
                      );
                    }}
                    style={[
                      styles.copyIbanBtn,
                      {
                        flex: 1,
                        backgroundColor: theme.bgSecondary,
                        borderColor: theme.cardBorder,
                        borderWidth: 1,
                      },
                    ]}>
                    <Ionicons name="copy-outline" size={16} color={theme.text} />
                    <Text style={{ color: theme.text, fontWeight: '800', fontSize: 12 }}>
                      Kopiuj numer konta
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={async () => {
                      hapticTap();
                      const usosWebBase = selectedInstallation.baseUrl.replace(
                        'usosapps.',
                        'usosweb.'
                      );
                      const payUrl = `${usosWebBase}kontroler.php?_action=home/platnosci/index`;
                      await WebBrowser.openBrowserAsync(payUrl);
                    }}
                    style={[
                      styles.copyIbanBtn,
                      {
                        flex: 1,
                        backgroundColor: theme.accent,
                      },
                    ]}>
                    <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                      Przelew USOSweb
                    </Text>
                  </Pressable>
                </View>
              </GlassCard>
            )}

            {payments.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="checkmark-done-circle-outline" size={36} color={theme.success} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  Brak naliczonych opłat — saldo 0,00 PLN
                </Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  Na Twoim koncie USOS nie ma żadnych zaległych płatności ani rat.
                </Text>
              </GlassCard>
            ) : (
              payments.map((p) => {
                const isScholarship = p.status === 'incoming_scholarship';
                const isPaid = p.status === 'paid';
                const targetIban = p.account_iban || bankAccount?.account_number || '';

                return (
                  <GlassCard key={p.id} style={{ gap: 10 }}>
                    <View style={styles.rowBetween}>
                      <View
                        style={[
                          styles.pillBadge,
                          {
                            backgroundColor: isScholarship
                              ? theme.successSoft
                              : isPaid
                              ? theme.successSoft
                              : theme.warningSoft,
                          },
                        ]}>
                        <Text
                          style={{
                            fontFamily: MONO_FONT,
                            fontSize: 10,
                            fontWeight: '800',
                            color: isScholarship
                              ? theme.success
                              : isPaid
                              ? theme.success
                              : theme.warning,
                          }}>
                          {isScholarship
                            ? 'STYPENDIUM'
                            : isPaid
                            ? 'OPŁACONO'
                            : 'RATA / DO ZAPŁATY'}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontFamily: MONO_FONT,
                          fontSize: 20,
                          fontWeight: '900',
                          color: isScholarship
                            ? theme.success
                            : isPaid
                            ? theme.text
                            : theme.warning,
                        }}>
                        {isScholarship ? '+' : ''}
                        {p.amount.toFixed(2)} {p.currency}
                      </Text>
                    </View>

                    <Text style={[styles.itemTitle, { color: theme.text }]}>{p.title}</Text>

                    <View style={styles.rowBetween}>
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                        Termin płatności:{' '}
                        <Text style={{ fontFamily: MONO_FONT, color: theme.text, fontWeight: '700' }}>
                          {p.due_date}
                        </Text>
                      </Text>
                      {p.total_amount && p.total_amount > 0 ? (
                        <Text style={{ fontFamily: MONO_FONT, fontSize: 11, color: theme.textMuted }}>
                          Kwota raty: {p.total_amount.toFixed(2)} {p.currency}
                        </Text>
                      ) : null}
                    </View>

                    {targetIban ? (
                      <View
                        style={[
                          styles.ibanInlineStrip,
                          {
                            backgroundColor: theme.bgSecondary,
                            borderColor: theme.cardBorder,
                          },
                        ]}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={{
                              fontFamily: MONO_FONT,
                              fontSize: 9,
                              fontWeight: '800',
                              color: theme.textMuted,
                            }}>
                            KONTO DO WPŁATY (KLIKNIJ ABY SKOPIOWAĆ)
                          </Text>
                          <Text
                            style={{
                              fontFamily: MONO_FONT,
                              fontSize: 12,
                              fontWeight: '700',
                              color: theme.text,
                              marginTop: 2,
                            }}
                            numberOfLines={1}>
                            {targetIban}
                          </Text>
                        </View>
                        <Pressable
                          onPress={async () => {
                            hapticTap();
                            await Clipboard.setStringAsync(targetIban);
                            Alert.alert('Skopiowano!', `Skopiowano numer konta:\n${targetIban}`);
                          }}
                          style={[styles.miniCopyBtn, { backgroundColor: theme.card }]}>
                          <Ionicons name="copy-outline" size={14} color={theme.accent} />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent }}>
                            Kopiuj
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}

                    {!isPaid && !isScholarship && (
                      <View style={styles.paymentActionsRow}>
                        <Pressable
                          onPress={async () => {
                            hapticTap();
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
                          style={[
                            styles.copyIbanBtn,
                            {
                              flex: 1,
                              backgroundColor: theme.bgSecondary,
                              borderColor: theme.cardBorder,
                              borderWidth: 1,
                            },
                          ]}>
                          <Ionicons name="share-outline" size={15} color={theme.text} />
                          <Text style={{ color: theme.text, fontWeight: '800', fontSize: 12 }}>
                            Dane do banku
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={async () => {
                            hapticTap();
                            const usosWebBase = selectedInstallation.baseUrl.replace(
                              'usosapps.',
                              'usosweb.'
                            );
                            const payUrl = `${usosWebBase}kontroler.php?_action=home/platnosci/index`;
                            await WebBrowser.openBrowserAsync(payUrl);
                          }}
                          style={[
                            styles.copyIbanBtn,
                            {
                              flex: 1.25,
                              backgroundColor: theme.primary,
                            },
                          ]}>
                          <Ionicons
                            name="flash-outline"
                            size={15}
                            color={theme.primaryContrast}
                          />
                          <Text
                            style={{
                              color: theme.primaryContrast,
                              fontWeight: '800',
                              fontSize: 12,
                            }}>
                            Opłać bezpośrednio
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </GlassCard>
                );
              })
            )}
          </>
        )}

        {/* 4. REGISTRATIONS */}
        {slug === 'registrations' &&
          (registrations.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="checkbox-outline" size={36} color={theme.primary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Brak aktywnych tur rejestracji
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Twoje aktualne przedmioty i przypisane grupy są już widoczne w zakładkach Plan oraz
                Przedmioty.
              </Text>
            </GlassCard>
          ) : (
            registrations.map((round) => (
              <GlassCard key={round.id} style={{ gap: 12 }}>
                <View style={styles.rowBetween}>
                  <View style={[styles.pillBadge, { backgroundColor: theme.successSoft }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: theme.success }}>
                      TURA AKTYWNA • {round.mode.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.itemTitle, { color: theme.text }]}>{round.name}</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                  Okno rejestracji: {round.start_date} – {round.end_date}
                </Text>

                <View style={{ gap: 10, marginTop: 4 }}>
                  {round.courses.map((c) => (
                    <View
                      key={c.course_id}
                      style={[
                        styles.regCourseBox,
                        {
                          backgroundColor: theme.bgSecondary,
                          borderColor: c.is_registered ? theme.primary : theme.cardBorder,
                        },
                      ]}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>
                        {c.course_name}
                      </Text>
                      <Pressable
                        onPress={() => {
                          hapticTap();
                          toggleCourseRegistration(round.id, c.course_id);
                        }}
                        style={[
                          styles.regToggleBtn,
                          {
                            backgroundColor: c.is_registered
                              ? theme.dangerSoft
                              : theme.primarySoft,
                          },
                        ]}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '800',
                            color: c.is_registered ? theme.danger : theme.primary,
                          }}>
                          {c.is_registered
                            ? 'Wypisz z przedmiotu'
                            : `Zarejestruj (${c.group_options[0]})`}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </GlassCard>
            ))
          ))}

        {/* 5. SURVEYS */}
        {slug === 'surveys' &&
          (surveys.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="chatbox-ellipses-outline" size={36} color={theme.primary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Brak ankiet oczekujących na wypełnienie
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Wszystkie dostępne ankiety oceny zajęć w tym semestrze zostały już rozliczone lub
                nie rozpoczęła się jeszcze tura ankietowania.
              </Text>
            </GlassCard>
          ) : (
            surveys.map((srv) => {
              const isEditing = activeSurveyId === srv.id;
              return (
                <GlassCard key={srv.id} style={{ gap: 10 }}>
                  <View style={styles.rowBetween}>
                    <View
                      style={[
                        styles.pillBadge,
                        {
                          backgroundColor: srv.filled_out
                            ? theme.successSoft
                            : theme.warningSoft,
                        },
                      ]}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: srv.filled_out ? theme.success : theme.warning,
                        }}>
                        {srv.filled_out ? 'WYPEŁNIONA' : 'DO WYPEŁNIENIA'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      Do {srv.deadline}
                    </Text>
                  </View>

                  <Text style={[styles.itemTitle, { color: theme.text }]}>{srv.course_name}</Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Avatar name={srv.lecturer_name} uri={srv.lecturer_photo} size={34} />
                    <Text style={{ fontSize: 13, color: theme.text, fontWeight: '700' }}>
                      {srv.lecturer_name}
                    </Text>
                  </View>

                  {!srv.filled_out && !isEditing && (
                    <Pressable
                      onPress={() => setActiveSurveyId(srv.id)}
                      style={[styles.actionBtn, { backgroundColor: theme.primarySoft }]}>
                      <Ionicons name="create-outline" size={17} color={theme.primary} />
                      <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 13 }}>
                        Oceń zajęcia
                      </Text>
                    </Pressable>
                  )}

                  {isEditing && (
                    <View style={{ gap: 10, marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
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
                                  surveyRating >= star ? theme.warning : theme.cardBorder,
                              },
                            ]}>
                            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.warning }}>
                              {star} ★
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
                            backgroundColor: theme.bgSecondary,
                            color: theme.text,
                            borderColor: theme.cardBorder,
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
                        style={[styles.actionBtn, { backgroundColor: theme.primary }]}>
                        <Text
                          style={{
                            color: theme.primaryContrast,
                            fontWeight: '800',
                            fontSize: 13,
                          }}>
                          Zapisz ocenę
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </GlassCard>
              );
            })
          ))}

        {/* 6. STAFF DIRECTORY (With Photos, Titles & Courses Taught!) */}
        {slug === 'staff' && (
          <>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: theme.cardElevated,
                  borderColor: staffQuery.length > 0 ? theme.primary : theme.cardBorder,
                  borderWidth: 1.5,
                },
              ]}>
              <Ionicons name="search" size={18} color={theme.primary} />
              <TextInput
                value={staffQuery}
                onChangeText={setStaffQuery}
                placeholder={`Szukaj wykładowcy w ${selectedInstallation.shortName} (np. nazwisko)...`}
                placeholderTextColor={theme.textMuted}
                style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: '500' }}
              />
              {isSearchingStaff && (
                <ActivityIndicator size="small" color={theme.primary} />
              )}
              {staffQuery.length > 0 && (
                <Pressable onPress={() => setStaffQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                </Pressable>
              )}
            </View>

            {staffResults.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="people-outline" size={36} color={theme.primary} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  {isSearchingStaff ? 'Trwa wyszukiwanie w katalogu...' : 'Wyszukaj pracownika uczelni'}
                </Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  Wpisz co najmniej 2 znaki nazwiska powyżej, aby przeszukać katalog pracowników{' '}
                  {selectedInstallation.shortName}.
                </Text>
              </GlassCard>
            ) : (
              staffResults.map((member) => (
                <GlassCard key={member.id} style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                    <Avatar
                      name={member.name}
                      uri={member.photo_url}
                      size={56}
                      borderColor={theme.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary }}>
                          {member.titles.toUpperCase()}
                        </Text>
                        {member.is_my_lecturer && (
                          <View
                            style={{
                              backgroundColor: theme.successSoft,
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 6,
                            }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: theme.success }}>
                              TWÓJ WYKŁADOWCA
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.itemTitle, { color: theme.text, marginTop: 1 }]}>
                        {member.name}
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: theme.textSecondary }}
                        numberOfLines={1}>
                        {member.faculty}
                      </Text>
                    </View>
                  </View>

                  {member.courses_taught && member.courses_taught.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {member.courses_taught.map((crs, idx) => (
                        <View
                          key={idx}
                          style={{
                            backgroundColor: theme.primarySoft,
                            paddingHorizontal: 9,
                            paddingVertical: 4,
                            borderRadius: 8,
                          }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary }}>
                            📚 {crs}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={[styles.staffMetaBox, { backgroundColor: theme.bgSecondary }]}>
                    <Text style={{ fontSize: 12, color: theme.text }}>
                      🚪 <Text style={{ fontWeight: '700' }}>{member.room}</Text> •{' '}
                      {member.building}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.text }}>
                      🕒 Konsultacje:{' '}
                      <Text style={{ fontWeight: '600' }}>{member.office_hours}</Text>
                    </Text>
                    {member.email && member.email.includes('@') ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginTop: 2,
                        }}>
                        <Pressable
                          onPress={() => {
                            hapticTap();
                            Linking.openURL(`mailto:${member.email}`).catch(() => {});
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Ionicons name="mail-outline" size={14} color={theme.primary} />
                          <Text
                            style={{
                              fontSize: 12,
                              color: theme.primary,
                              fontWeight: '700',
                              textDecorationLine: 'underline',
                            }}
                            numberOfLines={1}>
                            {member.email}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={async () => {
                            hapticTap();
                            await Clipboard.setStringAsync(member.email);
                            Alert.alert('Skopiowano', `Adres ${member.email} został skopiowany.`);
                          }}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 7,
                            backgroundColor: theme.primarySoft,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          }}>
                          <Ionicons name="copy-outline" size={12} color={theme.primary} />
                          <Text style={{ fontSize: 10, fontWeight: '800', color: theme.primary }}>
                            KOPIUJ
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: '600' }}>
                        ✉️ {member.email}
                      </Text>
                    )}
                  </View>
                </GlassCard>
              ))
            )}
          </>
        )}

        {/* 7. BUILDINGS / CAMPUS MAP */}
        {slug === 'buildings' &&
          (buildings.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="map-outline" size={36} color={theme.primary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Brak pobranych budynków kampusu
              </Text>
            </GlassCard>
          ) : (
            buildings.map((b) => (
              <GlassCard key={b.id} style={{ gap: 10 }}>
                <View style={styles.rowBetween}>
                  <View style={[styles.pillBadge, { backgroundColor: theme.primarySoft }]}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: theme.primary }}>
                      BUDYNEK {b.code}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: theme.textMuted }}>
                    GPS: {b.latitude.toFixed(4)}°N, {b.longitude.toFixed(4)}°E
                  </Text>
                </View>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{b.name}</Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary }}>📍 {b.address}</Text>
              </GlassCard>
            ))
          ))}

        {/* 8. THESIS, DORM & CLEARANCE SLIPS */}
        {slug === 'thesis' && (
          <>
            {thesis ? (
              <GlassCard elevated style={{ gap: 10 }}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.smallTag, { color: theme.primary }]}>
                    ARCHIWUM PRAC DYPLOMOWYCH
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: theme.success }}>
                    {thesis.status}
                  </Text>
                </View>

                <Text style={[styles.itemTitle, { color: theme.text }]}>
                  Praca {thesis.type}: {thesis.title_pl}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar name={thesis.supervisor} uri={thesis.supervisor_photo} size={38} />
                  <View>
                    <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: '700' }}>
                      PROMOTOR PRACY
                    </Text>
                    <Text style={{ fontSize: 14, color: theme.text, fontWeight: '800' }}>
                      {thesis.supervisor}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            ) : (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="ribbon-outline" size={36} color={theme.primary} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  Brak zarejestrowanej pracy dyplomowej w APD
                </Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  W systemie USOS / APD nie przypisano jeszcze tematu pracy dyplomowej do Twojego
                  konta.
                </Text>
              </GlassCard>
            )}

            {dorm && (
              <GlassCard style={{ gap: 8 }}>
                <Text style={[styles.smallTag, { color: theme.accent }]}>
                  ZAKWATEROWANIE W AKADEMIKU
                </Text>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{dorm.dorm_name}</Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                  Pokój: <Text style={{ color: theme.text, fontWeight: '700' }}>{dorm.room_number}</Text> •{' '}
                  {dorm.room_type}
                </Text>
              </GlassCard>
            )}

            {slips.map((sl) => (
              <GlassCard key={sl.id} style={{ gap: 8 }}>
                <Text style={[styles.smallTag, { color: theme.success }]}>
                  ELEKTRONICZNA KARTA OBIEGOWA
                </Text>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{sl.title}</Text>
                {sl.items.map((it, i) => (
                  <View key={i} style={styles.rowBetween}>
                    <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                      {it.department}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: theme.success }}>
                      ✓ {it.status}
                    </Text>
                  </View>
                ))}
              </GlassCard>
            ))}
          </>
        )}
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
  apiLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    paddingBottom: 45,
  },
  elsCard: {
    borderRadius: 24,
    padding: 20,
    gap: 18,
  },
  elsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  elsCountry: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  elsUniName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  elsHoloBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  elsHoloText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
  },
  elsBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  elsStudentName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  elsMeta: {
    color: '#DBEAFE',
    fontSize: 12,
    fontWeight: '600',
  },
  elsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
    paddingTop: 12,
  },
  elsChipText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  qrCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 22,
  },
  qrBox: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  qrTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  qrSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  metaStack: {
    gap: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 13,
    marginTop: 2,
  },
  smallTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  ibanText: {
    fontFamily: MONO_FONT,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  paymentActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  ibanInlineStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  miniCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  copyIbanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 13,
  },
  regCourseBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  regToggleBtn: {
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 4,
  },
  starBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  staffMetaBox: {
    padding: 11,
    borderRadius: 12,
    gap: 5,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
