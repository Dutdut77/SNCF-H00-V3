<script setup>
// Fiche d'un article du catalogue (design V4) : description, prix, unité de distribution et origine.
// Le symbole, référencé par les listes, n'est pas modifiable.
const props = defineProps({
  article: { type: Object, default: null }, // ouvre la fiche quand non null
  unites: { type: Array, default: () => [] } // référentiel catalogue_unites_distribution
})

const emit = defineEmits(['close', 'saved'])

const { updateArticle, ORIGINES } = useCatalogue()

const saving = ref(false)
const form = ref({ description: '', prix: '', unite_distribution: null, origine: 'supply_chain' })
const formInitial = ref('')

watch(
  () => props.article,
  (a) => {
    if (!a) return
    form.value = {
      description: a.description ?? '',
      prix: a.prix_ud == null ? '' : String(a.prix_ud).replace('.', ','),
      unite_distribution: a.unite_distribution || null,
      origine: a.origine ?? 'supply_chain'
    }
    formInitial.value = JSON.stringify(form.value)
  }
)

const uniteOptions = computed(() =>
  props.unites.map((u) => ({
    id: u.code,
    label: u.designation && u.designation !== u.code ? `${u.code} — ${u.designation}` : u.code
  }))
)

const prixValide = computed(() => {
  const brut = String(form.value.prix).trim().replace(',', '.')
  return brut === '' || Number.isFinite(parseFloat(brut))
})
const canSave = computed(() => form.value.description.trim().length > 0 && prixValide.value)
const dirty = computed(() => !!props.article && JSON.stringify(form.value) !== formInitial.value)

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
    origine: form.value.origine
  })

  saving.value = false
  if (updated) emit('saved', updated)
}
</script>

<template>
  <AppSidePanelForm
    :open="!!props.article"
    surtitre="Article du catalogue"
    :titre="props.article?.numero_symbole ?? ''"
    :sous-titre="props.article?.famille || ''"
    :valid="canSave"
    :dirty="dirty"
    :locked="saving"
    @close="emit('close')"
    @submit="save">
    <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="article-description">
      <div>
        <h3 id="article-description" class="text-ink font-semibold">Désignation</h3>
        <p class="text-ink-soft mt-0.5 text-xs">Le n° de symbole, référencé par les listes, n'est pas modifiable.</p>
      </div>
      <div>
        <label for="article-desc" :class="CHAMP_LIBELLE">Description</label>
        <input id="article-desc" v-model="form.description" type="text" autocomplete="off" class="form-control h-10" />
      </div>
      <div>
        <p :class="CHAMP_LIBELLE">Origine</p>
        <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Origine">
          <button
            v-for="o in ORIGINES"
            :key="o.id"
            type="button"
            role="radio"
            :aria-checked="form.origine === o.id"
            class="h-10 cursor-pointer rounded-lg border text-sm font-medium transition-colors"
            :class="segmentOption(form.origine === o.id)"
            @click="form.origine = o.id">
            {{ o.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="article-prix">
      <h3 id="article-prix" class="text-ink font-semibold">Distribution</h3>
      <div class="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <div>
          <label for="article-prix-champ" :class="CHAMP_LIBELLE">Prix UD (€)</label>
          <input
            id="article-prix-champ"
            v-model="form.prix"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="—"
            class="form-control h-10 tabular-nums"
            :class="{ 'border-red-400!': !prixValide }" />
        </div>
        <div>
          <p :class="CHAMP_LIBELLE">Unité de distribution</p>
          <AppSelect
            v-model="form.unite_distribution"
            v4
            :options="uniteOptions"
            placeholder="Aucune"
            searchable
            nullable />
        </div>
      </div>
    </section>
  </AppSidePanelForm>
</template>
