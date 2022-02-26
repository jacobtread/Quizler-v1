<script setup lang="ts">
import { ref, watch } from "vue";
import Play from "@asset/play.svg?inline";
import { GameState, ServerPacketId, usePacketHandler, useSocket } from "@/api";
import packets, { GameData, NameTakenResultData } from "@api/packets";
import { useRouter } from "vue-router";
import Nav from "@component/Nav.vue";
import { dialog } from "@/tools/ui";

const router = useRouter()
const socket = useSocket()
const {gameData, gameState} = socket


let gameCode = ref('')
let disabled = ref(true)
const name = ref('')
const hasGame = ref(false)
const searching = ref(false)


watch(gameCode, (code: string) => {
    const value = code.replace(/[^a-fA-F0-9]/, '')
    gameCode.value = value
    disabled.value = value.length != 5
})

watch(gameData, (data: GameData | null) => {
    if (data != null) {
        // Redirect to the overview page
        router.push({name: 'Overview'})
    }
})

watch(gameState, (data: GameState) => {
    if (data === GameState.WAITING) {
        hasGame.value = true
    } else if (data === GameState.DOES_NOT_EXIST) {
        dialog('Invalid code', 'The quiz code you entered doesn\'t seem to exist.')
        gameState.value = GameState.UNSET
    } else if (data === GameState.STARTED || data === GameState.STOPPED) {
        const reason = data === GameState.STARTED ? 'started' : 'finished'
        dialog('Cannot Join', `That game has already ${reason} you are unable to join it now.`)
    }
    searching.value = false
})

function checkGameExists() {
    searching.value = true
    hasGame.value = false
    const code = gameCode.value
    socket.send(packets.requestGameState(code))
}

function onNameTakenResult(data: NameTakenResultData) {
    if (data.result) {
        dialog('Name taken', 'That name is already in use. Please choose another')
    } else {
        socket.send(packets.requestJoin(gameCode.value, name.value))
    }
}

function joinGame() {
    const code = gameCode.value
    socket.send(packets.checkNameTaken(code, name.value))
}

usePacketHandler(socket, ServerPacketId.NAME_TAKEN_RESULT, onNameTakenResult)
</script>

<template>
    <div class="content">
        <Nav title="Join"/>
        <div class="wrapper main">
            <template v-if="searching">
                <h1>Checking if game exists</h1>
            </template>
            <template v-else>
                <template v-if="hasGame">
                    <h1 class="title">Enter Name</h1>
                    <p class="text">Please you name for the game</p>
                    <form class="input__wrapper" @submit.prevent="joinGame">
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

</style>