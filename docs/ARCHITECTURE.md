# Rift Daily — Architecture Reference

## 1. Mapa katalogów
```text
rift-daily/
├── src/
│   ├── app/                      # Expo Router (wyłącznie ekrany i layouty)
│   │   ├── _layout.tsx           # Root Stack, Splash, SecurityGate, AppState + Background Sync
│   │   ├── login.tsx             # Wybór uczelni + OAuth 1.0a (ASWebAuthenticationSession)
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx       # 4-tab layout z FloatingGlassTabBar
│   │   │   ├── index.tsx         # Dziś (sticky header + Live Hero + agenda)
│   │   │   ├── timetable.tsx     # Plan (DateWheelCarousel + Dzień/Tydzień)
│   │   │   ├── grades.tsx        # Dziennik (Przedmioty / Oceny / Symulator GPA)
│   │   │   └── more.tsx          # Więcej (Student Hero + hairline matrix + Ustawienia)
│   │   └── modal/
│   │       ├── api-config.tsx    # Diagnostyka BFF + PIN OOB + opcjonalny BYOK
│   │       ├── course/[id].tsx   # Szczegóły przedmiotu
│   │       └── module/[slug].tsx # Moduły USOS (mLegitymacja, Płatności, Egzaminy, Kadra...)
│   ├── api/                      # Klient USOS, konfiguracja BFF, katalog uczelni, OAuth 1.0a
│   ├── components/               # Komponenty UI (FloatingGlassTabBar, DateWheelCarousel, SettingsSection...)
│   ├── hooks/                    # useAppTheme
│   ├── services/                 # notifications.ts, backgroundSync.ts
│   ├── store/                    # useUsosStore.ts (Zustand)
│   ├── theme/                    # theme.ts (monochromatyczny darkTheme / lightTheme)
│   ├── utils/                    # secureStorage.ts, timetableUtils.ts
│   └── __tests__/                # Testy jednostkowe Vitest
├── plugins/                      # Expo Config Plugins (withAndroidReleaseSigning.js)
├── scripts/                      # bump-version.mjs, asc-configure.mjs, release-ios-appstore.sh
├── website/                      # Portal WWW (Vite + React + Tailwind v4) + Backend BFF (Vercel Functions)
│   ├── api/
│   │   ├── _lib/                 # crypto.ts (AES-256-GCM), oauth1.ts, registry.ts, http.ts
│   │   └── usos/                 # health.ts, call.ts, oauth/request-token.ts, oauth/access-token.ts
│   └── src/                      # Landing page + podstrony /privacy, /terms, /support
├── ios/                          # Natywny projekt Xcode (lokalny build iOS)
└── docs/                         # PROJECT_MEMORY.md, ARCHITECTURE.md, RELEASE_AND_STORES.md
```

## 2. Architektura nawigacji
- **Expo Router** (`src/app/`):
  - Root `Stack`: `(tabs)`, `login` (`fullScreenModal`), `modal/course/[id]`, `modal/module/[slug]`, `modal/api-config` (`formSheet`).
  - Zakładki `(tabs)` (4 filary): `index` (`Dziś`), `timetable` (`Plan`), `grades` (`Dziennik`), `more` (`Więcej`) renderowane przez niestandardowy `FloatingGlassTabBar` (`src/components/FloatingGlassTabBar.tsx`).

## 3. Katalog kluczy `expo-secure-store` (`src/utils/secureStorage.ts`)
Wszystkie klucze używają opcji `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (czytelne w zadaniach w tle iOS, chronione sprzętowym Keychain/Keystore, niekopiowane do iCloud):
- `indeks_plus_inst_id_v1` — ID wybranej uczelni (np. `uken`, `agh`, `uj`).
- `rift_daily_session_token_v2` — zaszyfrowany AES-256-GCM token sesji BFF (`rd_v1...`).
- `rift_daily_bff_migrated_v2` — flaga jednorazowej migracji ze starszych lokalnych tokenów.
- `indeks_plus_theme_mode_v1` — wybrany motyw (`dark` | `light` | `system`).
- `rift_daily_sec_configured_v1`, `rift_daily_sec_enabled_v1`, `rift_daily_sec_pin_v1`, `rift_daily_sec_bio_v1` — ustawienia blokady PIN / Face ID.
- `rift_daily_notif_prefs_v1`, `rift_daily_notif_history_v1` — preferencje i historia alertów lokalnych.
- `indeks_plus_consumer_key_v1`, `indeks_plus_consumer_secret_v1`, `indeks_plus_access_token_v1`, `indeks_plus_access_secret_v1` — puste w trybie domyślnym; używane wyłącznie przy ręcznym trybie BYOK.

## 4. Centralny Backend BFF (`https://rift-daily.vercel.app/api/usos/*`)
Bezstanowe Vercel Functions (Node.js na Fluid Compute, brak bazy danych):
- `GET /api/usos/health` — status szyfrowania i lista ID uczelni skonfigurowanych w Vercel Env Vars.
- `POST /api/usos/oauth/request-token` — waliduje uczelnię (anti-SSRF) i `callbackUrl` (allowlista), pobiera `request_token` z USOS serwerowymi kluczami i zwraca `authorizeUrl` + zaszyfrowany `requestTokenSession` (TTL 15 min).
- `POST /api/usos/oauth/access-token` — odszyfrowuje `requestTokenSession`, wymienia `oauth_verifier` na `access_token` w USOS i zwraca zaszyfrowany `sessionToken` (TTL 180 dni).
- `POST /api/usos/call` — wymaga `Authorization: Bearer <sessionToken>`, sprawdza metodę względem ścisłej 19-elementowej allowlisty read-only, blokuje wstrzykiwanie `oauth_*`, podpisuje zapytanie serwerowym `USOS_SECRET_*` i zwraca `{ data }`.

## 5. Wydajność i bateria
- Zegar na ekranach `Dziś` i `Plan` tyka co `60_000 ms` (nie co sekundę).
- Odświeżanie w tle (`expo-background-task`) ma `minimumInterval: 15` minut, a auto-refresh przy powrocie z tła (`AppState`) uruchamia się wyłącznie gdy dane mają ≥ 5 minut.
- Wielotygodniowy plan zajęć jest mergowany w pamięci (`upcomingTimetable`), aby minimalizować liczbę zapytań przy przewijaniu karuzeli dat.
