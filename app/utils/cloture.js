// Helpers PURS pour la clôture des tâches par profil.
// (auto-importés par Nuxt depuis app/utils/)
//
// Modèle : h00.cloture_profil = { "<num_profil>": { status, realisation, commentaire, non_concerne } }
//   status : 0 = À faire, 1 = En cours, 2 = Clôturé
//   non_concerne : true => le profil ne compte plus dans l'agrégat global

export const DEFAULT_SLOT = { status: 0, realisation: null, commentaire: '', non_concerne: false }

// Lit le slot d'un profil (sans mutation), normalisé avec des valeurs par défaut.
export const getSlot = (h00Row, profilId) => {
  const cp = h00Row?.cloture_profil
  const slot = cp ? cp[profilId] : null
  if (!slot) return { ...DEFAULT_SLOT }
  return {
    status: slot.status ?? 0,
    realisation: slot.realisation ?? null,
    commentaire: slot.commentaire ?? '',
    non_concerne: slot.non_concerne ?? false
  }
}

// Liste des profils réellement concernés (tache_profil moins les "non concerné").
export const concernedProfils = (tacheProfil, h00Row) => {
  if (!Array.isArray(tacheProfil)) return []
  return tacheProfil.filter((p) => !getSlot(h00Row, p).non_concerne)
}

// Statut GLOBAL agrégé : Clôturé seulement si TOUS les profils concernés ont clôturé ;
// En cours si au moins un a commencé ; À faire sinon.
export const computeAggregate = (clotureProfil, tacheProfil) => {
  const row = { cloture_profil: clotureProfil || {} }
  const considered = (Array.isArray(tacheProfil) ? tacheProfil : []).filter((p) => !getSlot(row, p).non_concerne)

  if (considered.length === 0) return { status: 0, realisation: null }

  let allDone = true
  let anyStarted = false
  let maxRea = null

  for (const p of considered) {
    const s = getSlot(row, p)
    if (s.status !== 2) allDone = false
    if (s.status >= 1) anyStarted = true
    // dates 'YYYY-MM-DD' : comparaison lexicographique = chronologique
    if (s.status === 2 && s.realisation && (!maxRea || s.realisation > maxRea)) maxRea = s.realisation
  }

  const status = allDone ? 2 : anyStarted ? 1 : 0
  return { status, realisation: status === 2 ? maxRea : null }
}

// Fusionne (immutabilité) le slot d'un profil avec un patch et renvoie un nouvel objet cloture_profil.
export const mergeSlot = (clotureProfil, profilId, patch) => {
  const cp = { ...(clotureProfil || {}) }
  const current = getSlot({ cloture_profil: clotureProfil }, profilId)
  cp[String(profilId)] = { ...current, ...patch }
  return cp
}

// Badge de statut (réutilisé dans les listes / cards).
export const statusInfo = (status) => {
  if (status === 2) return { label: 'Clôturé', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' }
  if (status === 1) return { label: 'En cours', cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' }
  return { label: 'À faire', cls: 'bg-red-100 text-red-700', dot: 'bg-red-400' }
}
