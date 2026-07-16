<script setup>
// Section imprimable "Logistique" : base vie, imprimante, réseau et radio sur une page.
const props = defineProps({
  equipements: {
    type: Object,
    required: true
  },
  imprimantes: {
    type: Array,
    default: () => []
  },
  boxes: {
    type: Array,
    default: () => []
  }
})

const VAC_LABELS = { bb8: 'BB8', bb10: 'BB10', base12d: 'Base 12D' }
const FOURNISSEUR_LABELS = { sncf: 'SNCF', entreprise: 'Entreprise' }

// Résolution des matériels rattachés (imprimante / box) par id
const imprimanteById = computed(() => Object.fromEntries(props.imprimantes.map((p) => [p.id, p])))
const boxById = computed(() => Object.fromEntries(props.boxes.map((b) => [b.id, b])))
const imprimanteItems = computed(() =>
  (props.equipements.imprimante?.ids || []).map((id) => imprimanteById.value[id]).filter(Boolean)
)
const boxItems = computed(() => (props.equipements.wifi?.ids || []).map((id) => boxById.value[id]).filter(Boolean))

// Format de date court (jj/mm/aa)
const fmt = (d) => {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

// Badge d'état pour un poste à cycle pose/dépose (base vie, radio)
const phaseStatus = (poste) => {
  if (poste.besoin === false) return { label: 'Aucun besoin', cls: 'border-gray-200 bg-gray-100 text-gray-600' }
  if (poste.besoin !== true) return { label: 'À définir', cls: 'border-amber-200 bg-amber-50 text-amber-700' }
  if (poste.depose?.status === 2) return { label: 'Déposé', cls: 'border-slate-300 bg-slate-100 text-slate-700' }
  if (poste.pose?.status === 2) return { label: 'En place', cls: 'border-green-200 bg-green-50 text-green-700' }
  return { label: 'À installer', cls: 'border-red-200 bg-red-50 text-red-700' }
}

// Badge d'état pour un poste à inventaire (imprimante, réseau) — même cycle besoin que la base vie
const refStatus = (poste) => {
  if (poste.besoin === false) return { label: 'Aucun besoin', cls: 'border-gray-200 bg-gray-100 text-gray-600' }
  if (poste.besoin !== true) return { label: 'À définir', cls: 'border-amber-200 bg-amber-50 text-amber-700' }
  if (!poste.ids?.length) return { label: 'À équiper', cls: 'border-amber-200 bg-amber-50 text-amber-700' }
  if (poste.depose?.status === 2) return { label: 'Retiré', cls: 'border-slate-300 bg-slate-100 text-slate-700' }
  if (poste.pose?.status === 2) return { label: 'Installé', cls: 'border-green-200 bg-green-50 text-green-700' }
  return { label: 'À installer', cls: 'border-red-200 bg-red-50 text-red-700' }
}

const baseVie = computed(() => props.equipements.base_vie)
const imprimante = computed(() => props.equipements.imprimante)
const reseau = computed(() => props.equipements.wifi)
const radio = computed(() => props.equipements.radios)
</script>

<template>
  <section class="mb-8 break-inside-avoid">
    <!-- En-tête de section -->
    <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
      <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
        <Icon name="lucide:package" size="18" />
      </div>
      <h3 class="text-lg font-bold text-gray-700 uppercase">Logistique</h3>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- ══ BASE VIE ══ -->
      <div class="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50/60">
        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
          <div class="flex items-center gap-2">
            <Icon name="lucide:caravan" size="16" class="text-primary-700" />
            <span class="text-sm font-bold tracking-wide text-gray-700 uppercase">Base vie</span>
          </div>
          <span class="rounded-full border px-2.5 py-0.5 text-xs font-semibold" :class="phaseStatus(baseVie).cls">
            {{ phaseStatus(baseVie).label }}
          </span>
        </div>
        <div class="px-4 py-3">
          <template v-if="baseVie.besoin === true">
            <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">VAC</span>
                <p class="font-medium text-gray-800">{{ VAC_LABELS[baseVie.modules?.vac] || '—' }}</p>
              </div>
              <div>
                <span class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">ALGECO</span>
                <p class="font-medium text-gray-800">
                  {{ baseVie.modules?.algeco ? baseVie.modules.algeco + ' module(s)' : '—' }}
                </p>
              </div>
              <div>
                <span class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Groupe électrogène</span>
                <p class="font-medium text-gray-800">{{ baseVie.modules?.groupe_electrogene ? 'Oui' : 'Non' }}</p>
              </div>
              <div>
                <span class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Date de pose</span>
                <p class="font-medium text-gray-800">{{ fmt(baseVie.pose?.date) }}</p>
              </div>
              <div>
                <span class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Date de dépose</span>
                <p class="font-medium text-gray-800">{{ fmt(baseVie.depose?.date) }}</p>
              </div>
            </div>
            <div v-if="baseVie.pose?.commentaire || baseVie.depose?.commentaire" class="mt-3 space-y-1.5">
              <p v-if="baseVie.pose?.commentaire" class="text-xs text-gray-600">
                <span class="font-semibold text-gray-500">Pose :</span> {{ baseVie.pose.commentaire }}
              </p>
              <p v-if="baseVie.depose?.commentaire" class="text-xs text-gray-600">
                <span class="font-semibold text-gray-500">Dépose :</span> {{ baseVie.depose.commentaire }}
              </p>
            </div>
          </template>
          <p v-else class="text-sm text-gray-400 italic">
            {{ baseVie.besoin === false ? 'Pas de base vie sur ce chantier.' : 'Besoin non défini.' }}
          </p>
        </div>
      </div>

      <!-- ══ IMPRIMANTE ══ -->
      <div class="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50/60">
        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
          <div class="flex items-center gap-2">
            <Icon name="lucide:printer" size="16" class="text-primary-700" />
            <span class="text-sm font-bold tracking-wide text-gray-700 uppercase">Imprimante</span>
          </div>
          <span class="rounded-full border px-2.5 py-0.5 text-xs font-semibold" :class="refStatus(imprimante).cls">
            {{ refStatus(imprimante).label }}
          </span>
        </div>
        <div class="px-4 py-3">
          <template v-if="imprimante.besoin === true && imprimanteItems.length">
            <div class="space-y-2">
              <div
                v-for="it in imprimanteItems"
                :key="it.id"
                class="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
                <span class="text-sm font-medium text-gray-800">
                  {{ [it.marque, it.model].filter(Boolean).join(' ') || 'Imprimante' }}
                </span>
                <span
                  v-if="it.identification"
                  class="rounded bg-teal-600 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                  {{ it.identification }}
                </span>
              </div>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-x-4 text-sm">
              <div>
                <span class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Installation</span>
                <p class="font-medium text-gray-800">{{ fmt(imprimante.pose?.date) }}</p>
              </div>
              <div>
                <span class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Retrait</span>
                <p class="font-medium text-gray-800">{{ fmt(imprimante.depose?.date) }}</p>
              </div>
            </div>
          </template>
          <p v-else class="text-sm text-gray-400 italic">
            {{
              imprimante.besoin === true
                ? 'Aucune imprimante rattachée.'
                : imprimante.besoin === false
                  ? 'Pas d’imprimante sur ce chantier.'
                  : 'Besoin non défini.'
            }}
          </p>
        </div>
      </div>

      <!-- ══ RÉSEAU ══ -->
      <div class="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50/60">
        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
          <div class="flex items-center gap-2">
            <Icon name="lucide:wifi" size="16" class="text-primary-700" />
            <span class="text-sm font-bold tracking-wide text-gray-700 uppercase">Réseau</span>
          </div>
          <span class="rounded-full border px-2.5 py-0.5 text-xs font-semibold" :class="refStatus(reseau).cls">
            {{ refStatus(reseau).label }}
          </span>
        </div>
        <div class="px-4 py-3">
          <template v-if="reseau.besoin === true && boxItems.length">
            <div class="space-y-2">
              <div
                v-for="b in boxItems"
                :key="b.id"
                class="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
                <span class="text-sm font-medium text-gray-800">
                  {{ b.nom || b.serie || 'Box' }}
                  <span v-if="b.serie && b.nom" class="text-xs font-normal text-gray-400">· S/N {{ b.serie }}</span>
                </span>
                <span
                  v-if="b.identification"
                  class="rounded bg-teal-600 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                  {{ b.identification }}
                </span>
              </div>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-x-4 text-sm">
              <div>
                <span class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Installation</span>
                <p class="font-medium text-gray-800">{{ fmt(reseau.pose?.date) }}</p>
              </div>
              <div>
                <span class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Retrait</span>
                <p class="font-medium text-gray-800">{{ fmt(reseau.depose?.date) }}</p>
              </div>
            </div>
          </template>
          <p v-else class="text-sm text-gray-400 italic">
            {{
              reseau.besoin === true
                ? 'Aucune box rattachée.'
                : reseau.besoin === false
                  ? 'Pas de box réseau sur ce chantier.'
                  : 'Besoin non défini.'
            }}
          </p>
        </div>
      </div>

      <!-- ══ RADIO ══ -->
      <div class="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50/60">
        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
          <div class="flex items-center gap-2">
            <Icon name="lucide:radio" size="16" class="text-primary-700" />
            <span class="text-sm font-bold tracking-wide text-gray-700 uppercase">Radio</span>
          </div>
          <span class="rounded-full border px-2.5 py-0.5 text-xs font-semibold" :class="phaseStatus(radio).cls">
            {{ phaseStatus(radio).label }}
          </span>
        </div>
        <div class="px-4 py-3">
          <template v-if="radio.besoin === true">
            <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Fourniture</span>
                <p class="font-medium text-gray-800">{{ FOURNISSEUR_LABELS[radio.fournisseur] || '—' }}</p>
              </div>
              <div>
                <span class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">PK de couverture</span>
                <p class="font-medium text-gray-800">{{ radio.pk || '—' }}</p>
              </div>
              <div>
                <span class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Date de pose</span>
                <p class="font-medium text-gray-800">{{ fmt(radio.pose?.date) }}</p>
              </div>
              <div>
                <span class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Date de dépose</span>
                <p class="font-medium text-gray-800">{{ fmt(radio.depose?.date) }}</p>
              </div>
            </div>
            <div v-if="radio.pose?.commentaire || radio.depose?.commentaire" class="mt-3 space-y-1.5">
              <p v-if="radio.pose?.commentaire" class="text-xs text-gray-600">
                <span class="font-semibold text-gray-500">Pose :</span> {{ radio.pose.commentaire }}
              </p>
              <p v-if="radio.depose?.commentaire" class="text-xs text-gray-600">
                <span class="font-semibold text-gray-500">Dépose :</span> {{ radio.depose.commentaire }}
              </p>
            </div>
          </template>
          <p v-else class="text-sm text-gray-400 italic">
            {{ radio.besoin === false ? 'Pas de radio sur ce chantier.' : 'Besoin non défini.' }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
