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
const { getChantiersNonTermines, getChantiers } = useChantiers()
const { getContactsTravauxChantiersArray } = useContacts()
const { getAllH00ByChantierArray } = useH00()
const { isAuthorizedForTache } = useLevelUser()
const user = useAuthUser()
// const { getAllH00Pdc, allH00Pdc } = useH00();

const year = ref(new Date().getFullYear())
const listeTaches = ref([])
const sideModalUpdate = ref(false)
const searchTache = ref('')
const selectedTache = ref([])
const userChantiers = ref([])
const userH00Entries = ref([])

const userIdPresentInContactsTravaux = (userEmail, contactsTravaux) => {
  return contactsTravaux
    .filter((item) => {
      const fields = [
        item.rlt_voie_principale,
        ...(item.rlt_voie_secondaire || []),
        item.rlt_ses_principale,
        ...(item.rlt_ses_secondaire || []),
        item.rlt_cat_principale,
        ...(item.rlt_cat_secondaire || []),
        item.preop_voie,
        item.preop_ses,
        item.logistique,
        ...(item.supervisor || [])
      ]

      return fields.includes(userEmail)
    })
    .map((item) => item.chantier_id) // 👉 EXTRACTION UNIQUEMENT DES IDs
}

const loadAllData = async () => {
  setLoader(true)
  try {
    // Récupérer tous les chantiers
    await getTaches()
    await getChantiers()
    // Si il y a des chantiers non terminés, récupérer les IDs des chantiers non terminés
    if (getChantiersNonTermines.value.length > 0) {
      // Récupérer les IDs des chantiers non terminés
      let listChantiers = getChantiersNonTermines.value.map((chantier) => chantier.id)
      // Récupérer les contacts des chantiers non terminés
      const contactsTravaux = await getContactsTravauxChantiersArray(listChantiers)
      // Vérifier si l'utilisateur est présent dans les contacts des chantiers non terminés
      const matchingChantierContactIds = userIdPresentInContactsTravaux(user.value.email, contactsTravaux)
      // Filtrer les chantiers pour ne garder que ceux qui ont des contacts travaux avec l'utilisateur
      userChantiers.value = getChantiersNonTermines.value.filter((chantier) =>
        matchingChantierContactIds.includes(chantier.id)
      )
      console.log(userChantiers.value)
      // Récupérer les entrées h00 pour les chantiers non terminés ou le user est intervenant
      const h00Entries = await getAllH00ByChantierArray(matchingChantierContactIds)

      // Filtrer les entrées h00 pour ne garder que celles qui sont autorisées par l'utilisateur
      const filtered = await Promise.all(
        h00Entries.data.map(async (item) => {
          const authorized = await isAuthorizedForTache(item.chantiers, item.taches.tache_profil)
          return authorized ? item : null
        })
      )
      // Filtrer les entrées h00 pour ne garder que celles qui sont autorisées par l'utilisateur et non cloturées
      const filteredH00EntriesNotNull = filtered.filter((item) => item !== null)

      userH00Entries.value = filteredH00EntriesNotNull
    }
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
  return userH00Entries.value
    .filter((item) => {
      if (!item.prevision) return false
      return new Date(item.prevision).getFullYear() === year.value
    })
    .map((item) => {
      const date = new Date(item.prevision)

      return {
        ...item,
        mois: date.getMonth() + 1 // 1 → 12
      }
    })
})

const reduceAllH00PdcByListeTache = computed(() => {
  const filteredTasks = filteredByYear.value.filter((task) => listeTaches.value.includes(task.tache_id))

  const result = {}

  filteredTasks.forEach((task) => {
    const mois = task.mois
    const tacheName = task.taches?.tache
    const chantier = {
      id: task.chantiers.id,
      name: task.chantiers.name
    }

    // Init mois
    if (!result[mois]) {
      result[mois] = {
        mois,
        taches: []
      }
    }

    // Recherche de la tâche dans le mois
    let tache = result[mois].taches.find((t) => t.name === tacheName)

    if (!tache) {
      tache = {
        name: tacheName,
        status: task.status,
        chantiers: []
      }
      result[mois].taches.push(tache)
    }

    // Évite les doublons de chantiers
    if (!tache.chantiers.some((c) => c.id === chantier.id)) {
      tache.chantiers.push(chantier)
    }
  })

  // Retourne un tableau trié par mois
  return Object.values(result).sort((a, b) => a.mois - b.mois)
})

const listeTachesJanvier = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.mois === 1)
    return result[0]
  }
})
const listeTachesFevrier = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.mois === 2)
    return result[0]
  }
})
const listeTachesMars = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.mois === 3)
    return result[0]
  }
})
const listeTachesAvril = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.mois === 4)
    return result[0]
  }
})
const listeTachesMai = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.mois === 5)
    return result[0]
  }
})
const listeTachesJuin = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.mois === 6)
    return result[0]
  }
})
const listeTachesJuillet = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.mois === 7)
    return result[0]
  }
})
const listeTachesAout = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.mois === 8)
    return result[0]
  }
})
const listeTachesSeptembre = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.mois === 9)
    return result[0]
  }
})
const listeTachesOctobre = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.mois === 10)
    return result[0]
  }
})
const listeTachesNovembre = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.mois === 11)
    return result[0]
  }
})
const listeTachesDecembre = computed(() => {
  if (reduceAllH00PdcByListeTache.value.length > 0) {
    const result = reduceAllH00PdcByListeTache.value.filter((item) => item.mois === 12)
    return result[0]
  }
})

onMounted(async () => {
  await loadAllData()
})
</script>

<template>
  <section
    class="flex w-full flex-col gap-4 p-4 lg:h-full lg:overflow-hidden lg:px-4 lg:py-0 lg:pt-4 print:overflow-visible">
    <div class="flex w-full flex-col gap-4 md:flex-row md:items-center">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:justify-start">
        <img src="/images/logo_uo.png" alt="Logo" class="hidden w-12 print:block" />
        <AppTitleMain :title="titreYear" description="Planning annuel des tâches pour l'année en cours" />
        <div class="text-primary-800 ml-auto text-sm italic">
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
  }

  @page {
    size: A3 landscape;
    margin: 5mm;
  }
}
</style>
