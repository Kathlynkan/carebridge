<!-- LapisStripe — animated 4-band section divider.
     Layers enter staggered on mount; coloured bands lift on hover.
     Use as a section divider inside a page (not the main background). -->
<script setup>
const LAYERS = [
  { color: '#F8BBD0', label: 'Wellbeing', interactive: true },
  { color: '#A5D6A7', label: 'Learning',  interactive: true },
  { color: '#FFF59D', label: 'Growth',    interactive: true },
  { color: '#FFCCBC', label: 'Progress',  interactive: true },
]
</script>

<template>
  <div class="lapis-stripe-anim" aria-hidden="true" role="presentation">
    <div
      v-for="(layer, i) in LAYERS"
      :key="i"
      class="lapis-slot"
      :style="{ animationDelay: `${i * 60}ms` }"
    >
      <div
        class="lapis-layer lapis-layer--lift"
        :style="{ background: layer.color }"
        :title="layer.label"
      />
    </div>
  </div>
</template>

<style scoped>
.lapis-stripe-anim {
  height: 8px;
  flex-shrink: 0;
  display: flex;
  position: relative;
  z-index: 20;
  border-top: 2px solid #B9A99B;
  border-bottom: 2px solid #B9A99B;
}

.lapis-slot {
  flex: 1;
  animation: lapis-enter 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

.lapis-layer {
  height: 8px;
  transform-origin: top center;
  box-shadow: inset 0 1px 0 rgba(255, 248, 240, 0.5);
}

.lapis-layer--lift {
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: default;
}

.lapis-layer--lift:hover { transform: scaleY(4); }

@keyframes lapis-enter {
  from { opacity: 0; transform: scaleY(0); transform-origin: top center; }
  to   { opacity: 1; transform: scaleY(1); transform-origin: top center; }
}
</style>
