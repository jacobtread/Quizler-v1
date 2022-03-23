<script setup lang="ts">
import "@/assets/global.scss"
import { useClient } from "@/api";
import ToastSystem from "@component/Toasts.vue";
import Dialog from "@component/Dialog.vue";
import Loader from "@component/Loader.vue";
import { loading } from "@/tools/ui";
import { watch } from "vue";

const {open} = useClient(); // Use the socket for the open state

watch(open, (value: boolean) => { // Watch for changes of the open state
    loading(!value, 'Connecting...'); // Show the loader if we aren't connected
}, {immediate: true}/* Watch immediately (include the initial value) */);
</script>
<template>
    <div class="content">
        <router-view v-slot="{ Component }">
            <transition name="content">
                <component :is="Component" class="content__item"/>
            </transition>
        </router-view>
        <Dialog/>
        <ToastSystem/>
        <Loader/>
    </div>
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