import { DEBUG, DEBUG_IGNORE_KEEP_ALIVE } from "@/constants";
import { GameState } from "@api/index";

export interface Packet {
    id: number;
    data?: any;
}

export interface ErrorData {
    cause: string;
}

export interface DisconnectData {
    reason: string;
}

export interface GameData {
    owner: boolean;
    id: string;
    title: string;
}

export interface PlayerData {
    id: string;
    name: string;
    score?: number;
}

export type PlayerDataWithMode = PlayerData & { mode: number }

export enum PlayerDataMode {
    ADD,
    REMOVE
}

export interface GameStateData {
    state: GameState
}

export interface QuestionData {
    image?: string;
    question: string;
    answers: string[];
    values?: number[];
}

export interface NameTakenResultData {
    result: boolean;
}

export interface Game {
    title: string;
    questions: QuestionData[];
    players: PlayerData[];
}

export interface TimeSyncData {
    total: number;
    remaining: number;
}

export interface AnswerResultData {
    result: boolean;
}

export interface ScoresData {
    scores: Record<string, number>
}

// Represents the direction a packet is travelling to IN = inbounds packets OUT = outbound packets
export enum Direction {
    IN,
    OUT
}

// Stores the debug names for each packet
const debugNames = getDebugPacketNames()

/**
 * Debug logs information about the provided packet
 *
 * @param dir The direction the packet is going IN for inbound OUT for outbound
 * @param packet The packet to print debug info about
 */
export function debugLogPacket(dir: Direction, packet: Packet) {
    if (!DEBUG) return
    const id = packet.id
    if (DEBUG_IGNORE_KEEP_ALIVE && id === 0x00) {
        return
    }
    let name = debugNames[dir][id] // Retrieve debug friendly packet name
    if (!name) name = 'Unknown Name'
    let dirName = dir == 0 ? '<-' : '->'

    if (packet.data !== undefined) {
        const dataString = JSON.stringify(packet.data)
        console.debug(`[${dirName}] ${name} (${toHex(id, 2)}) ${dataString}`)
    } else {
        console.debug(`[${dirName}] ${name} (${toHex(id, 2)})`)
    }
}


/**
 * Converts the provided value to a hex string representation
 * that must fit the length provided in padding
 *
 * @param value The number value to convert to hex
 * @param padding The amount of places to pad the value to
 */
function toHex(value: number, padding: number = 2) {
    let hexString = value.toString(16)
    while (hexString.length < padding) {
        hexString = '0' + hexString
    }
    return '0x' + hexString
}

/**
 * Creates a list of packet names for debugging purposes. Will create
 * an empty list if the app is not in debug mode in order to save memory
 */
export function getDebugPacketNames(): Array<Record<number, string>> {
    if (!DEBUG) return [{}, {}]
    return [
        {
            0x00: 'KEEP_ALIVE',
            0x01: 'DISCONNECT',
            0x02: 'ERROR',
            0x03: 'JOINED_GAME',
            0x04: 'NAME_TAKEN_RESULT',
            0x05: 'GAME_STATE',
            0x06: 'PLAYER_DATA',
            0x07: 'TIME_SYNC',
            0x08: 'QUESTION',
            0x09: 'ANSWER_RESULT',
            0x0A: 'SCORES',
            0x0B: 'GAME_OVER'
        },
        {
            0x00: 'KEEP_ALIVE',
            0x01: 'DISCONNECT',
            0x02: 'CREATE_GAME',
            0x03: 'CHECK_NAME_TAKEN',
            0x04: 'REQUEST_GAME_STATE',
            0x05: 'REQUEST_JOIN',
            0x06: 'START',
            0x07: 'ANSWER',
            0x08: 'KICK',
            0x09: 'SKIP'
        }
    ]
}

/**
 * Object contains a mix of constructors for packets that have changing
 * values and normal packet objects for those that only have ID's
 */
const constructors = {
    // Tells the server this client is still alive
    keepAlive: {id: 0x00},
    // Disconnects from the current game
    disconnect: {id: 0x01},
    /**
     * Creates a new game server with the provided title and
     * questions
     *
     * @param title The new game title
     * @param questions The questions for the game
     */
    createGame: (title: string, questions: QuestionData[]) => ({id: 0x02, data: {title, questions}}),
    /**
     * Checks if the provided name is already in use
     *
     * @param id The id of the game to check
     * @param name The name to check for
     */
    checkNameTaken: (id: string, name: string) => ({id: 0x03, data: {id, name}}),
    /**
     * Requests the game with the provided id for its
     * current state (This is sent back in a game state packet)
     *
     * @param id The id of the game to request the state of
     */
    requestGameState: (id: string) => ({id: 0x04, data: {id}}),
    /**
     * Requests permission to join the game with the provided
     * id as the provided name
     *
     * @param id The id of the game to request to join
     * @param name The name of the player to play as
     */
    requestJoin: (id: string, name: string) => ({id: 0x05, data: {id, name}}),
    // Starts the current game (host only)
    start: {id: 0x06},
    /**
     * Tells the server which answer this player would like
     * to select
     *
     * @param id The index of the answer to choose
     */
    answer: (id: number) => ({id: 0x07, data: {id}}),
    /**
     * Kicks the player with the provided id from the game
     * this will only work if the player sending it is the
     * host
     *
     * @param id The id of the player to remove
     */
    kick: (id: string) => ({id: 0x08, data: {id}}),
    // Skips the current question (host only)
    skip: {id: 0x09}
}

export default constructors