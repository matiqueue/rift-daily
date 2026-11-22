#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
export LANG="en_US.UTF-8"
export LC_ALL="en_US.UTF-8"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE_PATH="${ROOT_DIR}/ios/build/RiftDaily.xcarchive"
EXPORT_PATH="${ROOT_DIR}/ios/build/AppStoreExport"
EXPORT_PLIST="${ROOT_DIR}/scripts/ExportOptions-AppStore.plist"

UPLOAD_ONLY=false
if [[ "${1:-}" == "--upload-only" ]]; then
  UPLOAD_ONLY=true
fi

if [[ "${UPLOAD_ONLY}" == "false" ]]; then
  echo "==> Archiving RiftDaily (Release)..."
  rm -rf "${ARCHIVE_PATH}" "${EXPORT_PATH}"
  xcodebuild \
    -workspace "${ROOT_DIR}/ios/RiftDaily.xcworkspace" \
    -scheme RiftDaily \
    -configuration Release \
    -destination "generic/platform=iOS" \
    -archivePath "${ARCHIVE_PATH}" \
    DEVELOPMENT_TEAM=3X24W8AX3N \
    CODE_SIGN_STYLE=Automatic \
    PRODUCT_BUNDLE_IDENTIFIER=pl.matique.riftdaily \
    -allowProvisioningUpdates \
    archive

  echo "==> Verifying local NFC code signature (guard against ITMS-90035)..."
  codesign --verify --deep --strict --verbose=2 "${ARCHIVE_PATH}/Products/Applications/RiftDaily.app"
fi

echo "==> Exporting & uploading to App Store Connect..."
xcodebuild \
  -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportOptionsPlist "${EXPORT_PLIST}" \
  -exportPath "${EXPORT_PATH}" \
  -allowProvisioningUpdates

echo "==> Done! Check build status via: node scripts/asc-configure.mjs status"
