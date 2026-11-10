<script setup>
import { computed, ref, watch } from "vue";

/*
  RecipeOverview
  Shows every recipe in a cookbook, alphabetical, grouped under big index letters.

  Props
    cookbookTitle  name shown at the top
    recipes        array of { id, name, image, category, time, servings, isPublic, favourite }
                   (image, category, time, servings, isPublic and favourite are optional)

  Events
    create         "New recipe" button was clicked  -> go to your create-recipe page
    open           a recipe card was clicked        -> payload: the recipe
    favourite      the star was toggled             -> payload: { id, favourite }
*/

const props = defineProps({
  cookbookTitle: { type: String, default: "My cookbook" },
  recipes: { type: Array, default: () => [] },
});
const emit = defineEmits(["create", "open", "favourite"]);

// Local copy so the star can be toggled even if the parent does not store it
const items = ref(props.recipes.map((r) => ({ ...r })));
watch(
  () => props.recipes,
  (value) => {
    items.value = value.map((r) => ({ ...r }));
  },
  { deep: true }
);

// ---------- controls ----------
const root = ref(null);
const search = ref("");
const descending = ref(false);
const onlyFavourites = ref(false);
const activeCategory = ref("");
const view = ref("grid"); // "grid" | "list"

const collator = new Intl.Collator("sv", { sensitivity: "base" });

const categories = computed(() => {
  const set = new Set(items.value.map((r) => r.category).filter(Boolean));
  return [...set].sort(collator.compare);
});

// ---------- filtering, sorting, grouping ----------
const filtered = computed(() => {
  const q = search.value.trim().toLocaleLowerCase("sv");
  return items.value.filter((r) => {
    if (onlyFavourites.value && !r.favourite) return false;
    if (activeCategory.value && r.category !== activeCategory.value) return false;
    if (!q) return true;
    return (
      r.name.toLocaleLowerCase("sv").includes(q) ||
      (r.category || "").toLocaleLowerCase("sv").includes(q)
    );
  });
});

const sorted = computed(() => {
  const direction = descending.value ? -1 : 1;
  return [...filtered.value].sort((a, b) => direction * collator.compare(a.name, b.name));
});

function letterOf(name) {
  const first = name.trim().charAt(0).toLocaleUpperCase("sv");
  return /\p{L}/u.test(first) ? first : "#";
}

const groups = computed(() => {
  const map = new Map();
  for (const recipe of sorted.value) {
    const letter = letterOf(recipe.name);
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter).push(recipe);
  }
  return [...map].map(([letter, recipes]) => ({ letter, recipes }));
});

const alphabet = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ", "#"];
const lettersInUse = computed(() => new Set(groups.value.map((g) => g.letter)));

// ---------- actions ----------
function jumpTo(letter) {
  const target = root.value?.querySelector(`[data-letter="${letter}"]`);
  if (!target) return;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
}

function toggleFavourite(recipe) {
  recipe.favourite = !recipe.favourite;
  emit("favourite", { id: recipe.id, favourite: recipe.favourite });
}

function openRandom() {
  if (!filtered.value.length) return;
  const pick = filtered.value[Math.floor(Math.random() * filtered.value.length)];
  emit("open", pick);
}

function clearFilters() {
  search.value = "";
  activeCategory.value = "";
  onlyFavourites.value = false;
}

