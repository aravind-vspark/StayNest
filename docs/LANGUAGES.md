# Application languages

The shared web/native interface supports English, Telugu and Hindi. A Language
selector is available before sign-in and in the signed-in header. Selection
updates navigation, forms, filters, status labels, messages and common errors,
and formats currency/dates using the selected locale. Form enum values remain
unchanged when their visible labels are translated.

The choice is saved on the device under `staynest.language` and survives account
switches and normal app/browser restarts. On first launch the first supported
device/browser language is used, with English as fallback. If storage is
blocked, the selection works for the current session. The app does not upload
the device language preference to the API. Android and iOS projects declare
the same supported languages. Native OS permission dialogs and external
checkout pages follow their own platform/provider language configuration.

Hostel names, addresses, names of people, rules, menus, notices and request
content remain as entered. They are not automatically translated. Public
pre-release legal pages remain English pending operator/legal review.

Translations are in web/translations.js as English message keys with Hindi and
Telugu values. Parameterized messages preserve placeholders such as `{name}`.
Only trusted interface strings use `tr`; user content must continue to be
escaped, and must not be passed to `tr`. Interpolated HTML parameters must be
escaped before interpolation. Translations cannot contain HTML.

Run `npm run check:i18n` and `npm test` when changing interface text. The checker
verifies literal translation coverage, complete language pairs and identical
placeholders. UI tests cover switching, persistence, fallback, stable form
values and unchanged user-generated text. Add new static text through `tr`,
and add dynamic enum labels explicitly to the catalogue. Have fluent native
speakers review wording and device layouts before store release.

Mobile releases copy translations.js and i18n.js with the other web assets;
run the normal mobile:build/cap sync pipeline after any translation change.
