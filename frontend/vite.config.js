import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueSvg from '@vuetter/vite-plugin-vue-svg';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue({
        reactivityTransform: true
    }), vueSvg()]
})
