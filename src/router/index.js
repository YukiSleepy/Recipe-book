import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CreateCookbookView from '../views/CreateCookbookView.vue'
import EditCookbookView from '../views/EditCookbookView.vue'
import MyCookbooksView from '../views/MyCookbooksView.vue'
import CreateRecipeView from '../views/CreateRecipeView.vue'
import CookbookView from '../views/CookbookView.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/create', name: 'create', component: CreateCookbookView },
    { path: '/edit/:id', name: 'edit', component: EditCookbookView },
    { path: '/cookbook/:id', name: 'cookbook', component: CookbookView },
    { path: '/cookbook/:id/new-recipe', name: 'new-recipe', component: CreateRecipeView },
    // /cookbooks shows everything, /cookbooks/<folder id> shows one folder
    { path: '/cookbooks/:folderId?', name: 'cookbooks', component: MyCookbooksView },
  ],
})
