// Helpers PURS pour le suivi logistique des chantiers.
// (auto-importés par Nuxt depuis app/utils/)
//
// Modèle : chantier_logistique.equipements = {
//   base_vie:   { besoin, modules, pose: <slot>, depose: <slot> },
//   imprimante: { besoin, ids, pose: <slot>, depose: <slot> },
//   wifi:       { besoin, ids, pose: <slot>, depose: <slot> },
//   radios:     { besoin, pk, fournisseur, nombre, station_fixe, pose: <slot>, depose: <slot> }
// }
//   <slot> = { status, date, commentaire }
//   status : 0 = À faire, 1 = En cours, 2 = Fait
//   besoin : null = non évalué, true = besoin, false = pas besoin

// Noms préfixés "Equip" pour éviter toute collision d'auto-import avec cloture.js
// (qui exporte déjà getSlot / mergeSlot / DEFAULT_SLOT).
export const DEFAULT_EQUIP_SLOT = { status: 0, date: null, commentaire: '' }

// Métadonnées des postes logistiques (ordre d'affichage).
// biPhase => poste avec pose + dépose (base vie). optional => peut être "pas besoin".
export const EQUIPEMENTS = [
  { key: 'base_vie', label: 'Base vie', icon: 'lucide:caravan', biPhase: true, optional: true },
  { key: 'imprimante', label: 'Imprimante', icon: 'lucide:printer' },
  { key: 'wifi', label: 'Réseau', icon: 'lucide:wifi' },
  { key: 'radios', label: 'Radio', icon: 'lucide:radio', biPhase: true, optional: true }
]

// Normalise un slot { status, date, commentaire } avec des valeurs par défaut.
const normalizeSlot = (slot) => ({
  status: slot?.status ?? 0,
  date: slot?.date ?? null,
  commentaire: slot?.commentaire ?? ''
})

// Modules de base vie : VAC (type 'bb8' | 'bb10' | 'base12d' | null) + ALGECO (nombre de modules)
// + groupe électrogène (présent ou non).
const normalizeModules = (m) => {
  const o = m && !Array.isArray(m) ? m : {}
  return { vac: o.vac ?? null, algeco: Number(o.algeco) || 0, groupe_electrogene: o.groupe_electrogene === true }
}

// Imprimante : achat ou location (inventaire géré dans Paramètres > Logistique > Imprimante)
export const IMPRIMANTE_TYPES = [
  { id: 'achat', label: 'Achat' },
  { id: 'location', label: 'Location' }
]

// Radios : fournies par la SNCF ou par l'entreprise
export const RADIO_FOURNISSEURS = [
  { id: 'sncf', label: 'SNCF' },
  { id: 'entreprise', label: 'Entreprise' }
]

// Poste "Radio" : besoin (null/true/false) + PK de couverture radio + fournisseur
// + nombre de radios + besoin d'une station fixe (oui/non),
// avec un cycle pose / dépose comme la base vie (pas d'inventaire dédié).
const normalizeRadios = (m) => ({
  besoin: m?.besoin ?? null,
  pk: m?.pk ?? '',
  fournisseur: m?.fournisseur ?? null,
  nombre: Number(m?.nombre) || 0,
  station_fixe: m?.station_fixe === true,
  pose: normalizeSlot(m?.pose),
  depose: normalizeSlot(m?.depose)
})

// Poste "à inventaire" (imprimante, réseau/box) : besoin (bool) + ids référencés
// + état d'installation : pose (installée) / depose (retirée), comme la base vie.
const normalizeRefPoste = (m) => ({
  besoin: m?.besoin === true,
  ids: Array.isArray(m?.ids) ? m.ids.filter((x) => x != null) : [],
  pose: normalizeSlot(m?.pose),
  depose: normalizeSlot(m?.depose)
})

// Renvoie un objet "equipements" complet (toutes les clés présentes) à partir d'un brut éventuellement partiel.
export const normalizeEquipements = (raw) => {
  const e = raw || {}
  const bv = e.base_vie || {}
  return {
    base_vie: {
      besoin: bv.besoin ?? null,
      modules: normalizeModules(bv.modules),
      pose: normalizeSlot(bv.pose),
      depose: normalizeSlot(bv.depose)
    },
    imprimante: normalizeRefPoste(e.imprimante),
    wifi: normalizeRefPoste(e.wifi),
    radios: normalizeRadios(e.radios)
  }
}

