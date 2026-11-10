<script setup>
import { computed } from 'vue'
import { readableText } from '../utils/color'

const props = defineProps({
  book: { type: Object, required: true },
})

const textColor = computed(() => readableText(props.book.color))
const recipes = computed(() => {
  const n = props.book.recipeCount ?? 0
  return n === 1 ? '1 recipe' : `${n} recipes`
})
</script>

<template>
  <div class="cover" :style="{ background: book.color, color: textColor }">
    <!-- the picture fills the space above the text; the buttons sit on top of it -->
    <img v-if="book.image" :src="book.image" alt="" class="cover-image" />
    <div class="cover-body">
      <strong class="cover-title">{{ book.name || 'Cookbook name' }}</strong>
      <p v-if="book.description" class="cover-description">{{ book.description }}</p>
      <span class="count">{{ recipes }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Every cover has the same size, and the text always sits at the bottom */
.cover {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 18rem;
  border-radius: var(--radius);
  overflow: hidden;
}
.cover-image {
  display: block;
  flex: 1 1 0;
  min-height: 5rem;
  width: 100%;
  object-fit: cover;
}
.cover-body {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem 1.5rem 1.5rem;
}
.cover-title {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cover-description {
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.count { font-weight: 600; }
</style>
