import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Keyboard,
  Modal,
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
import { GradeBadge } from '@/components/GradeBadge';
import { ListRow } from '@/components/ListRow';
import { SectionHeader } from '@/components/SectionHeader';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsosStore } from '@/store/useUsosStore';
import { MONO_FONT } from '@/theme/theme';

type SearchCategory = 'all' | 'classes' | 'courses' | 'grades' | 'teachers';

interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

const MODULE_ITEMS = [
  { slug: 'mcard', label: 'mLegitymacja (ELS)', icon: 'id-card-outline' as const },
  { slug: 'exams', label: 'Egzaminy i Sesja', icon: 'calendar-clear-outline' as const },
  { slug: 'payments', label: 'Płatności i Konto IBAN', icon: 'wallet-outline' as const },
  { slug: 'staff', label: 'Katalog Wykładowców', icon: 'people-outline' as const },
  { slug: 'surveys', label: 'Ankiety Oceny Zajęć', icon: 'chatbox-ellipses-outline' as const },
  { slug: 'buildings', label: 'Budynki i Kampus', icon: 'map-outline' as const },
  { slug: 'registrations', label: 'Rejestracje USOS', icon: 'checkbox-outline' as const },
  { slug: 'thesis', label: 'Dyplom (APD) i Sprawy', icon: 'ribbon-outline' as const },
];

