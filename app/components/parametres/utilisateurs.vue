<script setup>
const { getAllUsers, updateUser, createUser, users } = useUsers()
const { getAllProfilTache, profilTaches } = useProfilTache()
const { getAttributions, siteOptions } = useAttributions()
const { setLoader } = useLoader()
const { isSuperAdmin } = useLevelUser()

// Options du select « Secteur » : Pôle IT (= tous les secteurs) + les vrais secteurs.
const userSiteOptions = computed(() => [{ id: 'Pôle IT', label: 'Pôle IT' }, ...siteOptions.value])

// Libellé du secteur à partir des options (code -> label) ; fallback sur le code brut.
const getSiteLabel = (code) => {
  if (!code) return '—'
  return userSiteOptions.value.find((o) => o.id === code)?.label || code
}

// Ordre et regroupement d'affichage du select « Profil ».
// On ne se base PAS sur num_profil croissant (RLT/KV s'entremêleraient) : l'ordre est défini
// ici explicitement. Les num_profil restent ceux de la BDD (référencés par users.profils et
// taches.tache_profil). `group: null` => option seule (sans en-tête).
const PROFIL_ORDER = [
  { num: -1, group: null }, // Visiteur
  { num: 41, group: 'Pôle IT' }, // Moetx Amont
  { num: 42, group: 'Pôle IT' }, // Chef de projet
  { num: 1, group: 'Secteur' }, // Logistique
  { num: 10, group: 'Secteur' }, // RLT voie
  { num: 20, group: 'Secteur' }, // RLT SES
  { num: 30, group: 'Secteur' }, // RLT CAT
  { num: 11, group: 'Secteur' }, // KV Voie
  { num: 21, group: 'Secteur' }, // KV SES
  { num: 31, group: 'Secteur' } // KV Cat
]

// Options du select Profil : ordonnées + groupées selon PROFIL_ORDER.
// Tout profil présent en BDD mais non listé ci-dessus est ajouté en fin (groupe « Autres »).
const profilOptions = computed(() => {
  const byNum = new Map(profilTaches.value.map((p) => [p.id, p]))
  const ordered = []
  for (const { num, group } of PROFIL_ORDER) {
    const p = byNum.get(num)
    if (p) ordered.push({ id: p.id, label: p.label, group })
  }
  const known = new Set(PROFIL_ORDER.map((o) => o.num))
  for (const p of profilTaches.value) {
    if (!known.has(p.id)) ordered.push({ id: p.id, label: p.label, group: 'Autres' })
  }
  return ordered
})

// Rôles : seul un SuperAdmin peut attribuer le rôle SuperAdmin
const ROLES = [
  { id: 0, label: 'Aucun', description: "Pas de droit d'administration" },
  { id: 1, label: 'Admin', description: 'Chantiers de son secteur, paramètres courants' },
  { id: 2, label: 'SuperAdmin', description: 'Tous les secteurs et tous les paramètres' }
]
const roleOptions = computed(() => ROLES.filter((r) => r.id < 2 || isSuperAdmin.value))
const getRoleLabel = (role) => ROLES.find((r) => r.id === role)?.label ?? 'Aucun'

// Particularités d'un agent, en pastilles dans le tableau et en interrupteurs dans la fiche
const PARTICULARITES = [
  {
    champ: 'pre_op',
    label: 'Pré-op',
    icon: 'lucide:hard-hat',
    pastille: 'bg-lime-100 text-lime-800 dark:bg-lime-400/15 dark:text-lime-300',
    iconClass: 'text-lime-600'
  },
  {
    champ: 'ref_du_rdu',
    label: 'Référent du RDU',
    icon: 'lucide:badge-check',
    pastille: 'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300',
    iconClass: 'text-sky-600'
  },
  {
    champ: 'en_formation',
    label: 'En formation',
    icon: 'lucide:graduation-cap',
    pastille: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
    iconClass: 'text-amber-500'
  }
]

// ============================================
// LISTE
// ============================================
const globalFilter = ref('')
const filtreSecteur = ref(null) // null = tous ; '' = sans secteur

