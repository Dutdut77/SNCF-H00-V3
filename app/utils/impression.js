// Impression : polices chargées avant d'imprimer.
// Un document imprimé est masqué à l'écran (display: none) : le navigateur ne télécharge pas une police
// qu'aucun élément visible n'utilise, et document.fonts.ready n'attend que les chargements déjà commencés.
// Sans chargement explicite, l'impression peut partir avec une police de secours.

// Polices des documents imprimés (titres V4 et anciennes pages d'impression)
const POLICES_IMPRESSION = ['Traverse', 'Pacifico', 'Bangers']

// Charge les polices dans un document (la page, ou une fenêtre d'impression ouverte à part)
export const chargerPolicesImpression = async (doc = globalThis.document) => {
  if (!doc?.fonts) return
  await Promise.all(POLICES_IMPRESSION.map((famille) => doc.fonts.load(`1em "${famille}"`).catch(() => [])))
  await doc.fonts.ready
}

// Imprime la page une fois les polices chargées et la mise en page refaite avec elles.
// `delai` : attente supplémentaire (graphiques à dessiner, données à afficher).
export const lancerImpression = async ({ delai = 0 } = {}) => {
  try {
    await chargerPolicesImpression()
  } catch (e) {
    console.error(e)
  }
  // Deux images : la page est redessinée avec les polices chargées avant la capture
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  if (delai) await new Promise((resolve) => setTimeout(resolve, delai))
  window.print()
}
