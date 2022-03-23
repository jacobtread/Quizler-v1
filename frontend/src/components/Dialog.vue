<script setup lang="ts">

import { useDialogData } from "@/tools/ui";

const dialog = useDialogData(); // Use the dialog data

/**
 * Simple close function for non confirm dialogs
 * just closes the dialog
 */
function close() {
    dialog.value = null; // Clear the active dialog
}

/**
 * Called when the user selects one of the buttons. The confirm
 * button will result in value being true and the cancel will
 * result in the value being values. Used by confirm dialogs
 *
 * @param value Whether the user chose true
 */
function action(value: boolean) {
    const action = dialog.value?.action; // Retrieve the close action
    if (action) action(value); // Trigger the close action
    dialog.value = null; // Clear the active dialog
}

</script>
<template>
    <transition appear name="fade" v-if=" dialog != null">
        <div class="dialog-wrapper">
            <div class="dialog">
                <h2 class="dialog__title">{{ dialog.title }}</h2>
                <p class="dialog__message">{{ dialog.content }}</p>
                <div class="dialog__buttons">
                    <template v-if="dialog.action">
                        <button class="button button--text" @click="action(true)">Confirm</button>
                        <button class="button button--text" @click="action(false)">Cancel</button>
                    </template>
                    <template v-else>
                        <button class="button button--text" @click="close">Close</button>
                    </template>
                </div>
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
    line-height: 2;
  }

  &__buttons {
    display: flex;
    flex-flow: row wrap;
    gap: 1rem;

    .button {
      flex: auto;
      font-size: 1.25rem;
    }
  }
}
</style>