# Sign the APK and RPK with one certificate

Xiaomi interconnect authenticates the two applications by both package ID and
signing certificate. Both manifests use `top.lighilit.watch_data_sync`; the
following procedure makes both release artifacts use one RSA key pair.

Keep the JKS, PEM private key, passwords, and `keystore.properties` secret. The
projects ignore these files. Back up the JKS securely because losing it prevents
future updates from using the same identity.

## 1. Create the shared key

Run from `watch_data_sync` and choose strong passwords when prompted:

```sh
keytool -genkeypair \
  -keystore data-sync-release.jks \
  -alias data-sync \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Data Sync, OU=Apps, O=Lighilit, C=CN"
```

Do this once only. Reuse this keystore for every APK and RPK update.

## 2. Configure Android release signing

Create `watch_data_sync/keystore.properties` with these values:

```properties
storeFile=data-sync-release.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=data-sync
keyPassword=YOUR_KEY_PASSWORD
```

Build the signed APK:

```sh
cd watch_data_sync
./gradlew assembleRelease
```

The result is `app/build/outputs/apk/release/app-release.apk`. If
`keystore.properties` is absent, debug builds still work, but a release build is
not signed and is unsuitable for interconnect deployment.

## 3. Export the same identity for Vela

Vela needs an unencrypted PKCS#8 PEM private key and its X.509 certificate.
Convert the JKS to a temporary PKCS#12 file, then export both:

```sh
keytool -importkeystore \
  -srckeystore watch_data_sync/data-sync-release.jks \
  -srcalias data-sync \
  -destkeystore /tmp/data-sync-release.p12 \
  -deststoretype PKCS12

mkdir -p data-sync/sign/release data-sync/sign/debug

openssl pkcs12 \
  -in /tmp/data-sync-release.p12 \
  -nocerts -nodes \
  | openssl pkcs8 -topk8 -nocrypt \
  -out data-sync/sign/release/private.pem

openssl pkcs12 \
  -in /tmp/data-sync-release.p12 \
  -clcerts -nokeys \
  -out data-sync/sign/release/certificate.pem

cp data-sync/sign/release/private.pem data-sync/sign/debug/private.pem
cp data-sync/sign/release/certificate.pem data-sync/sign/debug/certificate.pem
rm /tmp/data-sync-release.p12
```

The commands prompt for the passwords set in step 1. Restrict private-key access:

```sh
chmod 600 data-sync/sign/release/private.pem data-sync/sign/debug/private.pem
```

Build the RPK with the project toolchain:

```sh
cd data-sync
npm ci
npm run release
```

If your installed AIoT Toolkit requests certificate paths instead of discovering
`sign/release`, select `sign/release/private.pem` and
`sign/release/certificate.pem`. Do not use a toolkit-generated key, because that
would give the RPK a different identity.

## 4. Verify before installation

Print the certificate SHA-256 fingerprint from the source keystore:

```sh
keytool -list -v \
  -keystore watch_data_sync/data-sync-release.jks \
  -alias data-sync
```

Verify the APK and inspect its signer fingerprint:

```sh
$ANDROID_HOME/build-tools/35.0.0/apksigner verify --verbose --print-certs \
  watch_data_sync/app/build/outputs/apk/release/app-release.apk
```

The APK `Signer #1 certificate SHA-256 digest` must equal the keystore SHA-256
fingerprint (ignoring colons and letter case). Also verify the exported Vela
certificate:

```sh
openssl x509 -in data-sync/sign/release/certificate.pem \
  -noout -fingerprint -sha256
```

This fingerprint must match as well. Finally, inspect the newly built RPK rather
than the old debug artifact in `data-sync/dist`; package names and certificates
from previously built artifacts do not change when source files are edited.

The exact `apksigner` directory depends on the installed Android build-tools
version. Use the executable under `$ANDROID_HOME/build-tools/<version>/`.
