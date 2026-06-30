import { createRouter, createWebHistory } from 'vue-router'
import WelcomeView from '../views/WelcomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'welcome',
            component: WelcomeView
        },
        {

            path: '/base',
            name: 'base',
            component: () => import('../views/InfoView.vue'),
            children: [
                {
                    path: 'drivers',
                    component: () => import('../components/DriversList.vue')
                },
                {
                    path: 'stops',
                    component: () => import('../components/StopsList.vue')
                },
                {
                    path: 'route',
                    component: () => import('../components/RouteList.vue')
                },
                {
                    path: 'vehicle',
                    component: () => import('../components/VehicleList.vue')
                },
                {
                    path: 'wmode',
                    component: () => import('../components/WorkingModelList.vue')
                }
            ]
        }
    ]
})

export default router