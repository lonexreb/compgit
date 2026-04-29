# Distribution and Release

> Phase 5 — getting compgit into users' hands across every store. Five storefronts (Chrome Web Store, Firefox AMO, Microsoft Edge Add-ons, App Store, App Store for Mac) plus three sideload paths (Safari Web Extensions for power users, `.xpi` mirror, notarized `.dmg`). Includes the privacy policy, store assets, and the human review SLAs that gate launch.

## What

| Channel | Surface | Cost | Review SLA |
|---|---|---|---|
| Chrome Web Store | extension | $5 one-time | 1–7 days |
| Firefox AMO | extension | free | 1–10 days |
| Microsoft Edge Add-ons | extension (CWS reuse OK) | free | 7 days |
| Safari Web Extensions | macOS app embed | $99/yr (Apple Dev) | 1–3 days |
| App Store (iOS) | host app + widget | $99/yr (shared) | 1–3 days |
| App Store (macOS) | host app + widget | $99/yr (shared) | 1–3 days |
| Direct `.dmg` | macOS notarized | free (after notarization) | n/a |

Brave / Arc / Vivaldi pick up the Chrome build for free. Firefox needs its own zip via `wxt build --browser firefox`.

## Pre-launch checklist (gates every store needs)

1. **Privacy policy URL** — hosted on the Worker (see [[OAuth-Worker]]). Must list: data collected (none in PAT mode; viewer login + access token in OAuth mode), retention (session JWT 24h, KV cache 1h), third parties (GitHub only).
2. **Permissions justification** — Chrome MV3 reviewers reject vague rationales. State per-permission: `storage` ("cache contributions locally"), `alarms` ("15-min refresh"), `host_permissions: api.github.com` ("only call to fetch your own contributions").
3. **Screenshots, all sizes** — CWS wants 1280×800 or 640×400; AMO 1280×800; App Store iPhone 6.7"/6.5"/5.5", iPad 13"/12.9", Mac 2880×1800. Build a single Figma frame per screen and export the matrix.
4. **App icon** — replace the WXT placeholder. 16/32/48/128 PNG for Chrome; 1024×1024 PNG for App Store; macOS `.icns`.
5. **Demo video** (optional but accelerates review) — 30-sec capture with Cleanshot, hosted unlisted on YouTube.
6. **Listing copy** — short description ≤132 chars, long description ≤16k. Lead with "today's commit count, ambient." Avoid "track" — Apple flags it.
7. **Support email + URL** — set up `support@<domain>` (forwarding alias) and a public issues link (`github.com/lonexreb/compgit/issues`). — see [[Telemetry-And-Support]].

## Per-store steps

### Chrome Web Store

1. `pnpm -F @compgit/chrome build` → produces `.output/chrome-mv3/`.
2. Zip the directory: `cd .output/chrome-mv3 && zip -r ../compgit-chrome.zip .`.
3. Upload at <https://chrome.google.com/webstore/devconsole>. Pay $5 if first time.
4. Fill out: privacy practices, permissions justification, single-purpose statement ("ambient GitHub contribution tracker").
5. Submit for review. Watch email; respond to any reviewer questions within 24h.

### Firefox AMO

1. `pnpm -F @compgit/chrome build:firefox` → produces `compgit-firefox.zip` with `manifest.json` differences (no `service_worker`, uses `background.scripts`).
2. Upload at <https://addons.mozilla.org/developers>.
3. Provide reviewer notes pointing them at the GitHub repo for source. AMO is a source-review storefront — they will run the build.

### Microsoft Edge Add-ons

1. Reuse the Chrome zip. Upload at <https://partner.microsoft.com/dashboard/microsoftedge>.
2. Microsoft requires a publisher verification on first submission — allow 5 business days.

### App Store (iOS)

1. Archive in Xcode → Organizer → Distribute App → App Store Connect.
2. App Store Connect: fill out App Information, Pricing, App Review Information (test PAT credentials in the notes — reviewers can't sign in to GitHub OAuth without one in OAuth mode).
3. Submit for review. Apple reviews iOS in ~24h on average.
4. Common rejections: 4.3 ("spam — already a GitHub viewer"), 5.1.1 ("unclear data use"). Address by emphasising the *widget-first* angle and the privacy policy URL.

### App Store (macOS)

1. Same flow as iOS — single App Store Connect record can hold both.
2. Add the desktop widget extension to the bundle.
3. Notarize on submission (Xcode does this automatically).

### Direct `.dmg` (macOS, optional)

1. `xcodebuild -exportArchive -archivePath … -exportOptionsPlist export.plist`.
2. `xcrun notarytool submit Compgit.dmg --apple-id … --team-id … --password "@keychain:AC_PASSWORD" --wait`.
3. `xcrun stapler staple Compgit.dmg`.
4. Host the `.dmg` via the Worker's static asset bucket; SHA256 in the release notes.

## Release engineering

- **Version source of truth** — `package.json#version` for the Chrome extension; Xcode build settings (`MARKETING_VERSION`) for Apple. A `pnpm release` script bumps both via a small Node script and creates a `vX.Y.Z` git tag. — see [[../decisions/2026-04-29-end-to-end-plan-expansion]] for the rationale on a single tag covering all surfaces.
- **CI release workflow** (`.github/workflows/release.yml`) runs on tag push: builds all extensions, archives them as artefacts, drafts a GitHub Release. Apple builds stay manual until App Store Connect API is wired.
- **Release notes template** lives in `.github/RELEASE_TEMPLATE.md`. One section per surface; "What's new" first, "Known issues" second.

## Browser compatibility matrix

| Browser | Engine | Status |
|---|---|---|
| Chrome / Edge / Brave / Arc / Vivaldi | Blink + MV3 | ✅ primary build |
| Firefox | Gecko + MV3 | ✅ separate zip |
| Safari | WebKit + Safari Web Extensions | ⏳ Phase 5.1 — needs `xcrun safari-web-extension-converter` |
| Opera | Blink + MV3 (older) | ⏳ Phase 5.1 — accepts CWS package directly |

## Verification

Phase 5 distribution gate is "done" when:

- A clean macOS user account, with no compgit local builds, can install from each storefront and reach today's count in under 2 minutes.
- Privacy policy URL resolves and matches the data flow described in [[compgit]] and [[OAuth-Worker]].
- Each storefront page shows: app icon, ≥3 screenshots per device class, version ≥1.0.0, support email, privacy policy URL.
- A friend on TestFlight can install the iOS app, complete OAuth, and see the widget refresh within 30 minutes.

## Related

- [[compgit]] — the product these channels distribute.
- [[Apple-Surfaces]] — what gets archived for the App Store.
- [[OAuth-Worker]] — privacy policy host, also the OAuth callback.
- [[Telemetry-And-Support]] — what we monitor post-launch.

## Sources

- Chrome Web Store dev policies: <https://developer.chrome.com/docs/webstore/program-policies>
- AMO submission: <https://extensionworkshop.com/documentation/publish/submitting-an-add-on/>
- App Store Review Guidelines: <https://developer.apple.com/app-store/review/guidelines/>
- Notarization: <https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution>
- Safari Web Extension converter: <https://developer.apple.com/documentation/safariservices/safari_web_extensions/converting_a_web_extension_for_safari>
