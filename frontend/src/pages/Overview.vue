<script setup lang="ts">

import { GameState, useGameState, usePlayers, useSocket, useSyncedTimer } from "@/api";
import { useGameStore } from "@store/game";
import { useRouter } from "vue-router";
import Nav from "@component/Nav.vue"
import packets from "@api/packets";
import { computed, watch } from "vue";

const socket = useSocket()

const players = usePlayers(socket)
const gameState = useGameState(socket)
const syncedTime = useSyncedTimer(socket, 5)

const store = useGameStore()
const router = useRouter()


const canPlay = computed(() => Object.keys(players).length > 0)

// Subscribe to the game store for mutations
store.$subscribe((mutation, state) => {
    if (!state.joined) { // If we are no longer in a game
        router.push({name: 'Home'}) // Return to the home screen
    }
}, {deep: true, immediate: true})

watch(gameState, () => {
    console.log('State Changed to ' + gameState.value)
    if (gameState.value === GameState.STARTED && !store.data.owner) {
        router.push({name: 'Game'})
    }
}, {immediate: true})

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

</script>
<template>
    <form @submit.prevent="startGame">
        <Nav title="Waiting Room" :back-function="disconnect"/>
        <div class="wrapper">
            <h1 class="code">{{ store.data.id }}</h1>
            <h2 class="title">{{ store.data.title }}</h2>
            <template v-if="gameState === GameState.WAITING">
                <h3 class="status">Waiting to start</h3>
                <form v-if="store.data.owner && canPlay" @submit.prevent="startGame">
                    <button class="button button--text" type="submit">
                        Start Game
                    </button>
                </form>
                <ul class="players">
                    <li v-for="(player, index) of players" :key="index" class="player">
                        <span class="player__name">{{ player.name }}</span>
                        <button @click="socket.kick(player.id)" v-if="store.data.owner" class="button player__button">
                            Kick
                        </button>
                    </li>
                </ul>
            </template>
            <template v-else-if="gameState === GameState.STARTING">
                <h3 class="status">Game starting in</h3>
                <h2 class="countdown">{{ syncedTime.toFixed(0) }}s</h2>
            </template>
            <template v-else-if="gameState === GameState.STARTED">
                <h3 class="status">Game started</h3>
                <ul class="players">
                    <li v-for="(player, index) of players" :key="index" class="player">
                        <span class="player__name">{{ player.name }}</span>
                        <span>{{ player.score ?? 0 }}</span>
                    </li>
                </ul>
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