<script setup>
/**
 * Canvas visuel d'une logique métier :
 * - Auto-layout en arbre top-down (Reingold-Tilford simplifié)
 * - Pan (drag background) + zoom (molette ou boutons)
 * - SVG en couche inférieure pour les connecteurs bezier
 * - 3 sections empilées verticalement : arbre principal · génériques · non utilisées
 *
 * Pas de drag-to-connect (édition via panneau droit).
 * Pas de persistance des positions (recalculées à chaque ouverture).
 */
const props = defineProps({
  logique: { type: Object, required: true },
  selectedQuestionId: { type: String, default: null },
})

const emit = defineEmits(['select', 'setStart', 'createNextFromResponse', 'createNextFromQuestion'])

// ── Constantes de layout ──────────────────────────────────────────────────
const NODE_W = 280
const H_GAP = 60
const V_GAP = 80
const SECTION_GAP = 60
const LABEL_H = 36

// ── Indexes ───────────────────────────────────────────────────────────────
const questionsById = computed(() => {
  const m = new Map()
  for (const q of props.logique.questions || []) m.set(q.id, q)
  return m
})

// Numérotation Q1, Q1.1, Q1.1.2…
const numbering = computed(() => {
  const map = new Map()
  const startId = props.logique.start_question_id
  const byId = questionsById.value

  const assign = (id, prefix, visited = new Set()) => {
    if (!id || map.has(id) || visited.has(id) || !byId.has(id)) return
    const v = new Set(visited); v.add(id)
    map.set(id, prefix)
    const q = byId.get(id)
    if (q.is_generic && id !== startId) return
    if (q.type === 'multiple') {
      if (q.next_question_id) assign(q.next_question_id, `${prefix}.1`, v)
    } else {
      (q.reponses || []).forEach((r, i) => {
        if (r.next_question_id) assign(r.next_question_id, `${prefix}.${i + 1}`, v)
      })
    }
  }

  if (startId) assign(startId, 'Q1')
  let nextRoot = startId ? 2 : 1
  for (const q of props.logique.questions || []) {
    if (map.has(q.id) || !q.is_generic) continue
    assign(q.id, `Q${nextRoot}`)
    nextRoot++
  }
  for (const q of props.logique.questions || []) {
    if (map.has(q.id)) continue
    assign(q.id, `Q${nextRoot}`)
    nextRoot++
  }
  return map
})

// ── Hauteurs mesurées via ResizeObserver (fallback estimation) ──────────
const measuredHeights = ref(new Map())

const estimateHeight = (q) => {
  const HEADER = 36
  const TITLE = q.description ? 70 : 50
  if (q.type === 'multiple') {
    const lines = Math.max(1, q.reponses?.length || 0)
    return HEADER + TITLE + lines * 28 + 14
  }
  const n = q.reponses?.length || 0
  if (n === 0) return HEADER + TITLE + 32
  // Estimation conservatrice : 2 chips par ligne en moyenne (peut wraper davantage)
  const rows = Math.ceil(n / 2)
  return HEADER + TITLE + rows * 34 + 10
}

const heightFor = (q) => measuredHeights.value.get(q.id) ?? estimateHeight(q)

// ── Layout récursif d'un sous-arbre ──────────────────────────────────────
// Retourne { width, height, positions: Map<id, {x,y,h}> } (coords relatives au sous-arbre)
const layoutSubtree = (rootId, byId, visited = new Set()) => {
  if (!rootId || visited.has(rootId) || !byId.has(rootId)) {
    return { width: 0, height: 0, positions: new Map() }
  }
  const newVisited = new Set(visited)
  newVisited.add(rootId)
  const node = byId.get(rootId)

  // Récupération des enfants (en sautant les génériques, gérées séparément)
  const childIds = []
  if (node.type === 'multiple') {
    if (node.next_question_id && !byId.get(node.next_question_id)?.is_generic) {
      childIds.push(node.next_question_id)
    }
  } else {
    for (const r of node.reponses || []) {
      if (r.next_question_id && !byId.get(r.next_question_id)?.is_generic) {
        childIds.push(r.next_question_id)
      }
    }
  }

  const nodeH = heightFor(node)
  const childLayouts = childIds
    .map((c) => layoutSubtree(c, byId, newVisited))
    .filter((cl) => cl.width > 0)

  if (childLayouts.length === 0) {
    const positions = new Map()
    positions.set(rootId, { x: 0, y: 0, h: nodeH })
    return { width: NODE_W, height: nodeH, positions }
  }

  let offsetX = 0
  const placements = []
  let maxChildHeight = 0
  for (const cl of childLayouts) {
    placements.push({ offsetX, layout: cl })
    offsetX += cl.width + H_GAP
    if (cl.height > maxChildHeight) maxChildHeight = cl.height
  }
  const childrenWidth = Math.max(0, offsetX - H_GAP)
  const myWidth = Math.max(NODE_W, childrenWidth)
  const myX = (myWidth - NODE_W) / 2
  const childY = nodeH + V_GAP

  const positions = new Map()
  positions.set(rootId, { x: myX, y: 0, h: nodeH })
  for (const p of placements) {
    for (const [id, pos] of p.layout.positions) {
      positions.set(id, { x: pos.x + p.offsetX, y: pos.y + childY, h: pos.h })
    }
  }

  return { width: myWidth, height: nodeH + V_GAP + maxChildHeight, positions }
}

