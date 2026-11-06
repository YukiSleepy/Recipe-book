<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import CookbookCard from '../components/CookbookCard.vue'
import {
  cookbooks,
  folders,
  addFolder,
  renameFolder,
  deleteFolder,
  deleteCookbook,
  moveToFolder,
  toggleFavorite,
  compareNames,
} from '../stores/cookbooks'

const route = useRoute()
const router = useRouter()

// No folder id in the address = the main list
const folderId = computed(() => route.params.folderId || null)
const folder = computed(() => folders.find((f) => f.id === folderId.value) || null)

const query = ref('')
const searching = computed(() => query.value.trim().length > 0)

function matches(text) {
  return String(text ?? '').toLowerCase().includes(query.value.trim().toLowerCase())
}

// Inside a folder: that folder. Main list: loose cookbooks, or everything while searching.
const scopeBooks = computed(() => {
  if (folderId.value) return cookbooks.filter((b) => b.folderId === folderId.value)
  if (searching.value) return cookbooks
  return cookbooks.filter((b) => !b.folderId)
})

// Always alphabetical
const books = computed(() => {
  const list = searching.value ? scopeBooks.value.filter((b) => matches(b.name) || matches(b.description)) : scopeBooks.value
  return [...list].sort(compareNames)
})

const shownFolders = computed(() => {
  if (folderId.value) return []
  const list = searching.value ? folders.filter((f) => matches(f.name)) : folders
  return [...list].sort(compareNames)
})

const looseTitle = computed(() =>
  !folderId.value && !searching.value && folders.length ? 'Cookbooks not in a folder' : '',
)

// Favourites are shown first, in their own group
const groups = computed(() => {
  const favs = books.value.filter((b) => b.favorite)
  const rest = books.value.filter((b) => !b.favorite)
  if (favs.length && rest.length) {
    return [
      { key: 'favs', title: 'Favourites', books: favs },
      { key: 'rest', title: looseTitle.value || 'Other cookbooks', books: rest },
    ]
  }
  if (!books.value.length) return []
  return [{ key: 'all', title: looseTitle.value, books: books.value }]
})

const resultText = computed(() => {
  const n = books.value.length + shownFolders.value.length
  return `${n} ${n === 1 ? 'result' : 'results'} for “${query.value.trim()}”`
})

const confirmingBook = ref(null)
const confirmingFolder = ref(false)
const showFolderForm = ref(false)
const folderName = ref('')
const renaming = ref(false)
const renameText = ref('')
const status = ref('')
let statusTimer

watch(folderId, () => {
  query.value = ''
  confirmingBook.value = null
  confirmingFolder.value = false
  renaming.value = false
  showFolderForm.value = false
  status.value = ''
})

onBeforeUnmount(() => clearTimeout(statusTimer))

function say(message) {
  status.value = message
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => (status.value = ''), 5000)
}

function countIn(id) {
  const n = cookbooks.filter((b) => b.folderId === id).length
  return n === 1 ? '1 cookbook' : `${n} cookbooks`
}

function folderNameOf(book) {
  return book.folderId ? folders.find((f) => f.id === book.folderId)?.name ?? '' : ''
}

function createFolder() {
  const name = folderName.value.trim()
  if (!name) return
  addFolder(name)
  folderName.value = ''
  showFolderForm.value = false
}

function startRename() {
  renameText.value = folder.value.name
  renaming.value = true
  confirmingFolder.value = false
}

function saveRename() {
  const name = renameText.value.trim()
  if (!name) return
  renameFolder(folder.value.id, name)
  renaming.value = false
}

function removeFolder() {
  deleteFolder(folder.value.id)
  confirmingFolder.value = false
  router.push('/cookbooks')
}

function removeBook(id) {
  deleteCookbook(id)
  confirmingBook.value = null
}

/* Drag a cookbook onto a folder (or onto the strip inside a folder to take it out) */
const draggingId = ref(null)
const overTarget = ref(null) // a folder id, 'out', or null
let dragToken = 0

function onDragStart(id) {
  const token = ++dragToken
  // wait one tick so the browser can take its drag picture first
  setTimeout(() => {
    if (token === dragToken) draggingId.value = id
  }, 0)
}

function onDragEnd() {
  dragToken++
  draggingId.value = null
  overTarget.value = null
}

function onDragLeave(event, target) {
  if (!event.currentTarget.contains(event.relatedTarget) && overTarget.value === target) {
    overTarget.value = null
  }
}

