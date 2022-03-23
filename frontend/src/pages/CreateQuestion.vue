<script setup lang="ts">
import { store } from "@store/create";
import { reactive } from "vue";
import { useRoute, useRouter } from "vue-router"
import Nav from "@component/Nav.vue";
import ImageSelector from "@component/create/ImageSelector.vue";
import Answers from "@component/create/Answers.vue";
import { QuestionDataWithValues } from "@/api";

const router = useRouter();
const route = useRoute();

// A reactive object for the question data
const question = reactive<QuestionDataWithValues>({
    imageType: '',
    image: new Uint8Array(0),
    question: '',
    values: [0],
    answers: ['Example Answer'],
});

// Whether we are editing an existing question
let isEdit = false;
// The edit url parameter if present should be a string (we will convert it to an int)
let edit: any = route.params.edit;
if (edit) { // If the edit id is present
    isEdit = true;
    edit = parseInt(edit); // Convert the id to a number
    if (!isNaN(edit) && edit >= store.questions.length) { // If the question doesn't exist
        router.push({name: 'Create'}); // Return to the create page
    } else {
        // Set from the old question
        setFromIndex(edit);
    }
}

/**
 * Sets the question values from the existing question
 * at the provided index
 *
 * @param index The index of the existing question
 */
function setFromIndex(index: number) {
    const other = store.questions[index];
    question.question = other.question;
    question.values = other.values;
    question.answers = other.answers;
    question.image = other.image;
    question.imageBase64 = other.imageBase64;
    question.imageType = other.imageType;
}

/**
 * Creates a copy of the current question and either adds it to
 * the list of questions if we are creating a question or replaces
 * the existing question if we are editing then changes back to the
 * create page
 */
function addQuestion() {
    // Copy the question data so that it's not reactive anymore
    const data: QuestionDataWithValues = {
        question: question.question,
        values: [...(question.values as number[])],
        answers: [...question.answers],
        imageType: question.imageType,
        image: question.image,
        imageBase64: question.imageBase64
    }
    // If we are in edit mode
    if (isEdit) {
        // Replace the existing question
        store.questions[edit as number] = data;
    } else {
        // Add the new question
        store.questions.push(data);
    }
    // Return to the create page
    router.push({name: 'Create'});
}
</script>
<template>
    <form @submit.prevent="addQuestion">
        <Nav title="Add Question" back="Create"/>
        <div class="wrapper">
            <main class="main">
                <div class="box">
                    <h2 class="box__title">Details</h2>
                    <ImageSelector v-model:image="question.image"
                                   v-model:base64="question.imageBase64"
                                   v-model:type="question.imageType"
                    />
                    <label class="input input--area question-text">
                        <textarea rows="5" cols="10" class="input__value" placeholder="Question"
                                  v-model="question.question" required/>
                    </label>
                </div>
                <div class="box">
                    <h2 class="box__title">Answers</h2>
                    <Answers :question="question"/>
                </div>
                <div class="full__box">
                    <button class="button button--text button--block" type="submit">
                        {{ isEdit ? 'Save' : 'Add' }}
                    </button>
                </div>
            </main>
        </div>
    </form>
</template>
<style scoped lang="scss">
@import "../assets/variables";

.input--area {
  .input__value {
    flex: auto;
    resize: none;
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