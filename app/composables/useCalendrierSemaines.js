// Grille des semaines ISO d'une année : entêtes mois/semaines des vues calendrier.
// Extrait de pages/calendriers/plan-de-charge-general.vue pour être partagé avec
// la vue Planning de la liste des chantiers.
export const useCalendrierSemaines = () => {
  // Semaines S1 à S53
  const weeks = computed(() => Array.from({ length: 53 }, (_, i) => ({ number: i + 1, label: `${i + 1}` })))

  const monthNames = ['Janv.', 'Fév.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']

  // Jeudi de la semaine ISO : c'est lui qui détermine le mois « dominant » de la semaine
  const getThursdayOfWeek = (weekNumber, year) => {
    // Le 4 janvier tombe toujours en semaine 1
    const jan4 = new Date(year, 0, 4)
    const dayOfWeek = jan4.getDay() || 7 // Dimanche = 7
    const monday = new Date(jan4)
    monday.setDate(jan4.getDate() - dayOfWeek + 1)

    const targetMonday = new Date(monday)
    targetMonday.setDate(monday.getDate() + (weekNumber - 1) * 7)

    const thursday = new Date(targetMonday)
    thursday.setDate(targetMonday.getDate() + 3)
    return thursday
  }

  // Numéro de semaine ISO d'une date
  const getWeekNumber = (date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  }

  // Mois de l'année avec le nombre de semaines qu'ils couvrent (colspan de l'entête)
  const getMonthsWithColspan = (year) => {
    const weeksByMonth = Array(12).fill(0)

    for (let week = 1; week <= 53; week++) {
      const thursday = getThursdayOfWeek(week, year)
      const thursdayYear = thursday.getFullYear()
      const month = thursday.getMonth()

      if (thursdayYear === year) {
        weeksByMonth[month]++
      } else if (thursdayYear < year) {
        // S1 dont le jeudi tombe en décembre de l'année précédente → janvier
        weeksByMonth[0]++
      } else {
        // S52/S53 dont le jeudi tombe en janvier de l'année suivante → décembre
        weeksByMonth[11]++
      }
    }

    return monthNames
      .map((name, index) => ({ name, colspan: weeksByMonth[index] }))
      .filter((m) => m.colspan > 0)
  }

  // ---------------------------------------------------------------------------
  // Fenêtre glissante de semaines (vue Planning de la liste des chantiers)
  // ---------------------------------------------------------------------------

  // Lundi de la semaine ISO
  const getLundiDeSemaine = (weekNumber, year) => {
    const jeudi = getThursdayOfWeek(weekNumber, year)
    const lundi = new Date(jeudi)
    lundi.setDate(jeudi.getDate() - 3)
    return lundi
  }

  // Semaine ISO d'une date, avec son année ISO (celle du jeudi, pas celle du jour)
  const semaineISODe = (date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7)) // jeudi de la semaine
    const annee = d.getFullYear()
    const jan1 = new Date(annee, 0, 1)
    return { annee, semaine: Math.ceil(((d - jan1) / 86400000 + 1) / 7) }
  }

  // Décale de `delta` semaines en passant les bornes d'année sans arithmétique manuelle
  const decalerSemaine = (annee, semaine, delta) => {
    const lundi = getLundiDeSemaine(semaine, annee)
    lundi.setDate(lundi.getDate() + delta * 7)
    return semaineISODe(lundi)
  }

  // `nb` semaines consécutives à partir de (annee, semaine)
  const genererFenetre = (annee, semaine, nb) =>
    Array.from({ length: nb }, (_, i) => {
      const { annee: a, semaine: s } = decalerSemaine(annee, semaine, i)
      return { annee: a, numero: s, lundi: getLundiDeSemaine(s, a) }
    })

  // Regroupe les semaines d'une fenêtre par mois (celui de leur jeudi), pour l'entête
  const grouperParMois = (fenetre) => {
    const groupes = []
    for (const sem of fenetre) {
      const jeudi = new Date(sem.lundi)
      jeudi.setDate(jeudi.getDate() + 3)
      const cle = `${jeudi.getFullYear()}-${jeudi.getMonth()}`
      const dernier = groupes[groupes.length - 1]
      if (dernier && dernier.cle === cle) {
        dernier.colspan++
      } else {
        groupes.push({
          cle,
          label: `${monthNames[jeudi.getMonth()]} ${jeudi.getFullYear()}`,
          labelCourt: monthNames[jeudi.getMonth()],
          colspan: 1
        })
      }
    }
    return groupes
  }

  return {
    weeks,
    monthNames,
    getThursdayOfWeek,
    getWeekNumber,
    getMonthsWithColspan,
    getLundiDeSemaine,
    semaineISODe,
    decalerSemaine,
    genererFenetre,
    grouperParMois
  }
}
