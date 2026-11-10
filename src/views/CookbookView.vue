<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import RecipeOverview from '../components/RecipeOverview.vue'
import { getCookbook } from '../stores/cookbooks'
import { getRecipe, recipesIn } from '../stores/recipes'

const route = useRoute()
const router = useRouter()

const book = computed(() => getCookbook(route.params.id))

// Turn the saved recipes of this cookbook into the shape the overview expects
const recipes = computed(() => {
  if (!book.value) return []
  return recipesIn(book.value.id).map((r) => {
    const minutes = (Number(r.prepMinutes) || 0) + (Number(r.cookMinutes) || 0)
    return {
      id: r.id,
      name: r.name,
      image: r.image || '',
      time: minutes || null,
      servings: r.servings || null,
      isPublic: r.visibility === 'public',
      favourite: !!r.favourite,
    }
  })
})

function createRecipe() {
  router.push({ name: 'new-recipe', params: { id: route.params.id } })
}

function openRecipe(recipe) {
  // There is no recipe page yet, so this only logs for now
  console.log('open recipe', recipe)
}

// The star on a recipe: save it on the recipe itself (the store saves automatically)
function setFavourite({ id, favourite }) {
  const recipe = getRecipe(id)
  if (recipe) recipe.favourite = favourite
}
</script>

<template>
  <main class="cookbook-page">
    <RouterLink :to="{ name: 'cookbooks' }" class="back-link">Back to my cookbooks</RouterLink>

    <RecipeOverview
      v-if="book"
      :cookbook-title="book.name"
      :recipes="recipes"
      @create="createRecipe"
      @open="openRecipe"
      @favourite="setFavourite"
    />

    <p v-else class="missing">This cookbook doesn’t exist any more. Go back to my cookbooks to pick another one.</p>
  </main>
</template>

<style scoped>
.cookbook-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.25rem 1.25rem 0;
}
.back-link {
  display: inline-block;
  padding: 0.4rem 0;
  color: #7a2e4d;
  font-weight: 600;
  text-decoration: none;
}
.back-link:hover {
  text-decoration: underline;
}
.back-link:focus-visible {
  outline: 3px solid #d99a1c;
  outline-offset: 2px;
}
.missing {
  padding: 2rem 0;
}
</style>
