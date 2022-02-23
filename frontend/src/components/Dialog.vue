<script setup lang="ts">

import { ref } from "vue";
import { DialogData, events } from "@/events";

const open = ref(false)
const title = ref('')
const message = ref('')

events.on('dialog', (data: DialogData) => {
  open.value = true
  title.value = data.title
  message.value = data.content
})

function close() {
  open.value = false
}

</script>
<template>
  <div class="dialog-wrapper" v-if="open">
    <div class="dialog">
      <h2 class="dialog__title">{{ title }}</h2>
      <p class="dialog__message">{{ message }}</p>
      <button class="button button--text button--block" @click="close">Close</button>
    </div>
  </div>
</template>
<style scoped lang="scss">
.dialog-wrapper {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);

  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog {
  display: flex;
  background: #111;
  padding: 1rem;
  max-width: 400px;
  width: 100%;
  min-height: 200px;
  border: 1px solid #333;
  border-radius: 0.5rem;
  flex-flow: column;

  &__title {
    font-size: 1.25rem;
    text-align: left;
    margin-bottom: 0.5rem;
  }

  &__message {
    text-align: left;
    font-size: 1rem;
    flex: auto;

  }
}
</style>