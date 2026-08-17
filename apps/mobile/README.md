# PrayerHubApp Mobile

## Standard screens (Expo Go works fine)
Home, Pray, Community, Profile, Journal — no native modules required.

## Live audio rooms (needs a Dev Client, not Expo Go)
`RoomScreen` uses `@livekit/react-native` + `@livekit/react-native-webrtc`, which are native
modules. Plain Expo Go **cannot** load them. To run/test the Live tab:

```bash
npx expo prebuild
npx expo run:ios      # or: npx expo run:android
```

or build a dev client with EAS:

```bash
eas build --profile development --platform ios
```

Everything else in the app (navigation, prayer feed, journal) works in plain Expo Go; only
`RoomScreen`'s audio connection needs the native build.

## Environment
Create `.env` in this folder:
```
EXPO_PUBLIC_API_URL=http://<your-computer-ip>:4000/api/v1
```
Use your machine's LAN IP, not `localhost`, when testing on a physical device.
