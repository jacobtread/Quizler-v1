<script setup lang="ts">
import { useToastData } from "@/tools/ui";

const toasts = useToastData(); // Retrieve the toast data
</script>
<template>
    <div class="toasts">
        <transition-group name="fade" appear>
            <div class="toast"
                 v-for="toast in toasts"
                 :data-type="toast.mode"
                 :key="toast.id">
                {{ toast.content }}
            </div>
        </transition-group>
    </div>
</template>
<style scoped lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
  transform: translateX(0px) scale(1.0);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.5);
}

.toasts {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  flex-flow: column-reverse;
  gap: 0.5rem;
}

.toast {
  padding: 1rem;
  font-size: 1.25rem;
  background: #2F2F2F;
  border-radius: 0.5rem;

  &[data-type="1"] {
    background: #fa5353;
  }
}
</style>