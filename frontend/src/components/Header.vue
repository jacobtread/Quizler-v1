<script setup lang="ts">
import Logo from "../assets/logo.svg?inline";</script>
<template>
  <header class="header">
    <Logo :height="48"/>
    <nav class="nav">

    </nav>
  </header>
</template>

<style scoped lang="scss">
@import "../assets/global";

.header {
  background: linear-gradient(to right, $primary, $secondary);
  color: white;
  padding: 1rem;
}
</style>