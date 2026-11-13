import { ImageSourcePropType } from 'react-native';

export interface UsosInstallation {
  id: string;
  shortName: string;
  namePl: string;
  nameEn: string;
  city: string;
  baseUrl: string;
  version?: string;
  accentColor: string;
  iconSource?: ImageSourcePropType;
  logoUrl?: string;
  defaultConsumerKey?: string;
  defaultConsumerSecret?: string;
  isFeatured?: boolean;
}

/**
 * Curated catalog of Polish universities running USOS API, with
 * UKEN w Krakowie (Uniwersytet Komisji Edukacji Narodowej w Krakowie) as #1 Top 1,
 * bundled local university icons (`assets/universities/*.png`), and pre-provisioned OAuth 1.0a Consumer Keys.
 */
export const DEFAULT_USOS_INSTALLATIONS: UsosInstallation[] = [
  {
    id: 'uken',
    shortName: 'UKEN',
    namePl: 'Uniwersytet Komisji Edukacji Narodowej w Krakowie',
    nameEn: 'University of the National Education Commission, Krakow',
    city: 'Kraków',
    baseUrl: 'https://usosapps.uken.krakow.pl/',
    accentColor: '#1D4ED8',
    iconSource: require('@/assets/universities/uken.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=uken.krakow.pl&sz=128',
    defaultConsumerKey: process.env.EXPO_PUBLIC_USOS_KEY_UKEN || '',
    defaultConsumerSecret: process.env.EXPO_PUBLIC_USOS_SECRET_UKEN || '',
    isFeatured: true,
  },
  {
    id: 'uj',
    shortName: 'UJ',
    namePl: 'Uniwersytet Jagielloński w Krakowie',
    nameEn: 'Jagiellonian University in Kraków',
    city: 'Kraków',
    baseUrl: 'https://apps.usos.uj.edu.pl/',
    accentColor: '#1E40AF',
    iconSource: require('@/assets/universities/uj.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=uj.edu.pl&sz=128',
    defaultConsumerKey: process.env.EXPO_PUBLIC_USOS_KEY_UJ || '',
    defaultConsumerSecret: process.env.EXPO_PUBLIC_USOS_SECRET_UJ || '',
    isFeatured: true,
  },
  {
    id: 'uek',
    shortName: 'UEK',
    namePl: 'Uniwersytet Ekonomiczny w Krakowie',
    nameEn: 'Krakow University of Economics',
    city: 'Kraków',
    baseUrl: 'https://appsusos.uek.krakow.pl/',
    accentColor: '#7C3AED',
    iconSource: require('@/assets/universities/uek.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=uek.krakow.pl&sz=128',
    defaultConsumerKey: process.env.EXPO_PUBLIC_USOS_KEY_UEK || '',
    defaultConsumerSecret: process.env.EXPO_PUBLIC_USOS_SECRET_UEK || '',
    isFeatured: true,
  },
  {
    id: 'urk',
    shortName: 'URK',
    namePl: 'Uniwersytet Rolniczy im. Hugona Kołłątaja w Krakowie',
    nameEn: 'University of Agriculture in Krakow',
    city: 'Kraków',
    baseUrl: 'https://usosapi.ur.krakow.pl/',
    accentColor: '#059669',
    iconSource: require('@/assets/universities/urk.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=urk.edu.pl&sz=128',
    isFeatured: true,
  },
  {
    id: 'upjp2',
    shortName: 'UPJP2',
    namePl: 'Uniwersytet Papieski Jana Pawła II w Krakowie',
    nameEn: 'The Pontifical University of John Paul II in Krakow',
    city: 'Kraków',
    baseUrl: 'https://usosapi.upjp2.edu.pl/',
    accentColor: '#D97706',
    iconSource: require('@/assets/universities/upjp2.png'),
    defaultConsumerKey: process.env.EXPO_PUBLIC_USOS_KEY_UPJP2 || '',
    defaultConsumerSecret: process.env.EXPO_PUBLIC_USOS_SECRET_UPJP2 || '',
  },
  {
    id: 'awf_krk',
    shortName: 'AWF',
    namePl: 'Akademia Wychowania Fizycznego w Krakowie',
    nameEn: 'University of Physical Education in Krakow',
    city: 'Kraków',
    baseUrl: 'https://usosapi.awf.krakow.pl/',
    accentColor: '#0284C7',
    iconSource: require('@/assets/universities/awf_krk.png'),
    defaultConsumerKey: process.env.EXPO_PUBLIC_USOS_KEY_AWF_KRK || '',
    defaultConsumerSecret: process.env.EXPO_PUBLIC_USOS_SECRET_AWF_KRK || '',
  },
  {
    id: 'uw',
    shortName: 'UW',
    namePl: 'Uniwersytet Warszawski',
    nameEn: 'University of Warsaw',
    city: 'Warszawa',
    baseUrl: 'https://usosapps.uw.edu.pl/',
    accentColor: '#2563EB',
    iconSource: require('@/assets/universities/uw.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=uw.edu.pl&sz=128',
    isFeatured: true,
  },
  {
    id: 'pw',
    shortName: 'PW',
    namePl: 'Politechnika Warszawska',
    nameEn: 'Warsaw University of Technology',
    city: 'Warszawa',
    baseUrl: 'https://apps.usos.pw.edu.pl/',
    accentColor: '#EA580C',
    iconSource: require('@/assets/universities/pw.png'),
    defaultConsumerKey: process.env.EXPO_PUBLIC_USOS_KEY_PW || '',
    defaultConsumerSecret: process.env.EXPO_PUBLIC_USOS_SECRET_PW || '',
    isFeatured: true,
  },
  {
    id: 'uam',
    shortName: 'UAM',
    namePl: 'Uniwersytet im. Adama Mickiewicza w Poznaniu',
    nameEn: 'Adam Mickiewicz University, Poznań',
    city: 'Poznań',
    baseUrl: 'https://usosapps.amu.edu.pl/',
    accentColor: '#0284C7',
    iconSource: require('@/assets/universities/uam.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=amu.edu.pl&sz=128',
    defaultConsumerKey: process.env.EXPO_PUBLIC_USOS_KEY_UAM || '',
    defaultConsumerSecret: process.env.EXPO_PUBLIC_USOS_SECRET_UAM || '',
    isFeatured: true,
  },
  {
    id: 'pwr',
    shortName: 'PWr',
    namePl: 'Politechnika Wrocławska',
    nameEn: 'Wrocław University of Science and Technology',
    city: 'Wrocław',
    baseUrl: 'https://apps.usos.pwr.edu.pl/',
    accentColor: '#DC2626',
    iconSource: require('@/assets/universities/pwr.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=pwr.edu.pl&sz=128',
    isFeatured: true,
  },
  {
    id: 'uwr',
    shortName: 'UWr',
    namePl: 'Uniwersytet Wrocławski',
    nameEn: 'University of Wrocław',
    city: 'Wrocław',
    baseUrl: 'https://usosapps.uni.wroc.pl/',
    accentColor: '#0EA5E9',
    iconSource: require('@/assets/universities/uwr.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=uni.wroc.pl&sz=128',
  },
  {
    id: 'pp',
    shortName: 'PP',
    namePl: 'Politechnika Poznańska',
    nameEn: 'Poznań University of Technology',
    city: 'Poznań',
    baseUrl: 'https://usosapps.put.poznan.pl/',
    accentColor: '#2563EB',
    iconSource: require('@/assets/universities/pp.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=put.poznan.pl&sz=128',
  },
  {
    id: 'umk',
    shortName: 'UMK',
    namePl: 'Uniwersytet Mikołaja Kopernika w Toruniu',
    nameEn: 'Nicolaus Copernicus University in Toruń',
    city: 'Toruń',
    baseUrl: 'https://usosapps.umk.pl/',
    accentColor: '#4F46E5',
    iconSource: require('@/assets/universities/umk.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=umk.pl&sz=128',
    defaultConsumerKey: process.env.EXPO_PUBLIC_USOS_KEY_UMK || '',
    defaultConsumerSecret: process.env.EXPO_PUBLIC_USOS_SECRET_UMK || '',
  },
  {
    id: 'us',
    shortName: 'UŚ',
    namePl: 'Uniwersytet Śląski w Katowicach',
    nameEn: 'University of Silesia in Katowice',
    city: 'Katowice',
    baseUrl: 'https://usosapps.us.edu.pl/',
    accentColor: '#0891B2',
    iconSource: require('@/assets/universities/us.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=us.edu.pl&sz=128',
  },
  {
    id: 'polsl',
    shortName: 'PŚ',
    namePl: 'Politechnika Śląska',
    nameEn: 'Silesian University of Technology',
    city: 'Gliwice',
    baseUrl: 'https://usosapps.polsl.pl/',
    accentColor: '#1E40AF',
    iconSource: require('@/assets/universities/polsl.png'),
  },
  {
    id: 'ul',
    shortName: 'UŁ',
    namePl: 'Uniwersytet Łódzki',
    nameEn: 'University of Łódź',
    city: 'Łódź',
    baseUrl: 'https://usosapps.uni.lodz.pl/',
    accentColor: '#E11D48',
    iconSource: require('@/assets/universities/ul.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=uni.lodz.pl&sz=128',
  },
  {
    id: 'umcs',
    shortName: 'UMCS',
    namePl: 'Uniwersytet Marii Curie-Skłodowskiej w Lublinie',
    nameEn: 'Maria Curie-Skłodowska University',
    city: 'Lublin',
    baseUrl: 'https://apps.umcs.pl/',
    accentColor: '#059669',
    iconSource: require('@/assets/universities/umcs.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=umcs.pl&sz=128',
  },
  {
    id: 'wum',
    shortName: 'WUM',
    namePl: 'Warszawski Uniwersytet Medyczny',
    nameEn: 'Medical University of Warsaw',
    city: 'Warszawa',
    baseUrl: 'https://usosapps.wum.edu.pl/',
    accentColor: '#10B981',
    iconSource: require('@/assets/universities/wum.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=wum.edu.pl&sz=128',
  },
  {
    id: 'sggw',
    shortName: 'SGGW',
    namePl: 'Szkoła Główna Gospodarstwa Wiejskiego w Warszawie',
    nameEn: 'Warsaw University of Life Sciences',
    city: 'Warszawa',
    baseUrl: 'https://usosapps.sggw.edu.pl/',
    accentColor: '#16A34A',
    iconSource: require('@/assets/universities/sggw.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=sggw.edu.pl&sz=128',
  },
  {
    id: 'uksw',
    shortName: 'UKSW',
    namePl: 'Uniwersytet Kardynała Stefana Wyszyńskiego w Warszawie',
    nameEn: 'Cardinal Stefan Wyszyński University',
    city: 'Warszawa',
    baseUrl: 'https://usosapps.uksw.edu.pl/',
    accentColor: '#7C3AED',
    iconSource: require('@/assets/universities/uksw.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=uksw.edu.pl&sz=128',
  },
  {
    id: 'pb',
    shortName: 'PB',
    namePl: 'Politechnika Białostocka',
    nameEn: 'Bialystok University of Technology',
    city: 'Białystok',
    baseUrl: 'https://usos-apps.uci.pb.edu.pl/',
    accentColor: '#0D9488',
    iconSource: require('@/assets/universities/pb.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=pb.edu.pl&sz=128',
  },
  {
    id: 'uwb',
    shortName: 'UwB',
    namePl: 'Uniwersytet w Białymstoku',
    nameEn: 'University of Bialystok',
    city: 'Białystok',
    baseUrl: 'https://usosapps.uwb.edu.pl/',
    accentColor: '#3B82F6',
    iconSource: require('@/assets/universities/uwb.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=uwb.edu.pl&sz=128',
  },
  {
    id: 'prz',
    shortName: 'PRz',
    namePl: 'Politechnika Rzeszowska',
    nameEn: 'Rzeszów University of Technology',
    city: 'Rzeszów',
    baseUrl: 'https://usosapps.prz.edu.pl/',
    accentColor: '#2563EB',
    iconSource: require('@/assets/universities/prz.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=prz.edu.pl&sz=128',
  },
  {
    id: 'uew',
    shortName: 'UEW',
    namePl: 'Uniwersytet Ekonomiczny we Wrocławiu',
    nameEn: 'Wroclaw University of Economics and Business',
    city: 'Wrocław',
    baseUrl: 'https://usosapps.ue.wroc.pl/',
    accentColor: '#D97706',
    iconSource: require('@/assets/universities/uew.png'),
    logoUrl: 'https://www.google.com/s2/favicons?domain=ue.wroc.pl&sz=128',
  },
];

interface RawInstallationItem {
  base_url: string;
  version?: string;
  institution_name: {
    pl: string;
    en: string;
  };
}

function extractMainDomain(urlStr: string): string {
  const host = urlStr.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const parts = host.split('.');
  if (parts.length > 2 && parts[0].includes('usos')) {
    return parts.slice(1).join('.');
  }
  return host;
}

/**
 * Fetches the live list of all Polish USOS API installations from the central USOS registry
 * (`https://apps.usos.edu.pl/services/apisrv/installations`), keeping UKEN w Krakowie #1.
 */
export async function fetchAllUsosInstallations(): Promise<UsosInstallation[]> {
  try {
    const res = await fetch(
      'https://apps.usos.edu.pl/services/apisrv/installations?fields=base_url|institution_name|version'
    );
    if (!res.ok) return DEFAULT_USOS_INSTALLATIONS;
    const rawList: RawInstallationItem[] = await res.json();

    const byHost = new Map<string, UsosInstallation>();
    for (const item of DEFAULT_USOS_INSTALLATIONS) {
      const host = item.baseUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
      byHost.set(host, { ...item });
    }

    const palette = ['#2563EB', '#4F46E5', '#059669', '#D97706', '#7C3AED', '#0891B2'];
    let idx = 0;

    for (const raw of rawList) {
      if (!raw.base_url || !raw.institution_name?.pl) continue;
      const normalizedUrl = raw.base_url.replace(/^http:\/\//, 'https://').replace(/\/?$/, '/');
      const host = normalizedUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');

      const existing = byHost.get(host);
      if (existing) {
        existing.version = raw.version;
        continue;
      }

      const namePl = raw.institution_name.pl.trim();
      const words = namePl
        .split(/\s+/)
        .filter((w) => w.length > 2 && !['im.', 'w', 'we', 'na'].includes(w.toLowerCase()));
      const shortName =
        words
          .slice(0, 4)
          .map((w) => w[0]?.toUpperCase() || '')
          .join('') || 'USOS';

      const mainDom = extractMainDomain(normalizedUrl);
      const city = namePl.toLowerCase().includes('krakow')
        ? 'Kraków'
        : namePl.toLowerCase().includes('warszaw')
        ? 'Warszawa'
        : namePl.toLowerCase().includes('poznan') || namePl.toLowerCase().includes('poznań')
        ? 'Poznań'
        : namePl.toLowerCase().includes('wrocław') || namePl.toLowerCase().includes('wroclaw')
        ? 'Wrocław'
        : 'Polska';

      byHost.set(host, {
        id: host.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
        shortName,
        namePl,
        nameEn: raw.institution_name.en || namePl,
        city,
        baseUrl: normalizedUrl,
        version: raw.version,
        accentColor: palette[idx++ % palette.length],
        logoUrl: `https://www.google.com/s2/favicons?domain=${mainDom}&sz=128`,
      });
    }

    return Array.from(byHost.values());
  } catch {
    return DEFAULT_USOS_INSTALLATIONS;
  }
}
