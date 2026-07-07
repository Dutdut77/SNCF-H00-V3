<script setup>
const props = defineProps({
  article: { type: Object, default: null }, // ouvre la modale quand non null
  unites: { type: Array, default: () => [] }, // référentiel catalogue_unites_distribution
})

const emit = defineEmits(['close', 'saved'])

const { updateArticle, ORIGINES } = useCatalogue()

const saving = ref(false)
const form = ref({ description: '', prix: '', unite_distribution: null, origine: 'supply_chain' })

watch(
  () => props.article,
  (a) => {
    if (!a) return
    form.value = {
      description: a.description ?? '',
      prix: a.prix_ud == null ? '' : String(a.prix_ud).replace('.', ','),
      unite_distribution: a.unite_distribution || null,
      origine: a.origine ?? 'supply_chain',
    }
  },
)

const uniteOptions = computed(() =>
  props.unites.map((u) => ({
    id: u.code,
    label: u.designation && u.designation !== u.code ? `${u.code} — ${u.designation}` : u.code,
  })),
)

const origineOptions = computed(() => ORIGINES.map((o) => ({ id: o.id, label: o.label })))

const canSave = computed(() => form.value.description.trim().length > 0 && !saving.value)

const save = async () => {
  if (!canSave.value || !props.article) return
  saving.value = true

  const rawPrix = String(form.value.prix).trim().replace(',', '.')
  const prix = rawPrix === '' ? null : parseFloat(rawPrix)

  const updated = await updateArticle(props.article.numero_symbole, {
    description: form.value.description.trim(),
    prix_ud: Number.isFinite(prix) ? prix : null,
    // colonnes TEXT NOT NULL DEFAULT '' : l'état vide est '', pas null
    unite_distribution: form.value.unite_distribution || '',
    origine: form.value.origine,
  })

  saving.value = false
  if (updated) emit('saved', updated)
}
</script>

<template>
  <AppModal :model-value="!!article" size="xl" @update:model-value="emit('close')">
    <template #header>
      <h3 class="text-base font-semibold text-slate-800 dark:text-white">Modifier l'article</h3>
    </template>

    <div v-if="article" class="space-y-4">
      <!-- Symbole (PK référencée par les listes : non modifiable) -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">N° de symbole</label>
        <span
          class="inline-flex items-center rounded-md px-2.5 py-1 font-mono text-sm font-semibold ring-1"
          :class="article.origine === 'contrat_cadre'
            ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700/40'
            : 'bg-secondary-50 text-secondary-700 ring-secondary-100 dark:bg-secondary-900/20 dark:text-secondary-300 dark:ring-secondary-800/40'"
        >
          {{ article.numero_symbole }}
        </span>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
        <input
          v-model="form.description"
          type="text"
          class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Prix UD (€)</label>
          <input
            v-model="form.prix"
            type="text"
            placeholder="—"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
        </div>
        <AppSelect
          v-model="form.unite_distribution"
          :options="uniteOptions"
          title="Unité de distribution"
          placeholder="Aucune"
          searchable
          nullable
        />
      </div>

      <AppSelect v-model="form.origine" :options="origineOptions" title="Origine" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          @click="emit('close')"
        >
          Annuler
        </button>
        <button
          type="button"
          :disabled="!canSave"
          class="flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-700 disabled:opacity-50"
          @click="save"
        >
          <div v-if="saving" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Enregistrer
        </button>
      </div>
    </template>
  </AppModal>
</template>
