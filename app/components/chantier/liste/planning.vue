<script setup>
// Vue Planning : diagramme de Gantt sur une timeline continue, défilable à l'horizontale.
// Une barre par période (réalisation et préparation) — `date_rea` et `date_prepa`
// sont des tableaux, un chantier peut donc en avoir plusieurs.
const props = defineProps({
  chantiers: { type: Array, default: () => [] },
  // Libellé du filtre courant, pour les sorties qui seront relues hors contexte
  selection: { type: String, default: '' },
  canEdit: { type: Boolean, default: false }
})

const emit = defineEmits(['edit', 'open'])

const { getEtatInfo } = useEtatChantier()
const { formatDate, getFirstReaDate, getLastReaDate } = useChantierDates()
const { getLundiDeSemaine, semaineISODe, decalerSemaine, genererFenetre, grouperParMois } = useCalendrierSemaines()
const { allWeekends } = useTimeline()

const MS_SEMAINE = 7 * 86400000
const LARGEUR_CHANTIER = 280
const LARGEUR_STATUT = 112
// Colonnes figées à gauche à partir de lg seulement : sous 1024 px, 392 px de colonnes
// gelées ne laisseraient quasiment rien à la timeline. Elles défilent alors avec le reste.
const LARGEUR_GAUCHE = LARGEUR_CHANTIER + LARGEUR_STATUT
const MARGE_SEMAINES = 6 // respiration de part et d'autre de la plage réelle
const MAX_SEMAINES = 400 // garde-fou contre une plage aberrante

// Impression : A3 paysage, marges 5 mm → ~410 mm ≈ 1550 px à 96 dpi. On garde du mou.
// Les colonnes de gauche sont resserrées, le papier est plus précieux que l'écran.
const LARGEUR_PAGE = 1500
// Pas de colonne Statut sur papier : la couleur des barres le dit déjà, et les
// semaines gagnent la place. Le nom récupère au passage un peu de largeur.
const LARGEUR_CHANTIER_PRINT = 250

// Niveau de zoom : nombre de semaines qui tiennent dans la largeur visible
const zooms = [
  { id: 5, label: '1 mois' },
  { id: 13, label: '3 mois' },
  { id: 26, label: '6 mois' },
  { id: 53, label: 'Année' }
]
const zoom = ref(13)

// ---------------------------------------------------------------------------
// Mesure du conteneur → largeur de colonne en pixels ENTIERS.
// Des largeurs fractionnaires feraient tomber chaque limite de colonne ailleurs
// dans la grille de pixels, et les marqueurs de week-end s'antialiaseraient
// différemment de l'un à l'autre.
// ---------------------------------------------------------------------------
const conteneur = ref(null)
const largeurDispo = ref(0)
const defilement = ref(0)
let observateur = null

// Les colonnes Chantier/Statut ne sont figées qu'à partir de `lg` (voir le gabarit).
// En dessous elles défilent avec la timeline et ne masquent donc plus rien : la
// fenêtre visible ne se calcule pas pareil.
const colonnesFigees = ref(true)
let mediaLg = null
const surChangementLg = (e) => {
  colonnesFigees.value = e.matches
}

const largeurTimeline = computed(() => Math.max(0, largeurDispo.value - LARGEUR_GAUCHE))
const compact = computed(() => zoom.value > 26)
const largeurColonne = computed(() => {
  const mini = compact.value ? 22 : 58
  if (!largeurTimeline.value) return mini
  return Math.max(mini, Math.floor(largeurTimeline.value / zoom.value))
})

// ---------------------------------------------------------------------------
// Plage couverte : toutes les périodes des chantiers affichés, plus aujourd'hui
// ---------------------------------------------------------------------------
const idsAffiches = computed(() => new Set(props.chantiers.map((c) => c.id)))

const plage = computed(() => {
  let min = null
  let max = null
  const prendre = (valeur) => {
    if (!valeur) return
    const d = new Date(valeur)
    if (Number.isNaN(d.getTime())) return
    if (!min || d < min) min = d
    if (!max || d > max) max = d
  }

  for (const c of props.chantiers) {
    for (const p of c.date_rea || []) {
      prendre(p.date_start_travaux)
      prendre(p.date_end_travaux)
    }
    for (const p of c.date_prepa || []) {
      prendre(p.date_start_prepa)
      prendre(p.date_end_prepa)
    }
  }
  for (const w of allWeekends.value || []) {
    if (idsAffiches.value.has(w.chantier_id)) prendre(getLundiDeSemaine(w.semaine_debut, w.annee_debut))
  }

  // Aujourd'hui doit toujours être atteignable
  const aujourdhui = new Date()
  if (!min || aujourdhui < min) min = aujourdhui
  if (!max || aujourdhui > max) max = aujourdhui

  const sMin = semaineISODe(min)
  const sMax = semaineISODe(max)
  const debut = decalerSemaine(sMin.annee, sMin.semaine, -MARGE_SEMAINES)
  const fin = decalerSemaine(sMax.annee, sMax.semaine, MARGE_SEMAINES)

  const nb = Math.round((getLundiDeSemaine(fin.semaine, fin.annee) - getLundiDeSemaine(debut.semaine, debut.annee)) / MS_SEMAINE) + 1
  return genererFenetre(debut.annee, debut.semaine, Math.min(MAX_SEMAINES, Math.max(zoom.value, nb)))
})

const nbSemaines = computed(() => plage.value.length)
const debutPlage = computed(() => plage.value[0].lundi)

// Lignes verticales dessinées en fond plutôt qu'une cellule par semaine et par ligne :
// à 150 semaines × 60 chantiers, cela ferait des milliers de nœuds inutiles.
const fondSemaines = computed(() => ({
  backgroundImage: 'linear-gradient(to right, rgba(100, 116, 139, 0.18) 0 1px, transparent 1px)',
  backgroundSize: `${largeurColonneAffichee.value}px 100%`
}))

