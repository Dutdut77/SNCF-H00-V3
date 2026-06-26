<script setup>
/**
 * Logique métier — flowchart en couches gauche→droite (dagre).
 * - Graphe : nœuds = questions (cartes) + réponses (puces) ; arêtes
 *   question→réponse puis réponse→question suivante.
 * - rankdir LR : le rang devient une colonne. Les réponses d'une question sont
 *   toutes dans la colonne suivante (même niveau / même x), empilées
 *   verticalement. Une question convergente reçoit un rang après toutes ses
 *   sources → dessinée une seule fois, plusieurs flèches entrantes (aucun renvoi).
 * - Connecteurs SVG orthogonaux, accroches réparties sur le bord des cartes.
 * - Canvas pan & zoom (fond pointillé, molette, glisser le fond).
 */
import { graphlib, layout as dagreLayout } from '@dagrejs/dagre'

const props = defineProps({
  logique:            { type: Object, required: true },
  selectedQuestionId: { type: String, default: null },
})

const emit = defineEmits([
  'select', 'setStart', 'duplicate', 'duplicateBranch',
  'createNextFromResponse', 'createNextFromQuestion',
])

const startId = computed(() => props.logique.start_question_id)
const byId = computed(() => {
  const m = new Map()
  for (const q of props.logique.questions || []) m.set(q.id, q)
  return m
})

// ─── Numérotation Q1, Q1.1… ──────────────────────────────────────────────
const numbering = computed(() => {
  const map = new Map()
  const questions = props.logique.questions || []
  const ids = byId.value
  const sId = startId.value
  const assign = (id, prefix, visited = new Set()) => {
    if (!id || map.has(id) || visited.has(id) || !ids.has(id)) return
    const v = new Set(visited); v.add(id)
    map.set(id, prefix)
    const q = ids.get(id)
    if (q.type === 'multiple') {
      if (q.next_question_id) assign(q.next_question_id, `${prefix}.1`, v)
    } else {
      (q.reponses || []).forEach((r, i) => {
        if (r.next_question_id) assign(r.next_question_id, `${prefix}.${i + 1}`, v)
      })
    }
  }
  if (sId) assign(sId, 'Q1')
  let nextRoot = sId ? 2 : 1
  for (const q of questions) {
    if (map.has(q.id)) continue
    assign(q.id, `Q${nextRoot}`); nextRoot++
  }
  return map
})

// ─── Graphe ──────────────────────────────────────────────────────────────
const graph = computed(() => {
  const nodes = []
  const edges = []
  const ids = byId.value
  for (const q of props.logique.questions || []) {
    nodes.push({ id: `q:${q.id}`, type: 'question', qid: q.id, question: q })
    for (const r of q.reponses || []) {
      nodes.push({ id: `a:${r.id}`, type: 'answer', rid: r.id, reponse: r, parentQid: q.id, parentType: q.type })
      edges.push({ id: `qa:${r.id}`, source: `q:${q.id}`, target: `a:${r.id}`, kind: 'qa' })
      const dest = q.type === 'multiple' ? q.next_question_id : r.next_question_id
      if (dest && ids.has(dest)) {
        edges.push({ id: `aq:${r.id}`, source: `a:${r.id}`, target: `q:${dest}`, kind: 'aq', answerId: r.id })
      }
    }
    if (q.type === 'multiple' && (q.reponses || []).length === 0 && q.next_question_id && ids.has(q.next_question_id)) {
      edges.push({ id: `qq:${q.id}`, source: `q:${q.id}`, target: `q:${q.next_question_id}`, kind: 'qq' })
    }
  }
  return { nodes, edges }
})

const answersWithChild = computed(() => {
  const s = new Set()
  for (const e of graph.value.edges) if (e.kind === 'aq') s.add(e.answerId)
  return s
})

// ─── Collapse (par réponse) ──────────────────────────────────────────────
const collapsed = ref(new Set())
const toggleCollapse = (rid) => {
  const s = new Set(collapsed.value)
  s.has(rid) ? s.delete(rid) : s.add(rid)
  collapsed.value = s
}

