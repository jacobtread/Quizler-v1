import { createRouter, createWebHistory } from "vue-router"

import Home from "@page/Home.vue"
import Join from "@page/Join.vue"
import Create from "@page/Create.vue"
import CreateQuestion from "@page/CreateQuestion.vue"
import Overview from "@page/Overview.vue"
import Game from "@page/Game.vue"
import GameOver from "@page/GameOver.vue"

export const router = createRouter({
    history: createWebHistory(), // Use the web history router instead of the hash router
    routes: [ // Assign all the routes
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
        },
        {
            name: 'Overview',
            path: '/overview',
            component: Overview
        },
        {
            name: 'Game',
            path: '/game',
            component: Game
        },
        {
            name: 'GameOver',
            path: '/game-over',
            component: GameOver
        }
    ]
});