// ---------------------------------------------------------------------------
// Position et défilement
// ---------------------------------------------------------------------------
const indexDe = (date) => {
  const { annee, semaine } = semaineISODe(date)
  return Math.round((getLundiDeSemaine(semaine, annee) - debutPlage.value) / MS_SEMAINE)
}

const colAujourdhui = computed(() => {
  const i = indexDe(new Date())
  return i >= 0 && i < nbSemaines.value ? i : -1
})

// Position du jour dans sa colonne (0 % = lundi). Le trait et le badge s'y alignent.
const positionAujourdhui = computed(() => {
  const maintenant = new Date()
  const { annee, semaine } = semaineISODe(maintenant)
  const fraction = (maintenant - getLundiDeSemaine(semaine, annee)) / MS_SEMAINE
  return `${Math.min(100, Math.max(0, fraction * 100))}%`
})

// Premier pixel de timeline à l'écran, compté depuis le lundi de la première semaine.
// Les colonnes figées masquent les LARGEUR_GAUCHE premiers pixels du viewport, qui sont
// justement ceux où commencent les semaines ; sous lg elles défilent et ne masquent rien.
// Le plancher à 0 couvre le cas mobile où l'on est encore sur les colonnes de gauche.
const xVisibleDebut = computed(() => Math.max(0, defilement.value - (colonnesFigees.value ? 0 : LARGEUR_GAUCHE)))

// Largeur qui revient à la timeline : la totalité du conteneur sous lg, une fois les
// colonnes de gauche sorties de l'écran.
const largeurVisibleTimeline = computed(() => (colonnesFigees.value ? largeurTimeline.value : largeurDispo.value))
const nbColonnesFenetre = computed(() => Math.max(1, Math.ceil(largeurVisibleTimeline.value / largeurColonne.value)))

// Avant le premier ResizeObserver on ne sait rien de la fenêtre : on attend la mesure
// pour ne pas faire clignoter l'état vide au montage.
const mesureFaite = computed(() => largeurDispo.value > 0)

// Bornes en index de colonnes, calculées sur les bords réels : une colonne seulement
// entamée compte comme visible, des deux côtés.
const colDebutVisible = computed(() => Math.floor(xVisibleDebut.value / largeurColonne.value))
const colFinVisible = computed(() =>
  Math.min(
    nbSemaines.value - 1,
    Math.ceil((xVisibleDebut.value + largeurVisibleTimeline.value) / largeurColonne.value) - 1
  )
)

const moisPlage = computed(() => grouperParMois(colonnesAffichees.value))

const moisVisibles = computed(() => grouperParMois(plage.value.slice(colDebutVisible.value, colFinVisible.value + 1)))

const libelleFenetre = computed(() => {
  const m = moisVisibles.value
  if (m.length === 0) return ''
  if (m.length === 1) return m[0].label

  const premier = m[0]
  const dernier = m[m.length - 1]
  // L'année n'est rappelée en tête que si la fenêtre franchit un changement d'année :
  // « Janv. — Mars 2026 » se lit sans ambiguïté, « Fév. — Fév. 2028 » non.
  // `cle` vaut « année-mois », l'année s'y lit directement.
  const memeAnnee = premier.cle.split('-')[0] === dernier.cle.split('-')[0]
  return `${memeAnnee ? premier.labelCourt : premier.label} — ${dernier.label}`
})

// Un tirage papier se lit lui aussi hors contexte : il doit rappeler le filtre appliqué,
// pas seulement la période. Sur papier la fenêtre est figée, on annonce donc les deux.
const sousTitreImpression = computed(() =>
  props.selection ? `${props.selection} · ${libelleFenetre.value}` : libelleFenetre.value
)

// Semaine sur le bord gauche, mémorisée avec la largeur de colonne en vigueur
// au moment du défilement : un changement de zoom pourra s'y raccrocher.
const ancre = ref(0)

const surDefilement = (e) => {
  // Pendant l'impression la grille est réduite à la fenêtre : le navigateur recadre
  // `scrollLeft` sur un contenu bien plus court. Ce n'est pas une intention de
  // l'utilisateur, on ne l'enregistre pas — sinon on perd la position d'origine.
  if (modeImpression.value) return
  defilement.value = e.target.scrollLeft
  ancre.value = colDebutVisible.value
  // l'infobulle est en position fixed : elle ne suivrait pas le contenu qui défile
  cacherInfobulle()
}

// Amène la colonne `index` au bord gauche de la zone timeline — exactement l'inverse
// de `xVisibleDebut`, pour que saut et fenêtre visible restent d'accord.
const allerA = (index, doux = true) => {
  if (!conteneur.value) return
  const left = Math.max(0, index * largeurColonne.value + (colonnesFigees.value ? 0 : LARGEUR_GAUCHE))
  conteneur.value.scrollTo({ left, behavior: doux ? 'smooth' : 'auto' })
}

const allerAAujourdhui = (doux = true) => {
  const i = colAujourdhui.value >= 0 ? colAujourdhui.value : indexDe(new Date())
  allerA(Math.max(0, i - 2), doux)
}

// Une page entière = le nombre de colonnes réellement à l'écran
const defiler = (sens) => {
  if (!conteneur.value) return
  conteneur.value.scrollBy({ left: sens * nbColonnesFenetre.value * largeurColonne.value, behavior: 'smooth' })
}

onMounted(() => {
  mediaLg = window.matchMedia('(min-width: 1024px)') // breakpoint `lg` de Tailwind
  colonnesFigees.value = mediaLg.matches
  mediaLg.addEventListener('change', surChangementLg)

  if (!conteneur.value) return
  largeurDispo.value = conteneur.value.clientWidth
  observateur = new ResizeObserver(([entree]) => {
    largeurDispo.value = entree.contentRect.width
  })
  observateur.observe(conteneur.value)
  nextTick(() => allerAAujourdhui(false))
  window.addEventListener('afterprint', finImpression)
})