// ─── Visibilité : réachable depuis le départ + racines orphelines ────────
const visibleIds = computed(() => {
  const { nodes, edges } = graph.value
  const adj = new Map()
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, [])
    adj.get(e.source).push(e)
  }
  const targeted = new Set(edges.filter((e) => e.kind !== 'qa').map((e) => e.target))
  const startNode = startId.value && byId.value.has(startId.value) ? `q:${startId.value}` : null
  const seeds = []
  if (startNode) seeds.push(startNode)
  for (const n of nodes) {
    if (n.type === 'question' && n.id !== startNode && !targeted.has(n.id)) seeds.push(n.id)
  }
  if (seeds.length === 0) for (const n of nodes) if (n.type === 'question') seeds.push(n.id)

  const vis = new Set()
  const queue = [...seeds]
  while (queue.length) {
    const id = queue.shift()
    if (vis.has(id)) continue
    vis.add(id)
    for (const e of adj.get(id) || []) {
      if (e.kind === 'aq' && collapsed.value.has(e.answerId)) continue
      queue.push(e.target)
    }
  }
  return vis
})

const visibleNodes = computed(() => graph.value.nodes.filter((n) => visibleIds.value.has(n.id)))
const visibleEdges = computed(() => graph.value.edges.filter((e) =>
  visibleIds.value.has(e.source) && visibleIds.value.has(e.target) &&
  !(e.kind === 'aq' && collapsed.value.has(e.answerId)),
))

const hasQuestions = computed(() => (props.logique.questions || []).length > 0)

// ─── Tailles (mesurées, fallback estimé) ─────────────────────────────────
const measured = ref(new Map())
const estimate = (n) => {
  if (n.type === 'question') return { w: 240, h: n.question.description ? 86 : 62 }
  const len = (n.reponse.libelle || '').length
  const extra = (n.reponse.articles?.length ? 20 : 0)
    + (n.reponse.ensembles?.length ? 20 : 0)
    + (answersWithChild.value.has(n.rid) ? 20 : 0)
    + (n.parentType !== 'multiple' && !answersWithChild.value.has(n.rid) ? 20 : 0)
  return { w: Math.max(72, Math.min(260, 40 + len * 6.6 + extra)), h: 30 }
}
const sizeOf = (n) => measured.value.get(n.id) || estimate(n)

// ─── Accroches réparties sur le bord vertical (gauche/droite) ────────────
const EDGE_INSET = 10
const EDGE_MAXSEP = 22
const spreadY = (cy, h, count) => {
  if (count <= 1) return [cy]
  const usable = Math.max(0, h - 2 * EDGE_INSET)
  const sep = Math.min(usable / count, EDGE_MAXSEP)
  const start = cy - (sep * (count - 1)) / 2
  return Array.from({ length: count }, (_, i) => start + i * sep)
}

// ─── Connecteurs orthogonaux (horizontaux d'abord pour LR) ───────────────
const orthPath = (pts) => {
  if (!pts || pts.length < 2) return ''
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]
    if (Math.abs(a.x - b.x) < 0.5 || Math.abs(a.y - b.y) < 0.5) {
      d += ` L ${b.x},${b.y}`
    } else {
      const mx = (a.x + b.x) / 2
      d += ` L ${mx},${a.y} L ${mx},${b.y} L ${b.x},${b.y}`
    }
  }
  return d
}

