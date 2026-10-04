# Android App Specification — "Data Sync"

Companion Android app for the **Data Sync** Vela quick app on Redmi Watch 5.
The two sides communicate over Xiaomi's `interconnect` / `xms-wearable` bridge.

---

## 1. APK Info

| Field            | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| applicationId    | `top.lighilit.watch_data_sync`                               |
| App label        | `Data Sync`                                                  |
| Language         | Kotlin                                                       |
| minSdkVersion    | 24                                                           |
| targetSdkVersion | 30                                                           |
| compileSdkVersion| 30                                                           |
| versionCode      | 1                                                            |
| versionName      | `1.0`                                                        |
| SDK dependency   | `xms-wearable-lib_1.4_release.aar` (in `app/libs/`)          |

> **Hard requirement:** `applicationId` MUST equal the watch quick app's
> `manifest.json` `package` field (`top.lighilit.watch_data_sync`), and the APK
> MUST be signed with the **same certificate** used to sign the watch `.rpk`.
> See §6.

---

## 2. Overview

The app is a thin bridge to a paired watch running the Data Sync quick app:

1. **Edit & send text** — the user types text and taps *Send*; the text is sent
   to the watch, where the quick app renders it on screen.
2. **Registered callbacks** — the app exposes a callback registry. When the user
   scrolls to the bottom of the watch screen, two buttons appear; tapping either
   one makes the watch send an `action` message back, which the app dispatches to
   the matching registered callback.

---

## 3. Architecture

```
MainActivity
 └── DataSyncViewModel            (holds UI state + callback registry)
       ├── MessageApi  (sendMessage / addListener / removeListener)
       └── NodeApi     (connectedNodes -> Node.id)

com.xiaomi.xms.wearable SDK  ->  host app bridge
   (com.xiaomi.wearable  /  com.mi.health  on the phone)
   ->  Bluetooth  ->  Redmi Watch 5 (Vela quick app)
```

### Components

| Class / file                      | Responsibility                                             |
| --------------------------------- | ---------------------------------------------------------- |
| `MainActivity.kt`                 | Hosts a single `EditText`, a `Send` button, and a status `TextView`. |
| `DataSyncController.kt`           | Wraps `Wearable` SDK: node discovery, message send/receive, callback registry. |
| `layout/activity_main.xml`        | UI layout.                                                 |

---

## 4. Communication Protocol (JSON over interconnect)

All messages are UTF-8 encoded JSON strings. The wire format on both sides is a
`ByteArray` on Android and a JSON string on the watch.

### 4.1 Phone → Watch (text)

```json
{ "type": "text", "content": "Hello from the phone" }
```

The watch renders `content` as a new message entry.

### 4.2 Watch → Phone (button action)

The watch's two bottom buttons send, respectively:

```json
{ "type": "action", "action": "confirm" }
{ "type": "action", "action": "cancel" }
```

The app looks up `action` in its callback registry and invokes the callback.

---

## 5. Signing & Interconnect Prerequisites

`interconnect` only works when the quick app and the Android APK share the same
package name **and** signature:

1. `manifest.json.package` == APK `applicationId` (`top.lighilit.watch_data_sync`).
2. Sign the watch `.rpk` with the same certificate as the APK:
   - Convert the Android keystore/jks to `.pem` (private key + certificate) and
     place them under the quick app's `/sign/debug` and `/sign/release`.
   - Or use Xiaomi's online signature tool.
   - The build already resolves certs from `./sign/debug` (debug) and
     `./sign/release` (release); see `sign/README.md`. Placeholder debug certs are
     committed there so the project builds, but they must be replaced with the
     APK-matching cert for real interconnect.
3. A Xiaomi host bridge app must be installed on the phone and the watch paired:
   - `com.mi.health` (小米运动健康) or `com.xiaomi.wearable` (小米穿戴).

See [`signing.md`](signing.md) for commands to create one keystore, configure the
APK build, export its key and certificate for Vela, and verify both artifacts.

---

## 7. Behavior / Acceptance Criteria

1. Open the app, type text, tap *Send* → text appears on the watch.
2. On the watch, scroll to the bottom → two buttons appear.
3. Tapping button 1 invokes the `confirm` callback; button 2 invokes the
   `cancel` callback (both visible in the app's status label).
4. The app shows connection status (connected / failed / no device).