onBeforeUnmount(() => {
  observateur?.disconnect()
  mediaLg?.removeEventListener('change', surChangementLg)
  window.removeEventListener('afterprint', finImpression)
  clearTimeout(minuterieInfobulle)
})

// Changement de zoom : on garde la même semaine sur le bord gauche.
// `ancre` a été capturée avant que la nouvelle largeur de colonne s'applique.
watch(zoom, () => {
  const cible = ancre.value
  nextTick(() => allerA(cible, false))
})

// ---------------------------------------------------------------------------
// Barres et marqueurs
// ---------------------------------------------------------------------------
const intervalleTexte = (debut, fin) => (fin > debut ? `${formatDate(debut)} → ${formatDate(fin)}` : formatDate(debut))

const barresDe = (chantier) => {
  const barres = []
  const ajouter = (dateDebut, dateFin, type) => {
    if (!dateDebut) return
    const d = new Date(dateDebut)
    const f = dateFin ? new Date(dateFin) : new Date(dateDebut)
    if (Number.isNaN(d.getTime()) || Number.isNaN(f.getTime())) return
    const i0 = Math.max(0, indexDe(d))
    const i1 = Math.min(nbSemaines.value - 1, indexDe(f))
    if (i1 < i0) return
    // `periode` : les barres sont au pas de la semaine, l'infobulle donne les dates exactes
    barres.push({ type, col: i0, span: i1 - i0 + 1, periode: intervalleTexte(d, f) })
  }
  for (const p of chantier.date_prepa || []) ajouter(p.date_start_prepa, p.date_end_prepa, 'prepa')
  for (const p of chantier.date_rea || []) ajouter(p.date_start_travaux, p.date_end_travaux, 'rea')
  return barres
}

const weekendsDe = (chantier) => {
  const colonnes = new Set()
  for (const w of allWeekends.value || []) {
    if (w.chantier_id !== chantier.id) continue
    const col = Math.round((getLundiDeSemaine(w.semaine_debut, w.annee_debut) - debutPlage.value) / MS_SEMAINE)
    // Set : deux week-ends sur la même semaine ne doivent donner qu'un marqueur
    if (col >= 0 && col < nbSemaines.value) colonnes.add(col)
  }
  return [...colonnes].sort((a, b) => a - b).map((col) => ({ col }))
}

// Colonnes réellement occupées, sous forme de segments [début, fin]. On garde le
// détail plutôt qu'un simple min/max : un chantier à deux périodes éloignées ne doit
// pas rester affiché dans le trou qui les sépare.
const segmentsDe = (barres, weekends) => {
  const segments = barres.map((b) => [b.col, b.col + b.span - 1])
  for (const w of weekends) segments.push([w.col, w.col])
  return segments
}

// Un chantier sans aucune période ni week-end n'aurait qu'une ligne vide
const lignes = computed(() =>
  props.chantiers
    .map((chantier) => {
      const barres = barresDe(chantier)
      const weekends = weekendsDe(chantier)
      return { chantier, barres, weekends, segments: segmentsDe(barres, weekends) }
    })
    .filter((l) => l.segments.length > 0)
)

// Seules les lignes qui ont une barre ou un marqueur à l'écran : sinon on affiche des
// lignes vides pour des chantiers situés des mois plus loin.
// `colDebutVisible`/`colFinVisible` sont des entiers — tant que le défilement reste dans
// la même semaine, Vue court-circuite la propagation et ce filtre ne tourne pas.
const lignesVisibles = computed(() => {
  if (!mesureFaite.value) return []
  const debut = colDebutVisible.value
  const fin = colFinVisible.value
  if (fin < debut) return []
  return lignes.value.filter((l) => l.segments.some(([a, b]) => a <= fin && b >= debut))
})

const nbSansDates = computed(() => props.chantiers.length - lignes.value.length)
const nbHorsFenetre = computed(() => lignes.value.length - lignesVisibles.value.length)

// ---------------------------------------------------------------------------
// Impression : on rend la seule fenêtre visible, ramenée à l'origine, à une largeur
// de colonne calée sur la page et non sur le viewport. Le reste du gabarit est
// partagé avec l'écran — d'où les computed « affichées » ci-dessous.
// ---------------------------------------------------------------------------
const modeImpression = ref(false)

// Fenêtre figée au moment du clic : la mise en page d'impression redimensionne le
// conteneur, le ResizeObserver repart, et la fenêtre « visible » se décalerait
// pendant qu'on imprime. On imprime ce qui était à l'écran, pas ce qui l'est devenu.
const fenetreImprimee = ref({ debut: 0, fin: -1 })

const colonnesImprimees = computed(() => plage.value.slice(fenetreImprimee.value.debut, fenetreImprimee.value.fin + 1))

// Barres et marqueurs rognés sur la fenêtre puis décalés à l'origine de la tranche.
// On repart de `lignes` et non de `lignesVisibles` : le jeu de lignes imprimé ne doit
// dépendre que de la fenêtre figée, jamais du défilement en cours.
const lignesImprimees = computed(() => {
  const { debut: d, fin: f } = fenetreImprimee.value
  if (f < d) return []
  return lignes.value
    .filter((l) => l.segments.some(([a, b]) => a <= f && b >= d))
    .map((l) => ({
      chantier: l.chantier,
      barres: l.barres
        .map((b) => {
          const debut = Math.max(b.col, d)
          const fin = Math.min(b.col + b.span - 1, f)
          return { ...b, col: debut - d, span: fin - debut + 1 }
        })
        .filter((b) => b.span > 0),
      weekends: l.weekends.filter((w) => w.col >= d && w.col <= f).map((w) => ({ col: w.col - d }))
    }))
})

