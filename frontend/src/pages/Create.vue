<script setup lang="ts">

import Add from "@asset/add.svg?inline"
import Cross from "@asset/cross.svg?inline"
import Edit from "@asset/edit.svg?inline"
import { useCreateStore } from "@store/create";
import { storeToRefs } from "pinia";
import { useApi } from "@/api";
import { useRouter } from "vue-router";
import { JoinGameData } from "@api/packets";
import { useGameStore } from "@store/game";
import Nav from "@component/Nav.vue";

const store = useCreateStore()
const router = useRouter()
const {socket} = useApi()
const gameState = useGameStore()
const {questions, title} = storeToRefs(store)

function deleteQuestion(index: number) {
  questions.value = questions.value.filter((_, i) => i != index)
}

function createQuiz() {
  socket.createGame(title.value, questions.value)
  socket.events.off('game')
  socket.events.on('game', (data: JoinGameData) => {
    gameState.data = {...data}
    router.push({name: 'Overview'})
  })
}

</script>

<template>
  <div>
    <Nav title="Create Quiz"/>
    <div class="content">
      <div class="editor">
        <p class="text">To get started creating your quiz press the
          <Add class="inline-icon"/>
          button to add a new question. If you accidentally
          added a question just press the
          <Cross class="inline-icon"/>
          icon to remove it or
          <Edit class="inline-icon"/>
          to edit it
        </p>
        <div>
          <label class="input">
            <span class="input__label">Title</span>
            <input type="text" class="input__value" placeholder="Title" v-model="title">
          </label>

          <h2 class="subtitle">Questions</h2>

          <transition-group name="slide-fade">
            <div class="questions" v-if="questions.length > 0">
              <div v-for="(question, index) of questions" :key="index" class="question">
                <div class="question__head">
                  <h2 class="question__head__title">{{ question.title }}</h2>
                  <div class="question__head__buttons">
                    <router-link :to="{name: 'Modify', params: {edit: index}}"
                                 class="question__head__button question__head__button--edit">
                      <Edit class="question__head__button__icon"/>
                    </router-link>
                    <button
                        class="question__head__button question__head__button--delete"
                        @click="deleteQuestion(index)"
                    >
                      <Cross class="question__head__button__icon"/>
                    </button>
                  </div>
                </div>
                <p class="question__value">{{ question.question }}</p>
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
          <router-link :to="{name: 'CreateQuestion'}" class="button">
            <Add class="add-button__icon"/>
          </router-link>
          <button class="button button--create" @click="createQuiz">
            Create Quiz
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/variables";

.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  height: 0;
  opacity: 0;
}

.content {
  flex: auto;
  display: flex;
  flex-flow: column;
  align-items: center;
  color: white;
  overflow-y: auto;
}

.subtitle {
  display: inline-block;
  font-size: 1.5rem;
  padding: 1rem;
  background-color: #222;
  border-radius: 1rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.text {
  color: #CCCCCC;
  font-size: 1.2rem;
  max-width: 700px;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.button {
  display: block;
  cursor: pointer;
  padding: 0.5rem;
  width: 100%;
  background-color: transparent;
  border-radius: 0.5rem;

  border: 5px solid #222;
  color: white;

  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.7);
  }

  &--create {
    font-size: 1.5rem;
    padding: 1rem;
    margin-top: 1rem;
  }
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

.question {
  background-color: #222;
  margin-bottom: 1.5rem;
  border-radius: 0.5rem;
  padding: 1.2rem;

  &__head {
    display: flex;
    align-items: center;

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
    flex-flow: column;
    gap: 1rem;

    &__item {
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