// ── Détermination des questions accessibles ──────────────────────────────
const reachableFromStart = computed(() => {
  const set = new Set()
  const startId = props.logique.start_question_id
  if (!startId || !questionsById.value.has(startId)) return set
  const queue = [startId]
  while (queue.length > 0) {
    const id = queue.shift()
    if (set.has(id)) continue
    set.add(id)
    const q = questionsById.value.get(id)
    if (!q) continue
    if (q.is_generic && id !== startId) continue
    if (q.type === 'multiple') {
      if (q.next_question_id) queue.push(q.next_question_id)
    } else {
      for (const r of q.reponses || []) {
        if (r.next_question_id) queue.push(r.next_question_id)
      }
    }
  }
  return set
})

const genericQuestions = computed(() =>
  (props.logique.questions || [])
    .filter((q) => q.is_generic)
    .sort((a, b) => (a.libelle || '').localeCompare(b.libelle || ''))
)

const orphanQuestions = computed(() =>
  (props.logique.questions || [])
    .filter((q) => !q.is_generic && !reachableFromStart.value.has(q.id))
    .sort((a, b) => a.ordre - b.ordre)
)

// ── Sections : layout global avec ses positions absolues monde ──────────
const world = computed(() => {
  const byId = questionsById.value
  const sections = []
  const allPositions = new Map() // id -> { x, y, h }
  let cursorY = 0
  let worldWidth = 0

  // Section 1 : arbre principal
  const startId = props.logique.start_question_id
  if (startId && byId.has(startId)) {
    const layout = layoutSubtree(startId, byId)
    const sectionStartY = cursorY + LABEL_H
    for (const [id, p] of layout.positions) {
      allPositions.set(id, { x: p.x, y: p.y + sectionStartY, h: p.h })
    }
    sections.push({
      key: 'main',
      label: 'Arbre principal',
      icon: 'lucide:flag',
      iconColor: 'text-amber-500',
      x: 0,
      y: cursorY,
      width: layout.width,
      height: LABEL_H + layout.height,
    })
    cursorY += LABEL_H + layout.height + SECTION_GAP
    worldWidth = Math.max(worldWidth, layout.width)
  }

  // Section 2 : génériques (chacune avec son propre sous-arbre)
  if (genericQuestions.value.length > 0) {
    const sectionStartY = cursorY + LABEL_H
    const subtrees = genericQuestions.value.map((q) =>
      layoutSubtree(q.id, byId)
    )
    let offsetX = 0
    let maxH = 0
    subtrees.forEach((st) => {
      for (const [id, p] of st.positions) {
        allPositions.set(id, { x: p.x + offsetX, y: p.y + sectionStartY, h: p.h })
      }
      offsetX += st.width + H_GAP
      if (st.height > maxH) maxH = st.height
    })
    const sectionWidth = Math.max(0, offsetX - H_GAP)
    sections.push({
      key: 'generic',
      label: `Questions génériques (${genericQuestions.value.length})`,
      icon: 'lucide:bookmark',
      iconColor: 'text-amber-500',
      x: 0,
      y: cursorY,
      width: sectionWidth,
      height: LABEL_H + maxH,
    })
    cursorY += LABEL_H + maxH + SECTION_GAP
    worldWidth = Math.max(worldWidth, sectionWidth)
  }

  // Section 3 : orphelines
  if (orphanQuestions.value.length > 0) {
    const sectionStartY = cursorY + LABEL_H
    const subtrees = orphanQuestions.value.map((q) =>
      layoutSubtree(q.id, byId)
    )
    let offsetX = 0
    let maxH = 0
    subtrees.forEach((st) => {
      for (const [id, p] of st.positions) {
        allPositions.set(id, { x: p.x + offsetX, y: p.y + sectionStartY, h: p.h })
      }
      offsetX += st.width + H_GAP
      if (st.height > maxH) maxH = st.height
    })
    const sectionWidth = Math.max(0, offsetX - H_GAP)
    sections.push({
      key: 'orphan',
      label: `Non utilisées (${orphanQuestions.value.length})`,
      icon: 'lucide:circle-slash',
      iconColor: 'text-gray-400',
      x: 0,
      y: cursorY,
      width: sectionWidth,
      height: LABEL_H + maxH,
    })
    cursorY += LABEL_H + maxH
    worldWidth = Math.max(worldWidth, sectionWidth)
  }

  return {
    width: Math.max(800, worldWidth + 80),
    height: Math.max(400, cursorY + 80),
    positions: allPositions,
    sections,
  }
})

