<script setup lang="ts">
// Import the back icon as an inline svg
import BackIcon from "@asset/icons/back.svg?inline"

// Define the properties
defineProps({
    // Property for the name of this page
    title: {
        type: String,
        required: true
    },
    // Property for the target page for the back button
    back: {
        type: String,
        default: 'Home'
    },
    backFunction: {
        type: Function,
        default: () => null
    }
});
</script>
<template>
    <div class="nav" role="navigation">
        <router-link class="back-button" :to="{name: back}" @click="backFunction">
            <BackIcon/>
        </router-link>
        <h1 class="title">{{ title }}</h1>
    </div>
</template>
<style scoped lang="scss">
@import "../assets/variables";

.nav {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem;
}

.title {
  font-size: 1.2rem;
  padding: 1rem;
  background-color: #222;
  border-radius: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #CCC;
}

.back-button {
  padding: 0.5rem;
  background: #222;
  color: white;
  display: flex;
  justify-content: center;
  align-content: center;
  border-radius: 0.5rem;
  transition: background-color 0.25s ease, transform 0.2s ease;

  &:active {
    transform: scale(0.9);
  }

  &:hover {
    background: $primary;
  }
}

@media screen and (max-width: 300px) {
  .title {
    display: none;
  }

  .back-button {
    width: 100%;
  }
}
</style>