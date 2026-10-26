// iHelp guard rails. Run: npm test  (or: node --test tests/help.test.mjs)
// Fails when a screen ships undocumented, when EN and AR content drift apart, or when content
// references something that does not exist.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createLoader } from './helpers/loadModuleGraph.mjs'

const load = createLoader()
const { HELP_ARTICLES, HELP_CHANGELOG, HELP_GETTING_STARTED } = load('content/help/index.ts')
const { buildHelpTree, findArticleForNavItem, audiencesOf, sectionKeyOf } = load('lib/help/registry.ts')
const { navItems, sectionSources } = load('lib/help/navSources.ts')
const { matchRoute } = load('lib/help/routeMatch.ts')
const { HELP_UNDOCUMENTED_ROUTES } = load('lib/help/coverage.ts')
const { STATUS_DOMAINS } = load('lib/help/statuses.ts')
const { ROUTES } = load('lib/routes.ts')
const { PLATFORM_ROUTES } = load('lib/platformRoutes.ts')

const json = (p) => JSON.parse(readFileSync(new URL(`../src/i18n/locales/${p}`, import.meta.url), 'utf8'))
const locales = {
  en: { ...json('en.json'), ...json('platform.en.json'), ...json('help.en.json') },
  ar: { ...json('ar.json'), ...json('platform.ar.json'), ...json('help.ar.json') },
}
const lookup = (lang, key) => key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), locales[lang])
const translate = (lang, key, fallback) => (typeof lookup(lang, key) === 'string' ? lookup(lang, key) : fallback ?? key)
const AUDIENCES = ['cab', 'client', 'platform']
const DASH = /[–—]/

test('every app route is documented by an article, a nav item, or an explicit exclusion', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const literal = [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1])
  const fromRoutes = Object.values(ROUTES).filter((r) => r !== ROUTES.platform && !r.startsWith(ROUTES.help))
  const routes = [...new Set([...literal, ...fromRoutes, ...Object.values(PLATFORM_ROUTES), '/platform/tenants/:id', '/platform/plans/:id'])]
  const navRoutes = AUDIENCES.flatMap((a) => navItems(a).map((item) => item.route))
  const documented = HELP_ARTICLES.flatMap((a) => a.routes)
  const missing = routes.filter(
    (route) =>
      !(route in HELP_UNDOCUMENTED_ROUTES) &&
      !navRoutes.includes(route) &&
      !documented.some((pattern) => pattern === route || matchRoute(pattern, route)),
  )
  assert.deepEqual(missing, [], `Undocumented routes: add an article (routes: [...]) or list them in src/lib/help/coverage.ts`)
})

test('every nav item has a written article or a stub with a translated title', () => {
  const stubs = []
  for (const audience of AUDIENCES) {
    for (const item of navItems(audience)) {
      if (findArticleForNavItem(HELP_ARTICLES, audience, item)) continue
      stubs.push(`${audience}:${item.id}`)
      for (const lang of ['en', 'ar']) assert.equal(typeof lookup(lang, item.labelKey), 'string', `${item.labelKey} missing in ${lang}`)
    }
  }
  console.log(`iHelp stubs (nav items without a written article): ${stubs.length}${stubs.length ? ` → ${stubs.join(', ')}` : ''}`)
})

function shape(value) {
  if (Array.isArray(value)) return value.map(shape)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).filter((k) => k !== 'keywords').sort().map((k) => [k, shape(value[k])]))
  return typeof value
}

test('EN and AR article content have the same shape and no em/en dashes', () => {
  for (const article of HELP_ARTICLES) {
    assert.deepEqual(shape(article.text.ar), shape(article.text.en), `${article.id}: EN/AR differ in shape`)
    for (const lang of ['en', 'ar']) {
      assert.ok(article.text[lang].title && article.text[lang].summary, `${article.id} ${lang}: title and summary required`)
      assert.ok(!DASH.test(JSON.stringify(article.text[lang])), `${article.id} ${lang}: em/en dash`)
    }
  }
  for (const entry of HELP_CHANGELOG) assert.ok(!DASH.test(JSON.stringify(entry.text)), `${entry.id}: em/en dash`)
})

