<div align="center">

<img src="./docs/assets/rift-daily-hero.svg" alt="Rift Daily Hero Banner" width="100%" />

<br />

### Nowoczesny, superszybki mobilny **e-Dziennik Studencki USOS** na iOS i Androida

[![License: Non-Commercial Free](https://img.shields.io/badge/License-Non--Commercial_100%25_Free-10B981.svg?style=for-the-badge)](./LICENSE)
[![GitHub Releases](https://img.shields.io/badge/Pobierz_APK-GitHub_Releases-10B981.svg?style=for-the-badge&logo=android)](https://github.com/matiqueue/rift-daily/releases/latest/download/RiftDaily.apk)
[![Strona WWW](https://img.shields.io/badge/Strona_WWW-Vercel-06B6D4.svg?style=for-the-badge&logo=vercel)](https://riftdaily.vercel.app)
[![Expo SDK 58](https://img.shields.io/badge/Expo_SDK-58.0-818CF8.svg?style=for-the-badge&logo=expo)](https://docs.expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.88-38BDF8.svg?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![CI / CD](https://img.shields.io/badge/GitHub_Actions-Android_APK_Build-22C55E.svg?style=for-the-badge&logo=githubactions)](#-automatyczne-budowanie-apk-w-github-actions-cicd)

<p align="center">
  <b>Rift Daily</b> to zaprojektowany od podstaw kliencki e-dziennik akademicki w estetyce <b>Linear / Vercel Bento UI</b>, łączący się bezpośrednio z oficjalnym serwerem <b>USOS API (OAuth 1.0a)</b> polskich uczelni wyższych (m.in. <b>UKEN Kraków, UJ, AGH, PK, UEK, UW, PW, UAM, PWr, UWr, UMK, UŚ, PG, PŁ, KUL, SGH</b> i ponad 80 innych).
</p>

<p align="center">
  🌐 <b><a href="https://riftdaily.vercel.app">Oficjalna strona projektu: riftdaily.vercel.app</a></b> &nbsp;•&nbsp;
  🚀 <b><a href="https://github.com/matiqueue/rift-daily/releases/latest/download/RiftDaily.apk">Pobierz RiftDaily.apk na Androida</a></b>
</p>

[**⭐ Jeśli aplikacja Ci się podoba, to zostaw gwiazdkę (Star) na GitHubie!**](https://github.com/matiqueue/rift-daily/stargazers)

</div>

---

## 📱 Prawdziwe zrzuty ekranu z aplikacji (Real App Screenshots)

<div align="center">
<table>
  <tr>
    <td align="center" width="33%">
      <b>🌙 Dziennik (Motyw Ciemny)</b><br />
      <sub>Najbliższe zajęcia + Bento Grid</sub><br /><br />
      <img src="./docs/assets/screen-dashboard-dark.png" alt="Rift Daily Dashboard Dark Mode" width="260" />
    </td>
    <td align="center" width="33%">
      <b>☀️ Dziennik (Motyw Jasny)</b><br />
      <sub>Clean Daylight Paper UI</sub><br /><br />
      <img src="./docs/assets/screen-dashboard-light.png" alt="Rift Daily Dashboard Light Mode" width="260" />
    </td>
    <td align="center" width="33%">
      <b>🗓️ Plan Zajęć USOS</b><br />
      <sub>Najbliższe zajęcia i sale</sub><br /><br />
      <img src="./docs/assets/screen-timetable-dark.png" alt="Rift Daily Timetable Dark Mode" width="260" />
    </td>
  </tr>
</table>

<br />

<table>
  <tr>
    <td align="center" width="50%">
      <b>🔔 Ustawienia i Powiadomienia USOS</b><br />
      <sub>Wybór alertów o zmianach godzin, ocenach, zadaniach i ratach</sub><br /><br />
      <img src="./docs/assets/screen-settings-dark.png" alt="Rift Daily Settings and Notifications" width="260" />
    </td>
    <td align="center" width="50%">
      <b>🏛️ Wybór Uczelni (86 uczelni USOS)</b><br />
      <sub>UKEN Kraków jako Top 1 + logowanie OAuth 1.0a</sub><br /><br />
      <img src="./docs/assets/screen-login-dark.png" alt="Rift Daily University Selector" width="260" />
    </td>
  </tr>
</table>
</div>

---

## 🚀 Najważniejsze funkcje

| Moduł | Opis możliwości | Endpointy USOS API / Natywne |
| :--- | :--- | :--- |
| **⏱️ Karta „Najbliższe Zajęcia” na żywo** | Natychmiastowy podgląd aktualnie trwających lub najbliższych zajęć na samej górze ekranu głównego i planu zajęć (odliczanie czasu, numer sali, budynek, prowadzący oraz kolejne zajęcia po nich). | `services/tt/user` + `timetableUtils.ts` |
| **🔔 Powiadomienia o zmianach planu, ocenach i zadaniach** | Alerty o zmianie godzin lekcji lub sal, przypomnienia przed zajęciami (`15/30/60 min`), nowe oceny w protokołach, punkty z zadań/kolokwiów (`crstests`) oraz terminy rat (obsługa iOS & kanałów powiadomień Android `POST_NOTIFICATIONS`). | `expo-notifications` + silnik detekcji zmian |
| **⚙️ Dedykowana zakładka Ustawienia** | Pełna kontrola preferencji powiadomień (osobne przełączniki na co mają przychodzić alerty), tester powiadomień na żywo, historia zmian, motyw i blokada PIN/Biometria. | `src/app/(tabs)/settings.tsx` |
| **🔍 Globalna wyszukiwarka na górze ekranu** | Błyskawiczne przeszukiwanie przedmiotów, prowadzących, sal, ocen i modułów prosto z paska nad kartą studenta. | Lokalny indeks + `services/users/search2` |
| **🔐 Domyślna blokada Face ID / Biometria + PIN** | Konfiguracja 4-cyfrowego kodu PIN oraz biometrii (Face ID / Touch ID na iOS, czytnik linii papilarnych / rozpoznawanie twarzy na Androidzie). | `expo-local-authentication` + `expo-secure-store` |
| **📊 Asymetryczny Bento Dashboard** | Szybki podgląd średniej ważonej (`GPA`), punktów `ECTS`, liczby kursów, najbliższej raty do opłacenia oraz aktualnego planu. | `services/grades/*` + `services/courses/*` |
| **🎓 Oceny, Rozkład i Symulator ECTS** | Wielowarstwowe pobieranie ocen z protokołów (`terms2`, `latest`, `course_editions`), wykres rozkładu ocen i symulator „What-If”. | `services/grades/terms2` + `services/grades/latest` |
| **👨‍🏫 Katalog Wykładowców w HD** | Pełne tytuły naukowe (`dr`, `dr hab.`, `prof.`), portrety w wysokiej rozdzielczości (`original`/`400x500`), pokoje, e-maile i godziny konsultacji. | `services/users/users` + `services/users/search2` |
| **💳 Naprawione Raty, IBAN i Przelewy** | Dokładne wyliczanie kwot poszczególnych rat z planów ratalnych (`chosen_installment_plan`), kopiowanie konta IBAN jednym kliknięciem oraz bezpośrednie przejście do płatności USOSweb. | `services/payments/user_payments` + `user_accounts` |
| **🪪 Elektroniczna Legitymacja (ELS)** | Cyfrowa karta studenta ze zdjęciem w wysokiej rozdzielczości, numerem albumu, kodem kreskowym karty bibliotecznej i kodem QR. | `services/cards/user_cards` + `services/users/user` |

---

## 🛠️ Instrukcja instalacji i uruchomienia (iOS & Android)

### Krok 1: Klonowanie i instalacja pakietów

```bash
git clone https://github.com/matiqueue/rift-daily.git
cd rift-daily
npm install
```

---

### 🤖 Uruchomienie i instalacja na **Androidzie**

Aplikacja **Rift Daily** jest w pełni przystosowana pod system **Android** (obsługuje natywne kanały powiadomień `AndroidImportance.MAX`, uprawnienia `POST_NOTIFICATIONS` dla Androida 13+, czytnik linii papilarnych / biometrię `USE_BIOMETRIC`, adaptacyjną ikonę oraz głębokie linkowanie `riftdaily://oauth-callback` dla logowania USOS).

---

#### 🚀 Opcja A (Najprostsza): Pobierz gotowy plik `.apk` z GitHub Releases (Bez instalowania czegokolwiek)

Dzięki wbudowanemu workflow **GitHub Actions**, każde oficjalne wydanie aplikacji jest automatycznie kompilowane w chmurze i udostępniane w postaci gotowego pliku instalacyjnego:

1. **Pobierz plik**: Kliknij bezpośredni link na telefonie z systemem Android:
   👉 **[Pobierz najnowszy RiftDaily.apk (GitHub Releases)](https://github.com/matiqueue/rift-daily/releases/latest/download/RiftDaily.apk)**
2. **Otwórz plik**: Po zakończeniu pobierania kliknij powiadomienie lub znajdź plik w folderze *Pobrane (Downloads)* na telefonie.
3. **Zezwól na instalację**: Jeśli system Android wyświetli monit bezpieczeństwa o instalacji z nieznanego źródła (przeglądarki), kliknij **Ustawienia** i włącz suwak **„Zezwalaj z tego źródła”**.
4. **Zaloguj się**: Uruchom Rift Daily, wybierz swoją uczelnię i zaloguj się oficjalnym kontem USOS.

---

#### Opcja B: Uruchomienie bezpośrednio na telefonie z Androidem przez USB / Wi-Fi (ze źródeł)
1. Na telefonie z Androidem wejdź w **Ustawienia → Informacje o telefonie** i kliknij 7 razy w **Numer kompilacji**, aby odblokować **Opcje programistyczne**.
2. Wejdź w **Ustawienia → System → Opcje programistyczne** i włącz **Debugowanie USB** (lub **Debugowanie bezprzewodowe**).
3. Podłącz telefon kablem USB do komputera i zaakceptuj komunikat *„Zezwól na debugowanie USB”* (sprawdź połączenie komendą `adb devices`).
4. Wygeneruj projekt natywny Androida (jeśli folder `android/` jeszcze nie istnieje) i uruchom kompilację:
   ```bash
   npx expo prebuild --platform android
   npx expo run:android --device
   ```

#### Opcja C: Lokalna kompilacja samodzielnego pliku instalacyjnego `.apk` (Release APK)
Jeśli chcesz wygenerować gotowy plik `.apk` lokalnie na swoim komputerze:

```bash
# 1. Wygeneruj natywny katalog android/ (jednorazowo)
npx expo prebuild --platform android

# 2. Zbuduj zoptymalizowany pakiet Release APK
cd android
./gradlew assembleRelease

# Gotowy plik APK znajdziesz w:
# android/app/build/outputs/apk/release/app-release.apk
```
Następnie możesz zainstalować go na podłączonym telefonie komendą:
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

#### Opcja D: Budowanie `.apk` w chmurze przez EAS Build (bez Android Studio)
Jeśli nie chcesz instalować lokalnie Android Studio ani SDK:
```bash
npx eas-cli@latest build --platform android --profile preview
```

---

## ⚡ Automatyczne budowanie APK w GitHub Actions (CI/CD)

Projekt posiada w pełni zautomatyzowany potok CI/CD zdefiniowany w [`.github/workflows/android-release.yml`](./.github/workflows/android-release.yml):

- **Kiedy się uruchamia?**
  - **Automatycznie**: Przy wypchnięciu nowego taga wersji (np. `git tag v1.0.0 && git push origin v1.0.0`).
  - **Ręcznie na żądanie**: W zakładce **Actions** na GitHubie przyciskiem **„Run workflow”** (workflow_dispatch).
- **Jak działa?**
  1. Uruchamia czystą maszynę wirtualną `ubuntu-latest`.
  2. Konfiguruje środowisko Java 17 i Node.js 20.
  3. Wykonuje `npx expo prebuild --platform android` i kompiluje `./gradlew assembleRelease`.
  4. Tworzy lub aktualizuje nowe **GitHub Release** i dołącza do niego gotowy plik `RiftDaily.apk`.

Dzięki temu użytkownicy mają 100% gwarancji, że instalowany plik APK pochodzi wprost z publicznego, zweryfikowanego kodu źródłowego.

---

## 🌐 Strona internetowa (Landing Page: Vite + Vercel)

W katalogu [`website/`](./website/) znajduje się dedykowana, ultralekka strona internetowa projektu zbudowana przy użyciu **Vite + React 19 + TypeScript + Tailwind CSS**.

Strona zawiera:
- Bezpośredni przycisk pobrania pliku `.apk` na Androida
- Przewodnik instalacji dla systemu iOS i Android
- Prezentację modułów aplikacji w estetyce Linear Bento UI
- Sekcję FAQ i linki do wsparcia

### 🚀 Wdrożenie strony na Vercel:
1. W panelu [Vercel](https://vercel.com) zaimportuj repozytorium `matiqueue/rift-daily`.
2. Ustaw **Root Directory** na `website`.
3. Vercel automatycznie wykryje konfigurację Vite i wdroży stronę (np. pod adresem `riftdaily.vercel.app`).

---

---

### 🍎 Uruchomienie i kompilacja na **iPhonie (iOS)**

#### Opcja A: Szybkie uruchomienie deweloperskie
```bash
npx expo run:ios --device
```

#### Opcja B: Samodzielna wersja **Release** na fizycznego iPhone'a (działa bez komputera i bez Metro)
```bash
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
xcodebuild -workspace ios/RiftDaily.xcworkspace \
  -scheme RiftDaily \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -derivedDataPath ios/build \
  -allowProvisioningUpdates build
```

---

## 🏗️ Architektura projektu

```text
rift-daily/
├── .github/workflows/           # GitHub Actions CI/CD (automatyczne budowanie Release APK na Androida)
├── assets/images/               # Ikona aplikacji Rift Daily (1024x1024) i grafiki splash
├── docs/assets/                 # Animowany baner SVG oraz prawdziwe zrzuty ekranu z aplikacji
├── website/                     # Oficjalna strona internetowa (Vite + React 19 + Tailwind CSS)
├── src/
│   ├── api/
│   │   ├── installations.ts     # Katalog ponad 80 polskich uczelni (UKEN jako Top 1)
│   │   ├── oauth1.ts            # Implementacja podpisów kryptograficznych HMAC-SHA1 OAuth 1.0a
│   │   ├── types.ts             # Definicje typów TypeScript dla encji USOS API
│   │   └── usosClient.ts        # Klient USOS API (kursy, oceny, wykładowcy, raty, zdjęcia HD)
│   ├── app/
│   │   ├── _layout.tsx          # Ekran ładowania + bramka bezpieczeństwa PIN / Face ID
│   │   ├── login.tsx            # Wybór uczelni i logowanie OAuth 1.0a / PIN
│   │   ├── (tabs)/              # Ekrany: Dziennik, Plan, Oceny, Kursy, Moduły, Ustawienia
│   │   └── modal/               # Modale szczegółów przedmiotu, modułów USOS i diagnostyki API
│   ├── components/
│   │   ├── AppLoadingScreen.tsx # Animowany ekran startowy i synchronizacji
│   │   ├── Avatar.tsx           # Portrety HD z estetycznymi sylwetkami zastępczymi
│   │   ├── GlassCard.tsx        # Karty Bento ze sprężystymi animacjami Reanimated
│   │   ├── GradeBadge.tsx       # Monospace'owe plakietki ocen (5.0, 4.5, ZAL)
│   │   └── SecurityGateOverlay.tsx # Ekran blokady i konfiguracji PIN + Face ID / Biometria
│   ├── services/
│   │   └── notifications.ts     # Silnik powiadomień iOS/Android o zmianach lekcji, ocenach i ratach
│   ├── store/
│   │   └── useUsosStore.ts      # Magazyn stanu Zustand + bezpieczny zapis w Keychain / Keystore
│   ├── theme/
│   │   └── theme.ts             # System 2 motywów: Ciemny (#09090B) i Jasny (#F4F4F5)
│   └── utils/
│       └── timetableUtils.ts    # Wyznaczanie trwających i najbliższych zajęć z odliczaniem czasu
├── LICENSE                      # Licencja Non-Commercial (100% Darmowe / Zakaz komercjalizacji)
└── README.md                    # Dokumentacja projektu (iOS & Android)
```

---

## 🤝 Współtworzenie (Contributing)

Projekt ma otwarty kod źródłowy i jest tworzony przez studentów dla studentów! Jeśli chcesz dodać obsługę nowego modułu USOS lub ulepszyć aplikację:

1. Zrób **Fork** repozytorium
2. Utwórz nową gałąź (`git checkout -b feat/nowa-funkcja`)
3. Zatwierdź zmiany (`git commit -m 'feat: dodano nową funkcję'`)
4. Wypchnij gałąź (`git push origin feat/nowa-funkcja`) i otwórz **Pull Request**

---

## 📄 Licencja (100% Darmowe -> Zakaz Komercjalizacji)

Ten projekt jest udostępniany na licencji **Rift Daily Non-Commercial Open Source License** (pełną treść znajdziesz w pliku [LICENSE](./LICENSE)).

- **100% Darmowe dla studentów**: Możesz dowolnie pobierać, uruchamiać, modyfikować i rozwijać aplikację w celach osobistych, akademickich i edukacyjnych.
- **Bezwzględny zakaz spieniężania (No Monetization / Non-Commercial)**: Zabrania się sprzedaży aplikacji lub jej części, wprowadzania płatnych subskrypcji (paywalli), mikropłatności, reklam zarobkowych oraz wykorzystywania kodu w produktach komercyjnych. Aplikacja oraz wszelkie jej forki muszą pozostać **całkowicie darmowe**.

<div align="center">
  <sub>Stworzone z pasją dla studentów polskich uczelni • <b>Rift Daily // e-Dziennik USOS (iOS & Android)</b></sub>
  <br />
  <sub>Main Contributor: <a href="https://github.com/matiqueue">@matiqueue</a> • <a href="https://matiqueue-portfolio.vercel.app">☕ Buy me a coffee</a></sub>
</div>
