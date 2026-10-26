# iHelp: the in-app help center

iHelp lives at `/help` (overview), `/help/:section` (topic) and `/help/:section/:article`.
It opens from the **iHelp** tile in the application hub, the **?** button in every top bar
(CAB, client portal, platform console) and **iHelp help center** in the account menu.
The **?** button opens the article that documents the current screen.

Content is data, not pages. The help center keeps itself in sync with the app:

| What | Where it comes from |
|---|---|
| Sections (topics) | The app's own navigation: `src/lib/cabNav.ts` (CAB sidebar groups), `src/lib/workspaceApps.ts` (hub tiles), `src/lib/portalNav.ts`, `src/lib/platformNav.ts` |
| Articles | `src/content/help/*.ts` (bilingual `HelpArticleSource` entries) |
| Missing articles | Every nav item without a written article gets an **auto-generated** one: title from the nav label, where to find it, an Open this screen link and the page's guided-tour steps (`src/lib/help/tours.ts`) |
| Status tables | The app's status enums, labels and chips (`src/lib/help/statuses.ts`) |
| What's new | `src/content/help/changelog.ts` |
| Last updated | `updated` of each article |
| Screenshots | `public/help/<lang>/<id>.webp` + `src/content/help/screenshots.ts` |

Key files: `src/lib/help/registry.ts` (builds the tree, maps routes to articles),
`src/lib/help/search.ts` (client-side search, Arabic normalisation), `src/pages/help/HelpCenterPage.tsx`,
`src/components/help/*`, UI strings in `src/i18n/locales/help.{en,ar}.json`.

## Add a module (nothing else required)

Add it to the navigation config the app already uses (`CAB_NAV_GROUPS`, `WORKSPACE_APPS`,
`PORTAL_NAV` or `PLATFORM_NAV`). It appears in iHelp at once with an auto-generated article.
For a portal or console item, map it to a help section in `PORTAL_SECTION_OF` /
`PLATFORM_SECTION_OF` (`src/lib/help/navSources.ts`), otherwise it lands in "More" and the test fails.

A route that is not in a navigation config must be documented by an article's `routes`, or listed with
a reason in `src/lib/help/coverage.ts`. `npm test` (`tests/help.test.mjs`) fails otherwise.

## Add or update an article

Add an entry to the right file (`articles-cab.ts`, `articles-platform.ts`, `articles-shared.ts`,
`guide-cab.ts`, `guide-client.ts`):

```ts
{
  id: 'fee-catalog',                 // unique, URL safe, also the screenshot name
  audience: 'cab',                   // or ['cab', 'client']
  section: 'followUp',               // a section key of that audience (or { cab: 'setup', client: 'start' })
  routes: ['/cab/fees'],             // route patterns this article documents (context help + coverage)
  open: '/cab/fees',                 // "Open this screen" (concrete route, no :params)
  navIds: ['cab.sidebar.fees'],      // optional: nav label keys / tile keys it documents
  statusDomain: 'cabInvoice',        // optional: generated status table with the app's chips
  statusValues: ['Draft', 'Issued'], // enum value of each text.*.statuses row, same order
  updated: '2026-10-25',             // bump on every content change ("Last updated")
  capture: { as: 'cab', route: '/cab/fees' }, // optional: screen for the screenshot script
  related: ['invoices'],
  text: {
    en: { title, summary, who, when, nav, screen, steps, fields, rules, statuses, after, tips, warnings, handoff, sections, keywords },
    ar: { /* same fields, same number of items, Modern Standard Arabic */ },
  },
}
```

Writing rules: one point per line; name buttons exactly as the screen shows them; Arabic in MSA for a
Saudi audience; **no em or en dashes** (use `·`, commas or colons; ranges as "1 to 5" / "1 إلى 5").
EN and AR must have the same shape (same fields, same number of steps, bullets and rows; only `keywords`
may differ). The test checks shape, dashes, ids, sections, related links and status values.

A new status in the app: add it to the status type and TypeScript will point at
`src/lib/help/statuses.ts`; add its chip tone there (or nothing, when the domain uses an exported badge).
Status tables then list it automatically; describe it in the article's `statuses` when useful.

## Add a "What's new" entry

Append to `src/content/help/changelog.ts`:

```ts
{ id: '2026-11-02-fee-catalog', date: '2026-11-02', audience: ['cab'], article: 'fee-catalog', module: 'cab.sidebar.invoices',
  text: { en: { title: '…', body: '…' }, ar: { title: '…', body: '…' } } }
```

The overview of each audience shows its entries, newest first.

## Screenshots

```bash
npx vite build && python3 ../postbuild.py          # preview build
cd ../../serve && python3 -m http.server 4173 &      # preview server (serve/help must link to dist/help)
NODE_PATH=/opt/npm-tools/node_modules CHROMIUM_PATH=/opt/pw-browsers/chromium node scripts/help-capture.mjs
node scripts/help-capture.mjs --only=fee-catalog,offers   # refresh a few (manifest unchanged)
```

The script opens each article's `capture.route` as its audience in English and Arabic (tours skipped),
saves `public/help/<lang>/<id>.webp` (max width 1200, quality 0.7) and rewrites
`src/content/help/screenshots.ts`. Articles show the image lazily with a zoom view when it exists.
Re-run it after visual changes; keep the total under 15 MB.

## Checks

```bash
npx tsc --noEmit -p tsconfig.app.json
npx eslint src tests --max-warnings=0
npm test
```
