<script setup lang="ts">
import Logo from "@asset/icons/logo.svg?inline"
import { useLoaderData } from "@/tools/ui";

const loaderData = useLoaderData(); // Use the loader data
</script>
<template>
    <div class="loader-wrapper" v-if="loaderData.visible">
        <div class="loader-pad">
            <div class="loader">
                <div class="loader__ring"><span class="loader__ring__qu">?</span></div>
                <Logo class="loader__logo"/>
                <p class="loader__text">{{ loaderData.message }}</p>
            </div>
        </div>
    </div>
</template>
<style scoped lang="scss">
@import "../assets/variables";

.loader-wrapper {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;

  background: rgba(0, 0, 0, 0.7);
}


.loader {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: column;
  width: 170px;
  height: 170px;
  position: relative;
  padding: 1rem;
  margin: 1rem;

  &-pad {
    background: $background;
    z-index: -1;
    border-radius: 100%;
  }

  &__ring {

    position: absolute;
    left: 0;
    top: 0;

    width: 170px;
    height: 170px;
    border-radius: 100%;

    border: 5px solid #222;
    border-top-color: $primary;
    animation: rotate 2s cubic-bezier(0.25, 0.46, 0.69, -0.16) infinite;
    z-index: -1;

    &__qu {
      font-size: 2rem;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: 0;
      color: $primary;
    }
  }

  &__logo {
    width: 90px;
    fill: white;
  }

  &__text {
    color: #999;
    margin-top: 0.2rem;
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0) scale(1.1);
  }
  50% {
    transform: rotate(180deg) scale(1);
  }
  100% {
    transform: rotate(360deg) scale(1.1);
  }
}
</style>