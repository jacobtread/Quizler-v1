<script setup lang="ts">
import Logo from "../assets/logo.svg?inline";</script>

<template>
  <div class="content">
    <Logo class="logo"/>
    <div class="button-grid">
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
</style>