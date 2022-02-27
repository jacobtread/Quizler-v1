<script setup lang="ts">
import Loader from "@component/Loader.vue";
import { useLoaderData } from "@/tools/ui";

const loaderData = useLoaderData()

</script>
<template>
    <div class="loader-wrapper" v-if="loaderData.visible">
        <Loader :message="loaderData.message"/>
    </div>
</template>
<style scoped lang="scss">
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
</style>