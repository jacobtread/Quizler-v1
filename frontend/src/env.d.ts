/// <reference types="vite/client" />

/**
 * THIS FILE CONTAINS INTERFACES USED BY TypeScript TO SUPPORT
 * VUE-JS AND INLINE SVGs
 */

interface ImportMetaEnv {
    readonly VITE_HOST: string;
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module '*.vue' {
    import { DefineComponent } from 'vue';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

declare module '*.svg?inline' {
    import { DefineComponent } from 'vue';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

declare module 'Base64' {
    export function btoa(input: string): string;

    export function atob(input: string): string;
}