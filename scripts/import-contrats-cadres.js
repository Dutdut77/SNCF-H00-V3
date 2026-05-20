#!/usr/bin/env node
/**
 * Import du CSV des articles "contrats cadres" dans catalogue_matieres.
 *
 * Usage :
 *   node scripts/import-contrats-cadres.js [chemin/vers/csv]
 *
 * Par défaut le script lit `contrats-cadres.csv` à la racine du repo.
 *
 * Requis dans .env (ou .env.local) :
 *   SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...   (clé service_role, jamais commit)
 *
 * Comportement :
 *   - Détecte le séparateur (virgule / point-virgule / tab)
 *   - INSERT ON CONFLICT DO NOTHING dans catalogue_unites_distribution
 *     pour les codes UD inconnus (quantite_par_unite = NULL)
 *   - UPSERT dans catalogue_matieres avec origine='contrat_cadre',
 *     prix_ud=NULL, description=Designation Abrégée, unite_distribution=Unité Stock
 *   - Préserve les références existantes (pas de DELETE)
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import Papa from 'papaparse'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

// ─── Chargement env ───────────────────────────────────────────────────────────
// .env.local prioritaire (cohérent avec `nuxt dev --dotenv .env.local`).
// Passer --env=prod pour utiliser .env à la place.
const useProd = process.argv.includes('--env=prod')
if (useProd) {
  loadEnv({ path: resolve(repoRoot, '.env') })
} else {
  loadEnv({ path: resolve(repoRoot, '.env.local') })
  loadEnv({ path: resolve(repoRoot, '.env'), override: false })
}
console.log(`🔧 Env : ${useProd ? '.env (prod)' : '.env.local (local)'}`)

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY) requis dans .env')
  process.exit(1)
}

// ─── Lecture du CSV ───────────────────────────────────────────────────────────
const positionalArg = process.argv.slice(2).find((a) => !a.startsWith('--'))
const csvPath = resolve(repoRoot, positionalArg ?? 'contrats-cadres.csv')
if (!existsSync(csvPath)) {
  console.error(`❌ Fichier introuvable : ${csvPath}`)
  process.exit(1)
}

// Détecte l'encodage : utf-8 par défaut, latin1 si on détecte du mojibake
// caractéristique (ex. "È" au lieu de "é" → octet 0xC9 lu comme latin1 puis ré-encodé).
const buf = readFileSync(csvPath)
const utf8 = buf.toString('utf-8')
const looksMojibake = /�/.test(utf8) || /[A-Z]È[a-z]|[a-z]È[a-z]/.test(utf8)
const raw = looksMojibake ? buf.toString('latin1') : utf8
console.log(`   Encodage : ${looksMojibake ? 'latin1 (détecté)' : 'utf-8'}`)

const firstLine = raw.split(/\r?\n/)[0] ?? ''
const sep = ['\t', ';', ','].sort((a, b) =>
  (firstLine.split(b).length - firstLine.split(a).length)
)[0]

const { data: rows, errors: parseErrors } = Papa.parse(raw, {
  header: true,
  delimiter: sep,
  skipEmptyLines: true,
  transformHeader: (h) => h.trim(),
})

if (parseErrors.length) {
  console.warn(`⚠️  ${parseErrors.length} erreur(s) de parsing CSV (ignorées)`)
}

console.log(`📄 ${csvPath}`)
console.log(`   Séparateur détecté : ${sep === '\t' ? 'TAB' : `"${sep}"`}`)
console.log(`   ${rows.length} ligne(s) lue(s)`)

// ─── Normalisation ────────────────────────────────────────────────────────────
// Compare des en-têtes en ignorant accents, casse et caractères non-alphanum
// (gère "AbrÈgÈe" vs "Abrégée" causé par un encodage Windows-1252).
const slugHeader = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const pick = (row, keys) => {
  const headerSlugMap = new Map(Object.keys(row).map((h) => [slugHeader(h), h]))
  for (const k of keys) {
    const orig = headerSlugMap.get(slugHeader(k))
    if (orig && String(row[orig] ?? '').trim() !== '') return String(row[orig]).trim()
  }
  return ''
}

// Un numéro de symbole fait obligatoirement 7 chiffres :
// si le CSV en fournit 6 (Excel a mangé le 0 de tête), on le restaure.
const normalizeSymbole = (s) => {
  const t = String(s).trim()
  return /^\d{1,7}$/.test(t) ? t.padStart(7, '0') : t
}

const articles = []
for (const row of rows) {
  const symbole = normalizeSymbole(pick(row, ['Symbole', 'NUMERO']))
  if (!symbole) continue
  const description =
    pick(row, ['Designation Abrégée', 'Désignation Abrégée', 'Designation', 'Désignation', 'LIBELLE'])
    || `[Contrat cadre ${symbole}]`
  articles.push({
    numero_symbole: symbole,
    description,
    unite_distribution: pick(row, ['Unité Stock', 'Unite Stock', 'UD']) || null,
    prix_ud: null,
    origine: 'contrat_cadre',
  })
}

console.log(`   ${articles.length} article(s) valide(s) après normalisation`)

// ─── Connexion Supabase ───────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// ─── Étape 1 : ajout des codes UD inconnus ───────────────────────────────────
const udCodes = [...new Set(articles.map((a) => a.unite_distribution).filter(Boolean))]

const { data: existingUd, error: udFetchErr } = await supabase
  .from('catalogue_unites_distribution')
  .select('code')
  .in('code', udCodes)

if (udFetchErr) {
  console.error('❌ Lecture catalogue_unites_distribution :', udFetchErr.message)
  process.exit(1)
}

const existingUdSet = new Set((existingUd ?? []).map((r) => r.code))
const newUd = udCodes
  .filter((c) => !existingUdSet.has(c))
  .map((code) => ({ code, designation: code, quantite_par_unite: null }))

if (newUd.length) {
  const { error } = await supabase
    .from('catalogue_unites_distribution')
    .insert(newUd)
  if (error) {
    console.error('❌ Insert UD :', error.message)
    process.exit(1)
  }
  console.log(`✅ ${newUd.length} code(s) UD ajouté(s) : ${newUd.map((u) => u.code).join(', ')}`)
} else {
  console.log('✅ Tous les codes UD existent déjà')
}

// ─── Étape 2 : UPSERT articles ───────────────────────────────────────────────
const CHUNK = 500
let upserted = 0
for (let i = 0; i < articles.length; i += CHUNK) {
  const slice = articles.slice(i, i + CHUNK)
  const { error } = await supabase
    .from('catalogue_matieres')
    .upsert(slice, { onConflict: 'numero_symbole' })
  if (error) {
    console.error(`❌ Upsert articles [${i}..${i + slice.length}] :`, error.message)
    process.exit(1)
  }
  upserted += slice.length
  process.stdout.write(`\r   ${upserted}/${articles.length} articles upserted`)
}
process.stdout.write('\n')

// ─── Récap ───────────────────────────────────────────────────────────────────
const { count } = await supabase
  .from('catalogue_matieres')
  .select('*', { count: 'exact', head: true })
  .eq('origine', 'contrat_cadre')

console.log(`\n✨ Terminé`)
console.log(`   ${upserted} article(s) upserted dans catalogue_matieres`)
console.log(`   ${count ?? '?'} article(s) avec origine='contrat_cadre' en base`)