// ── Édgesc calculés à partir des positions absolues ──────────────────────
const edges = computed(() => {
  const byId = questionsById.value
  const positions = world.value.positions
  const out = []

  for (const [id, pos] of positions) {
    const q = byId.get(id)
    if (!q) continue
    if (q.type === 'multiple') {
      const targetId = q.next_question_id
      if (!targetId) continue
      const targetPos = positions.get(targetId)
      if (!targetPos) continue
      const targetIsGeneric = byId.get(targetId)?.is_generic
      out.push({
        id: `e-${id}-multi`,
        x1: pos.x + NODE_W / 2,
        y1: pos.y + pos.h,
        x2: targetPos.x + NODE_W / 2,
        y2: targetPos.y,
        srcType: 'bottom',
        color: targetIsGeneric ? 'amber' : 'violet',
        dashed: targetIsGeneric,
        srcQuestionId: id,
        label: 'Puis',
      })
    } else {
      const reps = q.reponses || []
      const n = reps.length
      reps.forEach((r, i) => {
        const targetId = r.next_question_id
        if (!targetId) return
        const targetPos = positions.get(targetId)
        if (!targetPos) return
        const targetIsGeneric = byId.get(targetId)?.is_generic
        const portX = pos.x + NODE_W * (i + 0.5) / Math.max(1, n)
        const portY = pos.y + pos.h
        out.push({
          id: `e-${r.id}`,
          x1: portX,
          y1: portY,
          x2: targetPos.x + NODE_W / 2,
          y2: targetPos.y,
          srcType: 'bottom',
          color: targetIsGeneric ? 'amber' : 'violet',
          dashed: targetIsGeneric,
          srcQuestionId: id,
          reponseId: r.id,
          label: r.libelle || '—',
        })
      })
    }
  }
  return out
})

// ── Mise en surbrillance des edges sortants/entrants du node sélectionné
const isEdgeHighlighted = (e) => {
  if (!props.selectedQuestionId) return false
  return e.srcQuestionId === props.selectedQuestionId
}

// ── Path bezier ──────────────────────────────────────────────────────────
const bezierPath = (e) => {
  const dy = Math.max(40, Math.abs(e.y2 - e.y1) * 0.45)
  const cp1x = e.x1
  const cp1y = e.y1 + dy
  const cp2x = e.x2
  const cp2y = e.y2 - dy
  return `M ${e.x1},${e.y1} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${e.x2},${e.y2}`
}

const edgeStrokeClass = (e) => {
  const highlighted = isEdgeHighlighted(e)
  if (e.color === 'amber') return highlighted ? 'stroke-amber-500' : 'stroke-amber-300'
  return highlighted ? 'stroke-rose-400' : 'stroke-violet-300'
}

// ── Pan & zoom ───────────────────────────────────────────────────────────
const containerRef = ref(null)
const panX = ref(40)
const panY = ref(40)
const zoom = ref(1)
const MIN_ZOOM = 0.3
const MAX_ZOOM = 2

let isPanning = false
let panStart = { x: 0, y: 0, panX: 0, panY: 0 }

const onPanStart = (event) => {
  // Seulement sur fond (pas sur node ni interactive)
  if (event.target.closest('[data-node]') || event.target.closest('button')) return
  if (event.button !== 0) return
  isPanning = true
  panStart = { x: event.clientX, y: event.clientY, panX: panX.value, panY: panY.value }
  event.preventDefault()
}

