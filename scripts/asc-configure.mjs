#!/usr/bin/env node
/**
 * App Store Connect REST API v1/v2 automation for Rift Daily (zero external dependencies).
 * Uses Node.js native `node:crypto` ES256 JWT signing with Team API Key WT2G4S7Z3U.
 *
 * Commands:
 *   node scripts/asc-configure.mjs status       — check app record, versions, builds & buildUploads
 *   node scripts/asc-configure.mjs configure    — metadata, localizations (PL/EN), pricing, availability, beta, review detail
 *   node scripts/asc-configure.mjs assets       — upload 5x 6.9" screenshots (PL+EN) + Header (21:9) & Search (3:2) assets
 *   node scripts/asc-configure.mjs attach-build — set usesNonExemptEncryption=false, What to Test & attach valid build
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const KEY_ID = 'WT2G4S7Z3U';
const ISSUER_ID = '410b5a97-08bd-4989-85d9-c2e3e27954da';
const KEY_PATH =
  process.env.ASC_KEY_PATH ||
  path.join(os.homedir(), 'Documents/Text Vaults/IronRoutine-Keys/AuthKey_WT2G4S7Z3U.p8');
const BUNDLE_ID = 'pl.matique.riftdaily';
const API_BASE = 'https://api.appstoreconnect.apple.com';
const ROOT = path.resolve(import.meta.dirname, '..');

function makeJwt() {
  const privateKey = fs.readFileSync(KEY_PATH, 'utf8');
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString(
    'base64url'
  );
  const payload = Buffer.from(
    JSON.stringify({ iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })
  ).toString('base64url');
  const signingInput = `${header}.${payload}`;
  const sig = crypto
    .sign('sha256', Buffer.from(signingInput), { key: privateKey, dsaEncoding: 'ieee-p1363' })
    .toString('base64url');
  return `${signingInput}.${sig}`;
}

async function asc(method, endpoint, body) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${makeJwt()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const errMsg =
      json?.errors?.map((e) => `${e.status} ${e.code}: ${e.detail}`).join(' | ') || text;
    throw new Error(`ASC ${method} ${endpoint} -> ${res.status}: ${errMsg}`);
  }
  return json;
}

async function uploadChunks(fileBuf, uploadOperations) {
  for (const op of uploadOperations) {
    const chunk = fileBuf.subarray(op.offset, op.offset + op.length);
    const headers = {};
    for (const h of op.requestHeaders || []) {
      headers[h.name] = h.value;
    }
    const res = await fetch(op.url, {
      method: op.method,
      headers,
      body: chunk,
    });
    if (!res.ok) {
      throw new Error(`Chunk upload failed (${res.status}) -> ${op.url}`);
    }
  }
}

async function findApp() {
  const res = await asc('GET', `/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}`);
  return res.data?.[0] || null;
}

async function getPrepareVersion(appId) {
  const versionsRes = await asc('GET', `/v1/apps/${appId}/appStoreVersions`);
  return (
    versionsRes.data?.find((v) => v.attributes.appStoreState === 'PREPARE_FOR_SUBMISSION') ||
    versionsRes.data?.[0] ||
    null
  );
}

async function cmdStatus() {
  const app = await findApp();
  if (!app) {
    console.log(`APP_NOT_FOUND: No App Store Connect app record found for bundleId=${BUNDLE_ID}.`);
    return;
  }
  console.log(`APP_FOUND: id=${app.id} name="${app.attributes.name}" sku="${app.attributes.sku}"`);

  const versions = await asc('GET', `/v1/apps/${app.id}/appStoreVersions`);
  for (const v of versions.data || []) {
    console.log(`  Version ${v.attributes.versionString} [${v.attributes.appStoreState}] id=${v.id}`);
  }

  try {
    const uploads = await asc('GET', `/v1/apps/${app.id}/buildUploads`);
    for (const u of uploads.data || []) {
      console.log(
        `  BuildUpload id=${u.id} state=${u.attributes?.state?.state || 'unknown'} errors=${JSON.stringify(
          u.attributes?.state?.errors || []
        )}`
      );
    }
  } catch {
    // Optional endpoint
  }

  const builds = await asc('GET', `/v1/builds?filter[app]=${app.id}&limit=5`);
  for (const b of builds.data || []) {
    console.log(
      `  Build ${b.attributes.version} [${b.attributes.processingState}] encryption=${b.attributes.usesNonExemptEncryption} id=${b.id}`
    );
  }
}

async function cmdConfigure() {
  const app = await findApp();
  if (!app) throw new Error(`App record for ${BUNDLE_ID} does not exist yet.`);
  const appId = app.id;
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const targetVersion = pkg.version;

  console.log(`Configuring Rift Daily (${appId}) for v${targetVersion}...`);

  // 1. Content Rights
  await asc('PATCH', `/v1/apps/${appId}`, {
    data: {
      type: 'apps',
      id: appId,
      attributes: { contentRightsDeclaration: 'DOES_NOT_USE_THIRD_PARTY_CONTENT' },
    },
  });
  console.log('  [OK] Content Rights');

  // 2. App Info, Categories, Localizations (PL + EN-US) & Age Rating
  const infos = await asc('GET', `/v1/apps/${appId}/appInfos`);
  const infoId = infos.data?.[0]?.id;
  if (infoId) {
    const locsRes = await asc('GET', `/v1/appInfos/${infoId}/appInfoLocalizations`);
    const byLocale = new Map((locsRes.data || []).map((l) => [l.attributes.locale, l]));
    const desiredInfoLocs = [
      {
        locale: 'pl',
        name: 'Rift Daily',
        subtitle: 'Nowoczesny e-Dziennik USOS',
        privacyPolicyUrl: 'https://rift-daily.vercel.app/privacy',
        privacyChoicesUrl: 'https://rift-daily.vercel.app/privacy',
      },
      {
        locale: 'en-US',
        name: 'Rift Daily',
        subtitle: 'Modern Polish USOS Companion',
        privacyPolicyUrl: 'https://rift-daily.vercel.app/privacy',
        privacyChoicesUrl: 'https://rift-daily.vercel.app/privacy',
      },
    ];
    for (const loc of desiredInfoLocs) {
      const existing = byLocale.get(loc.locale);
      if (existing) {
        const { locale: _l, ...attrs } = loc;
        await asc('PATCH', `/v1/appInfoLocalizations/${existing.id}`, {
          data: { type: 'appInfoLocalizations', id: existing.id, attributes: attrs },
        });
      } else {
        await asc('POST', '/v1/appInfoLocalizations', {
          data: {
            type: 'appInfoLocalizations',
            attributes: loc,
            relationships: { appInfo: { data: { type: 'appInfos', id: infoId } } },
          },
        });
      }
    }
    console.log('  [OK] App Info Localizations (pl, en-US)');

    await asc('PATCH', `/v1/appInfos/${infoId}`, {
      data: {
        type: 'appInfos',
        id: infoId,
        relationships: {
          primaryCategory: { data: { type: 'appCategories', id: 'EDUCATION' } },
          secondaryCategory: { data: { type: 'appCategories', id: 'PRODUCTIVITY' } },
        },
      },
    });
    console.log('  [OK] Categories (EDUCATION + PRODUCTIVITY)');

    const ageRes = await asc('GET', `/v1/appInfos/${infoId}/ageRatingDeclaration`);
    if (ageRes.data?.id) {
      await asc('PATCH', `/v1/ageRatingDeclarations/${ageRes.data.id}`, {
        data: {
          type: 'ageRatingDeclarations',
          id: ageRes.data.id,
          attributes: {
            advertising: false,
            ageAssurance: false,
            alcoholTobaccoOrDrugUseOrReferences: 'NONE',
            contests: 'NONE',
            datingAndRelationships: false,
            gambling: false,
            gamblingSimulated: 'NONE',
            gunsOrOtherWeapons: 'NONE',
            healthOrWellnessTopics: false,
            horrorOrFearThemes: 'NONE',
            lootBox: false,
            matureOrSuggestiveThemes: 'NONE',
            medicalOrTreatmentInformation: 'NONE',
            messagingAndChat: false,
            parentalControls: false,
            profanityOrCrudeHumor: 'NONE',
            sexualContentGraphicAndNudity: 'NONE',
            sexualContentOrNudity: 'NONE',
            sharedLocation: false,
            socialMedia: false,
            unrestrictedWebAccess: false,
            userGeneratedContent: false,
            violenceCartoonOrFantasy: 'NONE',
            violenceRealistic: 'NONE',
            violenceRealisticProlongedGraphicOrSadistic: 'NONE',
          },
        },
      });
      console.log('  [OK] Age Rating Declaration (4+)');
    }
  }

  // 3. Free Price Schedule
  try {
    const ppRes = await asc(
      'GET',
      `/v1/apps/${appId}/appPricePoints?filter[territory]=POL&limit=200`
    );
    const freePoint = (ppRes.data || []).find(
      (p) => Number(p.attributes?.customerPrice) === 0
    );
    if (freePoint) {
      await asc('POST', '/v1/appPriceSchedules', {
        data: {
          type: 'appPriceSchedules',
          relationships: {
            app: { data: { type: 'apps', id: appId } },
            baseTerritory: { data: { type: 'territories', id: 'POL' } },
            manualPrices: { data: [{ type: 'appPrices', id: '${price1}' }] },
          },
        },
        included: [
          {
            type: 'appPrices',
            id: '${price1}',
            attributes: { startDate: null },
            relationships: {
              appPricePoint: { data: { type: 'appPricePoints', id: freePoint.id } },
            },
          },
        ],
      });
      console.log('  [OK] Free Price Schedule (POL base)');
    }
  } catch (e) {
    console.log(`  [INFO] Price Schedule: ${e.message.slice(0, 140)}`);
  }

  // 4. App Availability V2 (all territories)
  try {
    const terrRes = await asc('GET', '/v1/territories?limit=200');
    const territories = (terrRes.data || []).map((t) => t.id);
    const territoryAvails = territories.map((tId, idx) => ({
      type: 'territoryAvailabilities',
      id: `\${t${idx}}`,
      attributes: { available: true },
      relationships: { territory: { data: { type: 'territories', id: tId } } },
    }));
    await asc('POST', '/v2/appAvailabilities', {
      data: {
        type: 'appAvailabilities',
        attributes: { availableInNewTerritories: true },
        relationships: {
          app: { data: { type: 'apps', id: appId } },
          territoryAvailabilities: {
            data: territoryAvails.map((ta) => ({ type: 'territoryAvailabilities', id: ta.id })),
          },
        },
      },
      included: territoryAvails,
    });
    console.log(`  [OK] App Availability V2 (${territories.length} territories)`);
  } catch (e) {
    console.log(`  [INFO] App Availability V2: ${e.message.slice(0, 140)}`);
  }

  // 5. App Store Version (sync versionString -> 1.2.0 + Localizations PL & EN-US + Review Detail)
  const version = await getPrepareVersion(appId);
  if (version) {
    if (version.attributes.versionString !== targetVersion) {
      await asc('PATCH', `/v1/appStoreVersions/${version.id}`, {
        data: {
          type: 'appStoreVersions',
          id: version.id,
          attributes: {
            versionString: targetVersion,
            copyright: '© 2026 Szymon Góral',
          },
        },
      });
      console.log(`  [OK] Version updated to ${targetVersion}`);
    }

    const vLocsRes = await asc(
      'GET',
      `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`
    );
    const byLocale = new Map((vLocsRes.data || []).map((l) => [l.attributes.locale, l]));
    const desiredVLocs = [
      {
        locale: 'pl',
        description:
          'Rift Daily to szybki, minimalistyczny codzienny dziennik studencki dla polskich uczelni korzystających z systemu USOS API (m.in. UKEN, UJ, UEK, AGH, PW, UAM, UMK, AWF, UPJP2 i ponad 50 innych).\n\n• Ekran „Dziś” z podglądem trwających i najbliższych zajęć, salą oraz osią czasu dnia.\n• Plan zajęć z płynną karuzelą dat i widokiem tygodnia.\n• Dziennik ocen z wyliczaniem średniej ważonej ECTS, filtrami i symulatorem What-If.\n• mLegitymacja, egzaminy, płatności z numerem IBAN, ankiety i wyszukiwarka kadry.\n• Automatyczne odświeżanie w tle i lokalne powiadomienia o zmianach planu i nowych ocenach.\n• Bezpieczne logowanie OAuth 1.0a bezpośrednio na stronie uczelni, Face ID / PIN, brak reklam i zero baz danych po naszej stronie.',
        keywords: 'usos,usosweb,plan zajec,oceny,student,uczelnia,ects,dziennik,uken,uj,agh',
        supportUrl: 'https://rift-daily.vercel.app/support',
        marketingUrl: 'https://rift-daily.vercel.app',
        promotionalText:
          'Szybki plan zajęć, oceny, ECTS i mLegitymacja z USOS w czystym, minimalistycznym interfejsie.',
      },
      {
        locale: 'en-US',
        description:
          'Rift Daily is a fast, minimal daily student journal for Polish universities running USOS API (including UKEN, UJ, UEK, AGH, PW, UAM, UMK, and 50+ institutions).\n\n• Today agenda with live class spotlight, room telemetry, and daily timeline.\n• Schedule view with smooth date-wheel carousel and weekly overview.\n• Academic journal with ECTS-weighted GPA, interactive grade filters, and What-If GPA simulator.\n• Student ID pass, exam dates, tuition payments, surveys, and faculty directory.\n• Background refresh with local alerts for new grades and schedule changes.\n• Secure OAuth 1.0a login directly on your university portal, Face ID / PIN lock, zero ads, and zero external student databases.',
        keywords: 'usos,usosweb,timetable,grades,student,university,poland,ects,schedule,gpa',
        supportUrl: 'https://rift-daily.vercel.app/support',
        marketingUrl: 'https://rift-daily.vercel.app',
        promotionalText:
          'Fast USOS timetable, weighted GPA, exams, and student pass in a crisp monochrome interface.',
      },
    ];
    for (const loc of desiredVLocs) {
      const existing = byLocale.get(loc.locale);
      if (existing) {
        const { locale: _l, ...attrs } = loc;
        await asc('PATCH', `/v1/appStoreVersionLocalizations/${existing.id}`, {
          data: { type: 'appStoreVersionLocalizations', id: existing.id, attributes: attrs },
        });
      } else {
        await asc('POST', '/v1/appStoreVersionLocalizations', {
          data: {
            type: 'appStoreVersionLocalizations',
            attributes: loc,
            relationships: {
              appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } },
            },
          },
        });
      }
    }
    console.log('  [OK] App Store Version Localizations (pl, en-US)');

    // App Store Review Detail (GET returns 200 { data: null } when absent)
    const revRes = await asc('GET', `/v1/appStoreVersions/${version.id}/appStoreReviewDetail`);
    const reviewAttrs = {
      contactFirstName: 'Szymon',
      contactLastName: 'Góral',
      contactPhone: '+48730494815',
      contactEmail: 'szymon.goral@icloud.com',
      demoAccountRequired: false,
      notes:
        'Rift Daily connects to official Polish university USOS API servers via OAuth 1.0a inside ASWebAuthenticationSession. Users authenticate directly on their university CAS/USOSweb portal. No third-party social login is used, and no student data is stored in any external database.',
    };
    if (revRes?.data?.id) {
      await asc('PATCH', `/v1/appStoreReviewDetails/${revRes.data.id}`, {
        data: { type: 'appStoreReviewDetails', id: revRes.data.id, attributes: reviewAttrs },
      });
    } else {
      await asc('POST', '/v1/appStoreReviewDetails', {
        data: {
          type: 'appStoreReviewDetails',
          attributes: reviewAttrs,
          relationships: {
            appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } },
          },
        },
      });
    }
    console.log('  [OK] App Store Review Detail');
  }

  // 6. Beta App Review Detail & Beta App Localizations (PL + EN-US)
  try {
    const betaRev = await asc('GET', `/v1/apps/${appId}/betaAppReviewDetail`);
    if (betaRev?.data?.id) {
      await asc('PATCH', `/v1/betaAppReviewDetails/${betaRev.data.id}`, {
        data: {
          type: 'betaAppReviewDetails',
          id: betaRev.data.id,
          attributes: {
            contactFirstName: 'Szymon',
            contactLastName: 'Góral',
            contactPhone: '+48730494815',
            contactEmail: 'szymon.goral@icloud.com',
            demoAccountRequired: false,
            notes: 'TestFlight beta of Rift Daily (Polish university USOS API student companion).',
          },
        },
      });
      console.log('  [OK] Beta App Review Detail');
    }
  } catch (e) {
    console.log(`  [INFO] Beta Review Detail: ${e.message.slice(0, 140)}`);
  }

  try {
    const betaLocs = await asc('GET', `/v1/apps/${appId}/betaAppLocalizations`);
    const byLoc = new Map((betaLocs.data || []).map((l) => [l.attributes.locale, l]));
    const desiredBetaLocs = [
      {
        locale: 'pl',
        feedbackEmail: 'szymon.goral@icloud.com',
        marketingUrl: 'https://rift-daily.vercel.app',
        privacyPolicyUrl: 'https://rift-daily.vercel.app/privacy',
        description: 'Wersja testowa Rift Daily — minimalistycznego e-Dziennika USOS na iOS.',
      },
      {
        locale: 'en-US',
        feedbackEmail: 'szymon.goral@icloud.com',
        marketingUrl: 'https://rift-daily.vercel.app',
        privacyPolicyUrl: 'https://rift-daily.vercel.app/privacy',
        description: 'TestFlight beta of Rift Daily — minimal Polish USOS student companion.',
      },
    ];
    for (const loc of desiredBetaLocs) {
      const existing = byLoc.get(loc.locale);
      if (existing) {
        const { locale: _l, ...attrs } = loc;
        await asc('PATCH', `/v1/betaAppLocalizations/${existing.id}`, {
          data: { type: 'betaAppLocalizations', id: existing.id, attributes: attrs },
        });
      } else {
        await asc('POST', '/v1/betaAppLocalizations', {
          data: {
            type: 'betaAppLocalizations',
            attributes: loc,
            relationships: { app: { data: { type: 'apps', id: appId } } },
          },
        });
      }
    }
    console.log('  [OK] Beta App Localizations (pl, en-US)');
  } catch (e) {
    console.log(`  [INFO] Beta App Localizations: ${e.message.slice(0, 140)}`);
  }

  console.log('App Store Connect metadata configuration complete!');
}

async function cmdAssets() {
  const app = await findApp();
  if (!app) throw new Error(`App record for ${BUNDLE_ID} does not exist yet.`);
  const appId = app.id;
  const version = await getPrepareVersion(appId);
  if (!version) throw new Error('No PREPARE_FOR_SUBMISSION version found.');

  // 1. Upload screenshots for iPhone 6.9" (APP_IPHONE_67) and iPad 13" (APP_IPAD_PRO_3GEN_129) for both pl and en-US
  const screenshotGroups = [
    { dir: path.join(ROOT, 'assets/appstore-screenshots'), displayType: 'APP_IPHONE_67' },
    { dir: path.join(ROOT, 'assets/appstore-ipad-screenshots'), displayType: 'APP_IPAD_PRO_3GEN_129' },
  ];

  const vLocsRes = await asc(
    'GET',
    `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`
  );

  for (const group of screenshotGroups) {
    if (!fs.existsSync(group.dir)) continue;
    const files = fs
      .readdirSync(group.dir)
      .filter((f) => f.endsWith('.png'))
      .sort();
    if (files.length === 0) continue;

    for (const loc of vLocsRes.data || []) {
      const setsRes = await asc(
        'GET',
        `/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`
      );
      let set = (setsRes.data || []).find(
        (s) => s.attributes.screenshotDisplayType === group.displayType
      );
      if (!set) {
        const created = await asc('POST', '/v1/appScreenshotSets', {
          data: {
            type: 'appScreenshotSets',
            attributes: { screenshotDisplayType: group.displayType },
            relationships: {
              appStoreVersionLocalization: {
                data: { type: 'appStoreVersionLocalizations', id: loc.id },
              },
            },
          },
        });
        set = created.data;
      }

      const existingShots = await asc('GET', `/v1/appScreenshotSets/${set.id}/appScreenshots`);
      const existingNames = new Set(
        (existingShots.data || []).map((s) => s.attributes.fileName)
      );

      for (const fileName of files) {
        if (existingNames.has(fileName)) {
          console.log(
            `  [SKIP] Screenshot (${group.displayType}) ${loc.attributes.locale}/${fileName} already uploaded`
          );
          continue;
        }
        const fullPath = path.join(group.dir, fileName);
        const buf = fs.readFileSync(fullPath);
        const md5 = crypto.createHash('md5').update(buf).digest('hex');

        const reserve = await asc('POST', '/v1/appScreenshots', {
          data: {
            type: 'appScreenshots',
            attributes: { fileSize: buf.length, fileName },
            relationships: {
              appScreenshotSet: { data: { type: 'appScreenshotSets', id: set.id } },
            },
          },
        });
        await uploadChunks(buf, reserve.data.attributes.uploadOperations);
        await asc('PATCH', `/v1/appScreenshots/${reserve.data.id}`, {
          data: {
            type: 'appScreenshots',
            id: reserve.data.id,
            attributes: { uploaded: true, sourceFileChecksum: md5 },
          },
        });
        console.log(
          `  [OK] Uploaded screenshot (${group.displayType}) ${loc.attributes.locale}/${fileName}`
        );
      }
    }
  }

  // 2. Upload Product Page Header (3840x1646) & Search Results (3840x2560) via App Asset Library
  const assetSpecs = [
    {
      file: path.join(ROOT, 'assets/appstore-header-search/product-page-header-3840x1646.png'),
      placement: 'PRODUCT_PAGE_HEADER_ASSET',
    },
    {
      file: path.join(ROOT, 'assets/appstore-header-search/search-results-3840x2560.png'),
      placement: 'APP_STORE_SEARCH_RESULTS_ASSET',
    },
  ];

  for (const spec of assetSpecs) {
    if (!fs.existsSync(spec.file)) continue;
    try {
      const buf = fs.readFileSync(spec.file);
      const fileName = path.basename(spec.file);
      const reserve = await asc('POST', '/v1/appAssetLibraryImages', {
        data: {
          type: 'appAssetLibraryImages',
          attributes: {
            fileName,
            fileSize: buf.length,
            category: 'CREATIVE_ASSETS',
          },
          relationships: {
            assetLibrary: { data: { type: 'appAssetLibraries', id: appId } },
          },
        },
      });
      await uploadChunks(buf, reserve.data.attributes.uploadOperations);
      // Important: commit WITHOUT sourceFileChecksum per ASC App Asset Library API
      await asc('PATCH', `/v1/appAssetLibraryImages/${reserve.data.id}`, {
        data: {
          type: 'appAssetLibraryImages',
          id: reserve.data.id,
          attributes: { uploaded: true },
        },
      });
      const vLocsRes = await asc(
        'GET',
        `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`
      );
      for (const loc of vLocsRes.data || []) {
        await asc('POST', '/v1/appAssetLibraryPlacements', {
          data: {
            type: 'appAssetLibraryPlacements',
            attributes: { placementType: spec.placement },
            relationships: {
              appStoreVersionLocalization: {
                data: { type: 'appStoreVersionLocalizations', id: loc.id },
              },
              image: {
                data: { type: 'appAssetLibraryImages', id: reserve.data.id },
              },
            },
          },
        });
      }
      console.log(`  [OK] App Asset Library -> ${spec.placement}`);
    } catch (e) {
      console.log(`  [INFO] App Asset Library ${spec.placement}: ${e.message.slice(0, 160)}`);
    }
  }

  console.log('Asset upload step finished!');
}

async function cmdAttachBuild() {
  const app = await findApp();
  if (!app) throw new Error(`App record for ${BUNDLE_ID} does not exist yet.`);
  const appId = app.id;
  const version = await getPrepareVersion(appId);
  if (!version) throw new Error('No PREPARE_FOR_SUBMISSION version found.');

  const builds = await asc('GET', `/v1/builds?filter[app]=${appId}&limit=5`);
  const validBuild = (builds.data || []).find((b) => b.attributes.processingState === 'VALID');
  if (!validBuild) {
    console.log('NO_VALID_BUILD_YET: Build is still processing on App Store Connect.');
    return;
  }

  if (validBuild.attributes.usesNonExemptEncryption !== false) {
    await asc('PATCH', `/v1/builds/${validBuild.id}`, {
      data: {
        type: 'builds',
        id: validBuild.id,
        attributes: { usesNonExemptEncryption: false },
      },
    });
    console.log(`  [OK] Build ${validBuild.attributes.version}: usesNonExemptEncryption=false`);
  }

  // Beta Build Localizations (What to Test)
  try {
    const bLocs = await asc('GET', `/v1/builds/${validBuild.id}/betaBuildLocalizations`);
    const byLoc = new Map((bLocs.data || []).map((l) => [l.attributes.locale, l]));
    for (const [locale, whatsNew] of [
      ['pl', 'Pierwsze wydanie produkcyjne v1.2.0: centralny backend BFF (Zero-Secret), karuzela dat w Planie, odświeżanie w tle i nowy czarny szklany navbar.'],
      ['en-US', 'First production release v1.2.0: Zero-Secret BFF backend, date-wheel schedule carousel, background refresh, and obsidian glass navigation bar.'],
    ]) {
      const ex = byLoc.get(locale);
      if (ex) {
        await asc('PATCH', `/v1/betaBuildLocalizations/${ex.id}`, {
          data: { type: 'betaBuildLocalizations', id: ex.id, attributes: { whatsNew } },
        });
      } else {
        await asc('POST', '/v1/betaBuildLocalizations', {
          data: {
            type: 'betaBuildLocalizations',
            attributes: { locale, whatsNew },
            relationships: { build: { data: { type: 'builds', id: validBuild.id } } },
          },
        });
      }
    }
    console.log('  [OK] Beta Build Localizations (What to Test)');
  } catch (e) {
    console.log(`  [INFO] Beta Build Localizations: ${e.message.slice(0, 140)}`);
  }

  await asc('PATCH', `/v1/appStoreVersions/${version.id}/relationships/build`, {
    data: { type: 'builds', id: validBuild.id },
  });
  console.log(`  [OK] Attached build ${validBuild.attributes.version} to v${version.attributes.versionString}!`);
}

const cmd = process.argv[2] || 'status';
const runners = {
  status: cmdStatus,
  configure: cmdConfigure,
  assets: cmdAssets,
  'attach-build': cmdAttachBuild,
};

if (!runners[cmd]) {
  console.log('Unknown command. Use: status | configure | assets | attach-build');
  process.exit(1);
}

runners[cmd]().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
