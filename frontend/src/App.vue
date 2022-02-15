<script setup lang="ts">
import "./assets/global.scss"
import Header from "./components/Header.vue";
import { useApi } from "./api";
import Loader from "./components/Loader.vue";
import { computed } from "vue";

const {socket, players, open} = useApi()

</script>
<template>
  <Header/>
  <template v-if="open">
    <div class="content">
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" class="content__item"/>
        </transition>
      </router-view>
    </div>
  </template>
  <template v-else>
    <div>
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
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }
}


.fade-enter-active,
.fade-leave-active {
  transition: transform 0.5s ease;
  transform: translateX(0) scale(1);
}

.fade-enter-from {
  transform: translateX(100%) scale(0.5);
}

.fade-leave-to {
  transform: translateX(-100%) scale(0.5);
}

</style>