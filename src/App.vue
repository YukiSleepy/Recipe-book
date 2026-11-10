<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { storageError } from './stores/cookbooks'
</script>

<template>
  <header class="site-header">
    <RouterLink to="/" class="brand">Cookbook</RouterLink>
  </header>
  <p v-if="storageError" class="notice" role="alert">
    Your last change could not be saved because the browser storage is full. Try a smaller picture or delete a cookbook.
  </p>
  <RouterView />
</template>

<style scoped>
.site-header {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 0;
}
.brand {
  font-weight: 750;
  font-size: 1.25rem;
  text-decoration: none;
  letter-spacing: -0.01em;
}
.notice {
  max-width: 1100px;
  width: calc(100% - 3rem);
  margin: 1rem auto 0;
  padding: 0.9rem 1.25rem;
  border-radius: var(--radius-sm);
  background: var(--tomato-dark);
  color: #fff;
  font-weight: 600;
}
</style>
