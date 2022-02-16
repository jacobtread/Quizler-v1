<script setup lang="ts">
// Defining properties and emits for model value so v-model can be used
import { QuestionData } from "@/api/packets";

const props = defineProps({
  question: {
    type: Object,
    required: true
  }
})
const question: QuestionData = props.question as QuestionData
const emit = defineEmits(['update:modelValue'])

function addAnswer() {
  question.answers.push('')
}

function removeAnswer(index: number) {
  question.answers = question.answers.filter((_, i) => i != index)
  if (question.values.indexOf(index) != -1) {
    question.values = question.values.filter((_, i) => i != index)
  }
}


</script>

<template>

</template>

<style scoped lang="scss">

</style>