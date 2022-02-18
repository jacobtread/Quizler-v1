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

export interface GameStateData {
    state: number
}

export interface QuestionData {
    title: string;
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
    names: {
        0x00: 'Unknown',
        0x01: 'KeepAlive',
        0x02: 'Disconnect',
        0x03: 'Error',
        0x04: 'Create Game',
        0x05: 'Request Join',
        0x06: 'Join Game',
        0x0E: 'Destroy',
        0x0F: 'Request Game State',
        0x10: 'Check name taken',
        0x11: 'Name taken result'
    } as Names,
    unknown: () => ({id: 0x00}),
    keepAlive: () => ({id: 0x01}),
    disconnect: (reason: string) => ({id: 0x02, data: {reason}}),
    error: (cause: string) => ({id: 0x03, data: {cause}}),
    createGame: (title: string, questions: QuestionData[]) => ({id: 0x04, data: {title, questions}}),
    requestJoin: (id: string, name: string) => ({id: 0x05, data: {id, name}}),
    destroy: () => ({id: 0x0E}),
    requestGameState: (id: string) => ({id: 0x0F, data: {id}}),
    checkNameTaken: (id: string, name: string) => ({id: 0x10, data: {id, name}})
}