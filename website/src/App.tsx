import { useEffect, useMemo, useState } from 'react';
import { LegalPage, LegalRoute } from './components/LegalPages';

function resolveLegalRoute(pathname: string): LegalRoute | null {
  const clean = pathname.replace(/\/+$/, '').toLowerCase();
  if (clean === '/privacy') return 'privacy';
  if (clean === '/terms') return 'terms';
  if (clean === '/support') return 'support';
  return null;
}

type ChapterId = 'dzis' | 'plan' | 'dziennik' | 'wiecej' | 'jasny';

interface Chapter {
  id: ChapterId;
  num: string;
  tab: string;
  headline: string;
  summary: string;
  telemetry: string;
  src: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 'dzis',
    num: '01',
    tab: 'Dziś',
    headline: 'Otwierasz i od razu wiesz, gdzie idziesz.',
    summary:
      'Przyklejony nagłówek, trwające i najbliższe zajęcia na osi czasu oraz natychmiastowy start z lokalnej pamięci podręcznej (<200 ms) z dyskretną pigułką aktualizacji w tle.',
    telemetry: 'CACHE <200MS · LIVE HERO · BACKGROUND SYNC',
    src: '/screen-dzis.png',
  },
  {
    id: 'plan',
    num: '02',
    tab: 'Plan',
    headline: 'Karuzela dat jak w iOS Timer. Zero strzałek.',
    summary:
      'Przesuwaj dni kciukiem z haptyką, wracaj jednym tapnięciem do „DZIŚ”, sprawdzaj okienka między zajęciami, sale i wizytówki prowadzących.',
    telemetry: 'DATE WHEEL · HAPTICS · SOLO DZIŚ',
    src: '/screen-plan.png',
  },
  {
    id: 'dziennik',
    num: '03',
    tab: 'Dziennik',
    headline: 'Średnia ważona ECTS i symulator What-If.',
    summary:
      'Otwarta typografia zamiast ciężkich boksów: rozkład ocen z protokołów, filtry semestralne i natychmiastowa symulacja wpływu kolejnych egzaminów na średnią.',
    telemetry: 'GPA ENGINE · ECTS WEIGHTS · WHAT-IF',
    src: '/screen-dziennik.png',
  },
  {
    id: 'wiecej',
    num: '04',
    tab: 'Więcej',
    headline: 'mLegitymacja, raty IBAN, egzaminy i Face ID.',
    summary:
      'Wszystkie narzędzia studenckie pod ręką w przejrzystej macierzy hairline — w tym jednorazowe trwałe czyszczenie danych lokalnych zgodne z RODO.',
    telemetry: 'ELS CARD · IBAN COPY · FACE ID / PIN',
    src: '/screen-wiecej.png',
  },
  {
    id: 'jasny',
    num: '05',
    tab: 'Paper Mode',
    headline: 'Obsidian w nocy. Paper w pełnym słońcu.',
    summary:
      'Pełna parytetowość motywu ciemnego i jasnego, zwarty czarny szklany pasek nawigacji oraz zero reklam na żadnym ekranie.',
    telemetry: 'OBSIDIAN / PAPER · GLASS NAVBAR',
    src: '/screen-jasny.png',
  },
];

