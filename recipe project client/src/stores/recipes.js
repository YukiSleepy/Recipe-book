import { reactive, watch } from 'vue'
import { getCookbook, storageError } from './cookbooks'

const KEY = 'recipes'

function load() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function uid() {
  return globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(16).slice(2)
}

/*
  A recipe looks like this:
  {
    id, cookbookId, createdAt,
    name,
    visibility: 'private' | 'public',
    image: data URL or null,
    servings, prepMinutes, cookMinutes, ovenTemp, fanOven, difficulty,   (null / '' when not set)
    ingredients: [{ amount, unit, name }],
    steps: ['text', 'text', ...],
  }
*/
export const recipes = reactive(load())

watch(
  recipes,
  (value) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(value))
      storageError.value = false
    } catch {
      storageError.value = true
    }
  },
  { deep: true },
)

export function recipesIn(cookbookId) {
  return recipes.filter((r) => r.cookbookId === cookbookId)
}

export function getRecipe(id) {
  return recipes.find((r) => r.id === id) ?? null
}

// keeps the "N recipes" number on the cookbook cover correct
function updateCount(cookbookId) {
  const book = getCookbook(cookbookId)
  if (book) book.recipeCount = recipesIn(cookbookId).length
}

export function addRecipe(data) {
  const recipe = { ...data, id: uid(), createdAt: Date.now() }
  recipes.push(recipe)
  updateCount(recipe.cookbookId)
  return recipe.id
}

export function deleteRecipe(id) {
  const index = recipes.findIndex((r) => r.id === id)
  if (index === -1) return
  const { cookbookId } = recipes[index]
  recipes.splice(index, 1)
  updateCount(cookbookId)
}

// Call this when a whole cookbook is deleted
export function removeRecipesOf(cookbookId) {
  for (let i = recipes.length - 1; i >= 0; i--) {
    if (recipes[i].cookbookId === cookbookId) recipes.splice(i, 1)
  }
}