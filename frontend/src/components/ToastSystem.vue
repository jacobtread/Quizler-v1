<script setup lang="ts">

import { ref } from "vue";

export enum ToastType {
  INFO,
  ERROR,
  WARNING
}

export interface Toast {
  id: number;
  type: ToastType;
  content: string;
}

const toasts = ref<Toast[]>([])


</script>
<template>

</template>
<style scoped lang="scss">

</style>