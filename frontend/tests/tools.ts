import { SPID } from "src/api/packets";
import { SocketApi } from "src/api";

/**
 * Expect a packet from the server returns null if no packet within timeout
 *
 * @param socket The socket connection
 * @param id The id of the packet to expect
 * @param timeout The timeout to wait before failing
 */
export async function expectPacket<T extends any>(socket: SocketApi, id: SPID, timeout: number = 1000): Promise<T> {
    const oldHandler = socket.handlers[id]
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => {
            socket.handlers[id] = oldHandler
            reject(`Didn't receive packet of id ${id}`)
        }, timeout)
        socket.handlers[id] = function (data: T) {
            clearTimeout(t)
            socket.handlers[id] = oldHandler
            resolve(data)
        }
    })
}