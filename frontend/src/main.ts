import { createApp } from 'vue'
import { SocketApi } from "./api"
import App from './App.vue'

createApp(App).mount('#app')

const socket = new SocketApi();
