<script setup>
const props = defineProps(['title', 'data'])
</script>

<template>
  <section class="break-inside-avoid pb-8">
    <div class="border-primary-300 bg-primary-200 flex h-9 w-full items-center rounded border">
      <p class="text-primary-700 ml-8 text-base font-medium uppercase">{{ props.title }}</p>
    </div>

    <div class="text-primary-800 -mt-6 ml-4">
      <div class="from-secondary-500 to-secondary-700 -ml-1.5 h-3 w-3 rounded-full bg-linear-to-br"></div>
      <div class="border-primary-500 border-l">
        <div
          v-if="props.data && props.data.taches.length > 0"
          class="pt-4 pl-2 text-sm"
          v-for="(tache, index) in props.data.taches"
          :key="index">
          <p class="font-bold">{{ tache.tache_name }}</p>
          <div class="flex items-start pl-2" v-for="(chantier, indexbis) in tache.chantiers" :key="indexbis">
            <div>-</div>
            <div class="cursor-pointer pl-1" @click="navigateTo(`/chantiers/${chantier.chantier_id}`)">
              {{ chantier.chantier_compte }} - {{ chantier.chantier_name }}
            </div>

            <div class="ml-auto px-1">
              <div v-if="tache.tache_status > 1"><Icon name="lucide:check" size="16" class="text-green-500" /></div>
              <div v-else><Icon name="lucide:x" size="16" class="text-red-500" /></div>
            </div>
          </div>
        </div>

        <div v-else class="cursor-default pt-4 pl-2 text-sm">Néant</div>
      </div>
    </div>
  </section>
</template>
