# Changelog

Wszystkie istotne zmiany w aplikacji mobilnej **Rift Daily**, centralnym backendzie BFF oraz portalu WWW.
Format zgodny z [Keep a Changelog](https://keepachangelog.com/pl/1.1.0/) oraz [Semantic Versioning](https://semver.org/).

## [v1.2.0] - 2026-11-22

### Bezpieczeństwo i Architektura
- **Zero-Secret Mobile Client + Centralny Backend BFF (Vercel Functions)**: wszystkie klucze OAuth 1.0a (`USOS_KEY_*`, `USOS_SECRET_*`) oraz klucz szyfrujący `SESSION_ENCRYPTION_KEY` przeniesione wyłącznie na serwer Vercel (`--sensitive`); z paczki mobilnej usunięto wszystkie zmienne `EXPO_PUBLIC_USOS_*`.
- **Szyfrowane sesje AES-256-GCM (`rd_v1`)**: bezstanowe tokeny sesji przechowywane wyłącznie w sprzętowym pęku kluczy (`src/utils/secureStorage.ts`, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`).
- **Utwardzenie API**: ochrona SSRF, ścisła 19-metodowa allowlista read-only USOS API, ścisła allowlista `callbackUrl` (ochrona przed Open Redirect), wymuszanie `scopes` po stronie serwera, blokada wstrzykiwania `oauth_*`, rate limiting per-IP (`HTTP 429`), limit rozmiaru body 16 KB i zamknięty CORS.
- **Zgodność ze sklepami**: ukrycie zewnętrznych linków dotacyjnych na iOS (Apple 3.1.1), przycisk trwałego usunięcia wszystkich danych z urządzenia (Apple 5.1.1(v) + Google Play Data Safety), dwujęzyczne (PL/EN) podstrony `/privacy`, `/terms`, `/support` na `https://rift-daily.vercel.app`.

### Funkcje i UI/UX
- **Nowy 4-zakładkowy interfejs**: `Dziś` (sticky nagłówek, Flighty Live Hero), `Plan` (pozioma karuzela dat `DateWheelCarousel` z haptyką + solo przycisk `DZIŚ`), `Dziennik` (otwarty hero średniej ważonej, filtry rozkładu ocen, symulator GPA) i `Więcej` (otwarty profil studenta + macierz 2×2 hairline).
- **Nowy smukły czarny szklany navbar** (`FloatingGlassTabBar`).
- **Aktualizowanie danych w tle**: `expo-background-task` + `expo-task-manager` oraz auto-refresh przy powrocie z tła (`AppState`).
- **Dodano AGH (`apps.usos.agh.edu.pl`)** do katalogu uczelni i rejestru backendu.

### Narzędzia, Testy i CI/CD
- Podniesienie całego stacku do **Expo SDK 58**, React 19.3, React Native 0.88.1, Reanimated 4.7.1, Vite 8.3.8, Tailwind CSS v4.
- Testy jednostkowe **Vitest** (`vitest.config.mjs`, `src/__tests__/`).
- Automatyzacja SemVer (`scripts/bump-version.mjs`), iOS App Store (`scripts/release-ios-appstore.sh`, `scripts/asc-configure.mjs`), Android CNG signing (`plugins/withAndroidReleaseSigning.js`) oraz podpisane wydania `.aab` + `.apk` w GitHub Actions.
- Centralna dokumentacja (`docs/PROJECT_MEMORY.md`, `docs/ARCHITECTURE.md`, `docs/RELEASE_AND_STORES.md`) i jeden hub agentów AI (`AGENTS.md`).

## [v1.1.0] - 2026-11-13

### Naprawiono
- **Poprawne rozpoznawanie daty najbliższych zajęć**: [`getNextClassHighlight`](src/utils/timetableUtils.ts) dopasowuje i sortuje zajęcia po rzeczywistej dacie kalendarzowej (`YYYY-MM-DD`) i godzinie zakończenia zamiast samego dnia tygodnia (`day_of_week`).
- **Paginacja USOS API (3 tygodnie w przód)**: [`syncFromLiveApi`](src/store/useUsosStore.ts) pobiera równolegle trzy 7-dniowe bloki (`days=7`).

### Dodano
- Pełna konfiguracja repozytorium GitHub, workflow CI (`ci.yml`), Dependabot, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`.

## [v1.0.0] - 2026-11-13

### Dodano
- Pierwsze publiczne wydanie **Rift Daily** (iOS & Android) z obsługą OAuth 1.0a dla polskich uczelni USOS.
