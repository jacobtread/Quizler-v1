<script setup lang="ts">
/*
* Create page (/create) a page for creating new quiz's displays
* a list of questions that can be modified, added, or deleted
*/

import Add from "@asset/add.svg?inline"
import Cross from "@asset/cross.svg?inline"
import Edit from "@asset/edit.svg?inline"
import { store } from "@store/create";
import { useSocket } from "@/api";
import { useRouter } from "vue-router";
import packets, { GameData } from "@api/packets";
import Nav from "@component/Nav.vue";
import { computed, watch } from "vue";

const router = useRouter()
const socket = useSocket()

// Simple computed function to ensure there is at least 1 question
const hasQuestions = computed(() => store.questions.length > 0)

/**
 * Delete the question at the provided index. Filters
 * through the questions and removes whatever is at
 * the provided index
 *
 * @param index The index to remove
 */
function deleteQuestion(index: number) {
    store.questions = store.questions.filter((_, i) => i != index)
}

/**
 * Create a new quiz sends a CreateGame packet (0x04) to the server along
 * with the title and questions of the game. Listens for game join events
 * and sets the screen to the overview screen when it receives one
 */
function createQuiz() {
    // Send the creation game packet
    socket.send(packets.createGame(store.title, store.questions))
}

// Watch the game data for changes
watch(socket.gameData, (data: GameData | null) => {
    if (data != null) { // If we have game data
        // Redirect to the overview page
        router.push({name: 'Overview'})
    }
})

</script>
<template>
    <form @submit.prevent="createQuiz">
        <Nav title="Create Quiz"/>
        <div class="wrapper">
            <main class="main">
                <div class="box">
                    <p class="text">To get started creating your quiz press the
                        <Add class="inline-icon"/>
                        button to add a new question. If you accidentally
                        added a question just press the
                        <Cross class="inline-icon"/>
                        icon to remove it or
                        <Edit class="inline-icon"/>
                        to edit it
                    </p>
                    <label class="input">
                        <span class="input__label">Title</span>
                        <input type="text" class="input__value" placeholder="Title" v-model="store.title" required
                               minlength="1"
                               maxlength="30">
                    </label>
                </div>
                <div class="box">
                    <h2 class="box__title">Questions</h2>
                    <transition-group name="slide-fade">
                        <div class="questions" v-if="store.questions.length > 0">
                            <div v-for="(question, index) of store.questions" :key="index" class="question">
                                <div class="question__head">
                                    <h2 class="question__head__title">{{ question.question }}</h2>
                                    <div class="question__head__buttons">
                                        <router-link :to="{name: 'Modify', params: {edit: index}}"
                                                     class="question__head__button question__head__button--edit">
                                            <Edit class="question__head__button__icon"/>
                                        </router-link>
                                        <button
                                                class="question__head__button question__head__button--delete"
                                                type="button"
                                                @click="deleteQuestion(index)"
                                        >
                                            <Cross class="question__head__button__icon"/>
                                        </button>
                                    </div>
                                </div>
                                <ul class="question__answers">
                                    <li v-for="(answer, index) of question.answers"
                                        class="question__answers__item"
                                        :class="{'question__answers__item--selected': question.values.indexOf(index) !== -1}"
                                    >
                                        {{ answer }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </transition-group>
                    <router-link :to="{name: 'CreateQuestion'}" class="button button--icon button--block">
                        <Add class="button__icon"/>
                    </router-link>
                </div>
                <div class="full__box">
                    <button class="button button--text button--block" type="submit" :disabled="!hasQuestions">
                        Create Quiz
                    </button>
                </div>
            </main>
        </div>
    </form>
</template>

<style scoped lang="scss">
@import "../assets/variables";

.full__box {
  grid-area: full;
}

.main {
  flex: auto;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr calc(2.5rem + 14px);
  grid-template-areas:
    "box1"
    "box2"
    "full";
  align-items: initial;
  margin-bottom: 1rem;
  gap: 1rem;
  width: 100%;
  max-width: 1200px;
  padding: 1rem;
}

.text {
  margin: 1.5rem auto;
  color: #CCCCCC;
  font-size: 1.2rem;
  max-width: 700px;
  line-height: 1.5;
}

.inline-icon {
  width: 1em;
  height: 1em;
  vertical-align: middle;
  box-sizing: content-box;
  color: white;
  background-color: #222;
  padding: 0.2rem;
  margin: 0 0.25em;
  border-radius: 0.25rem;
}


.questions {
  display: flex;
  flex-flow: row wrap;
  width: 100%;
  gap: 1rem;
}

.question {
  flex: auto;
  background-color: #222;
  border-radius: 0.5rem;
  padding: 1.2rem;

  &:nth-last-of-type(1) {
    margin-bottom: 0;
  }

  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;

    &__title {
      flex: auto;
      text-align: left;
      color: #CCCCCC;
    }

    &__buttons {
      display: flex;
      gap: 0.5rem;
    }

    &__button {
      background-color: transparent;
      cursor: pointer;
      color: #777;
      border: none;

      &__icon {
        width: 32px;
        height: 32px;
      }
    }

  }

  &__value {
    font-size: 1.2rem;
    text-align: left;
    color: #AAA;
    margin-top: 0.5rem;
    margin-bottom: 1rem;
  }

  &__answers {
    list-style: none;
    text-align: left;
    display: flex;
    flex-flow: row wrap;
    gap: 1rem;

    &__item {
      flex: auto;
      display: block;
      color: #CCCCCC;
      background-color: #1a1a1a;
      padding: 1.25rem;
      border-radius: 0.5rem;
      font-size: 1.25rem;

      &--selected {
        background-color: adjust-color($primary, $alpha: -0.5);
        padding-left: 0.9rem;
        font-weight: bold;
        color: white;
      }
    }
  }
}

</style>