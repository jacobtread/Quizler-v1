<script setup lang="ts">

import Back from "../assets/back.svg?inline"
import Add from "../assets/add.svg?inline"
import Cross from "../assets/cross.svg?inline"
import Edit from "../assets/edit.svg?inline"
import { useCreateStore } from "../store/create";
import { storeToRefs } from "pinia";
import { reactive } from "vue";
import { QuestionData } from "../api/packets";

const store = useCreateStore()

const {questions} = storeToRefs(store)

const question = reactive<QuestionData>({
  question: '',
  answer: 0,
  answers: [],
  title: ''
})

</script>

<template>
  <div class="content">
    <router-link class="back-button" :to="{name: 'Create'}">
      <Back/>
    </router-link>
    <div class="editor">
      <h1 class="title">Add Question</h1>

    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/variables";

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

.text {
  color: #CCCCCC;
  font-size: 1.2rem;
  max-width: 700px;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.add-button {
  cursor: pointer;
  padding: 0.5rem;
  width: 100%;
  background-color: transparent;
  border-radius: 0.5rem;

  border: 5px solid #222;
  color: white;
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