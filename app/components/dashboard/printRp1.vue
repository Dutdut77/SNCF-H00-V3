<script setup>
const props = defineProps({
  taches: {
    type: Array,
    required: true
  }
})

const { profilTaches } = useProfilTache()
const profilLabel = (pid) => profilTaches.value.find((p) => p.id === pid)?.label || `Profil ${pid}`
</script>

<template>
  <div class="flex w-full items-center justify-between">
    <div class="flex items-center gap-4">
      <AppLogo class="w-12" />
      <div class="flex flex-col items-start justify-center">
        <p class="font-traverse text-magenta-700 text-3xl leading-tight tracking-[0.03em]">RP1 / RP3</p>
        <p class="text-primary-900 -mt-1 text-base italic">Liste des taches RP1 et RP3 des chantiers</p>
      </div>
    </div>
    <div class="text-primary-800 ml-auto hidden text-sm italic print:inline">
      Impression du {{ new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
    </div>
  </div>

  <div class="flex flex-col gap-8 pt-8">
    <div v-for="tache in props.taches" :key="tache.id" class="flex flex-col gap-4">
      <div class="border-magenta-300 border-l-2 pl-4">
        <div class="flex items-center gap-4">
          <div class="flex flex-col items-start justify-center">
            <p class="font-traverse text-magenta-800 text-xl tracking-[0.03em]">{{ tache.compte }}</p>
            <p class="text-primary-900 -mt-1 text-base font-semibold italic">{{ tache.label }}</p>
          </div>
        </div>
        <div class="space-y-2 pt-2 pl-4">
          <div v-for="t in tache.taches" :key="t.id" class="">
            <div class="text-ink font-bold">- {{ t.libelle }}</div>

            <div v-for="pid in concernedProfils(t.tache_profil, t)" :key="pid">
              <div
                v-if="getSlot(t, pid).commentaire"
                class="text-ink rounded-md bg-slate-100 px-2 py-1 text-sm whitespace-pre-line italic">
                <span class="font-semibold not-italic">{{ profilLabel(pid) }} :</span>
                {{ getSlot(t, pid).commentaire }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm;
  }
}
</style>
