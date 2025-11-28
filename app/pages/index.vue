<script setup>

definePageMeta({
  requiresAuth: true,
  requiredRole: '',
});

useHead({
  title: "H00 - Mes taches",
  description: "Liste de mes taches H00",
});

const { addToast } = useToast()

const showToast = () => {
  addToast({
    title: 'Super Toast réussit !',
    message: 'Toast affiché avec succès !',
    type: 'Warning' // ou 'error', 'warning', 'info' selon votre implémentation
  })
}
</script>

<template>
  <AppPageLayout>
    <!-- Slot sidebar - Partie gauche sticky -->
    <template #sidebar>
      <div class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-800">Navigation</h2>
        <nav class="space-y-2">
          <a href="#" class="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">Menu 1</a>
          <a href="#" class="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">Menu 2</a>
          <a href="#" class="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">Menu 3</a>
        </nav>
      </div>
    </template>



    <!-- Slot par défaut - Partie centrale -->
    <div class="sticky top-0 z-20  -mx-6 px-6 pb-6 ">
      <div class="space-y-6 h-96">
        <h1 class="text-3xl font-bold text-gray-900">Page d'accueil n°1</h1>
        <p class="text-gray-600">
          Contenu principal de votre page. La sidebar à gauche reste sticky lors du scroll.
        </p>
        
        <!-- Card avec bouton toast -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Card avec Toast</h2>
          <button 
            @click="showToast"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Afficher un toast
          </button>
        </div>
      </div>
    </div>

    <div class="sticky top-0 z-20  -mx-6 px-6 pb-6 ">
      <div class="space-y-6 h-96">
        <h1 class="text-3xl font-bold text-gray-900">Page d'accueil n°2</h1>
        <p class="text-gray-600">
          Contenu principal de votre page. La sidebar à gauche reste sticky lors du scroll.
        </p>
        
        <!-- Card avec bouton toast -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Card avec Toast</h2>
          <button 
            @click="showToast"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Afficher un toast
          </button>
        </div>
      </div>
    </div>



    <div class="space-y-6 h-96 w-full flex flex-col items-center justify-center">
      <h1 class="text-3xl font-bold text-gray-900 sticky top-0">Page d'accueil</h1>
      <p class="text-gray-600">
        Contenu principal de votre page. La sidebar à gauche reste sticky lors du scroll.
      </p>
  <AppDropdownMenu trigger="hover" class="ml-auto">
  <template #trigger>
    <button class="px-3 py-2 bg-blue-600 text-white rounded-lg cursor-pointer">Menu</button>
  </template>

  <div class="min-w-[200px] ">
      <div class="px-3 py-2 border-b border-gray-100 mb-1">
        <p class="text-sm font-semibold text-gray-900">Actions</p>
      </div>
      <button class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors">
        Nouvelle tâche
      </button>
      <button class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors">
        Nouveau projet
      </button>
    </div>
</AppDropdownMenu>
    </div>






  </AppPageLayout>
</template> 