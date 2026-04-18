// AdMob wrapper — only active on native (iOS/Android via Capacitor).
// On web the module is a no-op so nothing happens.
//
// Configuration: replace the test IDs with your real AdMob unit IDs once you
// create them in https://apps.admob.com. Keep test IDs during development so
// Google doesn't ban your account for clicking live ads.

export const ADMOB_TEST_IDS = {
  banner: {
    ios: "ca-app-pub-3940256099942544/2934735716",
    android: "ca-app-pub-3940256099942544/6300978111",
  },
  interstitial: {
    ios: "ca-app-pub-3940256099942544/4411468910",
    android: "ca-app-pub-3940256099942544/1033173712",
  },
};

// Replace these once your real unit IDs exist:
export const ADMOB_IDS = {
  banner: { ios: "REPLACE_WITH_IOS_BANNER_ID", android: "REPLACE_WITH_ANDROID_BANNER_ID" },
  interstitial: { ios: "REPLACE_WITH_IOS_INT_ID", android: "REPLACE_WITH_ANDROID_INT_ID" },
};

function isNative() {
  try {
    return typeof window !== "undefined" && !!window.Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

function getPlatform() {
  try {
    return window.Capacitor?.getPlatform?.() || "web";
  } catch {
    return "web";
  }
}

let initialized = false;
export async function initAds({ useTest = true } = {}) {
  if (!isNative() || initialized) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.initialize({
      testingDevices: useTest ? ["EMULATOR"] : [],
      initializeForTesting: useTest,
    });
    initialized = true;
  } catch (e) {
    console.warn("AdMob init failed:", e?.message);
  }
}

export async function showBanner({ useTest = true, position = "BOTTOM_CENTER" } = {}) {
  if (!isNative()) return;
  try {
    await initAds({ useTest });
    const { AdMob, BannerAdPosition, BannerAdSize } = await import("@capacitor-community/admob");
    const platform = getPlatform();
    const ids = useTest ? ADMOB_TEST_IDS : ADMOB_IDS;
    const adId = ids.banner[platform];
    if (!adId || adId.startsWith("REPLACE")) return;
    await AdMob.showBanner({
      adId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition[position] || BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: useTest,
    });
  } catch (e) {
    console.warn("Banner show failed:", e?.message);
  }
}

export async function hideBanner() {
  if (!isNative()) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.hideBanner();
  } catch {}
}

export async function showInterstitial({ useTest = true } = {}) {
  if (!isNative()) return;
  try {
    await initAds({ useTest });
    const { AdMob } = await import("@capacitor-community/admob");
    const platform = getPlatform();
    const ids = useTest ? ADMOB_TEST_IDS : ADMOB_IDS;
    const adId = ids.interstitial[platform];
    if (!adId || adId.startsWith("REPLACE")) return;
    await AdMob.prepareInterstitial({ adId, isTesting: useTest });
    await AdMob.showInterstitial();
  } catch (e) {
    console.warn("Interstitial show failed:", e?.message);
  }
}

export { isNative, getPlatform };
