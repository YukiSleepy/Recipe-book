<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import RecipeForm from '../components/RecipeForm.vue'
import { getCookbook } from '../stores/cookbooks'
import { addRecipe } from '../stores/recipes'

const route = useRoute()
const router = useRouter()
const book = computed(() => getCookbook(route.params.id))

// The page inside a cookbook is built by a teammate: a route named "cookbook" with an :id param.
// Until it exists we go back to the list of cookbooks.
const backTo = computed(() =>
  router.hasRoute('cookbook') ? { name: 'cookbook', params: { id: route.params.id } } : '/cookbooks',
)

function save(data) {
  addRecipe({ ...data, cookbookId: book.value.id })
  router.push(backTo.value)
}
</script>

<template>
  <main class="page">
    <RouterLink :to="backTo" class="back-link">Back to {{ book ? book.name : 'my cookbooks' }}</RouterLink>

    <template v-if="book">
      <h1>New recipe</h1>
      <p class="hint subtitle">In the cookbook “{{ book.name }}”</p>
      <RecipeForm @submit="save" />
    </template>

    <template v-else>
      <h1>Cookbook not found</h1>
      <p class="hint">This cookbook doesn’t exist anymore.</p>
    </template>
  </main>
</template>

<style scoped>
.subtitle { margin-top: 0.75rem; }
</style>