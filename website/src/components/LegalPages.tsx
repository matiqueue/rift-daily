import { useState } from 'react';
import { ArrowLeft, Mail, ShieldCheck, FileText, HelpCircle, Trash2 } from 'lucide-react';

export type LegalRoute = 'privacy' | 'terms' | 'support';

interface LegalPageProps {
  route: LegalRoute;
  onNavigateHome: () => void;
  onNavigate: (r: LegalRoute) => void;
}

export function LegalPage({ route, onNavigateHome, onNavigate }: LegalPageProps) {
  const [lang, setLang] = useState<'pl' | 'en'>('pl');

  const isPl = lang === 'pl';

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-zinc-200/20">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#09090b]/85 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Rift Daily</span>
          </button>

          <div className="flex items-center gap-2">
            <nav className="hidden sm:flex items-center gap-1 text-xs">
              {(['privacy', 'terms', 'support'] as LegalRoute[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => onNavigate(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    route === tab
                      ? 'bg-white text-black font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab === 'privacy'
                    ? isPl
                      ? 'Prywatność'
                      : 'Privacy'
                    : tab === 'terms'
                    ? isPl
                      ? 'Regulamin'
                      : 'Terms'
                    : isPl
                    ? 'Pomoc'
                    : 'Support'}
                </button>
              ))}
            </nav>

            <div className="flex items-center rounded-lg border border-white/10 overflow-hidden text-xs font-mono">
              <button
                onClick={() => setLang('pl')}
                className={`px-2.5 py-1 cursor-pointer ${
                  isPl ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                PL
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 cursor-pointer ${
                  !isPl ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {route === 'privacy' && (
          <article className="space-y-6">
            <div className="space-y-2 border-b border-white/10 pb-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{isPl ? 'RODO / GDPR · Ostatnia aktualizacja: 2026-11-22' : 'GDPR · Last updated: 2026-11-22'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {isPl ? 'Polityka Prywatności Rift Daily' : 'Rift Daily Privacy Policy'}
              </h1>
              <p className="text-zinc-400 text-sm">
                {isPl
                  ? 'Administrator projektu: Szymon Góral (kontakt: szymon.goral@icloud.com). Dotyczy aplikacji mobilnej Rift Daily (iOS, Android) oraz portalu rift-daily.vercel.app.'
                  : 'Project maintainer: Szymon Góral (contact: szymon.goral@icloud.com). Applies to the Rift Daily mobile app (iOS, Android) and rift-daily.vercel.app.'}
              </p>
            </div>

            <section className="space-y-3 text-zinc-300 leading-relaxed text-sm sm:text-base">
              <h2 className="text-xl font-bold text-white">
                {isPl ? '1. Brak bazy danych i brak profilowania' : '1. Zero Database & No Tracking'}
              </h2>
              <p>
                {isPl
                  ? 'Rift Daily jest niezależnym, otwartoźródłowym klientem uczelnianego systemu USOS API. Aplikacja NIE zbiera, NIE sprzedaje ani NIE przechowuje danych studentów (ocen, planu zajęć, danych osobowych, numeru albumu ani płatności) w żadnej zewnętrznej bazie danych. Nie używamy reklam, trackerów ani narzędzi profilujących.'
                  : 'Rift Daily is an independent open-source client for Polish university USOS API installations. The app does NOT collect, sell, or store student data (grades, timetables, personal profiles, student IDs, or payment details) in any external database. We do not use advertising SDKs or cross-app tracking.'}
              </p>
            </section>

            <section className="space-y-3 text-zinc-300 leading-relaxed text-sm sm:text-base">
              <h2 className="text-xl font-bold text-white">
                {isPl ? '2. Jak działa bezpieczne logowanie (USOS OAuth 1.0a + BFF)' : '2. How Authentication Works (USOS OAuth 1.0a + BFF)'}
              </h2>
              <p>
                {isPl
                  ? 'Logowanie odbywa się wyłącznie na oficjalnej stronie Twojej uczelni (USOSweb / CAS) z użyciem protokołu OAuth 1.0a wewnątrz systemowej sesji przeglądarki. Rift Daily nigdy nie widzi ani nie przechowuje Twojego hasła uczelnianego. Bezstanowy serwer pośredniczący (Vercel Functions) podpisuje żądania serwerowymi kluczami aplikacji (USOS Consumer Keys) i wydaje zaszyfrowany token sesji (AES-256-GCM), który jest zapisywany wyłącznie w sprzętowym pęku kluczy Twojego urządzenia (iOS Keychain / Android Keystore).'
                  : 'Sign-in happens directly on your university’s official USOSweb / CAS page using OAuth 1.0a inside an in-app system browser session. Rift Daily never sees or stores your university password. Our stateless proxy backend (Vercel Functions) signs requests using server-side USOS Consumer Keys and issues an AES-256-GCM encrypted session token stored exclusively in your device’s hardware-backed Keychain / Android Keystore.'}
              </p>
            </section>

            <section className="space-y-3 text-zinc-300 leading-relaxed text-sm sm:text-base">
              <h2 className="text-xl font-bold text-white">
                {isPl ? '3. Uprawnienia urządzenia' : '3. Device Permissions'}
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Face ID / Touch ID / Biometria:</strong>{' '}
                  {isPl
                    ? 'opcjonalna lokalna blokada ekranu aplikacji. Dane biometryczne nigdy nie opuszczają systemu iOS/Android.'
                    : 'optional local app lock. Biometric data never leaves iOS/Android.'}
                </li>
                <li>
                  <strong>{isPl ? 'Powiadomienia lokalne i odświeżanie w tle:' : 'Local notifications & background refresh:'}</strong>{' '}
                  {isPl
                    ? 'służą wyłącznie do przypomnień przed zajęciami oraz wykrywania nowych ocen i zmian w planie na urządzeniu.'
                    : 'used solely for pre-class reminders and detecting new grades or schedule changes on-device.'}
                </li>
              </ul>
            </section>

            <section className="space-y-3 text-zinc-300 leading-relaxed text-sm sm:text-base border border-white/10 rounded-2xl p-5 bg-white/[0.02]">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Trash2 className="w-5 h-5" />
                <h2>{isPl ? '4. Usuwanie danych i cofnięcie dostępu' : '4. Data Deletion & Revoking Access'}</h2>
              </div>
              <p>
                {isPl
                  ? 'Możesz w każdej chwili trwale usunąć wszystkie lokalne dane aplikacji (zaszyfrowaną sesję, kod PIN, preferencje, historię powiadomień) bezpośrednio w aplikacji: Więcej → Ustawienia → „Usuń wszystkie dane z urządzenia”. Dodatkowo możesz cofnąć token OAuth bezpośrednio w panelu USOSweb swojej uczelni (Mój USOSweb → Aplikacje zewnętrzne). Ponieważ nie prowadzimy żadnej bazy użytkowników, usunięcie danych na urządzeniu oznacza natychmiastowe i całkowite usunięcie wszystkich informacji.'
                  : 'You can permanently delete all local app data (encrypted session token, PIN, preferences, notification history) directly inside the app: More → Settings → "Delete all device data". You can also revoke the OAuth token in your university USOSweb portal (My USOSweb → External Applications). Because Rift Daily maintains no user database, wiping device data immediately removes all stored information.'}
              </p>
            </section>
          </article>
        )}

        {route === 'terms' && (
          <article className="space-y-6">
            <div className="space-y-2 border-b border-white/10 pb-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400">
                <FileText className="w-4 h-4" />
                <span>{isPl ? 'Ostatnia aktualizacja: 2026-11-22' : 'Last updated: 2026-11-22'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {isPl ? 'Regulamin Korzystania z Rift Daily' : 'Rift Daily Terms of Service'}
              </h1>
            </div>

            <div className="space-y-4 text-zinc-300 leading-relaxed text-sm sm:text-base">
              <p>
                {isPl
                  ? '1. Rift Daily jest darmowym, otwartoźródłowym (licencja MIT) klientem mobilnym dla publicznych interfejsów USOS API polskich uczelni. Projekt nie jest oficjalną aplikacją żadnej uczelni ani konsorcjum MUCI.'
                  : '1. Rift Daily is a free, open-source (MIT license) mobile client for public USOS API endpoints of Polish universities. It is not officially affiliated with any university or the MUCI consortium.'}
              </p>
              <p>
                {isPl
                  ? '2. Dane wyświetlane w aplikacji (plan zajęć, oceny, płatności, egzaminy, mLegitymacja) pochodzą bezpośrednio z serwerów USOS wybranej uczelni. W przypadku rozbieżności wiążącym źródłem informacji jest oficjalny portal USOSweb uczelni.'
                  : '2. All academic data displayed in the app (timetables, grades, payments, exams) comes directly from your university’s USOS API. In case of discrepancy, the official university USOSweb portal is the authoritative source.'}
              </p>
              <p>
                {isPl
                  ? '3. Aplikacja udostępniana jest w stanie „takim, jakim jest” (AS-IS), bez gwarancji ciągłości działania serwerów uczelnianych. Zabrania się nadużywania centralnego proxy API (np. automatycznego scrapowania lub prób obejścia zabezpieczeń).'
                  : '3. The application is provided "AS IS" without warranty regarding university server availability. Abuse of the central API proxy (automated scraping or security circumvention attempts) is strictly prohibited.'}
              </p>
            </div>
          </article>
        )}

        {route === 'support' && (
          <article className="space-y-6">
            <div className="space-y-2 border-b border-white/10 pb-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400">
                <HelpCircle className="w-4 h-4" />
                <span>{isPl ? 'Wsparcie techniczne' : 'Technical Support'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {isPl ? 'Pomoc i Kontakt' : 'Help & Support'}
              </h1>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <a
                href="mailto:szymon.goral@icloud.com?subject=Rift%20Daily%20Support"
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors space-y-2 block"
              >
                <Mail className="w-5 h-5 text-white" />
                <div className="font-bold text-white">{isPl ? 'Kontakt e-mail' : 'Email Support'}</div>
                <div className="text-sm text-zinc-400">szymon.goral@icloud.com</div>
              </a>

              <a
                href="https://github.com/matiqueue/rift-daily/issues"
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors space-y-2 block"
              >
                <ShieldCheck className="w-5 h-5 text-white" />
                <div className="font-bold text-white">GitHub Issues</div>
                <div className="text-sm text-zinc-400">github.com/matiqueue/rift-daily/issues</div>
              </a>
            </div>

            <div className="space-y-3 text-zinc-300 text-sm sm:text-base">
              <h2 className="text-lg font-bold text-white">
                {isPl ? 'Najczęstsze pytania (FAQ)' : 'Frequently Asked Questions'}
              </h2>
              <p>
                <strong>{isPl ? 'Jak dodać nową uczelnię?' : 'How do I request a new university?'}</strong>{' '}
                {isPl
                  ? 'Zgłoś issue na GitHubie z adresem USOS API swojej uczelni lub napisz na szymon.goral@icloud.com.'
                  : 'Open an issue on GitHub with your university USOS API URL or email szymon.goral@icloud.com.'}
              </p>
              <p>
                <strong>{isPl ? 'Jak usunąć swoje dane?' : 'How do I delete my data?'}</strong>{' '}
                {isPl
                  ? 'Otwórz Więcej → Ustawienia → „Usuń wszystkie dane z urządzenia”. Szczegóły znajdziesz w Polityce Prywatności.'
                  : 'Open More → Settings → "Delete all device data". See our Privacy Policy for full details.'}
              </p>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
