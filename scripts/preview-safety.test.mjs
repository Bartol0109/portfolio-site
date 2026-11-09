import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { contactFormAction, CONTACT_ENDPOINT, shouldBlockRequest } from '../src/lib/devGuard.js'
import { translations } from '../src/i18n/translations.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

function shape(value, prefix = '') {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => shape(item, `${prefix}[${index}]`))
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).flatMap((key) => shape(value[key], prefix ? `${prefix}.${key}` : key))
  }
  return [prefix]
}

test('local preview does not give the contact form a production action', () => {
  assert.equal(contactFormAction(true), undefined)
  assert.equal(contactFormAction(false), CONTACT_ENDPOINT)
})

test('dev guard blocks mutations and cross-origin reads', () => {
  const pageOrigin = 'http://127.0.0.1:5174'
  assert.equal(shouldBlockRequest({ dev: true, method: 'POST', url: '/api/admin/login.php', pageOrigin }), true)
  assert.equal(shouldBlockRequest({ dev: true, method: 'DELETE', url: '/api/portfolio.php?id=1', pageOrigin }), true)
  assert.equal(shouldBlockRequest({ dev: true, method: 'GET', url: '/api/portfolio.php', pageOrigin }), false)
  assert.equal(shouldBlockRequest({
    dev: true,
    method: 'GET',
    url: 'https://visoradigital.com.hr/api/portfolio.php',
    pageOrigin,
  }), true)
  assert.equal(shouldBlockRequest({
    dev: false,
    method: 'POST',
    url: CONTACT_ENDPOINT,
    pageOrigin: 'https://visoradigital.com.hr',
  }), false)
})

test('public navigation has no admin link and the login route stays', () => {
  const header = read('src/components/Header.jsx')
  const app = read('src/App.jsx')
  assert.doesNotMatch(header, /t\.nav\.admin/)
  assert.doesNotMatch(header, /to="\/admin/)
  assert.match(header, /navigate\('\/admin\/login'\)/)
  assert.match(header, /aria-controls="site-nav"/)
  assert.match(header, /aria-expanded=/)
  assert.match(header, /Profilna\.jpg/)
  assert.match(app, /path="admin\/login"/)
  const css = read('src/index.css')
  assert.match(css, /translateX\(-105%\)/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})

test('hero no longer mounts the orbit or the play watermark', () => {
  const home = read('src/pages/Home.jsx')
  assert.doesNotMatch(home, /HeroOrbit|GradientText|bg-watermark/)
  assert.match(home, /contactFormAction/)
  assert.match(home, /Bartol Barać/)
})

test('vite dev server refuses API writes', () => {
  const config = read('vite.config.js')
  assert.match(config, /devWriteGuard/)
  assert.match(config, /statusCode = 403/)
})

test('Croatian and English expose the same copy structure', () => {
  assert.deepEqual(shape(translations.en), shape(translations.hr))
  assert.ok(translations.en.about.cards.length >= 5)
  assert.equal(translations.en.orbit.skills.length, translations.hr.orbit.skills.length)
  assert.equal(translations.en.hero.desc, 'Available for work.')
  assert.equal(translations.hr.hero.desc, 'Dostupan za posao.')
  assert.equal(translations.en.hero.statementWord, 'work')
  assert.equal(translations.hr.hero.statementWord, 'posao')
  assert.equal(translations.en.hero.work, 'See the work')
  assert.equal(translations.hr.hero.work, 'Pogledaj radove')
  assert.deepEqual(translations.en.hero.kicker, [
    'All of my work in one place.',
    'This is an interactive CV.',
  ])
  assert.deepEqual(translations.hr.hero.kicker, [
    'Sav moj rad na jednom mjestu.',
    'Ovo je interaktivni CV.',
  ])
  const headlines = [
    translations.en.hero.desc,
    translations.hr.hero.desc,
    translations.en.titles.welcome,
    translations.hr.titles.welcome,
  ].join('\n')
  assert.doesNotMatch(headlines, /I code\.|Programiram|I build interfaces|Pravim sučelja/)
  assert.doesNotMatch(JSON.stringify(translations), /student|I study|Studiram|studira/i)
})
