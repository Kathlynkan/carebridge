<!--
  PeelableCard — a cb-card whose top kueh layer can be peeled off.

  Usage:
    <PeelableCard>
      <p>your content here</p>
    </PeelableCard>

  Behaviour:
    • A coloured strip sits at the top of every card (the "top layer" of the kueh).
    • The user can click/tap and drag it downward.
    • It rotates around its top edge using rotateX + perspective — like paper peeling.
    • Drag > 40 % of the strip height → commits: strip animates off, revealing the next layer.
    • Drag < 40 % → snaps back with a spring.
    • Respects prefers-reduced-motion: skips to a colour-change cross-fade instead.
-->
<script setup>
import { ref, computed, onUnmounted } from 'vue'

// The 4-colour sequence for the peelable strip.
// After each peel the next colour shows, cycling round.
const STRIP_COLOURS = [
  { front: '#FF3D7F', under: '#cc0055' }, // pink  → dark pink underside
  { front: '#A8E063', under: '#6aa830' }, // lime  → dark lime
  { front: '#FFD93D', under: '#ccaa00' }, // yellow → dark yellow
  { front: '#FF8C42', under: '#cc6010' }, // orange → dark orange
]

const STRIP_H   = 14   // px — height of the draggable strip
const THRESHOLD = 0.4  // fraction of STRIP_H at which the peel commits

const colourIdx = ref(0)
const progress  = ref(0)   // 0 = flat, 1 = fully peeled
const dragging  = ref(false)
const peeling   = ref(false) // true while animating to committed
const peeled    = ref(false) // true = strip gone (next layer locked in)

let startY = 0

// ---------- computed styles ----------

const stripColour = computed(() => STRIP_COLOURS[colourIdx.value])
const nextColour  = computed(() => STRIP_COLOURS[(colourIdx.value + 1) % STRIP_COLOURS.length])

const stripStyle = computed(() => {
  const deg = progress.value * -125   // rotate toward the viewer (negative = top lifts toward you)
  return {
    '--strip-bg': stripColour.value.front,
    transform: `perspective(500px) rotateX(${deg}deg)`,
    transformOrigin: 'top center',
    transition: dragging.value
      ? 'none'
      : peeling.value
        ? 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease'
        : 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
    opacity: peeling.value ? 1 - progress.value * 0.4 : 1,
    cursor: 'grab',
    userSelect: 'none',
    // Lift shadow grows as the strip peels
    filter: progress.value > 0.05
      ? `drop-shadow(0 ${Math.round(progress.value * 12)}px ${Math.round(progress.value * 8)}px rgba(42,6,24,0.4))`
      : 'none',
  }
})

// The "revealed underside" — the darker layer peeking out from under the strip
const underlayStyle = computed(() => ({
  background: stripColour.value.under,
  opacity: Math.min(1, progress.value * 2),
}))

// ---------- pointer handlers ----------

function onPointerDown(e) {
  if (peeled.value || peeling.value) return
  e.preventDefault()
  dragging.value = true
  startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
  window.addEventListener('pointermove', onPointerMove, { passive: false })
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e) {
  if (!dragging.value) return
  const dy = (e.clientY ?? e.touches?.[0]?.clientY ?? startY) - startY
  progress.value = Math.max(0, Math.min(1, dy / (STRIP_H * 2.5)))
}

function onPointerUp() {
  dragging.value = false
  cleanup()

  if (progress.value >= THRESHOLD) {
    // Commit: animate strip flying off
    peeling.value = true
    progress.value = 1
    setTimeout(() => {
      peeling.value = false
      peeled.value  = true
      colourIdx.value = (colourIdx.value + 1) % STRIP_COLOURS.length
      // Re-appear with the next strip after a brief gap
      setTimeout(() => {
        progress.value = 0
        peeled.value   = false
      }, 120)
    }, 380)
  } else {
    // Snap back
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
    <!--
      The peelable top strip.
      Hidden during the brief gap between commit and re-appear (peeled = true).
    -->
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
      <!-- Front: the coloured band -->
      <div class="peel-face peel-front" :style="{ background: stripColour.front }" />
      <!-- Back: darker underside that shows as the strip curls -->
      <div class="peel-face peel-back" :style="{ background: stripColour.under }" />
    </div>

    <!-- The colour revealed beneath the strip as it lifts -->
    <div class="peel-underlay" :style="underlayStyle" />

    <!-- Card content — given left padding to clear the edge strip -->
    <div class="peel-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* ── wrapper ──────────────────────────────────────────────── */
.peel-root {
  /* pb-0 on the base cb-card — padding already on .peel-body */
  padding: 0 !important;
  overflow: visible; /* let the strip shadow spill */
}

/* ── strip ────────────────────────────────────────────────── */
.peel-strip {
  position: relative;
  height: v-bind('STRIP_H + "px"');
  border-radius: calc(var(--cb-radius) - 3px) calc(var(--cb-radius) - 3px) 0 0;
  overflow: hidden;
  /* The strip sits above the ::before left-edge via stacking context */
  z-index: 2;
}

.peel-face {
  position: absolute;
  inset: 0;
}

/* The back face is flipped — only visible when the strip has rotated past 90° */
.peel-back {
  transform: rotateX(180deg);
  backface-visibility: visible;
}

/* ── underlay ─────────────────────────────────────────────── */
.peel-underlay {
  position: absolute;
  top: 0;
  left: 10px; /* clear the left-edge cross-section */
  right: 0;
  height: v-bind('STRIP_H + "px"');
  border-radius: 0 calc(var(--cb-radius) - 3px) 0 0;
  pointer-events: none;
  z-index: 1;
}

/* ── content ──────────────────────────────────────────────── */
.peel-body {
  padding: 1rem 1rem 1rem 1.5rem; /* left: 10px edge + 16px gutter */
  position: relative;
  z-index: 2;
}

/* ── reduced motion: skip the 3-D rotation ────────────────── */
@media (prefers-reduced-motion: reduce) {
  .peel-strip {
    transition: opacity 0.15s ease !important;
    transform: none !important;
  }
}
</style>
