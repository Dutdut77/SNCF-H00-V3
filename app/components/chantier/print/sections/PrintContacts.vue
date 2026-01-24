<script setup>
const props = defineProps({
  contacts: {
    type: Object,
    required: true
  }
})

const { users } = useUsers()

// Obtenir le nom complet d'un utilisateur par son email
const getUserName = (userEmail) => {
  if (!userEmail) return '-'
  const user = users.value.find((u) => u.email === userEmail)
  if (!user) return '-'
  return user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email
}

// Obtenir l'email d'un utilisateur par son ID
const getUserEmail = (userId) => {
  if (!userId) return null
  const user = users.value.find((u) => u.id === userId)
  return user?.email || null
}
</script>

<template>
  <section v-if="contacts" class="mb-8 break-inside-avoid">
    <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
      <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
        <Icon name="lucide:users" size="18" />
      </div>
      <h3 class="text-lg font-bold text-gray-700 uppercase">Contacts</h3>
    </div>

    <!-- Généralités -->
    <div
      v-if="
        contacts.generalites &&
        (contacts.generalites.chef_projet_nom || contacts.generalites.coordinateur_securite_nom)
      "
      class="mb-4">
      <p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Généralités</p>

      <table class="w-full text-left text-xs">
        <thead>
          <tr class="bg-secondary-900/10 border-b border-gray-200">
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th>
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th>
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="contacts.generalites.chef_projet_nom" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-bold text-gray-700">Chef de projet</td>
            <td class="px-2 py-1.5 text-gray-700">{{ contacts.generalites.chef_projet_nom }}</td>
            <td class="px-2 py-1.5 text-gray-700">{{ contacts.generalites.chef_projet_email || '-' }}</td>
          </tr>
          <tr v-if="contacts.generalites.coordinateur_securite_nom" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-bold text-gray-700">Coordinateur sécurité</td>
            <td class="px-2 py-1.5 text-gray-700">{{ contacts.generalites.coordinateur_securite_nom }}</td>
            <td class="px-2 py-1.5 text-gray-700">{{ contacts.generalites.coordinateur_securite_email || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Travaux -->
    <div
      v-if="
        contacts.travaux &&
        (getUserName(contacts.travaux.rlt_voie_principale) ||
          getUserName(contacts.travaux.rlt_ses_principale) ||
          getUserName(contacts.travaux.rlt_cat_principale) ||
          getUserName(contacts.travaux.preop_voie) ||
          getUserName(contacts.travaux.preop_ses) ||
          getUserName(contacts.travaux.logistique))
      "
      class="mb-4">
      <p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Équipe Travaux</p>
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="bg-secondary-900/10 border-b border-gray-200">
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th>
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th>
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="getUserName(contacts.travaux.rlt_voie_principale)" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-medium text-gray-600">RLT Voie</td>
            <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.rlt_voie_principale) }}</td>
            <td class="px-2 py-1.5 text-gray-500">{{ getUserEmail(contacts.travaux.rlt_voie_principale) || '-' }}</td>
          </tr>
          <tr v-if="getUserName(contacts.travaux.rlt_ses_principale)" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-medium text-gray-600">RLT SES</td>
            <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.rlt_ses_principale) }}</td>
            <td class="px-2 py-1.5 text-gray-500">{{ getUserEmail(contacts.travaux.rlt_ses_principale) || '-' }}</td>
          </tr>
          <tr v-if="getUserName(contacts.travaux.rlt_cat_principale)" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-medium text-gray-600">RLT CAT</td>
            <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.rlt_cat_principale) }}</td>
            <td class="px-2 py-1.5 text-gray-500">{{ getUserEmail(contacts.travaux.rlt_cat_principale) || '-' }}</td>
          </tr>
          <tr v-if="getUserName(contacts.travaux.preop_voie)" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-medium text-gray-600">Pré-op Voie</td>
            <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.preop_voie) }}</td>
            <td class="px-2 py-1.5 text-gray-500">{{ getUserEmail(contacts.travaux.preop_voie) || '-' }}</td>
          </tr>
          <tr v-if="getUserName(contacts.travaux.preop_ses)" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-medium text-gray-600">Pré-op SES</td>
            <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.preop_ses) }}</td>
            <td class="px-2 py-1.5 text-gray-500">{{ getUserEmail(contacts.travaux.preop_ses) || '-' }}</td>
          </tr>
          <tr v-if="getUserName(contacts.travaux.logistique)" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-medium text-gray-600">Logistique</td>
            <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.logistique) }}</td>
            <td class="px-2 py-1.5 text-gray-500">{{ getUserEmail(contacts.travaux.logistique) || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Études -->
    <div
      v-if="contacts.etudes && (contacts.etudes.plan_technique_nom || contacts.etudes.documents_execution_nom)"
      class="mb-4">
      <p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Études</p>
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="bg-secondary-900/10 border-b border-gray-200">
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th>
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th>
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="contacts.etudes.plan_technique_nom" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-medium text-gray-600">Plan technique</td>
            <td class="px-2 py-1.5 text-gray-900">{{ contacts.etudes.plan_technique_nom }}</td>
            <td class="px-2 py-1.5 text-gray-500">{{ contacts.etudes.plan_technique_email || '-' }}</td>
          </tr>
          <tr v-if="contacts.etudes.documents_execution_nom" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-medium text-gray-600">Documents d'exécution</td>
            <td class="px-2 py-1.5 text-gray-900">{{ contacts.etudes.documents_execution_nom }}</td>
            <td class="px-2 py-1.5 text-gray-500">{{ contacts.etudes.documents_execution_email || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Entreprises -->
    <div v-if="contacts.entreprises?.length" class="mb-4">
      <p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Entreprises</p>
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="bg-secondary-900/10 border-b border-gray-200">
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Métier</th>
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Entreprise</th>
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Responsable</th>
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ent in contacts.entreprises" :key="ent.id" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-medium text-gray-600">{{ ent.metier || '-' }}</td>
            <td class="px-2 py-1.5 text-gray-900">{{ ent.entreprise || '-' }}</td>
            <td class="px-2 py-1.5 text-gray-900">{{ ent.responsable_nom || '-' }}</td>
            <td class="px-2 py-1.5 text-gray-500">{{ ent.responsable_email || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Autres contacts -->
    <div v-if="contacts.autres?.length">
      <p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Autres contacts</p>
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="bg-secondary-900/10 border-b border-gray-200">
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th>
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Organisme</th>
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Responsable</th>
            <th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="autre in contacts.autres" :key="autre.id" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-medium text-slate-600">{{ autre.metier || '-' }}</td>
            <td class="px-2 py-1.5 text-gray-900">{{ autre.entreprise || '-' }}</td>
            <td class="px-2 py-1.5 text-gray-900">{{ autre.responsable_nom || '-' }}</td>
            <td class="px-2 py-1.5 text-gray-500">{{ autre.responsable_email || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

