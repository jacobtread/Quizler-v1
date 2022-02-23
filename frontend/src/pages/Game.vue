<script setup lang="ts">

import { useApi } from "@/api";
import { useGameStore } from "@store/game";
import { useRouter } from "vue-router";
import { onMounted, onUnmounted, watch } from "vue";
import { AnswerResult, QuestionData } from "@api/packets";

const {socket, players, state} = useApi()

const store = useGameStore()
const router = useRouter()

// Subscribe to the game store for mutations
store.$subscribe((mutation, state) => {
  if (!state.joined) { // If we are no longer in a game
    router.push({name: 'Home'}) // Return to the home screen
  }
}, {deep: true, immediate: true})

watch(state, () => {
  console.log('State Changed to ' + state.value)
}, {immediate: true})

function onQuestion(data: QuestionData) {
}

function onAnswerResult(data: AnswerResult) {

}

onMounted(() => {
  socket.setHandler(0x08, onQuestion)
  socket.setHandler(0x09, onAnswerResult)
})

onUnmounted(() => {
  socket.clearHandler(0x08)
  socket.clearHandler(0x09)
})
</script>
<template>

</template>
<style scoped lang="scss">
@import "../assets/variables";


</style>