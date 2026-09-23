<script setup>
// Paramètres → Application → Identité : nom de l'infrapôle et logo de l'installation (SuperAdmin).
const { application, logoUrl, saveNomEntite, uploadLogo, removeLogo } = useApplication()
const { setLoader } = useLoader()

const nom = ref(application.value.nomEntite)
const nomAEnregistrer = computed(() => nom.value.trim() !== '' && nom.value.trim() !== application.value.nomEntite)
// L'aperçu suit la saisie, avant même l'enregistrement
const nomApercu = computed(() => nom.value.trim() || "Nom de l'infrapôle")

const enregistrerNom = async () => {
  setLoader(true)
  try {
    await saveNomEntite(nom.value)
  } finally {
    setLoader(false)
  }
}

const fileInput = ref(null)
const onLogoChoisi = async (event) => {
  const file = event.target.files?.[0]
  // Vidé pour pouvoir choisir de nouveau le même fichier
  event.target.value = ''
  if (!file) return
  setLoader(true)
  try {
    await uploadLogo(file)
  } finally {
    setLoader(false)
  }
}

const retirerLogo = async () => {
  setLoader(true)
  try {
    await removeLogo()
  } finally {
    setLoader(false)
  }
}
</script>

<template>
  <div class="flex h-full w-full flex-col gap-6 overflow-auto p-4">
    <AppTitleMain
      title="Identité de l'application"
      description="Nom de l'infrapôle et logo, affichés dans toute l'application" />

    <!-- Aperçu : bloc marque de la navbar et en-tête d'impression -->
    <section class="surface-card flex max-w-4xl flex-col gap-3 rounded-xl px-6 pt-5 pb-6">
      <h3 class="text-ink text-[0.95rem] font-semibold">Aperçu</h3>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <p class="text-ink-soft mb-2 text-[0.8125rem] leading-normal">Barre de navigation et page de connexion</p>
          <div class="panel-petrol flex h-16 items-center justify-center gap-3 rounded-[0.6rem]">
            <span v-if="logoUrl" class="flex rounded-[0.45rem] bg-white p-0.5">
              <AppLogo class="h-9 w-auto" />
            </span>
            <div class="flex flex-col gap-1" :class="{ 'items-center': !logoUrl }">
              <span class="font-traverse text-[1.35rem] leading-none tracking-wide text-white">H00 Travaux</span>
              <span class="text-[0.72rem] leading-none text-white/60">{{ nomApercu }}</span>
            </div>
          </div>
        </div>
        <div>
          <p class="text-ink-soft mb-2 text-[0.8125rem] leading-normal">Impressions et e-mails</p>
          <div
            class="flex h-16 items-center justify-start gap-3 rounded-[0.6rem] bg-white px-4 outline-1 -outline-offset-1 outline-slate-900/12">
            <AppLogo class="h-12 w-auto" />
            <div class="flex flex-col gap-1">
              <span class="text-petrol-900 text-base font-bold">H00 Travaux</span>
              <span class="text-xs text-slate-500">{{ nomApercu }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="surface-card flex max-w-4xl flex-col gap-3 rounded-xl px-6 pt-5 pb-6">
      <h3 class="text-ink text-[0.95rem] font-semibold">Nom de l'infrapôle</h3>
      <p class="text-ink-soft text-[0.8125rem] leading-normal">
        Affiché sur la page de connexion, dans la barre de navigation, le pied de page, les impressions et les e-mails.
      </p>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="w-full max-w-md">
          <AppInput v-model="nom" name="nom-entite" type="text" placeholder="Ex. : Infrapôle Paris-Est" />
        </div>
        <AppButtonValidated theme="petrol" type="button" :validated="nomAEnregistrer" @click="enregistrerNom">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:save" size="16" />
              Enregistrer le nom
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </section>

    <section class="surface-card flex max-w-4xl flex-col gap-3 rounded-xl px-6 pt-5 pb-6">
      <h3 class="text-ink text-[0.95rem] font-semibold">Logo</h3>
      <p class="text-ink-soft text-[0.8125rem] leading-normal">
        PNG à fond transparent ou JPEG, 1 Mo maximum. Sur le bandeau pétrole, il est posé sur une pastille blanche pour
        rester lisible quelle que soit sa couleur. Sans logo, l'application affiche seulement « H00 Travaux ».
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <input
          ref="fileInput"
          type="file"
          accept="image/png,image/jpeg"
          class="sr-only"
          aria-label="Fichier du logo"
          @change="onLogoChoisi" />
        <AppButtonValidated theme="outline" type="button" @click="fileInput.click()">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:image-up" size="16" />
              {{ logoUrl ? 'Remplacer le logo' : 'Choisir un logo' }}
            </span>
          </template>
        </AppButtonValidated>
        <AppButtonValidated v-if="logoUrl" theme="outline-danger" type="button" @click="retirerLogo">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:trash-2" size="16" />
              Retirer le logo
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </section>
  </div>
</template>
