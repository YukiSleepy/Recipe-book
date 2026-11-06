<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import CookbookForm from '../components/CookbookForm.vue'
import { getCookbook, updateCookbook } from '../stores/cookbooks'

const route = useRoute()
const router = useRouter()
const book = computed(() => getCookbook(route.params.id))

function save(data) {
  updateCookbook(book.value.id, data)
  router.push(data.folderId ? `/cookbooks/${data.folderId}` : '/cookbooks')
}
</script>

<template>
  <main class="page">
    <RouterLink to="/cookbooks" class="back-link">Back to my cookbooks</RouterLink>

    <template v-if="book">
      <h1>Edit cookbook</h1>
      <CookbookForm :key="book.id" :initial="book" submit-label="Save changes" @submit="save" />
    </template>

    <template v-else>
      <h1>Cookbook not found</h1>
      <p class="hint">This cookbook doesn’t exist anymore.</p>
    </template>
  </main>
</template>