// Tri par nom puis prénom ; les comptes sans nom (pas encore connectés) en fin de liste
const usersTries = computed(() =>
  [...(users.value || [])].sort(
    (a, b) =>
      !a.nom - !b.nom ||
      (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' }) ||
      (a.prenom || '').localeCompare(b.prenom || '', 'fr', { sensitivity: 'base' })
  )
)

const filtresSecteur = computed(() => {
  const compte = {}
  for (const u of users.value || []) compte[u.site || ''] = (compte[u.site || ''] ?? 0) + 1
  const options = [{ id: null, label: 'Tous', count: users.value?.length ?? 0 }]
  for (const o of userSiteOptions.value) if (compte[o.id]) options.push({ ...o, count: compte[o.id] })
  if (compte['']) options.push({ id: '', label: 'Sans secteur', count: compte[''] })
  return options
})

const filteredUsers = computed(() => {
  const search = globalFilter.value.trim().toLowerCase()
  return usersTries.value.filter((u) => {
    if (filtreSecteur.value !== null && (u.site || '') !== filtreSecteur.value) return false
    if (!search) return true
    const searchable = [
      u.nom,
      u.prenom,
      u.email,
      u.profil_name,
      getSiteLabel(u.site),
      getRoleLabel(u.role),
      u.pre_op ? 'pre-op pré-op' : '',
      u.ref_du_rdu ? 'rdu' : '',
      u.en_formation ? 'en formation' : ''
    ]
      .join(' ')
      .toLowerCase()
    return searchable.includes(search)
  })
})

// ============================================
// FICHE : création / modification
// ============================================
const open = ref(false)
const isNew = ref(false)
const form = ref({})
const formInitial = ref('')
const saving = ref(false)

const NOUVEL_UTILISATEUR = {
  email: '',
  nom: '',
  prenom: '',
  profils: -1,
  role: 0,
  pre_op: false,
  ref_du_rdu: false,
  en_formation: false,
  site: null
}

const ouvrir = (row) => {
  form.value = row
    ? {
        ...row,
        role: row.role ?? 0,
        pre_op: row.pre_op ?? false,
        ref_du_rdu: row.ref_du_rdu ?? false,
        en_formation: row.en_formation ?? false
      }
    : { ...NOUVEL_UTILISATEUR }
  formInitial.value = JSON.stringify(form.value)
  isNew.value = !row
  open.value = true
}
const openSlide = (row) => row && ouvrir(row)
const openAddSlide = () => ouvrir(null)

const closeSlide = () => {
  open.value = false
  form.value = {}
}

const emailValide = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email?.trim() || ''))
const validatedFields = computed(() => (isNew.value ? emailValide.value : true))
const dirty = computed(() => open.value && JSON.stringify(form.value) !== formInitial.value)
const nomComplet = computed(() => [form.value.prenom, form.value.nom].filter(Boolean).join(' ').trim())

const enregistrer = async () => {
  if (!validatedFields.value) return
  saving.value = true
  setLoader(true)
  try {
    if (isNew.value) {
      const result = await createUser({ ...form.value, email: form.value.email.trim() })
      if (result) closeSlide()
    } else {
      await updateUser(form.value)
      closeSlide()
    }
  } finally {
    saving.value = false
    setLoader(false)
  }
}

