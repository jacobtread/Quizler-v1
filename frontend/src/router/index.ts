import { createRouter, createWebHistory } from "vue-router"

import Home from "@page/Home.vue"
import Join from "@page/Join.vue"
import Create from "@page/Create.vue"
import CreateQuestion from "@page/CreateQuestion.vue"

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
    },
    {
        name: 'Create',
        path: '/create',
        component: Create
    },
    {
        name: 'CreateQuestion',
        path: '/create/question',
        component: CreateQuestion
    },
    {
        name: 'Modify',
        path: '/modify/:edit',
        component: CreateQuestion
    }
]

export const router = createRouter({
    history: createWebHistory(),
    routes,
})
