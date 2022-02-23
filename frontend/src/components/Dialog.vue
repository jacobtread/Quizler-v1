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
  <transition appear name="fade">
    <div class="dialog-wrapper" v-if="open">
      <div class="dialog">
        <h2 class="dialog__title">{{ title }}</h2>
        <p class="dialog__message">{{ message }}</p>
        <button class="button button--text button--block" @click="close">Close</button>
      </div>
    </div>
  </transition>
</template>
<style scoped lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
  opacity: 1;

  .dialog {
    transition: transform 0.25s ease;
    transform: translateX(0) scale(1);
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;

  .dialog {
    transform: translateX(-15px) scale(0.5);
  }
}


.dialog-wrapper {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8));

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
  border-radius: 0.5rem;
  flex-flow: column;
  box-shadow: 0 0 10px rgb(0, 0, 0);

  &__title {
    font-size: 1.25rem;
    text-align: left;
    margin-bottom: 0.5rem;
  }

  &__message {
    text-align: left;
    font-size: 1.1rem;
    flex: auto;
    color: #777;

  }
}
</style>