import { DEBUG } from "@/constants";
import { GameState } from "@api/index";

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
    score: number;
}

export type PlayerDataWithMode = PlayerData & { mode: PlayerDataMode }

// The different possible values for player data packet modes
export enum PlayerDataMode {
    ADD,
    REMOVE,
    SELF
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

// Packet ids can be either client or server packet ids
type PacketId = number | CPID | SPID

export interface Packet {
    id: PacketId;
    data?: any;
}

// Represents the direction a packet is travelling to IN = inbounds packets OUT = outbound packets
export enum Direction {
    IN,
    OUT
}

/**
 * Debug logs information about the provided packet
 *
 * @param dir The direction the packet is going IN for inbound OUT for outbound
 * @param packet The packet to print debug info about
 */
export function debugLogPacket(dir: Direction, packet: Packet) {
    if (!DEBUG) return // Ignore this function if DEBUG is disabled
    const id: PacketId = packet.id
    let name: string = (dir === Direction.IN ? SPID[id] : CPID[id]) ?? 'UNKNOWN';
    let dirName = dir == 0 ? '<-' : '->' // Direction pointing arrow
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

// An enum containing all the id's for each incoming packet
export enum SPID {
    DISCONNECT = 0x00,
    ERROR,
    JOIN_GAME,
    NAME_TAKEN_RESULT,
    GAME_STATE,
    PLAYER_DATA,
    TIME_SYNC,
    QUESTION,
    ANSWER_RESULT,
    SCORES
}


// An enum containing all the id's for each outgoing packet
export enum CPID {
    CREATE_GAME = 0x00,
    CHECK_NAME_TAKEN,
    REQUEST_GAME_STATE,
    REQUEST_JOIN,
    STATE_CHANGE,
    ANSWER,
    KICK,
}

// An enum containing different states the client can request
// from the server
export enum States {
    DISCONNECT,
    START,
    SKIP
}

/**
 * Object contains a mix of constructors for packets that have changing
 * values and normal packet objects for those that only have ID's
 */
const constructors = {
    /**
     * Creates a new game server with the provided title and
     * questions
     *
     * @param title The new game title
     * @param questions The questions for the game
     */
    createGame: (title: string, questions: QuestionData[]) => ({id: CPID.CREATE_GAME, data: {title, questions}}),
    /**
     * Checks if the provided name is already in use
     *
     * @param id The id of the game to check
     * @param name The name to check for
     */
    checkNameTaken: (id: string, name: string) => ({id: CPID.CHECK_NAME_TAKEN, data: {id, name}}),
    /**
     * Requests the game with the provided id for its
     * current state (This is sent back in a game state packet)
     *
     * @param id The id of the game to request the state of
     */
    requestGameState: (id: string) => ({id: CPID.REQUEST_GAME_STATE, data: {id}}),
    /**
     * Requests permission to join the game with the provided
     * id as the provided name
     *
     * @param id The id of the game to request to join
     * @param name The name of the player to play as
     */
    requestJoin: (id: string, name: string) => ({id: CPID.REQUEST_JOIN, data: {id, name}}),
    /**
     * Requests the server to change a specific game state
     *
     * @see States
     * @param state The state to change to
     */
    stateChange: (state: States) => ({id: CPID.STATE_CHANGE, data: {state}}),
    /**
     * Tells the server which answer this player would like
     * to select
     *
     * @param id The index of the answer to choose
     */
    answer: (id: number) => ({id: CPID.ANSWER, data: {id}}),
    /**
     * Kicks the player with the provided id from the game
     * this will only work if the player sending it is the
     * host
     *
     * @param id The id of the player to remove
     */
    kick: (id: string) => ({id: CPID.KICK, data: {id}}),
}

export default constructors