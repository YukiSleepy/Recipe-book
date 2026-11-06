import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CreateCookbookView from '../views/CreateCookbookView.vue'
import EditCookbookView from '../views/EditCookbookView.vue'
import MyCookbooksView from '../views/MyCookbooksView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/create', name: 'create', component: CreateCookbookView },
    { path: '/edit/:id', name: 'edit', component: EditCookbookView },
    // /cookbooks shows everything, /cookbooks/<folder id> shows one folder
    { path: '/cookbooks/:folderId?', name: 'cookbooks', component: MyCookbooksView },
  ],
})
