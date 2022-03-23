<script setup lang="ts">
import { ref, watch } from "vue";
import Play from "@asset/icons/play.svg?inline";
import { GameState, useClient, usePacketHandler } from "@/api";
import { CheckNameTakenPacket, NameTakenResultPacket, RequestGameStatePacket, RequestJoinPacket, } from "@api/packets";
import { useRouter } from "vue-router";
import Nav from "@component/Nav.vue";
import { dialog, loading } from "@/tools/ui";

const router = useRouter(); // Use the router so we can change the page
const client = useClient(), {gameData, gameState} = client; // Use the game state and data from the socket

let gameCode = ref(''); // The current game code
let disabled = ref(true); // Whether the join button should be enabled
const name = ref(''); // The name the player has entered
const hasGame = ref(false); // Whether the player has entered a game code

watch(gameCode, (code: string) => { // Watch for changes in the game code
    const value = code.replace(/[^a-fA-F0-9]/, ''); // Replace any chars that aren't a - f 0 - 9 with nothing
    gameCode.value = value.toUpperCase(); // Update the game code with the new code in all capitals
    disabled.value = value.length != 5; // Change the enabled state if the code is 5 chars long
})

watch(gameData, data => { // When the game data is received
    if (data != null) {
        // Redirect to the overview page
        router.push({name: 'Overview'});
    }
})

watch(gameState, (data: GameState) => { // When the game state changed
    if (data === GameState.WAITING) { // The waiting state means we have joined a game
        hasGame.value = true;
    } else if (data === GameState.DOES_NOT_EXIST) { // The game didn't exist
        dialog('Invalid code', 'The quiz code you entered doesn\'t seem to exist.');
        gameState.value = GameState.UNSET;
    } else if (data === GameState.STARTED || data === GameState.STOPPED) { // The game already started or finished
        const reason = data === GameState.STARTED ? 'started' : 'finished';
        dialog('Cannot Join', `That game has already ${reason} you are unable to join it now.`);
    }
    loading(false);
});

/**
 * Checks if the game exists, displays a loader and
 * resets the has game state.
 */
function checkGameExists() {
    loading(true, 'Checking Game'); // Display a checking loader
    hasGame.value = false; // Reset the has game state
    client.socket.send(RequestGameStatePacket, {id: gameCode.value}); // Send request join packet
}

/**
 * Checks with the server to see if the name
 * is already taken
 */
function checkName() {
    // Sends a check name taken packet for the game
    client.socket.send(CheckNameTakenPacket, {id: gameCode.value, name: name.value});
}

// Listen for name taken result packets
usePacketHandler(client, NameTakenResultPacket, ({result}) => {
    if (result) { // If the name is already taken
        dialog('Name taken', 'That name is already in use. Please choose another');
    } else {
        // Send a join request
        client.socket.send(RequestJoinPacket, {id: gameCode.value, name: name.value});
    }
});
</script>
<template>
    <div class="content">
        <Nav title="Join"/>
        <div class="wrapper main">
            <template v-if="hasGame">
                <h1 class="title">Enter Name</h1>
                <p class="text">Please you name for the game</p>
                <form class="input__wrapper" @submit.prevent="checkName">
                    <input class="input"
                           :class="{'input--active': !disabled}"
                           type="text"
                           v-model="name"
                           required
                           maxlength="12"
                           minlength="1"
                           placeholder="Name"
                    >
                    <transition name="button" appear>
                        <button class="button" v-if="!disabled" type="submit">
                            <Play/>
                        </button>
                    </transition>
                </form>
            </template>
            <template v-else>
                <h1 class="title">Enter Code</h1>
                <p class="text">Please your quiz code</p>
                <form class="input__wrapper" @submit.prevent="checkGameExists">
                    <input class="input"
                           :class="{'input--active': !disabled}"
                           type="text"
                           v-model="gameCode"
                           required
                           maxlength="5"
                           minlength="5"
                           placeholder="XXXXX"
                    >
                    <transition name="button" appear>
                        <button class="button" v-if="!disabled" type="submit">
                            <Play/>
                        </button>
                    </transition>
                </form>
            </template>
        </div>
    </div>
</template>
<style scoped lang="scss">
@import "../assets/variables";

.content {
  flex: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.logo {
  max-width: 250px;
  color: white;
}

.main {
  justify-content: center;
  align-items: center;
}

.title {
  margin-bottom: 0.5rem;
  font-size: 4rem;
}

.text {
  color: #bbbbbb;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.input {
  flex: auto;
  display: block;
  padding: 0.7rem;
  font-size: 3rem;
  width: 100%;
  max-width: 15rem;
  text-align: center;
  background-color: transparent;
  border: 5px solid #222;
  border-bottom: 5px solid white;
  color: white;
  border-radius: 0.5rem;
  outline: none;
  transition: 0.5s ease;
  letter-spacing: 0.25rem;

  &--active, &:focus {
    border-bottom-color: $primary;
  }
}

.input__wrapper {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.button {
  flex: none;
  padding: 1rem;
  border-radius: 1rem;
  border: none;
  cursor: pointer;
  color: white;
  background-color: $primary;
  transition: 0.25s ease;

  display: flex;
  justify-content: center;
  align-items: center;

  overflow: hidden;

  &:disabled {
    background-color: #333;
    cursor: not-allowed;
  }
}

.button-enter-active,
.button-leave-active {
  width: 5rem;
  transform: translateX(0) scale(1);
}

.button-leave-to, .button-enter-from {
  width: 0;
  transform: translateX(-100%) scale(0);
  opacity: 0;
  padding: 0;
}

@media screen and (max-width: 650px) {
  .title {
    font-size: 2.5rem;
  }
  .text {
    font-size: 1rem;
  }

  .input {
    font-size: 2rem;
    max-width: 10rem;
  }
}
</style>