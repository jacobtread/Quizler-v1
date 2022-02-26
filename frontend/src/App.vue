<script setup lang="ts">
import "@/assets/global.scss"
import { useSocket, useSocketOpen } from "@/api";
import Loader from "@/components/Loader.vue";
import ToastSystem from "@component/ToastSystem.vue";
import Dialog from "@component/Dialog.vue";
import { watch } from "vue";

useSocket() // Use the socket to create a socket instance
const open = useSocketOpen()

</script>
<template>
    <template v-if="open">
        <div class="content">
            <router-view v-slot="{ Component }">
                <transition name="content">
                    <component :is="Component" class="content__item"/>
                </transition>
            </router-view>
            <Dialog/>
            <ToastSystem/>
        </div>
    </template>
    <template v-else>
        <div class="content loader-wrapper">
            <Loader/>
        </div>
    </template>
</template>

<style lang="scss">
.content {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;

    &__item {
        display: flex;
        align-items: center;
        flex-flow: column;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow-y: auto;
    }
}


.content-enter-active,
.content-leave-active {
    transition: transform 0.25s ease;
    transform: scale(1);
}

.content-enter-from, .content-leave-to {
    transform: translateY(-100px) scale(1.1);
    opacity: 0;
}
</style>