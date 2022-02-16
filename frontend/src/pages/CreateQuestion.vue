<script setup lang="ts">

import { useCreateStore } from "@store/create";
import { storeToRefs } from "pinia";
import { reactive } from "vue";
import { QuestionData } from "@api/packets";
import { useRoute, useRouter } from "vue-router"
import Nav from "@component/Nav.vue";
import ImageSelector from "@component/create/ImageSelector.vue";
import Answers from "@component/create/Answers.vue";

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
        <Answers :question="question"/>
        <button class="button button--text button--block mt" @click="addQuestion">
          {{ isEdit ? 'Save' : 'Add' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/variables";


.input--area {
  .input__value {
    max-height: 200px;
    resize: vertical;
  }
}

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

</style>