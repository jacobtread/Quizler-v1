<script setup lang="ts">

import { useApi } from "@/api";
import { useGameStore } from "@store/game";
import { useRouter } from "vue-router";
import Nav from "@component/Nav.vue"

const {socket, players} = useApi()

const store = useGameStore()
const router = useRouter()

// Subscribe to the game store for mutations
store.$subscribe((mutation, state) => {
  if (!state.joined) { // If we are no longer in a game
    router.push({name: 'Home'}) // Return to the home screen
  }
}, {deep: true, immediate: true})

/**
 * Disconnects from the current game
 */
function disconnect() {
  if (store.joined) {
    socket.disconnect()
  }
}

</script>
<template>
  <div>
    <Nav title="Waiting Room" :back-function="disconnect"/>
    <div class="wrapper">
      <h1 class="code">{{ store.data.id }}</h1>
      <h2 class="title">{{ store.data.title }}</h2>
      <h3 class="status">Waiting to start</h3>
      <ul class="players">
        <li v-for="(player, index) of players" :key="index" class="player">
          <span class="player__name">{{ player.name }}</span>
          <button @click="socket.kick(player.id)" v-if="store.data.owner" class="button player__button">Kick</button>
        </li>
      </ul>
    </div>
  </div>
</template>
<style scoped lang="scss">
@import "../assets/variables";

.title {
  font-size: 2rem;
}

.status {
  font-size: 1.25rem;
  color: #999;
}

.code {
  color: $primary;
  font-weight: bold;
  font-size: 4rem;
}

.players {
  display: flex;
  justify-content: center;
  flex-flow: row;
  flex-wrap: wrap;
  list-style: none;
  max-width: 500px;
  width: 100%;
  gap: 1rem;

}

.player {
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: space-between;
  background: #222;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: 1.25rem;
  gap: 0.5rem;

  &__name {
    font-weight: bold;
    letter-spacing: 1px;
    padding-left: 0.5rem;
  }

  &__button {
    background: #333;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.1rem;
    font-size: 1rem;
    opacity: 0.25;
    transition: opacity 0.25s ease;

    &:hover {
      opacity: 1;
    }
  }
}

</style>