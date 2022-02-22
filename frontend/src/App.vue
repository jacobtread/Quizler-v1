<script setup lang="ts">
import "@/assets/global.scss"
import { useApi } from "@/api";
import Loader from "@/components/Loader.vue";

const {socket, players, open} = useApi()

</script>
<template>
  <template v-if="open">
    <div class="content">
      <router-view v-slot="{ Component }">
        <transition name="content">
          <component :is="Component" class="content__item"/>
        </transition>
      </router-view>
    </div>
  </template>
  <template v-else>
    <div class="content loader-wrapper">
      <Loader/>
    </div>
  </template>
</template>

<style lang="scss">
.loader-wrapper {
  flex: auto;
  justify-content: center;
  align-items: center;
}

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