import { afterAll, describe, expect, test } from "vitest";
import { GameState, SocketApi } from "@/api";
import packets, { GameData, NameTakenResultData, QuestionData, SPID } from "@/api/packets";
import { watch } from "vue";
import { expectPacket } from "./tools";

const HOST = 'wss://quizler.jacobtread.com/ws'
let id: string

async function checkConnection(socket: SocketApi) {
    const isOpen = await (new Promise(resolve => {
        const timeout = setTimeout(() => resolve(false), 2000) // Automatically fail if open state doesn't change in 2s
        watch(socket.open, open => {
            clearTimeout(timeout) // Clear the autofill timeout
            resolve(open) // Resolve with the open state
        })
    }))
    expect(isOpen).toBeTruthy() // Expect open
}

let host: SocketApi

describe('Create game', () => {
    host = new SocketApi(HOST)

    // Test checks if the connection to the socket is alive
    test('Connection Open', async () => await checkConnection(host))

    test('Try Create', async () => {

        const TITLE = 'Example Game'
        const QUESTIONS: QuestionData[] = [{
            question: 'Example Question',
            answers: ['Example 1', 'Example 2', 'Example 3'],
            values: [0, 2]
        }]

        host.send(packets.createGame(TITLE, QUESTIONS)) // Send game create packet
        const gameData: GameData = await expectPacket<GameData>(host, SPID.JOIN_GAME)
        expect(gameData.owner, 'Expected to be game owner').toBeTruthy() // Ensure we are the owner of this game
        expect(gameData.title, 'Expected game title to match').equals(TITLE) // Ensure the titles match
        id = gameData.id
    })
})

describe('Join Game', () => {
    const socket = new SocketApi(HOST)

    // Test checks if the connection to the socket is alive
    test('Connection Open', async () => await checkConnection(socket))

    test('Try Join', async () => {
        const NAME = 'Player'

        socket.send(packets.checkNameTaken(id, NAME)) // Send game create packet
        const nameTakenResult: NameTakenResultData = await expectPacket<NameTakenResultData>(socket, SPID.NAME_TAKEN_RESULT)
        expect(nameTakenResult.result, 'Expect name to not be taken').toBeFalsy() // Name shouldn't be already taken

        socket.send(packets.requestJoin(id, NAME))

        const isWaiting = await (new Promise(resolve => {
            const timeout = setTimeout(() => resolve(false), 2000) // Automatically fail if open state doesn't change in 2s
            watch(socket.gameState, state => {
                clearTimeout(timeout) // Clear the autofill timeout
                resolve(state === GameState.WAITING) // Resolve with the open state
            })
        }))
        expect(isWaiting, 'Expect game to be in waiting state').toBeTruthy() // Expect game state to be waiting
    })

    afterAll(() => {
        host.disconnect()
        socket.disconnect()
    })
})