function onDrop(targetFolderId) {
  const book = cookbooks.find((b) => b.id === draggingId.value)
  draggingId.value = null
  overTarget.value = null
  if (!book || (book.folderId ?? null) === targetFolderId) return
  moveToFolder(book.id, targetFolderId)
  const where = targetFolderId ? `the folder “${folders.find((f) => f.id === targetFolderId)?.name}”` : 'My cookbooks'
  say(`Moved “${book.name}” to ${where}.`)
}
</script>

<template>
  <main class="page">
    <template v-if="folderId && !folder">
      <RouterLink to="/cookbooks" class="back-link">Back to my cookbooks</RouterLink>
      <h1>Folder not found</h1>
      <p class="hint">This folder doesn’t exist anymore.</p>
    </template>

    <template v-else>
      <RouterLink v-if="folder" to="/cookbooks" class="back-link">Back to my cookbooks</RouterLink>
      <RouterLink v-else to="/" class="back-link">Back to menu</RouterLink>

      <h1 v-if="!renaming">{{ folder ? folder.name : 'My cookbooks' }}</h1>
      <form v-else class="inline-form" @submit.prevent="saveRename">
        <label class="sr-only" for="rename-folder">Folder name</label>
        <input id="rename-folder" v-model="renameText" type="text" maxlength="40" required />
        <button type="submit" class="button button-small">Save name</button>
        <button type="button" class="button button-quiet button-small" @click="renaming = false">Cancel</button>
      </form>

      <div v-if="cookbooks.length || folders.length" class="search">
        <label class="sr-only" for="search">{{ folder ? 'Search this folder' : 'Search cookbooks and folders' }}</label>
        <input
          id="search"
          v-model="query"
          type="search"
          autocomplete="off"
          :placeholder="folder ? 'Search this folder' : 'Search cookbooks and folders'"
        />
        <button v-if="searching" type="button" class="button button-quiet button-small" @click="query = ''">Clear</button>
      </div>

      <div class="toolbar">
        <RouterLink to="/create" class="button button-small">New cookbook</RouterLink>
        <button v-if="!folder" type="button" class="button button-quiet button-small" @click="showFolderForm = !showFolderForm">
          New folder
        </button>
        <template v-if="folder && !renaming">
          <button type="button" class="button button-quiet button-small" @click="startRename">Rename folder</button>
          <button type="button" class="button button-quiet button-small" @click="confirmingFolder = true">Delete folder</button>
        </template>
      </div>

      <form v-if="showFolderForm && !folder" class="inline-form panel" @submit.prevent="createFolder">
        <label class="sr-only" for="new-folder">Folder name</label>
        <input id="new-folder" v-model="folderName" type="text" maxlength="40" required placeholder="Thai and Asian food" />
        <button type="submit" class="button button-small">Create folder</button>
        <button type="button" class="button button-quiet button-small" @click="showFolderForm = false">Cancel</button>
      </form>

      <div v-if="confirmingFolder && folder" class="panel" role="group" aria-label="Delete folder">
        <p>Delete the folder “{{ folder.name }}”? Its cookbooks are not deleted. They move back to My cookbooks.</p>
        <div class="row">
          <button type="button" class="button button-danger button-small" @click="removeFolder">Yes, delete folder</button>
          <button type="button" class="button button-quiet button-small" @click="confirmingFolder = false">Keep folder</button>
        </div>
      </div>

      <p class="status" role="status">{{ status }}</p>
      <p v-if="searching" class="hint result-count" role="status">{{ resultText }}</p>

      <div
        v-if="folder && books.length"
        class="dropzone"
        :class="{ 'can-drop': draggingId, 'drop-over': overTarget === 'out' }"
        @dragenter.prevent="overTarget = 'out'"
        @dragover.prevent
        @dragleave="onDragLeave($event, 'out')"
        @drop.prevent="onDrop(null)"
      >
        Drag a cookbook here to move it out of this folder.
      </div>

      <section v-if="shownFolders.length" aria-labelledby="folders-heading">
        <h2 id="folders-heading" class="section-title">Folders</h2>
        <p v-if="cookbooks.length" class="hint drag-hint">Drag a cookbook onto a folder to move it there.</p>
        <ul class="folder-grid">
          <li v-for="f in shownFolders" :key="f.id">
            <RouterLink
              :to="`/cookbooks/${f.id}`"
              class="folder"
              :class="{ 'can-drop': draggingId, 'drop-over': overTarget === f.id }"
              @dragenter.prevent="overTarget = f.id"
              @dragover.prevent
              @dragleave="onDragLeave($event, f.id)"
              @drop.prevent="onDrop(f.id)"
            >
              <span class="folder-name">{{ f.name }}</span>
              <span class="hint">{{ countIn(f.id) }}</span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <div v-if="searching && !books.length && !shownFolders.length" class="empty">
        <h2>No matches</h2>
        <p>Try a different word, or clear the search to see everything.</p>
        <button type="button" class="button" @click="query = ''">Clear search</button>
      </div>

      <div v-else-if="!searching && books.length === 0 && (folder || cookbooks.length === 0)" class="empty">
        <template v-if="folder">
          <h2>This folder is empty</h2>
          <p>Choose this folder when you create a cookbook, drag a cookbook onto it from My cookbooks, or use Edit to move one here.</p>
        </template>
        <template v-else>
          <h2>You have no cookbooks yet</h2>
          <p>Create your first cookbook and start adding recipes.</p>
        </template>
        <RouterLink to="/create" class="button">Create new cookbook</RouterLink>
      </div>

      <section
        v-for="group in groups"
        :key="group.key"
        :aria-labelledby="group.title ? `heading-${group.key}` : undefined"
      >
        <h2 v-if="group.title" :id="`heading-${group.key}`" class="section-title">{{ group.title }}</h2>
        <ul class="shelf">
          <li v-for="book in group.books" :key="book.id">
            <CookbookCard
              :book="book"
              :folder-name="folderNameOf(book)"
              :confirming="confirmingBook === book.id"
              :dragging="draggingId === book.id"
              @ask-delete="confirmingBook = book.id"
              @cancel-delete="confirmingBook = null"
              @confirm-delete="removeBook(book.id)"
              @toggle-favorite="toggleFavorite(book.id)"
              @drag-start="onDragStart(book.id)"
              @drag-end="onDragEnd"
            />
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>

