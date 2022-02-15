import { createRouter, createWebHistory } from "vue-router"

import Home from "../pages/Home.vue"
import Join from "../pages/Join.vue"

const routes = [
    {
        name: 'Home',
        path: '/',
        component: Home
    },
    {
        name: 'Join',
        path: '/join',
        component: Join
    }
]

export const router = createRouter({
    history: createWebHistory(),
    routes,
})
