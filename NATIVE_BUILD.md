# Native build guide (iOS + Android)

The web codebase is ready. Capacitor, AdMob, and all native config are in place. These are the manual steps **you** run locally — I can't do them remotely because they need Xcode / Android Studio / your developer accounts.

## Prerequisites

- **iOS**: A Mac with Xcode 15+ and a paid Apple Developer account ($99/yr)
- **Android**: Android Studio with SDK 34+ and a Google Play Console account (one-time $25)
- `npm install` (already done)

## 1. Add native platforms (one-time)

From the repo root:

```bash
# iOS (Mac only)
npx cap add ios

# Android (any OS with Android Studio set up)
npx cap add android
```

This creates `ios/` and `android/` folders. Commit them to git.

## 2. Build and sync

Whenever you change web code:

```bash
npm run cap:sync     # runs vite build + cap sync
npm run cap:open:ios # opens Xcode
npm run cap:open:android # opens Android Studio
```

## 3. App icons and splash screens

Capacitor generates placeholder icons. For production, use:

```bash
npm install -D @capacitor/assets
# Put a 1024x1024 icon at resources/icon.png and 2732x2732 splash at resources/splash.png
npx capacitor-assets generate
```

## 4. AdMob — finish the setup

1. Sign up at https://apps.admob.com
2. Create an **iOS app** and an **Android app** (each gets a unique App ID)
3. Create a **Banner ad unit** for each platform (copy the unit IDs)
4. Create an **Interstitial ad unit** for each platform (optional)
5. Open `src/lib/ads.js` and replace the four `REPLACE_WITH_...` placeholders
6. Flip `useTest: true` → `useTest: false` in `src/App.jsx` for production
7. Add the App IDs to native configs:
   - **iOS**: `ios/App/App/Info.plist` — add `GADApplicationIdentifier` with your iOS App ID
   - **Android**: `android/app/src/main/AndroidManifest.xml` — add `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-..."/>` inside `<application>`

## 5. Publishing

- **iOS**: In Xcode, Product → Archive → Distribute → App Store Connect
- **Android**: In Android Studio, Build → Generate Signed Bundle → Upload the `.aab` to Play Console

## Test IDs (default)

The app currently uses Google's official test ad unit IDs. Safe to click during dev, never monetised. Swap them only when you're ready to ship to real users.

## Troubleshooting

- **"cap add ios" fails on non-Mac** — correct, iOS can only be built on macOS
- **Android build fails** — ensure `local.properties` has `sdk.dir=<path to Android SDK>`
- **Ads don't show in dev** — on first run AdMob needs to verify the app; give it a few hours and restart

## What still needs doing for the App Store

- App Store listing (screenshots, description, keywords, privacy questionnaire)
- Privacy manifest file (`PrivacyInfo.xcprivacy`) required as of iOS 17
- Age rating and content descriptors
- In-app purchase setup if you add a Pro tier (StoreKit / Google Play Billing)
