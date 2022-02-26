import { DEBUG, DEBUG_IGNORE_KEEP_ALIVE } from "@/constants";

export interface Packet<V> {
    id: number;
    data?: V;
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

export interface PlayerDataP {
    id: string;
    name: string;
    mode: number;
}

export interface GameStateData {
    state: number
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

type ScoresMap = { [id: string]: number }

export interface ScoresData {
    scores: ScoresMap
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
export function debugLogPacket(dir: Direction, packet: Packet<any>) {
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

export default {
    keepAlive: () => ({id: 0x00}),
    disconnect: () => ({id: 0x01}),
    createGame: (title: string, questions: QuestionData[]) => ({id: 0x02, data: {title, questions}}),
    checkNameTaken: (id: string, name: string) => ({id: 0x03, data: {id, name}}),
    requestGameState: (id: string) => ({id: 0x04, data: {id}}),
    requestJoin: (id: string, name: string) => ({id: 0x05, data: {id, name}}),
    start: () => ({id: 0x06}),
    answer: (id: number) => ({id: 0x07, data: {id}}),
    kick: (id: string) => ({id: 0x08, data: {id}}),
    skip: () => ({id: 0x09})
}