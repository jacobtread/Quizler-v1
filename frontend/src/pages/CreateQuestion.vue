<script setup lang="ts">

import Add from "@asset/add.svg?inline"
import Cross from "@asset/cross.svg?inline"
import { useCreateStore } from "@store/create";
import { storeToRefs } from "pinia";
import { reactive } from "vue";
import { QuestionData } from "@api/packets";
import { useRoute, useRouter } from "vue-router"
import Nav from "@component/Nav.vue";
import ImageSelector from "@component/create/ImageSelector.vue";

const store = useCreateStore()

const {questions} = storeToRefs(store)
const router = useRouter()
const route = useRoute();
let edit: string | undefined | number = route.params.edit as (string | undefined)

const question = reactive<QuestionData>({
  question: '',
  values: [0],
  answers: [
    'Example Answer'
  ],
  title: ''
})

function setFromIndex(index: number) {
  const other = questions.value[index]
  question.question = other.question
  question.values = other.values
  question.answers = other.answers
  question.title = other.title
  question.image = other.image
}

let isEdit = false

if (edit) {
  isEdit = true
  edit = parseInt(edit)
  if (edit >= questions.value.length) {
    router.push({name: 'Create'})
  } else {
    setFromIndex(edit)
  }
}


function addQuestion() {
  const data: QuestionData = {
    question: question.question,
    values: [...question.values],
    answers: [...question.answers],
    title: question.title,
    image: question.image
  }
  if (isEdit) {
    questions.value[edit as number] = data
    router.push({name: 'Create'})
  } else {
    questions.value.push(data)
    router.push({name: 'Create'})
  }
}


</script>

<template>
  <div>

    <Nav title="Add Question" back="Create"/>
    <div class="content">
      <div class="content__box">
        <h2 class="answers__title">Details</h2>
        <label class="input">
          <input type="text" class="input__value" placeholder="Title" v-model="question.title">
        </label>
        <ImageSelector v-model="question.image"/>
        <label class="input input--area">
          <span class="input__label">Question</span>
          <textarea rows="5" cols="10" class="input__value" placeholder="Question" v-model="question.question"/>
        </label>
      </div>
      <div class="content__box">
        <h2 class="answers__title">Answers</h2>
        <div>
          <ul class="answers">
            <li v-for="(answer, index) of question.answers"
                class="answer"
                :key="index"
                :class="{'answer--selected': question.values.indexOf(index) !== -1}"
            >
              <label class="answer__select">
                <input class="answer__select__radio" type="checkbox" v-model="question.values" :value="index">
              </label>
              <input class="answer__value" type="text" v-model="question.answers[index]">
              <Cross class="answer__button" v-if="index !== 0" @click="removeAnswer(index)"/>
            </li>
          </ul>
          <button class="button button--icon button--block" @click="addAnswer">
            <Add class="button__icon"/>
          </button>
        </div>
        <button class="button button--text button--block mt" @click="addQuestion">
          {{ isEdit ? 'Save' : 'Add' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/variables";

.content {
  flex: auto;
  justify-content: space-evenly;
  align-items: flex-start;
  display: flex;
  flex-flow: row;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  gap: 1rem;

  &__box {
    display: block;
    flex: auto;
  }
}

.editor {
  display: block;
  width: 100%;
  padding: 1.5rem;
  max-width: 800px;
}

.done-button {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 1rem;
  letter-spacing: 2px;
  text-transform: uppercase;
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

.answers {
  list-style: none;
  width: 100%;

  &__title {
    margin: 1rem 0;
    color: #CCC;
  }
}

.answer {
  display: flex;
  background-color: #222;
  margin-bottom: 1rem;
  align-items: center;
  justify-content: left;
  transition: background-color 0.5s ease;
  border-radius: 0.4rem;

  &__select {
    position: relative;
    padding: 0.5rem;
    margin: 1rem;
    background-color: #333;
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;

    &::after {
      content: '';
      position: absolute;
      left: 0.3rem;
      top: 0.3rem;
      width: calc(100% - 0.6rem);
      height: calc(100% - 0.6rem);
      border-radius: 0.3rem;
      background-color: transparent;
      transition: background-color 0.2s ease, transform 0.2s ease;
      transform: scale(0);
    }

    &__radio {
      opacity: 0;
    }
  }

  &:nth-of-type(1) {
    .answer__value {
      margin-right: 0.5rem;
    }
  }

  &__value {
    font-size: 1.2rem;
    padding: 0.5rem;
    flex: auto;
    border: none;
    border-bottom: 5px solid #333;
    color: #CCC;
    border-radius: 0.5rem;
    background-color: #222;
    outline: none;

    &--active, &:focus {
      border-bottom-color: $primary;
    }
  }

  &--selected {
    border-left: 5px solid $primary;

    .answer__select {

      &::after {
        background-color: #CCC;
        transform: scale(1);
      }

    }

  }

  &__button {
    cursor: pointer;
    margin: 0.5rem;
    width: 2rem;
    height: 2rem;
    border-radius: 8px;
  }
}


</style>