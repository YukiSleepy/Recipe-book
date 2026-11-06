<script setup>
import { RouterLink, useRouter } from 'vue-router'
import CookbookForm from '../components/CookbookForm.vue'
import { addCookbook } from '../stores/cookbooks'

const router = useRouter()

function save(data) {
  addCookbook(data)
  router.push(data.folderId ? `/cookbooks/${data.folderId}` : '/cookbooks')
}
</script>

<template>
  <main class="page">
    <RouterLink to="/" class="back-link">Back to menu</RouterLink>
    <h1>Create new cookbook</h1>
    <CookbookForm submit-label="Create cookbook" @submit="save" />
  </main>
</template>
