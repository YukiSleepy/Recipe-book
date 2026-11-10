<script setup>
import { computed, nextTick, ref } from 'vue'
import { fileToResizedDataUrl } from '../utils/image'

const props = defineProps({
  initial: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['submit'])

let keyCounter = 0
const newKey = () => ++keyCounter
const blankIngredient = () => ({ key: newKey(), amount: '', unit: '', name: '' })
const blankStep = () => ({ key: newKey(), text: '' })

const units = [
  { value: '', label: 'No unit' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'dl', label: 'dl' },
  { value: 'l', label: 'l' },
  { value: 'tsp', label: 'tsp' },
  { value: 'tbsp', label: 'tbsp' },
  { value: 'pinch', label: 'pinch' },
]

const visibility = ref(props.initial.visibility ?? 'private')
const name = ref(props.initial.name ?? '')
const image = ref(props.initial.image ?? null)
const imageError = ref('')
const servings = ref(props.initial.servings ?? '')
const prepMinutes = ref(props.initial.prepMinutes ?? '')
const cookMinutes = ref(props.initial.cookMinutes ?? '')
const ovenTemp = ref(props.initial.ovenTemp ?? '')
const fanOven = ref(props.initial.fanOven ?? false)
const difficulty = ref(props.initial.difficulty ?? '')
const ingredients = ref(
  props.initial.ingredients?.length
    ? props.initial.ingredients.map((i) => ({ key: newKey(), ...i }))
    : [blankIngredient()],
)
const steps = ref(
  props.initial.steps?.length ? props.initial.steps.map((text) => ({ key: newKey(), text })) : [blankStep(), blankStep()],
)
const tried = ref(false)

/* Picture */
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

/* Ingredients */
function addIngredient() {
  const row = blankIngredient()
  ingredients.value.push(row)
  nextTick(() => document.getElementById(`ing-name-${row.key}`)?.focus())
}

function removeIngredient(index) {
  ingredients.value.splice(index, 1)
  if (!ingredients.value.length) ingredients.value.push(blankIngredient())
}

/* Steps */
const stepHints = [
  'Prepare: for example, preheat the oven to 200 °C and chop the vegetables.',
  'Cook: say what to do, for how long and at what heat.',
]

function stepHint(index) {
  return stepHints[index] ?? 'Describe the next step. One action per step works best.'
}

function addStep() {
  const row = blankStep()
  steps.value.push(row)
  nextTick(() => document.getElementById(`step-${row.key}`)?.focus())
}

function removeStep(index) {
  steps.value.splice(index, 1)
  if (!steps.value.length) steps.value.push(blankStep())
}

function moveStep(index, direction) {
  const target = index + direction
  if (target < 0 || target >= steps.value.length) return
  ;[steps.value[index], steps.value[target]] = [steps.value[target], steps.value[index]]
}

/* Saving */
const filledIngredients = computed(() => ingredients.value.filter((i) => i.amount.trim() || i.name.trim()))
const filledSteps = computed(() => steps.value.map((s) => s.text.trim()).filter(Boolean))

const problems = computed(() => {
  const list = []
  if (!name.value.trim()) list.push('Give the recipe a name.')
  if (filledIngredients.value.some((i) => !i.name.trim())) list.push('Every ingredient needs a name.')
  if (visibility.value === 'public') {
    if (!filledIngredients.value.length) list.push('A public recipe needs at least one ingredient.')
    if (!filledSteps.value.length) list.push('A public recipe needs at least one step.')
  }
  return list
})

const submitLabel = computed(() => (visibility.value === 'public' ? 'Publish recipe' : 'Save recipe'))

function numberOrNull(value) {
  return value === '' || value === null || Number.isNaN(Number(value)) ? null : Number(value)
}

function submit() {
  tried.value = true
  if (problems.value.length) return
  const oven = numberOrNull(ovenTemp.value)
  emit('submit', {
    name: name.value.trim(),
    visibility: visibility.value,
    image: image.value,
    servings: numberOrNull(servings.value),
    prepMinutes: numberOrNull(prepMinutes.value),
    cookMinutes: numberOrNull(cookMinutes.value),
    ovenTemp: oven,
    fanOven: oven ? fanOven.value : false,
    difficulty: difficulty.value,
    ingredients: filledIngredients.value.map((i) => ({ amount: i.amount.trim(), unit: i.unit, name: i.name.trim() })),
    steps: filledSteps.value,
  })
}
</script>

<template>
  <form class="recipe-form" @submit.prevent="submit">
    <fieldset class="visibility">
      <legend>Who can see this recipe?</legend>
      <div class="vis-options">
        <label class="vis vis-private" :class="{ on: visibility === 'private' }">
          <input v-model="visibility" type="radio" name="visibility" value="private" />
          <span class="vis-title">Private</span>
          <span class="vis-desc">Only you can see it.</span>
        </label>
        <label class="vis vis-public" :class="{ on: visibility === 'public' }">
          <input v-model="visibility" type="radio" name="visibility" value="public" />
          <span class="vis-title">Public</span>
          <span class="vis-desc">Everyone will see it in Public recipes (coming soon).</span>
        </label>
      </div>
    </fieldset>

    <label class="field">
      <span>Recipe name</span>
      <input v-model="name" type="text" required maxlength="80" placeholder="Pad thai" />
    </label>

    <div class="field">
      <label for="photo">Picture of the dish (optional)</label>
      <div class="photo" :class="{ empty: !image }">
        <img v-if="image" :src="image" alt="The picture you chose for this recipe" />
        <span v-else>No picture yet</span>
      </div>
      <input id="photo" class="file-input" type="file" accept="image/*" @change="onFile" />
      <p v-if="imageError" class="error">{{ imageError }}</p>
      <button v-if="image" type="button" class="button button-quiet button-small remove" @click="image = null">
        Remove picture
      </button>
    </div>

    <section aria-labelledby="details-heading">
      <h2 id="details-heading">Details</h2>
      <div class="details-grid">
        <label class="field">
          <span>Servings</span>
          <input v-model.number="servings" type="number" min="1" max="100" inputmode="numeric" placeholder="4" />
        </label>
        <label class="field">
          <span>Prep time (min)</span>
          <input v-model.number="prepMinutes" type="number" min="0" max="2000" inputmode="numeric" placeholder="15" />
        </label>
        <label class="field">
          <span>Cooking time (min)</span>
          <input v-model.number="cookMinutes" type="number" min="0" max="2000" inputmode="numeric" placeholder="30" />
        </label>
        <label class="field">
          <span>Difficulty</span>
          <select v-model="difficulty">
            <option value="">Not set</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label class="field">
          <span>Oven temperature (°C)</span>
          <input v-model.number="ovenTemp" type="number" min="50" max="300" step="5" inputmode="numeric" placeholder="No oven" />
        </label>
        <label class="check">
          <input v-model="fanOven" type="checkbox" :disabled="!ovenTemp" />
          <span>Fan oven (hot air)</span>
        </label>
      </div>
    </section>

    <section aria-labelledby="ingredients-heading">
      <h2 id="ingredients-heading">Ingredients</h2>
      <div class="ing-head" aria-hidden="true">
        <span>Amount</span>
        <span>Unit</span>
        <span>Ingredient</span>
      </div>
      <ul class="ing-list">
        <li v-for="(ing, i) in ingredients" :key="ing.key" class="ing-row">
          <input
            v-model="ing.amount"
            type="text"
            inputmode="decimal"
            maxlength="10"
            placeholder="2"
            :aria-label="`Amount, ingredient ${i + 1}`"
          />
          <select v-model="ing.unit" :aria-label="`Unit, ingredient ${i + 1}`">
            <option v-for="u in units" :key="u.value" :value="u.value">{{ u.label }}</option>
          </select>
          <input
            :id="`ing-name-${ing.key}`"
            v-model="ing.name"
            type="text"
            maxlength="60"
            placeholder="Eggs"
            :aria-label="`Name, ingredient ${i + 1}`"
            @keydown.enter.prevent="addIngredient"
          />
          <button type="button" class="button button-quiet button-small" :aria-label="`Remove ingredient ${i + 1}`" @click="removeIngredient(i)">
            Remove
          </button>
        </li>
      </ul>
      <button type="button" class="button button-quiet button-small add" @click="addIngredient">Add ingredient</button>
    </section>

    <section aria-labelledby="steps-heading">
      <h2 id="steps-heading">Steps</h2>
      <details class="tips">
        <summary>How to write clear steps</summary>
        <ul>
          <li>Start each step with a verb, like “chop”, “mix” or “bake”.</li>
          <li>Keep to one main action per step, so it is easy to follow while cooking.</li>
          <li>Include numbers: temperature, time and amounts, like “add half of the flour”.</li>
          <li>Say how to tell it is done, like “until golden brown”.</li>
          <li>Write the steps in the order you cook. The last step can be how to serve it.</li>
        </ul>
      </details>
      <ol class="step-list">
        <li v-for="(s, i) in steps" :key="s.key" class="step">
          <label :for="`step-${s.key}`" class="step-label">Step {{ i + 1 }}</label>
          <textarea :id="`step-${s.key}`" v-model="s.text" rows="3" maxlength="500" :placeholder="stepHint(i)"></textarea>
          <div class="row">
            <button type="button" class="button button-quiet button-small" :disabled="i === 0" :aria-label="`Move step ${i + 1} up`" @click="moveStep(i, -1)">Up</button>
            <button type="button" class="button button-quiet button-small" :disabled="i === steps.length - 1" :aria-label="`Move step ${i + 1} down`" @click="moveStep(i, 1)">Down</button>
            <button type="button" class="button button-quiet button-small" :aria-label="`Remove step ${i + 1}`" @click="removeStep(i)">Remove</button>
          </div>
        </li>
      </ol>
      <button type="button" class="button button-quiet button-small add" @click="addStep">Add step</button>
    </section>

    <div class="submit">
      <ul v-if="tried && problems.length" class="error-list" role="alert">
        <li v-for="p in problems" :key="p">{{ p }}</li>
      </ul>
      <button class="button" type="submit">{{ submitLabel }}</button>
      <p class="hint">
        {{ visibility === 'public' ? 'Public recipes need a name, at least one ingredient and one step.' : 'Private recipes only need a name. You can finish the rest later.' }}
      </p>
    </div>
  </form>
</template>

<style scoped>
.recipe-form { margin-top: 2.5rem; display: flex; flex-direction: column; gap: 2.5rem; max-width: 46rem; }
h2 { font-size: 1.5rem; margin-bottom: 1rem; }

.field { display: flex; flex-direction: column; gap: 0.5rem; border: 0; padding: 0; margin: 0; font-weight: 600; min-width: 0; }
.hint, .error { font-weight: 400; }
.error { font-weight: 600; }

input[type='text'], input[type='number'], textarea, select {
  font: inherit;
  font-weight: 400;
  padding: 0.75rem 1rem;
  border: 2px solid var(--ink);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--ink);
  min-width: 0;
}
textarea { resize: vertical; }

