export const useVieillesMatires = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  // Récupérer toutes les lignes d'un chantier
  const getLignes = async (chantierId) => {
    try {
      const { data, error } = await client
        .from('vieilles_matieres_lignes')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('section_type')
        .order('ordre')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur récupération vieilles matières:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  // Ajouter une ligne
  const addLigne = async (chantierId, sectionType, ordre = 0) => {
    try {
      const { data, error } = await client
        .from('vieilles_matieres_lignes')
        .insert({
          chantier_id: chantierId,
          section_type: sectionType,
          ordre,
          voie: '',
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur ajout ligne:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  // Mettre à jour une ligne
  const updateLigne = async (id, updates) => {
    try {
      const { data, error } = await client
        .from('vieilles_matieres_lignes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur mise à jour ligne:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  // Supprimer une ligne
  const deleteLigne = async (id) => {
    try {
      const { error } = await client
        .from('vieilles_matieres_lignes')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur suppression ligne:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  // ─── Formules de calcul (identiques au fichier Excel) ────────────────────

  const calcLongueur = (pkDebut, pkFin) => {
    if (pkDebut == null || pkFin == null || pkDebut === '') return null
    return (pkFin - pkDebut) * 1000
  }

  const calcBallastVolume = (typeTravaux, profondeur, longueur, coef = 1) => {
    if (!['RVB', 'RB+RT', 'RB'].includes(typeTravaux)) return null
    if (profondeur == null || longueur == null) return null
    return (profondeur * coef / 100) * 3.4 * longueur
  }

  const calcBallastTonnage = (volume) => {
    if (volume == null) return null
    return volume * 1.6
  }

  const calcTboisNombre = (typeTraverses, typeTravaux, longueur, travelage, coef = 1) => {
    if (typeTraverses !== 'Bois') return null
    if (!['RVB', 'RB+RT', 'RT'].includes(typeTravaux)) return null
    if (longueur == null || travelage == null) return null
    return (longueur * travelage * coef) / 1000
  }

  const calcTboisTonnage = (nombre) => {
    if (nombre == null) return null
    return nombre * 0.1
  }

  const calcBiblocNombre = (typeTraverses, typeTravaux, longueur, travelage, coef = 1) => {
    if (typeTraverses !== 'Bibloc') return null
    if (!['RVB', 'RB+RT', 'RT'].includes(typeTravaux)) return null
    if (longueur == null || travelage == null) return null
    return (longueur * travelage * coef) / 1000
  }

  const calcBiblocTonnage = (nombre) => {
    if (nombre == null) return null
    return nombre * 0.23
  }

  const calcMonoblocNombre = (typeTraverses, typeTravaux, longueur, travelage, coef = 1) => {
    if (typeTraverses !== 'Monobloc') return null
    if (!['RVB', 'RB+RT', 'RT'].includes(typeTravaux)) return null
    if (longueur == null || travelage == null) return null
    return (longueur * travelage * coef) / 1000
  }

  const calcMonoblocTonnage = (nombre) => {
    if (nombre == null) return null
    return nombre * 0.3
  }

  const calcRailLongueur = (typeTravaux, longueur, coef = 1) => {
    if (!['RVB', 'RR'].includes(typeTravaux)) return null
    if (longueur == null) return null
    return longueur * coef * 2
  }

  const calcRailTonnage = (railLongueur, profilRail) => {
    if (railLongueur == null || profilRail == null) return null
    return (railLongueur * profilRail) / 1000
  }

  // Calcule toutes les valeurs dérivées d'une ligne
  // ADV applique un coefficient 1.5 sur ballast, traverses et rail (cf. formules Excel)
  const computeLigne = (ligne) => {
    const coef = ligne.section_type === 'adv' ? 1.5 : 1
    const longueur = calcLongueur(ligne.pk_debut, ligne.pk_fin)
    const ballastVol = calcBallastVolume(ligne.type_travaux, ligne.profondeur_degarnissage, longueur, coef)
    const tboisNb = calcTboisNombre(ligne.type_traverses, ligne.type_travaux, longueur, ligne.travelage, coef)
    const biblocNb = calcBiblocNombre(ligne.type_traverses, ligne.type_travaux, longueur, ligne.travelage, coef)
    const monoblocNb = calcMonoblocNombre(ligne.type_traverses, ligne.type_travaux, longueur, ligne.travelage, coef)
    const railL = calcRailLongueur(ligne.type_travaux, longueur, coef)

    return {
      longueur,
      ballast_volume: ballastVol,
      ballast_tonnage: calcBallastTonnage(ballastVol),
      tbois_nombre: tboisNb,
      tbois_tonnage: calcTboisTonnage(tboisNb),
      bibloc_nombre: biblocNb,
      bibloc_tonnage: calcBiblocTonnage(biblocNb),
      monobloc_nombre: monoblocNb,
      monobloc_tonnage: calcMonoblocTonnage(monoblocNb),
      rail_longueur: railL,
      rail_tonnage: calcRailTonnage(railL, ligne.profil_rail),
    }
  }

  // Calcule les totaux d'un ensemble de lignes calculées
  const computeTotaux = (lignesCalc) => {
    const sum = (key) => lignesCalc.reduce((acc, l) => acc + (l[key] ?? 0), 0)
    return {
      ballast_volume: sum('ballast_volume'),
      ballast_tonnage: sum('ballast_tonnage'),
      tbois_nombre: sum('tbois_nombre'),
      tbois_tonnage: sum('tbois_tonnage'),
      bibloc_nombre: sum('bibloc_nombre'),
      bibloc_tonnage: sum('bibloc_tonnage'),
      monobloc_nombre: sum('monobloc_nombre'),
      monobloc_tonnage: sum('monobloc_tonnage'),
      rail_longueur: sum('rail_longueur'),
      rail_tonnage: sum('rail_tonnage'),
    }
  }

  return {
    getLignes,
    addLigne,
    updateLigne,
    deleteLigne,
    computeLigne,
    computeTotaux,
  }
}