const colonnesAffichees = computed(() => (modeImpression.value ? colonnesImprimees.value : plage.value))
const lignesAffichees = computed(() => (modeImpression.value ? lignesImprimees.value : lignesVisibles.value))

const largeurColonneAffichee = computed(() => {
  if (!modeImpression.value) return largeurColonne.value
  const restant = LARGEUR_PAGE - LARGEUR_CHANTIER_PRINT
  return Math.max(12, Math.floor(restant / Math.max(1, colonnesImprimees.value.length)))
})

// Première colonne de timeline dans la grille (base 1) : la colonne Statut disparaît
// à l'impression, tout ce qui est positionné par `gridColumn` se décale d'un cran.
const colBase = computed(() => (modeImpression.value ? 2 : 3))

// Pas de repère « aujourd'hui » sur papier : un tirage est daté, la colonne surlignée
// et le trait n'y ajoutent rien et alourdissent la lecture. -1 neutralise les trois
// marqueurs d'un coup (surlignage de colonne, pastille « Auj. », trait vertical).
const colAujourdhuiAffiche = computed(() => (modeImpression.value ? -1 : colAujourdhui.value))

const gridTemplateColumns = computed(() => {
  const semaines = `repeat(${colonnesAffichees.value.length}, ${largeurColonneAffichee.value}px)`
  if (modeImpression.value) return `${LARGEUR_CHANTIER_PRINT}px ${semaines}`
  return `${LARGEUR_CHANTIER}px ${LARGEUR_STATUT}px ${semaines}`
})

// `@page` est global par nature : on l'injecte le temps de l'impression plutôt que de
// le poser en dur, sinon il s'appliquerait aux autres pages imprimables de l'app.
let styleImpression = null

// Position d'avant impression, à restituer en sortant
let positionAvantImpression = { x: 0, y: 0 }

// `afterprint` couvre aussi l'annulation de la boîte d'impression du navigateur.
// La garde évite de réagir à un Ctrl+P déclenché hors de notre bouton.
const finImpression = async () => {
  if (!modeImpression.value) return
  modeImpression.value = false
  styleImpression?.remove()
  styleImpression = null

  // La grille ne reprend sa pleine largeur qu'au tick suivant ; avant ça, `scrollLeft`
  // serait replafonné sur le contenu court de l'impression.
  await nextTick()
  const replacer = () => {
    if (!conteneur.value) return
    conteneur.value.scrollLeft = positionAvantImpression.x
    conteneur.value.scrollTop = positionAvantImpression.y
  }
  replacer()
  // Certains navigateurs recadrent encore le défilement après `afterprint` : on repose
  // la position à la frame suivante, sinon elle est reperdue juste après avoir été mise.
  requestAnimationFrame(replacer)
  defilement.value = positionAvantImpression.x
}

const imprimer = async () => {
  if (modeImpression.value) return
  positionAvantImpression = {
    x: conteneur.value?.scrollLeft ?? defilement.value,
    y: conteneur.value?.scrollTop ?? 0
  }
  fenetreImprimee.value = { debut: colDebutVisible.value, fin: colFinVisible.value }

  styleImpression = document.createElement('style')
  // `visibility` plutôt que `display:none` : on masque le chrome de la page (navbar,
  // barre latérale, tuiles, barre d'outils) sans avoir à les connaître un par un, et
  // sans reflow. Le planning est remonté à l'origine de la page.
  styleImpression.textContent = `
    @page { size: A3 landscape; margin: 6mm; }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body * { visibility: hidden !important; }
      .planning-impression, .planning-impression * { visibility: visible !important; }
      .planning-impression {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: auto !important;
      }
    }
  `
  document.head.appendChild(styleImpression)

  modeImpression.value = true
  await nextTick()
  if (document.fonts) await document.fonts.ready
  window.print()
}

// ---------------------------------------------------------------------------
// Export Excel : le Gantt complet (toute la plage), une colonne par semaine.
// Contrairement à l'impression, aucune raison de tronquer — un tableur défile.
// ---------------------------------------------------------------------------
// `useEtatChantier` n'expose que des classes Tailwind ; Excel veut des hexa.
// Teinte pleine = réalisation, teinte claire = préparation (comme à l'écran).
const COULEURS_ETAT = {
  0: { rea: '0EA5E9', prepa: 'BAE6FD' }, // sky — RLT
  1: { rea: 'A855F7', prepa: 'E9D5FF' }, // purple — Externe
  2: { rea: '84CC16', prepa: 'D9F99D' }, // lime — Pré-op
  '-1': { rea: '64748B', prepa: 'E2E8F0' } // slate — Terminé
}
const COULEURS_INCONNU = { rea: '6B7280', prepa: 'E5E7EB' }
const couleursDe = (etat) => COULEURS_ETAT[etat] ?? COULEURS_INCONNU

// Type de barre par colonne ; la réalisation prime sur la préparation, comme le z-index
const typesParColonne = (ligne, nb) => {
  const types = new Array(nb).fill(null)
  for (const b of ligne.barres) {
    for (let k = b.col; k < b.col + b.span && k < nb; k++) {
      if (k >= 0 && (b.type === 'rea' || types[k] === null)) types[k] = b.type
    }
  }
  return types
}

// xlsx-js-style n'écrit pas les volets figés : on injecte le <pane> dans le XML.
// Sans ça, dès qu'on défile à droite on perd le nom des chantiers.
const figerVolets = async (buffer, xSplit, ySplit, cellule) => {
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(buffer)
  const chemin = 'xl/worksheets/sheet1.xml'
  const fichier = zip.file(chemin)
  if (!fichier) return buffer
  const xml = await fichier.async('string')
  const pane =
    `<pane xSplit="${xSplit}" ySplit="${ySplit}" topLeftCell="${cellule}" activePane="bottomRight" state="frozen"/>` +
    '<selection pane="bottomRight"/>'
  const patche = xml.replace(/<sheetView([^>]*?)\/>/, `<sheetView$1>${pane}</sheetView>`)
  if (patche === xml) return buffer // structure inattendue : on renvoie le classeur tel quel
  zip.file(chemin, patche)
  // ATTENTION : `type: 'array'` ne veut pas dire la même chose des deux côtés.
  // SheetJS rend un ArrayBuffer, JSZip un tableau JS de nombres — que `new Blob([…])`
  // sérialiserait en texte, produisant un .xlsx illisible par Excel.
  return zip.generateAsync({ type: 'arraybuffer' })
}

