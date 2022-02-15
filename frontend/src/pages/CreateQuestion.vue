<script setup lang="ts">

import Image from "../assets/image.svg?inline"
import Back from "../assets/back.svg?inline"
import Add from "../assets/add.svg?inline"
import Cross from "../assets/cross.svg?inline"
import { useCreateStore } from "../store/create";
import { storeToRefs } from "pinia";
import { onMounted, reactive, ref } from "vue";
import { QuestionData } from "../api/packets";
import { useRouter } from "vue-router"

const store = useCreateStore()

const {questions} = storeToRefs(store)

const question = reactive<QuestionData>({
  question: '',
  answer: 0,
  answers: [
    'Example Answer'
  ],
  title: ''
})

function addAnswer() {
  question.answers.push('')
}

function removeAnswer(index: number) {
  question.answers = question.answers.filter((_, i) => i != index)
  if (question.answer === index) {
    question.answer = 0
  }
}

const router = useRouter()
const fileInput = ref<HTMLInputElement>()

function onFileChange() {
  const input: HTMLInputElement = fileInput.value!
  if (input.files && input.files[0]) {
    const reader = new FileReader()
    reader.onload = function (e) {
      question.image = e.target!.result as string
    }
    reader.readAsDataURL(input.files[0])
  } else {
    question.image = undefined
  }
}

onMounted(() => {
  const input: HTMLInputElement = fileInput.value!
  console.log(input.files)
})

function addQuestion() {
  questions.value.push({
    question: question.question,
    answer: question.answer,
    answers: [...question.answers],
    title: question.title
  })
  router.push({name: 'Create'})
}

function removeImage() {
  question.image = undefined
}

</script>

<template>
  <div class="content">
    <router-link class="back-button" :to="{name: 'Create'}">
      <Back/>
    </router-link>
    <h1 class="title">Add Question</h1>
    <div class="editor">
      <label class="input">
        <span class="input__label">Title</span>
        <input type="text" class="input__value" placeholder="Title" v-model="question.title">
      </label>
      <label class="input input--area">
        <span class="input__label">Question</span>
        <textarea rows="5" cols="10" class="input__value" placeholder="Question" v-model="question.question"/>
      </label>

      <template v-if="question.image">
        <div class="image"
             @click="removeImage"
             :style="{backgroundImage:`url(${question.image})`}"
        >
          <span class="image__text">Click to remove</span>
        </div>
      </template>
      <template v-else>
        <label class="input input--file">
          <Image class="input__image"/>
          <span>Click to add image</span>
          <input ref="fileInput" class="input__file" type="file" accept="image/*" @change="onFileChange">
        </label>
      </template>

      <h2 class="answers__title">Answers</h2>
      <div>
        <transition-group name="slide-fade" appear class="answers" tag="ul">
          <li v-for="(answer, index) of question.answers"
              class="answer"
              :key="index"
              :class="{'answer--selected': question.answer === index}"
          >
            <label class="answer__select">
              <input class="answer__select__radio" type="radio" :value="index" v-model="question.answer">
            </label>
            <input class="answer__value" type="text" v-model="question.answers[index]">
            <Cross class="answer__button" v-if="index !== 0" @click="removeAnswer(index)"/>
          </li>
        </transition-group>
        <button class="add-button" @click="addAnswer">
          <Add class="add-button__icon"/>
        </button>
      </div>
      <button class=" done-button" @click="addQuestion">
        Add
      </button>
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
  opacity: 0;
}

.image {
  margin: 1rem 0;
  position: relative;
  display: block;
  width: 100%;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  height: 300px;

  &__text {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: $primary;
    font-weight: bold;
    background: #222;
    padding: 0.5rem;
    text-shadow: 1px 1px 1px #000;
  }
}

.input {
  display: flex;
  flex-flow: column;

  &__label {
    display: block;
    text-align: left;
    padding: 0.5rem;
    color: #999;
  }

  &__file {
    display: none;
  }

  &__value {
    background-color: transparent;
    font-size: 1.2rem;
    border: 5px solid #333;
    border-radius: 0.25rem;
    padding: 0.5rem;
    color: #CCC;
    outline: none;

    &:focus {
      border-bottom-color: $primary;
    }
  }
}


.content {
  flex: auto;
  display: flex;
  flex-flow: column;
  align-items: center;
  color: white;
}

.title {
  display: inline-block;
  font-size: 1.8rem;
  padding: 1rem;
  background-color: #222;
  border-radius: 1rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.editor {
  display: block;
  width: 100%;
  padding: 1.5rem;
}


.add-button, .done-button {
  display: block;
  cursor: pointer;
  padding: 0.5rem;
  width: 100%;
  background-color: transparent;
  border-radius: 0.5rem;

  border: 5px solid #222;
  color: white;

  &__icon {
    height: 1.5rem;
  }
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
    background-color: #8b4425;

    .answer__select {

      &::after {
        background-color: #CCC;
        transform: scale(1);
      }

    }

    .answer__value {
      background-color: #8b4425;
      border-bottom: 5px solid #222;

      &--active, &:focus {
        border-bottom-color: white;

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