const onPanMove = (event) => {
  if (!isPanning) return
  panX.value = panStart.panX + (event.clientX - panStart.x)
  panY.value = panStart.panY + (event.clientY - panStart.y)
}

const onPanEnd = () => {
  isPanning = false
}

const onWheel = (event) => {
  event.preventDefault()
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value * delta))
  // Centrer le zoom autour du curseur
  const ratio = newZoom / zoom.value
  panX.value = mouseX - (mouseX - panX.value) * ratio
  panY.value = mouseY - (mouseY - panY.value) * ratio
  zoom.value = newZoom
}

const zoomIn = () => {
  zoom.value = Math.min(MAX_ZOOM, zoom.value * 1.2)
}
const zoomOut = () => {
  zoom.value = Math.max(MIN_ZOOM, zoom.value / 1.2)
}
const fitToView = () => {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return
  const padding = 60
  const scaleX = (rect.width - padding * 2) / world.value.width
  const scaleY = (rect.height - padding * 2) / world.value.height
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(scaleX, scaleY, 1)))
  zoom.value = newZoom
  panX.value = (rect.width - world.value.width * newZoom) / 2
  panY.value = padding
}

const resetZoom = () => {
  zoom.value = 1
  panX.value = 40
  panY.value = 40
}

// ── ResizeObserver pour mesurer la hauteur réelle de chaque node ─────────
const updateMeasurement = (el, contentHeight = null) => {
  if (!el) return
  const id = el.dataset.nodeId
  if (!id) return
  // contentRect.height = taille AVANT transform (non affectée par le scale du world)
  const h = contentHeight ?? el.offsetHeight
  if (!h || h < 20) return
  if (measuredHeights.value.get(id) !== h) {
    const next = new Map(measuredHeights.value)
    next.set(id, h)
    measuredHeights.value = next
  }
}

const resizeObserver = (typeof ResizeObserver !== 'undefined')
  ? new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateMeasurement(entry.target, entry.contentRect.height)
      }
    })
  : null

onMounted(() => {
  window.addEventListener('mousemove', onPanMove)
  window.addEventListener('mouseup', onPanEnd)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onPanMove)
  window.removeEventListener('mouseup', onPanEnd)
  resizeObserver?.disconnect()
})

// Observe le wrapper d'un node lorsqu'il est monté (et se nettoie au unmount)
const observedNodes = new WeakSet()
const nodeRef = (id) => (el) => {
  if (!resizeObserver) return
  if (!el) return // Vue passe null lors du démontage — l'observer se libère seul
  if (observedNodes.has(el)) return
  el.dataset.nodeId = id
  resizeObserver.observe(el)
  observedNodes.add(el)
  updateMeasurement(el)
}

// ── Recentrage si la logique change ──────────────────────────────────────
watch(() => props.logique.id, () => {
  nextTick(() => fitToView())
}, { immediate: false })

onMounted(() => {
  nextTick(() => fitToView())
})

// ── Handlers ─────────────────────────────────────────────────────────────
const onSelectNode = (q) => emit('select', q)
const onSetStart = (id) => emit('setStart', id)

// ── Données pour les nodes affichés ──────────────────────────────────────
const renderedNodes = computed(() => {
  const out = []
  for (const [id, pos] of world.value.positions) {
    const q = questionsById.value.get(id)
    if (!q) continue
    out.push({
      id,
      x: pos.x,
      y: pos.y,
      question: q,
      qNumber: numbering.value.get(id) || '',
      isStart: props.logique.start_question_id === id,
      isGeneric: !!q.is_generic,
      isSelected: props.selectedQuestionId === id,
    })
  }
  return out
})

</script>

