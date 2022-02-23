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


export interface JoinGameData {
    owner: boolean;
    id: string;
    title: string;
}

export interface PlayerData {
    id: string;
    name: string;
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
    values: number[];
}

export interface NameTakenResultData {
    result: boolean;
}

export interface Player {
    id: number;
    name: string;
    score: number;
}

export interface Game {
    title: string;
    questions: QuestionData[];
    players: PlayerData[];
}


type Names = { [key: number]: string }

export default {
    // A map of packet id's to readable names for debugging
    names: [
        {
            0x00: 'KEEP_ALIVE',
            0x01: 'DISCONNECT',
            0x02: 'ERROR',
            0x03: 'JOINED_GAME',
            0x04: 'NAME_TAKEN_RESULT',
            0x05: 'GAME_STATE',
            0x06: 'PLAYER_DATA',
            0x07: 'QUESTION',
            0x08: 'TIME_SYNC',
            0x09: 'GAME_OVER'
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
            0x08: 'KICK'
        }
    ] as Names[],
    keepAlive: () => ({id: 0x00}),
    disconnect: () => ({id: 0x01}),
    createGame: (title: string, questions: QuestionData[]) => ({id: 0x02, data: {title, questions}}),
    checkNameTaken: (id: string, name: string) => ({id: 0x03, data: {id, name}}),
    requestGameState: (id: string) => ({id: 0x04, data: {id}}),
    requestJoin: (id: string, name: string) => ({id: 0x05, data: {id, name}}),
    start: () => ({id: 0x06}),
    answer: (id: number) => ({id: 0x07, data: {id}}),
    kick: (id: string) => ({id: 0x08, data: {id}})
}