/* Private / public */
.visibility { border: 0; padding: 0; margin: 0; }
legend { padding: 0; margin-bottom: 0.75rem; font-weight: 600; }
.vis-options { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.vis {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.1rem 1.25rem;
  border-radius: var(--radius-sm);
  background: #fff;
  box-shadow: inset 0 0 0 2px var(--ink);
  cursor: pointer;
}
.vis input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
.vis:has(input:focus-visible) { outline: 3px solid var(--ink); outline-offset: 3px; }
.vis-title { font-size: 1.25rem; font-weight: 700; }
.vis.on.vis-private { background: var(--herb); color: #fff; box-shadow: none; }
.vis.on.vis-public { background: var(--butter); color: var(--ink); box-shadow: none; }

/* Picture */
.photo {
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--radius);
  background: #fff;
}
.photo.empty { border: 3px dashed var(--ink-soft); color: var(--ink-soft); font-weight: 600; }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
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

/* Details */
.details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: 1.25rem; align-items: end; }
.check { display: flex; align-items: center; gap: 0.6rem; font-weight: 600; padding-bottom: 0.8rem; }
.check input { width: 1.25rem; height: 1.25rem; accent-color: var(--ink); }

/* Ingredients */
.ing-head, .ing-row { display: grid; grid-template-columns: 6rem 7rem minmax(0, 1fr) auto; gap: 0.5rem; align-items: center; }
.ing-head { margin-bottom: 0.4rem; font-weight: 600; font-size: 0.95rem; color: var(--ink-soft); }
.ing-list { list-style: none; margin: 0 0 1rem; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }

