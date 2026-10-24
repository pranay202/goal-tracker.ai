# Bug record

## B-001 — Android debug build cannot fetch Gradle

- **Discovery:** 18 October 2026 while launching the Expo app on a USB-connected
  A063 Android phone.
- **Impact:** No debug APK can be assembled, installed, or launched yet.
- **Reproduction:** Run `npx expo run:android --device P222AF004481`.
- **Root cause:** The Gradle wrapper times out after 10 seconds connecting to
  `https://services.gradle.org/distributions/gradle-9.4.1-bin.zip`. This is a
  build-host network reachability issue, not an application compile error.
- **Attempted fixes:** Expo Go could not update from SDK 57 to the project's
  SDK 58. Direct native build was generated successfully, but its Gradle
  runtime download only partially completed before timing out; a retry produced
  the same connection timeout.
- **Next fix:** Restore reliable permitted access to `services.gradle.org`,
  then re-run the direct build. Do not modify application source to work around
  this external download failure.
- **Latest attempt:** The host sandbox restriction on ADB's local port was
  removed successfully on 18 October. The retry stopped before Gradle because
  no USB Android device was visible to the host.
- **Updated next fix:** Reconnect and authorize A063 for USB debugging so it is
  visible to ADB, then re-run the direct build. If it reaches Gradle, verify
  whether access to `services.gradle.org` has been restored.
- **Latest attempt:** 21 October 2026. This host does not have Android Platform
  Tools installed (`adb: command not found`), so device discovery and direct
  installation cannot begin here. This is an environment prerequisite distinct
  from the earlier device-visibility and Gradle-network blockers.
- **Updated next fix:** Use a host with Android Platform Tools available, run
  `adb devices -l`, reconnect and authorize A063 until it appears as `device`,
  then run `npx expo run:android --device P222AF004481`. Do not add an Android
  SDK or Platform Tools package to this project; those are host-level tools.
- **Latest attempt:** 23 October 2026. Platform Tools were found at
  `/home/pranay/Android/Sdk/platform-tools/adb`; wireless ADB discovered and
  authorized A063 as `adb-P222AF004481-gcMFem._adb-tls-connect._tcp`. Expo's
  device selector requires the reported name `A063`, not the old USB serial.
  The Gradle 9.4.1 runtime download completed and a daemon started. A063 then
  stopped advertising/disconnected before the app package could be installed.
- **Updated next fix:** Keep Wireless Debugging enabled, with the phone awake
  on the same Wi-Fi network, until `adb mdns services` and `adb devices -l`
  both show A063. Then run `npx expo run:android --device A063`; Gradle should
  no longer need its first-time distribution download.
- **Latest attempt:** 23 October 2026 retry. A063 reconnected successfully at
  `192.168.1.7:38065`, but both `expo run:android` and a direct Gradle assembly
  were canceled by this execution environment after configuration. The Gradle
  daemon log records `client disconnection detected, canceling the build`; the
  resulting `com.facebook.react.settings` message is a cancellation symptom,
  not a project configuration diagnosis. No APK or app package was produced.
- **Updated next fix:** Run the same command from a persistent local terminal
  on this host (not an interrupted sandboxed build session):
  `cd /home/pranay/Projects/my-builds/mobile-apps/goals-tracker-app && npx expo run:android --device A063`.
  Keep A063 awake with Wireless Debugging enabled until the install finishes.
- **Verification:** Pending successful `expo run:android` installation and
  launch on A063.
- **Rollback note:** The generated `android/` directory is safe to retain; it
  is needed to resume the direct build and can be regenerated with Expo.
- **AI model/version:** GPT-5 Codex; latest diagnosis and record update by
  GPT-5 Codex on 23 October 2026.
