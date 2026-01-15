<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})
useHead({
  title: ' H00 - Plan de charge',
  description: 'Plan de charge annuel des tâches'
})

const { setLoader } = useLoader()
const { taches, getTaches } = useTaches()
const { getChantiersUserNonTermines, allChantiersUserNonTermines } = useChantiers()
const { isAuthorizedForTacheBis } = useLevelUser()

const year = ref(new Date().getFullYear())
const listeTaches = ref([])
const sideModalUpdate = ref(false)
const searchTache = ref('')
const selectedTache = ref([])
const userH00Entries = ref([])

const transformAuthorizedChantiers = (authorizedChantiers) => {
  if (!Array.isArray(authorizedChantiers)) return []

  // Map pour lookup rapide des noms de tâches à partir de la valeur réactive
  const tachesById = new Map(taches.value.map((t) => [t.id, t.tache]))

  return authorizedChantiers.flatMap((chantier) => {
    const chantierId = chantier.id
    const chantierName = chantier.name
    const chantierCompte = chantier.compte

    return (chantier.h00 ?? [])
      .filter((h) => h.prevision) // sécurité
      .map((h) => {
        const date = new Date(h.prevision)
        const tacheName = tachesById.get(h.tache_id) ?? null

        return {
          month: date.getMonth() + 1, // 1 → 12
          year: date.getFullYear(),
          id: h.id,
          tache_id: h.tache_id,
          tache_name: tacheName,
          tache_status: h.status,
          chantier_id: chantierId,
          chantier_name: chantierName,
          chantier_compte: chantierCompte
        }
      })
  })
}

const loadAllData = async () => {
  setLoader(true)
  try {
    // Récupérer tous les chantiers
    await getTaches()
    await getChantiersUserNonTermines()
    const authorizedChantiers = isAuthorizedForTacheBis(allChantiersUserNonTermines.value, taches.value)
    const flattenedH00 = transformAuthorizedChantiers(authorizedChantiers)
    userH00Entries.value = flattenedH00
  } finally {
    setLoader(false)
  }
}

const yearPlusUn = async () => {
  setLoader(true)
  year.value = year.value + 1
  // await getAllH00Pdc(year.value);
  setLoader(false)
}

const yearMoinsUn = async () => {
  setLoader(true)
  year.value = year.value - 1
  // await getAllH00Pdc(year.value);
  setLoader(false)
}

const addTaches = () => {
  listeTaches.value = [...selectedTache.value]
  showSideUpdate()
}

const removeTache = (id) => {
  let index = listeTaches.value.indexOf(id)
  if (index !== -1) {
    listeTaches.value.splice(index, 1)
  }
}

const searchNameTache = (id) => {
  const task = taches.value.find((tache) => tache.id === id)
  return task ? task.tache : `Aucune tâche trouvée avec l'idtaches`
}

const showSideUpdate = () => {
  selectedTache.value = []
  sideModalUpdate.value = !sideModalUpdate.value
}

const rechercheTache = computed(() => {
  let recherche = []
  if (taches.value) {
    for (let i = 0; i < taches.value.length; i++) {
      let newlist = {}
      newlist.categorie = taches.value[i].categorie.toString()
      newlist.tache = taches.value[i].tache.toString()
      newlist.delais = taches.value[i].delais.toString()
      const verif = filtreTexte(Object.values(newlist), searchTache.value).length > 0 ? true : false
      if (verif) {
        recherche.push(taches.value[i])
      }
    }
  }
  return recherche
})

const filtreTexte = (arr, requete) => {
  const temp = []
  for (let i of arr) {
    i && temp.push(i)
  }
  arr = temp
  return arr.filter((el) => el.toLowerCase().indexOf(requete.toLowerCase()) !== -1)
}

const print = async () => {
  window.print()
}

const titreYear = computed(() => {
  const title = 'Plan de charge annuel  ' + year.value
  return title
})

const filteredByYear = computed(() => {
  return userH00Entries.value.filter((item) => item.year === year.value)
})

