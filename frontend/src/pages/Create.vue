<script setup lang="ts">

import Back from "../assets/back.svg?inline"
import Add from "../assets/add.svg?inline"
import Cross from "../assets/cross.svg?inline"
import Edit from "../assets/edit.svg?inline"
import { useCreateStore } from "../store/create";
import { storeToRefs } from "pinia";

const store = useCreateStore()

const {questions} = storeToRefs(store)

function deleteQuestion(index: number) {
  questions.value = questions.value.filter((_, i) => i != index)
}

</script>

<template>
  <div class="content">
    <router-link class="back-button" :to="{name: 'Home'}">
      <Back/>
    </router-link>
    <div class="editor">
      <h1 class="title">Create Quiz</h1>
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
        <router-link :to="{name: 'CreateQuestion'}" class="add-button">
          <Add class="add-button__icon"/>
        </router-link>
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

.title {
  display: inline-block;
  font-size: 2rem;
  padding: 1rem;
  background-color: #222;
  border-radius: 1rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
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

.add-button {
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