<script setup lang="ts">
import { GameState, useClient, useGameState, useRequireGame, useSyncedTimer } from "@/api";
import { useRouter } from "vue-router";
import Nav from "@component/Nav.vue"
import { StateChangePacket, States } from "@api/packets";
import { computed, ref, watch } from "vue";
import { confirmDialog } from "@/tools/ui";

const router = useRouter(); // Use the router to change the page route
const client = useClient(), {players, gameData, gameState, self, question} = client; // Use the socket connection
const syncedTime = useSyncedTimer(client, 5); // Use a synced timer for the game countdown

useRequireGame(client); // Require an active game

// Redirect to the Game page if the game state becomes started and the player isn't the host
useGameState(client, GameState.STARTED, () => {
    if (gameData.value != null && !gameData.value.owner) {
        router.push({name: 'Game'})
    }
    syncedTime.value = 10
})

// Computed state for whether the start game button should be visible (Requires at least 1 player)
const canPlay = computed(() => Object.keys(players).length > 0);

// Disconnects from the current game
function disconnect() {
    if (gameState.value !== GameState.DOES_NOT_EXIST
        && gameState.value !== GameState.UNSET) { // Ensure the game actually exists
        client.disconnect(); // Disconnect from the game
    }
}

// Starts the current game (Host only)
function startGame() {
    // Send the start game packet
    client.socket.send(StateChangePacket, {state: States.START});
}

const skipEnabled = ref(false);

/**
 * Skips the current question (Host only)
 */
async function skipQuestion() {
    if (skipEnabled.value) {
        // Prompt the user whether to skip
        const confirm = await confirmDialog('Confirm Skip', 'Are you sure you want to skip this question?');
        if (!confirm) return; // If the user pressed cancel
        client.socket.send(StateChangePacket, {state: States.SKIP});
        syncedTime.value = 10; // Reset the synced time
        skipEnabled.value = false; // Disable the skip button
        setTimeout(() => { // Enable the skip button in 1.5s
            skipEnabled.value = true;
        }, 1500);
    }
}

// Watch for changes to the question
watch(question, data => {
    if (data === null) {
        skipEnabled.value = false // Disable the skip button
        setTimeout(() => { // Enable the skip button in 1.5s
            skipEnabled.value = true
        }, 1500)
    }
}, {immediate: true});
</script>
<template>
    <div class="content">
        <Nav title="Waiting Room" :back-function="disconnect"/>
        <div class="wrapper" v-if="gameData != null">
            <h1 class="code">{{ gameData.id }}</h1>
            <h2 class="title">{{ gameData.title }}</h2>
            <template v-if="gameState === GameState.WAITING">
                <h3 class="status">Waiting to start</h3>
                <template v-if="gameData.owner">
                    <button class="button button--text" v-if="canPlay" @click="startGame" type="button">
                        Start Game
                    </button>
                    <ul class="players">
                        <li v-for="(player, index) of players" :key="index" class="player">
                            <span class="player__name">{{ player.name }}</span>
                            <button @click="client.kick(player.id)" class="button player__button">
                                Kick
                            </button>
                        </li>
                    </ul>
                </template>
                <template v-else>
                    <h4 class="name">{{ self?.name }}</h4>
                </template>
            </template>
            <template v-else-if="gameState === GameState.STARTING">
                <h3 class="status">Game starting in</h3>
                <h2 class="countdown">{{ syncedTime.toFixed(0) }}s</h2>
            </template>
            <template v-else-if="gameState === GameState.STARTED">
                <h3 class="status">Game started</h3>
                <button class="button button--text" :disabled="!skipEnabled" @click="skipQuestion" type="button">
                    Skip Question
                </button>
                <h2>Time remaining</h2>
                <h2 class="countdown">{{ syncedTime.toFixed(0) }}s</h2>
                <ul class="players">
                    <li v-for="(player, index) of players" :key="index" class="player">
                        <span class="player__name">{{ player.name }}</span>
                        <span class="player__score">{{ player.score ?? 0 }}</span>
                    </li>
                </ul>
            </template>
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

.countdown {
  font-size: 5rem;
  color: $primary;
  font-weight: bold;
}

.players {
  display: flex;
  justify-content: center;
  flex-flow: column;
  max-width: 700px;
  width: 100%;
  gap: 1rem;

}

.player {
  flex: auto;
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