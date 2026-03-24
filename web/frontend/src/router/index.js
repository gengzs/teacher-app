import { createRouter, createWebHashHistory } from 'vue-router'

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
        path: 'student/:id',
        name: 'StudentDetail',
        component: () => import('../views/StudentDetail.vue')
      },
      {
        path: 'recite/learn',
        name: 'StudentReciteLearn',
        component: () => import('../views/StudentReciteLearn.vue')
      },
      {
        path: 'recite/test',
        name: 'StudentReciteTest',
        component: () => import('../views/StudentReciteTest.vue')
      },
      {
        path: 'recite',
        name: 'StudentRecite',
        component: () => import('../views/StudentRecite.vue')
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
  // Hash 模式：Electron file:// 与静态部署均可用；URL 形如 #/students
  history: createWebHashHistory(),
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