const SPECS = [
  {
    num: '01',
    title: 'Natychmiastowy start z pamięci',
    detail:
      'Lokalna migawka danych akademickich w expo-file-system renderuje plan i oceny w <200 ms. Podczas cichej synchronizacji w tle pigułka u góry informuje o pobraniu nowych danych.',
    tag: 'OFFLINE-FIRST',
  },
  {
    num: '02',
    title: 'Architektura Zero-Secret BFF',
    detail:
      'W aplikacji mobilnej nie ma ani jednego sekretu API. Bezstanowe proxy podpisuje żądania OAuth 1.0a w locie, a zaszyfrowana sesja AES-256-GCM zostaje w sprzętowym Keychain.',
    tag: 'AES-256-GCM',
  },
  {
    num: '03',
    title: 'Ścisły tryb Read-Only (19 metod)',
    detail:
      'Aplikacja wyłącznie odczytuje dane z oficjalnego USOS API — posiada serwerową ochronę anty-SSRF, limit 16 KB, 60-sekundowy cache deduplikacji i rate limiting.',
    tag: 'ZERO DATABASE',
  },
  {
    num: '04',
    title: 'Lokalne alerty i zmiany planu',
    detail:
      'Wykrywanie nowych ocen w protokołach, zmian sal, godzin zajęć i terminów rat z powiadomieniami iOS/Android oraz odświeżaniem w tle.',
    tag: 'BACKGROUND TASK',
  },
  {
    num: '05',
    title: '100% darmowe, open-source i bez reklam',
    detail:
      'Kod źródłowy jest w pełni publiczny na GitHubie, a każde wydanie przechodzi automatyczny CI/CD (TypeScript, ESLint, Vitest, podpisany build).',
    tag: 'VERIFIED CI/CD',
  },
];

const UNIVERSITIES = [
  { code: 'UKEN', city: 'Kraków', name: 'Uniwersytet Komisji Edukacji Narodowej' },
  { code: 'AGH', city: 'Kraków', name: 'Akademia Górniczo-Hutnicza' },
  { code: 'UJ', city: 'Kraków', name: 'Uniwersytet Jagielloński' },
  { code: 'UEK', city: 'Kraków', name: 'Uniwersytet Ekonomiczny' },
  { code: 'UW', city: 'Warszawa', name: 'Uniwersytet Warszawski' },
  { code: 'PW', city: 'Warszawa', name: 'Politechnika Warszawska' },
  { code: 'SGH', city: 'Warszawa', name: 'Szkoła Główna Handlowa' },
  { code: 'UAM', city: 'Poznań', name: 'Uniwersytet im. Adama Mickiewicza' },
  { code: 'PWr', city: 'Wrocław', name: 'Politechnika Wrocławska' },
  { code: 'UWr', city: 'Wrocław', name: 'Uniwersytet Wrocławski' },
  { code: 'UMK', city: 'Toruń', name: 'Uniwersytet Mikołaja Kopernika' },
  { code: 'PG', city: 'Gdańsk', name: 'Politechnika Gdańska' },
  { code: 'UŚ', city: 'Katowice', name: 'Uniwersytet Śląski' },
  { code: 'KUL', city: 'Lublin', name: 'Katolicki Uniwersytet Lubelski' },
  { code: 'UPJP2', city: 'Kraków', name: 'Uniwersytet Papieski Jana Pawła II' },
  { code: 'AWF', city: 'Kraków', name: 'Akademia Wychowania Fizycznego' },
];