// ─── Placement dagre (LR) ────────────────────────────────────────────────
const layout = computed(() => {
  const g = new graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 18, ranksep: 60, edgesep: 10, marginx: 40, marginy: 40 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const n of visibleNodes.value) {
    const s = sizeOf(n)
    g.setNode(n.id, { width: s.w, height: s.h })
  }
  // weight fort sur question→réponse : épingle les réponses au rang juste après
  // leur question. Sinon dagre déplace une réponse « qui saute un rang » vers sa
  // cible lointaine (autre colonne), et l'alignement à gauche la ramène ensuite
  // en collision avec ses voisines.
  for (const e of visibleEdges.value) {
    g.setEdge(e.source, e.target, { weight: e.kind === 'qa' ? 5 : 1 })
  }
  try { dagreLayout(g) } catch { /* graphe transitoirement incohérent */ }

  const positions = new Map()
  for (const id of g.nodes()) {
    const dn = g.node(id)
    if (!dn || dn.x == null) continue
    positions.set(id, { left: dn.x - dn.width / 2, top: dn.y - dn.height / 2, w: dn.width, h: dn.height, cy: dn.y })
  }

  // Aligne à gauche les puces réponses d'une même question (dagre les centre,
  // ce qui décale les bords gauches selon la largeur). On les met toutes au
  // bord gauche le plus à gauche (la plus large) → colonne bien alignée.
  const ansByParent = new Map()
  for (const n of visibleNodes.value) {
    if (n.type !== 'answer') continue
    const p = positions.get(n.id)
    if (!p) continue
    if (!ansByParent.has(n.parentQid)) ansByParent.set(n.parentQid, [])
    ansByParent.get(n.parentQid).push(p)
  }
  for (const list of ansByParent.values()) {
    const targetLeft = Math.min(...list.map((p) => p.left))
    for (const p of list) p.left = targetLeft
  }

  const meta = (id) => {
    const p = positions.get(id)
    return p ? { left: p.left, right: p.left + p.w, cy: p.cy, h: p.h } : null
  }

  const raw = visibleEdges.value.map((e) => ({ ...e, points: g.edge(e.source, e.target)?.points || [] }))
  const groupBy = (key) => {
    const m = new Map()
    for (const e of raw) {
      const k = e[key]
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(e)
    }
    return m
  }
  const exitY = new Map(); const entryY = new Map()
  for (const [src, list] of groupBy('source')) {
    const m = meta(src); if (!m) continue
    const sorted = [...list].sort((a, b) => (meta(a.target)?.cy ?? 0) - (meta(b.target)?.cy ?? 0))
    const ys = spreadY(m.cy, m.h, sorted.length)
    sorted.forEach((e, i) => exitY.set(e.id, ys[i]))
  }
  for (const [tgt, list] of groupBy('target')) {
    const m = meta(tgt); if (!m) continue
    const sorted = [...list].sort((a, b) => (meta(a.source)?.cy ?? 0) - (meta(b.source)?.cy ?? 0))
    const ys = spreadY(m.cy, m.h, sorted.length)
    sorted.forEach((e, i) => entryY.set(e.id, ys[i]))
  }
  const STUB = 12
  const edges = raw.map((e) => {
    const sm = meta(e.source); const tm = meta(e.target)
    if (!sm || !tm) return { ...e, d: '' }
    const ey = exitY.get(e.id) ?? sm.cy
    const ty = entryY.get(e.id) ?? tm.cy
    const mid = (e.points || []).slice(1, -1)
    // Talons horizontaux en sortie et en entrée : garantit que la flèche
    // arrive bien horizontalement dans la carte (sinon les arêtes longues
    // « qui sautent un rang » finissent sur un segment vertical → flèche KO).
    const pts = [
      { x: sm.right, y: ey },
      { x: sm.right + STUB, y: ey },
      ...mid,
      { x: tm.left - STUB, y: ty },
      { x: tm.left, y: ty },
    ]
    return { ...e, d: orthPath(pts) }
  })

  const gg = g.graph()
  return { positions, edges, width: gg.width || 0, height: gg.height || 0 }
})

const renderNodes = computed(() =>
  visibleNodes.value
    .map((n) => ({ ...n, pos: layout.value.positions.get(n.id) }))
    .filter((n) => n.pos),
)

const selAnswerIds = computed(() => {
  const sel = props.selectedQuestionId
  if (!sel) return new Set()
  const s = new Set()
  for (const r of byId.value.get(sel)?.reponses || []) s.add(r.id)
  return s
})
const isEdgeHot = (e) => {
  const sel = props.selectedQuestionId
  if (!sel) return false
  return e.source === `q:${sel}` || e.target === `q:${sel}` || (e.answerId && selAnswerIds.value.has(e.answerId))
}

// ─── Pan & zoom ──────────────────────────────────────────────────────────
const containerRef = ref(null)
const panX = ref(40)
const panY = ref(40)
const zoom = ref(1)
const MIN_ZOOM = 0.3
const MAX_ZOOM = 2

