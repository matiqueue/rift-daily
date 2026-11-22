const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Expo Config Plugin: wires Android Release signing from environment variables
 * (ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD)
 * during `expo prebuild --platform android --clean`, with safe fallback to debug signing locally.
 */
function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    const signingSnippet = `
        release {
            def ksPath = System.getenv("ANDROID_KEYSTORE_PATH")
            if (ksPath != null && !ksPath.trim().isEmpty()) {
                storeFile file(ksPath)
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }`;

    if (!contents.includes('System.getenv("ANDROID_KEYSTORE_PATH")')) {
      contents = contents.replace(
        /(signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\})/,
        `$1${signingSnippet}`
      );
      contents = contents.replace(
        /(release\s*\{[\s\S]*?signingConfig\s+)signingConfigs\.debug/,
        `$1(System.getenv("ANDROID_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug)`
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });
}

module.exports = withAndroidReleaseSigning;
