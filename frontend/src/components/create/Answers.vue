<script setup lang="ts">
import CrossIcon from "@asset/icons/cross.svg?inline"
import AddIcon from "@asset/icons/add.svg?inline"
import { MAX_ANSWERS } from "@/constants";
import { QuestionDataWithValues } from "@/api";

// Structure for representing the properties of this component
interface Props {
    // The question this set of answers is for
    question: QuestionDataWithValues;
}

// Retrieving the property reference for the question
const {question} = defineProps<Props>();

/**
 * Adds a new empty question
 */
function add() {
    if (question.answers.length < MAX_ANSWERS) { // Ensure we don't let the user add more than 9 answers
        // Push a new empty answer to the answers
        question.answers.push('');
    }
}

/**
 * Removes the answer at the provided index. Also removes
 * it from the values list
 *
 * @param index The index to remove
 */
function removeAt(index: number) {
    // Sets the question answers to the answers excluding the answer at index
    question.answers = question.answers.filter((_, i) => i != index);
    // If the selected values contains the index
    if (question.values!.indexOf(index) != -1) {
        // Filter the values to remove the index
        question.values = question.values!.filter(value => value != index);
    }
}
</script>
<template>
    <div class="wrapper">
        <ul class="answers" role="list">
            <li v-for="(_, index) of question.answers"
                class="answer"
                :key="index"
                :class="{'answer--selected': question.values?.indexOf(index) !== -1}"
            >
                <label class="answer__select">
                    <input class="answer__select__value" type="checkbox" v-model="question.values" :value="index">
                </label>
                <input class="answer__value" type="text" v-model="question.answers[index]">
                <CrossIcon class="answer__button" v-if="index !== 0" @click="removeAt(index)"/>
            </li>
        </ul>
        <button class="button button--icon button--block" @click="add" type="button"
                v-if="question.answers.length < MAX_ANSWERS">
            <AddIcon class="button__icon"/>
        </button>
    </div>
</template>

<style scoped lang="scss">
@import "../../assets/variables";

.answers {
  // Remove the dot list style
  list-style: none;
  // Set full width so it can be set on children
  width: 100%;
}

.answer {
  display: flex;
  background-color: #222;
  margin-bottom: 1rem;
  align-items: center;
  justify-content: left;
  border-radius: 0.4rem;
  border-left: 0 solid #222;
  transition: background-color 0.5s ease, border-left 0.2s ease;

  // Checkbox inside answer
  &__select {
    // Relative positioning so the pseudo element can be positioned
    // relative to it
    position: relative;
    padding: 0.5rem;
    margin: 1rem;
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    background-color: #333;

    // Create the filled in effect
    &::after {
      // Create a new pseudo element
      content: '';
      position: absolute;
      // Move in from left and top by .3 of root font size
      left: 0.3rem;
      top: 0.3rem;
      // Make the width full - double the .3 of the font size for a gap
      width: calc(100% - 0.6rem);
      height: calc(100% - 0.6rem);
      // Round the corners
      border-radius: 0.3rem;

      // Grayish white color
      background-color: #CCC;

      // Add a smooth transition between color and scale
      transition: background-color 0.2s ease, transform 0.2s ease;
      // Set the initial uncheck scale to 0 (not visible)
      transform: scale(0);
    }

    // Hide the underlying checkbox input
    &__value {
      display: none;
    }
  }

  // Remove the margin from the last element
  &:nth-last-of-type(1) {
    margin-bottom: 0;
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
    min-width: 0;
    width: 100%;

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

    // The pseudo checked box
    .answer__select::after {
      // Scale to original scale (1)
      transform: scale(1);
    }
  }
}

</style>