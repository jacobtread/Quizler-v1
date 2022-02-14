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

export type UnknownPacket = Packet<any>;
export type ErrorPacket = Packet<ErrorData>;
export type DisconnectPacket = Packet<DisconnectData>;
export type KeepAlivePacket = Packet<undefined>;


type Names = { [key: number]: string}

export default {
    // A map of packet id's to readable names for debugging
    names: {
        0x00: 'Unknown',
        0x01: 'KeepAlive',
        0x02: 'Disconnect',
        0x03: 'Error'
    } as Names,
    unknown: (): UnknownPacket => ({id: 0x00}),
    keepAlive: (): KeepAlivePacket => ({id: 0x01}),
    disconnect: (reason: string): DisconnectPacket => ({id: 0x02, data: {reason}}),
    error: (cause: string): ErrorPacket => ({id: 0x03, data: {cause}})
}