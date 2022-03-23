import { DEBUG } from "@/constants";
import {
    ArrayType,
    Bool,
    ByteArray,
    MapType,
    PacketDefinition,
    Str,
    StructArray,
    UInt32,
    UInt8,
    VarInt
} from "gowsps-js"

// The different possible values for player data packet modes
export enum PlayerDataMode {
    ADD,
    REMOVE,
    SELF
}

// An enum containing different states the client can request
// from the server
export enum States {
    DISCONNECT,
    START,
    SKIP
}

// SERVER PACKETS

export const DisconnectPacket = new PacketDefinition(0x00, {reason: Str}, ['reason'])
export const ErrorPacket = new PacketDefinition(0x01, {cause: Str}, ['cause'])

export const JoinGamePacket = new PacketDefinition(0x02, {
    id: Str,
    owner: Bool,
    title: Str
}, ['id', 'owner', 'title'])

export const NameTakenResultPacket = new PacketDefinition(0x03, {result: Bool}, ['result'])
export const GameStatePacket = new PacketDefinition(0x04, {state: UInt8}, ['state'])

export const PlayerDataPacket = new PacketDefinition(0x04, {
    id: Str,
    name: Str,
    mode: UInt8
}, ['id', 'name', 'mode'])

export const TimeSyncPacket = new PacketDefinition(0x04, {
    total: VarInt,
    remaining: VarInt
}, ['total', 'remaining'])

export const QuestionPacket = new PacketDefinition(0x07, {
    image: ByteArray,
    question: Str,
    answers: ArrayType(Str),
}, ['image', 'question', 'answers'])

export const AnswerResultPacket = new PacketDefinition(0x08, {result: Bool}, ['result'])
export const ScoresPacket = new PacketDefinition(0x09, {scores: MapType(Str, UInt32)}, ['scores'])


// CLIENT PACKETS

export const CreateGamePacket = new PacketDefinition(0x00, {
    title: Str,
    questions: StructArray({
        image: ByteArray,
        question: Str,
        answers: ArrayType(Str),
        values: ArrayType(UInt8)
    }, ['image', 'question', 'answers', 'values'])
}, ['title', 'questions'])

export const CheckNameTakenPacket = new PacketDefinition(0x01, {
    id: Str,
    name: Str
}, ['id', 'name']);

export const RequestGameStatePacket = new PacketDefinition(0x02, {id: Str}, ['id'])

export const RequestJoinPacket = new PacketDefinition(0x03, {
    id: Str,
    name: Str
}, ['id', 'name'])

export const StateChangePacket = new PacketDefinition(0x04, {state: UInt8}, ['state'])
export const AnswerPacket = new PacketDefinition(0x05, {id: UInt32}, ['id'])
export const KickPacket = new PacketDefinition(0x06, {id: Str}, ['id'])