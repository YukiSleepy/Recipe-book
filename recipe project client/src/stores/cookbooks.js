import { reactive, ref, watch } from 'vue'
import { DEFAULT_COLOR } from '../utils/color'

const BOOKS_KEY = 'cookbooks'
const FOLDERS_KEY = 'folders'


function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function normalizeBook(b) {
  return {
    id: b.id,
    name: b.name ?? '',
    description: b.description ?? '',
    color: b.color || LEGACY_TONES[b.tone] || DEFAULT_COLOR,
    image: b.image ?? null,
    folderId: b.folderId ?? null,
    favorite: Boolean(b.favorite),
    recipeCount: b.recipeCount ?? 0,
  }
}

function uid() {
  return globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(16).slice(2)
}

// Front end only for now: everything lives in the browser (localStorage).
export const cookbooks = reactive(read(BOOKS_KEY).map(normalizeBook))
export const folders = reactive(read(FOLDERS_KEY))

// True when the browser refused to save (usually because storage is full).
export const storageError = ref(false)

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    storageError.value = false
  } catch {
    storageError.value = true
  }
}

watch(cookbooks, (value) => save(BOOKS_KEY, value), { deep: true })
watch(folders, (value) => save(FOLDERS_KEY, value), { deep: true })

/* Cookbooks */

export function getCookbook(id) {
  return cookbooks.find((b) => b.id === id) ?? null
}

export function addCookbook(data) {
  const book = normalizeBook({ ...data, id: uid(), recipeCount: 0 })
  cookbooks.push(book)
  return book.id
}

export function updateCookbook(id, data) {
  const book = getCookbook(id)
  if (!book) return
  book.name = data.name
  book.description = data.description
  book.color = data.color
  book.image = data.image
  book.folderId = data.folderId
}

export function deleteCookbook(id) {
  const index = cookbooks.findIndex((b) => b.id === id)
  if (index !== -1) cookbooks.splice(index, 1)
}

export function toggleFavorite(id) {
  const book = getCookbook(id)
  if (book) book.favorite = !book.favorite
}

// folderId = null means "not in a folder"
export function moveToFolder(id, folderId) {
  const book = getCookbook(id)
  if (book) book.folderId = folderId
}

// Used to show cookbooks and folders alphabetically (ignores capitals, sorts 2 before 10).
export function compareNames(a, b) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })
}

/* Folders */

export function addFolder(name) {
  const folder = { id: uid(), name }
  folders.push(folder)
  return folder.id
}

export function renameFolder(id, name) {
  const folder = folders.find((f) => f.id === id)
  if (folder) folder.name = name
}

// Deleting a folder keeps its cookbooks: they go back to "not in a folder".
export function deleteFolder(id) {
  cookbooks.forEach((b) => {
    if (b.folderId === id) b.folderId = null
  })
  const index = folders.findIndex((f) => f.id === id)
  if (index !== -1) folders.splice(index, 1)
}
