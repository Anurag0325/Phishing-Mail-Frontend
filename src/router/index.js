import { createRouter, createWebHistory } from 'vue-router'
import Admin from '@/components/Admin.vue'
import Pop from '@/components/Pop.vue';

const routes = [

  { path: '/', name: 'admin', component: Admin },
  {
    path: '/phishing_test/:colleague_id',
    component: Pop,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router