<template>
  <div
    ref="containerRef"
    class="relative h-full w-full overflow-hidden bg-gray-50 dark:bg-gray-900"
    :class="isPanning ? 'cursor-grabbing' : 'cursor-grab'"
    @mousedown="onPanStart"
    @wheel.passive="onWheel">

    <!-- Grille de fond -->
    <div
      class="pointer-events-none absolute inset-0 opacity-60 dark:opacity-30"
      :style="{
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: `${panX}px ${panY}px`,
      }" />

    <!-- Couche transformée (world) -->
    <div
      class="absolute top-0 left-0 origin-top-left"
      :style="{
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        width: world.width + 'px',
        height: world.height + 'px',
      }">

      <!-- SVG des connecteurs -->
      <svg
        class="pointer-events-none absolute top-0 left-0"
        :width="world.width"
        :height="world.height"
        :viewBox="`0 0 ${world.width} ${world.height}`">
        <defs>
          <marker
            id="arrow-violet"
            viewBox="0 0 8 8"
            refX="5"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse">
            <path d="M 0 0 L 8 4 L 0 8 z" class="fill-violet-300" />
          </marker>
          <marker
            id="arrow-rose"
            viewBox="0 0 8 8"
            refX="5"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse">
            <path d="M 0 0 L 8 4 L 0 8 z" class="fill-rose-400" />
          </marker>
          <marker
            id="arrow-amber"
            viewBox="0 0 8 8"
            refX="5"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse">
            <path d="M 0 0 L 8 4 L 0 8 z" class="fill-amber-400" />
          </marker>
        </defs>

        <path
          v-for="e in edges"
          :key="e.id"
          :d="bezierPath(e)"
          :class="edgeStrokeClass(e)"
          fill="none"
          :stroke-width="isEdgeHighlighted(e) ? 2.5 : 2"
          :stroke-dasharray="e.dashed ? '6 4' : '0'"
          :marker-end="`url(#arrow-${e.color === 'amber' ? 'amber' : (isEdgeHighlighted(e) ? 'rose' : 'violet')})`" />

        <!-- Petit point au départ du connecteur (port) -->
        <circle
          v-for="e in edges"
          :key="`p-${e.id}`"
          :cx="e.x1"
          :cy="e.y1"
          r="4"
          :class="isEdgeHighlighted(e) ? 'fill-rose-400' : (e.color === 'amber' ? 'fill-amber-400' : 'fill-violet-400')" />
      </svg>

      <!-- Étiquettes au milieu des connecteurs -->
      <div
        v-for="e in edges"
        :key="`lbl-${e.id}`"
        class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
        :style="{ left: ((e.x1 + e.x2) / 2) + 'px', top: ((e.y1 + e.y2) / 2) + 'px' }">
        <span
          class="inline-block max-w-40 truncate rounded-full border bg-white px-2 py-0.5 text-[10px] font-medium shadow-sm dark:bg-gray-800"
          :class="isEdgeHighlighted(e)
            ? 'border-rose-200 text-rose-600 dark:border-rose-700/50 dark:text-rose-300'
            : e.color === 'amber'
              ? 'border-amber-200 text-amber-700 dark:border-amber-700/50 dark:text-amber-300'
              : 'border-violet-200 text-violet-700 dark:border-violet-700/50 dark:text-violet-300'"
          :title="e.label">
          {{ e.label }}
        </span>
      </div>

      <!-- Labels des sections -->
      <div
        v-for="s in world.sections"
        :key="s.key"
        class="pointer-events-none absolute"
        :style="{ left: s.x + 'px', top: s.y + 'px' }">
        <div class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-300">
          <Icon :name="s.icon" size="12" :class="s.iconColor" />
          {{ s.label }}
        </div>
      </div>

      <!-- Nodes -->
      <div
        v-for="n in renderedNodes"
        :key="n.id"
        :ref="nodeRef(n.id)"
        data-node
        class="absolute"
        :style="{ left: n.x + 'px', top: n.y + 'px' }">
        <AssistantsCanvasNode
          :question="n.question"
          :q-number="n.qNumber"
          :selected="n.isSelected"
          :is-start="n.isStart"
          :is-generic="n.isGeneric"
          :node-width="NODE_W"
          @select="onSelectNode"
          @set-start="onSetStart" />
      </div>
    </div>

    <!-- Toolbar bas-gauche : zoom & fit -->
    <div class="pointer-events-auto absolute bottom-4 left-4 z-30 flex items-center gap-1 rounded-xl border border-gray-200 bg-white/95 p-1 shadow-md backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95">
      <button
        type="button"
        class="rounded-lg p-1.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Zoom arrière"
        @click="zoomOut">
        <Icon name="lucide:minus" size="14" />
      </button>
      <button
        type="button"
        class="min-w-14 rounded-lg px-2 py-1 text-center text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        title="Réinitialiser le zoom"
        @click="resetZoom">
        {{ Math.round(zoom * 100) }}%
      </button>
      <button
        type="button"
        class="rounded-lg p-1.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Zoom avant"
        @click="zoomIn">
        <Icon name="lucide:plus" size="14" />
      </button>
      <div class="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700"></div>
      <button
        type="button"
        class="rounded-lg p-1.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Ajuster à la vue"
        @click="fitToView">
        <Icon name="lucide:maximize" size="14" />
      </button>
    </div>

  </div>
</template>