export function GlobalSearchModal({ visible, onClose }: GlobalSearchModalProps) {
  const theme = useAppTheme();
  const courses = useUsosStore((s) => s.courses);
  const grades = useUsosStore((s) => s.grades);
  const staff = useUsosStore((s) => s.staff);
  const timetable = useUsosStore((s) => s.timetable);
  const upcomingTimetable = useUsosStore((s) => s.upcomingTimetable);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');

  const handleClose = () => {
    Keyboard.dismiss();
    setQuery('');
    setCategory('all');
    onClose();
  };

  const navigateAndClose = (path: string) => {
    handleClose();
    setTimeout(() => {
      router.push(path as never);
    }, 60);
  };

  const effectiveClasses = useMemo(
    () => (upcomingTimetable.length > 0 ? upcomingTimetable : timetable),
    [upcomingTimetable, timetable]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const dedupeBy = <T,>(arr: T[], getKey: (item: T) => string): T[] => {
      const seen = new Set<string>();
      const out: T[] = [];
      for (const item of arr) {
        const k = getKey(item);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(item);
      }
      return out;
    };

    const matchedClasses =
      category === 'all' || category === 'classes'
        ? dedupeBy(
            q
              ? effectiveClasses.filter(
                  (t) =>
                    t.course_name.pl.toLowerCase().includes(q) ||
                    (t.room_number || '').toLowerCase().includes(q) ||
                    (t.lecturer_name || '').toLowerCase().includes(q)
                )
              : effectiveClasses,
            (a) => `${a.course_id}|${a.day_of_week}|${a.start_time}`
          ).slice(0, 6)
        : [];

    const matchedCourses =
      category === 'all' || category === 'courses'
        ? dedupeBy(
            q
              ? courses.filter(
                  (c) =>
                    c.course_name.pl.toLowerCase().includes(q) ||
                    c.course_id.toLowerCase().includes(q) ||
                    c.coordinator.toLowerCase().includes(q)
                )
              : courses,
            (c) => c.course_id
          ).slice(0, 8)
        : [];

    const matchedGrades =
      category === 'all' || category === 'grades'
        ? dedupeBy(
            q
              ? grades.filter(
                  (g) =>
                    g.course_name.pl.toLowerCase().includes(q) ||
                    g.author_name.toLowerCase().includes(q) ||
                    g.value_symbol.toLowerCase().includes(q)
                )
              : grades,
            (g) => g.id
          ).slice(0, 6)
        : [];

    const matchedTeachers =
      category === 'all' || category === 'teachers'
        ? dedupeBy(
            q
              ? staff.filter(
                  (s) =>
                    s.name.toLowerCase().includes(q) ||
                    s.titles.toLowerCase().includes(q) ||
                    s.room.toLowerCase().includes(q) ||
                    (s.email || '').toLowerCase().includes(q) ||
                    (s.courses_taught || []).some((ct) => ct.toLowerCase().includes(q))
                )
              : staff,
            (s) => s.id
          ).slice(0, 8)
        : [];

    const matchedModules =
      category === 'all' && q
        ? MODULE_ITEMS.filter((m) => m.label.toLowerCase().includes(q))
        : [];

    return {
      hasQuery: q.length > 0,
      classes: matchedClasses,
      courses: matchedCourses,
      grades: matchedGrades,
      teachers: matchedTeachers,
      modules: matchedModules,
      total:
        matchedClasses.length +
        matchedCourses.length +
        matchedGrades.length +
        matchedTeachers.length +
        matchedModules.length,
    };
  }, [query, category, effectiveClasses, courses, grades, staff]);

  const categories: { id: SearchCategory; label: string }[] = [
    { id: 'all', label: 'Wszystko' },
    { id: 'classes', label: 'Zajęcia' },
    { id: 'courses', label: 'Przedmioty' },
    { id: 'grades', label: 'Oceny' },
    { id: 'teachers', label: 'Kadra' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
        {/* Top Search Input Bar */}
        <View style={[styles.header, { borderBottomColor: theme.separator }]}>
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}>
            <Ionicons name="search" size={17} color={theme.accent} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Szukaj zajęć, sal, ocen, wykładowców..."
              placeholderTextColor={theme.textMuted}
              autoFocus
              returnKeyType="search"
              style={[styles.input, { color: theme.text }]}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={theme.textMuted} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Text style={[styles.cancelText, { color: theme.accent }]}>Anuluj</Text>
          </Pressable>
        </View>

        {/* Category Filter Strip */}
        <View style={[styles.chipsContainer, { borderBottomColor: theme.separator }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}>
            {categories.map((cat) => {
              const active = category === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Haptics.selectionAsync().catch(() => {});
                    }
                    setCategory(cat.id);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? theme.primary : 'transparent',
                      borderColor: active ? theme.primary : theme.separator,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? theme.primaryContrast : theme.textSecondary },
                    ]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Results */}
        <ScrollView
          contentContainerStyle={styles.resultsScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {results.total === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={28} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Brak wyników</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                {results.hasQuery
                  ? `Nie znaleziono wpisów pasujących do „${query}”.`
                  : 'Wpisz nazwę przedmiotu, sali lub nazwisko wykładowcy.'}
              </Text>
            </View>
          ) : (
            <>
              {results.modules.length > 0 && (
                <>
                  <SectionHeader title="Moduły USOS" />
                  {results.modules.map((m, idx) => (
                    <ListRow
                      key={m.slug}
                      dense
                      title={m.label}
                      left={<Ionicons name={m.icon} size={18} color={theme.accent} />}
                      showChevron
                      showDivider={idx < results.modules.length - 1}
                      onPress={() => navigateAndClose(`/modal/module/${m.slug}`)}
                    />
                  ))}
                </>
              )}

              {results.classes.length > 0 && (
                <>
                  <SectionHeader title={`Zajęcia (${results.classes.length})`} />
                  {results.classes.map((act, idx) => (
                    <ListRow
                      key={`cl-${act.id}`}
                      dense
                      title={act.course_name.pl}
                      subtitle={`${act.class_type.pl} · s. ${act.room_number || '—'} · ${act.lecturer_name}`}
                      left={
                        <Text style={[styles.timeTag, { color: theme.accent }]}>
                          {act.start_time}
                        </Text>
                      }
                      showChevron
                      showDivider={idx < results.classes.length - 1}
                      onPress={() => navigateAndClose(`/modal/course/${act.course_id}`)}
                    />
                  ))}
                </>
              )}

              {results.courses.length > 0 && (
                <>
                  <SectionHeader title={`Przedmioty (${results.courses.length})`} />
                  {results.courses.map((c, idx) => (
                    <ListRow
                      key={`co-${c.course_id}-${c.term_id}`}
                      dense
                      title={c.course_name.pl}
                      subtitle={`${c.coordinator}${c.ects > 0 ? ` · ${c.ects} ECTS` : ''}`}
                      rightText={c.final_grade || c.term_id}
                      showChevron
                      showDivider={idx < results.courses.length - 1}
                      onPress={() => navigateAndClose(`/modal/course/${c.course_id}`)}
                    />
                  ))}
                </>
              )}

              {results.grades.length > 0 && (
                <>
                  <SectionHeader title={`Oceny (${results.grades.length})`} />
                  {results.grades.map((g, idx) => (
                    <ListRow
                      key={`gr-${g.id}`}
                      dense
                      title={g.course_name.pl}
                      subtitle={`${g.author_name} · ${g.term_id}`}
                      left={<GradeBadge symbol={g.value_symbol} size="xs" />}
                      showChevron
                      showDivider={idx < results.grades.length - 1}
                      onPress={() => navigateAndClose(`/modal/course/${g.course_id}`)}
                    />
                  ))}
                </>
              )}

              {results.teachers.length > 0 && (
                <>
                  <SectionHeader title={`Kadra (${results.teachers.length})`} />
                  {results.teachers.map((t, idx) => (
                    <ListRow
                      key={`st-${t.id}`}
                      dense
                      title={`${t.titles ? `${t.titles} ` : ''}${t.name}`}
                      subtitle={
                        t.email && t.email.includes('@')
                          ? t.email
                          : t.room
                          ? `Pokój ${t.room}${t.building ? ` · ${t.building}` : ''}`
                          : t.faculty
                      }
                      left={<Avatar name={t.name} uri={t.photo_url} size={32} />}
                      showChevron
                      showDivider={idx < results.teachers.length - 1}
                      onPress={() => navigateAndClose('/modal/module/staff')}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 11,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
  },
  cancelText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  chipsContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 7,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  timeTag: {
    fontFamily: MONO_FONT,
    fontSize: 11.5,
    fontWeight: '800',
    width: 44,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 54,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
