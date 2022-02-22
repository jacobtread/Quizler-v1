<script setup lang="ts">

import { useApi } from "@/api";
import { useGameStore } from "@store/game";
import { useRouter } from "vue-router";
import Nav from "@component/Nav.vue"

const {socket, players} = useApi()

const store = useGameStore()
const router = useRouter()

if (store.joined) {

} else {
  router.push({name: 'Home'})
}

function destroyGame() {
  if (store.joined) {
    socket.disconnect()
  }
}

</script>
<template>
  <div>
    <Nav title="Waiting Room" :back-function="destroyGame"/>
    <div class="wrapper">
      <h1>Waiting to start</h1>
      <h2 class="code">{{ store.data.id }}</h2>
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

.code {
  color: $primary;
  font-weight: bold;
}
</style>