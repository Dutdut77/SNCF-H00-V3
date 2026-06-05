<script setup>
const props = defineProps({
  alertes: {
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
      <img src="/images/logo_uo.png" alt="Logo" class="w-12" />
      <div class="flex flex-col items-start justify-center">
        <p class="text-primary-900 font-[Bangers] text-3xl font-semibold tracking-wider">Alertes chantiers</p>
        <p class="text-primary-900 -mt-1 text-base italic">Listes des alertes des chantiers</p>
      </div>
    </div>
    <div class="text-primary-800 ml-auto hidden text-sm italic print:inline">
      Impression du {{ new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
    </div>
  </div>
  <div class="flex flex-col gap-8 pt-8">
    <div v-for="alert in props.alertes" :key="alert.id" class="flex flex-col gap-4">
      <div class="border-l-2 border-teal-500/80 pl-4">
        <div class="flex items-center gap-4">
          <div class="flex flex-col items-start justify-center">
            <p class="text-primary-900 font-[Bangers] text-2xl font-semibold tracking-wider">{{ alert.compte }}</p>
            <p class="text-primary-900 -mt-1 text-base font-semibold italic">{{ alert.label }}</p>
          </div>
        </div>
        <div class="space-y-2 pt-2 pl-4">
          <div v-for="tache in alert.taches" :key="tache.id" class="">
            <div class="font-bold text-teal-800">- {{ tache.libelle }}</div>

            <div
              v-for="pid in concernedProfils(tache.tache_profil, tache)"
              :key="pid">
              <div
                v-if="getSlot(tache, pid).commentaire"
                class="text-primary-900 bg-primary-200 rounded-md px-2 py-1 text-sm whitespace-pre-line italic">
                <span class="font-semibold not-italic">{{ profilLabel(pid) }} : </span>{{ getSlot(tache, pid).commentaire }}
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
