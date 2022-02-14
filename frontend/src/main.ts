import { createApp } from 'vue'
import App from './App.vue'
import { SocketApi } from "./api";

createApp(App).mount('#app')

const socket = new SocketApi();
