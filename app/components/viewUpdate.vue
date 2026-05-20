<script setup>
const { checkUserViewedUpdate, markUpdateAsViewed, hasViewedUpdate } = useUpdate()
const user = useAuthUser()

// Variable contenant toutes les mises à jour - FACILE À MAINTENIR
const updates = ref([
  {
    date: '20 Mai 2026',
    version: '3.6.0',
    isNew: true,
    changes: [
      "Chantier → Outils → Commandes matières : Refonte complète — une seule vue unifiée avec statuts Brouillon / Commandée, plus de double onglet. Validation, réouverture et export ZIP (TXT EBM + XLSX contrats cadres) intégrés.",
      "Chantier → Outils → Commandes matières : Articles issus des contrats cadres reconnus à l'import et identifiés par un badge dédié.",
    ]
  },
  {
    date: '14 Avril 2026',
    version: '3.5.0',
    isNew: false,
    changes: [
      "Chantier → Photos : Refonte de l'upload — suivi de progression en temps réel, affichage du gain de compression et meilleur confort visuel pendant l'envoi.",
      'Chantier → Études (PT & DEX) : Nouvelle interface — stats regroupées, liste épurée avec pipeline de dates et indicateurs de statut animés.',
      'Chantier → Études (PT & DEX) : Correction du bug qui pré-remplissait automatiquement la date de réception à la date du jour.',
      'Chantier → Outils : Nouveau menu regroupant le calcul des vieilles matières et les commandes matières.',
      'Chantier → Outils → Vieilles matières : Calcul des quantités à évacuer (ballast, traverses, rail) par voie courante et ADV, avec impression dédiée.',
      'Chantier → Outils → Commandes matières : Création et gestion des commandes de matières.',
      'Généralités → Les emails de création et de modification de dates sont désormais également envoyés aux utilisateurs ayant le profil RDU.'
    ]
  },
  {
    date: '01 Avril 2026',
    version: '3.4.0',
    isNew: false,
    changes: [
      'Calendrier → Refonte du plan de charge général et RLT en CSS Grid pour des performances de survol nettement améliorées.',
      'Calendrier → Ajout de la colonne Chef de Projet (CdP) dans le plan de charge général.',
      'Calendrier → La recherche filtre désormais aussi par nom de contact (RLT, KV, Pré-op, CdP).',
      'Généralités → Lien "Quoi de neuf ?" dans le pied de page pour consulter les nouveautés à tout moment.',
      "Généralités → Correction du bug d'envoi d'emails de notification lors de l'enregistrement d'un chantier même sans modification de dates.",
      "Généralités → L'email de modification de dates affiche désormais un comparatif avant / après des périodes modifiées."
    ]
  },
  {
    date: '15 Mars 2026',
    version: '3.3.0',
    changes: [
      'Paramètres → Refonte complète de la gestion des chantiers : vue tableau unique avec recherche, actions rapides (RLT, Terminer, Supprimer) et tri chronologique.',
      'Calendrier → Affichage du nombre de chantiers et de week-ends dans le pied de tableau du plan de charge général.',
      'Dashboard → Nouvelle page Statistiques avec graphiques (chantiers et week-ends par année, répartition des états) et impression dédiée en mode paysage.',
      'Calendrier → Calcul des prévisions H00 prenant désormais en compte les dates de préparation en plus des dates de réalisation.',
      'Calendrier → Possibilité de modifier les contacts travaux directement depuis le plan de charge général en cliquant sur les avatars.',
      "Création chantier → Vérification de l'unicité du numéro de compte avant la création d'un chantier."
    ]
  },
  {
    date: '08 Mars 2026',
    version: '3.2.0',
    changes: [
      'Chantier → Modification du menu de navigation du chantier pour une meilleure lisibilité et accessibilité en version mobile.',
      "Chantier → Ajout d'un module \"Tournées\" permettant de dicter, d'écrire et d'ajouter des photos lors des tournées.",
      "Généralités → Envoi d'emails lors des mises à jour des chantiers ou création de chantiers.",
      'Généralités → Diverses corrections visuelles.'
    ]
  },
  {
    date: '27 Janvier 2026',
    version: '3.1.0',
    changes: [
      "Chantier → Possibilité  d'ajouter des pages personnalisées (sur mesure) pour chaque chantier. (version en test - SuperAdmin only)",
      "Chantier → Gestion de l'impression du chantier par modules.",
      "Calendrier → Ajout de l'affichage des mois dans le planning général et RLT.",
      "Calendrier → Possibilité d'ajouter des absences pour les RLT et contrôleurs.",
      "Généralités → Amélioration de l'expérience utilisateur et de l'ergonomie.",
      "Généralités → Ajout d'une popup pour informer l'utilisateur des nouveautés de l'application."
    ]
  },
  {
    date: '22 Janvier 2026',
    version: '3.0.0',
    changes: [
      'Authentification → Login et mot de passe SNCF.',
      'Chantier → Affectation du nom des RLT et contrôleurs sur un chantier.',
      'Calendrier → Affichage des périodes de préparation des chantiers.',
      'Calendrier → Nouveau planning RLT.',
      'Chantier - Photos → Nouveau module de gestion des photos.',
      'Visuel graphique V3 avec nouveau logo Uo Travaux.'
    ]
  },
  {
    date: '11 Juillet 2025',
    version: '2.95',
    changes: [
      'Page du chantier - Généralités → Ajout du numéro de semaine dans la date de début et de fin.',
      "Page du chantier - Timeline → Correction d'un bug lors de la suppression d'une timeline.",
      'Page du chantier - Etudes → Refonte complète de la page. Ne sont conservés que DEX et PT. Nouveau visuel.',
      'Page du chantier - Impression → Prise en compte des corrections effectuées sur les pages généralité et études.',
      "Dashboard - Alertes → Correction d'un bug lorsqu'il n'y avait plus d'alerte sur un chantier."
    ]
  },
  {
    date: '25 Juin 2025',
    version: '2.94',
    changes: [
      'Page du chantier - Généralités → Changement de design.',
      'Page du chantier - Impression → Prise en compte du nouveau design des sections généralités et contacts.',
      'H00 - Divers corrections visuelles...'
    ]
  },
  {
    date: '18 Juin 2025',
    version: '2.93',
    changes: [
      "Page du chantier - Liste des taches → Correction d'un bug qui affichait des taches n'appartenant pas au profil utilisateur lorsque l'on cliquait sur le switch \"mes taches\".",
      'Page du chantier - Interlocuteurs → Suppression de cette section.',
      'Page du chantier - Entreprises → Suppression de cette section.',
      'Page du chantier → Création d\'une section contacts, qui reprend les anciennes sections "Interlocuteurs" et "Entreprises". Il est également possible d\'y ajouter d\'autres contacts.'
    ]
  },
  {
    date: '21 Mai 2025',
    version: '2.92',
    changes: [
      "Calendrier - Chantiers → Surbrillance de la colonne d'une semaine donnée lors du survole de celle ci.",
      "Calendrier - Chantiers → Ajout d'un modal affichant le nom des RLT et CDP lorsque l'on clique sur la ligne d'un chantier (pendant les travaux).",
      "Calendrier - Chantiers → Corrections et ajustements de l'affichage."
    ]
  },
  {
    date: '02 Avril 2025',
    version: '2.91',
    changes: [
      "Généralité, autres : Champ étendu pour utiliser toute la largeur de la card à l'impression.",
      "Création d'un PopUp : Mise à jour",
      "Calendrier : Ajout d'un trait rouge pour représenter les week-ends",
      "Dans chantier → Taches : Possibilité d'afficher seulement les taches de son profil."
    ]
  },
  {
    date: '22 Janvier 2025',
    version: '2.9',
    changes: [
      "Ajout d'un profil consultant (aucun droit de modification)",
      "Ajout d'un profil superviseur (accès à toutes les taches de tout le monde en modification)",
      "Correction du bug lors de l'enregistrement automatique des notes",
      "Mise en place d'un « Horizontal bar chart » dans liste des taches de la page d'un chantier à la place des chiffres écrits en brut."
    ]
  }
])

