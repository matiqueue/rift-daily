# Rift Daily — Google Play & App Store Submission Pack

## 1. Dane podstawowe (wspólne)
- **Nazwa aplikacji:** `Rift Daily`
- **Package Name / Bundle ID:** `pl.matique.riftdaily`
- **Kategoria:** Edukacja (`Education`) / Produktywność
- **Kontakt dewelopera:** `szymon.goral@icloud.com`, tel. App Review: `+48730494815`
- **Privacy Policy URL:** `https://rift-daily.vercel.app/privacy`
- **Terms of Service URL:** `https://rift-daily.vercel.app/terms`
- **Support URL:** `https://rift-daily.vercel.app/support`
- **Website / Marketing URL:** `https://rift-daily.vercel.app`

## 2. Opisy sklepowe

### Polski (PL)
- **Krótki opis (max 80 znaków / Google Play) / Podtytuł (max 30 znaków / App Store):**
  - App Store Subtitle (27 zn.): `Nowoczesny e-Dziennik USOS`
  - Google Play Short Description (78 zn.): `Szybki plan zajęć, oceny, ECTS i mLegitymacja z USOS w czystym interfejsie.`
- **Pełny opis:**
  Rift Daily to szybki, minimalistyczny codzienny dziennik studencki dla polskich uczelni korzystających z systemu USOS API (m.in. UKEN, UJ, UEK, AGH, PW, UAM, UMK, AWF, UPJP2 i ponad 50 innych).

  • Ekran „Dziś” z podglądem trwających i najbliższych zajęć, numerem sali oraz osią czasu dnia.
  • Plan zajęć z płynną karuzelą dat i podglądem całego tygodnia.
  • Dziennik ocen z wyliczaniem średniej ważonej ECTS, filtrami ocen i symulatorem What-If.
  • mLegitymacja, egzaminy, płatności z numerem IBAN, ankiety i wyszukiwarka kadry.
  • Automatyczne odświeżanie w tle i lokalne powiadomienia o zmianach planu i nowych ocenach.
  • Bezpieczne logowanie OAuth 1.0a bezpośrednio na stronie uczelni, blokada Face ID / PIN, zero reklam i zero zewnętrznych baz danych studentów.

### English (EN-US)
- **App Store Subtitle (27 zn.):** `Modern Polish USOS Companion`
- **Google Play Short Description (76 zn.):** `Fast USOS timetable, weighted GPA, exams & student pass in a clean journal.`
- **Full Description:**
  Rift Daily is a fast, minimal daily student journal for Polish universities running USOS API (including UKEN, UJ, UEK, AGH, PW, UAM, UMK, and 50+ institutions).

  • Today agenda with live class spotlight, room telemetry, and daily timeline.
  • Schedule view with smooth date-wheel carousel and weekly overview.
  • Academic journal with ECTS-weighted GPA, interactive grade filters, and What-If GPA simulator.
  • Student ID pass, exam dates, tuition payments, surveys, and faculty directory.
  • Background refresh with local alerts for grade updates and schedule changes.
  • Secure OAuth 1.0a login directly on your university portal, Face ID / PIN lock, zero ads, and zero external student databases.

## 3. Google Play — Data Safety & IARC (Instrukcja 1:1)
- **Does your app collect or share any of the required user data types?** → **No** (wszystkie dane akademickie trafiają wyłącznie między serwerem USOS uczelni a urządzeniem użytkownika przez bezstanowe szyfrowane proxy; brak bazy danych, brak reklam, brak udostępniania podmiotom trzecim).
- **Is all of the user data collected by your app encrypted in transit?** → **Yes** (HTTPS / TLS 1.3 + AES-256-GCM session token).
- **Do you provide a way for users to request that their data is deleted?** → **Yes** (`Więcej → Ustawienia → Usuń wszystkie dane z urządzenia` + instrukcja na `https://rift-daily.vercel.app/privacy`).
- **IARC Content Rating:** brak przemocy, brak treści dla dorosłych, brak hazardu, brak reklam, brak płatności w aplikacji, brak czatu/UGC → **PEGI 3 / Everyone**.
- **Target Audience:** 16+ / 18+ (studenci uczelni wyższych).
- **App Access:** Zaznacz „All or some functionality is restricted” i wskaż, że aplikacja wymaga konta studenta polskiej uczelni obsługującej USOS API (logowanie OAuth 1.0a).

## 4. App Store Connect — Instrukcja 1:1 (kroki w przeglądarce)
1. Wejdź w **App Store Connect → Apps → „+” → New App**:
   - Platforms: **iOS**
   - Name: `Rift Daily`
   - Primary Language: **Polish**
   - Bundle ID: `pl.matique.riftdaily`
   - SKU: `rift-daily-ios`
   - User Access: Full Access
2. Po utworzeniu rekordu uruchom w terminalu:
   ```bash
   node scripts/asc-configure.mjs configure
   ./scripts/release-ios-appstore.sh
   ```
3. W zakładce **App Privacy** kliknij **Get Started** → **No, we do not collect data from this app** → **Publish**.
4. W **App Compliance** → Regulated Medical Device → **No**.
5. Podepnij zwalidowany build i kliknij **Add for Review**.