export default function App() {
  const [legalRoute, setLegalRoute] = useState<LegalRoute | null>(() =>
    resolveLegalRoute(window.location.pathname)
  );
  const [mode, setMode] = useState<'obsidian' | 'paper'>('obsidian');
  const [activeId, setActiveId] = useState<ChapterId>('dzis');
  const [uniFilter, setUniFilter] = useState('');

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

  const filteredUnis = useMemo(() => {
    const q = uniFilter.trim().toLowerCase();
    if (!q) return UNIVERSITIES;
    return UNIVERSITIES.filter(
      (u) =>
        u.code.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q)
    );
  }, [uniFilter]);

  if (legalRoute) {
    return (
      <LegalPage
        route={legalRoute}
        onNavigateHome={() => navigateLegal(null)}
        onNavigate={(r) => navigateLegal(r)}
      />
    );
  }

  const activeChapter = CHAPTERS.find((c) => c.id === activeId) || CHAPTERS[0];

  return (
    <div className={`${mode === 'obsidian' ? 'theme-obsidian' : 'theme-paper'} editorial-bg min-h-screen`}>
      {/* 1. Architectural Top Bar — pure 1px hairline discipline */}
      <header className="sticky top-0 z-50 backdrop-blur-xl hairline-b" style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 82%, transparent)' }}>
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/icon.png"
              alt="Rift Daily"
              className="w-6 h-6 rounded-[6px] hairline-all"
            />
            <span className="font-mono text-xs font-bold tracking-[0.14em] uppercase">
              RIFT DAILY
            </span>
            <span className="hidden sm:inline font-mono text-[11px]" style={{ color: 'var(--fg-subtle)' }}>
              // v3.1.2
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-mono text-[11px] tracking-[0.12em] uppercase" style={{ color: 'var(--fg-muted)' }}>
            <a href="#interfejs" className="hover:opacity-100 opacity-75 transition-opacity">Interfejs</a>
            <a href="#architektura" className="hover:opacity-100 opacity-75 transition-opacity">Specyfikacja</a>
            <a href="#uczelnie" className="hover:opacity-100 opacity-75 transition-opacity">Uczelnie</a>
            <a href="#pobierz" className="hover:opacity-100 opacity-75 transition-opacity">Pobierz</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMode((m) => (m === 'obsidian' ? 'paper' : 'obsidian'))}
              className="font-mono text-[10px] tracking-[0.14em] uppercase px-2.5 py-1 hairline-all cursor-pointer transition-opacity hover:opacity-80"
              style={{ color: 'var(--fg-muted)' }}
            >
              {mode === 'obsidian' ? 'PAPER ○' : 'OBSIDIAN ●'}
            </button>

            <a
              href="https://apps.apple.com/app/id6837895381"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] font-bold tracking-[0.14em] uppercase px-3 py-1.5 transition-opacity hover:opacity-85"
              style={{ backgroundColor: 'var(--invert-bg)', color: 'var(--invert-fg)' }}
            >
              APP STORE ↗
            </a>
          </div>
        </div>
      </header>

      {/* 2. Editorial Masthead Hero */}
      <section className="max-w-[1320px] mx-auto px-5 sm:px-8 pt-14 pb-16 lg:pt-20 lg:pb-24">
        {/* Live Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 hairline-b font-mono text-[11px] tracking-[0.1em] uppercase" style={{ color: 'var(--fg-muted)' }}>
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
            <span>POLSKI E-DZIENNIK USOS API</span>
          </div>
          <div className="flex items-center gap-5">
            <span>50+ UCZELNI</span>
            <span>ZERO REKLAM</span>
            <span>OAUTH 1.0A</span>
          </div>
        </div>

        {/* Giant Asymmetric Title + Action Rail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 lg:pt-14 items-end">
          <div className="lg:col-span-8">
            <h1 className="text-[clamp(2.8rem,7.8vw,6.8rem)] font-black leading-[0.94] tracking-[-0.045em]">
              Plan, oceny
              <br />
              i USOS bez
              <br />
              <span style={{ color: 'var(--fg-muted)' }}>zbędnego szumu.</span>
            </h1>
          </div>

          <div className="lg:col-span-4 space-y-6 lg:pb-2">
            <p className="text-sm sm:text-[15px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
              Niezależny, natywny klient akademicki na iOS i Androida. Zaprojektowany jak precyzyjny instrument — ładuje dane z pamięci w ułamku sekundy i aktualizuje się cicho w tle.
            </p>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5">
              <a
                href="https://apps.apple.com/app/id6837895381"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-5 py-3.5 font-mono text-xs font-bold tracking-[0.1em] uppercase transition-opacity hover:opacity-85"
                style={{ backgroundColor: 'var(--invert-bg)', color: 'var(--invert-fg)' }}
              >
                <span>Pobierz na iOS (App Store)</span>
                <span>↗</span>
              </a>

              <a
                href="https://github.com/matiqueue/rift-daily/releases/latest/download/RiftDaily.apk"
                className="flex items-center justify-between px-5 py-3.5 font-mono text-xs font-bold tracking-[0.1em] uppercase hairline-all transition-opacity hover:opacity-75"
              >
                <span>Pobierz APK (Android)</span>
                <span>↓</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Full-Bleed Interactive Interface Stage (NO shadcn cards!) */}
      <section id="interfejs" className="hairline-t hairline-b drafting-bg">
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Vertical Editorial Chapter Index */}
          <div className="lg:col-span-6 lg:hairline-r px-5 sm:px-8 py-12 lg:py-16 flex flex-col justify-between" style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 92%, transparent)' }}>
            <div>
              <div className="font-mono text-[11px] tracking-[0.16em] uppercase mb-8" style={{ color: 'var(--fg-subtle)' }}>
                INTERFEJS — 4 ZAKŁADKI + DUAL THEME
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {CHAPTERS.map((ch) => {
                  const isActive = ch.id === activeId;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setActiveId(ch.id)}
                      className="w-full text-left py-5 flex items-baseline justify-between gap-4 group cursor-pointer transition-opacity"
                      style={{
                        borderColor: 'var(--line)',
                        opacity: isActive ? 1 : 0.48,
                      }}
                    >
                      <div className="flex items-baseline gap-4">
                        <span className="font-mono text-xs" style={{ color: isActive ? 'var(--accent)' : 'var(--fg-subtle)' }}>
                          {ch.num}
                        </span>
                        <span className="text-xl sm:text-2xl font-bold tracking-tight">
                          {ch.tab}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] tracking-[0.12em] uppercase hidden sm:inline" style={{ color: 'var(--fg-muted)' }}>
                        {isActive ? 'AKTYWNY ●' : 'PODGLĄD →'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Chapter Editorial Note */}
            <div className="pt-10 mt-8 hairline-t space-y-3">
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase" style={{ color: 'var(--accent)' }}>
                {activeChapter.telemetry}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                {activeChapter.headline}
              </h2>
              <p className="text-sm leading-relaxed max-w-lg" style={{ color: 'var(--fg-muted)' }}>
                {activeChapter.summary}
              </p>
            </div>
          </div>

          {/* Right: Frameless Hardware Stage */}
          <div className="lg:col-span-6 px-5 sm:px-8 py-14 lg:py-20 flex flex-col items-center justify-center relative">
            <div className="w-[270px] sm:w-[310px] rounded-[44px] overflow-hidden phone-chassis bg-black transition-all duration-300">
              <img
                key={activeChapter.src}
                src={activeChapter.src}
                alt={`Rift Daily — ${activeChapter.tab}`}
                className="w-full h-auto block"
              />
            </div>

            <div className="mt-7 font-mono text-[10px] tracking-[0.16em] uppercase flex items-center gap-3" style={{ color: 'var(--fg-subtle)' }}>
              <span>EKRAN {activeChapter.num} / 05</span>
              <span>·</span>
              <span>PRAWDZIWY WIDOK APLIKACJI v3.1.2</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Architectural Hairline Spec Ledger (Zero Boxes) */}
      <section id="architektura" className="max-w-[1320px] mx-auto px-5 sm:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 hairline-b">
          <div className="lg:col-span-5">
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase mb-3" style={{ color: 'var(--fg-subtle)' }}>
              SPECYFIKACJA TECHNICZNA
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.03em] leading-[1.02]">
              Bez bazy danych.
              <br />
              Bez sekretów w kliencie.
            </h2>
          </div>

          {/* Minimalist Schematic Signal Path */}
          <div className="lg:col-span-7 flex flex-col justify-end">
            <div className="font-mono text-xs sm:text-[13px] p-5 hairline-all space-y-2" style={{ backgroundColor: 'var(--bg-elev)' }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">[ iPhone Keychain ]</span>
                <span style={{ color: 'var(--fg-subtle)' }}>── AES-256-GCM ──▶</span>
                <span className="font-bold" style={{ color: 'var(--accent)' }}>[ Stateless BFF ]</span>
                <span style={{ color: 'var(--fg-subtle)' }}>── OAuth 1.0a ──▶</span>
                <span className="font-bold">[ USOS Uczelni ]</span>
              </div>
              <div className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                19 read-only endpoints · anti-SSRF host guard · 60s deduplication cache · zero student PII persisted on server
              </div>
            </div>
          </div>
        </div>

        {/* Hairline Rows */}
        <div>
          {SPECS.map((spec) => (
            <div
              key={spec.num}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 py-7 hairline-b items-baseline"
            >
              <div className="md:col-span-1 font-mono text-xs" style={{ color: 'var(--fg-subtle)' }}>
                {spec.num}
              </div>
              <div className="md:col-span-4 text-lg sm:text-xl font-bold tracking-tight">
                {spec.title}
              </div>
              <div className="md:col-span-5 text-sm leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
                {spec.detail}
              </div>
              <div className="md:col-span-2 md:text-right font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: 'var(--accent)' }}>
                {spec.tag}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Editorial University Directory */}
      <section id="uczelnie" className="hairline-t" style={{ backgroundColor: 'var(--bg-elev)' }}>
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 py-20 lg:py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 hairline-b">
            <div>
              <div className="font-mono text-[11px] tracking-[0.16em] uppercase mb-2" style={{ color: 'var(--fg-subtle)' }}>
                KOMPATYBILNOŚĆ USOS API
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em]">
                Ponad 50 uczelni w Polsce.
              </h2>
            </div>

            <div className="w-full md:w-80">
              <input
                type="text"
                value={uniFilter}
                onChange={(e) => setUniFilter(e.target.value)}
                placeholder="Filtruj: UKEN, AGH, UJ, Kraków..."
                className="w-full bg-transparent pb-2.5 text-sm font-mono focus:outline-none hairline-b"
                style={{ color: 'var(--fg)', borderColor: 'var(--line-strong)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {filteredUnis.map((u) => (
              <div key={u.code} className="py-5 pr-6 hairline-b flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-extrabold tracking-tight">{u.code}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--fg-subtle)' }}>
                    {u.city}
                  </span>
                </div>
                <span className="text-xs leading-snug" style={{ color: 'var(--fg-muted)' }}>
                  {u.name}
                </span>
              </div>
            ))}
          </div>

          {filteredUnis.length === 0 && (
            <p className="py-10 font-mono text-xs" style={{ color: 'var(--fg-muted)' }}>
              Pełna lista ponad 50 uczelni USOS pobierana jest automatycznie w aplikacji.
            </p>
          )}
        </div>
      </section>

      {/* 6. Monumental Download & Legal Footer */}
      <footer id="pobierz" className="hairline-t">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-14 hairline-b">
            <div className="lg:col-span-7">
              <div className="font-mono text-[11px] tracking-[0.16em] uppercase mb-3" style={{ color: 'var(--accent)' }}>
                WYDANIE v3.1.2 · OPEN SOURCE
              </div>
              <h2 className="text-4xl sm:text-6xl font-black tracking-[-0.04em] leading-[0.98]">
                Zacznij korzystać
                <br />
                z Rift Daily.
              </h2>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="https://apps.apple.com/app/id6837895381"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-4 font-mono text-xs font-bold tracking-[0.1em] uppercase flex items-center justify-between transition-opacity hover:opacity-85"
                style={{ backgroundColor: 'var(--invert-bg)', color: 'var(--invert-fg)' }}
              >
                <span>App Store</span>
                <span>↗</span>
              </a>
              <a
                href="https://github.com/matiqueue/rift-daily/releases/latest/download/RiftDaily.apk"
                className="px-5 py-4 font-mono text-xs font-bold tracking-[0.1em] uppercase hairline-all flex items-center justify-between transition-opacity hover:opacity-75"
              >
                <span>Android APK</span>
                <span>↓</span>
              </a>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-[11px]" style={{ color: 'var(--fg-subtle)' }}>
            <span>© 2026 SZYMON GÓRAL · RIFT DAILY</span>
            <div className="flex flex-wrap items-center gap-6 uppercase tracking-[0.1em]">
              <button onClick={() => navigateLegal('privacy')} className="hover:opacity-100 opacity-80 cursor-pointer">
                Prywatność
              </button>
              <button onClick={() => navigateLegal('terms')} className="hover:opacity-100 opacity-80 cursor-pointer">
                Regulamin
              </button>
              <button onClick={() => navigateLegal('support')} className="hover:opacity-100 opacity-80 cursor-pointer">
                Pomoc
              </button>
              <a
                href="https://github.com/matiqueue/rift-daily"
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-100 opacity-80"
              >
                GitHub ↗
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
