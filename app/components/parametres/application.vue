<script setup>
// Paramètres → Application → Identité : nom de l'infrapôle et logo de l'installation (SuperAdmin).
const { application, logoUrl, saveNomEntite, uploadLogo, removeLogo } = useApplication()
const { setLoader } = useLoader()

const nom = ref(application.value.nomEntite)
const nomAEnregistrer = computed(() => nom.value.trim() !== '' && nom.value.trim() !== application.value.nomEntite)
// L'aperçu suit la saisie, avant même l'enregistrement
const nomApercu = computed(() => nom.value.trim() || "Nom de l'infrapôle")

const enregistrerNom = async () => {
  if (!nomAEnregistrer.value) return
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

const confirmRetrait = ref(false)
const retirerLogo = async () => {
  confirmRetrait.value = false
  setLoader(true)
  try {
    await removeLogo()
  } finally {
    setLoader(false)
  }
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 lg:px-8 lg:pt-4 lg:pb-6">
    <div class="grid gap-4 lg:grid-cols-2">
      <!-- Aperçu : bloc marque de la barre de navigation et en-tête des impressions -->
      <section class="surface-card rounded-xl p-5 lg:col-span-2" aria-labelledby="identite-apercu">
        <h2 id="identite-apercu" class="text-ink font-semibold">Aperçu</h2>
        <p class="text-ink-soft mt-0.5 text-xs">Suit la saisie, avant même l'enregistrement.</p>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <figure>
            <div
              class="bg-card border-rule flex h-16 items-center gap-3 rounded-lg border px-4 shadow-[0_1px_2px_rgb(43_4_35/0.06)]">
              <span v-if="logoUrl" class="flex rounded-md bg-white p-0.5 ring-1 ring-slate-200 dark:ring-0">
                <AppLogo class="h-9 w-auto" />
              </span>
              <div class="flex min-w-0 flex-col gap-1">
                <span
                  class="font-traverse from-magenta-500 via-prune-500 to-prune-700 dark:from-magenta-400 dark:via-prune-300 dark:to-prune-100 bg-linear-90 bg-clip-text text-[1.35rem] leading-none tracking-wide whitespace-nowrap text-transparent">
                  H00 Travaux
                </span>
                <span class="text-ink-soft truncate text-[0.72rem] leading-none">{{ nomApercu }}</span>
              </div>
            </div>
            <figcaption class="text-ink-soft mt-2 text-xs">Barre de navigation</figcaption>
          </figure>
          <figure>
            <div
              class="flex h-16 items-center gap-3 rounded-lg bg-white px-4 outline-1 -outline-offset-1 outline-slate-900/12">
              <AppLogo class="h-12 w-auto" />
              <div class="flex min-w-0 flex-col gap-1">
                <span class="text-magenta-900 text-base font-bold">H00 Travaux</span>
                <span class="truncate text-xs text-slate-500">{{ nomApercu }}</span>
              </div>
            </div>
            <figcaption class="text-ink-soft mt-2 text-xs">Impressions et e-mails</figcaption>
          </figure>
        </div>
      </section>

      <!-- Nom de l'infrapôle : Entrée enregistre -->
      <section class="surface-card flex flex-col rounded-xl p-5" aria-labelledby="identite-nom">
        <h2 id="identite-nom" class="text-ink font-semibold">Nom de l'infrapôle</h2>
        <p class="text-ink-soft mt-0.5 text-xs leading-normal">
          Affiché sur la page de connexion, dans la barre de navigation, le pied de page, les impressions et les
          e-mails.
        </p>
        <form class="mt-4 flex flex-1 flex-col gap-3" @submit.prevent="enregistrerNom">
          <label for="nom-entite" class="sr-only">Nom de l'infrapôle</label>
          <input
            id="nom-entite"
            v-model="nom"
            type="text"
            autocomplete="off"
            class="form-control h-10"
            placeholder="Ex. : Infrapôle Paris-Est" />
          <div class="mt-auto flex items-center justify-end gap-3 pt-1">
            <p v-if="nomAEnregistrer" class="text-ink-soft mr-auto flex items-center gap-1.5 text-xs">
              <span class="bg-ochre-400 size-1.5 rounded-full" />
              Non enregistré
            </p>
            <AppButtonValidated theme="brand" type="submit" :validated="nomAEnregistrer">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:save" size="16" />
                  Enregistrer le nom
                </span>
              </template>
            </AppButtonValidated>
          </div>
        </form>
      </section>

      <!-- Logo : le logo actuel, ou la place qu'il prendra -->
      <section class="surface-card flex flex-col rounded-xl p-5" aria-labelledby="identite-logo">
        <h2 id="identite-logo" class="text-ink font-semibold">Logo</h2>
        <p class="text-ink-soft mt-0.5 text-xs leading-normal">
          PNG à fond transparent ou JPEG, 1 Mo maximum. Sans logo, l'application affiche seulement « H00 Travaux ».
        </p>
        <div class="mt-4 flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div
            class="flex h-20 w-32 shrink-0 items-center justify-center rounded-lg p-2"
            :class="
              logoUrl
                ? 'bg-white outline-1 -outline-offset-1 outline-slate-900/12'
                : 'text-ink-soft border-2 border-dashed border-slate-200 dark:border-white/15'
            ">
            <AppLogo v-if="logoUrl" class="max-h-full w-auto" />
            <Icon v-else name="lucide:image" size="24" class="opacity-60" />
          </div>
          <div class="flex flex-wrap items-center gap-2">
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
                  {{ logoUrl ? 'Remplacer' : 'Choisir un logo' }}
                </span>
              </template>
            </AppButtonValidated>
            <AppButtonValidated v-if="logoUrl" theme="outline-danger" type="button" @click="confirmRetrait = true">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:trash-2" size="16" />
                  Retirer
                </span>
              </template>
            </AppButtonValidated>
          </div>
        </div>
      </section>
    </div>

    <AppConfirmModal v-model="confirmRetrait" title="Retirer le logo" confirm-label="Retirer" @confirm="retirerLogo">
      L'application affichera seulement « H00 Travaux », sur toutes les pages, les impressions et les e-mails.
    </AppConfirmModal>
  </div>
</template>