// Formate une date (Date | string | null) en 'YYYY-MM-DD' pour la persistance / les <input type="date">.
const formatDateForInput = (d) => {
  if (!d) return null
  const date = new Date(d)
  if (isNaN(date.getTime())) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Sérialise un objet "equipements" (normalisé) pour la persistance : conserve TOUS les postes
// (les pages Base vie / Imprimante / Réseau / Radio éditent chacune un poste mais réécrivent
// l'ensemble, ce qui évite d'effacer les autres) et met les dates au format 'YYYY-MM-DD'.
export const serializeEquipements = (e) => ({
  base_vie: {
    besoin: e.base_vie.besoin,
    modules: e.base_vie.modules,
    pose: { ...e.base_vie.pose, date: formatDateForInput(e.base_vie.pose.date) },
    depose: { ...e.base_vie.depose, date: formatDateForInput(e.base_vie.depose.date) }
  },
  imprimante: {
    besoin: e.imprimante.besoin,
    ids: e.imprimante.ids,
    pose: { ...e.imprimante.pose, date: formatDateForInput(e.imprimante.pose.date) },
    depose: { ...e.imprimante.depose, date: formatDateForInput(e.imprimante.depose.date) }
  },
  wifi: {
    besoin: e.wifi.besoin,
    ids: e.wifi.ids,
    pose: { ...e.wifi.pose, date: formatDateForInput(e.wifi.pose.date) },
    depose: { ...e.wifi.depose, date: formatDateForInput(e.wifi.depose.date) }
  },
  radios: {
    besoin: e.radios.besoin,
    pk: e.radios.pk,
    fournisseur: e.radios.fournisseur,
    nombre: e.radios.nombre,
    station_fixe: e.radios.station_fixe,
    pose: { ...e.radios.pose, date: formatDateForInput(e.radios.pose.date) },
    depose: { ...e.radios.depose, date: formatDateForInput(e.radios.depose.date) }
  }
})

// Lit le slot d'un poste simple (imprimante / wifi / radios), normalisé.
export const getEquipSlot = (equipements, key) => normalizeSlot(normalizeEquipements(equipements)[key])

// Lit le slot d'une phase de la base vie ('pose' | 'depose'), normalisé.
export const getPhaseSlot = (equipements, phase) => normalizeSlot(normalizeEquipements(equipements).base_vie[phase])

// Badge de statut (réutilise les conventions de couleurs de cloture.js, libellés adaptés).
export const logistiqueStatusInfo = (status) => {
  if (status === 2) return { label: 'Fait', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' }
  if (status === 1) return { label: 'En cours', cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' }
  return { label: 'À faire', cls: 'bg-red-100 text-red-700', dot: 'bg-red-400' }
}

// Badge "Aucun besoin" (base vie marquée "pas besoin").
export const SANS_OBJET = { label: 'Aucun besoin', cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' }

// Progression d'un chantier : { done, total } sur les postes réellement attendus.
// Tous les postes suivent désormais le même cycle besoin -> pose -> dépose :
// - un poste n'est compté que si besoin === true (sinon exclu) ;
// - la dépose ne compte que si la pose est faite (sinon pas encore d'attente de dépose).
export const computeProgress = (equipements) => {
  const e = normalizeEquipements(equipements)
  let done = 0
  let total = 0

  for (const key of ['base_vie', 'imprimante', 'wifi', 'radios']) {
    if (e[key].besoin !== true) continue
    total += 1
    if (e[key].pose.status === 2) {
      done += 1
      total += 1
      if (e[key].depose.status === 2) done += 1
    }
  }

  return { done, total }
}

// Vrai si tous les postes attendus sont faits (pour un filtre "incomplets").
export const isComplete = (equipements) => {
  const { done, total } = computeProgress(equipements)
  return total > 0 && done === total
}

// Fusionne (immutabilité) un patch dans le slot d'un poste simple et renvoie un nouvel "equipements".
export const mergeEquipSlot = (equipements, key, patch) => {
  const e = normalizeEquipements(equipements)
  return { ...e, [key]: { ...e[key], ...patch } }
}

// Fusionne (immutabilité) un patch dans une phase de la base vie ('pose' | 'depose').
export const mergePhase = (equipements, phase, patch) => {
  const e = normalizeEquipements(equipements)
  return { ...e, base_vie: { ...e.base_vie, [phase]: { ...e.base_vie[phase], ...patch } } }
}

// Met à jour le champ "besoin" de la base vie (immutabilité).
export const setBesoin = (equipements, besoin) => {
  const e = normalizeEquipements(equipements)
  return { ...e, base_vie: { ...e.base_vie, besoin } }
}
