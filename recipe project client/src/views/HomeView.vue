<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { cookbooks } from '../stores/cookbooks'

const total = computed(() => cookbooks.length)
const totalLabel = computed(() => (total.value === 1 ? 'cookbook' : 'cookbooks'))
</script>

<template>
  <main class="page">
    <h1>What would you like to do?</h1>

    <nav class="menu" aria-label="Main menu">
      <RouterLink to="/create" class="box tone-butter">
        <span class="box-top">
          <svg class="icon" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M24 8v32M8 24h32" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
          </svg>
        </span>
        <span class="box-text">
          <span class="box-title">Create new cookbook</span>
          <span class="box-desc">Start an empty cookbook and fill it with your recipes.</span>
        </span>
      </RouterLink>

      <RouterLink to="/cookbooks" class="box tone-herb">
        <span class="box-top">
          <svg class="icon" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M10 9h22a6 6 0 0 1 6 6v24H16a6 6 0 0 1-6-6V9Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" />
            <path d="M16 39a6 6 0 0 1 0-12h22" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" />
          </svg>
          <span class="count">
            <span class="count-number">{{ total }}</span>
            <span class="count-label">{{ totalLabel }}</span>
          </span>
        </span>
        <span class="box-text">
          <span class="box-title">My cookbooks</span>
          <span class="box-desc">Open the cookbooks you have already made.</span>
        </span>
      </RouterLink>

      <div class="box box-soon" aria-disabled="true">
        <span class="box-top">
          <svg class="icon" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="16" fill="none" stroke="currentColor" stroke-width="4" />
            <path d="M8 24h32M24 8c-8 9-8 23 0 32M24 8c8 9 8 23 0 32" fill="none" stroke="currentColor" stroke-width="3" />
          </svg>
        </span>
        <span class="box-text">
          <span class="box-title">Public recipes</span>
          <span class="box-desc">Coming soon.</span>
        </span>
      </div>
    </nav>
  </main>
</template>

<style scoped>
.menu {
  margin-top: 3rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.box {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 4rem;
  min-height: 22rem;
  padding: 1.75rem;
  border-radius: var(--radius);
  text-decoration: none;
  box-shadow: 0 0 0 var(--ink);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

a.box:hover {
  transform: translate(-4px, -4px);
  box-shadow: 8px 8px 0 var(--ink);
}

.box-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.icon { width: 3.5rem; height: 3.5rem; }

.count { display: flex; flex-direction: column; align-items: flex-end; }
.count-number { font-size: 4rem; font-weight: 750; line-height: 0.9; letter-spacing: -0.03em; }
.count-label { margin-top: 0.4rem; font-weight: 600; }

.box-text { display: flex; flex-direction: column; gap: 0.5rem; }
.box-title { font-size: 1.75rem; font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; }
.box-desc { max-width: 24ch; }

.box-soon {
  border: 3px dashed var(--ink-soft);
  color: var(--ink-soft);
  background: transparent;
  box-shadow: none;
}

@media (max-width: 820px) {
  .menu { grid-template-columns: 1fr; }
  .box { min-height: 0; gap: 2rem; }
}
</style>
