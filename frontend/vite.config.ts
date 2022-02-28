import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueSvg from '@vuetter/vite-plugin-vue-svg';
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), vueSvg()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@page': path.resolve(__dirname, './src/pages'),
            '@component': path.resolve(__dirname, './src/components'),
            '@asset': path.resolve(__dirname, './src/assets'),
            '@api': path.resolve(__dirname, './src/api'),
            '@store': path.resolve(__dirname, './src/store'),
        }
    },
    // @ts-ignore
    test: {
        environment: 'jsdom'
    }
})
