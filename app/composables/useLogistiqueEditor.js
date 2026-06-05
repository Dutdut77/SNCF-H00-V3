// Éditeur d'un poste logistique (Base vie / Imprimante / Réseau / Radio).
//
// Chaque page charge l'objet "equipements" COMPLET du chantier et n'en édite qu'un poste,
// mais la sauvegarde réécrit l'ensemble via serializeEquipements : on ne perd donc jamais
// les autres postes même si la table ne stocke qu'une seule colonne jsonb par chantier.
//
// `getChantierId` peut être une fonction getter, une ref ou une valeur brute.
export const useLogistiqueEditor = (getChantierId) => {
  const { getLogistiqueByChantier, upsertLogistique } = useLogistique()
  const { setLoader } = useLoader()
  const { canEditLogistique } = useLevelUser()

  const equip = ref(null)
  const chantierId = computed(() => (typeof getChantierId === 'function' ? getChantierId() : unref(getChantierId)))

  const load = async () => {
    if (!chantierId.value) return
    setLoader(true)
    try {
      const raw = await getLogistiqueByChantier(chantierId.value)
      equip.value = normalizeEquipements(raw)
    } finally {
      setLoader(false)
    }
  }

  const enregistrer = async () => {
    if (!equip.value || !canEditLogistique.value) return
    setLoader(true)
    try {
      await upsertLogistique(chantierId.value, serializeEquipements(equip.value))
    } finally {
      setLoader(false)
    }
  }

  onMounted(load)
  watch(chantierId, (id, old) => {
    if (id && id !== old) load()
  })

  return { equip, canEditLogistique, enregistrer }
}
