import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueSvg from '@vuetter/vite-plugin-vue-svg';
// @ts-ignore
import { viteSingleFile } from "vite-plugin-singlefile"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),  /* Used to compile VueJS SFC*/
        vueSvg(), /* Used to inline SVGs as VueJS components */
        viteSingleFile() /* Used to convert the output into a single html file*/
    ],
    resolve: {
        alias: { // Path aliases for quick easy access to certain file types
            '@': path.resolve(__dirname, './src'),
            '@page': path.resolve(__dirname, './src/pages'),
            '@component': path.resolve(__dirname, './src/components'),
            '@asset': path.resolve(__dirname, './src/assets'),
            '@api': path.resolve(__dirname, './src/api'),
            '@store': path.resolve(__dirname, './src/store'),
        }
    },
    build: { // Build options required for single file build
        target: "esnext",
        assetsInlineLimit: 100000000,
        chunkSizeWarningLimit: 100000000,
        cssCodeSplit: false,
        brotliSize: false,
        rollupOptions: {
            inlineDynamicImports: true,
            output: {
                manualChunks: () => "everything.js",
            },
        },
    },
    // @ts-ignore
    test: {  // Setting the testing environment
        environment: 'jsdom' // JSDom needs to be used for WebSocket testing
    }
})
