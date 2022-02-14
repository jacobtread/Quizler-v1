<script setup lang="ts">
import Logo from "../assets/logo.svg?inline"</script>
<template>
  <div class="loader">
    <div class="loader__ring"><span class="loader__ring__qu">?</span></div>
    <Logo class="loader__logo"/>
    <p class="loader__text">Loading...</p>
  </div>
</template>
<style scoped lang="scss">
@import "../assets/variables";

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

  &__ring {

    position: absolute;
    left: 0;
    top: 0;
    width: 170px;
    height: 170px;
    border-radius: 100%;
    border: 5px solid $secondary;
    animation: rotate 2s ease-in-out infinite;
    z-index: -1;

    &__qu {
      font-size: 2rem;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: 0;
      color: $secondary;
    }
  }

  &__logo {
    width: 120px;
    fill: $secondary;
  }

  &__text {
    color: $secondary;
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