const reduceAllH00PdcByListeTache = computed(() => {
  if (!Array.isArray(filteredByYear.value) || !Array.isArray(listeTaches.value)) return []
  const listeTachesSet = new Set(listeTaches.value) // lookup rapide
  const groupedByMonth = {} // objet temporaire pour accumuler

  filteredByYear.value.forEach((item) => {
    // filtrer par tache_id
    if (!listeTachesSet.has(item.tache_id)) return

    const monthKey = item.month
    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = {
        month: monthKey,
        year: item.year,
        tachesMap: new Map() // pour lookup rapide des taches par id
      }
    }

    const monthGroup = groupedByMonth[monthKey]

    // Vérifier si la tâche existe déjà
    if (!monthGroup.tachesMap.has(item.tache_id)) {
      monthGroup.tachesMap.set(item.tache_id, {
        tache_id: item.tache_id,
        tache_name: item.tache_name,
        tache_status: item.tache_status,
        chantiers: []
      })
    }

    // Ajouter le chantier
    monthGroup.tachesMap.get(item.tache_id).chantiers.push({
      chantier_id: item.chantier_id,
      chantier_name: item.chantier_name,
      chantier_compte: item.chantier_compte
    })
  })

  // Conversion en array final, trié par mois et tâches
  return Object.values(groupedByMonth)
    .map((monthGroup) => ({
      month: monthGroup.month,
      year: monthGroup.year,
      taches: Array.from(monthGroup.tachesMap.values())
    }))
    .sort((a, b) => a.month - b.month)
})

const listeTachesJanvier = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.month === 1)
    return result[0]
  }
})
const listeTachesFevrier = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.month === 2)
    return result[0]
  }
})
const listeTachesMars = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.month === 3)
    return result[0]
  }
})
const listeTachesAvril = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.month === 4)
    return result[0]
  }
})
const listeTachesMai = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.month === 5)
    return result[0]
  }
})
const listeTachesJuin = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.month === 6)
    return result[0]
  }
})
const listeTachesJuillet = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.month === 7)
    return result[0]
  }
})
const listeTachesAout = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.month === 8)
    return result[0]
  }
})
const listeTachesSeptembre = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.month === 9)
    return result[0]
  }
})
const listeTachesOctobre = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.month === 10)
    return result[0]
  }
})
const listeTachesNovembre = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.month === 11)
    return result[0]
  }
})
const listeTachesDecembre = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.month === 12)
    return result[0]
  }
})

onMounted(async () => {
  await loadAllData()
})
</script>

