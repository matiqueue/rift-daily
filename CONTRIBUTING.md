# Współtworzenie projektu Rift Daily

Dziękujemy za zainteresowanie rozwojem **Rift Daily**! Każde zgłoszenie błędu, propozycja funkcji lub Pull Request pomaga ulepszać aplikację dla studentów korzystających z USOS.

## Wymagania lokalne

- Node.js 20+
- npm
- Expo CLI (`npx expo`)
- Do budowania natywnie: Xcode (iOS) lub Android Studio / JDK 17 (Android)

## Uruchomienie projektu

```bash
git clone https://github.com/matiqueue/rift-daily.git
cd rift-daily
npm install
cp .env.example .env.local
```

Uzupełnij w `.env.local` własne klucze OAuth 1.0a dla wybranej uczelni USOS, a następnie uruchom:

```bash
npx expo start
```

## Sprawdzanie kodu przed Pull Requestem

1. Upewnij się, że TypeScript kompiluje się bez błędów:
   ```bash
   ./node_modules/.bin/tsc --noEmit
   ```
2. Jeśli modyfikowałeś stronę WWW w `website/`, sprawdź jej build:
   ```bash
   cd website && npm ci && npm run build
   ```
3. Nie commituj plików `.env.local`, certyfikatów ani kluczy podpisujących.

## Zgłaszanie błędów i pomysłów

- Błędy i propozycje funkcji zgłaszaj w zakładce **Issues** za pomocą przygotowanych szablonów.
- Pytania ogólne oraz dyskusje o roadmapie prowadzimy w zakładce **Discussions**.
