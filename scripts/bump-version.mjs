#!/usr/bin/env node
/**
 * Atomic SemVer bumper for Rift Daily.
 * Usage: node scripts/bump-version.mjs <patch|minor|major|X.Y.Z>
 * Synchronizes version + build number across:
 *   - package.json
 *   - app.json (version, ios.buildNumber, android.versionCode)
 *   - ios/RiftDaily/Info.plist (CFBundleShortVersionString, CFBundleVersion)
 *   - ios/RiftDaily.xcodeproj/project.pbxproj (MARKETING_VERSION, CURRENT_PROJECT_VERSION)
 *   - website/package.json
 *   - website/src/App.tsx (version pill)
 */

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const arg = process.argv[2];

if (!arg) {
  console.error('Usage: node scripts/bump-version.mjs <patch|minor|major|X.Y.Z>');
  process.exit(1);
}

const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const [curMaj, curMin, curPat] = pkg.version.split('.').map(Number);

let nextVersion;
if (arg === 'patch') nextVersion = `${curMaj}.${curMin}.${curPat + 1}`;
else if (arg === 'minor') nextVersion = `${curMaj}.${curMin + 1}.0`;
else if (arg === 'major') nextVersion = `${curMaj + 1}.0.0`;
else if (/^\d+\.\d+\.\d+$/.test(arg)) nextVersion = arg;
else {
  console.error(`Invalid bump argument: ${arg}`);
  process.exit(1);
}

// 1. package.json
pkg.version = nextVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// 2. app.json
const appJsonPath = path.join(root, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const nextBuild = Number(appJson.expo.android?.versionCode || 1) + 1;
appJson.expo.version = nextVersion;
appJson.expo.ios = { ...(appJson.expo.ios || {}), buildNumber: String(nextBuild) };
appJson.expo.android = { ...(appJson.expo.android || {}), versionCode: nextBuild };
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

// 3. ios/RiftDaily/Info.plist
const plistPath = path.join(root, 'ios/RiftDaily/Info.plist');
if (fs.existsSync(plistPath)) {
  let plist = fs.readFileSync(plistPath, 'utf8');
  plist = plist.replace(
    /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]+(<\/string>)/,
    `$1${nextVersion}$2`
  );
  plist = plist.replace(
    /(<key>CFBundleVersion<\/key>\s*<string>)[^<]+(<\/string>)/,
    `$1${nextBuild}$2`
  );
  fs.writeFileSync(plistPath, plist);
}

// 4. ios/RiftDaily.xcodeproj/project.pbxproj
const pbxPath = path.join(root, 'ios/RiftDaily.xcodeproj/project.pbxproj');
if (fs.existsSync(pbxPath)) {
  let pbx = fs.readFileSync(pbxPath, 'utf8');
  pbx = pbx.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${nextVersion};`);
  pbx = pbx.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${nextBuild};`);
  fs.writeFileSync(pbxPath, pbx);
}

// 5. website/package.json
const webPkgPath = path.join(root, 'website/package.json');
if (fs.existsSync(webPkgPath)) {
  const webPkg = JSON.parse(fs.readFileSync(webPkgPath, 'utf8'));
  webPkg.version = nextVersion;
  fs.writeFileSync(webPkgPath, JSON.stringify(webPkg, null, 2) + '\n');
}

// 6. website/src/App.tsx
const webAppPath = path.join(root, 'website/src/App.tsx');
if (fs.existsSync(webAppPath)) {
  let webApp = fs.readFileSync(webAppPath, 'utf8');
  webApp = webApp.replace(/\bv\d+\.\d+\.\d+\b/g, `v${nextVersion}`);
  fs.writeFileSync(webAppPath, webApp);
}

console.log(`Bumped Rift Daily -> v${nextVersion} (build ${nextBuild})`);
