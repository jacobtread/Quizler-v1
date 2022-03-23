import { afterAll, describe, expect, test } from "vitest";
import { Client, GameData, GameState, QuestionDataWithValues } from "@/api";
import {
    CheckNameTakenPacket,
    CreateGamePacket,
    JoinGamePacket,
    NameTakenResultPacket,
    RequestJoinPacket,
} from "@/api/packets";
import { watch } from "vue";
import { expectPacket } from "./tools";

const HOST = 'wss://quizler.jacobtread.com/ws'
let id: string

async function checkConnection(socket: Client) {
    const isOpen = await (new Promise(resolve => {
        const timeout = setTimeout(() => resolve(false), 2000) // Automatically fail if open state doesn't change in 2s
        watch(socket.open, open => {
            clearTimeout(timeout) // Clear the autofill timeout
            resolve(open) // Resolve with the open state
        })
    }))
    expect(isOpen).toBeTruthy() // Expect open
}

let host: Client

describe('Create game', () => {
    host = new Client(HOST)

    // Test checks if the connection to the socket is alive
    test('Connection Open', async () => await checkConnection(host))

    test('Try Create', async () => {

        const TITLE = 'Example Game'
        const QUESTIONS: QuestionDataWithValues[] = [{
            imageType: '',
            image: new Uint8Array(),
            question: 'Example Question',
            answers: ['Example 1', 'Example 2', 'Example 3'],
            values: [0, 2]
        }]

        host.socket.send(CreateGamePacket, {title: TITLE, questions: QUESTIONS}) // Send game create packet
        const gameData: GameData = await expectPacket(host, JoinGamePacket)
        expect(gameData.owner, 'Expected to be game owner').toBeTruthy() // Ensure we are the owner of this game
        expect(gameData.title, 'Expected game title to match').equals(TITLE) // Ensure the titles match
        id = gameData.id
    })
})

describe('Join Game', () => {
    const client = new Client(HOST)

    // Test checks if the connection to the socket is alive
    test('Connection Open', async () => await checkConnection(client))

    test('Try Join', async () => {
        const NAME = 'Player'

        client.socket.send(CheckNameTakenPacket, {id, name: NAME}) // Send game create packet
        const {result} = await expectPacket(client, NameTakenResultPacket)
        expect(result, 'Expect name to not be taken').toBeFalsy() // Name shouldn't be already taken

        client.socket.send(RequestJoinPacket, {id, name: NAME})

        const isWaiting = await (new Promise(resolve => {
            const timeout = setTimeout(() => resolve(false), 2000) // Automatically fail if open state doesn't change in 2s
            watch(client.gameState, state => {
                clearTimeout(timeout) // Clear the autofill timeout
                resolve(state === GameState.WAITING) // Resolve with the open state
            })
        }))
        expect(isWaiting, 'Expect game to be in waiting state').toBeTruthy() // Expect game state to be waiting
    })

    afterAll(() => {
        host.disconnect()
        client.disconnect()
    })
})