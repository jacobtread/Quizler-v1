<script setup lang="ts">
import { ref } from "vue";
import ImageIcon from "@asset/icons/image.svg?inline"
import imageCompression from "browser-image-compression"
import { dialog, loading, toast } from "@/tools/ui";
import { arrayToDataUrl } from "@/tools/binary";

// Defining properties and emits for model value so v-model can be used
const {image, base64, type} = defineProps(['image', 'base64', 'type'])
const emit = defineEmits(['update:image', 'update:base64', 'update:type'])

// A reference to the file input element used to access the files
const fileInput = ref<HTMLInputElement>()

/**
 * Removes the image by updating the modelValue and setting it
 * to undefined. This is called when the image is clicked again
 * after it's been uploaded and will clear the active image.
 */
function removeImage() {
    // Emit the update event with undefined as its value
    emit('update:image', new Uint8Array(0))
    emit('update:base64', undefined)
    emit('update:type', undefined)
}

/**
 * Called when the file selected in the file input changes. Asynchronously
 * compresses and converts the image to a data url using loadImage
 */
async function onFileChange() {
    const input: HTMLInputElement = fileInput.value!
    // Ensure that there is actually at least 1 file selected
    if (input.files && input.files.length > 0) {
        // Retrieve the first file
        const file = input.files[0]
        try {
            loading(true, 'Loading Image...') // Show a loader while we upload
            const imageBuffer = await loadImage(file) // Async load the image data
            const base64 = arrayToDataUrl(file.type, imageBuffer)
            emit('update:type', file.type) // Emit the changes
            emit('update:image', imageBuffer) // Emit the changes
            emit('update:base64', base64) // Emit the changes
            loading(false) // Hide the loader
            toast('Image Uploaded') // Show a toast saying the image was uploaded
        } catch (e) {
            console.error(e)
            dialog('Failed to load', 'The image you tried to upload failed to load. Try uploading it again and if it continues to fail use another image')
        }
    }
}

/**
 * Async function for compressing and converting an image file into
 * a data url (https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs)
 *
 * @param file The image file to load and compress
 */
function loadImage(file: File): Promise<Uint8Array> {
    return new Promise<Uint8Array>(async (resolve, reject) => {
        if (file.size >= (1024 * 2) * 1000) { // If the image is larger than 2mb
            // Compress the image file try and get the file size down to 800kb
            file = await imageCompression(file, {maxSizeMB: 0.8});
        }

        const reader: FileReader = new FileReader() // Create a new file reader
        reader.onload = () => { // Set the loaded listener
            if (reader.result) { // Ensure the result exits
                resolve(new Uint8Array(reader.result as ArrayBuffer)) // Resolve the promise with the value
            }
        }
        // Set the error listener as the reject function
        reader.onerror = reject
        // Read the compressed file into a data url these can be used directly as the source for image tags
        reader.readAsArrayBuffer(file)
    })
}

</script>
<template>
    <div class="image-wrapper" v-if="base64"> <!-- If we already have an image present -->
        <div class="image"
             @click="removeImage"
             :style="{backgroundImage: `url(${base64})`}">
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
  position: relative;
  display: block;
  width: 100%;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  height: 100%;

  &-wrapper {
    position: relative;
    flex: auto 4 0;
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