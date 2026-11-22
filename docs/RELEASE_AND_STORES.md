# Rift Daily — Release, Stores & CI/CD Runbook

## 1. Skarbiec kluczy (NIGDY nie commituj do Gita!)
- **App Store Connect API Key (wspólny dla Team `3X24W8AX3N`):**
  - `~/Documents/Text Vaults/IronRoutine-Keys/AuthKey_WT2G4S7Z3U.p8`
  - Key ID: `WT2G4S7Z3U`, Issuer ID: `410b5a97-08bd-4989-85d9-c2e3e27954da`
- **Android Production Upload Keystore (dedykowany dla Rift Daily):**
  - `~/Documents/Text Vaults/RiftDaily-Keys/riftdaily-upload.p12` (`chmod 600`)
  - `~/Documents/Text Vaults/RiftDaily-Keys/KEYSTORE_INFO.txt` (`chmod 600`, zawiera hasło, alias, SHA-1 i SHA-256)
  - Sekrety wgrane na GitHub (`matiqueue/rift-daily`): `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
- **Sekrety backendu USOS BFF (wyłącznie na Vercel `monorise-projects/rift-daily`):**
  - `SESSION_ENCRYPTION_KEY`, `USOS_KEY_<ID>`, `USOS_SECRET_<ID>` (`--sensitive`).

## 2. Semantic Versioning (`MAJOR.MINOR.PATCH`)
Nigdy nie edytuj numerów wersji ręcznie w pojedynczych plikach. Zawsze używaj:
```bash
npm run version:patch   # 1.1.0 -> 1.1.1 (atomowo synchronizuje wszystkie 6 plików + build number)
npm run version:minor   # 1.1.0 -> 1.2.0
npm run version:major   # 1.1.0 -> 2.0.0
```
Następnie dopisz sekcję `## [vX.Y.Z] - YYYY-MM-DD` w `CHANGELOG.md` (GitHub Actions automatycznie wyciąga stamtąd opis wydania).

## 3. Publikacja iOS (App Store & TestFlight)
1. **Środowisko przed `pod install` i `xcodebuild`:**
   ```bash
   export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
   export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
   export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
   ```
2. **Pułapka Unicode (`ITMS-90035`):** Certyfikat na tym Macu (`Apple Distribution: Szymon Góral (3X24W8AX3N)`) używa poprawnego kodowania NFC dla `ó`. Skrypt `scripts/release-ios-appstore.sh` automatycznie weryfikuje podpis lokalnie (`codesign --verify --deep --strict`) przed wysyłką do App Store Connect.
3. **Archiwizacja i upload:**
   ```bash
   ./scripts/release-ios-appstore.sh
   # lub sam ponowny upload istniejącego archiwum:
   ./scripts/release-ios-appstore.sh --upload-only
   ```
4. **Automatyzacja metadanych przez ASC API:**
   ```bash
   node scripts/asc-configure.mjs status
   node scripts/asc-configure.mjs configure
   ```
5. **Kroki ręczne w przeglądarce (nieobecne w ASC API):**
   - Jednorazowe utworzenie rekordu New App (`pl.matique.riftdaily`).
   - Publikacja etykiet **App Privacy** (Data Not Collected / brak trackingu).
   - App Compliance → Regulated Medical Device → **No**.
   - Kliknięcie **Add for Review** po podpięciu zwalidowanego buildu.

## 4. Publikacja Android (Google Play Store)
1. Wypchnij tag SemVer z gałęzi `main`:
   ```bash
   git tag v1.2.0 && git push origin v1.2.0
   ```
2. Workflow `.github/workflows/android-release.yml` automatycznie:
   - generuje natywny projekt Android przez CNG (`expo prebuild --platform android --clean` + `plugins/withAndroidReleaseSigning.js`),
   - dekoduje produkcyjny keystore z GitHub Secrets i buduje podpisane `.aab` oraz `.apk`,
   - publikuje GitHub Release z notatkami z `CHANGELOG.md`,
   - jeśli dodany jest sekret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, automatycznie wgrywa `.aab` na ścieżkę `internal` w Google Play.
3. Wymagane wymiary grafik Google Play:
   - Ikona: `512×512` px (`assets/playstore-assets/icon-512x512.png`)
   - Feature Graphic: `1024×500` px (`assets/playstore-assets/feature-graphic-1024x500.png`)
   - Screenshoty: `1440×2880` px (proporcja 1:2 — surowe screenshoty iPhone 2.17:1 są odrzucane przez Google Play!).

## 5. Deploy Backendu BFF & Website na Vercel
```bash
VERCEL_ORG_ID=team_gVFSNV0nS3wRmpo7MBW3hW6T \
VERCEL_PROJECT_ID=prj_99XkQfC9bw0B7c5RysnluCzqggMJ \
vercel deploy --prod --yes
```
Dodawanie nowych kluczy uczelni (np. AGH):
```bash
cd website
vercel env add USOS_KEY_AGH production,preview --sensitive --yes
vercel env add USOS_SECRET_AGH production,preview --sensitive --yes
```
