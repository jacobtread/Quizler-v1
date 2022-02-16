<script setup lang="ts">

import { useApi } from "@/api";
import { useGameStore } from "@store/game";

const {socket} = useApi()

const {joined, data: {owner, title, id}} = useGameStore()


</script>

<template>

</template>

<style scoped lang="scss">
@import "../assets/variables";

</style>