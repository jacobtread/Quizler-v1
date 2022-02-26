<script setup lang="ts">

import { GameState, ServerPacketId, usePacketHandler, useSocket } from "@/api";
import { useRouter } from "vue-router";
import { ref, watch } from "vue";
import packets, { AnswerResultData, QuestionData, ScoresData } from "@api/packets";
import Loader from "@component/Loader.vue";
import Logo from "@asset/logo.svg?inline"

const router = useRouter()
const socket = useSocket()
const {gameState, gameData, question} = socket

const answered = ref(false);
const result = ref<boolean | null>(null)

watch(gameState, () => {
    console.log('State Changed to ' + gameState.value)
    if (gameState.value === GameState.UNSET) { // If we are no longer in a game
        router.push({name: 'Home'}) // Return to the home screen
    }
}, {immediate: true})

watch(question, (data: QuestionData | null) => {
    if (data != null) {
        answered.value = false
        result.value = null
    }
})


function onAnswerResult(data: AnswerResultData) {
    result.value = data.result
}

function setAnswer(index: number) {
    answered.value = true
    socket.send(packets.answer(index))
}

usePacketHandler(socket, ServerPacketId.ANSWER_RESULT, onAnswerResult)

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
        <div v-else-if="!answered" class="wrapper question">
            <header>
                <h1 class="title">{{ gameData.title }}</h1>
                <div></div>
            </header>
            <div class="image-wrapper">
                <div
                        v-if="question.image"
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
  width: 100%;
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
  display: flex;
  justify-content: center;
  align-items: center;
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

.logo {
  max-width: 240px;
  width: 100%;
  flex: auto;

}

.title {
  overflow: hidden;
  text-overflow: ellipsis;
}

</style>