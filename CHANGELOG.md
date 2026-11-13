# Changelog

Wszystkie istotne zmiany w aplikacji mobilnej **Rift Daily** oraz portalu WWW.

## [v1.1.0] - 2026-11-13

### Naprawiono
- **Poprawne rozpoznawanie daty najbliższych zajęć**: [`getNextClassHighlight`](src/utils/timetableUtils.ts) dopasowuje i sortuje zajęcia po rzeczywistej dacie kalendarzowej (`YYYY-MM-DD`) i godzinie zakończenia zamiast samego dnia tygodnia (`day_of_week`). Zajęcia z przyszłego tygodnia nie wyświetlają się już jako dzisiejsze.
- **Paginacja USOS API (3 tygodnie w przód)**: [`syncFromLiveApi`](src/store/useUsosStore.ts) pobiera teraz równolegle trzy 7-dniowe bloki (`days=7`, zgodnie z limitem `services/tt/user`), zasilając oddzielne pole `upcomingTimetable` oraz automatycznie fokusując Plan zajęć na najbliższy tydzień z zajęciami.
- **Nagłówek Planu zajęć**: naprawiono układ paska przełączania tygodni w [`timetable.tsx`](src/app/(tabs)/timetable.tsx), dzięki czemu przycisk następnego tygodnia (`>`) nie wychodzi poza ekran i widoczny jest zakres dat tygodnia.

### Dodano
- Pełna konfiguracja repozytorium GitHub: szablony zgłoszeń (Bug, Feature, Nowa uczelnia), szablon Pull Requesta, workflow CI (`ci.yml`), Dependabot, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, etykiety, kamienie milowe oraz GitHub Discussions.

## [v1.0.0] - 2026-11-13

### Dodano
- Pierwsze publiczne wydanie **Rift Daily** (iOS & Android) z obsługą OAuth 1.0a dla polskich uczelni USOS.
- Ekran główny (Dashboard) z kartą najbliższych zajęć, średnią ocen, punktami ECTS i globalną wyszukiwarką z kategoriami.
- Plan zajęć, oceny z kalkulatorem średniej, kadra akademicka z kontaktami oraz ustawienia z motywem jasnym/ciemnym i blokadą Face ID / PIN.
- Automatyczny build APK w GitHub Actions (`android-release.yml`) oraz portal pobierania WWW (`website/`).
