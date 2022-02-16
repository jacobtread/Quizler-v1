<script setup lang="ts">
import { computed, ref } from "vue";
import ImageIcon from "@asset/image.svg?inline"

// Defining properties and emits for model value so v-model can be used
const {modelValue} = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

// A reference to the file input element used to access the files
const fileInput = ref<HTMLInputElement>()

// Computed style for using the image as a background image
// sets the background image property to the data url of modelValue
const backgroundStyle = computed(() => ({backgroundImage: `url(${modelValue})`}))

/**
 * Removes the image by updating the modelValue and setting it
 * to undefined. This is called when the image is clicked again
 * after it's been uploaded and will clear the active image.
 */
function removeImage() {
  // Emit the update event with undefined as its value
  emit('update:modelValue', undefined)
}

/**
 * Called when the file selected in the file input changes. Uses a FileReader
 * to convert the file contents into a base64 dataURL which will be used to
 * display the image and for later use.
 */
function onFileChange() {
  const input: HTMLInputElement = fileInput.value!
  // Ensure that there is actually at least 1 file selected
  if (input.files && input.files.length > 0) {
    // Create a new file reader
    const reader = new FileReader()
    reader.onload = () => {
      // Ensure the result is present
      if (reader.result) {
        // Emit the update event
        const dataURL: string = reader.result as string
        emit('update:modelValue', dataURL)
      }
    }
    // Read the file as a data url (so we can get the base64 data url)
    reader.readAsDataURL(input.files[0] /* The first file */)
  }
}
</script>
<template>
  <div class="image-wrapper" v-if="modelValue"> <!-- If we already have an image present -->
    <div class="image"
         @click="removeImage"
         :style="backgroundStyle">
      <span class="image__text">Click to remove</span>
    </div>
  </div>
  <label class="input input--image" v-else>
    <ImageIcon class="input__image"/>
    <span>Click to add image</span>
    <input ref="fileInput" class="input__file" type="file" accept="image/*" @change="onFileChange">
  </label>
</template>

<style scoped lang="scss">
// Importing the variables
@import "../../assets/variables";


.image {
  margin: 1rem 0;
  position: relative;
  display: block;
  width: 100%;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  height: 300px;

  &-wrapper {
    width: 100%;
    background: #333;
    border-radius: 0.5rem;
  }

  &__text {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    color: $primary;
    font-weight: bold;
    background: $background-light;
    padding: 0.5rem;
  }
}

</style>