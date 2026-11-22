# Rift Daily — Central Project Memory

> **Żywy dokument źródłowy projektu.** Każdy agent AI i deweloper aktualizuje ten plik przy zmianie architektury, bezpieczeństwa, identyfikatorów, wydań lub długu technologicznego.

## 1. Wizja i filozofia produktu
**Rift Daily** to szybki, minimalistyczny, monochromatyczny (Titanium / Obsidian / Paper) codzienny dziennik studencki dla polskich uczelni korzystających z **USOS API**.
- **Nienaruszalne zasady UX:**
  - Zero „card fatigue” — otwarta typografia, cienkie linie podziału (`StyleSheet.hairlineWidth`), `MONO_FONT` dla godzin, ocen i ECTS.
  - Maksymalnie 4 zakładki w dolnym pasku (`Dziś`, `Plan`, `Dziennik`, `Więcej`) na kompaktowym czarnym szklanym docku (`FloatingGlassTabBar`).
  - Pełne wsparcie `darkTheme` i `lightTheme` (`useAppTheme()`).
  - Brak reklam, brak trackerów, zero zewnętrznych baz danych studentów.

## 2. Identyfikatory produkcyjne i sklepowe
| Zasób | Wartość |
|---|---|
| iOS Bundle ID | `pl.matique.riftdaily` (App Store Connect ID: `6837895381`, SKU: `rift-daily-ios`) |
| Android Package Name | `pl.matique.riftdaily` |
| URL Scheme (OAuth) | `riftdaily://oauth-callback` |
| Apple Developer Team | `3X24W8AX3N` (`Szymon Góral`, `szymon.goral@icloud.com`) |
| App Store Connect API Key | Key ID `WT2G4S7Z3U`, Issuer `410b5a97-08bd-4989-85d9-c2e3e27954da` (`.p8` w `~/Documents/Text Vaults/IronRoutine-Keys/`) |
| Google Play Console | `matiqueue@gmail.com` |
| Android Upload Keystore | `~/Documents/Text Vaults/RiftDaily-Keys/riftdaily-upload.p12` (RSA 4096, PKCS#12, 10 000 dni) |
| Backend BFF & Website (Vercel) | `https://rift-daily.vercel.app` (projekt `monorise-projects/rift-daily`) |
| Podstrony prawne (HTTP 200) | `/privacy`, `/terms`, `/support` |
| Repozytorium GitHub | `https://github.com/matiqueue/rift-daily` (gałęzie: `main`, `dev`) |

## 3. Inwentarz funkcji
- **Dziś (`src/app/(tabs)/index.tsx`)**: sticky nagłówek powitalny, Flighty-style Live Hero (trwające / najbliższe zajęcia), 3-kolumnowa telemetria (`GODZINA | SALA | FORMA`), alert raty, pigułki szybkich akcji, oś czasu dnia z okienkami, 3-kolumnowe metryki i feed ostatnich ocen/egzaminów.
- **Plan (`src/app/(tabs)/timetable.tsx`)**: pozioma karuzela dat w stylu iPhone Timer (`DateWheelCarousel`, 50 dni, haptyczne detenty), solo przycisk `DZIŚ`, przełącznik `Dzień / Tydzień`, obsługa gestów swipe i cache wielotygodniowy.
- **Dziennik (`src/app/(tabs)/grades.tsx`)**: otwarty hero średniej ważonej ECTS, 3 widoki (`Przedmioty`, `Oceny` z interaktywnym filtrem rozkładu, `Symulator` What-If z presetami).
- **Więcej (`src/app/(tabs)/more.tsx` + `SettingsSection.tsx`)**: otwarty profil studenta z `ELS`, macierz 2×2 hairline (`Płatności`, `Egzaminy`, `Kadra`, `Ankiety`), moduły dodatkowe (`Budynki`, `Rejestracje`, `Dyplom APD`), ustawienia motywu, powiadomień, PIN/Face ID, diagnostyka BFF, wylogowanie i trwałe usunięcie danych z urządzenia.
- **Background Sync (`src/services/backgroundSync.ts`)**: natywny `expo-background-task` (co min. 15 min) + auto-refresh przy powrocie z tła (`AppState`, próg 5 min) + lokalne powiadomienia o zmianach.

## 4. Niezmienniki bezpieczeństwa (NIE WOLNO ŁAMAĆ)
1. **Zero-Secret Mobile Client**: ŻADNE `USOS_KEY_*` ani `USOS_SECRET_*` nie mogą trafiać do `EXPO_PUBLIC_*` ani kodu klienta. Wszystkie klucze OAuth 1.0a oraz `SESSION_ENCRYPTION_KEY` żyją wyłącznie w zaszyfrowanych Vercel Environment Variables (`--sensitive`).
2. **Szyfrowane sesje AES-256-GCM**: Mobilka przechowuje w sprzętowym Keychain / Android Keystore (`src/utils/secureStorage.ts`, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`) wyłącznie nieprzezroczysty token `rd_v1.<iv>.<tag>.<ciphertext>` (TTL 180 dni dla sesji, 15 min dla `request_token`).
3. **Ochrona BFF**: Ścisła allowlista hostów USOS (anti-SSRF), ścisła allowlista 19 read-only metod `services/*`, ścisła allowlista `callbackUrl` (`riftdaily://oauth-callback` / `oob`), wymuszanie `scopes` po stronie serwera, blokada wstrzykiwania parametrów `oauth_*`, limit body 16 KB, rate limiting per-IP (`429`) i zamknięty CORS.
4. **Zgodność ze sklepami**: Brak linków dotacyjnych (`Buy me a coffee`) na iOS (Apple 3.1.1); obecny przycisk trwałego usunięcia wszystkich danych z urządzenia (Apple 5.1.1(v)); `ITSAppUsesNonExemptEncryption: false`; wypełnione `PrivacyInfo.xcprivacy`.
5. **Podpisywanie iOS**: Zawsze budować i podpisywać lokalnym certyfikatem `Apple Distribution: Szymon Góral (3X24W8AX3N)` (NFC) ze względu na błąd normalizacji Unicode `ó` w chmurowym podpisywaniu Apple (`ITMS-90035`).

## 5. Dziennik Decyzji Architektonicznych (ADR)
- **ADR-001 (2026-11-21)**: Konsolidacja nawigacji z 6 do 4 zakładek (`Dziś`, `Plan`, `Dziennik`, `Więcej`) i eliminacja `GlassCard` wall na rzecz otwartej typografii + hairlines.
- **ADR-002 (2026-11-22)**: Wprowadzenie centralnego bezstanowego backendu BFF na Vercel (`website/api/usos/*`) z szyfrowaniem sesji AES-256-GCM — eliminacja wycieku `EXPO_PUBLIC_USOS_*` z paczek mobilnych.
- **ADR-003 (2026-11-22)**: Dodanie natywnego `expo-background-task` + `AppState` auto-refresh i ujednolicenie liczenia tygodni ISO (poniedziałek) w całym store i kalendarzu.
- **ADR-004 (2026-11-22)**: Android CNG (`plugins/withAndroidReleaseSigning.js`) + produkcyjny Upload Keystore w `~/Documents/Text Vaults/RiftDaily-Keys/` i GitHub Secrets.

## 6. Dług technologiczny / Monolity do rozbicia (kolejne iteracje)
- `src/api/usosClient.ts` (~1500 linii) — rozbić na domenowe adaptery (`userApi.ts`, `timetableApi.ts`, `gradesApi.ts`, `financeApi.ts`).
- `src/store/useUsosStore.ts` (~1180 linii) — podzielić na slice'y Zustand (`authSlice`, `academicSlice`, `settingsSlice`).
- `src/app/(tabs)/grades.tsx` (~900 linii) — wydzielić podkomponenty `CoursesTab`, `GradesTab`, `GpaSimulatorTab` do `src/components/journal/`.
- **AGH (`apps.usos.agh.edu.pl`)**: rejestr i aplikacja są gotowe; wymagane jest pozyskanie pary `USOS_KEY_AGH` / `USOS_SECRET_AGH` z CRI AGH (portal `/developers/` zwraca 403 z zewnątrz) i dodanie ich do Vercel Env Vars.

## 7. Obowiązkowa tabela aktualizacji dokumentacji
| Zmiana w kodzie | Pliki do obowiązkowej aktualizacji |
|---|---|
| Nowy endpoint API / zmiana bezpieczeństwa | `docs/PROJECT_MEMORY.md`, `docs/ARCHITECTURE.md`, `src/__tests__/bffSecurity.test.ts` |
| Nowy klucz w `SecureStore` / nowa zakładka / ekran | `docs/ARCHITECTURE.md`, `docs/PROJECT_MEMORY.md` |
| Podbicie wersji / wydanie sklepowe | `CHANGELOG.md` + `npm run version:patch\|minor\|major` |
| Zmiana procesu budowania / CI / sklepów | `docs/RELEASE_AND_STORES.md` |