// Titre du classeur : il sera relu un autre jour, hors de tout contexte d'écran. Il doit
// donc dire ce que le fichier contient — le filtre appliqué et le volume — et non l'état
// du défilement au moment de l'export.
const titreExport = computed(() => {
  const quoi = props.selection || 'Planning des chantiers'
  const n = lignes.value.length
  return `${quoi} — ${n} chantier${pluriel(n)} · export du ${formatDate(new Date())}`
})

const exportEnCours = ref(false)

const exporterExcel = async () => {
  if (exportEnCours.value || lignes.value.length === 0) return
  exportEnCours.value = true
  try {
    const mod = await import('xlsx-js-style')
    const XLSX = mod.utils ? mod : (mod.default ?? mod)

    const semaines = plage.value
    const nb = semaines.length
    const COL0 = 3 // Compte, Chantier, Statut avant la timeline
    const R_TITRE = 0
    const R_MOIS = 1
    const R_ENTETE = 2
    const R_DATA = 3
    const lastCol = COL0 + nb - 1

    const mois = grouperParMois(semaines)
    const ligneMois = ['', '', '']
    for (const m of mois) {
      ligneMois.push(m.label)
      for (let i = 1; i < m.colspan; i++) ligneMois.push('')
    }

    const vides = semaines.map(() => '')
    const ws = XLSX.utils.aoa_to_sheet([
      [titreExport.value],
      ligneMois,
      ['Compte', 'Chantier', 'Statut', ...semaines.map((s) => `S${s.numero}`)],
      ...lignes.value.map((l) => [
        l.chantier.compte || '',
        l.chantier.name || '',
        getEtatInfo(l.chantier.etat).label,
        ...vides
      ])
    ])

    const R_LEGENDE = R_DATA + lignes.value.length + 1
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        ['Légende'],
        ['Teinte pleine = réalisation · teinte claire = préparation · trait orange à droite = week-end.'],
        ['La couleur reprend le statut du chantier (colonne C).']
      ],
      { origin: { r: R_LEGENDE, c: 0 } }
    )

    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: R_LEGENDE + 2, c: lastCol } })
    ws['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 10 }, ...semaines.map(() => ({ wch: 3.2 }))]
    ws['!rows'] = [{ hpt: 24 }, { hpt: 18 }, { hpt: 18 }]

    const merges = [{ s: { r: R_TITRE, c: 0 }, e: { r: R_TITRE, c: lastCol } }]
    let offset = 0
    for (const m of mois) {
      if (m.colspan > 1) {
        merges.push({ s: { r: R_MOIS, c: COL0 + offset }, e: { r: R_MOIS, c: COL0 + offset + m.colspan - 1 } })
      }
      offset += m.colspan
    }
    for (let i = 0; i < 3; i++) {
      merges.push({ s: { r: R_LEGENDE + i, c: 0 }, e: { r: R_LEGENDE + i, c: Math.min(lastCol, COL0 + 11) } })
    }
    ws['!merges'] = merges

    const trait = { style: 'thin', color: { rgb: 'E5E7EB' } }
    const cadre = { top: trait, bottom: trait, left: trait, right: trait }
    const cellule = (r, c) => {
      const addr = XLSX.utils.encode_cell({ r, c })
      return ws[addr] || (ws[addr] = { t: 's', v: '' })
    }

    cellule(R_TITRE, 0).s = {
      font: { bold: true, sz: 13, color: { rgb: 'FFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: '2F6F62' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    }

    for (let c = 0; c <= lastCol; c++) {
      cellule(R_MOIS, c).s = {
        font: { bold: true, sz: 9, color: { rgb: '334155' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'F1F5F9' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: cadre
      }
      cellule(R_ENTETE, c).s = {
        font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: '334155' } },
        alignment: { horizontal: c < COL0 ? 'left' : 'center', vertical: 'center' },
        border: cadre
      }
    }

    lignes.value.forEach((ligne, i) => {
      const r = R_DATA + i
      const couleurs = couleursDe(ligne.chantier.etat)
      const types = typesParColonne(ligne, nb)
      const weekends = new Set(ligne.weekends.map((w) => w.col))

      for (let c = 0; c < COL0; c++) {
        cellule(r, c).s = {
          font: { sz: 10 },
          alignment: { horizontal: c === 2 ? 'center' : 'left', vertical: 'center' },
          border: cadre
        }
      }
      for (let k = 0; k < nb; k++) {
        const style = { border: { ...cadre } }
        if (types[k]) {
          style.fill = { patternType: 'solid', fgColor: { rgb: types[k] === 'rea' ? couleurs.rea : couleurs.prepa } }
        }
        if (weekends.has(k)) style.border.right = { style: 'medium', color: { rgb: 'F97316' } }
        cellule(r, COL0 + k).s = style
      }
    })

    cellule(R_LEGENDE, 0).s = { font: { bold: true, sz: 10, color: { rgb: '334155' } } }
    for (let i = 1; i < 3; i++) cellule(R_LEGENDE + i, 0).s = { font: { sz: 9, color: { rgb: '64748B' } } }

    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({ s: { r: R_ENTETE, c: 0 }, e: { r: R_ENTETE, c: COL0 - 1 } })
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Planning')
    const brut = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    const fige = await figerVolets(brut, COL0, R_DATA, `${XLSX.utils.encode_col(COL0)}${R_DATA + 1}`)

    const url = URL.createObjectURL(
      new Blob([fige], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    )
    const lien = document.createElement('a')
    lien.href = url
    lien.download = `planning-chantiers-${new Date().toISOString().slice(0, 10)}.xlsx`
    // Ancre attachée au document, et révocation différée : sur un blob binaire un peu
    // gros, révoquer dans la foulée du clic peut annuler le téléchargement.
    document.body.appendChild(lien)
    lien.click()
    lien.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  } finally {
    exportEnCours.value = false
  }
}

const pluriel = (n) => (n > 1 ? 's' : '')

// Le masquage doit rester explicite, sinon on retombe sur le doute qu'il corrige.
const resume = computed(() => {
  const n = lignesVisibles.value.length
  const parts = [`${n} chantier${pluriel(n)} sur la période affichée`]
  if (nbHorsFenetre.value > 0) parts.push(`${nbHorsFenetre.value} hors période`)
  if (nbSansDates.value > 0) parts.push(`${nbSansDates.value} sans période planifiée`)
  return `${parts.join(' · ')}.`
})

// ---------------------------------------------------------------------------
// Saut au chantier planifié le plus proche, quand la fenêtre tombe dans un trou
// ---------------------------------------------------------------------------
const colonnesOccupees = computed(() => {
  const colonnes = new Set()
  for (const l of lignes.value) {
    for (const [a, b] of l.segments) {
      for (let c = a; c <= b; c++) colonnes.add(c)
    }
  }
  return [...colonnes].sort((x, y) => x - y)
})

const cibleSaut = (sens) =>
  sens > 0
    ? colonnesOccupees.value.find((c) => c > colFinVisible.value)
    : colonnesOccupees.value.findLast((c) => c < colDebutVisible.value)

const sauterVers = (sens) => {
  const cible = cibleSaut(sens)
  if (cible === undefined) return
  // vers la droite la cible se pose à gauche de l'écran, vers la gauche elle se pose à droite
  allerA(Math.max(0, sens > 0 ? cible - 1 : cible - nbColonnesFenetre.value + 2))
}

const dateCourte = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

const periodeTexte = (chantier) => {
  const d = getFirstReaDate(chantier)
  if (!d) return null
  const f = getLastReaDate(chantier)
  return f && f !== d ? `${formatDate(d)} → ${formatDate(f)}` : formatDate(d)
}

// Les dates ont quitté la ligne pour la tenir sur une seule hauteur : on les retrouve
// au survol du nom (période de réalisation) et de chaque barre (sa propre période).
const infobulleChantier = (chantier) => {
  const periode = periodeTexte(chantier)
  return periode ? `${chantier.name} — ${periode}` : chantier.name
}

const infobulleBarre = (chantier, barre) => {
  const prefixe = barre.type === 'prepa' ? `Préparation — ${chantier.name}` : chantier.name
  return `${prefixe} — ${barre.periode}`
}

// ---------------------------------------------------------------------------
// Infobulle maison : le `title` natif attend ~1 s avant de s'afficher, délai imposé
// par le navigateur et non paramétrable. Un seul nœud partagé, en position fixed pour
// échapper au conteneur défilant qui le rognerait.
// ---------------------------------------------------------------------------
const DELAI_INFOBULLE = 120 // assez court pour paraître instantané, assez long pour ne pas clignoter au balayage
const LARGEUR_INFOBULLE = 340

const infobulle = ref({ texte: '', x: 0, y: 0, aGauche: false, enHaut: false, visible: false })
let minuterieInfobulle = null

const montrerInfobulle = (e, texte) => {
  if (!texte) return
  clearTimeout(minuterieInfobulle)
  const { clientX, clientY } = e
  minuterieInfobulle = setTimeout(() => {
    infobulle.value = {
      texte,
      x: clientX,
      y: clientY,
      // bascule côté opposé quand on approche du bord, pour ne jamais sortir de l'écran
      aGauche: clientX > window.innerWidth - LARGEUR_INFOBULLE,
      enHaut: clientY > window.innerHeight - 80,
      visible: true
    }
  }, DELAI_INFOBULLE)
}

const cacherInfobulle = () => {
  clearTimeout(minuterieInfobulle)
  infobulle.value.visible = false
}

const styleInfobulle = computed(() => {
  const i = infobulle.value
  return {
    left: `${i.x + (i.aGauche ? -14 : 14)}px`,
    top: `${i.y + (i.enHaut ? -14 : 18)}px`,
    transform: `translate(${i.aGauche ? '-100%' : '0'}, ${i.enHaut ? '-100%' : '0'})`,
    maxWidth: `${LARGEUR_INFOBULLE}px`
  }
})

// Impression et export sont pilotés depuis la barre d'outils de la page, aux côtés de
// l'export CSV : les deux actions vivent ici (elles ont besoin de la fenêtre visible et
// de la plage), mais leurs boutons appartiennent au même groupe que le CSV.
defineExpose({
  imprimer,
  exporterExcel,
  exportEnCours,
  nbPlanifies: computed(() => lignes.value.length)
})
</script>

<template>
  <div class="planning-impression flex h-full min-h-0 flex-col gap-3">
    <!-- Entête d'impression : inexistant à l'écran, il porte le contexte sur papier.
         Même facture que les autres pages imprimables (logo + titre Bangers). -->
    <div class="hidden print:mb-3 print:flex print:items-center print:justify-between print:gap-4">
      <div class="flex items-center gap-3">
        <img src="/images/logo_uo.png" alt="" class="w-10" />
        <div class="flex flex-col items-start">
          <p class="text-primary-900 font-[Bangers] text-2xl font-semibold tracking-wider">Planning des chantiers</p>
          <p class="text-primary-900 -mt-1 text-sm italic">{{ sousTitreImpression }}</p>
        </div>
      </div>
      <div class="text-primary-500 text-right text-[10px] leading-tight">
        <p>{{ lignesImprimees.length }} chantier{{ pluriel(lignesImprimees.length) }}</p>
        <p>Édité le {{ formatDate(new Date()) }}</p>
      </div>
    </div>

    <!-- ===== Barre d'outils ===== -->
    <div class="flex flex-none flex-wrap items-center justify-between gap-3 print:hidden">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="border-primary-200 bg-primary-50 text-primary-600 hover:border-primary-300 hover:text-primary-800 cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
          @click="allerAAujourdhui()">
          Aujourd'hui
        </button>
        <div class="border-primary-200 bg-primary-50 flex items-center rounded-lg border">
          <!-- `flex items-center justify-center` : l'icône est un inline-block posé sur
               la ligne de base (vertical-align: -0.125em), l'espace de jambage sous
               celle-ci la décalerait dans le bouton. Même parade que le bouton CSV. -->
          <button
            type="button"
            class="text-primary-600 hover:bg-primary-200 flex cursor-pointer items-center justify-center rounded-l-lg px-2 py-1.5 transition-colors"
            title="Reculer"
            @click="defiler(-1)">
            <Icon name="lucide:chevron-left" size="18" />
          </button>
          <button
            type="button"
            class="text-primary-600 hover:bg-primary-200 flex cursor-pointer items-center justify-center rounded-r-lg px-2 py-1.5 transition-colors"
            title="Avancer"
            @click="defiler(1)">
            <Icon name="lucide:chevron-right" size="18" />
          </button>
        </div>
        <span class="text-primary-700 text-sm font-semibold">{{ libelleFenetre }}</span>
      </div>

      <div class="flex items-center gap-3">
        <div class="text-primary-500 hidden items-center gap-3 text-xs xl:flex">
          <span class="flex items-center gap-1.5">
            <span class="bg-primary-300 h-2.5 w-4 rounded-xs opacity-60" />
            Préparation
          </span>
          <span class="flex items-center gap-1.5">
            <span class="bg-primary-400 h-2.5 w-4 rounded-xs" />
            Réalisation
          </span>
          <span class="flex items-center gap-1.5">
            <span class="h-3 w-[4px] bg-orange-500" />
            Week-end
          </span>
        </div>
        <div class="w-32">
          <AppSelect v-model="zoom" :options="zooms" name="zoom" />
        </div>
      </div>
    </div>

    <!-- ===== Timeline défilable ===== -->
    <!-- À l'impression : plus de clipping ni de hauteur contrainte, la grille est
         déjà réduite à la fenêtre visible et tient dans la largeur de la page. -->
    <div
      ref="conteneur"
      class="border-primary-200 min-h-0 flex-1 overflow-auto rounded-xl border bg-white dark:bg-slate-900 print:min-h-0 print:overflow-visible print:rounded-none print:border-0"
      @scroll.passive="surDefilement">
      <div class="grid" :style="{ gridTemplateColumns }">
        <!-- Entête collant, sur 2 lignes -->
        <div
          class="col-span-full grid grid-cols-subgrid sticky top-0 z-30 bg-white dark:bg-slate-900"
          style="grid-row: span 2">
          <div
            class="border-primary-200 text-primary-500 row-span-2 flex items-center border-r border-b bg-white px-4 text-xs font-medium uppercase lg:sticky lg:left-0 lg:z-40 dark:bg-slate-900">
            Chantier
          </div>
          <div
            v-if="!modeImpression"
            class="border-primary-200 text-primary-500 row-span-2 flex items-center justify-center border-r border-b bg-white px-3 text-xs font-medium uppercase lg:sticky lg:left-[280px] lg:z-40 dark:bg-slate-900">
            Statut
          </div>

          <!-- Ligne 1 : mois -->
          <div
            v-for="m in moisPlage"
            :key="m.cle"
            :style="{ gridColumn: `span ${m.colspan}` }"
            class="border-primary-200 bg-primary-100 text-primary-700 truncate border-l border-b px-2 py-1 text-center text-xs font-semibold">
            {{ m.colspan === 1 ? m.labelCourt : m.label }}
          </div>

          <!-- Ligne 2 : semaines -->
          <div
            v-for="(s, i) in colonnesAffichees"
            :key="`${s.annee}-${s.numero}`"
            class="border-primary-100 relative flex flex-col items-center justify-center border-l px-0.5 pt-1 pb-4"
            :class="i === colAujourdhuiAffiche ? 'bg-secondary-50' : ''">
            <span
              class="text-xs font-medium"
              :class="i === colAujourdhuiAffiche ? 'text-secondary-700' : 'text-primary-700'">
              {{ modeImpression ? s.numero : `S${s.numero}` }}
            </span>
            <span v-if="!compact" class="text-primary-400 text-[10px] whitespace-nowrap">
              {{ dateCourte(s.lundi) }}
            </span>
            <span
              v-if="i === colAujourdhuiAffiche"
              :style="{ left: positionAujourdhui }"
              class="bg-secondary-600 absolute bottom-0.5 z-10 -translate-x-1/2 rounded-full px-1.5 py-px text-[9px] font-semibold whitespace-nowrap text-white">
              Auj.
            </span>
          </div>
        </div>

        <!-- ===== Lignes chantiers ===== -->
        <div
          v-for="ligne in lignesAffichees"
          :key="ligne.chantier.id"
          class="group border-primary-100 col-span-full grid grid-cols-subgrid items-center border-b print:break-inside-avoid">
          <!-- Chantier (figé à gauche). Tenu sur une seule ligne pour afficher plus de
               chantiers d'un coup : les dates exactes, redondantes avec la position des
               barres, sont passées en infobulle. `min-w-0` pour que `truncate` opère. -->
          <div
            class="border-primary-200 group-hover:bg-primary-200 flex items-center gap-2 self-stretch border-r bg-white px-4 py-1 transition-colors lg:sticky lg:left-0 lg:z-[25] dark:bg-slate-900">
            <span
              class="bg-primary-100 text-primary-700 shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold">
              {{ ligne.chantier.compte || '—' }}
            </span>
            <button
              type="button"
              class="text-primary-800 hover:text-secondary-600 min-w-0 truncate text-left text-sm font-medium transition-colors hover:underline"
              @click="emit('open', ligne.chantier.id)"
              @mouseenter="montrerInfobulle($event, infobulleChantier(ligne.chantier))"
              @mouseleave="cacherInfobulle">
              {{ ligne.chantier.name }}
            </button>
          </div>

          <!-- Statut (figé à gauche). Absent du papier : la couleur des barres suffit. -->
          <div
            v-if="!modeImpression"
            class="border-primary-200 group-hover:bg-primary-200 flex items-center justify-center self-stretch border-r bg-white px-3 transition-colors lg:sticky lg:left-[280px] lg:z-[25] dark:bg-slate-900">
            <span
              class="inline-flex w-[84px] justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
              :class="[getEtatInfo(ligne.chantier.etat).bgLight, getEtatInfo(ligne.chantier.etat).textColor]">
              {{ getEtatInfo(ligne.chantier.etat).label }}
            </span>
          </div>

          <!-- Fond : lignes de semaines en dégradé répété, un seul nœud par ligne.
               Porte aussi le survol de la ligne : sans lui il ne couvrirait que les
               colonnes figées, invisible quand on regarde la timeline. -->
          <div
            class="group-hover:bg-primary-200 h-full self-stretch transition-colors"
            :style="[fondSemaines, { gridColumn: `${colBase} / -1`, gridRow: 1 }]" />

          <!-- Barres de périodes -->
          <div
            v-for="(b, i) in ligne.barres"
            :key="`barre-${i}`"
            :style="{ gridColumn: `${colBase + b.col} / span ${b.span}`, gridRow: 1 }"
            class="mx-px flex h-6 items-center overflow-hidden rounded-md border px-2"
            :class="[
              getEtatInfo(ligne.chantier.etat).bgLight,
              getEtatInfo(ligne.chantier.etat).border,
              b.type === 'prepa' ? 'z-0 border-dashed opacity-60' : 'z-10',
              props.canEdit ? 'cursor-pointer' : ''
            ]"
            @click="props.canEdit && emit('edit', ligne.chantier)"
            @mouseenter="montrerInfobulle($event, infobulleBarre(ligne.chantier, b))"
            @mouseleave="cacherInfobulle">
            <span
              v-if="b.type === 'rea' && b.span > 1"
              class="truncate text-[11px] font-medium"
              :class="getEtatInfo(ligne.chantier.etat).textColor">
              {{ ligne.chantier.name }}
            </span>
          </div>

          <!-- Marqueurs de week-end -->
          <div
            v-for="(w, i) in ligne.weekends"
            :key="`we-${i}`"
            :style="{ gridColumn: colBase + w.col, gridRow: 1 }"
            class="pointer-events-none relative z-20 h-full self-stretch">
            <span class="absolute inset-y-0.5 -right-[2px] w-[4px] bg-orange-500" title="Week-end" />
          </div>

          <!-- Trait du jour -->
          <div
            v-if="colAujourdhuiAffiche >= 0"
            :style="{ gridColumn: colBase + colAujourdhuiAffiche, gridRow: 1 }"
            class="pointer-events-none relative z-20 h-full self-stretch">
            <span
              :style="{ left: positionAujourdhui }"
              class="border-secondary-400 absolute inset-y-0 border-l-2 border-dashed" />
          </div>
        </div>

        <!-- Aucun chantier à afficher. Le bloc s'étend sur toute la plage : on le fige
             à la largeur du viewport pour qu'il reste lisible même défilé loin à droite. -->
        <div v-if="mesureFaite && lignesVisibles.length === 0" class="col-span-full">
          <div class="px-6 py-12 text-center lg:sticky lg:left-0" :style="{ width: `${largeurDispo}px` }">
            <Icon name="lucide:calendar-x" size="40" class="text-primary-300 mx-auto mb-3" />

            <template v-if="lignes.length === 0">
              <p class="text-primary-500 text-sm font-medium">Aucun chantier planifié dans la sélection</p>
            </template>
            <template v-else>
              <p class="text-primary-500 text-sm font-medium">Aucun chantier sur la période affichée</p>
              <p class="text-primary-400 mt-1 text-xs">
                {{ nbHorsFenetre }} chantier{{ pluriel(nbHorsFenetre) }} planifié{{ pluriel(nbHorsFenetre) }} en dehors
                de cette fenêtre.
              </p>
              <div class="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  class="border-primary-200 bg-primary-50 text-primary-600 hover:border-primary-300 hover:text-primary-800 inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-default disabled:opacity-40"
                  :disabled="cibleSaut(-1) === undefined"
                  @click="sauterVers(-1)">
                  <Icon name="lucide:arrow-left" size="16" />
                  Précédent
                </button>
                <button
                  type="button"
                  class="border-primary-200 bg-primary-50 text-primary-600 hover:border-primary-300 hover:text-primary-800 inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-default disabled:opacity-40"
                  :disabled="cibleSaut(1) === undefined"
                  @click="sauterVers(1)">
                  Suivant
                  <Icon name="lucide:arrow-right" size="16" />
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Compteurs d'écran : sur papier l'entête porte déjà le décompte -->
    <p v-if="mesureFaite && lignes.length > 0" class="text-primary-400 flex-none text-xs print:hidden">{{ resume }}</p>

    <!-- Infobulle : hors du conteneur défilant, en position fixed, pour n'être rognée par rien -->
    <div
      v-if="infobulle.visible"
      :style="styleInfobulle"
      class="pointer-events-none fixed z-50 rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white shadow-lg dark:bg-slate-700">
      {{ infobulle.texte }}
    </div>
  </div>
</template>
