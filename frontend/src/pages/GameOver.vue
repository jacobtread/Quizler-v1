<script setup lang="ts">
import { GameState, PlayerData, useClient } from "@/api";
import { useRouter } from "vue-router";
import { ref } from "vue";
import CrownIcon from "@asset/icons/crown.svg?inline"
import Nav from "@component/Nav.vue";

const router = useRouter();
const client = useClient();
const {gameState, gameData, players} = client;

const firstPlace = ref<PlayerData | null>(null); // The player data for first place
const secondPlace = ref<PlayerData | null>(null); // The player data for second place
const thirdPlace = ref<PlayerData | null>(null); // The player data for third place

if (gameData.value === null || gameState.value !== GameState.STOPPED) { // If we don't have a game
    router.push({name: 'Home'}); // Return to the home screen
} else {
    const p = Object.values(players).sort((a, b) => b.score - a.score);
    if (p.length > 0) firstPlace.value = p[0];
    if (p.length > 1) secondPlace.value = p[1];
    if (p.length > 2) thirdPlace.value = p[2];
}

// Disconnects from the current game
function disconnect() {
    if (gameState.value !== GameState.DOES_NOT_EXIST
        && gameState.value !== GameState.UNSET) { // Ensure the game actually exists
        client.disconnect(); // Disconnect from the game
    }
}
</script>
<template>
    <div class="content">
        <Nav title="Game Over" :back-function="disconnect"/>
        <div class="wrapper" v-if="gameData != null">
            <h1 class="title">{{ gameData.title }}</h1>
            <div class="players">
                <div class="player-slot player-slot--second" v-if="secondPlace!= null">
                    <h1 class="player-slot__place">2<span>nd</span></h1>
                    <h2 class="player-slot__score">{{ secondPlace.score }}</h2>
                    <h3 class="player-slot__name">{{ secondPlace.name }}</h3>
                </div>
                <div class="player-slot player-slot--first" v-if="firstPlace != null">
                    <CrownIcon class="player-slot__crown"/>
                    <h1 class="player-slot__place">1<span>st</span></h1>
                    <h2 class="player-slot__score">{{ firstPlace.score }}</h2>
                    <h3 class="player-slot__name">{{ firstPlace.name }}</h3>
                </div>
                <div class="player-slot player-slot--third" v-if="thirdPlace != null">
                    <h1 class="player-slot__place">3<span>rd</span></h1>
                    <h2 class="player-slot__score">{{ thirdPlace.score }}</h2>
                    <h3 class="player-slot__name">{{ thirdPlace.name }}</h3>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped lang="scss">
@import "../assets/variables";

.title {
  margin-bottom: 5rem;
}

.wrapper {
  overflow: hidden;
}

.players {
  display: flex;
  justify-content: space-evenly;
  width: 100%;
  gap: 1rem;
  max-width: 1000px;
  padding: 3rem;
}

.player-slot {
  position: relative;
  background-color: #222;
  flex: auto;
  padding: 1rem 1rem 2rem;
  gap: 1rem;

  &__place {
    margin-bottom: 1rem;
    color: #888;
    font-size: 3rem;
    position: relative;

    span {
      color: #444;
      font-size: 1.25rem;
      margin-left: 0.1rem;
      position: absolute;
      bottom: 0.5rem;
    }
  }

  &__name {
    width: 100%;
    text-align: center;
    line-break: normal;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  &__score {
    color: $primary;
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  &--first {
    transform: translateY(-35px);
    padding-top: 1.25rem;

    .player-slot__score {
      font-size: 3rem;
    }
  }

  &__crown {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(25%, -50%) rotateZ(30deg);
    width: 64px;
  }
}

@media screen and (max-width: 820px) {
  .title {
    margin-bottom: 0.5rem;
  }

  .players {
    flex-wrap: wrap;
    gap: 3rem;
    flex-flow: column;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  .player-slot {
    flex: auto;
    width: 100%;
    max-width: none;

    &--first {
      transform: translateY(0);
    }
  }
}

@media screen and (max-width: 300px) {
  .players {
    gap: 1rem;
    padding: 1rem;
  }
}
</style>