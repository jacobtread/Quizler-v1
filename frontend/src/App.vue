<script setup lang="ts">
import "./assets/global.scss"
import Header from "./components/Header.vue";
import { useApi } from "./api";

const {socket, open} = useApi()


</script>
<template>
  <Header/>
  <template v-if="false">
    <h1>Open!</h1>
  </template>
  <template v-else>

    <h1>Connecting...</h1>
    <p>Please wait</p>
  </template>
</template>