let isPanning = false
let panMoved = false
let panStart = { x: 0, y: 0, panX: 0, panY: 0 }

const onPanStart = (event) => {
  if (event.target.closest('[data-card]') || event.target.closest('button')) return
  if (event.button !== 0) return
  isPanning = true
  panMoved = false
  panStart = { x: event.clientX, y: event.clientY, panX: panX.value, panY: panY.value }
  event.preventDefault()
}
const onPanMove = (event) => {
  if (!isPanning) return
  if (!panMoved && Math.hypot(event.clientX - panStart.x, event.clientY - panStart.y) > 4) panMoved = true
  panX.value = panStart.panX + (event.clientX - panStart.x)
  panY.value = panStart.panY + (event.clientY - panStart.y)
}
const onPanEnd = () => {
  // Clic sur le fond (sans déplacement) → ferme le slideover / désélectionne
  if (isPanning && !panMoved) emit('select', null)
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
  const ratio = newZoom / zoom.value
  panX.value = mouseX - (mouseX - panX.value) * ratio
  panY.value = mouseY - (mouseY - panY.value) * ratio
  zoom.value = newZoom
}

const zoomIn = () => { zoom.value = Math.min(MAX_ZOOM, zoom.value * 1.2) }
const zoomOut = () => { zoom.value = Math.max(MIN_ZOOM, zoom.value / 1.2) }
const resetZoom = () => { zoom.value = 1; panX.value = 40; panY.value = 40 }

const fitToView = () => {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return
  const cw = layout.value.width
  const ch = layout.value.height
  if (!cw || !ch) return
  const padding = 36
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(
    (rect.width - padding * 2) / cw, (rect.height - padding * 2) / ch, 1,
  )))
  zoom.value = newZoom
  panX.value = Math.max(padding, (rect.width - cw * newZoom) / 2)
  panY.value = Math.max(padding, (rect.height - ch * newZoom) / 2)
}

// ─── Mesure des nœuds ────────────────────────────────────────────────────
const nodeEls = new Map()
const measure = (el) => {
  const id = el?.dataset.nid
  if (!id) return
  const w = el.offsetWidth, h = el.offsetHeight
  if (!w || !h) return
  const prev = measured.value.get(id)
  if (prev && Math.abs(prev.w - w) < 1.5 && Math.abs(prev.h - h) < 1.5) return
  const next = new Map(measured.value)
  next.set(id, { w, h })
  measured.value = next
}
const resizeObserver = (typeof ResizeObserver !== 'undefined')
  ? new ResizeObserver((entries) => entries.forEach((en) => measure(en.target)))
  : null
const nodeRef = (id) => (el) => {
  if (el) {
    el.dataset.nid = id
    nodeEls.set(id, el)
    resizeObserver?.observe(el)
    measure(el)
  } else {
    const prev = nodeEls.get(id)
    if (prev) { resizeObserver?.unobserve(prev); nodeEls.delete(id) }
  }
}

onMounted(() => {
  window.addEventListener('mousemove', onPanMove)
  window.addEventListener('mouseup', onPanEnd)
  nextTick(() => fitToView())
  setTimeout(() => fitToView(), 80)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onPanMove)
  window.removeEventListener('mouseup', onPanEnd)
  resizeObserver?.disconnect()
})
watch(() => props.logique.id, () => {
  collapsed.value = new Set()
  nextTick(() => fitToView())
})

// ─── Handlers ────────────────────────────────────────────────────────────
const selectQuestion = (qid) => emit('select', byId.value.get(qid))
const onSetStart = (qid) => emit('setStart', qid)
const onDuplicate = (qid) => emit('duplicate', byId.value.get(qid))
const onDuplicateBranch = (qid) => emit('duplicateBranch', byId.value.get(qid))
const onAddNext = (n) => {
  if (n.parentType === 'multiple') emit('createNextFromQuestion', n.parentQid)
  else emit('createNextFromResponse', n.reponse)
}
</script>

