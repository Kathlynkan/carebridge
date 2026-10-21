<!--
  PeelableCard — a cb-card whose left strip peels away to the right.

  Usage:
    <PeelableCard>
      <p>your content here</p>
    </PeelableCard>

  Behaviour:
    • A coloured strip sits on the left edge of every card.
    • The user can click/tap and drag it rightward.
    • It rotates around its left edge using rotateY + perspective — like a page turning.
    • Drag > 40 % of the strip width → commits: strip animates off, revealing the next colour.
    • Drag < 40 % → snaps back with a spring.
    • Respects prefers-reduced-motion: skips to a colour-change cross-fade instead.
-->
<script setup>
import { ref, computed, onUnmounted } from 'vue'

const STRIP_COLOURS = [
  { front: '#D989A5', under: '#B06080' },
  { front: '#AACCA2', under: '#70A068' },
  { front: '#F6E3E9', under: '#D4A8B8' },
  { front: '#8EC3D7', under: '#5090A8' },
]

const STRIP_W   = 14   // px — width of the draggable strip
const THRESHOLD = 0.4  // fraction at which the peel commits

const colourIdx = ref(0)
const progress  = ref(0)   // 0 = flat, 1 = fully peeled
const dragging  = ref(false)
const peeling   = ref(false)
const peeled    = ref(false)

let startX = 0

const stripColour = computed(() => STRIP_COLOURS[colourIdx.value])

const stripStyle = computed(() => {
  const deg = progress.value * 125   // rotateY: positive = right edge peels toward viewer
  return {
    transform: `perspective(500px) rotateY(${deg}deg)`,
    transformOrigin: 'left center',
    transition: dragging.value
      ? 'none'
      : peeling.value
        ? 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease'
        : 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
    opacity: peeling.value ? 1 - progress.value * 0.4 : 1,
    cursor: 'grab',
    userSelect: 'none',
    filter: progress.value > 0.05
      ? `drop-shadow(${Math.round(progress.value * 10)}px 0 ${Math.round(progress.value * 8)}px rgba(58,10,42,0.25))`
      : 'none',
  }
})

const underlayStyle = computed(() => ({
  background: stripColour.value.under,
  opacity: Math.min(1, progress.value * 2),
}))

function onPointerDown(e) {
  if (peeled.value || peeling.value) return
  e.preventDefault()
  dragging.value = true
  startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
  window.addEventListener('pointermove', onPointerMove, { passive: false })
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e) {
  if (!dragging.value) return
  const dx = (e.clientX ?? e.touches?.[0]?.clientX ?? startX) - startX
  progress.value = Math.max(0, Math.min(1, dx / (STRIP_W * 2.5)))
}

function onPointerUp() {
  dragging.value = false
  cleanup()

  if (progress.value >= THRESHOLD) {
    peeling.value = true
    progress.value = 1
    setTimeout(() => {
      peeling.value = false
      peeled.value  = true
      colourIdx.value = (colourIdx.value + 1) % STRIP_COLOURS.length
      setTimeout(() => {
        progress.value = 0
        peeled.value   = false
      }, 120)
    }, 380)
  } else {
    progress.value = 0
  }
}

function cleanup() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

onUnmounted(cleanup)
</script>

<template>
  <div class="peel-root cb-card">
    <div
      v-show="!peeled"
      class="peel-strip"
      :style="stripStyle"
      aria-label="Drag to peel layer"
      role="button"
      tabindex="0"
      @pointerdown="onPointerDown"
      @keydown.enter="() => { progress = THRESHOLD; onPointerUp() }"
    >
      <div class="peel-face peel-front" :style="{ background: stripColour.front }" />
      <div class="peel-face peel-back"  :style="{ background: stripColour.under }" />
    </div>

    <div class="peel-underlay" :style="underlayStyle" />

    <div class="peel-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.peel-root {
  padding: 0 !important;
  overflow: visible;
  display: flex;
}

/* ── strip ────────────────────────────────────────────────── */
.peel-strip {
  position: relative;
  width: v-bind('STRIP_W + "px"');
  flex-shrink: 0;
  border-radius: calc(var(--cb-radius) - 3px) 0 0 calc(var(--cb-radius) - 3px);
  overflow: hidden;
  z-index: 2;
  align-self: stretch;
}

.peel-face {
  position: absolute;
  inset: 0;
}

.peel-back {
  transform: rotateY(180deg);
  backface-visibility: visible;
}

/* ── underlay ─────────────────────────────────────────────── */
.peel-underlay {
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: v-bind('STRIP_W + "px"');
  border-radius: calc(var(--cb-radius) - 3px) 0 0 calc(var(--cb-radius) - 3px);
  pointer-events: none;
  z-index: 1;
}

/* ── content ──────────────────────────────────────────────── */
.peel-body {
  flex: 1;
  padding: 1rem 1rem 1rem 1.25rem;
  position: relative;
  z-index: 2;
  min-width: 0;
}

/* ── reduced motion ───────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .peel-strip {
    transition: opacity 0.15s ease !important;
    transform: none !important;
  }
}
</style>
