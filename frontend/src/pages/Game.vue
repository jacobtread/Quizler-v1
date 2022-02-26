<script setup lang="ts">

import { useApi } from "@/api";
import { useGameStore } from "@store/game";
import { useRouter } from "vue-router";
import { onMounted, onUnmounted, ref, watch } from "vue";
import packets, { AnswerResultData, QuestionData, ScoresData } from "@api/packets";
import Loader from "@component/Loader.vue";
import Logo from "@asset/logo.svg?inline"

const {socket, players, state} = useApi()

const answered = ref(false);
const result = ref<boolean | null>(null)

const store = useGameStore()
const router = useRouter()

const question = ref<QuestionData | null>(null)

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
  answered.value = false
  result.value = null
  question.value = data
}

function onAnswerResult(data: AnswerResultData) {
  result.value = data.result
}

function onScores(data: ScoresData) {

}

function setAnswer(index: number) {
  answered.value = true
  socket.send(packets.answer(index))
}

onMounted(() => {
  socket.setHandler(0x08, onQuestion)
  socket.setHandler(0x09, onAnswerResult)
  socket.setHandler(0x0A, onScores)
})

onUnmounted(() => {
  socket.clearHandler(0x08)
  socket.clearHandler(0x09)
  socket.clearHandler(0x0A)
})

function getFontSize(text: string): string {
  const fitLength = 100
  if (text.length > fitLength) return '0.7rem'
  const percent = (1 - (text.length / fitLength))
  const size = (percent * 0.8) + 0.7
  return `${size}rem`
}

</script>
<template>
  <div class="content">
    <div class="content loader-wrapper" v-if="question === null">
      <Loader/>
    </div>
    <div v-else-if="!result" class="wrapper question">
      <header>
      <h1>{{store.data.title}}</h1>
      <div></div>
      </header>
      <div class="image-wrapper">
        <div
            v-if="!question.image"
            class="image"
            :style="{backgroundImage: `url(${question.image})`}"
        ></div>
        <div v-else>
          <Logo class="logo"/>
        </div>
      </div>
      <p class="question__text">{{ question.question }}</p>
      <div class="answers">
        <button v-for="(answer, index) in question.answers"
                @click="setAnswer(index)"
                :style="{fontSize: getFontSize(answer)}"
                class="answer">
          {{ answer }}
        </button>
      </div>
    </div>
    <div v-else-if="result === null">
      <h1>Waiting...</h1>
    </div>
    <div v-else>
      <div v-if="result">
        <h1>Correct Answer!</h1>
      </div>
      <div v-else>
        <h1>Incorrect Answer</h1>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
@import "../assets/variables";

.answers {
  display: flex;
  flex-flow: row wrap;
  gap: 0.5rem;
}

.answer {
  flex: auto;
  width: calc(50% - 1rem);
  padding: 1rem;
  border: none;
  text-align: left;
  background-color: #222;
  border-radius: 0.25rem;
  color: white;
  font-size: 1.1rem;
  white-space: pre-wrap;
  line-break: loose;
  text-overflow: ellipsis;
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.2s linear;

  &:hover {
    background: adjust-color($primary, $alpha: -0.5);
  }
}

.image-wrapper {
  flex: auto;
  width: 100%;
}

.image {
  width: 100%;
  height: 100%;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.question {
  max-width: 1200px;
  padding: 1.5rem;
  width: 100%;
}

.question__text {
  width: 100%;
  font-size: 1.25rem;
  background-color: #333;
  padding: 1rem;
}

</style>