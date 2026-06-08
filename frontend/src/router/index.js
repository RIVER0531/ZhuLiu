import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Stats from '../views/Stats.vue'
import History from '../views/History.vue'
import Chart from '../views/Chart.vue'
import Pomodoro from '../views/Pomodoro.vue'
import Login from '../views/Login.vue'
import { authStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'login', component: Login },
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/stats',
    name: 'stats',
    component: Stats,
    meta: { requiresAuth: true }
  },
  {
    path: '/history',
    name: 'history',
    component: History,
    meta: { requiresAuth: true }
  },
  {
    path: '/chart',
    name: 'chart',
    component: Chart,
    meta: { requiresAuth: true }
  },
  {
    path: '/pomodoro',
    name: 'pomodoro',
    component: Pomodoro,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !authStore.state.token) {
    next('/login')
  } else if (to.path === '/login' && authStore.state.token) {
    next('/')
  } else {
    next()
  }
})

export default router
