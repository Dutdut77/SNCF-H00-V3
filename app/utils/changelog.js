/**
 * Source unique de vérité des versions de H00 Travaux.
 * ─────────────────────────────────────────────────────────────────────────────
 * PUBLIER UNE NOUVELLE VERSION = ajouter une entrée EN TÊTE du tableau. Point.
 *
 *   - La navbar affiche automatiquement `APP_VERSION` (= version de la 1re entrée).
 *   - Le modal « Quoi de neuf ? » se ré-affiche tout seul chez chaque utilisateur
 *     qui n'a pas encore validé cette version. AUCUNE manipulation en base de
 *     données n'est nécessaire : on ne vide plus jamais la table `viewupdate`.
 *   - Le badge « Nouveau » est calculé : il marque les versions parues depuis la
 *     dernière visite, il n'y a plus de drapeau `isNew` à tenir à jour.
 *
 * Format d'une entrée :
 *   { date: '15 Septembre 2026', version: '3.8', changes: ['…', '…'] }
 *
 * ⚠️ L'ORDRE DU TABLEAU FAIT FOI (de la plus récente à la plus ancienne) : la
 * fraîcheur d'une version se déduit de sa position, jamais d'une comparaison
 * numérique. On évite ainsi le piège classique « 3.8 < 3.75 » et on reste libre
 * de la façon de numéroter les versions.
 */
export const changelog = [
  {
    date: '26 Août 2026',
    version: '3.75',
    changes: [
      "Chantiers → Refonte complète de la liste : nouvelle barre latérale (Tous les chantiers / Mes chantiers, filtres par état avec compteurs) et tuiles de synthèse cliquables.",
      "Chantiers → Trois vues au choix : Tableau, Cartes et la nouvelle vue Planning.",
      "Chantiers → Vue Planning : frise annuelle des périodes de préparation, de réalisation et des week-ends, avec navigation d'une année à l'autre directement depuis la liste.",
      "Chantiers → Vue Tableau : tri par colonne (date, nom, référence), choix des colonnes affichées (Site, Ligne, Chef de projet) et modification d'un chantier en un clic.",
      "Chantiers → Recherche étendue au nom, à la référence et à la ligne, pagination de la liste et export CSV de la sélection en cours.",
      'Généralités → Diverses améliorations visuelles et corrections.'
    ]
  },
  {
    date: '22 Juillet 2026',
    version: '3.7.0',
    changes: [
      "Dashboard → EPM : Nouveau tableau de bord de suivi des entrées en périmètre maintenance (EPM) — réserves et comptes rendus centralisés pour l'ensemble des chantiers.",
      "Chantier → Outils → Commandes matières & Paramètres → Logiques métier : Logique de commande des matières améliorée — enchaînement des questionnaires plus fiable et ajout automatique des articles et ensembles plus précis.",
      "Calendrier → Nouvelle vue par UTM / PIT permettant de visualiser les chantiers regroupés par unité de maintenance.",
      "Dashboard → Logistique : Refonte de l'ergonomie (UI/UX) pour un suivi plus clair et confortable des équipements.",
      'Généralités → Diverses améliorations visuelles et corrections.'
    ]
  },
  {
    date: '05 Juin 2026',
    version: '3.6.0',
    changes: [
      "Chantier → Logistique : Nouvelle section pour suivre la base vie, l'imprimante, le réseau (box) et les radios.",
      "Dashboard → Logistique : Nouveau tableau de bord par équipement (base vie, imprimantes, réseau, radios) avec statuts, calendrier d'affectation des matériels et impression dédiée.",
      "Paramètres → Imprimantes & Box : Gestion de l'inventaire des imprimantes et des box réseau affectables aux chantiers.",
      "Chantier → Tâches : Refonte de la gestion par profil — chaque profil clôture désormais sa propre partie d'une tâche (à faire / en cours / clôturé / non concerné), avec un suivi « X / Y profils clôturés ».",
      'Calendrier → Plan de charge RLT & Paramètres → Utilisateurs : Visualisation des agents en formation (pas encore habilités) grâce à un badge dédié.',
      "Chantier → Outils → Commandes matières : Poursuite du projet — vue unifiée Brouillon / Commandée, validation, réouverture et export ZIP (TXT EBM + XLSX contrats cadres). Articles de contrats cadres reconnus à l'import et identifiés par un badge.",
      "Paramètres → Logiques métier : Nouveaux assistants (wizards) qui guident l'ajout automatique des articles et ensembles d'une commande à partir d'un questionnaire.(en cours)",
      'Généralités → Diverses améliorations visuelles et harmonisation des couleurs (mode sombre inclus).'
    ]
  },
  {
    date: '14 Avril 2026',
    version: '3.5.0',
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
]

/** Version courante de l'application (première entrée du changelog). */
export const APP_VERSION = changelog[0].version

/**
 * Versions parues depuis celle que l'utilisateur a validée pour la dernière fois.
 * @param {string|null} lastSeenVersion version validée, `null` si jamais vue
 * @returns {Array} entrées du changelog plus récentes (vide si l'utilisateur est à jour)
 */
export const releasesSince = (lastSeenVersion) => {
  // Jamais vu le modal → tout est nouveau.
  if (!lastSeenVersion) return changelog

  const index = changelog.findIndex((release) => release.version === lastSeenVersion)

  // Version inconnue (entrée retirée du changelog, préversion…) → on reste
  // prudent et on considère que l'utilisateur n'est pas à jour.
  if (index === -1) return changelog

  return changelog.slice(0, index)
}

/** L'utilisateur a-t-il des nouveautés à découvrir ? */
export const hasNewerRelease = (lastSeenVersion) => releasesSince(lastSeenVersion).length > 0
