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
    <div class="wrapper">
      <main class="main">
        <div class="box">
          <h2 class="box__title">Details</h2>
          <label class="input">
            <input type="text" class="input__value" placeholder="Title" v-model="question.title">
          </label>
          <ImageSelector v-model="question.image"/>
          <label class="input input--area question-text">
            <span class="input__label">Question</span>
            <textarea rows="5" cols="10" class="input__value" placeholder="Question" v-model="question.question"/>
          </label>
        </div>
        <div class="box">
          <h2 class="box__title">Answers</h2>
          <Answers :question="question"/>
        </div>
        <div class="full__box">
          <button class="button button--text button--block" @click="addQuestion">
            {{ isEdit ? 'Save' : 'Add' }}
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/variables";


.input--area {
  .input__value {
    flex: auto;
    resize: vertical;
  }
}

.question-text {
  flex: auto;
}

.full__box {
  grid-area: full;
}

.main {
  flex: auto;
  display: grid;
  grid-template-rows: 1fr calc(2.5rem + 14px);
  grid-template-areas:
    "box1 box2"
    "full full";
  align-items: initial;
  margin-bottom: 1rem;
  gap: 1rem;
  width: 100%;
  max-width: 1200px;
  padding: 1rem;
}

@media screen and (max-width: 824px) {
  .main {
    grid-template-rows: 1fr  1fr calc(2.5rem + 14px);
    grid-template-areas:
      "box1"
      "box2"
      "full";
  }
}

.box {
  display: flex;
  flex-flow: column;
  flex: auto;

  &:nth-child(1) {
    grid-area: box1;
  }

  &:nth-child(2) {
    grid-area: box2;
  }

  &__title {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    padding-left: 0.5rem;
    color: #888;
    text-align: left;
    border-bottom: 2px solid #222;
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