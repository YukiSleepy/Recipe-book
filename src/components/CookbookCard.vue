<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import CookbookCover from './CookbookCover.vue'

const props = defineProps({
  book: { type: Object, required: true },
  folderName: { type: String, default: '' },
  confirming: Boolean,
  dragging: Boolean,
})
const emit = defineEmits(['ask-delete', 'cancel-delete', 'confirm-delete', 'toggle-favorite', 'drag-start', 'drag-end'])

/* Drag the cookbook onto a folder */
function onDragStart(event) {
  event.dataTransfer.setData('text/plain', props.book.id)
  event.dataTransfer.effectAllowed = 'move'
  emit('drag-start')
}

/* "..." menu */
const open = ref(false)
const wrap = ref(null)
const menuButton = ref(null)
const menu = ref(null)

function items() {
  return menu.value ? [...menu.value.querySelectorAll('[role="menuitem"]')] : []
}

function toggleMenu() {
  open.value = !open.value
  if (open.value) nextTick(() => items()[0]?.focus())
}

function closeMenu(returnFocus = false) {
  open.value = false
  if (returnFocus) menuButton.value?.focus()
}

function onMenuKey(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeMenu(true)
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const list = items()
    const i = list.indexOf(document.activeElement)
    const next = event.key === 'ArrowDown' ? (i + 1) % list.length : (i - 1 + list.length) % list.length
    list[next]?.focus()
  } else if (event.key === 'Tab') {
    closeMenu()
  }
}

function chooseDelete() {
  open.value = false
  emit('ask-delete')
}

function onDocumentPointer(event) {
  if (open.value && wrap.value && !wrap.value.contains(event.target)) open.value = false
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointer))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointer))
</script>

<template>
  <article
    class="card"
    :class="{ dragging }"
    :draggable="!confirming"
    @dragstart="onDragStart"
    @dragend="$emit('drag-end')"
  >
    <RouterLink
      :to="{ name: 'cookbook', params: { id: book.id } }"
      class="cover-link"
      draggable="false"
      :aria-label="`Open ${book.name}`"
    >
      <CookbookCover :book="book" />
    </RouterLink>

    <div ref="wrap" class="menu-wrap">
      <button
        ref="menuButton"
        type="button"
        class="round"
        aria-haspopup="menu"
        :aria-expanded="open"
        :aria-label="`More options: ${book.name}`"
        @click="toggleMenu"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="5" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="19" cy="12" r="2" fill="currentColor" />
        </svg>
      </button>

      <ul v-if="open" ref="menu" class="menu" role="menu" @keydown="onMenuKey">
        <li role="none">
          <RouterLink :to="`/edit/${book.id}`" class="item" role="menuitem">Edit</RouterLink>
        </li>
        <li role="none">
          <button type="button" class="item danger" role="menuitem" @click="chooseDelete">Delete</button>
        </li>
      </ul>
    </div>

    <button
      type="button"
      class="round star"
      :aria-pressed="book.favorite"
      :aria-label="`Favourite: ${book.name}`"
      @click="$emit('toggle-favorite')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 3.5z"
          :fill="book.favorite ? '#f5cb5c' : 'none'"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <p v-if="folderName" class="hint">In folder: {{ folderName }}</p>

    <div v-if="confirming" class="confirm" role="group" :aria-label="`Delete ${book.name}`">
      <p>Delete “{{ book.name }}”? This can’t be undone.</p>
      <div class="row">
        <button type="button" class="button button-danger button-small" @click="$emit('confirm-delete')">Yes, delete</button>
        <button type="button" class="button button-quiet button-small" @click="$emit('cancel-delete')">Keep it</button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card { position: relative; display: flex; flex-direction: column; gap: 0.75rem; cursor: grab; }
.card.dragging { opacity: 0.45; }
.card > .hint { margin-top: -0.25rem; }

.cover-link { display: block; color: inherit; text-decoration: none; border-radius: var(--radius-sm); }
.cover-link:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }

.confirm { display: flex; flex-direction: column; gap: 0.75rem; }
.row { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.round {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #fff;
  color: var(--ink);
  box-shadow: inset 0 0 0 2px var(--ink);
  cursor: pointer;
}
.round svg { width: 1.4rem; height: 1.4rem; }
.round:hover { background: var(--butter); }

.star { position: absolute; top: 0.75rem; right: 0.75rem; }

.menu-wrap { position: absolute; top: 0.75rem; left: 0.75rem; z-index: 2; }
.menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  min-width: 9rem;
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  border-radius: var(--radius-sm);
  background: #fff;
  box-shadow: inset 0 0 0 2px var(--ink), 4px 4px 0 var(--ink);
}
.item {
  display: block;
  width: 100%;
  padding: 0.6rem 0.9rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-weight: 600;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.item:hover, .item:focus-visible { background: var(--tile); }
.item.danger { color: var(--tomato-dark); }
</style>