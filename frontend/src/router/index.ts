import VueRouter from "vue-router"

import Home from "../pages/Home.vue"

const routes = [
    {path: '/', component: Home},
]

export const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
})
