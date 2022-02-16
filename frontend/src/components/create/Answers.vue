<script setup lang="ts">
// Defining properties and emits for model value so v-model can be used
import { QuestionData } from "@/api/packets";
import CrossIcon from "@asset/cross.svg?inline"
import AddIcon from "@asset/add.svg?inline"

// Structure for representing the properties of this component
interface Props {
  // The question this set of answers is for
  question: QuestionData
}

// Retrieving the property reference for the question
const {question} = defineProps<Props>()

/**
 * Adds a new empty question
 */
function add() {
  // Push a new empty answer to the answers
  question.answers.push('')
}

/**
 * Removes the answer at the provided index. Also removes
 * it from the values list
 *
 * @param index The index to remove
 */
function removeAt(index: number) {
  // Sets the question answers to the answers excluding the answer at index
  question.answers = question.answers.filter((_, i) => i != index)
  // If the selected values contains the index
  if (question.values.indexOf(index) != -1) {
    // Filter the values to remove the index
    question.values = question.values.filter(value => value != index)
  }
}
</script>
<template>
  <div>
    <ul class="answers">
      <li v-for="(_, index) of question.answers"
          class="answer"
          :key="index"
          :class="{'answer--selected': question.values.indexOf(index) !== -1}"
      >
        <label class="answer__select">
          <input class="answer__select__radio" type="checkbox" v-model="question.values" :value="index">
        </label>
        <input class="answer__value" type="text" v-model="question.answers[index]">
        <CrossIcon class="answer__button" v-if="index !== 0" @click="removeAt(index)"/>
      </li>
    </ul>
    <button class="button button--icon button--block" @click="add">
      <AddIcon class="button__icon"/>
    </button>
  </div>
</template>

<style scoped lang="scss">
@import "../../assets/variables";

.answers {
  list-style: none;
  width: 100%;
  overflow-y: auto;
  flex: auto;

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
  transition: background-color 0.5s ease, border-left 0.2s ease;
  border-radius: 0.4rem;
  border-left: 0 solid #222;

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
      background-color: #CCC;
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

  &__button {
    cursor: pointer;
    margin: 0.5rem;
    width: 2rem;
    height: 2rem;
    border-radius: 8px;
  }

  &--selected {
    border-left: 5px solid $primary;
    .answer__select {
      &::after {
        transform: scale(1);
      }
    }
  }
}

</style>