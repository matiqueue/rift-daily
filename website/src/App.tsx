import { useEffect, useMemo, useState } from 'react';
import { LegalPage, LegalRoute } from './components/LegalPages';
import {
  Apple,
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  Fingerprint,
  GraduationCap,
  Layers,
  Lock,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Zap,
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

function resolveLegalRoute(pathname: string): LegalRoute | null {
  const clean = pathname.replace(/\/+$/, '').toLowerCase();
  if (clean === '/privacy') return 'privacy';
  if (clean === '/terms') return 'terms';
  if (clean === '/support') return 'support';
  return null;
}

const UNIVERSITIES = [
  { short: 'UKEN', name: 'Uniwersytet Komisji Edukacji Narodowej w Krakowie', city: 'Kraków', featured: true },
  { short: 'UJ', name: 'Uniwersytet Jagielloński', city: 'Kraków', featured: true },
  { short: 'AGH', name: 'Akademia Górniczo-Hutnicza', city: 'Kraków', featured: true },
  { short: 'UEK', name: 'Uniwersytet Ekonomiczny w Krakowie', city: 'Kraków', featured: true },
  { short: 'UW', name: 'Uniwersytet Warszawski', city: 'Warszawa', featured: true },
  { short: 'PW', name: 'Politechnika Warszawska', city: 'Warszawa', featured: true },
  { short: 'UAM', name: 'Uniwersytet im. Adama Mickiewicza', city: 'Poznań', featured: false },
  { short: 'PWr', name: 'Politechnika Wrocławska', city: 'Wrocław', featured: false },
  { short: 'UWr', name: 'Uniwersytet Wrocławski', city: 'Wrocław', featured: false },
  { short: 'UMK', name: 'Uniwersytet Mikołaja Kopernika', city: 'Toruń', featured: false },
  { short: 'PG', name: 'Politechnika Gdańska', city: 'Gdańsk', featured: false },
  { short: 'UG', name: 'Uniwersytet Gdański', city: 'Gdańsk', featured: false },
  { short: 'UŚ', name: 'Uniwersytet Śląski', city: 'Katowice', featured: false },
  { short: 'SGH', name: 'Szkoła Główna Handlowa', city: 'Warszawa', featured: false },
  { short: 'KUL', name: 'Katolicki Uniwersytet Lubelski', city: 'Lublin', featured: false },
  { short: 'UPJP2', name: 'Uniwersytet Papieski Jana Pawła II', city: 'Kraków', featured: false },
  { short: 'AWF', name: 'Akademia Wychowania Fizycznego', city: 'Kraków', featured: false },
  { short: 'UŁ', name: 'Uniwersytet Łódzki', city: 'Łódź', featured: false },
];

type ScreenId = 'dzis' | 'plan' | 'jasny' | 'bezpieczenstwo' | 'logowanie';

const SCREENS: Record<
  ScreenId,
  {
    id: ScreenId;
    label: string;
    tag: string;
    title: string;
    desc: string;
    highlights: string[];
    src: string;
  }
> = {
  dzis: {
    id: 'dzis',
    label: 'Dziś',
    tag: 'NATYCHMIASTOWY START',
    title: 'Twój dzień akademicki w ułamku sekundy',
    desc: 'Lokalna pamięć podręczna wyświetla plan i oceny natychmiast po otwarciu aplikacji, a cicha synchronizacja w tle aktualizuje dane bez blokowania ekranu.',
    highlights: [
      'Podgląd trwających i najbliższych zajęć z numerem sali',
      'Średnia ważona ECTS, liczba kursów i status płatności',
      'Pigułka statusu „Pobieram najnowsze dane / Zaktualizowano”',
    ],
    src: '/screen-dzis.png',
  },
  plan: {
    id: 'plan',
    label: 'Plan zajęć',
    tag: 'KARUZELA DAT',
    title: 'Płynny plan tygodnia z karuzelą dat',
    desc: 'Przesuwaj dni ruchem kciuka jak w iOS Timer, wracaj jednym kliknięciem do „DZIŚ” i sprawdzaj okienka między zajęciami oraz prowadzących.',
    highlights: [
      'Karuzela dat bez zbędnych przycisków strzałek',
      'Karty zajęć z budynkiem, salą i kartą wykładowcy',
      'Inteligentne buforowanie pobranych tygodni',
    ],
    src: '/screen-plan.png',
  },
  jasny: {
    id: 'jasny',
    label: 'Jasny motyw',
    tag: 'OBSIDIAN & PAPER',
    title: 'Dwa dopracowane motywy: ciemny i dzienny',
    desc: 'Monochromatyczna paleta Titanium / Obsidian w nocy i czysty Paper w dzień — pełna spójność typografii na wszystkich 4 zakładkach.',
    highlights: [
      'Czarny, kompaktowy szklany pasek nawigacji',
      'Wysoki kontrast i czytelność na słońcu',
      'Płynne przełączanie motywu jednym tapnięciem',
    ],
    src: '/screen-jasny.png',
  },
  bezpieczenstwo: {
    id: 'bezpieczenstwo',
    label: 'Prywatność',
    tag: 'ZERO-SECRET BFF',
    title: 'Sprzętowe szyfrowanie i Face ID / PIN',
    desc: 'Zero kluczy API w aplikacji mobilnej. Sesja jest szyfrowana AES-256-GCM, a tokeny spoczywają wyłącznie w iOS Keychain / Android Keystore.',
    highlights: [
      'Brak zewnętrznej bazy danych studentów i zero reklam',
      'Blokada biometryczna Face ID / Touch ID + kod PIN',
      'Jedno kliknięcie usuwa wszystkie dane lokalne (RODO)',
    ],
    src: '/screen-bezpieczenstwo.png',
  },
  logowanie: {
    id: 'logowanie',
    label: 'Uczelnie',
    tag: '50+ UCZELNI USOS',
    title: 'Oficjalne logowanie OAuth 1.0a',
    desc: 'Logujesz się wyłącznie na oficjalnej stronie CAS / USOSweb swojej uczelni w bezpiecznym oknie ASWebAuthenticationSession — Rift Daily nigdy nie widzi Twojego hasła.',
    highlights: [
      'Obsługa UKEN, UJ, AGH, UEK, UW, PW, UAM, UMK i 50+ innych',
      'Logowanie w 15 sekund bez ręcznego wpisywania kluczy',
      'Pełna zgodność ze standardem bezpieczeństwa Apple',
    ],
    src: '/screen-logowanie.png',
  },
};

export default function App() {
  const [legalRoute, setLegalRoute] = useState<LegalRoute | null>(() =>
    resolveLegalRoute(window.location.pathname)
  );
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dzis');
  const [uniQuery, setUniQuery] = useState('');

  useEffect(() => {
    const onPop = () => setLegalRoute(resolveLegalRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigateLegal = (target: LegalRoute | null) => {
    const path = target ? `/${target}` : '/';
    window.history.pushState({}, '', path);
    setLegalRoute(target);
    window.scrollTo(0, 0);
  };

  const filteredUniversities = useMemo(() => {
    const q = uniQuery.trim().toLowerCase();
    if (!q) return UNIVERSITIES;
    return UNIVERSITIES.filter(
      (u) =>
        u.short.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q)
    );
  }, [uniQuery]);

  if (legalRoute) {
    return (
      <LegalPage
        route={legalRoute}
        onNavigateHome={() => navigateLegal(null)}
        onNavigate={(r) => navigateLegal(r)}
      />
    );
  }

  const current = SCREENS[activeScreen];

  return (
    <div className="min-h-screen bg-[#050507] text-[#f4f4f5] selection:bg-emerald-500/25 selection:text-emerald-300 overflow-x-hidden">
      {/* Subtle Architectural Grid & Ambient Glows */}
      <div className="fixed inset-0 obsidian-grid pointer-events-none opacity-60 -z-20" />
      <div className="fixed top-[-140px] left-1/2 -translate-x-1/2 w-[1000px] h-[520px] bg-gradient-to-b from-zinc-700/20 via-emerald-500/8 to-transparent blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-[-180px] right-[-120px] w-[620px] h-[520px] bg-emerald-500/8 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* 1. Sticky Glass Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#050507]/75 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 group text-left"
          >
            <img
              src="/icon.png"
              alt="Rift Daily"
              className="w-9 h-9 rounded-xl border border-white/15 shadow-md group-hover:scale-105 transition-transform"
            />
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                Rift Daily
              </span>
              <span className="text-[10px] font-mono font-bold bg-white/[0.07] text-zinc-200 border border-white/10 px-2 py-0.5 rounded-full">
                v3.1.2
              </span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <a href="#showcase" className="hover:text-white transition-colors">Podgląd</a>
            <a href="#features" className="hover:text-white transition-colors">Funkcje</a>
            <a href="#security" className="hover:text-white transition-colors">Zero-Secret</a>
            <a href="#universities" className="hover:text-white transition-colors">Uczelnie</a>
            <a href="#download" className="hover:text-emerald-400 transition-colors">Pobierz</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href="https://github.com/matiqueue/rift-daily"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 transition-all"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
            <a
              href="#download"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-extrabold transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pobierz</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Editorial Split Hero */}
      <section className="relative pt-14 pb-20 lg:pt-24 lg:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Copy */}
          <div className="lg:col-span-6 space-y-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>iOS App Store & Android · Natychmiastowy cache offline</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.03em] leading-[1.05] text-white">
              USOS, który działa{' '}
              <span className="bg-gradient-to-r from-white via-zinc-300 to-emerald-400 bg-clip-text text-transparent">
                tak szybko, jak powinien.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Minimalistyczny e-Dziennik akademicki dla polskich uczelni. Plan zajęć z karuzelą dat,
              średnia ważona ECTS, egzaminy, mLegitymacja i automatyczna synchronizacja w tle — bez reklam i bez zewnętrznych baz danych.
            </p>

            {/* Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
              <a
                href="https://apps.apple.com/app/id6837895381"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm transition-all shadow-xl shadow-white/10 active:scale-95"
              >
                <Apple className="w-4 h-4 fill-current" />
                <span>App Store (iOS)</span>
              </a>

              <a
                href="https://github.com/matiqueue/rift-daily/releases/latest/download/RiftDaily.apk"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-bold text-sm transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Pobierz APK (Android)</span>
              </a>
            </div>

            {/* Key Metrics Strip */}
            <div className="pt-4 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 border-t border-white/[0.08]">
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white">&lt;200ms</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Start z pamięci</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white">50+</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Uczelni USOS</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">0 zł</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Zero reklam</div>
              </div>
            </div>
          </div>

          {/* Right: 3-Phone Overlapping Visual Showcase */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[420px] sm:min-h-[520px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 via-transparent to-zinc-500/15 blur-3xl rounded-full pointer-events-none" />

            {/* Left angled phone */}
            <button
              type="button"
              onClick={() => setActiveScreen('plan')}
              aria-label="Podgląd planu zajęć"
              className="hidden sm:block absolute left-2 xl:left-4 w-[185px] lg:w-[205px] -rotate-6 translate-y-6 opacity-80 hover:opacity-100 hover:-translate-y-1 transition-all duration-300 rounded-[28px] overflow-hidden border border-white/15 shadow-2xl cursor-pointer"
            >
              <img src="/screen-plan.png" alt="Plan zajęć Rift Daily" className="w-full h-auto block" />
            </button>

            {/* Right angled phone (Light Mode) */}
            <button
              type="button"
              onClick={() => setActiveScreen('jasny')}
              aria-label="Podgląd jasnego motywu"
              className="hidden sm:block absolute right-2 xl:right-4 w-[185px] lg:w-[205px] rotate-6 translate-y-6 opacity-80 hover:opacity-100 hover:-translate-y-1 transition-all duration-300 rounded-[28px] overflow-hidden border border-white/15 shadow-2xl cursor-pointer"
            >
              <img src="/screen-jasny.png" alt="Motyw jasny Rift Daily" className="w-full h-auto block" />
            </button>

            {/* Center hero phone */}
            <div className="relative z-10 w-[235px] sm:w-[255px] animate-float-slow rounded-[34px] overflow-hidden border border-white/20 glow-titanium">
              <img
                src={current.src}
                alt={current.title}
                className="w-full h-auto block transition-opacity duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Screen Explorer */}
      <section id="showcase" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass-card rounded-[32px] p-6 sm:p-10 lg:p-12 glow-titanium">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-white/[0.07]">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-400 font-bold">
                Interaktywny podgląd
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                4 zakładki. Zero zbędnego chaosu.
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-black/50 border border-white/[0.08]">
              {(Object.keys(SCREENS) as ScreenId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setActiveScreen(id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeScreen === id
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {SCREENS[id].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-8">
            <div className="lg:col-span-6 space-y-5">
              <span className="inline-block text-[10px] font-mono font-bold tracking-[0.18em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-md">
                {current.tag}
              </span>
              <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                {current.title}
              </h3>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                {current.desc}
              </p>
              <ul className="space-y-3 pt-2">
                {current.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="w-[260px] sm:w-[295px] rounded-[36px] overflow-hidden border border-white/15 shadow-2xl bg-black">
                <img
                  src={current.src}
                  alt={current.title}
                  className="w-full h-auto block"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bento Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-2xl mb-12">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold">
            Funkcje v3.1.2
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-2">
            Zaprojektowane z myślą o codziennym rytmie studiów.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: RefreshCw,
              title: 'Pamięć podręczna + sync w tle',
              desc: 'Dane ładują się natychmiast z lokalnego dysku, a dyskretny pasek informuje o aktualizacji w tle i potwierdza pobranie najnowszych ocen.',
            },
            {
              icon: Calendar,
              title: 'Karuzela dat i okienka',
              desc: 'Płynne przewijanie dat, szybki powrót do „DZIŚ”, odliczanie do najbliższych zajęć i automatyczne wykrywanie przerw między nimi.',
            },
            {
              icon: GraduationCap,
              title: 'Średnia ECTS i symulator What-If',
              desc: 'Wyliczanie średniej ważonej w czasie rzeczywistym, filtry ocen w protokołach oraz symulacja wpływu przyszłych egzaminów na średnią.',
            },
            {
              icon: CreditCard,
              title: 'mLegitymacja, raty i IBAN',
              desc: 'Cyfrowa legitymacja studencka, nadchodzące terminy płatności z kopiowaniem numeru konta jednym kliknięciem oraz ankiety USOS.',
            },
            {
              icon: Bell,
              title: 'Lokalne alerty i zmiany planu',
              desc: 'Powiadomienia o nowej ocenie w protokole, zmianie sali lub godziny zajęć oraz przypomnienia przed wykładami na iOS i Androidzie.',
            },
            {
              icon: Sun,
              title: 'Obsidian & Paper + Face ID',
              desc: 'Pełna parytetowość motywu ciemnego i jasnego, kompaktowy szklany pasek nawigacji oraz opcjonalna blokada Face ID / PIN.',
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between gap-5"
            >
              <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white">
                <feat.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mt-2">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Zero-Secret Security Architecture */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass-card rounded-[32px] p-8 sm:p-12 border border-emerald-500/20 glow-emerald">
          <div className="max-w-2xl mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>Architektura Zero-Secret</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Twoje dane nigdy nie trafiają do naszej bazy. Bo jej nie mamy.
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-3 leading-relaxed">
              Rift Daily działa w modelu bezstanowym. Serwer BFF jedynie podpisuje kryptograficzne zapytania OAuth 1.0a w locie (z ochroną anty-SSRF, ścisłą listą 19 metod read-only i rate-limitingiem), a zaszyfrowana sesja AES-256-GCM zostaje wyłącznie w sprzętowym Keychain Twojego telefonu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-black/45 border border-white/[0.08] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Smartphone className="w-5 h-5 text-white" />
                <span className="text-[11px] font-mono text-zinc-500">01 / KLIENT</span>
              </div>
              <h3 className="font-bold text-white">iOS Keychain & Android Keystore</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Zero sekretów w kodzie aplikacji mobilnej. Token sesji i PIN przechowywane są wyłącznie w sprzętowej enklawie urządzenia.
              </p>
            </div>

            <div className="rounded-2xl bg-black/45 border border-emerald-500/25 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Server className="w-5 h-5 text-emerald-400" />
                <span className="text-[11px] font-mono text-emerald-400">02 / PROXY BFF</span>
              </div>
              <h3 className="font-bold text-white">Bezstanowe Proxy (AES-256-GCM)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Klucze USOS żyją wyłącznie w zmiennych środowiskowych serwera. Weryfikacja hosta, 60-sekundowy cache i ochrona przed spamem zapytań.
              </p>
            </div>

            <div className="rounded-2xl bg-black/45 border border-white/[0.08] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Lock className="w-5 h-5 text-white" />
                <span className="text-[11px] font-mono text-zinc-500">03 / UCZELNIA</span>
              </div>
              <h3 className="font-bold text-white">Oficjalne USOS API (Read-Only)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Logowanie odbywa się bezpośrednio na portalu CAS uczelni. Aplikacja korzysta wyłącznie z odczytu — nigdy nie modyfikuje danych w USOS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Interactive University Compatibility Finder */}
      <section id="universities" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold">
              Kompatybilność
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-2">
              Sprawdź swoją uczelnię
            </h2>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={uniQuery}
              onChange={(e) => setUniQuery(e.target.value)}
              placeholder="Szukaj np. UKEN, AGH, UJ, Kraków..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400/60 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredUniversities.map((u) => (
            <div
              key={u.short}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-white/15 px-4 py-3.5 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-sm text-white">{u.short}</span>
                  <span className="text-[11px] text-zinc-500">· {u.city}</span>
                </div>
                <div className="text-xs text-zinc-400 truncate mt-0.5">{u.name}</div>
              </div>
              <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                USOS API
              </span>
            </div>
          ))}
        </div>

        {filteredUniversities.length === 0 && (
          <div className="text-center py-10 text-sm text-zinc-400 glass-card rounded-2xl mt-4">
            Aplikacja automatycznie pobiera pełny katalog <b>ponad 50 polskich uczelni USOS</b> bezpośrednio po uruchomieniu.
          </div>
        )}
      </section>

      {/* 7. Download CTA Section */}
      <section id="download" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="glass-card rounded-[36px] p-8 sm:p-14 text-center space-y-6 border border-white/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-mono text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rift Daily v3.1.2 · Open Source</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Gotowy na szybszy USOS?
          </h2>

          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Pobierz aplikację na iPhone&apos;a z App Store lub zainstaluj podpisane wydanie APK na Androida prosto z GitHub Releases.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <a
              href="https://apps.apple.com/app/id6837895381"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm transition-all active:scale-95"
            >
              <Apple className="w-4 h-4 fill-current" />
              <span>Pobierz z App Store</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="https://github.com/matiqueue/rift-daily/releases/latest/download/RiftDaily.apk"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Pobierz RiftDaily.apk</span>
            </a>

            <a
              href="https://github.com/matiqueue/rift-daily"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 text-sm font-bold transition-all"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Kod źródłowy</span>
            </a>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><Fingerprint className="w-3.5 h-3.5" /> Face ID / Biometria</span>
            <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Expo SDK 58</span>
            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> 100% Darmowe</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Automatyczny build CI/CD</span>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-white/[0.07] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2.5">
            <img src="/icon.png" alt="Rift Daily" className="w-5 h-5 rounded-md" />
            <span>© 2026 Szymon Góral · Rift Daily v3.1.2</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button
              onClick={() => navigateLegal('privacy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Polityka prywatności
            </button>
            <button
              onClick={() => navigateLegal('terms')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Regulamin
            </button>
            <button
              onClick={() => navigateLegal('support')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Pomoc i kontakt
            </button>
            <a
              href="https://github.com/matiqueue/rift-daily"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
