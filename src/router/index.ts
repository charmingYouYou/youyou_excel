import { createRouter, createWebHashHistory } from 'vue-router'
import Base from '@/views/index.vue'

// 2. 定义一些路由
// 每个路由都需要映射到一个组件。
// 我们后面再讨论嵌套路由。
const routes = [
  {
    path: '/',
    component: Base,
    children: [
      {
        path: 'ld2020Excel',
        meta: {
          name: 'Ld2020 Excel处理',
        },
        component: () => import('@/views/ld2020Excel/index.vue'),
      },
      {
        path: 'ld2021Excel',
        meta: {
          name: 'LD20/21Excel处理',
        },
        component: () => import('@/views/ld2021Excel/index.vue'),
      },
      {
        path: 'ld21Excel-inside',
        meta: {
          name: 'LD21Excel处理-内置地区ID',
        },
        component: () => import('@/views/ld21ExcelInside/index.vue'),
      },
    ],
  },
]

// 3. 创建路由实例并传递 `routes` 配置
// 你可以在这里输入更多的配置，但我们在这里
// 暂时保持简单
export default createRouter({
  // 4. 内部提供了 history 模式的实现。为了简单起见，我们在这里使用 hash 模式。
  history: createWebHashHistory(),
  routes, // `routes: routes` 的缩写
})
