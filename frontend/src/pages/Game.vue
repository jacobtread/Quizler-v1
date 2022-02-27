<script setup lang="ts">

import { GameState, usePacketHandler, useSocket, useSyncedTimer } from "@/api";
import { useRouter } from "vue-router";
import { computed, ref, watch } from "vue";
import packets, { AnswerResultData, QuestionData, SPID } from "@api/packets";
import Logo from "@asset/logo.svg?inline"
import { loading } from "@/tools/ui";

const router = useRouter()
const socket = useSocket()
const {gameState, gameData, question, players} = socket

const sortedPlayers = computed(() => Object.values(players).sort((a, b) => b.score - a.score).slice(0, 5))

const answered = ref(false);
const result = ref<boolean | null>(null)

watch(gameState, () => {
    if (gameState.value === GameState.UNSET) { // If we are no longer in a game
        router.push({name: 'Home'}) // Return to the home screen
    } else if (gameState.value === GameState.STOPPED) {
        router.push({name: 'GameOver'})
    }
}, {immediate: true})

watch(question, (data: QuestionData | null) => {
    if (data != null) {
        answered.value = false
        result.value = null
    } else {
        loading(true)
    }
}, {immediate: true})

function onAnswerResult(data: AnswerResultData) {
    result.value = data.result
}

function setAnswer(index: number) {
    answered.value = true
    socket.send(packets.answer(index))
}

usePacketHandler(socket, SPID.ANSWER_RESULT, onAnswerResult)
const syncedTime = useSyncedTimer(socket, 10)

function getFontSize(text: string): string {
    const fitLength = 100
    if (text.length > fitLength) return '0.7rem'
    const percent = (1 - (text.length / fitLength))
    const size = (percent * 0.8) + 0.7
    return `${size}rem`
}

function randomOf(values: string[]) {
    const index = Math.floor(Math.random() * values.length)
    return values[index]
}

function getRandomText() {
    if (result.value) {
        return randomOf(['You did it!', 'That one was right!', 'Good job!', 'Yup that was it!'])
    } else {
        return randomOf(['Ooops..', 'Yeah not that one...', 'Better luck next time', 'Noooo your other left'])
    }
}

</script>
<template>
    <div class="content">
        <div v-if="question !== null && result !== null" class="result" :class="{'result--correct': result}">
            <template v-if="result">
                <h1 class="result__text">Correct Answer!</h1>
            </template>
            <template v-else>
                <h1 class="result__text">Incorrect Answer</h1>
            </template>
            <p class="result__subtext">{{ getRandomText() }}</p>
            <ul class="players">
                <li class="player" v-for="player of sortedPlayers" :key="player.id">
                    <span class="player__name">{{ player.name }}</span>
                    <span class="player__score">{{ player.score }}</span>
                </li>
            </ul>
        </div>
        <div v-else-if="!answered" class="wrapper question">
            <header class="header">
                <h1 class="title">{{ gameData.title }}</h1>
                <span class="time">{{ syncedTime.toFixed(0) }}s</span>
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
        <div v-else-if="answered" class="waiting">
            <h1 class="waiting__title">Waiting...</h1>
            <p class="waiting__text">Hmm I wonder if you got it right....</p>
        </div>
    </div>
</template>
<style scoped lang="scss">
@import "../assets/variables";

.waiting {
  flex: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: column;
}

.result {
  flex: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  background: linear-gradient(to bottom right, #f35f5f, #933030);
  flex-flow: column;

  &__text {
    margin-bottom: 1rem;
    font-size: 3rem;
    text-shadow: 0 4px 0 #933030;
  }

  &__subtext {
    margin-bottom: 1rem;
    font-size: 1.25rem;
    color: #DDD;
    text-shadow: 0 2px 0 #a83939;
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 0.25rem;
    padding: 0.5rem;
  }

  &--correct {
    background: linear-gradient(to bottom right, #80ff80, #359235);

    .result__text {
      text-shadow: 0 4px 0 #359235;
    }

    .result__subtext {
      text-shadow: 0 2px 0 #5b8e5b;
    }
  }
}

.players {
  list-style: none;
  width: 100%;
  max-width: 400px;
}

.player {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  background-color: rgba(0, 0, 0, 0.25);
  border-radius: 0.25rem;
  font-size: 1.3rem;
  align-items: center;
  width: 100%;
  justify-content: space-between;

  &__name {
    flex: auto;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__score {
    color: white;
    font-weight: bold;
    padding: 0.5rem;
    background-color: rgba(0, 0, 0, 0.25);

  }
}

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