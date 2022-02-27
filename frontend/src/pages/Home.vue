<script setup lang="ts">
import Play from "@asset/play.svg?inline";
import Logo from "@asset/logo.svg?inline";
import Create from "@asset/create.svg?inline";
import { useSocket } from "@/api";

const socket = useSocket() // Use the socket
// Reset the state (state should always rest when home page is reached)
socket.resetState();

</script>
<template>
    <div>
        <main class="main">
            <Logo class="logo"/>
            <div class="button-grid">
                <router-link :to="{name: 'Join'}" class="button">
                    <Play class="button__icon"/>
                    <span class="button__wrap">Join a quiz<span class="button__subtext">Enter a game code and hop right in</span></span>
                </router-link>
                <router-link :to="{name: 'Create'}" class="button">
                    <Create class="button__icon"/>
                    <span class="button__wrap">Create a quiz<span
                            class="button__subtext">Create your own quiz</span></span>
                </router-link>
            </div>
        </main>
    </div>
</template>
<style scoped lang="scss">
@import "../assets/variables";

.main {
  flex: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: row nowrap;
  gap: 3rem;
}


@media screen and (max-width: 840px) {
  .main {
    flex-flow: row wrap;
    justify-content: center;
    align-content: center;
    padding: 1rem;
  }
}


.logo {
  padding: 1rem;
  flex: auto;
  max-width: 250px;
  color: white;
}

.button-grid {
  flex: auto;

  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.button {
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-flow: row;
  background: #222;
  text-decoration: none;

  text-align: left;
  padding: 1rem;

  width: 100%;
  max-width: 500px;

  border-radius: 2rem;

  color: white;
  font-size: 1.4rem;
  overflow: hidden;

  border: 5px solid #222;


  transition: background-color 0.5s ease, color 0.2s linear;

  &__icon {
    color: white;
    position: relative;
    border-radius: 1.5rem;
    padding: 1rem;
    box-sizing: content-box;
    transition: background-color 0.5s ease, color 0.2s linear;
    background-color: #333;
  }

  &::before {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    content: '';
    background: $primary;
    border-radius: 1.5rem;
    transform: translateX(-100%);
    transition: 0.5s ease;
    z-index: -1;
  }

  &:hover {
    background: rgba(34, 34, 34, 0.62);

    .button__icon {
      background-color: $primary;
    }

    &::before {
      transform: translateX(0);
    }
  }

  &__subtext {
    display: block;
    color: #CCCCCC;

    margin-top: 0.5rem;
    font-size: 1.1rem;
  }
}

@media screen and (max-width: 440px) {
  .button-grid {
    flex-flow: column;

  }

  .button {
    flex-flow: column;
    align-items: flex-start;

    &__icon {
      width: 100%;
      padding: 1rem 0;
    }
  }
}

@media screen and (max-width: 250px) {
  .button {
    align-items: center;
    text-align: center;
    font-size: 1.2rem;

    &__icon {
      padding: 0.5rem 0;
      height: 32px;
    }

    &__subtext {
      font-size: 1rem;
    }
  }
}

@media screen and (max-width: 200px) {
  .button {

    &__icon {
      padding: 1rem 0;

    }

    &__wrap {
      display: none;
    }
  }
}
</style>