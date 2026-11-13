import { useState } from 'react';
import {
  Download,
  Smartphone,
  Apple,
  ShieldCheck,
  Zap,
  BookOpen,
  CreditCard,
  GraduationCap,
  Sparkles,
  Coffee,
  CheckCircle2,
  Terminal,
  HelpCircle,
  Clock,
  Layers,
  UserCheck
} from 'lucide-react';

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timetable' | 'settings' | 'login'>('dashboard');

  const screenshots = {
    dashboard: {
      title: 'Panel Główny (Bento UI)',
      desc: 'Asymetryczny dashboard z kartą najbliższych zajęć na żywo, średnią ważoną, statusem raty i skrótami modułów.',
      src: '/screen-dashboard-dark.png',
      badge: 'Bento Grid'
    },
    timetable: {
      title: 'Inteligentny Plan Zajęć',
      desc: 'Chronologiczna oś czasu tygodnia z wyróżnieniem trwających ćwiczeń, salami, budynkami i wykładowcami.',
      src: '/screen-timetable-dark.png',
      badge: 'Timeline 7D'
    },
    settings: {
      title: 'Ustawienia i Bezpieczeństwo',
      desc: 'Blokada aplikacji kodem PIN lub Face ID / biometrią, przełączanie motywów i kontrola powiadomień.',
      src: '/screen-settings-dark.png',
      badge: 'Biometria'
    },
    login: {
      title: 'Oficjalne Logowanie Uczelniane',
      desc: 'Bezpieczna autoryzacja OAuth 1.0a bezpośrednio na stronie Twojej uczelni bez pośredników.',
      src: '/screen-login-dark.png',
      badge: 'OAuth 1.0a'
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Glow Effects in Background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-[45%] right-0 w-[500px] h-[400px] bg-purple-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#09090b]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="Rift Daily Logo" className="w-9 h-9 rounded-xl border border-white/10 shadow-sm" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Rift Daily
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                v1.0.0
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#android" className="hover:text-emerald-400 transition-colors">Pobierz na Androida</a>
            <a href="#ios" className="hover:text-white transition-colors">Instalacja na iOS</a>
            <a href="#features" className="hover:text-white transition-colors">Funkcje</a>
            <a href="#workflow" className="hover:text-white transition-colors">GitHub Actions</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/matiqueue/rift-daily"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 transition-all hover:border-white/20"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a
              href="#android"
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Pobierz APK</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nowa generacja e-Dziennika akademickiego</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Twój USOS.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Wreszcie szybki, czysty i nowoczesny.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Zapomnij o powolnym USOSwebie. <b>Rift Daily</b> to niezależny, w 100% darmowy klient mobilny z widokiem najbliższych zajęć na żywo, protokołami ocen, mLegitymacją i natychmiastowym wyszukiwaniem.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <a
              href="https://github.com/matiqueue/rift-daily/releases/latest/download/RiftDaily.apk"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm transition-all shadow-xl shadow-emerald-500/25 active:scale-95"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Pobierz na Androida (.APK)</span>
            </a>

            <a
              href="#ios"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl border border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-white font-bold text-sm transition-all active:scale-95"
            >
              <Apple className="w-4 h-4" />
              <span>Instrukcja dla iPhone (iOS)</span>
            </a>

            <a
              href="https://github.com/matiqueue/rift-daily"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Kod na GitHubie</span>
            </a>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 80+ uczelni w Polsce
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Darmowy (Non-Commercial)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Bezpośrednie API uczelni
            </span>
          </div>
        </div>

        {/* Interactive App Showcase Carousel */}
        <div className="mt-16 max-w-5xl mx-auto">
          {/* Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-zinc-900/60 border border-white/5 max-w-xl mx-auto mb-8">
            {(
              [
                { id: 'dashboard', label: 'Panel Główny' },
                { id: 'timetable', label: 'Plan Zajęć' },
                { id: 'settings', label: 'Ustawienia & PIN' },
                { id: 'login', label: 'Logowanie' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Device Showcase Card */}
          <div className="glass-card rounded-3xl p-6 md:p-10 border border-white/10 glow-emerald grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5 space-y-4">
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                {screenshots[activeTab].badge}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {screenshots[activeTab].title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {screenshots[activeTab].desc}
              </p>
              <div className="pt-4 flex flex-col gap-2.5 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Estetyka Linear / Vercel Bento UI</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Szybki podgląd bez przeładowań</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Działa w trybie ciemnym i jasnym</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 flex justify-center">
              <div className="relative max-w-[280px] sm:max-w-[310px] rounded-[36px] p-2 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 border border-white/15 shadow-2xl">
                <div className="overflow-hidden rounded-[28px] border border-black bg-zinc-950">
                  <img
                    src={screenshots[activeTab].src}
                    alt={screenshots[activeTab].title}
                    className="w-full h-auto object-cover transition-opacity duration-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Android Download Guide Section */}
      <section id="android" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
            <Smartphone className="w-4 h-4" />
            <span>System Android</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Jak pobrać i zainstalować na Androidzie?
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Na Androidzie nie musisz przechodzić przez sklep Google Play ani niczego konfigurować. Gotowy plik <b>.APK</b> instalujesz bezpośrednio z oficjalnego wydania na GitHubie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 border border-white/10 relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-extrabold font-mono text-base border border-emerald-500/25">
                01
              </div>
              <h3 className="text-lg font-bold text-white">Pobierz plik APK</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Pobierz najnowszą, podpisaną paczkę instalacyjną wygenerowaną bezpośrednio przez GitHub Actions.
              </p>
            </div>
            <a
              href="https://github.com/matiqueue/rift-daily/releases/latest/download/RiftDaily.apk"
              className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Pobierz RiftDaily.apk</span>
            </a>
          </div>

          {/* Step 2 */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 border border-white/10 relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-extrabold font-mono text-base border border-purple-500/25">
                02
              </div>
              <h3 className="text-lg font-bold text-white">Zezwól na instalację</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Otwórz pobrany plik z powiadomień lub folderu <i>Pobrane</i>. Jeśli telefon wyświetli zapytanie o bezpieczeństwo, kliknij <b>Ustawienia</b> i włącz <i>„Zezwalaj z tego źródła”</i>.
              </p>
            </div>
            <div className="mt-6 p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-[11px] font-mono text-zinc-400">
              Ustawienia → Zezwalaj na instalację aplikacji
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 border border-white/10 relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-extrabold font-mono text-base border border-cyan-500/25">
                03
              </div>
              <h3 className="text-lg font-bold text-white">Zaloguj się uczelnią</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Uruchom Rift Daily, wybierz swoją uczelnię (np. UKEN Kraków, UJ, UW, PW...) i zaloguj się oficjalnym loginem i hasłem przez bezpieczny USOS OAuth 1.0a.
              </p>
            </div>
            <div className="mt-6 p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-[11px] font-mono text-emerald-400 text-center font-bold">
              Gotowe do nauki! 🎓
            </div>
          </div>
        </div>

        {/* Dev Alternative Box */}
        <div className="mt-10 max-w-5xl mx-auto glass-card rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Dla programistów: Budowanie ze źródeł</div>
              <div className="text-xs text-zinc-400">Możesz też sklonować repozytorium i uruchomić aplikację lokalnie.</div>
            </div>
          </div>
          <code className="text-xs font-mono bg-black/60 px-3.5 py-2 rounded-xl border border-white/5 text-emerald-400">
            git clone ... && npx expo run:android
          </code>
        </div>
      </section>

      {/* 4. iOS Guide Section */}
      <section id="ios" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs font-semibold">
            <Apple className="w-4 h-4" />
            <span>Apple iOS (iPhone & iPad)</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Jak zainstalować na iPhonie?
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Dlaczego aplikacji nie ma w App Store? <b>Rift Daily jest w 100% darmowym projektem studenckim open-source</b>, którego licencja zakazuje monetyzacji, a konto Apple Developer to koszt $99 rocznie. Dlatego udostępniamy proste metody instalacji.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Method 1 */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/15 px-2.5 py-1 rounded-md border border-purple-500/25">
                METODA 1 (NAJLEPSZA)
              </span>
              <Apple className="w-5 h-5 text-zinc-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Kompilacja przez Xcode (Mac)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Posiadasz komputer Mac? To zajmuje 2 minuty z darmowym Apple ID:
            </p>
            <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside">
              <li>Sklonuj repozytorium Rift Daily z GitHuba.</li>
              <li>Otwórz <code className="bg-black/50 px-1.5 py-0.5 rounded text-purple-300 font-mono">ios/RiftDaily.xcworkspace</code>.</li>
              <li>Podłącz iPhone'a kablem lub przez Wi-Fi.</li>
              <li>Wybierz swoje konto Apple ID w <i>Signing</i> i kliknij <b>Play / Run</b>.</li>
            </ol>
          </div>

          {/* Method 2 */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/15 px-2.5 py-1 rounded-md border border-cyan-500/25">
                METODA 2 (BEZ MACA)
              </span>
              <Smartphone className="w-5 h-5 text-zinc-400" />
            </div>
            <h3 className="text-lg font-bold text-white">AltStore lub Sideloadly</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Darmowe narzędzia sideloadingu dla systemów Windows oraz macOS:
            </p>
            <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside">
              <li>Pobierz darmowy program <a href="https://altstore.io" target="_blank" rel="noreferrer" className="text-cyan-400 underline">AltStore</a> lub Sideloadly.</li>
              <li>Podłącz iPhone'a do komputera.</li>
              <li>Wgraj plik paczki Rift Daily na telefon.</li>
              <li>Aplikacja automatycznie odświeża darmowy certyfikat w domowej sieci Wi-Fi.</li>
            </ol>
          </div>

          {/* Method 3 */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-md border border-emerald-500/25">
                METODA 3
              </span>
              <Layers className="w-5 h-5 text-zinc-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Expo Dev Client</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dla studentów informatyki i osób chcących testować kod na żywo:
            </p>
            <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside">
              <li>Zainstaluj zależności <code className="bg-black/50 px-1.5 py-0.5 rounded text-emerald-300 font-mono">npm install</code>.</li>
              <li>Uruchom serwer <code className="bg-black/50 px-1.5 py-0.5 rounded text-emerald-300 font-mono">npx expo run:ios</code>.</li>
              <li>Wszelkie zmiany w kodzie odświeżają się natychmiast na Twoim telefonie (Fast Refresh).</li>
            </ol>
          </div>
        </div>
      </section>

      {/* 5. GitHub Actions Workflow Section */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="glass-card rounded-3xl p-8 md:p-12 border border-white/10 relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
              <Zap className="w-4 h-4" />
              <span>Czysty i bezpieczny kod (CI/CD)</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Automatyczny build APK w GitHub Actions
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Każde oficjalne wydanie aplikacji oraz każde uruchomienie workflow jest kompilowane w chmurze na czystych maszynach wirtualnych GitHub Actions. Masz 100% gwarancji, że instalujesz bezpieczny plik wygenerowany prosto z otwartego kodu źródłowego.
            </p>
            <div className="pt-4 flex flex-wrap gap-4 text-xs font-mono">
              <span className="bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-xl text-zinc-300">
                Runner: ubuntu-latest
              </span>
              <span className="bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-xl text-zinc-300">
                Java: OpenJDK 17
              </span>
              <span className="bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-xl text-zinc-300">
                Trigger: Tag v* / Manual dispatch
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Features Grid Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Wszystko czego potrzebujesz na studiach</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Dlaczego pokochasz Rift Daily?
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Tworzony przez studentów, dla studentów. Rozwiązuje każdy problem powolnego interfejsu USOSweb.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="glass-card glass-card-hover rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Karta „Najbliższe Zajęcia”</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dynamiczny licznik czasu na żywo, numer sali, budynek i nazwisko prowadzącego na samej górze ekranu. Zawsze wiesz, gdzie iść na kolejną salę.
            </p>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Oceny w protokołach</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Błyskawiczny podgląd wpisów wykładowców, średniej ważonej (GPA), punktów ECTS oraz symulator ocen What-If.
            </p>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Katalog Wykładowców</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Zdjęcia w wysokiej rozdzielczości, pokoje konsultacji oraz bezpośrednie adresy e-mail z możliwością skopiowania jednym kliknięciem.
            </p>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Raty, Płatności & IBAN</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Koniec z błędnymi kwotami rat. Dokładne wyliczenia z planów ratalnych, kopiowanie konta bankowego i szybkie przekierowanie do bankowości.
            </p>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Cyfrowa mLegitymacja (ELS)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Zawsze pod ręką: Twoje zdjęcie legitymacyjne, numer albumu, kod kreskowy biblioteki i kod identyfikacyjny studenta.
            </p>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Prywatność i Face ID / PIN</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Brak jakichkolwiek serwerów pośredniczących. Twoje dane logowania są szyfrowane wyłącznie w bezpiecznym pęku kluczy Twojego telefonu.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-white/5 space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-extrabold text-white">Często zadawane pytania (FAQ)</h2>
          <p className="text-zinc-400 text-sm">Wszystko, co musisz wiedzieć o bezpieczeństwie i działaniu Rift Daily.</p>
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Czy aplikacja widzi moje hasło do USOSa?
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <b>Absolutnie nie.</b> Logowanie odbywa się przez oficjalny mechanizm autoryzacji OAuth 1.0a na stronie Twojej uczelni. Aplikacja nigdy nie ma dostępu do Twojego hasła; otrzymuje jedynie zaszyfrowany token sesji przechowywany lokalnie na Twoim urządzeniu.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Czy Rift Daily jest naprawdę w 100% darmowy?
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <b>Tak, w 100% i na zawsze.</b> Aplikacja jest chroniona licencją <i>Non-Commercial Open Source License</i>. Zakazuje ona sprzedaży, mikropłatności, paywalli oraz reklam komercyjnych.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Jakie uczelnie są wspierane?
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Rift Daily wspiera każdą polską uczelnię wyższą posiadającą oficjalne USOS API, w tym m.in. UKEN Kraków, UJ, UW, PW, AGH, PK, UEK, UAM, PWr, UWr, UMK, UŚ, SGH, KUL i ponad 80 innych.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="Rift Daily" className="w-7 h-7 rounded-lg" />
            <span className="font-extrabold text-sm text-white">Rift Daily</span>
            <span className="text-xs text-zinc-500">• e-Dziennik Akademicki</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-400">
            <a
              href="https://github.com/matiqueue"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Main Contributor: <span className="text-zinc-200 font-semibold">@matiqueue</span>
            </a>
            <a
              href="https://matiqueue-portfolio.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Buy me a coffee</span>
            </a>
            <a
              href="https://github.com/matiqueue/rift-daily/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Licencja Non-Commercial
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