/* Steps */
.tips { margin-bottom: 1.25rem; padding: 0.9rem 1.1rem; border-radius: var(--radius-sm); background: #fff; box-shadow: inset 0 0 0 2px var(--ink); }
.tips summary { font-weight: 650; cursor: pointer; }
.tips ul { margin: 0.75rem 0 0; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem; }
.step-list { list-style: none; margin: 0 0 1rem; padding: 0; display: flex; flex-direction: column; gap: 1.25rem; }
.step { display: flex; flex-direction: column; gap: 0.5rem; }
.step-label { font-weight: 700; }
.row { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.add { align-self: flex-start; }

/* Save */
.submit { display: flex; flex-direction: column; align-items: flex-start; gap: 0.75rem; }
.error-list {
  margin: 0;
  padding: 0.9rem 1.1rem 0.9rem 2.2rem;
  border-radius: var(--radius-sm);
  background: var(--tomato-dark);
  color: #fff;
  font-weight: 600;
  align-self: stretch;
}

@media (max-width: 560px) {
  .vis-options { grid-template-columns: 1fr; }
  .ing-head { display: none; }
  .ing-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .ing-row > input:nth-of-type(2) { grid-column: 1 / -1; }
  .ing-row > button { grid-column: 1 / -1; justify-self: start; }
}
</style>