<template>
  <div
    ref="containerRef"
    class="relative h-full w-full select-none overflow-hidden bg-slate-50 dark:bg-slate-900"
    :class="isPanning ? 'cursor-grabbing' : 'cursor-grab'"
    @mousedown="onPanStart"
    @wheel="onWheel">

    <!-- Grille pointillée -->
    <div
      class="pointer-events-none absolute inset-0 opacity-60 dark:opacity-30"
      :style="{
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${panX}px ${panY}px`,
      }" />

    <!-- Avertissement : pas de question de départ -->
    <div
      v-if="hasQuestions && !logique.start_question_id"
      class="absolute top-3 left-1/2 z-30 flex max-w-md -translate-x-1/2 items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs shadow-sm backdrop-blur-sm dark:border-amber-700/40 dark:bg-amber-900/40">
      <Icon name="lucide:alert-circle" size="15" class="mt-0.5 flex-none text-amber-600" />
      <p class="text-amber-700 dark:text-amber-300">Aucune question de départ : survole une carte et clique sur le drapeau pour définir le point d'entrée.</p>
    </div>

    <!-- Couche transformée -->
    <div
      class="absolute top-0 left-0 origin-top-left"
      :style="{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }">

      <!-- Connecteurs -->
      <svg
        class="pointer-events-none absolute top-0 left-0"
        :width="layout.width"
        :height="layout.height"
        :viewBox="`0 0 ${layout.width} ${layout.height}`">
        <defs>
          <marker id="flow-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 8 4 L 0 8 z" class="fill-slate-300 dark:fill-slate-600" />
          </marker>
          <marker id="flow-arrow-hot" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 8 4 L 0 8 z" class="fill-secondary-400" />
          </marker>
        </defs>
        <path
          v-for="e in layout.edges"
          :key="e.id"
          :d="e.d"
          fill="none"
          :class="isEdgeHot(e) ? 'stroke-secondary-400' : 'stroke-slate-300 dark:stroke-slate-600'"
          :stroke-width="isEdgeHot(e) ? 2.5 : 1.75"
          :marker-end="`url(#${isEdgeHot(e) ? 'flow-arrow-hot' : 'flow-arrow'})`" />
      </svg>

      <!-- Nœuds -->
      <div
        v-for="n in renderNodes"
        :key="n.id"
        :ref="nodeRef(n.id)"
        class="absolute"
        :style="{ left: `${n.pos.left}px`, top: `${n.pos.top}px` }">
        <AssistantsFlowQuestionCard
          v-if="n.type === 'question'"
          :question="n.question"
          :number="numbering.get(n.qid) || ''"
          :is-start="startId === n.qid"
          :selected="selectedQuestionId === n.qid"
          @select="selectQuestion(n.qid)"
          @set-start="onSetStart(n.qid)"
          @duplicate="onDuplicate(n.qid)"
          @duplicate-branch="onDuplicateBranch(n.qid)" />
        <AssistantsFlowAnswerPill
          v-else
          :reponse="n.reponse"
          :has-child="answersWithChild.has(n.rid)"
          :collapsed="collapsed.has(n.rid)"
          :can-add-next="n.parentType !== 'multiple' && !answersWithChild.has(n.rid)"
          @select="selectQuestion(n.parentQid)"
          @toggle="toggleCollapse(n.rid)"
          @add-next="onAddNext(n)" />
      </div>
    </div>

    <!-- Toolbar zoom -->
    <div class="pointer-events-auto absolute bottom-4 left-4 z-30 flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-md backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/95">
      <button type="button" class="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700" title="Zoom arrière" @click="zoomOut">
        <Icon name="lucide:minus" size="14" />
      </button>
      <button type="button" class="min-w-14 rounded-lg px-2 py-1 text-center text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700" title="Réinitialiser le zoom" @click="resetZoom">
        {{ Math.round(zoom * 100) }}%
      </button>
      <button type="button" class="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700" title="Zoom avant" @click="zoomIn">
        <Icon name="lucide:plus" size="14" />
      </button>
      <div class="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />
      <button type="button" class="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700" title="Ajuster à la vue" @click="fitToView">
        <Icon name="lucide:maximize" size="14" />
      </button>
    </div>
  </div>
</template>