function formatTime(minutes) {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const hasFilters = computed(
  () => search.value || activeCategory.value || onlyFavourites.value
);
</script>

<template>
  <section ref="root" class="overview">
    <header class="top">
      <div>
        <h1>{{ cookbookTitle }}</h1>
        <p class="count">
          <template v-if="hasFilters">
            Showing {{ filtered.length }} of {{ items.length }} recipes
          </template>
          <template v-else>
            {{ items.length }} {{ items.length === 1 ? "recipe" : "recipes" }}
          </template>
        </p>
      </div>
      <button type="button" class="btn-create" @click="emit('create')">
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none" />
        </svg>
        New recipe
      </button>
    </header>

    <div class="toolbar">
      <label class="search">
        <span class="visually-hidden">Search recipes</span>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.8" fill="none" />
          <path d="M13 13l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <input v-model="search" type="search" placeholder="Search by name or category" />
      </label>

      <div class="tools">
        <button type="button" class="tool" :aria-pressed="onlyFavourites" @click="onlyFavourites = !onlyFavourites">
          Favourites
        </button>
        <button type="button" class="tool" @click="descending = !descending">
          {{ descending ? "Z to A" : "A to Z" }}
        </button>
        <button type="button" class="tool" :disabled="!filtered.length" @click="openRandom">
          Surprise me
        </button>
        <div class="segmented" role="group" aria-label="Layout">
          <button type="button" :aria-pressed="view === 'grid'" @click="view = 'grid'">Grid</button>
          <button type="button" :aria-pressed="view === 'list'" @click="view = 'list'">List</button>
        </div>
      </div>
    </div>

    <div v-if="categories.length" class="chips" role="group" aria-label="Filter by category">
      <button type="button" class="chip" :aria-pressed="activeCategory === ''" @click="activeCategory = ''">
        All
      </button>
      <button
        v-for="category in categories"
        :key="category"
        type="button"
        class="chip"
        :aria-pressed="activeCategory === category"
        @click="activeCategory = activeCategory === category ? '' : category"
      >
        {{ category }}
      </button>
    </div>

    <nav v-if="items.length" class="jump" aria-label="Jump to letter">
      <button
        v-for="letter in alphabet"
        :key="letter"
        type="button"
        :disabled="!lettersInUse.has(letter)"
        @click="jumpTo(letter)"
      >
        {{ letter }}
      </button>
    </nav>

    <div v-if="!items.length" class="empty">
      <h2>No recipes yet</h2>
      <p>Add your first recipe and it will show up here, sorted by name.</p>
      <button type="button" class="btn-create" @click="emit('create')">Create your first recipe</button>
    </div>

    <div v-else-if="!filtered.length" class="empty">
      <h2>No recipes match</h2>
      <p>Try a different search, or clear the filters to see everything.</p>
      <button type="button" class="tool" @click="clearFilters">Clear filters</button>
    </div>

    <div v-else class="groups">
      <section v-for="group in groups" :key="group.letter" class="group" :data-letter="group.letter">
        <h2 class="letter">{{ group.letter }}</h2>

        <ul class="recipes" :class="view">
          <li v-for="recipe in group.recipes" :key="recipe.id">
            <article
              class="card"
              tabindex="0"
              @click="emit('open', recipe)"
              @keydown.enter="emit('open', recipe)"
            >
              <div class="photo">
                <img v-if="recipe.image" :src="recipe.image" :alt="recipe.name" loading="lazy" />
                <span v-else class="photo-fallback" aria-hidden="true">{{ letterOf(recipe.name) }}</span>
              </div>

              <div class="body">
                <h3>{{ recipe.name }}</h3>
                <p v-if="recipe.category" class="category">{{ recipe.category }}</p>
                <p class="facts">
                  <span v-if="recipe.time">{{ formatTime(recipe.time) }}</span>
                  <span v-if="recipe.servings">{{ recipe.servings }} servings</span>
                </p>
                <span class="visibility" :class="recipe.isPublic ? 'public' : 'private'">
                  {{ recipe.isPublic ? "Public" : "Private" }}
                </span>
              </div>

              <button
                type="button"
                class="star"
                :aria-pressed="!!recipe.favourite"
                :aria-label="recipe.favourite ? 'Remove from favourites' : 'Add to favourites'"
                @click.stop="toggleFavourite(recipe)"
                @keydown.enter.stop
              >
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path
                    d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linejoin="round"
                    :fill="recipe.favourite ? 'currentColor' : 'none'"
                  />
                </svg>
              </button>
            </article>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<style scoped>
.overview {
  --paper: #eef1ec;
  --card: #ffffff;
  --ink: #1d2a23;
  --muted: #5c6b62;
  --line: #d3dad2;
  --beet: #7a2e4d;
  --beet-dark: #5e2039;
  --gold: #d99a1c;

  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
  background: var(--paper);
  color: var(--ink);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.45;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

button {
  font: inherit;
  color: inherit;
  cursor: pointer;
}
button:focus-visible,
input:focus-visible,
.card:focus-visible {
  outline: 3px solid var(--gold);
  outline-offset: 2px;
}
button:disabled {
  cursor: default;
}

/* ---------- header ---------- */
.top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
h1 {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.01em;
}
.count {
  margin: 0.25rem 0 0;
  color: var(--muted);
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.25rem;
  border: 0;
  border-radius: 999px;
  background: var(--beet);
  color: #fff;
  font-weight: 600;
}
.btn-create:hover {
  background: var(--beet-dark);
}

/* ---------- toolbar ---------- */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
}
.search {
  position: relative;
  flex: 1 1 260px;
  color: var(--muted);
}
.search svg {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
}
.search input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.65rem 1rem 0.65rem 2.6rem;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  color: var(--ink);
  font: inherit;
}
.tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.tool {
  padding: 0.55rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
}
.tool:hover:not(:disabled) {
  border-color: var(--beet);
}
.tool[aria-pressed="true"] {
  background: var(--beet);
  border-color: var(--beet);
  color: #fff;
}
.tool:disabled {
  opacity: 0.5;
}

