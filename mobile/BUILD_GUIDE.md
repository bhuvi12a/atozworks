# AtoZ Works - Build Guide for Google Play Store & Local Testing

This guide contains the commands and configuration details needed to build your mobile application for the Google Play Store (App Bundle `.aab`) and for local testing (Standalone APK `.apk`).

## Prerequisites
Ensure you are logged into your Expo account in the terminal:
```bash
npx eas-cli login
```

---

## 1. Build Android App Bundle (.aab) - For Google Play Console
Google Play Store requires an `.aab` file for uploads and updates.

### Build Command:
```bash
cd mobile
eas build --platform android --profile production
```

### Important Play Store Settings in `app.json`
Every time you upload an update to the Play Store, you must increment the `versionCode` in `mobile/app.json`.
```json
"android": {
  "package": "com.atozworks.app",
  "versionCode": 2, // Increment this number (e.g., to 3, 4, etc.) for each new release
  ...
}
```

---

## 2. Build Standalone APK (.apk) - For Local Testing
If you want to build an APK file to directly install and share manually on Android devices:

### Build Command:
```bash
cd mobile
eas build --platform android --profile preview
```

---

## 3. Configuration References

### `eas.json` Profiles
The profiles are configured in `mobile/eas.json` as follows:
- **`production`**: Configured to build an `app-bundle` (AAB).
- **`preview`**: Configured to build an `apk` (APK).
