import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'homework',
        name: 'Homework',
        component: () => import('../views/Homework.vue')
      },
      {
        path: 'homework/create',
        name: 'HomeworkCreate',
        component: () => import('../views/HomeworkCreate.vue')
      },
      {
        path: 'class',
        name: 'Class',
        component: () => import('../views/Class.vue')
      },
      {
        path: 'class/:id',
        name: 'ClassDetail',
        component: () => import('../views/ClassDetail.vue')
      },
      {
        path: 'students',
        name: 'Students',
        component: () => import('../views/Students.vue')
      },
      {
        path: 'notes',
        name: 'Notes',
        component: () => import('../views/Notes.vue')
      },
      {
        path: 'notes/new',
        name: 'NoteNew',
        component: () => import('../views/NoteNew.vue')
      },
      {
        path: 'notes/:id',
        name: 'NoteDetail',
        component: () => import('../views/NoteDetail.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue')
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
  const isLoggedIn = localStorage.getItem('teacher_token')
  
  if (to.path !== '/login' && !isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
