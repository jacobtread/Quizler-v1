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

export interface CreateData {
    title: string;
    questions: QuestionData[];
}

export interface JoinGameData {
    id: string;
}

export interface QuestionData {
    title: string;
    question: string;
    answers: string[];
    answer: number
}

export interface Player {
    id: number;
    name: string;
    score: number;
}

export interface Game {
    title: string;
    questions: QuestionData[];
    players: Player[];
}

export type UnknownPacket = Packet<any>;
export type ErrorPacket = Packet<ErrorData>;
export type DisconnectPacket = Packet<DisconnectData>;
export type KeepAlivePacket = Packet<undefined>;
export type CreateGamePacket = Packet<CreateData>;


type Names = { [key: number]: string }

export default {
    // A map of packet id's to readable names for debugging
    names: {
        0x00: 'Unknown',
        0x01: 'KeepAlive',
        0x02: 'Disconnect',
        0x03: 'Error',
        0x04: 'Create Game'
    } as Names,
    unknown: (): UnknownPacket => ({id: 0x00}),
    keepAlive: (): KeepAlivePacket => ({id: 0x01}),
    disconnect: (reason: string): DisconnectPacket => ({id: 0x02, data: {reason}}),
    error: (cause: string): ErrorPacket => ({id: 0x03, data: {cause}}),
    createGame: (title: string, questions: QuestionData[]): CreateGamePacket => ({id: 0x04, data: {title, questions}})
}