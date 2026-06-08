import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Stats from '../views/Stats.vue'
import History from '../views/History.vue'
import Chart from '../views/Chart.vue'
import Pomodoro from '../views/Pomodoro.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/stats',
      name: 'stats',
      component: Stats
    },
    {
      path: '/history',
      name: 'history',
      component: History
    },
    {
      path: '/chart',
      name: 'chart',
      component: Chart
    },
    {
      path: '/pomodoro',
      name: 'pomodoro',
      component: Pomodoro
    }
  ]
})

export default router