<style scoped>
.search { margin-top: 2rem; display: flex; align-items: center; gap: 0.5rem; max-width: 30rem; }
.search input {
  flex: 1;
  min-width: 0;
  font: inherit;
  padding: 0.7rem 1rem;
  border: 2px solid var(--ink);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--ink);
}

.toolbar { margin-top: 1.25rem; display: flex; flex-wrap: wrap; gap: 0.5rem; }

.inline-form { margin-top: 1rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.inline-form input {
  font: inherit;
  padding: 0.6rem 0.9rem;
  border: 2px solid var(--ink);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--ink);
}

.panel {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border-radius: var(--radius-sm);
  background: #fff;
  box-shadow: inset 0 0 0 2px var(--ink);
}
.panel.inline-form { flex-direction: row; }
.row { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.status { margin-top: 1rem; font-weight: 600; min-height: 1.5rem; }
.result-count { margin-top: 0.25rem; }

.section-title { margin-top: 3rem; }
.drag-hint { margin-top: 0.5rem; }

.dropzone {
  margin-top: 1.25rem;
  padding: 1rem 1.25rem;
  border: 3px dashed var(--ink-soft);
  border-radius: var(--radius-sm);
  color: var(--ink-soft);
  font-weight: 600;
}
.dropzone.can-drop { border-color: var(--ink); color: var(--ink); }
.dropzone.drop-over { background: var(--butter); }

.folder-grid {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  gap: 1.5rem;
}
.folder {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.25rem;
  border: 3px solid var(--ink);
  border-radius: 0 var(--radius-sm) var(--radius-sm) var(--radius-sm);
  background: #fff;
  text-decoration: none;
}
.folder::before {
  content: '';
  position: absolute;
  left: -3px;
  top: -1.1rem;
  width: 5.5rem;
  height: 1.1rem;
  border: 3px solid var(--ink);
  border-bottom: 0;
  border-radius: 10px 10px 0 0;
  background: #fff;
}
.folder:hover, .folder:hover::before,
.folder.drop-over, .folder.drop-over::before { background: var(--butter); }
.folder.can-drop { outline: 3px dashed var(--ink); outline-offset: 5px; }
.folder-name { font-size: 1.25rem; font-weight: 700; overflow-wrap: anywhere; }

.empty { margin-top: 3rem; display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; }

.shelf {
  list-style: none;
  padding: 0;
  margin: 2rem 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 1.5rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
