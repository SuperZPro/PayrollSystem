import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/Index.vue')
  },
  {
    path: '/',
    component: () => import('../components/layout/Layout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/Index.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'worktime',
        name: 'Worktime',
        component: () => import('../views/worktime/Index.vue'),
        meta: { title: '工时录入' }
      },
      {
        path: 'history',
        name: 'History',
        component: () => import('../views/history/Index.vue'),
        meta: { title: '历史记录' }
      },
      {
        path: 'report',
        name: 'Report',
        component: () => import('../views/report/Index.vue'),
        meta: { title: '收入报表' }
      },
      {
        path: 'payroll',
        name: 'Payroll',
        component: () => import('../views/payroll/Index.vue'),
        meta: { title: '工资单' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查是否登录
  const isAuthenticated = localStorage.getItem('token')
  
  if (to.path !== '/login' && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router 