// Active le loader pendant le chargement initial
setLoader(true)
try {
  await Promise.all([getAllUsers(), getAllProfilTache(), getAttributions()])
} finally {
  setLoader(false)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-8 lg:pt-4 lg:pb-4">
    <!-- Barre d'outils -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <AppInputSearch
        v-model="globalFilter"
        boxed
        dense
        class="w-full sm:max-w-sm"
        placeholder="Rechercher un nom, un e-mail, un profil…" />
      <AppButtonValidated theme="brand" type="button" class="sm:ml-auto" @click="openAddSlide">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:user-plus" size="16" />
            Nouvel utilisateur
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <AppFilterPills v-model="filtreSecteur" :options="filtresSecteur" label="Filtrer par secteur" />

    <!-- Tableau des utilisateurs -->
    <div :class="TABLEAU_CARTE">
      <table class="w-full min-w-max text-sm">
        <thead :class="TABLEAU_TETE">
          <tr>
            <th class="px-4 py-2.5 text-left">Utilisateur</th>
            <th class="px-4 py-2.5 text-left">Profil</th>
            <th class="px-4 py-2.5 text-left">Secteur</th>
            <th class="px-4 py-2.5 text-left">Rôle</th>
            <th class="px-4 py-2.5 text-left">Particularités</th>
          </tr>
        </thead>
        <tbody :class="TABLEAU_CORPS">
          <tr v-for="u in filteredUsers" :key="u.id" :class="TABLEAU_LIGNE" @click="openSlide(u)">
            <td class="px-4 py-2.5">
              <div class="flex items-center gap-3">
                <AppAvatar
                  :nom="u.nom || u.email || ''"
                  :prenom="u.prenom || ''"
                  size="sm"
                  color="bg-slate-200 text-slate-700 dark:bg-white/15 dark:text-white" />
                <div class="min-w-0">
                  <p class="text-ink font-medium">{{ [u.nom, u.prenom].filter(Boolean).join(' ') || '—' }}</p>
                  <p class="text-ink-soft text-xs">{{ u.email || '—' }}</p>
                </div>
              </div>
            </td>
            <td class="text-ink px-4 py-2.5">{{ u.profil_name || '—' }}</td>
            <td class="px-4 py-2.5">
              <span
                v-if="u.site"
                class="text-ink inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap dark:bg-white/8">
                <Icon
                  :name="u.site === 'Pôle IT' ? 'lucide:monitor-cog' : 'lucide:map-pin'"
                  size="12"
                  class="text-slate-400 dark:text-white/50" />
                {{ getSiteLabel(u.site) }}
              </span>
              <span v-else class="text-slate-300 dark:text-white/25">—</span>
            </td>
            <td class="px-4 py-2.5">
              <span
                v-if="u.role === 2"
                class="bg-magenta-700 dark:bg-magenta-500 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white">
                SuperAdmin
              </span>
              <span
                v-else-if="u.role === 1"
                class="text-magenta-700 ring-magenta-300 dark:text-magenta-300 dark:ring-magenta-400/50 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset">
                Admin
              </span>
              <span v-else class="text-slate-300 dark:text-white/25">—</span>
            </td>
            <td class="px-4 py-2.5">
              <div class="flex flex-wrap gap-1.5">
                <template v-for="p in PARTICULARITES" :key="p.champ">
                  <span
                    v-if="u[p.champ]"
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
                    :class="p.pastille">
                    <Icon :name="p.icon" size="12" />
                    {{ p.label }}
                  </span>
                </template>
                <span v-if="PARTICULARITES.every((p) => !u[p.champ])" class="text-slate-300 dark:text-white/25">—</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredUsers.length === 0" class="text-ink-soft flex flex-col items-center gap-2 p-10 text-sm">
        <Icon name="lucide:users" size="28" class="opacity-40" />
        Aucun utilisateur trouvé
      </div>
    </div>

    <!-- Fiche : création / modification -->
    <AppSidePanelForm
      :open="open"
      surtitre="Utilisateur"
      :titre="nomComplet || (isNew ? 'Nouvel utilisateur' : form.email || '—')"
      :sous-titre="!isNew ? form.email : ''"
      :valid="validatedFields"
      :dirty="dirty"
      :locked="saving"
      :submit-label="isNew ? 'Créer l\'utilisateur' : 'Enregistrer'"
      @close="closeSlide"
      @submit="enregistrer">
      <template #visuel>
        <AppAvatar
          :nom="form.nom || form.email || ''"
          :prenom="form.prenom || ''"
          size="md"
          color="bg-white/15 text-white" />
      </template>

      <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="user-identite">
        <h3 id="user-identite" class="text-ink font-semibold">Identité</h3>
        <div v-if="isNew">
          <label for="user-email" :class="CHAMP_LIBELLE">E-mail SNCF</label>
          <input
            id="user-email"
            v-model="form.email"
            type="email"
            autocomplete="off"
            class="form-control h-10"
            placeholder="prenom.nom@sncf.fr" />
          <p class="text-ink-soft mt-1.5 flex items-start gap-1.5 text-xs">
            <Icon name="lucide:info" size="14" class="mt-px shrink-0" />
            Le compte sera lié à l'utilisateur à sa première connexion SNCF.
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="user-nom" :class="CHAMP_LIBELLE">Nom</label>
            <input id="user-nom" v-model="form.nom" type="text" autocomplete="off" class="form-control h-10" />
          </div>
          <div>
            <label for="user-prenom" :class="CHAMP_LIBELLE">Prénom</label>
            <input id="user-prenom" v-model="form.prenom" type="text" autocomplete="off" class="form-control h-10" />
          </div>
        </div>
      </section>

      <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="user-rattachement">
        <h3 id="user-rattachement" class="text-ink font-semibold">Rattachement</h3>
        <div>
          <p :class="CHAMP_LIBELLE">Profil</p>
          <AppSelect v-model="form.profils" v4 :options="profilOptions" placeholder="Aucun profil" />
        </div>
        <div>
          <p :class="CHAMP_LIBELLE">Secteur</p>
          <AppSelect v-model="form.site" v4 :options="userSiteOptions" placeholder="Aucun secteur" nullable />
          <p class="text-ink-soft mt-1.5 text-xs">Pôle IT : accès à tous les secteurs.</p>
        </div>
      </section>

      <section class="surface-card rounded-xl p-5" aria-labelledby="user-role">
        <h3 id="user-role" class="text-ink mb-3 font-semibold">Droits d'accès</h3>
        <div class="grid gap-2" role="radiogroup" aria-labelledby="user-role">
          <button
            v-for="r in roleOptions"
            :key="r.id"
            type="button"
            role="radio"
            :aria-checked="form.role === r.id"
            class="flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors"
            :class="segmentOption(form.role === r.id)"
            @click="form.role = r.id">
            <span
              class="flex size-4 shrink-0 items-center justify-center rounded-full border-2"
              :class="
                form.role === r.id
                  ? 'border-magenta-600 dark:border-magenta-300'
                  : 'border-slate-300 dark:border-white/30'
              ">
              <span v-if="form.role === r.id" class="bg-magenta-600 dark:bg-magenta-300 size-1.5 rounded-full" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-semibold">{{ r.label }}</span>
              <span class="text-ink-soft block text-xs font-normal">{{ r.description }}</span>
            </span>
          </button>
        </div>
      </section>

      <section class="surface-card rounded-xl p-5" aria-labelledby="user-particularites">
        <h3 id="user-particularites" class="text-ink mb-3 font-semibold">Particularités</h3>
        <div class="space-y-2">
          <AppSwitchRow
            v-for="p in PARTICULARITES"
            :key="p.champ"
            v-model="form[p.champ]"
            :label="p.label"
            :icon="p.icon"
            :icon-class="p.iconClass" />
        </div>
      </section>
    </AppSidePanelForm>
  </div>
</template>
