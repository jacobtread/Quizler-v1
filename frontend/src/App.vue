<script setup lang="ts">
import "./assets/global.scss"
import Header from "./components/Header.vue";
import { useApi } from "./api";
import Loader from "./components/Loader.vue";

const {socket, open} = useApi()


</script>
<template>
  <Header/>
  <template v-if="open">
    <div>

    </div>
  </template>
  <template v-else>
    <div>
      <Loader/>
    </div>
  </template>
</template>

<style lang="scss">

</style>