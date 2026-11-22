# Rift Daily — Central AI Agent Hub (Single Source of Truth)

This file is the **only** canonical instruction hub for all AI coding agents (ChatGPT, Claude, Gemini, Copilot). Do not duplicate rules into `CLAUDE.md`, `GEMINI.md`, or `.github/copilot-instructions.md`.

## 1. Mandatory Reading Order Before Any Non-Trivial Change
1. `docs/PROJECT_MEMORY.md` — product vision, security invariants, ADRs, tech debt, store IDs.
2. `docs/ARCHITECTURE.md` — directory map, Expo Router 4-tab layout, SecureStore keys, Vercel BFF API.
3. `docs/RELEASE_AND_STORES.md` — SemVer, iOS App Store/TestFlight, Android Google Play, CI/CD.

## 2. Expo SDK & React Native Rules (Do Not Trust Training Data)
Expo ships breaking changes every SDK release. Before writing code touching Expo, EAS, or React Native APIs:
1. Read the major version of `expo` in `package.json`.
2. Check versioned docs (`https://docs.expo.dev/versions/v<major>.0.0/`) or `https://docs.expo.dev/llms.txt` / installed `.d.ts` files.
3. Always install Expo packages via `npx expo install <package>` and keep versions aligned with `npx expo install --fix`.
4. Navigation uses **Expo Router** (`src/app/`). Keep non-route code (components, hooks, services, utils, store) outside `src/app/`.
5. Do **not** commit `android/` (CNG — configured via `app.json` + `plugins/withAndroidReleaseSigning.js`).

## 3. Anti-Monolith & UI Discipline
- Keep new components focused and modular (avoid growing single files past ~500 lines; extract subcomponents into `src/components/`).
- Preserve the monochrome Titanium / Obsidian / Paper palette (`src/theme/theme.ts`), `darkTheme` + `lightTheme` parity, 4-tab navigation (`Dziś`, `Plan`, `Dziennik`, `Więcej`), and open typography with `StyleSheet.hairlineWidth` dividers (no heavy card walls).

## 4. Non-Negotiable Security & Store Guardrails
- **Zero-Secret Mobile Client**: NEVER place `USOS_KEY_*`, `USOS_SECRET_*`, or `SESSION_ENCRYPTION_KEY` in `EXPO_PUBLIC_*`, client code, or Git. All secrets live exclusively in Vercel Environment Variables (`--sensitive`) or `~/Documents/Text Vaults/RiftDaily-Keys/` (`chmod 600`).
- **Hardware-Backed Storage**: Store all tokens/settings via `src/utils/secureStorage.ts` (`expo-secure-store`, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`).
- **BFF Hardening**: Keep anti-SSRF host validation, strict 19-method read-only allowlist, strict `callbackUrl` allowlist, server-enforced scopes, OAuth param injection guard, 16 KB body cap, and rate limiting intact in `website/api/`.
- **App Store & Play Compliance**: Hide external donation links (`Buy me a coffee`) on `Platform.OS === 'ios'` (Apple 3.1.1); preserve permanent local data deletion in Settings (Apple 5.1.1(v)); keep `ITSAppUsesNonExemptEncryption: false` and `PrivacyInfo.xcprivacy` accurate; never use `"Apple"` or `"Siri"` in any Swift `IntentDescription` (`ITMS-90626`).
- **iOS Signing (`ITMS-90035`)**: Always sign with the local NFC certificate (`Apple Distribution: Szymon Góral (3X24W8AX3N)`) and `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`.

## 5. Verification Commands (Required Before Declaring Done)
```bash
./node_modules/.bin/tsc --noEmit    # TypeScript check (mobile)
npm test                            # Vitest unit tests
npx expo lint                       # ESLint + React Compiler check
npx --yes expo-doctor               # Dependency & config health (20/20)
cd website && npm run build         # Website + BFF API TypeScript & Vite build
```

## 6. Mandatory Documentation Update Matrix
| Change Made | Required Doc Updates |
|---|---|
| New BFF API endpoint or security rule | `docs/PROJECT_MEMORY.md`, `docs/ARCHITECTURE.md`, `src/__tests__/bffSecurity.test.ts` |
| New SecureStore key, tab, or screen | `docs/ARCHITECTURE.md`, `docs/PROJECT_MEMORY.md` |
| Version bump / store release | `CHANGELOG.md` + `npm run version:patch\|minor\|major` |
| Build, signing, or CI/CD change | `docs/RELEASE_AND_STORES.md` |