test('content references are valid', () => {
  const ids = HELP_ARTICLES.map((a) => a.id)
  assert.equal(new Set(ids).size, ids.length, 'article ids must be unique')
  for (const article of HELP_ARTICLES) {
    assert.match(article.id, /^[a-z0-9-]+$/, `${article.id}: id must be URL safe`)
    assert.match(article.updated, /^\d{4}-\d{2}-\d{2}$/, `${article.id}: updated must be an ISO date`)
    for (const audience of audiencesOf(article)) {
      const keys = sectionSources(audience).map((s) => s.key)
      assert.ok(keys.includes(sectionKeyOf(article, audience)), `${article.id}: unknown section for ${audience}`)
    }
    for (const id of article.related ?? []) assert.ok(ids.includes(id), `${article.id}: related ${id} does not exist`)
    if (article.statusValues) {
      assert.equal(article.statusValues.length, (article.text.en.statuses ?? []).length, `${article.id}: statusValues must align with statuses`)
      const domain = STATUS_DOMAINS[article.statusDomain]
      for (const value of article.statusValues) if (value) assert.ok(domain.values.includes(value), `${article.id}: ${value} is not a ${article.statusDomain} status`)
    }
    if (article.open) assert.ok(!article.open.includes(':'), `${article.id}: open must be a concrete route`)
  }
  for (const [audience, path] of Object.entries(HELP_GETTING_STARTED)) for (const id of path) assert.ok(ids.includes(id), `getting started ${audience}: ${id}`)
  for (const entry of HELP_CHANGELOG) {
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/)
    if (entry.article) assert.ok(ids.includes(entry.article), `changelog ${entry.id}: ${entry.article}`)
  }
})

test('the help tree places everything and nothing lands in "More"', () => {
  const tree = buildHelpTree(translate, HELP_ARTICLES)
  for (const audience of AUDIENCES) {
    assert.ok(tree.sections[audience].length > 2, audience)
    const more = tree.sections[audience].find((s) => s.key === 'more')
    assert.equal(more, undefined, `${audience}: items in "More": ${more?.articles.map((a) => a.id)}`)
    const counted = tree.sections[audience].reduce((n, s) => n + s.articles.length, 0)
    console.log(`iHelp ${audience}: ${tree.sections[audience].length} sections, ${counted} articles`)
  }
})

test('help UI strings exist in English and Arabic (plural forms aside) and avoid dashes', () => {
  const flat = (node, prefix = '') =>
    Object.entries(node).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`.replace(/_(zero|one|two|few|many|other)$/, '')]))
  const en = [...new Set(flat(json('help.en.json')))].sort()
  const ar = [...new Set(flat(json('help.ar.json')))].sort()
  assert.deepEqual(ar, en)
  assert.ok(!DASH.test(JSON.stringify(json('help.en.json')) + JSON.stringify(json('help.ar.json'))))
})

test('a nav item without a written article gets a generated stub in both languages', () => {
  const tree = buildHelpTree(translate, HELP_ARTICLES.filter((a) => a.id !== 'offers'))
  const stub = [...tree.articles.values()].find((a) => a.stub && a.routes.includes('/cab/offers'))
  assert.ok(stub, 'stub for /cab/offers')
  assert.equal(stub.text.en.title, translate('en', 'cab.sidebar.offers'))
  assert.equal(stub.text.ar.title, translate('ar', 'cab.sidebar.offers'))
  assert.equal(stub.open, '/cab/offers')
  assert.equal(stub.tourPrefix, 'cab.offersPage.tour')
  assert.equal(tree.sectionOf.get(`cab:${stub.id}`).key, 'contract')
})
