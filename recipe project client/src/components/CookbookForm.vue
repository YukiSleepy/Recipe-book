<script setup>
import { computed, ref } from 'vue'
import CookbookCover from './CookbookCover.vue'
import { compareNames, folders } from '../stores/cookbooks'
import { DEFAULT_COLOR, normalizeHex } from '../utils/color'
import { fileToResizedDataUrl } from '../utils/image'

const props = defineProps({
  initial: { type: Object, default: () => ({}) },
  submitLabel: { type: String, default: 'Save' },
})
const emit = defineEmits(['submit'])

const name = ref(props.initial.name ?? '')
const description = ref(props.initial.description ?? '')
const color = ref(props.initial.color ?? DEFAULT_COLOR)
const hexText = ref(color.value)
const image = ref(props.initial.image ?? null)
const folderId = ref(props.initial.folderId ?? null)
const imageError = ref('')
const sortedFolders = computed(() => [...folders].sort(compareNames))

const hexValid = computed(() => normalizeHex(hexText.value) !== null)

// Colour wheel changed -> update the hex box
function onPick(event) {
  color.value = event.target.value
  hexText.value = event.target.value
}

// Hex box changed -> update the colour wheel when the code is valid
function onHexInput() {
  const hex = normalizeHex(hexText.value)
  if (hex) color.value = hex
}

function onHexBlur() {
  if (hexValid.value) hexText.value = normalizeHex(hexText.value)
}

async function onFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  imageError.value = ''
  try {
    image.value = await fileToResizedDataUrl(file)
  } catch (err) {
    imageError.value = err.message
  } finally {
    event.target.value = ''
  }
}

const preview = computed(() => ({
  name: name.value,
  description: description.value,
  color: normalizeHex(hexText.value) ?? color.value,
  image: image.value,
  recipeCount: props.initial.recipeCount ?? 0,
}))

function submit() {
  const hex = normalizeHex(hexText.value)
  if (!hex || !name.value.trim()) return
  emit('submit', {
    name: name.value.trim(),
    description: description.value.trim(),
    color: hex,
    image: image.value,
    folderId: folderId.value,
  })
}
</script>

<template>
  <div class="layout">
    <form class="form" @submit.prevent="submit">
      <label class="field">
        <span>Cookbook name</span>
        <input v-model="name" type="text" required maxlength="60" placeholder="Sunday dinners" />
      </label>

      <label class="field">
        <span>Description (optional)</span>
        <textarea v-model="description" rows="3" maxlength="200" placeholder="Slow dishes for the whole family"></textarea>
      </label>

      <fieldset class="field">
        <legend>Cover colour</legend>
        <div class="color-row">
          <input class="color-input" type="color" :value="color" aria-label="Pick a colour" @input="onPick" />
          <input
            v-model="hexText"
            class="hex-input"
            type="text"
            maxlength="7"
            spellcheck="false"
            autocomplete="off"
            aria-label="Hex colour code"
            :aria-invalid="!hexValid"
            @input="onHexInput"
            @blur="onHexBlur"
          />
        </div>
        <p v-if="!hexValid" class="error">Enter a hex colour, like #f5cb5c.</p>
      </fieldset>

      <div class="field">
        <label for="picture">Cover picture (optional)</label>
        <input id="picture" class="file-input" type="file" accept="image/*" @change="onFile" />
        <p class="hint">The picture is cropped to fill the top of the cover.</p>
        <p v-if="imageError" class="error">{{ imageError }}</p>
        <button v-if="image" type="button" class="button button-quiet button-small remove" @click="image = null">
          Remove picture
        </button>
      </div>

      <label v-if="folders.length" class="field">
        <span>Folder (optional)</span>
        <select v-model="folderId">
          <option :value="null">Not in a folder</option>
          <option v-for="f in sortedFolders" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </label>
      <p v-else class="hint">
        You have no folders yet. Create one on the My cookbooks page, then choose it here or later with Edit.
      </p>

      <button class="button" type="submit">{{ submitLabel }}</button>
    </form>

    <aside class="preview" aria-label="Cover preview">
      <p class="hint">Preview</p>
      <CookbookCover :book="preview" />
    </aside>
  </div>
</template>

<style scoped>
.layout {
  margin-top: 2.5rem;
  display: grid;
  grid-template-columns: minmax(0, 36rem) minmax(0, 18rem);
  gap: 3rem;
  align-items: start;
}

.form { display: flex; flex-direction: column; gap: 1.75rem; align-items: flex-start; }
.field { display: flex; flex-direction: column; gap: 0.5rem; border: 0; padding: 0; margin: 0; font-weight: 600; align-self: stretch; min-width: 0; }
legend { padding: 0; margin-bottom: 0.5rem; }
.hint, .error { font-weight: 400; }
.error { font-weight: 600; }

input[type='text'], textarea, select {
  font: inherit;
  font-weight: 400;
  padding: 0.8rem 1rem;
  border: 2px solid var(--ink);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--ink);
}

.color-row { display: flex; align-items: center; gap: 0.75rem; }
.color-input {
  width: 4rem;
  height: 3rem;
  padding: 0.2rem;
  border: 2px solid var(--ink);
  border-radius: var(--radius-sm);
  background: #fff;
  cursor: pointer;
}
.hex-input { width: 9rem; }
.hex-input[aria-invalid='true'] { border-color: var(--tomato-dark); }

.file-input { font: inherit; font-weight: 400; }
.file-input::file-selector-button {
  font: inherit;
  font-weight: 650;
  margin-right: 0.75rem;
  padding: 0.5rem 0.95rem;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink);
  box-shadow: inset 0 0 0 2px var(--ink);
  cursor: pointer;
}
.remove { align-self: flex-start; }

.preview { position: sticky; top: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }

@media (max-width: 820px) {
  .layout { grid-template-columns: minmax(0, 1fr); gap: 2rem; }
  .preview { position: static; order: -1; }
}
</style>
