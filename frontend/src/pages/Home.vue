<script setup lang="ts">
import Play from "../assets/play.svg?inline";</script>

<template>
  <div class="button-grid">
    <button class="button">
      <Play class="button__icon"/>
      <span class="button__wrap">
          Join a game
          <span class="button__subtext">Enter a game code and hop right in</span>
      </span>
    </button>
    <button class="button">
      <Play class="button__icon"/>
      <span class="button__wrap">
        Create a quiz
        <span class="button__subtext">Create your own quiz</span>
      </span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.button-grid {

  display: flex;
  justify-content: center;

  margin-top: 1rem;

  gap: 1rem;

}

.button {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-flow: row;
  background: #222;

  text-align: left;
  padding: 1.5rem;

  width: 100%;
  max-width: 400px;

  border-radius: 150px;

  color: white;
  font-size: 1.4rem;

  border: none;

  &__logo {
    color: white;
  }

  &__subtext {
    display: block;
    color: #CCCCCC;

    margin-top: 0.5rem;
    font-size: 1.1rem;
  }
}
</style>