// Vérification initiale
await checkUserViewedUpdate(user.value?.email)

const handleMarkAsViewed = async () => {
  await markUpdateAsViewed(user.value?.email)
}
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <section
          v-if="!hasViewedUpdate"
          class="fixed inset-0 z-5000 flex items-center justify-center bg-linear-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 p-4 backdrop-blur-md">
          <Transition
            appear
            enter-active-class="transition duration-500 ease-out delay-100"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0">
            <div
              class="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-linear-to-b from-white to-slate-50 shadow-2xl shadow-black/30">
              <!-- Header avec linear -->
              <div class="bg-primary-50 text-primary-700 relative p-6">
                <div class="relative flex items-center gap-4">
                  <img src="/images/logo_uo.png" alt="H00" class="h-20" />
                  <div>
                    <h1 class="text-2xl font-bold tracking-tight">Quoi de neuf ?</h1>
                    <p class="text-primary-700/80 mt-1 text-sm">Découvrez les dernières améliorations de H00 Travaux</p>
                  </div>
                </div>
                <!-- Badge version actuelle -->
                <div
                  class="bg-primary-200 top-4 right-4 hidden rounded-full px-3 py-1 text-sm font-medium backdrop-blur-sm md:absolute md:block">
                  v{{ updates[0]?.version }}
                </div>
              </div>

              <!-- Contenu scrollable -->
              <div class="flex-1 space-y-8 overflow-auto p-6">
                <div v-for="(update, index) in updates" :key="update.version" class="relative">
                  <!-- Ligne de timeline -->
                  <div
                    v-if="index < updates.length - 1"
                    class="absolute top-12 bottom-0 left-[22px] w-0.5 bg-linear-to-b from-slate-300 to-transparent"></div>

                  <div class="flex gap-4">
                    <!-- Point de timeline avec effet -->
                    <div class="relative shrink-0">
                      <div
                        :class="[
                          'flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold transition-all duration-300',
                          index === 0
                            ? 'shadow-primary-500/30 bg-linear-to-br from-slate-600 to-slate-800 text-white shadow-lg'
                            : 'border-primary-200 bg-primary-100 text-primary-500 border'
                        ]">
                        {{ update.version }}
                      </div>
                    </div>

                    <!-- Contenu de la mise à jour -->
                    <div class="flex-1 pb-6">
                      <div class="mb-3 flex items-center gap-3">
                        <span class="text-primary-800 text-sm font-bold">{{ update.date }}</span>
                        <span
                          v-if="update.isNew"
                          class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                          Nouveau
                        </span>
                      </div>

                      <!-- Liste des changements -->
                      <div class="space-y-1">
                        <div
                          v-for="(change, changeIndex) in update.changes"
                          :key="`${update.version}-${changeIndex}`"
                          class="group flex items-start gap-2 pl-3 transition-all duration-200">
                          <span class="text-primary-500 mt-0.5">•</span>
                          <div class="text-sm text-slate-600">{{ change }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer avec bouton -->
              <div class="border-primary-200 bg-primary-50 border-t p-6">
                <div class="flex items-center justify-between">
                  <p class="text-primary-400 text-xs">Dernière mise à jour : {{ updates[0]?.date }}</p>
                  <AppButtonValidated theme="primary" class="w-32" @click="handleMarkAsViewed">
                    <template #default>C'est noté !</template>
                  </AppButtonValidated>
                </div>
              </div>
            </div>
          </Transition>
        </section>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
@keyframes ping {
  75%,
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