<template>
  <section
    class="flex w-full flex-col gap-4 p-4 lg:overflow-hidden lg:px-4 lg:py-0 lg:pt-4 print:h-auto print:overflow-visible">
    <div class="flex w-full flex-col gap-4 md:flex-row md:items-center">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:justify-start">
        <img src="/images/logo_uo.png" alt="Logo" class="hidden w-12 print:block" />
        <AppTitleMain :title="titreYear" description="Planning annuel des tâches pour l'année en cours" />
        <div class="text-primary-800 ml-auto hidden text-sm italic print:inline">
          Impression du {{ new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
        </div>
      </div>
      <div class="ml-auto flex flex-wrap items-center justify-center gap-4 print:hidden">
        <div class="font-traverse z-10 flex flex-none items-center justify-center gap-4 pl-8 text-xl">
          <Icon name="lucide:chevron-left" class="w-10 cursor-pointer" @click="yearMoinsUn()" />
          <span class="flex h-full items-center font-bold">{{ year }}</span>
          <Icon name="lucide:chevron-right" class="w-10 cursor-pointer" @click="yearPlusUn()" />
        </div>
        <AppButtonValidated class="" @click="showSideUpdate()">
          <template #default>Ajouter une tache</template>
        </AppButtonValidated>
        <div class="hidden lg:flex lg:items-center lg:justify-center">
          <button
            v-if="listeTaches.length > 0"
            @click="print()"
            class="group border-secondary-400 from-secondary-400 to-secondary-500 flex w-fit cursor-pointer items-center justify-center gap-3 rounded-lg bg-linear-to-br px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300 print:hidden">
            <Icon name="lucide:printer" size="18" class="transition-transform duration-300 group-hover:scale-110" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>
    </div>

    <div class="border-primary-300 z-10 mt-4 w-full rounded-lg border-2 border-dashed p-4 text-sm print:hidden">
      <div v-if="listeTaches.length > 0" class="flex flex-wrap items-center gap-4">
        <div
          v-for="(tache, index) in listeTaches"
          :key="index"
          class="bg-primary-200 flex w-fit items-center rounded px-4 py-1">
          {{ searchNameTache(tache) }}
          <Icon name="lucide:x" size="16" class="ml-4 cursor-pointer hover:text-red-700" @click="removeTache(tache)" />
        </div>
      </div>
      <div v-else>Aucune tache sélectionnée...</div>
    </div>

    <div
      v-if="listeTaches.length > 0"
      class="mt-4 grid w-full grid-cols-1 gap-2 overflow-auto md:grid-cols-3 md:pr-4 lg:grid-cols-6 print:grid-cols-3 print:overflow-visible print:pr-0">
      <CalendrierPdcAnnuel title="Janvier" :data="listeTachesJanvier" />
      <CalendrierPdcAnnuel title="Février" :data="listeTachesFevrier" />
      <CalendrierPdcAnnuel title="Mars" :data="listeTachesMars" />
      <CalendrierPdcAnnuel title="Avril" :data="listeTachesAvril" />
      <CalendrierPdcAnnuel title="Mai" :data="listeTachesMai" />
      <CalendrierPdcAnnuel title="Juin" :data="listeTachesJuin" />
      <CalendrierPdcAnnuel title="Juillet" :data="listeTachesJuillet" />
      <CalendrierPdcAnnuel title="Aout" :data="listeTachesAout" />
      <CalendrierPdcAnnuel title="Septembre" :data="listeTachesSeptembre" />
      <CalendrierPdcAnnuel title="Octobre" :data="listeTachesOctobre" />
      <CalendrierPdcAnnuel title="Novembre" :data="listeTachesNovembre" />
      <CalendrierPdcAnnuel title="Décembre" :data="listeTachesDecembre" />
    </div>
    <AppSlideOver :sideModal="sideModalUpdate" :closeSideModal="showSideUpdate">
      <template #default>
        <AppSlideOverContent v-if="sideModalUpdate" :closeSideModal="showSideUpdate">
          <template #header>
            <p class="text-primary-700 px-4 text-center font-[Pacifico] text-3xl font-medium">Ajouter une tache</p>
          </template>
          <template #default>
            <div class="flex w-full flex-col items-center gap-4 lg:flex-row">
              <div class="mt-4 w-full print:hidden">
                <AppInputSearch placeholder="Rechercher une tache..." v-model="searchTache" />
              </div>
              <div class="flex h-fit w-32">
                <AppButtonValidated class="w-full" theme="" @click="addTaches()">
                  <template #default>Enregistrer</template>
                </AppButtonValidated>
              </div>
            </div>

            <div class="mt-4 w-full pb-4 text-sm print:hidden">
              <table class="relative w-full bg-white dark:bg-gray-800" style="table-layout: fixed">
                <colgroup>
                  <col style="width: 48px" />
                  <col style="width: 120px" />
                  <col />
                </colgroup>
                <thead class="">
                  <tr class="h-16 tracking-wider">
                    <th class="border-primary-300 border-b-2 px-4 py-3 text-left leading-4 tracking-wider">#</th>
                    <th class="border-primary-300 border-b-2 px-4 py-3 text-left leading-4 tracking-wider">
                      Catégories
                    </th>
                    <th class="border-primary-300 border-b-2 px-4 py-3 text-left leading-4 tracking-wider">Tâches</th>
                  </tr>
                </thead>
                <tbody
                  v-for="(tache, index) in rechercheTache"
                  :key="index"
                  class="hover:bg-primary-100 cursor-default">
                  <tr>
                    <td class="border-primary-300 border-b py-2 pl-4 print:hidden" @click.stop>
                      <div>
                        <input
                          type="checkbox"
                          :id="tache.id"
                          v-model="selectedTache"
                          :value="tache.id"
                          class="hidden" />
                        <label :for="tache.id" class="">
                          <div
                            class="relative h-3 w-3 cursor-pointer rounded border p-2"
                            :class="
                              selectedTache.includes(tache.id)
                                ? 'border-secondary-500 bg-secondary-400'
                                : 'border-gray-500'
                            ">
                            <Icon
                              name="lucide:check"
                              size="14"
                              class="absolute top-px left-px"
                              :class="
                                selectedTache.includes(tache.id) ? 'block text-white' : 'hidden text-transparent'
                              " />
                          </div>
                        </label>
                      </div>
                    </td>
                    <td class="border-primary-300 border-b px-4 py-2">
                      <div class="wrap-break-words leading-5">{{ tache.categorie }}</div>
                    </td>
                    <td class="border-primary-300 border-b p-4">
                      <div class="wrap-break-words">{{ tache.tache }}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <template #footer>
            <div class="flex w-full justify-end gap-4 pt-6">
              <AppButtonValidated class="w-32" theme="" @click="addTaches()">
                <template #default>Enregistrer</template>
              </AppButtonValidated>
            </div>
          </template>
        </AppSlideOverContent>
      </template>
    </AppSlideOver>
  </section>
</template>

<style scoped>
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    overflow: visible !important;
  }

  @page {
    size: A3 landscape;
    margin: 5mm;
  }

  section {
    height: auto !important;
    max-height: none !important;
  }
}
</style>
