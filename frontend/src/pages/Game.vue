<script setup lang="ts">
import { QuestionData, useClient, usePacketHandler, useRequireGame, useSyncedTimer } from "@/api";
import { computed, ref, watch } from "vue";
import { AnswerPacket, AnswerResultPacket } from "@api/packets";
import Logo from "@asset/icons/logo.svg?inline"
import { loading } from "@/tools/ui";
import { arrayToDataUrl } from "@/tools/binary";

const client = useClient(), {gameData, question, players} = client; // Use the socket
// A sorted version of the player list which is sorted based on player score (only takes the first 5 players)
const sortedPlayers = computed(() => Object.values(players).sort((a, b) => b.score - a.score).slice(0, 5));
// A reactive reference to whether the player has answered the question
const answered = ref(false);
// A reactive reference to whether the player answer was correct
const result = ref<boolean | null>(null);

// Create a synced timer with the default time of 10 seconds
const syncedTime = useSyncedTimer(client, 10);

useRequireGame(client); // Require an active game

// Watch for changes to the question
watch(question, (data: QuestionData | null) => {
    answered.value = false; // Set the answered value to false
    result.value = null; // Clear the result
    loading(data === null); // If the there's no question show the loader
    syncedTime.value = 10;
    if (data !== null && !data.imageBase64) {
        question.value!!.imageBase64 = arrayToDataUrl(
            data.imageType,
            data.image
        );
    }
}, {immediate: true});

/**
 * Sets the player answer the answer at the provided index.
 * Sets answered to true and sends an answer packet to the
 * server with the provided index
 *
 * @param index The index of the chosen answer
 */
function setAnswer(index: number) {
    answered.value = true;
    client.socket.send(AnswerPacket, {id: index});
}

/**
 * Creates a new packet handler to handle the Answer Result packets
 * and update the result value accordingly
 */
usePacketHandler(client, AnswerResultPacket, data => {
    result.value = data.result;
});

/**
 * Calculates an appropriate font size for the answer value based on how
 * long the text is compared to 100chars
 *
 * @param text The text to get the length of
 */
function getFontSize(text: string): string {
    const fitLength = 100;
    if (text.length > fitLength) return '0.7rem';
    const percent = (1 - (text.length / fitLength));
    const size = (percent * 0.8) + 0.7;
    return `${size}rem`;
}

/**
 * Retrieves a random comment string based on the result
 * that the user got from answering the question
 */
function getRandomText(): string {
    let texts: string[];
    if (result.value === null) {
        texts = ['Hmm I wonder if you got it right....', 'It definitely had to be that one!', 'Yeah it was probably that one...', '0_0 good luck i guess..'];
    } else if (result.value) {
        texts = ['You did it!', 'That one was right!', 'Good job!', 'Yup that was it!'];
    } else {
        texts = ['Ooops..', 'Yeah not that one...', 'Better luck next time', 'Noooo your other left'];
    }
    const index = Math.floor(Math.random() * texts.length);
    return texts[index];
}
</script>
<template>
    <div class="content">
        <Transition name="slide-fade" mode="out-in">
            <div v-if="question==null"></div>
            <div v-else-if="result !== null" class="result" :class="{'result--correct': result}">
                <template v-if="result">
                    <h1 class="result__text">Correct Answer!</h1>
                </template>
                <template v-else>
                    <h1 class="result__text">Incorrect Answer</h1>
                </template>
                <p class="result__subtext">{{ getRandomText() }}</p>
                <ul class="players">
                    <li class="player" v-for="player of sortedPlayers" :key="player.id">
                        <span class="player__name">{{ player.name }}</span>
                        <span class="player__score">{{ player.score }}</span>
                    </li>
                </ul>
            </div>
            <div v-else-if="!answered" class="wrapper question">
                <header class="header">
                    <h1 class="title">{{ gameData?.title }}</h1>
                    <span class="time">{{ syncedTime.toFixed(0) }}s</span>
                </header>
                <div class="image-wrapper">
                    <div
                            v-if="question.imageBase64"
                            class="image"
                            :style="{backgroundImage: `url(${question.imageBase64})`}"
                    ></div>
                    <div v-else>
                        <Logo class="logo"/>
                    </div>
                </div>
                <p class="question__text">{{ question.question }}</p>
                <div class="answers">
                    <button v-for="(answer, index) in question.answers"
                            @click="setAnswer(index)"
                            :style="{fontSize: getFontSize(answer)}"
                            class="answer">
                        {{ answer }}
                    </button>
                </div>
            </div>
            <div v-else-if="answered" class="waiting">
                <h1 class="waiting__title">Waiting...</h1>
                <p class="waiting__text">{{ getRandomText() }}</p>
            </div>
        </Transition>
    </div>
</template>
<style scoped lang="scss">
@import "../assets/variables";

.waiting {
  flex: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: column;

  background: linear-gradient(to bottom right, $primary, $secondary);
  width: 100%;

  &__title {
    margin-bottom: 1rem;
    font-size: 3rem;
    text-shadow: 0 4px 0 darken($secondary, 10);

  }

  &__text {
    margin-bottom: 1rem;
    font-size: 1.25rem;
    color: #DDD;
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 0.25rem;
    padding: 0.5rem;
  }
}

.result {
  flex: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  background: linear-gradient(to bottom right, #f35f5f, #933030);
  flex-flow: column;

  &__text {
    margin-bottom: 1rem;
    font-size: 3rem;
    text-shadow: 0 4px 0 #933030;
  }

  &__subtext {
    margin-bottom: 1rem;
    font-size: 1.25rem;
    color: #DDD;
    text-shadow: 0 2px 0 #a83939;
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 0.25rem;
    padding: 0.5rem;
  }

  &--correct {
    background: linear-gradient(to bottom right, #80ff80, #359235);

    .result__text {
      text-shadow: 0 4px 0 #359235;
    }

    .result__subtext {
      text-shadow: 0 2px 0 #5b8e5b;
    }
  }
}

.players {
  list-style: none;
  width: 100%;
  max-width: 400px;
}

.player {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  background-color: rgba(0, 0, 0, 0.25);
  border-radius: 0.25rem;
  font-size: 1.3rem;
  align-items: center;
  width: 100%;
  justify-content: space-between;

  &__name {
    flex: auto;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__score {
    color: white;
    font-weight: bold;
    padding: 0.5rem;
    background-color: rgba(0, 0, 0, 0.25);

  }
}

.answers {
  display: flex;
  flex-flow: row wrap;
  gap: 0.5rem;
  width: 100%;
}

.answer {
  flex: auto;
  width: calc(50% - 1rem);
  padding: 1rem;
  border: none;
  text-align: left;
  background-color: #222;
  border-radius: 0.25rem;
  color: white;
  font-size: 1.1rem;
  white-space: pre-wrap;
  line-break: loose;
  text-overflow: ellipsis;
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.2s linear;

  &:hover {
    background: adjust-color($primary, $alpha: -0.5);
  }
}

.image-wrapper {
  flex: auto;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image {
  width: 100%;
  height: 100%;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.question {
  max-width: 1200px;
  padding: 1.5rem;
  width: 100%;
}

.question__text {
  width: 100%;
  font-size: 1.25rem;
  background-color: #333;
  padding: 1rem;
}

.logo {
  max-width: 240px;
  width: 100%;
  flex: auto;

}

.title {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>