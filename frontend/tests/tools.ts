/**
 * Expect a packet from the server returns null if no packet within timeout
 *
 * @param socket The socket connection
 * @param id The id of the packet to expect
 * @param timeout The timeout to wait before failing
 */
import { StructLayout, StructTyped } from "gowsps-js/dist/data";
import { Client } from "src/api";
import { PacketDefinition } from "gowsps-js";

export async function expectPacket<T extends StructLayout>(client: Client, definition: PacketDefinition<T>, timeout: number = 1000): Promise<StructTyped<T>> {
    return new Promise((resolve, reject) => {
        function receiver(data: StructTyped<T>) {
            clearTimeout(t);
            client.socket.removeListener(definition, receiver);
            resolve(data);
        }

        const t = setTimeout(() => {
            client.socket.removeListener(definition, receiver);
            reject(`Didn't receive packet of id ${definition.id}`);
        }, timeout);
        client.socket.addListener(definition, receiver);
    })
}