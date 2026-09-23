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
    <section class="ident-card">
      <h3 class="ident-card__title">Aperçu</h3>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <p class="ident-help mb-2">Barre de navigation et page de connexion</p>
          <div class="panel-petrol ident-preview">
            <span v-if="logoUrl" class="ident-preview__tile">
              <AppLogo class="h-9 w-auto" />
            </span>
            <div class="flex flex-col gap-1" :class="{ 'items-center': !logoUrl }">
              <span class="font-[Traverse] text-[1.35rem] leading-none tracking-wide text-white">H00 Travaux</span>
              <span class="text-[0.72rem] leading-none text-white/60">{{ nomApercu }}</span>
            </div>
          </div>
        </div>
        <div>
          <p class="ident-help mb-2">Impressions et e-mails</p>
          <div class="ident-preview ident-preview--print">
            <AppLogo class="h-12 w-auto" />
            <div class="flex flex-col gap-1">
              <span class="text-petrol-900 text-base font-bold">H00 Travaux</span>
              <span class="text-xs text-slate-500">{{ nomApercu }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="ident-card">
      <h3 class="ident-card__title">Nom de l'infrapôle</h3>
      <p class="ident-help">
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

    <section class="ident-card">
      <h3 class="ident-card__title">Logo</h3>
      <p class="ident-help">
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

<style scoped>
.ident-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 56rem;
  padding: 1.25rem 1.5rem 1.5rem;
  border-radius: 0.75rem;
  background: #fff;
  box-shadow:
    0 1px 2px rgb(10 38 48 / 0.06),
    0 12px 28px -14px rgb(10 38 48 / 0.2);
  outline: 1px solid rgb(10 38 48 / 0.06);
  outline-offset: -1px;
}
.dark .ident-card {
  background: var(--color-night-800);
  box-shadow: 0 16px 32px -14px rgb(0 0 0 / 0.6);
  outline-color: rgb(255 255 255 / 0.07);
}
.ident-card__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-petrol-900);
}
.dark .ident-card__title {
  color: #e6eef0;
}
.ident-help {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #4a5d63;
}
.dark .ident-help {
  color: #9fb0b6;
}

/* Aperçus à l'échelle réelle */
.ident-preview {
  display: flex;
  height: 4rem;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border-radius: 0.6rem;
}
.ident-preview__tile {
  display: flex;
  padding: 0.2rem;
  border-radius: 0.45rem;
  background: #fff;
}
.ident-preview--print {
  justify-content: flex-start;
  padding: 0 1rem;
  background: #fff;
  outline: 1px solid rgb(10 38 48 / 0.12);
  outline-offset: -1px;
}
</style>
