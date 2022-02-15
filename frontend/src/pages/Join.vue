<script setup lang="ts">
import { ref, watch } from "vue";
import Back from "../assets/back.svg?inline"
import Play from "../assets/play.svg?inline";

let gameCode = ref('')
let disabled = ref(true)

watch(gameCode, () => {
  const value = gameCode.value.toUpperCase().replace(/[^a-fA-F0-9]/, '')
  gameCode.value = value
  disabled.value = value.length != 5
})

</script>

<template>
  <div class="content">
    <router-link class="back-button" :to="{name: 'Home'}">
      <Back/>
    </router-link>
    <div class="main">
      <h1 class="title">Enter Code</h1>
      <p class="text">Please your quiz code</p>
      <div class="input__wrapper">
        <input class="input"
               :class="{'input--active': !disabled}"
               type="text"
               v-model="gameCode"
               maxlength="5"
               minlength="0"
               placeholder="XXXXX"
        >
        <transition name="button" appear>
          <button class="button" v-if="!disabled" >
            <Play/>
          </button>
        </transition>
      </div>

    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/variables";

.content {
  flex: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.logo {
  max-width: 250px;
  color: white;
}

.main {
  padding: 1rem;
  color: white;
  text-align: center;
}

.title {
  margin-bottom: 0.5rem;
  font-size: 4rem;
}

.text {
  color: #bbbbbb;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.input {
  flex: auto;
  display: block;
  padding: 0.7rem;
  font-size: 3rem;
  width: 100%;
  max-width: 15rem;
  text-align: center;
  background-color: transparent;
  border: 5px solid #222;
  border-bottom: 5px solid white;
  color: white;
  border-radius: 0.5rem;
  outline: none;
  transition: 0.5s ease;
  letter-spacing: 0.25rem;

  &--active, &:focus {
    border-bottom-color: $primary;
  }
}

.input__wrapper {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.button {
  flex: none;
  padding: 1rem;
  border-radius: 1rem;
  border: none;
  cursor: pointer;
  color: white;
  background-color: $primary;
  transition: 0.25s ease;

  display: flex;
  justify-content: center;
  align-items: center;

  overflow: hidden;

  &:disabled {
    background-color: #333;
    cursor: not-allowed;
  }
}

.button-enter-active,
.button-leave-active {
  width: 5rem;
  transform: translateX(0) scale(1);
}

.button-leave-to, .button-enter-from  {
  width: 0;
  transform: translateX(-100%) scale(0);
  opacity: 0;
  padding: 0;
}

</style>