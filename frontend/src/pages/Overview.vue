<script setup lang="ts">

import { GameState, useApi } from "@/api";
import { useGameStore } from "@store/game";
import { useRouter } from "vue-router";
import Nav from "@component/Nav.vue"
import packets, { TimeSyncData } from "@api/packets";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { events } from "@/events";

const {socket, players, state} = useApi()

const store = useGameStore()
const router = useRouter()

let timeData: TimeSyncData

const startTime = ref(10)

let countInterval: any

// Subscribe to the game store for mutations
store.$subscribe((mutation, state) => {
  if (!state.joined) { // If we are no longer in a game
    router.push({name: 'Home'}) // Return to the home screen
  }
}, {deep: true, immediate: true})

watch(state, () => {
  console.log('State Changed to ' + state.value)

  if (countInterval) {
    clearInterval(countInterval)
    countInterval = undefined
  }


  if (state.value === GameState.STARTED && !store.data.owner) {
    // TODO: Move non host players to the game
  }
}, {immediate: true})

function onTimeSync(data: TimeSyncData) {
  timeData = data
  startTime.value = Math.ceil(data.remaining / 1000)
  if (countInterval) {
    clearInterval(countInterval)
    countInterval = undefined
  }

  countInterval = setInterval(() => {
    console.log('Tick ' + startTime.value)
    if (state.value === GameState.STARTING) {
      if (startTime.value - 1 >= 0) {
        startTime.value -= 1
      }
    } else {
      clearInterval(countInterval)
      countInterval = undefined
    }
  }, 1000)
}


/**
 * Disconnects from the current game
 */

function disconnect() {
  if (store.joined) {
    socket.disconnect()
  }
}

function startGame() {
  // Send the start game packet
  socket.send(packets.start())
}


onMounted(() => {
  events.on('timeSync', onTimeSync)
})

onUnmounted(() => {
  events.off('timeSync', onTimeSync)
})


</script>
<template>
  <form @submit.prevent="startGame">
    <Nav title="Waiting Room" :back-function="disconnect"/>
    <div class="wrapper">
      <h1 class="code">{{ store.data.id }}</h1>
      <h2 class="title">{{ store.data.title }}</h2>
      <template v-if="state === GameState.WAITING">
        <h3 class="status">Waiting to start</h3>
        <form v-if="store.data.owner" @submit.prevent="startGame">
          <button class="button button--text" type="submit">
            Start Game
          </button>
        </form>
        <ul class="players">
          <li v-for="(player, index) of players" :key="index" class="player">
            <span class="player__name">{{ player.name }}</span>
            <button @click="socket.kick(player.id)" v-if="store.data.owner" class="button player__button">Kick</button>
          </li>
        </ul>
      </template>
      <template v-else-if="state === GameState.STARTING">
        <h3 class="status">Game starting in</h3>
        <h2 class="countdown">{{ startTime.toFixed(0) }}s</h2>
      </template>
      <template v-else-if="state === GameState.STARTED">
        <h3 class="status">Game started</h3>
      </template>
    </div>
  </form>
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

.countdown {
  font-size: 5rem;
  color: $primary;
  font-weight: bold;
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