.segmented {
  display: inline-flex;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  background: var(--card);
}
.segmented button {
  padding: 0.55rem 0.9rem;
  border: 0;
  background: transparent;
}
.segmented button[aria-pressed="true"] {
  background: var(--ink);
  color: #fff;
}

/* ---------- category chips ---------- */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.chip {
  padding: 0.35rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  font-size: 0.92rem;
}
.chip:hover {
  border-color: var(--beet);
}
.chip[aria-pressed="true"] {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--ink);
  font-weight: 600;
}

/* ---------- A-Z jump bar ---------- */
.jump {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem;
  padding: 0.5rem 0;
  margin-bottom: 1.5rem;
  background: var(--paper);
  border-bottom: 1px solid var(--line);
}
.jump button {
  min-width: 1.9rem;
  padding: 0.2rem 0.3rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font-family: Georgia, serif;
  font-weight: 700;
  color: var(--beet);
}
.jump button:hover:not(:disabled) {
  background: var(--beet);
  color: #fff;
}
.jump button:disabled {
  color: var(--line);
}

/* ---------- letter groups ---------- */
.group {
  margin-bottom: 2.25rem;
  scroll-margin-top: 4rem;
}
.letter {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0 0 1rem;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 3.2rem;
  line-height: 1;
  color: var(--beet);
}
.letter::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--line);
}

.recipes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;
}
.recipes.grid {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}
.recipes.list {
  grid-template-columns: 1fr;
}

/* ---------- recipe card ---------- */
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--card);
  cursor: pointer;
}
.card:hover {
  border-color: var(--beet);
}
.photo {
  aspect-ratio: 4 / 3;
  background: #dfe5dc;
}
.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.photo-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-family: Georgia, serif;
  font-size: 3rem;
  color: var(--beet);
  opacity: 0.45;
}
.body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.85rem 1rem 1rem;
}
.body h3 {
  margin: 0;
  font-family: Georgia, serif;
  font-size: 1.15rem;
  line-height: 1.25;
}
.category {
  margin: 0;
  color: var(--beet);
  font-size: 0.9rem;
}
.facts {
  display: flex;
  gap: 0.75rem;
  margin: 0.25rem 0 0;
  color: var(--muted);
  font-size: 0.88rem;
}
.visibility {
  align-self: flex-start;
  margin-top: 0.5rem;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}
.visibility.private {
  background: #e6ebe4;
  color: var(--muted);
}
.visibility.public {
  background: #f6e4c2;
  color: #6b4700;
}

.star {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: var(--muted);
}
.star[aria-pressed="true"] {
  color: var(--gold);
}
.star:hover {
  color: var(--gold);
}

/* list layout: photo on the left */
.recipes.list .card {
  flex-direction: row;
  align-items: center;
}
.recipes.list .photo {
  flex: 0 0 120px;
  aspect-ratio: 1;
}
.recipes.list .body {
  flex: 1;
  padding: 0.75rem 3.5rem 0.75rem 1rem;
}

/* ---------- empty states ---------- */
.empty {
  padding: 3rem 1rem;
  text-align: center;
}
.empty h2 {
  margin: 0 0 0.4rem;
  font-family: Georgia, serif;
}
.empty p {
  margin: 0 0 1.25rem;
  color: var(--muted);
}

@media (max-width: 520px) {
  .recipes.grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  .letter {
    font-size: 2.6rem;
  }
}
</style>
