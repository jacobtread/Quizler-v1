<script setup lang="ts">
import { GameState, useGameState, useRequireGame, useSocket, useSyncedTimer } from "@/api";
import { useRouter } from "vue-router";
import Nav from "@component/Nav.vue"
import packets, { States } from "@api/packets";
import { computed } from "vue";

const router = useRouter() // Use the router to change the page route
const socket = useSocket(), {players, gameData, gameState} = socket // Use the socket connection
const syncedTime = useSyncedTimer(socket, 5) // Use a synced timer for the game countdown

useRequireGame(socket) // Require an active game

// Redirect to the Game page if the game state becomes started and the player isn't the host
useGameState(socket, GameState.STARTED, () => {
    if (gameData.value != null && !gameData.value.owner) {
        router.push({name: 'Game'})
    }
    syncedTime.value = 10
})

// Computed state for whether the start game button should be visible (Requires at least 1 player)
const canPlay = computed(() => Object.keys(players).length > 0)

/**
 * Disconnects from the current game
 */
function disconnect() {
    if (gameState.value !== GameState.DOES_NOT_EXIST
        && gameState.value !== GameState.UNSET) { // Ensure the game actually exists
        socket.disconnect() // Disconnect from the game
    }
}

/**
 * Starts the current game (Host only)
 */
function startGame() {
    // Send the start game packet
    socket.send(packets.stateChange(States.START))
}
</script>
<template>
    <form @submit.prevent="startGame">
        <Nav title="Waiting Room" :back-function="disconnect"/>
        <div class="wrapper" v-if="gameData != null">
            <h1 class="code">{{ gameData.id }}</h1>
            <h2 class="title">{{ gameData.title }}</h2>
            <template v-if="gameState === GameState.WAITING">
                <h3 class="status">Waiting to start</h3>
                <form v-if="gameData.owner && canPlay" @submit.prevent="startGame">
                    <button class="button button--text" type="submit">
                        Start Game
                    </button>
                </form>
                <ul class="players">
                    <li v-for="(player, index) of players" :key="index" class="player">
                        <span class="player__name">{{ player.name }}</span>
                        <button @click="socket.kick(player.id)" v-if="gameData.owner" class="button player__button">
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
                <h2>Time remaining</h2>
                <h2 class="countdown">{{ syncedTime.toFixed(0) }}s</h2>
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